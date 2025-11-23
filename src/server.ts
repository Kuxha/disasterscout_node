import express from 'express';
import path from 'path';
import { getIncidentsCollection } from './db.js';

export function startWebServer(port: number = 3000) {
    const app = express();

    // Serve static files
    const publicDir = path.join(process.cwd(), 'public');
    app.use(express.static(publicDir));

    // API to get incidents for the map
    app.get('/api/incidents', async (req, res) => {
        try {
            const collection = getIncidentsCollection();
            const incidents = await collection.find({}).sort({ createdAt: -1 }).limit(100).toArray();
            res.json(incidents);
        } catch (error) {
            console.error("Error fetching incidents:", error);
            res.status(500).json({ error: "Failed to fetch incidents" });
        }
    });

    app.use(express.json());

    // API to trigger a scan
    app.post('/api/scan', async (req, res) => {
        try {
            const { region, topic } = req.body;
            if (!region || !topic) {
                return res.status(400).json({ error: "Region and topic are required" });
            }

            // Import dynamically to avoid circular dependency issues if any, 
            // though here it's fine. Using standard import at top is better but 
            // for this edit we'll add the import at the top of the file in a separate step 
            // or just assume it's available if we imported it.
            // Let's rely on the import we will add.
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
