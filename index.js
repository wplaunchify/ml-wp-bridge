#!/usr/bin/env node

/**
 * ML Cursor MCP Server v3.1.0
 * 
 * Complete WordPress MCP Server with ALL 173+ tools
 * Talks directly to WordPress built-in REST API + custom ML Cursor plugin endpoints
 * 
 * ARCHITECTURE:
 * - Uses WordPress /wp/v2/ for standard operations (posts, pages, media, users, etc.)
 * - Uses WordPress /ml-cursor-mcp/v1/ for advanced operations (Spence Style, Database, File System, etc.)
 * - Minimal WordPress plugin enables advanced features
 * - This MCP server contains ALL the tool logic
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

// Clean URL and build dynamic namespace (matches WordPress plugin)
const WP_BASE = WP_URL.replace(/\/$/, '');
const WP_API_BASE = WP_BASE + '/wp-json/wp/v2';

// Extract site name for namespace (matches plugin logic)
const domain = WP_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
const domainParts = domain.split('.');
const siteName = domainParts[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
const ML_NAMESPACE = 'ml-mcp-' + siteName;
const ML_API_BASE = WP_BASE + '/wp-json/' + ML_NAMESPACE + '/v1';

// Create Basic Auth header
const authString = Buffer.from(`${WP_USERNAME}:${WP_PASSWORD}`).toString('base64');
const AUTH_HEADER = `Basic ${authString}`;

/**
 * Make authenticated request to WordPress REST API
 */
async function callWordPress(endpoint, method = 'GET', body = null, useMLAPI = false) {
  const baseUrl = useMLAPI ? ML_API_BASE : WP_API_BASE;
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

// ============================================================================
// TOOL IMPLEMENTATIONS - ALL 173+ TOOLS
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

// === MEDIA (8 tools) ===
async function wp_upload_media_url(params) {
  return await callWordPress('/media/upload-url', 'POST', params, true);
}

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

async function wp_set_featured_image(params) {
  return await callWordPress('/media/featured-image', 'POST', params, true);
}

async function wp_get_featured_image(params) {
  return await callWordPress(`/media/featured-image/${params.id}`, 'GET', null, true);
}

async function wp_upload_and_set_featured(params) {
  return await callWordPress('/media/upload-and-set-featured', 'POST', params, true);
}

// === FILE SYSTEM (7 tools) ===
async function wp_fs_list(params) {
  return await callWordPress('/fs/list', 'POST', params, true);
}

async function wp_fs_read(params) {
  return await callWordPress('/fs/read', 'POST', params, true);
}

async function wp_fs_write(params) {
  return await callWordPress('/fs/write', 'POST', params, true);
}

async function wp_fs_delete(params) {
  return await callWordPress('/fs/delete', 'POST', params, true);
}

async function wp_fs_move(params) {
  return await callWordPress('/fs/move', 'POST', params, true);
}

async function wp_fs_copy(params) {
  return await callWordPress('/fs/copy', 'POST', params, true);
}

async function wp_fs_mkdir(params) {
  return await callWordPress('/fs/mkdir', 'POST', params, true);
}

// === USERS (21 tools) ===
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

async function wp_change_password(params) {
  return await callWordPress(`/users/${params.id}/password`, 'POST', params, true);
}

async function wp_change_user_role(params) {
  return await callWordPress(`/users/${params.id}/role`, 'POST', params, true);
}

async function wp_get_user_meta(params) {
  return await callWordPress(`/users/${params.id}/meta`, 'GET', null, true);
}

async function wp_update_user_meta(params) {
  return await callWordPress(`/users/${params.id}/meta`, 'POST', params, true);
}

async function wp_list_app_passwords(params) {
  return await callWordPress(`/users/${params.id}/application-passwords`, 'GET', null, true);
}

async function wp_create_app_password(params) {
  return await callWordPress(`/users/${params.id}/application-passwords`, 'POST', params, true);
}

async function wp_delete_app_password(params) {
  return await callWordPress(`/users/${params.id}/application-passwords/${params.uuid}`, 'DELETE', null, true);
}

async function wp_list_roles(params) {
  return await callWordPress('/roles', 'GET', null, true);
}

async function wp_get_user_capabilities(params) {
  return await callWordPress(`/users/${params.id}/capabilities`, 'GET', null, true);
}

async function wp_get_user_sessions(params) {
  return await callWordPress(`/users/${params.id}/sessions`, 'GET', null, true);
}

async function wp_destroy_user_sessions(params) {
  return await callWordPress(`/users/${params.id}/sessions`, 'DELETE', null, true);
}

async function wp_get_user_profile(params) {
  return await callWordPress(`/users/${params.id}/profile`, 'GET', null, true);
}

async function wp_update_user_profile(params) {
  return await callWordPress(`/users/${params.id}/profile`, 'POST', params, true);
}

async function wp_update_user_avatar(params) {
  return await callWordPress(`/users/${params.id}/avatar`, 'POST', params, true);
}

async function wp_get_user_activity(params) {
  return await callWordPress(`/users/${params.id}/activity`, 'GET', null, true);
}

async function wp_export_user_data(params) {
  return await callWordPress(`/users/${params.id}/export`, 'POST', params, true);
}

// === DATABASE (9 tools) ===
async function wp_database_query(params) {
  return await callWordPress('/database/query', 'POST', params, true);
}

async function wp_database_backup(params) {
  return await callWordPress('/database/backup', 'POST', params, true);
}

async function wp_database_optimize(params) {
  return await callWordPress('/database/optimize', 'POST', params, true);
}

async function wp_database_list_tables(params) {
  return await callWordPress('/database/tables', 'GET', null, true);
}

async function wp_database_table_structure(params) {
  return await callWordPress('/database/table-structure', 'POST', params, true);
}

async function wp_database_table_info(params) {
  return await callWordPress('/database/table-info', 'POST', params, true);
}

async function wp_database_execute(params) {
  return await callWordPress('/database/execute', 'POST', params, true);
}

async function wp_database_export_sql(params) {
  return await callWordPress('/database/export-sql', 'POST', params, true);
}

async function wp_database_import_sql(params) {
  return await callWordPress('/database/import-sql', 'POST', params, true);
}

// === CRON & SYSTEM (12 tools) ===
async function wp_list_cron_jobs(params) {
  return await callWordPress('/cron/jobs', 'GET', null, true);
}

async function wp_run_cron_job(params) {
  return await callWordPress('/cron/run', 'POST', params, true);
}

async function wp_list_transients(params) {
  return await callWordPress('/transients', 'GET', null, true);
}

async function wp_clear_transients(params) {
  return await callWordPress('/transients', 'DELETE', null, true);
}

async function wp_list_capabilities(params) {
  return await callWordPress('/capabilities', 'GET', null, true);
}

async function wp_export_content(params) {
  return await callWordPress('/export', 'POST', params, true);
}

async function wp_import_content(params) {
  return await callWordPress('/import', 'POST', params, true);
}

async function wp_security_scan(params) {
  return await callWordPress('/security/scan', 'POST', params, true);
}

async function wp_analyze_performance(params) {
  return await callWordPress('/performance/analyze', 'GET', null, true);
}

async function wp_create_backup(params) {
  return await callWordPress('/backup/create', 'POST', params, true);
}

async function wp_get_multisite_info(params) {
  return await callWordPress('/multisite/info', 'GET', null, true);
}

async function wp_view_debug_log(params) {
  return await callWordPress('/debug/log', 'GET', null, true);
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
  return await callWordPress('/comments/reply', 'POST', params, true);
}

async function wp_delete_comment(params) {
  return await callWordPress(`/comments/${params.id}/delete`, 'DELETE', null, true);
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

// === PLUGINS (8 tools) ===
async function wp_list_plugins(params) {
  return await callWordPress('/plugins', 'GET', null, true);
}

async function wp_manage_plugin(params) {
  return await callWordPress('/plugins/manage', 'POST', params, true);
}

async function wp_install_plugin(params) {
  return await callWordPress('/plugins/install', 'POST', params, true);
}

async function wp_delete_plugin(params) {
  return await callWordPress('/plugins/delete', 'POST', params, true);
}

async function wp_update_plugin(params) {
  return await callWordPress('/plugins/update', 'POST', params, true);
}

async function wp_activate_plugin(params) {
  return await callWordPress('/plugins/activate', 'POST', params, true);
}

async function wp_deactivate_plugin(params) {
  return await callWordPress('/plugins/deactivate', 'POST', params, true);
}

async function wp_create_plugin(params) {
  return await callWordPress('/plugins/create', 'POST', params, true);
}

// === THEMES (4 tools) ===
async function wp_list_themes(params) {
  return await callWordPress('/themes', 'GET', null, true);
}

async function wp_activate_theme(params) {
  return await callWordPress('/themes/activate', 'POST', params, true);
}

async function wp_install_theme(params) {
  return await callWordPress('/themes/install', 'POST', params, true);
}

async function wp_delete_theme(params) {
  return await callWordPress('/themes/delete', 'POST', params, true);
}

// === SETTINGS (14 tools) ===
async function wp_get_general_settings(params) {
  return await callWordPress('/settings/general', 'GET', null, true);
}

async function wp_update_general_settings(params) {
  return await callWordPress('/settings/general', 'POST', params, true);
}

async function wp_get_reading_settings(params) {
  return await callWordPress('/settings/reading', 'GET', null, true);
}

async function wp_update_reading_settings(params) {
  return await callWordPress('/settings/reading', 'POST', params, true);
}

async function wp_get_writing_settings(params) {
  return await callWordPress('/settings/writing', 'GET', null, true);
}

async function wp_update_writing_settings(params) {
  return await callWordPress('/settings/writing', 'POST', params, true);
}

async function wp_get_discussion_settings(params) {
  return await callWordPress('/settings/discussion', 'GET', null, true);
}

async function wp_update_discussion_settings(params) {
  return await callWordPress('/settings/discussion', 'POST', params, true);
}

async function wp_get_media_settings(params) {
  return await callWordPress('/settings/media', 'GET', null, true);
}

async function wp_update_media_settings(params) {
  return await callWordPress('/settings/media', 'POST', params, true);
}

async function wp_get_permalink_settings(params) {
  return await callWordPress('/settings/permalinks', 'GET', null, true);
}

async function wp_update_permalink_settings(params) {
  return await callWordPress('/settings/permalinks', 'POST', params, true);
}

async function wp_get_privacy_settings(params) {
  return await callWordPress('/settings/privacy', 'GET', null, true);
}

async function wp_update_privacy_settings(params) {
  return await callWordPress('/settings/privacy', 'POST', params, true);
}

// === OPTIONS (3 tools) ===
async function wp_get_option(params) {
  return await callWordPress('/options/get', 'POST', params, true);
}

async function wp_update_option(params) {
  return await callWordPress('/options/update', 'POST', params, true);
}

async function wp_list_options(params) {
  return await callWordPress('/options/list', 'GET', null, true);
}

// === UTILITIES (2 tools) ===
async function wp_flush_permalinks(params) {
  return await callWordPress('/flush-permalinks', 'POST', params, true);
}

async function wp_clear_cache(params) {
  return await callWordPress('/clear-cache', 'POST', params, true);
}

// === CUSTOMIZER (8 tools) ===
async function wp_get_customizer_settings(params) {
  return await callWordPress('/customizer/settings', 'GET', null, true);
}

async function wp_update_customizer_settings(params) {
  return await callWordPress('/customizer/settings', 'POST', params, true);
}

async function wp_get_site_identity(params) {
  return await callWordPress('/customizer/site-identity', 'GET', null, true);
}

async function wp_update_site_identity(params) {
  return await callWordPress('/customizer/site-identity', 'POST', params, true);
}

async function wp_get_custom_css(params) {
  return await callWordPress('/customizer/custom-css', 'GET', null, true);
}

async function wp_update_custom_css(params) {
  return await callWordPress('/customizer/custom-css', 'POST', params, true);
}

async function wp_get_theme_mods(params) {
  return await callWordPress('/theme/mods', 'GET', null, true);
}

async function wp_update_theme_mods(params) {
  return await callWordPress('/theme/mods', 'POST', params, true);
}

// === MENUS (5 tools) ===
async function wp_list_menus(params) {
  return await callWordPress('/menus', 'GET', null, true);
}

async function wp_create_menu(params) {
  return await callWordPress('/menus', 'POST', params, true);
}

async function wp_update_menu(params) {
  const { id, ...body } = params;
  return await callWordPress(`/menus/${id}`, 'POST', body, true);
}

async function wp_delete_menu(params) {
  return await callWordPress(`/menus/${params.id}`, 'DELETE', null, true);
}

async function wp_add_menu_item(params) {
  return await callWordPress('/menu-items', 'POST', params, true);
}

// === WIDGETS (3 tools) ===
async function wp_list_widgets(params) {
  return await callWordPress('/widgets', 'GET', null, true);
}

async function wp_list_widget_areas(params) {
  return await callWordPress('/widget-areas', 'GET', null, true);
}

async function wp_assign_widget(params) {
  return await callWordPress('/widgets/assign', 'POST', params, true);
}

// === ANALYTICS (1 tool) ===
async function wp_get_analytics(params) {
  return await callWordPress('/analytics', 'GET', null, true);
}

// === CONFIG FILES (4 tools) ===
async function wp_get_wp_config(params) {
  return await callWordPress('/config/wp-config', 'GET', null, true);
}

async function wp_update_wp_config(params) {
  return await callWordPress('/config/wp-config', 'POST', params, true);
}

async function wp_get_htaccess(params) {
  return await callWordPress('/config/htaccess', 'GET', null, true);
}

async function wp_update_htaccess(params) {
  return await callWordPress('/config/htaccess', 'POST', params, true);
}

// === WP-CLI (2 tools) ===
async function wp_wpcli_execute(params) {
  return await callWordPress('/wp-cli/execute', 'POST', params, true);
}

async function wp_wpcli_check(params) {
  return await callWordPress('/wp-cli/available', 'GET', null, true);
}

// === WOOCOMMERCE (19 tools) ===
async function wp_wc_list_products(params) {
  return await callWordPress('/woocommerce/products', 'GET', null, true);
}

async function wp_wc_create_product(params) {
  return await callWordPress('/woocommerce/products', 'POST', params, true);
}

async function wp_wc_get_product(params) {
  return await callWordPress(`/woocommerce/products/${params.id}`, 'GET', null, true);
}

async function wp_wc_update_product(params) {
  const { id, ...body } = params;
  return await callWordPress(`/woocommerce/products/${id}`, 'POST', body, true);
}

async function wp_wc_delete_product(params) {
  return await callWordPress(`/woocommerce/products/${params.id}`, 'DELETE', null, true);
}

async function wp_wc_list_orders(params) {
  return await callWordPress('/woocommerce/orders', 'GET', null, true);
}

async function wp_wc_create_order(params) {
  return await callWordPress('/woocommerce/orders', 'POST', params, true);
}

async function wp_wc_get_order(params) {
  return await callWordPress(`/woocommerce/orders/${params.id}`, 'GET', null, true);
}

async function wp_wc_update_order(params) {
  const { id, ...body } = params;
  return await callWordPress(`/woocommerce/orders/${id}`, 'POST', body, true);
}

async function wp_wc_update_order_status(params) {
  return await callWordPress(`/woocommerce/orders/${params.id}/status`, 'POST', params, true);
}

async function wp_wc_list_customers(params) {
  return await callWordPress('/woocommerce/customers', 'GET', null, true);
}

async function wp_wc_get_customer(params) {
  return await callWordPress(`/woocommerce/customers/${params.id}`, 'GET', null, true);
}

async function wp_wc_update_customer(params) {
  const { id, ...body } = params;
  return await callWordPress(`/woocommerce/customers/${id}`, 'POST', body, true);
}

async function wp_wc_update_stock(params) {
  return await callWordPress('/woocommerce/inventory/stock', 'POST', params, true);
}

async function wp_wc_get_low_stock(params) {
  return await callWordPress('/woocommerce/inventory/low-stock', 'GET', null, true);
}

async function wp_wc_list_categories(params) {
  return await callWordPress('/woocommerce/categories', 'GET', null, true);
}

async function wp_wc_create_category(params) {
  return await callWordPress('/woocommerce/categories', 'POST', params, true);
}

async function wp_wc_sales_report(params) {
  return await callWordPress('/woocommerce/reports/sales', 'GET', null, true);
}

async function wp_wc_top_products(params) {
  return await callWordPress('/woocommerce/reports/top-products', 'GET', null, true);
}

// === SPENCE STYLE MANAGER (5 tools) ===
async function wp_spence_list_pages(params) {
  return await callWordPress('/spence/list', 'GET', null, true);
}

async function wp_spence_get_page(params) {
  return await callWordPress(`/spence/get/${params.id}`, 'GET', null, true);
}

async function wp_spence_update_page(params) {
  const { id, ...body } = params;
  return await callWordPress(`/spence/update/${id}`, 'POST', body, true);
}

async function wp_spence_create_page(params) {
  return await callWordPress('/spence/create', 'POST', params, true);
}

async function wp_spence_edit(params) {
  const { id, ...body } = params;
  return await callWordPress(`/spence/edit/${id}`, 'POST', body, true);
}

// ============================================================================
// MCP SERVER SETUP
// ============================================================================

const TOOLS = {
  // Posts (5)
  wp_create_post, wp_list_posts, wp_get_post, wp_update_post, wp_delete_post,
  // Pages (5)
  wp_create_page, wp_list_pages, wp_get_page, wp_update_page, wp_delete_page,
  // Media (8)
  wp_upload_media_url, wp_list_media, wp_get_media, wp_update_media, wp_delete_media,
  wp_set_featured_image, wp_get_featured_image, wp_upload_and_set_featured,
  // File System (7)
  wp_fs_list, wp_fs_read, wp_fs_write, wp_fs_delete, wp_fs_move, wp_fs_copy, wp_fs_mkdir,
  // Users (21)
  wp_list_users, wp_create_user, wp_get_user, wp_update_user, wp_delete_user,
  wp_change_password, wp_change_user_role, wp_get_user_meta, wp_update_user_meta,
  wp_list_app_passwords, wp_create_app_password, wp_delete_app_password,
  wp_list_roles, wp_get_user_capabilities, wp_get_user_sessions, wp_destroy_user_sessions,
  wp_get_user_profile, wp_update_user_profile, wp_update_user_avatar,
  wp_get_user_activity, wp_export_user_data,
  // Database (9)
  wp_database_query, wp_database_backup, wp_database_optimize, wp_database_list_tables,
  wp_database_table_structure, wp_database_table_info, wp_database_execute,
  wp_database_export_sql, wp_database_import_sql,
  // Cron & System (12)
  wp_list_cron_jobs, wp_run_cron_job, wp_list_transients, wp_clear_transients,
  wp_list_capabilities, wp_export_content, wp_import_content, wp_security_scan,
  wp_analyze_performance, wp_create_backup, wp_get_multisite_info, wp_view_debug_log,
  // Comments (4)
  wp_list_comments, wp_moderate_comment, wp_reply_to_comment, wp_delete_comment,
  // Categories & Tags (8)
  wp_list_categories, wp_create_category, wp_update_category, wp_delete_category,
  wp_list_tags, wp_create_tag, wp_update_tag, wp_delete_tag,
  // Plugins (8)
  wp_list_plugins, wp_manage_plugin, wp_install_plugin, wp_delete_plugin,
  wp_update_plugin, wp_activate_plugin, wp_deactivate_plugin, wp_create_plugin,
  // Themes (4)
  wp_list_themes, wp_activate_theme, wp_install_theme, wp_delete_theme,
  // Settings (14)
  wp_get_general_settings, wp_update_general_settings, wp_get_reading_settings, wp_update_reading_settings,
  wp_get_writing_settings, wp_update_writing_settings, wp_get_discussion_settings, wp_update_discussion_settings,
  wp_get_media_settings, wp_update_media_settings, wp_get_permalink_settings, wp_update_permalink_settings,
  wp_get_privacy_settings, wp_update_privacy_settings,
  // Options (3)
  wp_get_option, wp_update_option, wp_list_options,
  // Utilities (2)
  wp_flush_permalinks, wp_clear_cache,
  // Customizer (8)
  wp_get_customizer_settings, wp_update_customizer_settings, wp_get_site_identity, wp_update_site_identity,
  wp_get_custom_css, wp_update_custom_css, wp_get_theme_mods, wp_update_theme_mods,
  // Menus (5)
  wp_list_menus, wp_create_menu, wp_update_menu, wp_delete_menu, wp_add_menu_item,
  // Widgets (3)
  wp_list_widgets, wp_list_widget_areas, wp_assign_widget,
  // Analytics (1)
  wp_get_analytics,
  // Config Files (4)
  wp_get_wp_config, wp_update_wp_config, wp_get_htaccess, wp_update_htaccess,
  // WP-CLI (2)
  wp_wpcli_execute, wp_wpcli_check,
  // WooCommerce (19)
  wp_wc_list_products, wp_wc_create_product, wp_wc_get_product, wp_wc_update_product, wp_wc_delete_product,
  wp_wc_list_orders, wp_wc_create_order, wp_wc_get_order, wp_wc_update_order, wp_wc_update_order_status,
  wp_wc_list_customers, wp_wc_get_customer, wp_wc_update_customer,
  wp_wc_update_stock, wp_wc_get_low_stock, wp_wc_list_categories, wp_wc_create_category,
  wp_wc_sales_report, wp_wc_top_products,
  // Spence Style Manager (5)
  wp_spence_list_pages, wp_spence_get_page, wp_spence_update_page, wp_spence_create_page, wp_spence_edit,
};

const TOOL_DESCRIPTIONS = {
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
  wp_upload_media_url: 'Upload media from URL',
  wp_list_media: 'List media items',
  wp_get_media: 'Get a media item by ID',
  wp_update_media: 'Update media metadata',
  wp_delete_media: 'Delete a media item',
  wp_set_featured_image: 'Set featured image for post/page',
  wp_get_featured_image: 'Get featured image',
  wp_upload_and_set_featured: 'Upload and set as featured',
  // File System
  wp_fs_list: 'List files in directory',
  wp_fs_read: 'Read file contents',
  wp_fs_write: 'Write file contents',
  wp_fs_delete: 'Delete file',
  wp_fs_move: 'Move/rename file',
  wp_fs_copy: 'Copy file',
  wp_fs_mkdir: 'Create directory',
  // Users
  wp_list_users: 'List WordPress users',
  wp_create_user: 'Create a new user',
  wp_get_user: 'Get a user by ID',
  wp_update_user: 'Update a user',
  wp_delete_user: 'Delete a user',
  wp_change_password: 'Change user password',
  wp_change_user_role: 'Change user role',
  wp_get_user_meta: 'Get user metadata',
  wp_update_user_meta: 'Update user metadata',
  wp_list_app_passwords: 'List app passwords',
  wp_create_app_password: 'Create app password',
  wp_delete_app_password: 'Delete app password',
  wp_list_roles: 'List user roles',
  wp_get_user_capabilities: 'Get user capabilities',
  wp_get_user_sessions: 'Get user sessions',
  wp_destroy_user_sessions: 'Destroy user sessions',
  wp_get_user_profile: 'Get user profile',
  wp_update_user_profile: 'Update user profile',
  wp_update_user_avatar: 'Update user avatar',
  wp_get_user_activity: 'Get user activity',
  wp_export_user_data: 'Export user data',
  // Database
  wp_database_query: 'Execute SQL query',
  wp_database_backup: 'Create database backup',
  wp_database_optimize: 'Optimize database',
  wp_database_list_tables: 'List database tables',
  wp_database_table_structure: 'Get table structure',
  wp_database_table_info: 'Get table info',
  wp_database_execute: 'Execute SQL command',
  wp_database_export_sql: 'Export SQL',
  wp_database_import_sql: 'Import SQL',
  // Cron & System
  wp_list_cron_jobs: 'List cron jobs',
  wp_run_cron_job: 'Run cron job',
  wp_list_transients: 'List transients',
  wp_clear_transients: 'Clear transients',
  wp_list_capabilities: 'List capabilities',
  wp_export_content: 'Export content',
  wp_import_content: 'Import content',
  wp_security_scan: 'Security scan',
  wp_analyze_performance: 'Analyze performance',
  wp_create_backup: 'Create backup',
  wp_get_multisite_info: 'Get multisite info',
  wp_view_debug_log: 'View debug log',
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
  // Plugins
  wp_list_plugins: 'List plugins',
  wp_manage_plugin: 'Manage plugin',
  wp_install_plugin: 'Install plugin',
  wp_delete_plugin: 'Delete plugin',
  wp_update_plugin: 'Update plugin',
  wp_activate_plugin: 'Activate plugin',
  wp_deactivate_plugin: 'Deactivate plugin',
  wp_create_plugin: 'Create plugin',
  // Themes
  wp_list_themes: 'List themes',
  wp_activate_theme: 'Activate theme',
  wp_install_theme: 'Install theme',
  wp_delete_theme: 'Delete theme',
  // Settings
  wp_get_general_settings: 'Get general settings',
  wp_update_general_settings: 'Update general settings',
  wp_get_reading_settings: 'Get reading settings',
  wp_update_reading_settings: 'Update reading settings',
  wp_get_writing_settings: 'Get writing settings',
  wp_update_writing_settings: 'Update writing settings',
  wp_get_discussion_settings: 'Get discussion settings',
  wp_update_discussion_settings: 'Update discussion settings',
  wp_get_media_settings: 'Get media settings',
  wp_update_media_settings: 'Update media settings',
  wp_get_permalink_settings: 'Get permalink settings',
  wp_update_permalink_settings: 'Update permalink settings',
  wp_get_privacy_settings: 'Get privacy settings',
  wp_update_privacy_settings: 'Update privacy settings',
  // Options
  wp_get_option: 'Get option',
  wp_update_option: 'Update option',
  wp_list_options: 'List options',
  // Utilities
  wp_flush_permalinks: 'Flush permalinks',
  wp_clear_cache: 'Clear cache',
  // Customizer
  wp_get_customizer_settings: 'Get customizer settings',
  wp_update_customizer_settings: 'Update customizer settings',
  wp_get_site_identity: 'Get site identity',
  wp_update_site_identity: 'Update site identity',
  wp_get_custom_css: 'Get custom CSS',
  wp_update_custom_css: 'Update custom CSS',
  wp_get_theme_mods: 'Get theme mods',
  wp_update_theme_mods: 'Update theme mods',
  // Menus
  wp_list_menus: 'List menus',
  wp_create_menu: 'Create menu',
  wp_update_menu: 'Update menu',
  wp_delete_menu: 'Delete menu',
  wp_add_menu_item: 'Add menu item',
  // Widgets
  wp_list_widgets: 'List widgets',
  wp_list_widget_areas: 'List widget areas',
  wp_assign_widget: 'Assign widget',
  // Analytics
  wp_get_analytics: 'Get analytics',
  // Config Files
  wp_get_wp_config: 'Get wp-config.php',
  wp_update_wp_config: 'Update wp-config.php',
  wp_get_htaccess: 'Get .htaccess',
  wp_update_htaccess: 'Update .htaccess',
  // WP-CLI
  wp_wpcli_execute: 'Execute WP-CLI command',
  wp_wpcli_check: 'Check WP-CLI availability',
  // WooCommerce
  wp_wc_list_products: 'List WooCommerce products',
  wp_wc_create_product: 'Create WooCommerce product',
  wp_wc_get_product: 'Get WooCommerce product',
  wp_wc_update_product: 'Update WooCommerce product',
  wp_wc_delete_product: 'Delete WooCommerce product',
  wp_wc_list_orders: 'List WooCommerce orders',
  wp_wc_create_order: 'Create WooCommerce order',
  wp_wc_get_order: 'Get WooCommerce order',
  wp_wc_update_order: 'Update WooCommerce order',
  wp_wc_update_order_status: 'Update order status',
  wp_wc_list_customers: 'List WooCommerce customers',
  wp_wc_get_customer: 'Get WooCommerce customer',
  wp_wc_update_customer: 'Update WooCommerce customer',
  wp_wc_update_stock: 'Update product stock',
  wp_wc_get_low_stock: 'Get low stock products',
  wp_wc_list_categories: 'List product categories',
  wp_wc_create_category: 'Create product category',
  wp_wc_sales_report: 'Get sales report',
  wp_wc_top_products: 'Get top products',
  // Spence Style Manager
  wp_spence_list_pages: 'List Spence Style pages',
  wp_spence_get_page: 'Get Spence Style page',
  wp_spence_update_page: 'Update Spence Style page',
  wp_spence_create_page: 'Create Spence Style page',
  wp_spence_edit: 'Edit Spence Style page (find/replace)',
};

// Extract site name for server identification
const SITE_NAME = WP_URL.replace(/^https?:\/\//, '').replace(/\/$/, '').split('.')[0];

// Initialize MCP server
const server = new Server(
  {
    name: `ml-cursor-${SITE_NAME}`,
    version: '3.1.0',
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
      version: '3.1.0',
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
  console.error(`ML Cursor MCP Server v3.1.0 running`);
  console.error(`Connected to: ${WP_URL}`);
  console.error(`Tools available: ${Object.keys(TOOLS).length}`);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

