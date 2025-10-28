#!/usr/bin/env node

/**
 * ML Cursor MCP Server v3.0.0
 * 
 * Proper MCP architecture that talks directly to WordPress built-in REST API
 * No custom endpoints - uses standard WordPress /wp/v2/ routes
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
  console.error('Required: WP_URL (or WORDPRESS_URL), WP_USERNAME (or WORDPRESS_USERNAME), WP_PASSWORD (or WORDPRESS_PASSWORD)');
  console.error('Note: WP_PASSWORD should be an Application Password from WordPress');
  process.exit(1);
}

// Clean URL
const API_BASE = WP_URL.replace(/\/$/, '') + '/wp-json/wp/v2';

// Create Basic Auth header
const authString = Buffer.from(`${WP_USERNAME}:${WP_PASSWORD}`).toString('base64');
const AUTH_HEADER = `Basic ${authString}`;

/**
 * Make authenticated request to WordPress REST API
 */
async function callWordPress(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE}${endpoint}`;
  
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

// ============================================================================
// TOOL IMPLEMENTATIONS
// ============================================================================

// Posts
async function wp_list_posts(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/posts${query ? '?' + query : ''}`, 'GET');
}

async function wp_get_post(params) {
  return await callWordPress(`/posts/${params.id}`, 'GET');
}

async function wp_create_post(params) {
  return await callWordPress('/posts', 'POST', params);
}

async function wp_update_post(params) {
  const { id, ...body } = params;
  return await callWordPress(`/posts/${id}`, 'POST', body);
}

async function wp_delete_post(params) {
  return await callWordPress(`/posts/${params.id}`, 'DELETE');
}

// Pages
async function wp_list_pages(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/pages${query ? '?' + query : ''}`, 'GET');
}

async function wp_get_page(params) {
  return await callWordPress(`/pages/${params.id}`, 'GET');
}

async function wp_create_page(params) {
  return await callWordPress('/pages', 'POST', params);
}

async function wp_update_page(params) {
  const { id, ...body } = params;
  return await callWordPress(`/pages/${id}`, 'POST', body);
}

async function wp_delete_page(params) {
  return await callWordPress(`/pages/${params.id}`, 'DELETE');
}

// Media
async function wp_list_media(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/media${query ? '?' + query : ''}`, 'GET');
}

async function wp_get_media(params) {
  return await callWordPress(`/media/${params.id}`, 'GET');
}

async function wp_upload_media(params) {
  // For media upload, we need multipart/form-data
  // This is a simplified version - full implementation would handle file uploads
  return await callWordPress('/media', 'POST', params);
}

async function wp_update_media(params) {
  const { id, ...body } = params;
  return await callWordPress(`/media/${id}`, 'POST', body);
}

async function wp_delete_media(params) {
  return await callWordPress(`/media/${params.id}`, 'DELETE');
}

// Users
async function wp_list_users(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/users${query ? '?' + query : ''}`, 'GET');
}

async function wp_get_user(params) {
  return await callWordPress(`/users/${params.id}`, 'GET');
}

async function wp_create_user(params) {
  return await callWordPress('/users', 'POST', params);
}

async function wp_update_user(params) {
  const { id, ...body } = params;
  return await callWordPress(`/users/${id}`, 'POST', body);
}

async function wp_delete_user(params) {
  return await callWordPress(`/users/${params.id}?force=true&reassign=${params.reassign || 1}`, 'DELETE');
}

// Categories
async function wp_list_categories(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/categories${query ? '?' + query : ''}`, 'GET');
}

async function wp_get_category(params) {
  return await callWordPress(`/categories/${params.id}`, 'GET');
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

// Tags
async function wp_list_tags(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/tags${query ? '?' + query : ''}`, 'GET');
}

async function wp_get_tag(params) {
  return await callWordPress(`/tags/${params.id}`, 'GET');
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

// Comments
async function wp_list_comments(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/comments${query ? '?' + query : ''}`, 'GET');
}

async function wp_get_comment(params) {
  return await callWordPress(`/comments/${params.id}`, 'GET');
}

async function wp_create_comment(params) {
  return await callWordPress('/comments', 'POST', params);
}

async function wp_update_comment(params) {
  const { id, ...body } = params;
  return await callWordPress(`/comments/${id}`, 'POST', body);
}

async function wp_delete_comment(params) {
  return await callWordPress(`/comments/${params.id}?force=true`, 'DELETE');
}

// ============================================================================
// MCP SERVER SETUP
// ============================================================================

const TOOLS = {
  // Posts
  wp_list_posts, wp_get_post, wp_create_post, wp_update_post, wp_delete_post,
  // Pages
  wp_list_pages, wp_get_page, wp_create_page, wp_update_page, wp_delete_page,
  // Media
  wp_list_media, wp_get_media, wp_upload_media, wp_update_media, wp_delete_media,
  // Users
  wp_list_users, wp_get_user, wp_create_user, wp_update_user, wp_delete_user,
  // Categories
  wp_list_categories, wp_get_category, wp_create_category, wp_update_category, wp_delete_category,
  // Tags
  wp_list_tags, wp_get_tag, wp_create_tag, wp_update_tag, wp_delete_tag,
  // Comments
  wp_list_comments, wp_get_comment, wp_create_comment, wp_update_comment, wp_delete_comment,
};

const TOOL_DESCRIPTIONS = {
  // Posts
  wp_list_posts: 'List WordPress posts',
  wp_get_post: 'Get a single post by ID',
  wp_create_post: 'Create a new post',
  wp_update_post: 'Update an existing post',
  wp_delete_post: 'Delete a post',
  // Pages
  wp_list_pages: 'List WordPress pages',
  wp_get_page: 'Get a single page by ID',
  wp_create_page: 'Create a new page',
  wp_update_page: 'Update an existing page',
  wp_delete_page: 'Delete a page',
  // Media
  wp_list_media: 'List media items',
  wp_get_media: 'Get a media item by ID',
  wp_upload_media: 'Upload a media file',
  wp_update_media: 'Update media metadata',
  wp_delete_media: 'Delete a media item',
  // Users
  wp_list_users: 'List WordPress users',
  wp_get_user: 'Get a user by ID',
  wp_create_user: 'Create a new user',
  wp_update_user: 'Update a user',
  wp_delete_user: 'Delete a user',
  // Categories
  wp_list_categories: 'List categories',
  wp_get_category: 'Get a category by ID',
  wp_create_category: 'Create a new category',
  wp_update_category: 'Update a category',
  wp_delete_category: 'Delete a category',
  // Tags
  wp_list_tags: 'List tags',
  wp_get_tag: 'Get a tag by ID',
  wp_create_tag: 'Create a new tag',
  wp_update_tag: 'Update a tag',
  wp_delete_tag: 'Delete a tag',
  // Comments
  wp_list_comments: 'List comments',
  wp_get_comment: 'Get a comment by ID',
  wp_create_comment: 'Create a new comment',
  wp_update_comment: 'Update a comment',
  wp_delete_comment: 'Delete a comment',
};

// Extract site name for server identification
const SITE_NAME = WP_URL.replace(/^https?:\/\//, '').replace(/\/$/, '').split('.')[0];

// Initialize MCP server
const server = new Server(
  {
    name: `ml-cursor-${SITE_NAME}`,
    version: '3.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle initialization
server.setRequestHandler(InitializeRequestSchema, async (request) => {
  return {
    protocolVersion: '2024-11-05',
    serverInfo: {
      name: `ml-cursor-${SITE_NAME}`,
      version: '3.0.0',
    },
    capabilities: {
      tools: {},
    },
  };
});

// Handle list tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = Object.keys(TOOLS).map(name => ({
    name,
    description: TOOL_DESCRIPTIONS[name] || name,
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Resource ID' },
      },
    },
  }));

  return { tools };
});

// Handle call tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!TOOLS[name]) {
    throw new Error(`Unknown tool: ${name}`);
  }

  try {
    const result = await TOOLS[name](args || {});
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
  console.error(`ML Cursor MCP Server v3.0.0 running`);
  console.error(`Connected to: ${WP_URL}`);
  console.error(`Tools available: ${Object.keys(TOOLS).length}`);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

