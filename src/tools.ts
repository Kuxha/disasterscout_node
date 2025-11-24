import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generateBrief } from "./llm.js";
import { getIncidentsCollection } from "./db.js";

import { performScan } from "./actions.js";

export function registerTools(server: McpServer) {

    server.tool(
        "scan_region",
        "Scan a region for latest crisis news, classify, and store in DB.",
        {
            region: z.string().describe("The region to scan (e.g., 'California', 'Kyoto')"),
            topic: z.string().describe("The topic to search for (e.g., 'wildfires', 'earthquake')")
        },
        async ({ region, topic }) => {
            const result = await performScan(region, topic);
            return {
                content: [{
                    type: "text",
                    text: result.message
                }]
            };
        }
    );

    server.tool(
        "list_incidents",
        "List recent incidents in a region.",
        {
            region: z.string().describe("Filter by region name (partial match)"),
            category: z.string().optional().describe("Filter by category (SOS, SHELTER, INFO)"),
            status: z.string().optional().describe("Filter by status"),
            limit: z.number().optional().default(10).describe("Max number of results")
        },
        async ({ region, category, status, limit }) => {
            const collection = getIncidentsCollection();
            const query: any = {
                locationName: { $regex: region, $options: 'i' }
            };
            if (category) {
                query.category = category;
            }
            if (status) {
                query.status = status;
            }

            const incidents = await collection.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .toArray();

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(incidents, null, 2)
                }]
            };
        }
    );

    server.tool(
        "find_nearest_resources",
        "Find nearest resources or incidents to a location.",
        {
            lat: z.number(),
            lon: z.number(),
            category: z.string().optional(),
            max_km: z.number().default(50),
            limit: z.number().optional().default(10)
        },
        async ({ lat, lon, category, max_km, limit }) => {
            const collection = getIncidentsCollection();
            const query: any = {
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [lon, lat]
                        },
                        $maxDistance: max_km * 1000 // meters
                    }
                }
            };

            if (category) {
                query.category = category;
            }

            const results = await collection.find(query).limit(limit).toArray();

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(results, null, 2)
                }]
            };
        }
    );

    server.tool(
        "daily_brief",
        "Generate a daily briefing for a region.",
        {
            region: z.string(),
            topic: z.string()
        },
        async ({ region, topic }) => {
            const collection = getIncidentsCollection();

            // Aggregate stats
            const stats = await collection.aggregate([
                { $match: { locationName: { $regex: region, $options: 'i' } } },
                { $group: { _id: "$category", count: { $sum: 1 } } }
            ]).toArray();

            const brief = await generateBrief(region, topic, stats);

            // Add map link
            // We assume localhost:3000 for local demo
            const mapUrl = `http://localhost:3000/?region=${encodeURIComponent(region)}`;
            const fullResponse = `${brief}\n\nYou can view the incident map here: [DisasterScout Map](${mapUrl})`;

            return {
                content: [{
                    type: "text",
                    text: fullResponse
                }]
            };
        }
    );
}
