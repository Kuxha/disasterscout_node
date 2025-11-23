import { tavily } from '@tavily/core';
import OpenAI from 'openai';
import NodeGeocoder from 'node-geocoder';

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const geocoder = NodeGeocoder({
    provider: 'openstreetmap',
    httpAdapter: 'https', // Default
    headers: { 'User-Agent': 'DisasterScout/1.0 (laba-deka@example.com)' }
} as any);

export async function fetchNews(region: string, topic: string) {
    const query = `Latest news about ${topic} in ${region}`;
    const response = await tvly.search(query, {
        searchDepth: "advanced",
        includeRawContent: true,
        maxResults: 5
    });
    return response.results;
}

export async function classifyAndExtract(content: string, region: string) {
    const prompt = `
    Analyze the following news content related to ${region}.
    Extract the following structured data in JSON format:
    - is_relevant: boolean (true if it's a crisis/disaster/emergency)
    - category: string (SOS, SHELTER, INFO, or OTHER)
    - description: string (concise summary)
    - location_name: string (specific location mentioned, or the region itself)

    Content:
    ${content.substring(0, 2000)}
  `;

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return result;
}

export async function geocodeLocation(name: string): Promise<[number, number] | null> {
    try {
        const res = await geocoder.geocode(name);
        if (res && res.length > 0 && res[0].longitude && res[0].latitude) {
            return [res[0].longitude, res[0].latitude];
        }
        return null;
    } catch (error) {
        console.error(`Geocoding failed for ${name}:`, error);
        return null;
    }
}

export async function generateBrief(region: string, topic: string, stats: any) {
    const prompt = `
    Generate a concise, professional daily briefing for ${region} regarding ${topic}.
    
    Stats:
    ${JSON.stringify(stats, null, 2)}
    
    Format as a markdown summary.
  `;

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
    });

    return completion.choices[0].message.content;
}
