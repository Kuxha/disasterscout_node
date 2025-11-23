import { fetchNews, classifyAndExtract, geocodeLocation } from "./llm.js";
import { getIncidentsCollection } from "./db.js";

export async function performScan(region: string, topic: string) {
    const news = await fetchNews(region, topic);
    let addedCount = 0;
    let processedCount = 0;

    for (const item of news) {
        processedCount++;
        const classification = await classifyAndExtract(item.content, region);

        if (classification.is_relevant) {
            const locationName = classification.location_name || region;
            const coords = await geocodeLocation(locationName);

            if (coords) {
                const incident = {
                    title: item.title,
                    url: item.url,
                    content: item.content,
                    category: classification.category,
                    description: classification.description,
                    locationName: locationName,
                    location: {
                        type: "Point",
                        coordinates: coords
                    },
                    status: "active", // Default status
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
            }
        }
    }

    return {
        processedCount,
        addedCount,
        message: `Scanned ${processedCount} articles for ${topic} in ${region}. Added/Updated ${addedCount} relevant incidents.`
    };
}
