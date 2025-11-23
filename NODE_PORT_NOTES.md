# Node.js Port Notes

This document outlines the design decisions and differences between the Python original and this Node.js implementation.

## Tech Stack
- **Runtime**: Node.js 20 (ESM)
- **MCP SDK**: `@modelcontextprotocol/sdk` (Official TypeScript SDK)
- **Database**: MongoDB (Native Driver)
- **AI/Search**: `openai` and `@tavily/core` SDKs

## Simplifications & Deviations

1. **Embeddings**: 
   - The Python version uses embeddings for deduplication. This Node.js version simplifies this by using the article URL as a unique key for upserts. This reduces complexity and dependencies while maintaining basic deduplication.

2. **Geocoding**:
   - Used `node-geocoder` with 'openstreetmap' provider. This is free but has rate limits. For production, consider switching to Google or Mapbox providers.

3. **Schema**:
   - The MongoDB schema is largely compatible but simplified. We focus on `location` (GeoJSON), `category`, `description`, and `url`.

4. **Server Transport**:
   - Uses `StdioServerTransport` which is the standard for MCP agents. This allows it to be easily wrapped by the LastMile infrastructure or used locally with an MCP client.

## Deployment
- The project includes a `mcp.json` configuration file tailored for `uvx mcp-agent deploy`.
- It uses a multi-stage build or direct execution of `dist/index.js` depending on the environment.
