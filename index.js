#!/usr/bin/env node

/**
 * MinuteLaunch WordPress Bridge MCP Server
 * Provides generic REST API access to WordPress and FluentCommunity Manager
 * 
 * Usage: npx github:wplaunchify/ml-wp-bridge
 */

const https = require('https');
const http = require('http');

// Get WordPress credentials from environment
const WORDPRESS_URL = process.env.WORDPRESS_URL || '';
const WORDPRESS_USERNAME = process.env.WORDPRESS_USERNAME || '';
const WORDPRESS_APP_PASSWORD = process.env.WORDPRESS_APP_PASSWORD || '';

if (!WORDPRESS_URL || !WORDPRESS_USERNAME || !WORDPRESS_APP_PASSWORD) {
  console.error('ERROR: Missing required environment variables');
  console.error('Required: WORDPRESS_URL, WORDPRESS_USERNAME, WORDPRESS_APP_PASSWORD');
  process.exit(1);
}

// Create Basic Auth header
const auth = Buffer.from(`${WORDPRESS_USERNAME}:${WORDPRESS_APP_PASSWORD}`).toString('base64');

/**
 * Make a REST API call to WordPress
 */
function callRestAPI(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`/wp-json/${endpoint}`, WORDPRESS_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'User-Agent': 'MinuteLaunch-WP-Bridge-MCP/1.0'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body && method !== 'GET') {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * MCP Protocol Handler
 */
async function handleMessage(message) {
  const { method, params } = message;

  if (method === 'initialize') {
    return {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: 'ml-wp-bridge',
        version: '1.0.0'
      }
    };
  }

  if (method === 'tools/list') {
    return {
      tools: [
        {
          name: 'wp_rest_api_call',
          description: 'Make a generic REST API call to any WordPress endpoint. Use this to access FluentCommunity Manager endpoints (fc-manager/v1/*), custom plugin endpoints, or any WordPress REST API endpoint not covered by other tools.',
          inputSchema: {
            type: 'object',
            properties: {
              endpoint: {
                type: 'string',
                description: 'The REST API endpoint to call (e.g., "fc-manager/v1/spaces" or "wp/v2/posts"). Do not include /wp-json/ prefix.'
              },
              method: {
                type: 'string',
                enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                default: 'GET',
                description: 'HTTP method to use'
              },
              body: {
                type: 'object',
                description: 'Request body for POST/PUT/PATCH requests (JSON object)'
              },
              params: {
                type: 'object',
                description: 'Query parameters for GET requests (will be converted to query string)'
              }
            },
            required: ['endpoint']
          }
        },
        {
          name: 'fc_create_space',
          description: 'Create a new FluentCommunity space (shortcut for fc-manager/v1/spaces POST)',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Space title'
              },
              description: {
                type: 'string',
                description: 'Space description'
              },
              slug: {
                type: 'string',
                description: 'URL slug (optional, auto-generated from title if not provided)'
              },
              privacy: {
                type: 'string',
                enum: ['public', 'private'],
                default: 'public',
                description: 'Space privacy setting'
              },
              type: {
                type: 'string',
                default: 'community',
                description: 'Space type'
              },
              status: {
                type: 'string',
                enum: ['published', 'draft'],
                default: 'published',
                description: 'Space status'
              }
            },
            required: ['title']
          }
        },
        {
          name: 'fc_list_spaces',
          description: 'List FluentCommunity spaces with optional filtering',
          inputSchema: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                description: 'Filter by status'
              },
              type: {
                type: 'string',
                description: 'Filter by type'
              },
              privacy: {
                type: 'string',
                description: 'Filter by privacy'
              },
              limit: {
                type: 'number',
                default: 20,
                description: 'Number of results to return'
              }
            }
          }
        },
        {
          name: 'fc_create_post',
          description: 'Create a new FluentCommunity post in a space',
          inputSchema: {
            type: 'object',
            properties: {
              space_id: {
                type: 'number',
                description: 'ID of the space to post in'
              },
              user_id: {
                type: 'number',
                description: 'Author user ID'
              },
              message: {
                type: 'string',
                description: 'Post content/message'
              },
              title: {
                type: 'string',
                description: 'Post title (optional)'
              },
              type: {
                type: 'string',
                default: 'text',
                description: 'Post type (text, video, etc)'
              },
              status: {
                type: 'string',
                default: 'published',
                description: 'Post status'
              },
              privacy: {
                type: 'string',
                default: 'public',
                description: 'Post privacy'
              }
            },
            required: ['space_id', 'user_id', 'message']
          }
        },
        {
          name: 'fc_list_posts',
          description: 'List FluentCommunity posts with optional filtering',
          inputSchema: {
            type: 'object',
            properties: {
              space_id: {
                type: 'number',
                description: 'Filter by space ID'
              },
              user_id: {
                type: 'number',
                description: 'Filter by author user ID'
              },
              status: {
                type: 'string',
                description: 'Filter by status'
              },
              limit: {
                type: 'number',
                default: 20,
                description: 'Number of results'
              },
              offset: {
                type: 'number',
                default: 0,
                description: 'Pagination offset'
              }
            }
          }
        }
      ]
    };
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;

    try {
      // Generic REST API call
      if (name === 'wp_rest_api_call') {
        const { endpoint, method = 'GET', body = null, params: queryParams = null } = args;
        
        let fullEndpoint = endpoint;
        if (queryParams && method === 'GET') {
          const searchParams = new URLSearchParams(queryParams);
          fullEndpoint += '?' + searchParams.toString();
        }

        const result = await callRestAPI(fullEndpoint, method, body);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      // FluentCommunity: Create Space
      if (name === 'fc_create_space') {
        const result = await callRestAPI('fc-manager/v1/spaces', 'POST', args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      // FluentCommunity: List Spaces
      if (name === 'fc_list_spaces') {
        const { status, type, privacy, limit = 20 } = args;
        const queryParams = {};
        if (status) queryParams.status = status;
        if (type) queryParams.type = type;
        if (privacy) queryParams.privacy = privacy;
        if (limit) queryParams.limit = limit;

        const searchParams = new URLSearchParams(queryParams);
        const endpoint = `fc-manager/v1/spaces?${searchParams.toString()}`;
        
        const result = await callRestAPI(endpoint, 'GET');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      // FluentCommunity: Create Post
      if (name === 'fc_create_post') {
        const result = await callRestAPI('fc-manager/v1/posts', 'POST', args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      // FluentCommunity: List Posts
      if (name === 'fc_list_posts') {
        const { space_id, user_id, status, limit = 20, offset = 0 } = args;
        const queryParams = {};
        if (space_id) queryParams.space_id = space_id;
        if (user_id) queryParams.user_id = user_id;
        if (status) queryParams.status = status;
        queryParams.limit = limit;
        queryParams.offset = offset;

        const searchParams = new URLSearchParams(queryParams);
        const endpoint = `fc-manager/v1/posts?${searchParams.toString()}`;
        
        const result = await callRestAPI(endpoint, 'GET');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      throw new Error(`Unknown tool: ${name}`);

    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }

  throw new Error(`Unknown method: ${method}`);
}

/**
 * Main MCP Server Loop
 */
async function main() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', async (line) => {
    try {
      const message = JSON.parse(line);
      const response = await handleMessage(message);
      
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: message.id,
        result: response
      }));
    } catch (error) {
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: message?.id || null,
        error: {
          code: -32603,
          message: error.message
        }
      }));
    }
  });

  // Keep process alive
  process.stdin.resume();
}

main().catch(console.error);
