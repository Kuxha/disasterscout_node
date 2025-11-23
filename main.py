from mcp_agent.app import MCPApp

# Initialize the MCP Agent
# This agent will automatically load the servers defined in mcp_agent.config.yaml
app = MCPApp(name="disasterscout")

if __name__ == "__main__":
    app.run()
