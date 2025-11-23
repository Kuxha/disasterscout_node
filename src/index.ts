import 'dotenv/config';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { connectDB } from './db.js';
import { registerTools } from './tools.js';

import { startWebServer } from './server.js';

async function main() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error("MONGO_URI environment variable is not set.");
        process.exit(1);
    }

    await connectDB(mongoUri);

    // Start Web UI (default port 3000)
    startWebServer(3000);

    const server = new McpServer({
        name: "disaster-scout",
        version: "1.0.0"
    });

    registerTools(server);

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error("DisasterScout MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main loop:", error);
    process.exit(1);
});
