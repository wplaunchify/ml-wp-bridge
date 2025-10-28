# ML WP Bridge

WordPress MCP Server for Cursor IDE - v3.0.0

## Installation

```bash
npx -y github:wplaunchify/ml-wp-bridge
```

## Configuration

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "ml-cursor-yoursite": {
      "command": "npx",
      "args": ["-y", "github:wplaunchify/ml-wp-bridge"],
      "env": {
        "WP_URL": "https://your-site.com",
        "WP_USERNAME": "admin",
        "WP_PASSWORD": "your-application-password"
      }
    }
  }
}
```

## WordPress Plugin

Download and install: `plugin/ml-cursor-mcp-v3.0.0.zip`

The plugin provides:
- Application Password support
- One-click configuration generator
- Installation instructions

## Features

- 35+ WordPress management tools
- Direct WordPress REST API integration
- Standard authentication
- No custom endpoints

## Version

3.0.0 - Proper MCP architecture
