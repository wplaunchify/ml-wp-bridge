#!/usr/bin/env node

/**
 * WordPress MCP Bridge
 * Generic MCP server for WordPress REST API integration
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

const WP_API_BASE = `${WP_URL}/wp-json/wp/v2`;
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
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
  }
  
  return data;
}

async function discoverCustomTools() {
  try {
    const manifest = await callWordPress(`${CUSTOM_API_BASE}/manifest`, 'GET');
    return manifest.tools || [];
  } catch (error) {
    return [];
  }
}

const STANDARD_TOOLS = {
  wp_list_posts: {
    description: 'List posts',
    handler: async (params) => {
      const query = new URLSearchParams(params || {}).toString();
      return await callWordPress(`${WP_API_BASE}/posts${query ? '?' + query : ''}`, 'GET');
    }
  },
  wp_get_post: {
    description: 'Get post',
    handler: async (params) => await callWordPress(`${WP_API_BASE}/posts/${params.id}`, 'GET')
  },
  wp_create_post: {
    description: 'Create post',
    handler: async (params) => await callWordPress(`${WP_API_BASE}/posts`, 'POST', params)
  },
  wp_update_post: {
    description: 'Update post',
    handler: async (params) => {
      const { id, ...body } = params;
      return await callWordPress(`${WP_API_BASE}/posts/${id}`, 'POST', body);
    }
  },
  wp_delete_post: {
    description: 'Delete post',
    handler: async (params) => await callWordPress(`${WP_API_BASE}/posts/${params.id}`, 'DELETE')
  },
  wp_list_pages: {
    description: 'List pages',
    handler: async (params) => {
      const query = new URLSearchParams(params || {}).toString();
      return await callWordPress(`${WP_API_BASE}/pages${query ? '?' + query : ''}`, 'GET');
    }
  },
  wp_get_page: {
    description: 'Get page',
    handler: async (params) => await callWordPress(`${WP_API_BASE}/pages/${params.id}`, 'GET')
  },
  wp_create_page: {
    description: 'Create page',
    handler: async (params) => await callWordPress(`${WP_API_BASE}/pages`, 'POST', params)
  },
  wp_update_page: {
    description: 'Update page',
    handler: async (params) => {
      const { id, ...body } = params;
      return await callWordPress(`${WP_API_BASE}/pages/${id}`, 'POST', body);
    }
  },
  wp_delete_page: {
    description: 'Delete page',
    handler: async (params) => await callWordPress(`${WP_API_BASE}/pages/${params.id}`, 'DELETE')
  },
  wp_list_media: {
    description: 'List media',
    handler: async (params) => {
      const query = new URLSearchParams(params || {}).toString();
      return await callWordPress(`${WP_API_BASE}/media${query ? '?' + query : ''}`, 'GET');
    }
  },
  wp_get_media: {
    description: 'Get media',
    handler: async (params) => await callWordPress(`${WP_API_BASE}/media/${params.id}`, 'GET')
  },
  wp_list_users: {
    description: 'List users',
    handler: async (params) => {
      const query = new URLSearchParams(params || {}).toString();
      return await callWordPress(`${WP_API_BASE}/users${query ? '?' + query : ''}`, 'GET');
    }
  },
  wp_get_user: {
    description: 'Get user',
    handler: async (params) => await callWordPress(`${WP_API_BASE}/users/${params.id}`, 'GET')
  },
  wp_list_categories: {
    description: 'List categories',
    handler: async (params) => {
      const query = new URLSearchParams(params || {}).toString();
      return await callWordPress(`${WP_API_BASE}/categories${query ? '?' + query : ''}`, 'GET');
    }
  },
  wp_list_tags: {
    description: 'List tags',
    handler: async (params) => {
      const query = new URLSearchParams(params || {}).toString();
      return await callWordPress(`${WP_API_BASE}/tags${query ? '?' + query : ''}`, 'GET');
    }
  },
  wp_list_comments: {
    description: 'List comments',
    handler: async (params) => {
      const query = new URLSearchParams(params || {}).toString();
      return await callWordPress(`${WP_API_BASE}/comments${query ? '?' + query : ''}`, 'GET');
    }
  },
};

function createCustomToolHandler(tool) {
  return async (params) => {
    let endpoint = tool.endpoint;
    if (params.id && endpoint.includes('{id}')) {
      endpoint = endpoint.replace('{id}', params.id);
    }
    return await callWordPress(endpoint, tool.method, params);
  };
}

let TOOLS = {};
let CUSTOM_TOOLS = [];

async function initializeTools() {
  TOOLS = { ...STANDARD_TOOLS };
  CUSTOM_TOOLS = await discoverCustomTools();
  
  for (const tool of CUSTOM_TOOLS) {
    TOOLS[tool.name] = {
      description: tool.description,
      handler: createCustomToolHandler(tool),
      isCustom: true
    };
  }
}

const server = new Server(
  {
    name: `wp-bridge-${SITE_NAME}`,
    version: '1.0.0',
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
      version: '1.0.0',
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
    inputSchema: {
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
