# Deploy Instructions for ml-wp-bridge

## What to Upload to GitHub

Upload ONLY these 4 files to your public `wplaunchify/ml-wp-bridge` repository:

1. `index.js` - The MCP server
2. `package.json` - Node dependencies
3. `README.md` - Minimal documentation
4. `.gitignore` - Ignore node_modules

## What NOT to Upload

❌ **DO NOT** upload:
- Any WordPress plugin files
- Any `.php` files
- The `/plugin` folder (if it exists, delete it from GitHub)
- Any configuration files with credentials
- Any documentation that reveals custom functionality

## Repository Structure

```
ml-wp-bridge/
├── index.js
├── package.json
├── README.md
└── .gitignore
```

That's it. Nothing else.

## How It Works (Hidden from Public)

The server:
1. Uses native WordPress REST API for standard operations
2. Discovers custom tools from `/manifest` endpoint (provided by your private plugin)
3. Without your plugin, it's just a basic WordPress bridge

## Your Private Plugin

Keep `ml-cursor-mcp.php` in your local repository:
- `C:\Users\help\OneDrive\Documents\Github\ml-cursor-mcp`

This plugin:
- Provides the `/manifest` endpoint
- Implements all custom tools (Spence Style, Database, File System, etc.)
- Has the one-click installer
- **Never gets published to GitHub**

## Obfuscation Strategy

✅ **Public Repository** (`ml-wp-bridge`):
- Generic WordPress bridge
- No custom functionality visible
- Could work with any WordPress site
- Gives nothing away

✅ **Private Plugin** (`ml-cursor-mcp.php`):
- All your custom tools
- Custom endpoints
- One-click installer
- Stays on your local machine or private repo

Without both pieces, nobody can replicate your setup.

