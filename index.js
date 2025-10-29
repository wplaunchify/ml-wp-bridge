#!/usr/bin/env node

/**
 * ML WP Bridge - Universal WordPress MCP Server
 * Version: 4.0.0
 * 
 * HYBRID ARCHITECTURE:
 * - Uses native WordPress REST API (/wp/v2/) for standard operations
 * - Dynamically discovers custom tools from plugin manifest endpoint
 * - Supports ANY WordPress site with or without custom plugins
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

// Get configuration from environment
const WP_URL = process.env.WP_URL || process.env.WORDPRESS_URL;
const WP_USERNAME = process.env.WP_USERNAME || process.env.WORDPRESS_USERNAME;
const WP_PASSWORD = process.env.WP_PASSWORD || process.env.WORDPRESS_PASSWORD;

if (!WP_URL || !WP_USERNAME || !WP_PASSWORD) {
  console.error('ERROR: Missing required environment variables');
  console.error('Required: WP_URL, WP_USERNAME, WP_PASSWORD');
  process.exit(1);
}

// Clean URL and setup API bases
const WP_BASE = WP_URL.replace(/\/$/, '');
const WP_API_BASE = WP_BASE + '/wp-json/wp/v2';

// Extract site name from URL to match WordPress plugin's dynamic namespace
const domain = WP_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
const domainParts = domain.split('.');
const siteName = domainParts[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
const ML_NAMESPACE = 'ml-mcp-' + siteName;
const ML_API_BASE = WP_BASE + '/wp-json/' + ML_NAMESPACE + '/v1';

// Create Basic Auth header
const authString = Buffer.from(`${WP_USERNAME}:${WP_PASSWORD}`).toString('base64');
const AUTH_HEADER = `Basic ${authString}`;

// Storage for dynamically discovered custom tools
let CUSTOM_TOOLS = {};
let CUSTOM_TOOL_SCHEMAS = {};
let CUSTOM_TOOL_DESCRIPTIONS = {};

/**
 * Make authenticated request to WordPress REST API
 */
async function callWordPress(endpoint, method = 'GET', body = null, baseUrl = WP_API_BASE) {
  const url = `${baseUrl}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Authorization': AUTH_HEADER,
      'Content-Type': 'application/json',
    },
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(`WordPress API error: ${error.message}`);
  }
}

/**
 * Fetch custom tools manifest from plugin
 */
async function fetchCustomToolsManifest() {
  try {
    console.error(`Checking for custom tools at: ${ML_API_BASE}/manifest`);
    const manifest = await callWordPress('/manifest', 'GET', null, ML_API_BASE);
    
    if (manifest.success && manifest.tools && Array.isArray(manifest.tools)) {
      console.error(`Found ${manifest.tools.length} custom tools from plugin v${manifest.version}`);
      
      // Register each custom tool
      manifest.tools.forEach(tool => {
        const toolName = tool.name;
        
        // Create dynamic function that calls the custom endpoint
        CUSTOM_TOOLS[toolName] = async (params) => {
          let endpoint = tool.endpoint.replace(ML_API_BASE, '');
          
          // Replace URL parameters like {id} with actual values
          if (params && endpoint.includes('{')) {
            Object.keys(params).forEach(key => {
              endpoint = endpoint.replace(`{${key}}`, params[key]);
            });
          }
          
          return await callWordPress(endpoint, tool.method || 'GET', params, ML_API_BASE);
        };
        
        // Store description
        CUSTOM_TOOL_DESCRIPTIONS[toolName] = tool.description || toolName;
        
        // Create schema from parameters
        if (tool.parameters) {
          const properties = {};
          const required = [];
          
          Object.keys(tool.parameters).forEach(paramName => {
            properties[paramName] = {
              type: 'string',
              description: tool.parameters[paramName]
            };
            required.push(paramName);
          });
          
          CUSTOM_TOOL_SCHEMAS[toolName] = {
            type: 'object',
            properties,
            required: required.length > 0 ? required : undefined
          };
        } else {
          CUSTOM_TOOL_SCHEMAS[toolName] = {
            type: 'object',
            properties: {}
          };
        }
      });
      
      return true;
    }
  } catch (error) {
    console.error(`No custom tools found (this is OK): ${error.message}`);
    return false;
  }
}

// ============================================================================
// STANDARD WORDPRESS TOOLS (Native /wp/v2/ API)
// ============================================================================

// === POSTS (5 tools) ===
async function wp_create_post(params) {
  return await callWordPress('/posts', 'POST', params);
}

async function wp_list_posts(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/posts${query ? '?' + query : ''}`);
}

async function wp_get_post(params) {
  return await callWordPress(`/posts/${params.id}`);
}

async function wp_update_post(params) {
  const { id, ...body } = params;
  return await callWordPress(`/posts/${id}`, 'POST', body);
}

async function wp_delete_post(params) {
  return await callWordPress(`/posts/${params.id}`, 'DELETE');
}

// === PAGES (5 tools) ===
async function wp_create_page(params) {
  return await callWordPress('/pages', 'POST', params);
}

async function wp_list_pages(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/pages${query ? '?' + query : ''}`);
}

async function wp_get_page(params) {
  return await callWordPress(`/pages/${params.id}`);
}

async function wp_update_page(params) {
  const { id, ...body } = params;
  return await callWordPress(`/pages/${id}`, 'POST', body);
}

async function wp_delete_page(params) {
  return await callWordPress(`/pages/${params.id}`, 'DELETE');
}

// === MEDIA (5 tools) ===
async function wp_list_media(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/media${query ? '?' + query : ''}`);
}

async function wp_get_media(params) {
  return await callWordPress(`/media/${params.id}`);
}

async function wp_update_media(params) {
  const { id, ...body } = params;
  return await callWordPress(`/media/${id}`, 'POST', body);
}

async function wp_delete_media(params) {
  return await callWordPress(`/media/${params.id}`, 'DELETE');
}

async function wp_upload_media_url(params) {
  // This requires sideloading, which needs custom endpoint
  throw new Error('Media upload requires custom plugin endpoint');
}

// === USERS (5 tools) ===
async function wp_list_users(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/users${query ? '?' + query : ''}`);
}

async function wp_create_user(params) {
  return await callWordPress('/users', 'POST', params);
}

async function wp_get_user(params) {
  return await callWordPress(`/users/${params.id}`);
}

async function wp_update_user(params) {
  const { id, ...body } = params;
  return await callWordPress(`/users/${id}`, 'POST', body);
}

async function wp_delete_user(params) {
  return await callWordPress(`/users/${params.id}?force=true&reassign=${params.reassign || 1}`, 'DELETE');
}

// === COMMENTS (4 tools) ===
async function wp_list_comments(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/comments${query ? '?' + query : ''}`);
}

async function wp_moderate_comment(params) {
  const { id, ...body } = params;
  return await callWordPress(`/comments/${id}`, 'POST', body);
}

async function wp_reply_to_comment(params) {
  return await callWordPress('/comments', 'POST', params);
}

async function wp_delete_comment(params) {
  return await callWordPress(`/comments/${params.id}?force=true`, 'DELETE');
}

// === CATEGORIES & TAGS (8 tools) ===
async function wp_list_categories(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/categories${query ? '?' + query : ''}`);
}

async function wp_create_category(params) {
  return await callWordPress('/categories', 'POST', params);
}

async function wp_update_category(params) {
  const { id, ...body } = params;
  return await callWordPress(`/categories/${id}`, 'POST', body);
}

async function wp_delete_category(params) {
  return await callWordPress(`/categories/${params.id}?force=true`, 'DELETE');
}

async function wp_list_tags(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/tags${query ? '?' + query : ''}`);
}

async function wp_create_tag(params) {
  return await callWordPress('/tags', 'POST', params);
}

async function wp_update_tag(params) {
  const { id, ...body } = params;
  return await callWordPress(`/tags/${id}`, 'POST', body);
}

async function wp_delete_tag(params) {
  return await callWordPress(`/tags/${params.id}?force=true`, 'DELETE');
}

// Standard WordPress tools
const STANDARD_TOOLS = {
  // Posts (5)
  wp_create_post, wp_list_posts, wp_get_post, wp_update_post, wp_delete_post,
  // Pages (5)
  wp_create_page, wp_list_pages, wp_get_page, wp_update_page, wp_delete_page,
  // Media (5)
  wp_list_media, wp_get_media, wp_update_media, wp_delete_media, wp_upload_media_url,
  // Users (5)
  wp_list_users, wp_create_user, wp_get_user, wp_update_user, wp_delete_user,
  // Comments (4)
  wp_list_comments, wp_moderate_comment, wp_reply_to_comment, wp_delete_comment,
  // Categories & Tags (8)
  wp_list_categories, wp_create_category, wp_update_category, wp_delete_category,
  wp_list_tags, wp_create_tag, wp_update_tag, wp_delete_tag,
};

const STANDARD_TOOL_DESCRIPTIONS = {
  // Posts
  wp_create_post: 'Create a new post',
  wp_list_posts: 'List WordPress posts',
  wp_get_post: 'Get a single post by ID',
  wp_update_post: 'Update an existing post',
  wp_delete_post: 'Delete a post',
  // Pages
  wp_create_page: 'Create a new page',
  wp_list_pages: 'List WordPress pages',
  wp_get_page: 'Get a single page by ID',
  wp_update_page: 'Update an existing page',
  wp_delete_page: 'Delete a page',
  // Media
  wp_list_media: 'List media items',
  wp_get_media: 'Get a media item by ID',
  wp_update_media: 'Update media metadata',
  wp_delete_media: 'Delete a media item',
  wp_upload_media_url: 'Upload media from URL',
  // Users
  wp_list_users: 'List WordPress users',
  wp_create_user: 'Create a new user',
  wp_get_user: 'Get a user by ID',
  wp_update_user: 'Update a user',
  wp_delete_user: 'Delete a user',
  // Comments
  wp_list_comments: 'List comments',
  wp_moderate_comment: 'Moderate comment',
  wp_reply_to_comment: 'Reply to comment',
  wp_delete_comment: 'Delete comment',
  // Categories & Tags
  wp_list_categories: 'List categories',
  wp_create_category: 'Create category',
  wp_update_category: 'Update category',
  wp_delete_category: 'Delete category',
  wp_list_tags: 'List tags',
  wp_create_tag: 'Create tag',
  wp_update_tag: 'Update tag',
  wp_delete_tag: 'Delete tag',
};

const STANDARD_TOOL_SCHEMAS = {
  // Posts
  wp_create_post: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Post title' },
      content: { type: 'string', description: 'Post content (HTML)' },
      status: { type: 'string', description: 'Post status: draft, publish, pending, private' },
    },
    required: ['title', 'content'],
  },
  wp_get_post: {
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Post ID' },
    },
    required: ['id'],
  },
  wp_update_post: {
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Post ID' },
      title: { type: 'string', description: 'Post title' },
      content: { type: 'string', description: 'Post content (HTML)' },
      status: { type: 'string', description: 'Post status' },
    },
    required: ['id'],
  },
  wp_delete_post: {
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Post ID' },
    },
    required: ['id'],
  },
  // Pages
  wp_create_page: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Page title' },
      content: { type: 'string', description: 'Page content (HTML)' },
      status: { type: 'string', description: 'Page status: draft, publish, pending, private' },
    },
    required: ['title', 'content'],
  },
  wp_get_page: {
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Page ID' },
    },
    required: ['id'],
  },
  wp_update_page: {
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Page ID' },
      title: { type: 'string', description: 'Page title' },
      content: { type: 'string', description: 'Page content (HTML)' },
    },
    required: ['id'],
  },
  wp_delete_page: {
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Page ID' },
    },
    required: ['id'],
  },
  // Default schema
  _default: {
    type: 'object',
    properties: {},
  },
};

// ============================================================================
// MCP SERVER SETUP
// ============================================================================

// Extract site name for server identification
const SITE_NAME = WP_URL.replace(/^https?:\/\//, '').replace(/\/$/, '').split('.')[0];

// Initialize MCP server
const server = new Server(
  {
    name: `ml-cursor-${SITE_NAME}`,
    version: '4.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle initialization
server.setRequestHandler(InitializeRequestSchema, async (request) => {
  // Fetch custom tools during initialization
  await fetchCustomToolsManifest();
  
  return {
    protocolVersion: '2024-11-05',
    serverInfo: {
      name: `ml-cursor-${SITE_NAME}`,
      version: '4.0.0',
    },
    capabilities: {
      tools: {},
    },
  };
});

// Handle list tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  // Combine standard and custom tools
  const allTools = { ...STANDARD_TOOLS, ...CUSTOM_TOOLS };
  const allDescriptions = { ...STANDARD_TOOL_DESCRIPTIONS, ...CUSTOM_TOOL_DESCRIPTIONS };
  const allSchemas = { ...STANDARD_TOOL_SCHEMAS, ...CUSTOM_TOOL_SCHEMAS };
  
  const tools = Object.keys(allTools).map(name => ({
    name,
    description: allDescriptions[name] || name,
    inputSchema: allSchemas[name] || STANDARD_TOOL_SCHEMAS._default,
  }));

  return { tools };
});

// Handle call tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Check both standard and custom tools
  const allTools = { ...STANDARD_TOOLS, ...CUSTOM_TOOLS };
  
  if (!allTools[name]) {
    throw new Error(`Unknown tool: ${name}`);
  }

  try {
    const result = await allTools[name](args || {});
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

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`ML WP Bridge v4.0.0 running`);
  console.error(`Connected to: ${WP_URL}`);
  console.error(`Standard tools: ${Object.keys(STANDARD_TOOLS).length}`);
  console.error(`Custom tools: ${Object.keys(CUSTOM_TOOLS).length}`);
  console.error(`Total tools: ${Object.keys(STANDARD_TOOLS).length + Object.keys(CUSTOM_TOOLS).length}`);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
