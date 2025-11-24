import { tavily } from '@tavily/core';
import OpenAI from 'openai';
import NodeGeocoder from 'node-geocoder';

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const geocoder = NodeGeocoder({
    provider: 'openstreetmap',
    email: 'disasterscout_demo@example.com', // Required by Nominatim
    headers: { 'User-Agent': 'DisasterScout/1.0' }
} as any);

export async function fetchNews(region: string, topic: string) {
    const query = `${topic} in ${region}. Focus on local flooding, shelters, SOS, evacuations, closures, and critical impacts.`;
    console.log(`Searching Tavily for: ${query}`);
    const response = await tvly.search(query, {
        searchDepth: "advanced",
        maxResults: 5,
        // We will use the extract endpoint separately as requested
    });
    return response.results;
}

export async function extractContent(urls: string[]) {
    if (urls.length === 0) return [];
    console.log(`Extracting content for ${urls.length} URLs...`);
    try {
        const response = await fetch("https://api.tavily.com/extract", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                api_key: process.env.TAVILY_API_KEY,
                urls: urls
            })
        });

        if (!response.ok) {
            console.error(`Tavily Extract failed: ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        return data.results || [];
    } catch (e) {
        console.error("Extract failed", e);
        return [];
    }
}

export async function classifyAndExtract(content: string, region: string) {
    const prompt = `
    Analyze the following news content related to ${region}.
    Determine if this is a relevant disaster/emergency/incident for this region.
    
    Classify into one of these categories:
    - SOS: People in danger, need immediate help, life-threatening.
    - SHELTER: Locations of shelters, aid centers, resources.
    - INFO: General updates, closures, advisories, weather warnings, minor disruptions.
    - OTHER: Not relevant or duplicate.

    Extract the following structured data in JSON format:
    - is_relevant: boolean (true if it matches SOS, SHELTER, or INFO for the region)
    - category: string (SOS, SHELTER, INFO, or OTHER)
    - description: string (concise summary of the situation, max 2 sentences)
    - location_name: string (specific location mentioned like "Bay Ridge", "Nha Trang", or the region itself if general)
    
    Content:
    ${content.substring(0, 5000)}
  `;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0].message.content || "{}");
        return result;
    } catch (e) {
        console.error("LLM classification failed", e);
        return { is_relevant: false };
    }
}

export async function geocodeLocation(name: string, regionFallback?: string): Promise<[number, number] | null> {
    try {
        // Try specific location first
        let res = await geocoder.geocode(name);
        if (res && res.length > 0 && res[0].longitude && res[0].latitude) {
            return [res[0].longitude, res[0].latitude];
        }

        // Fallback to region
        if (regionFallback && name !== regionFallback) {
            console.log(`Geocoding failed for ${name}, falling back to ${regionFallback}`);
            res = await geocoder.geocode(regionFallback);
            if (res && res.length > 0 && res[0].longitude && res[0].latitude) {
                return [res[0].longitude, res[0].latitude];
            }
        }
        return null;
    } catch (error) {
        console.error(`Geocoding failed for ${name}:`, error);
        return null;
    }
}

export async function generateBrief(region: string, topic: string, stats: any) {
    const prompt = `
    Generate a concise, professional situation brief for ${region} regarding ${topic}.
    
    Incident Stats:
    ${JSON.stringify(stats, null, 2)}
    
    Instructions:
    - Start with a high-level summary of the situation (1-2 paragraphs).
    - If there are SOS incidents, highlight them urgently.
    - If there are SHELTERs, mention them.
    - If mostly INFO/0 incidents, state clearly that there is no major active crisis detected but advise caution.
    - Provide 3 bullet points of safety advice.
    - Format as markdown.
  `;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        });

        return completion.choices[0].message.content;
    } catch (e) {
        console.error("Brief generation failed", e);
        return "Unable to generate brief.";
    }
}
