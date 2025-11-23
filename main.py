import os
import subprocess
import sys
from mcp_agent.app import MCPApp

# Bootstrap Node.js environment
def setup_node():
    print("Setting up Node.js environment...")
    try:
        # Check if node is available
        subprocess.run(["node", "--version"], check=True)
        print("Node.js is available.")
        
        # Install dependencies if node_modules is missing
        if not os.path.exists("node_modules"):
            print("Installing Node.js dependencies...")
            subprocess.run(["npm", "install", "--production"], check=True)
            print("Dependencies installed.")
            
    except Exception as e:
        print(f"Error setting up Node.js: {e}")
        # We don't exit here because nodejs-bin might put node in a path 
        # that subprocess finds but check=True might fail on some edge cases.
        # But generally, if this fails, the server will fail later.

setup_node()

# Initialize the MCP Agent
app = MCPApp(name="disasterscout")

if __name__ == "__main__":
    app.run()
