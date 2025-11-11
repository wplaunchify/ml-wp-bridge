# MinuteLaunch WordPress Bridge MCP Server

MCP Server that provides generic REST API access to WordPress and FluentCommunity Manager endpoints.

## Features

- **Generic REST API caller** - Call any WordPress REST endpoint
- **FluentCommunity shortcuts** - Pre-built tools for common FC operations
- Works alongside Rahees's WordPress MCP Server
- Simple npx installation

## Installation

Add this to your Claude Desktop config:

**Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "wordpress": {
      "command": "npx",
      "args": ["-y", "@raheesahmed/wordpress-mcp-server"],
      "env": {
        "WORDPRESS_URL": "https://your-site.com",
        "WORDPRESS_USERNAME": "your-username",
        "WORDPRESS_APP_PASSWORD": "xxxx xxxx xxxx xxxx xxxx xxxx"
      }
    },
    "ml-wp-bridge": {
      "command": "npx",
      "args": ["-y", "github:wplaunchify/ml-wp-bridge"],
      "env": {
        "WORDPRESS_URL": "https://your-site.com",
        "WORDPRESS_USERNAME": "your-username",
        "WORDPRESS_APP_PASSWORD": "xxxx xxxx xxxx xxxx xxxx xxxx"
      }
    }
  }
}
```

Then restart Claude Desktop.

## Available Tools

### Generic REST API

**`wp_rest_api_call`** - Call any WordPress REST endpoint

Example:
```
Call wp_rest_api_call with:
- endpoint: "fc-manager/v1/spaces"
- method: "POST"
- body: {"title": "My Space", "privacy": "public"}
```

### FluentCommunity Shortcuts

**`fc_create_space`** - Create a new space
```
- title: "AI Development Hub"
- description: "For discussing AI"
- privacy: "public"
```

**`fc_list_spaces`** - List all spaces
```
- limit: 20
- status: "published"
```

**`fc_create_post`** - Create a post in a space
```
- space_id: 2
- user_id: 1
- message: "Hello world!"
```

**`fc_list_posts`** - List posts
```
- space_id: 2
- limit: 20
```

## Requirements

- Node.js 14+
- WordPress with REST API enabled
- Application Password for authentication

## Example Usage

After setup, ask Claude:

- "Create a new FluentCommunity space called 'Welcome'"
- "List all spaces in my FluentCommunity"
- "Create a post in space ID 2"
- "Call the fc-manager/v1/comments endpoint"

## License

MIT
