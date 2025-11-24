import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

async function main() {
    console.log("Starting DisasterScout MCP Server...");

    const transport = new StdioClientTransport({
        command: "node",
        args: ["dist/index.js"],
        env: process.env as Record<string, string>
    });

    const client = new Client(
        {
            name: "disasterscout-client",
            version: "1.0.0",
        },
        {
            capabilities: {},
        }
    );

    try {
        await client.connect(transport);
        console.log("Connected to server!");

        const tools = await client.listTools();
        console.log("Available tools:", tools.tools.map(t => t.name));

        if (tools.tools.length === 0) {
            console.error("No tools found!");
            process.exit(1);
        }

        console.log("\nVerifying 'list_incidents' tool...");
        const incidents = await client.callTool({
            name: "list_incidents",
            arguments: { region: "test" }
        });
        console.log("list_incidents result:", JSON.stringify(incidents, null, 2));

        console.log("\nVerification successful!");
        process.exit(0);

    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
}

main();
