# DisasterScout Node.js MCP Agent

A Node.js implementation of the DisasterScout MCP Agent, designed for deployment on LastMile AI's MCP Agent Cloud.

## Architecture

- **Core Logic**: Node.js (`src/index.ts`)
- **Deployment Wrapper**: Python (`main.py`) - Required by LastMile's deployment tools.

## Features

- **Scan Region**: Fetches crisis news via Tavily, filters with OpenAI, and stores in MongoDB.
- **List Incidents**: Retrieves recent incidents with filtering capabilities.
- **Find Nearest Resources**: Geospatial search for resources/incidents.
- **Daily Brief**: Generates AI summaries of regional situations.

## Prerequisites

- Node.js 20+
- Python 3.10+ (for deployment wrapper)
- MongoDB Instance (Atlas or local)
- API Keys: Tavily, OpenAI

## Setup

1. **Clone & Install**
   ```bash
   git clone <repo>
   cd disasterscout_node
   npm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env` and fill in your details:
   ```bash
   cp .env.example .env
   ```
   Required variables:
   - `MONGO_URI`
   - `TAVILY_API_KEY`
   - `OPENAI_API_KEY`

3. **Build**
   ```bash
   npm run build
   ```

4. **Run Locally (Node.js only)**
   ```bash
   npm start
   ```

## Deployment (LastMile AI)

This project is configured for deployment using the MCP CLI.

1. **Login**
   ```bash
   uvx mcp-agent login
   ```

2. **Deploy**
   Ensure `mcp_agent.config.yaml`, `main.py`, and `requirements.txt` are present.
   ```bash
   uvx mcp-agent deploy disasterscout
   ```

3. **Configure Secrets**
   You will need to set the environment variables in the LastMile dashboard or CLI during/after deployment.

## Tools

- `scan_region(region, topic)`
- `list_incidents(region, category?, status?, limit?)`
- `find_nearest_resources(lat, lon, category, max_km?, limit?)`
- `daily_brief(region, topic)`
