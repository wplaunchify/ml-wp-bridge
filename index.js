#!/usr/bin/env node

/**
 * WordPress MCP Bridge
 * Generic MCP server for WordPress REST API integration
 * Connects to ML Cursor MCP plugin with 173+ tools
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const WP_URL = process.env.WP_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_PASSWORD = process.env.WP_PASSWORD;

if (!WP_URL || !WP_USERNAME || !WP_PASSWORD) {
  console.error('ERROR: Missing environment variables');
  process.exit(1);
}

const SITE_NAME = WP_URL.replace(/^https?:\/\//, '').replace(/\/$/, '').split('.')[0];
const CUSTOM_API_BASE = `${WP_URL}/wp-json/ml-mcp-${SITE_NAME}/v1`;
const AUTH_HEADER = 'Basic ' + Buffer.from(`${WP_USERNAME}:${WP_PASSWORD}`).toString('base64');

async function callWordPress(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': AUTH_HEADER,
      'Content-Type': 'application/json',
    },
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`WordPress API error: HTTP ${response.status}: ${JSON.stringify(data)}`);
  }
  
  return data;
}

async function discoverTools() {
  try {
    const manifest = await callWordPress(`${CUSTOM_API_BASE}/list-all-tools`, 'GET');
    return manifest.tools || [];
  } catch (error) {
    console.error('Failed to discover tools from WordPress:', error.message);
    return [];
  }
}

function createToolHandler(tool) {
  return async (params) => {
    let endpoint = tool.endpoint;
    
    // Replace path parameters
    if (params && typeof params === 'object') {
      for (const [key, value] of Object.entries(params)) {
        endpoint = endpoint.replace(`{${key}}`, value);
        endpoint = endpoint.replace(`:${key}`, value);
      }
    }
    
    return await callWordPress(endpoint, tool.method, params);
  };
}

let TOOLS = {};

async function initializeTools() {
  const discoveredTools = await discoverTools();
  
  TOOLS = {};
  
  for (const tool of discoveredTools) {
    TOOLS[tool.name] = {
      description: tool.description || tool.name,
      handler: createToolHandler(tool),
      inputSchema: tool.inputSchema || {
        type: 'object',
        properties: tool.parameters || {},
      }
    };
  }
  
  console.error(`Initialized ${Object.keys(TOOLS).length} tools from WordPress`);
}

const server = new Server(
  {
    name: `wp-bridge-${SITE_NAME}`,
    version: '3.3.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(InitializeRequestSchema, async (request) => {
  await initializeTools();
  
  return {
    protocolVersion: '2024-11-05',
    serverInfo: {
      name: `wp-bridge-${SITE_NAME}`,
      version: '3.3.0',
    },
    capabilities: {
      tools: {},
    },
  };
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = Object.entries(TOOLS).map(([name, config]) => ({
    name,
    description: config.description,
    inputSchema: config.inputSchema || {
      type: 'object',
      properties: {},
    },
  }));

  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!TOOLS[name]) {
    throw new Error(`Unknown tool: ${name}`);
  }

  try {
    const result = await TOOLS[name].handler(args || {});
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
