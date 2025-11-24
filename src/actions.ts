import { fetchNews, extractContent, classifyAndExtract, geocodeLocation } from "./llm.js";
import { getIncidentsCollection } from "./db.js";

export async function performScan(region: string, topic: string) {
    console.log(`Starting scan for ${topic} in ${region}...`);

    // 1. Search for news
    const searchResults = await fetchNews(region, topic);
    if (!searchResults || searchResults.length === 0) {
        return {
            processedCount: 0,
            addedCount: 0,
            message: `No news found for ${topic} in ${region}.`
        };
    }

    // 2. Extract content for all URLs
    const urls = searchResults.map(r => r.url);
    const extractedData = await extractContent(urls);

    // Map extracted content back to search results
    // We create a map of URL -> extracted content
    const contentMap = new Map(extractedData.map((item: any) => [item.url, item.raw_content]));

    let addedCount = 0;
    let processedCount = 0;

    for (const item of searchResults) {
        processedCount++;
        const rawContent = (contentMap.get(item.url) || "") as string;

        // Combine title and content for better context
        const fullText = `Title: ${item.title}\n\nContent: ${rawContent}`;

        const classification = await classifyAndExtract(fullText, region);

        if (classification.is_relevant) {
            const locationName = classification.location_name || region;
            // Geocode with fallback to region
            const coords = await geocodeLocation(locationName, region);

            if (coords) {
                const incident = {
                    title: item.title,
                    url: item.url,
                    content: rawContent.substring(0, 1000), // Store truncated content
                    category: classification.category,
                    description: classification.description,
                    locationName: locationName,
                    region: region, // Store original region for filtering
                    topic: topic,
                    location: {
                        type: "Point",
                        coordinates: coords
                    },
                    status: "active",
                    createdAt: new Date()
                };

                const collection = getIncidentsCollection();
                // Upsert using url as unique key
                await collection.updateOne(
                    { url: item.url },
                    { $set: incident },
                    { upsert: true }
                );
                addedCount++;
                console.log(`Added incident: ${classification.category} - ${item.title}`);
            } else {
                console.log(`Skipping incident (geocoding failed): ${item.title}`);
            }
        } else {
            console.log(`Skipping irrelevant article: ${item.title}`);
        }
    }

    return {
        processedCount,
        addedCount,
        message: `Scanned ${processedCount} articles for ${topic} in ${region}. Added/Updated ${addedCount} relevant incidents.`
    };
}
