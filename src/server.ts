import express from 'express';
import path from 'path';
import { getIncidentsCollection } from './db.js';

export function startWebServer(port: number = 3000) {
    const app = express();

    // Serve static files
    const publicDir = path.join(process.cwd(), 'public');
    app.use(express.static(publicDir));
    app.use(express.json());

    // API to get incidents for the map (GeoJSON)
    app.get('/api/incidents', async (req, res) => {
        try {
            const { region, category, status, limit } = req.query;
            const collection = getIncidentsCollection();
            const query: any = {};

            if (region) {
                // Use regex for partial match on locationName or region field if we had one
                // We stored 'region' in incident, so we can search that too or fallback to locationName
                query.$or = [
                    { region: { $regex: region, $options: 'i' } },
                    { locationName: { $regex: region, $options: 'i' } }
                ];
            }
            if (category) {
                query.category = category;
            }
            if (status) {
                query.status = status;
            }

            const limitVal = parseInt(limit as string) || 100;
            const incidents = await collection.find(query).sort({ createdAt: -1 }).limit(limitVal).toArray();

            // Return GeoJSON FeatureCollection
            const features = incidents.map(inc => ({
                type: "Feature",
                geometry: inc.location,
                properties: {
                    ...inc,
                    _id: inc._id
                }
            }));

            res.json({
                type: "FeatureCollection",
                features: features
            });
        } catch (error) {
            console.error("Error fetching incidents:", error);
            res.status(500).json({ error: "Failed to fetch incidents" });
        }
    });

    // API to get nearby incidents
    app.get('/api/incidents_near', async (req, res) => {
        try {
            const { lat, lon, radius_km, limit, category } = req.query;
            if (!lat || !lon) {
                return res.status(400).json({ error: "lat and lon are required" });
            }

            const collection = getIncidentsCollection();
            const maxDist = (parseFloat(radius_km as string) || 50) * 1000; // meters
            const limitVal = parseInt(limit as string) || 50;

            const query: any = {
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [parseFloat(lon as string), parseFloat(lat as string)]
                        },
                        $maxDistance: maxDist
                    }
                }
            };

            if (category) {
                query.category = category;
            }

            const incidents = await collection.find(query).limit(limitVal).toArray();

            const features = incidents.map(inc => ({
                type: "Feature",
                geometry: inc.location,
                properties: {
                    ...inc,
                    _id: inc._id
                }
            }));

            res.json({
                type: "FeatureCollection",
                features: features
            });
        } catch (error) {
            console.error("Error fetching nearby incidents:", error);
            res.status(500).json({ error: "Failed to fetch nearby incidents" });
        }
    });

    // API to trigger scan and get brief
    app.get('/api/brief', async (req, res) => {
        try {
            const { region, topic } = req.query;
            if (!region || !topic) {
                return res.status(400).json({ error: "region and topic are required" });
            }

            console.log(`Generating brief for ${topic} in ${region}...`);

            // Trigger scan
            const { performScan } = await import('./actions.js');
            await performScan(region as string, topic as string);

            const collection = getIncidentsCollection();
            // Aggregate stats
            // Match either region field or locationName
            const match = {
                $or: [
                    { region: { $regex: region, $options: 'i' } },
                    { locationName: { $regex: region, $options: 'i' } }
                ]
            };

            const stats = await collection.aggregate([
                { $match: match },
                { $group: { _id: "$category", count: { $sum: 1 } } }
            ]).toArray();

            // Generate brief
            const { generateBrief } = await import('./llm.js');
            const summary = await generateBrief(region as string, topic as string, stats);

            const incidentCount = stats.reduce((acc, curr) => acc + curr.count, 0);

            res.json({
                region,
                topic,
                incident_count: incidentCount,
                summary: summary,
                stats: stats
            });

        } catch (error) {
            console.error("Error generating brief:", error);
            res.status(500).json({ error: "Failed to generate brief" });
        }
    });

    // Legacy POST scan endpoint (kept for compatibility if needed)
    app.post('/api/scan', async (req, res) => {
        try {
            const { region, topic } = req.body;
            if (!region || !topic) {
                return res.status(400).json({ error: "Region and topic are required" });
            }
            const { performScan } = await import('./actions.js');
            const result = await performScan(region, topic);
            res.json(result);
        } catch (error) {
            console.error("Error performing scan:", error);
            res.status(500).json({ error: "Scan failed" });
        }
    });

    app.listen(port, () => {
        console.error(`Web UI running on port ${port}`);
    });
}
