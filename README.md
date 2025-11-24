# DisasterScout (Node.js)

An MCP Agent for crisis response, helping users find real-time disaster information, shelters, and safety advice.

## Architecture

### 1. Ingestion Pipeline
- **Tavily Search & Extract**: Located in `src/llm.ts` and `src/actions.ts`.
  - Uses `tvly.search` to find relevant news.
  - Uses `tvly.extract` (via REST API) to get full article content.
- **LLM Classification**: Uses OpenAI (GPT-4o-mini) to classify incidents into SOS, SHELTER, INFO.
- **Geocoding**: Uses `node-geocoder` with OpenStreetMap, falling back to region center if specific location fails.

### 2. Database (MongoDB Atlas)
- Configured in `src/db.ts`.
- Stores incidents in `incidents` collection.
- Uses `2dsphere` index on `location` field for geospatial queries (`$near`).

### 3. MCP Server
- Defined in `src/tools.ts`.
- Exposes tools:
  - `scan_region(region, topic)`: Triggers ingestion.
  - `list_incidents(region, ...)`: Lists incidents.
  - `find_nearest_resources(lat, lon, ...)`: Finds nearby resources.
  - `daily_brief(region, topic)`: Generates summary and map link.

### 4. Map Frontend
- Served by Express in `src/server.ts` from `public/`.
- Uses Leaflet.js for visualization.
- Endpoints:
  - `/api/incidents`: GeoJSON incidents.
  - `/api/incidents_near`: Nearby incidents.
  - `/api/brief`: Trigger scan + summary.

## How to Run Locally

### Prerequisites
- Node.js v18+
- MongoDB Atlas URI
- OpenAI API Key
- Tavily API Key

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set environment variables in `.env`:
   ```
   OPENAI_API_KEY=sk-...
   TAVILY_API_KEY=tvly-...
   MONGO_URI=mongodb+srv://...
   MONGO_DB_NAME=disaster_db
   ```

### Running
1. Build and Start Server (MCP + Web):
   ```bash
   npm run build
   npm start
   ```
   Or for development:
   ```bash
   npm run dev
   ```

2. Access Map:
   Open [http://localhost:3000](http://localhost:3000)

### Demo Flows

**Flow 1: "Flood in Nha Trang"**
1. In ChatGPT (with MCP): "Flood in Nha Trang."
2. Agent calls `scan_region` -> `daily_brief`.
3. View Map: Select "Nha Trang, Vietnam" in dropdown or click link in brief.

**Flow 2: "Flood in Bay Ridge"**
1. In ChatGPT: "Flood in Bay Ridge."
2. Agent calls `scan_region` -> `daily_brief`.
3. If no major incidents, brief will advise caution.
4. View Map: Select "Bay Ridge" to see any minor info.

## Deployment to LastMile AI (mcp-agent)

1. Login:
   ```bash
   uvx mcp-agent login
   ```

2. Set Secrets (CRITICAL for deployment success):
   ```bash
   uvx mcp-agent secret set MONGO_URI="mongodb+srv://..."
   uvx mcp-agent secret set TAVILY_API_KEY="tvly-..."
   uvx mcp-agent secret set OPENAI_API_KEY="sk-..."
   ```

3. Deploy:
   ```bash
   uvx mcp-agent deploy disasterscout
   ```

4. Integration:
   - Once deployed, use the provided URL to install the agent in ChatGPT (via Custom GPT Actions or the MCP integration flow provided by the platform).

