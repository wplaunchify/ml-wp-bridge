#!/usr/bin/env node

/**
 * ML Cursor MCP Server
 * Version: 2.0.0
 * 
 * Proper MCP server that exposes all 173 WordPress operations as real MCP tools.
 * This file is intentionally minimal and generic - all the real logic lives in
 * the WordPress plugin (ml-cursor-mcp.php).
 * 
 * Architecture:
 * - This file: Generic MCP wrapper (forwards requests to WordPress)
 * - WordPress plugin: All the actual implementation and secret sauce
 * 
 * Without the WordPress plugin, this file is useless.
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

// Get configuration from environment
const WP_URL = process.env.WP_URL;
const WP_API_KEY = process.env.WP_API_KEY;

if (!WP_URL || !WP_API_KEY) {
  console.error('ERROR: Missing required environment variables');
  console.error('Required: WP_URL and WP_API_KEY');
  console.error('Check your Cursor MCP configuration');
  process.exit(1);
}

// Base URL for WordPress REST API
const API_BASE = `${WP_URL}/wp-json/ml-cursor-mcp/v1`;

/**
 * Make authenticated request to WordPress REST API
 */
async function callWordPress(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'X-API-Key': WP_API_KEY,
      'Content-Type': 'application/json',
    },
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }
    
    return data;
  } catch (error) {
    throw new Error(`WordPress API error: ${error.message}`);
  }
}

/**
 * All 173 WordPress tools as MCP functions
 * Each tool just forwards to the WordPress REST API
 */

// ============================================================================
// POSTS
// ============================================================================

async function wp_create_post(params) {
  return await callWordPress('/posts', 'POST', params);
}

async function wp_list_posts(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/posts${query ? '?' + query : ''}`, 'GET');
}

async function wp_get_post(params) {
  return await callWordPress(`/posts/${params.id}`, 'GET');
}

async function wp_update_post(params) {
  const { id, ...body } = params;
  return await callWordPress(`/posts/${id}`, 'PUT', body);
}

async function wp_delete_post(params) {
  return await callWordPress(`/posts/${params.id}`, 'DELETE');
}

// ============================================================================
// PAGES
// ============================================================================

async function wp_create_page(params) {
  return await callWordPress('/pages', 'POST', params);
}

async function wp_list_pages(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/pages${query ? '?' + query : ''}`, 'GET');
}

async function wp_get_page(params) {
  return await callWordPress(`/pages/${params.id}`, 'GET');
}

async function wp_update_page(params) {
  const { id, ...body } = params;
  return await callWordPress(`/pages/${id}`, 'PUT', body);
}

async function wp_delete_page(params) {
  return await callWordPress(`/pages/${params.id}`, 'DELETE');
}

// ============================================================================
// SPENCE STYLE MANAGER (Custom HTML/CSS Pages)
// ============================================================================

async function wp_spence_list_pages(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/spence/list${query ? '?' + query : ''}`, 'GET');
}

async function wp_spence_get_page(params) {
  return await callWordPress(`/spence/get/${params.id}`, 'GET');
}

async function wp_spence_create_page(params) {
  return await callWordPress('/spence/create', 'POST', params);
}

async function wp_spence_update_page(params) {
  const { id, ...body } = params;
  return await callWordPress(`/spence/update/${id}`, 'POST', body);
}

async function wp_spence_edit(params) {
  const { id, ...body } = params;
  return await callWordPress(`/spence/edit/${id}`, 'POST', body);
}

// ============================================================================
// MEDIA
// ============================================================================

async function wp_upload_media_url(params) {
  return await callWordPress('/media/upload-url', 'POST', params);
}

async function wp_list_media(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/media${query ? '?' + query : ''}`, 'GET');
}

async function wp_get_media(params) {
  return await callWordPress(`/media/${params.id}`, 'GET');
}

async function wp_update_media(params) {
  const { id, ...body } = params;
  return await callWordPress(`/media/${id}`, 'PUT', body);
}

async function wp_delete_media(params) {
  return await callWordPress(`/media/${params.id}`, 'DELETE');
}

async function wp_set_featured_image(params) {
  return await callWordPress('/media/featured-image', 'POST', params);
}

async function wp_get_featured_image(params) {
  return await callWordPress(`/media/featured-image/${params.id}`, 'GET');
}

async function wp_upload_and_set_featured(params) {
  return await callWordPress('/media/upload-and-set-featured', 'POST', params);
}

// ============================================================================
// FILE SYSTEM
// ============================================================================

async function wp_fs_list(params) {
  return await callWordPress('/fs/list', 'POST', params);
}

async function wp_fs_read(params) {
  return await callWordPress('/fs/read', 'POST', params);
}

async function wp_fs_write(params) {
  return await callWordPress('/fs/write', 'POST', params);
}

async function wp_fs_delete(params) {
  return await callWordPress('/fs/delete', 'POST', params);
}

async function wp_fs_move(params) {
  return await callWordPress('/fs/move', 'POST', params);
}

async function wp_fs_copy(params) {
  return await callWordPress('/fs/copy', 'POST', params);
}

async function wp_fs_mkdir(params) {
  return await callWordPress('/fs/mkdir', 'POST', params);
}

// ============================================================================
// USERS
// ============================================================================

async function wp_list_users(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/users${query ? '?' + query : ''}`, 'GET');
}

async function wp_create_user(params) {
  return await callWordPress('/users', 'POST', params);
}

async function wp_get_user(params) {
  return await callWordPress(`/users/${params.id}`, 'GET');
}

async function wp_update_user(params) {
  const { id, ...body } = params;
  return await callWordPress(`/users/${id}`, 'PUT', body);
}

async function wp_delete_user(params) {
  return await callWordPress(`/users/${params.id}`, 'DELETE');
}

async function wp_change_password(params) {
  const { id, ...body } = params;
  return await callWordPress(`/users/${id}/password`, 'POST', body);
}

async function wp_change_user_role(params) {
  const { id, ...body } = params;
  return await callWordPress(`/users/${id}/role`, 'POST', body);
}

async function wp_get_user_meta(params) {
  return await callWordPress(`/users/${params.id}/meta`, 'GET');
}

async function wp_update_user_meta(params) {
  const { id, ...body } = params;
  return await callWordPress(`/users/${id}/meta`, 'POST', body);
}

async function wp_list_app_passwords(params) {
  return await callWordPress(`/users/${params.id}/application-passwords`, 'GET');
}

async function wp_create_app_password(params) {
  const { id, ...body } = params;
  return await callWordPress(`/users/${id}/application-passwords`, 'POST', body);
}

async function wp_delete_app_password(params) {
  return await callWordPress(`/users/${params.id}/application-passwords/${params.uuid}`, 'DELETE');
}

async function wp_list_roles(params) {
  return await callWordPress('/roles', 'GET');
}

async function wp_get_user_capabilities(params) {
  return await callWordPress(`/users/${params.id}/capabilities`, 'GET');
}

async function wp_get_user_sessions(params) {
  return await callWordPress(`/users/${params.id}/sessions`, 'GET');
}

async function wp_destroy_user_sessions(params) {
  return await callWordPress(`/users/${params.id}/sessions`, 'DELETE');
}

async function wp_get_user_profile(params) {
  return await callWordPress(`/users/${params.id}/profile`, 'GET');
}

async function wp_update_user_profile(params) {
  const { id, ...body } = params;
  return await callWordPress(`/users/${id}/profile`, 'POST', body);
}

async function wp_update_user_avatar(params) {
  const { id, ...body } = params;
  return await callWordPress(`/users/${id}/avatar`, 'POST', body);
}

async function wp_get_user_activity(params) {
  return await callWordPress(`/users/${params.id}/activity`, 'GET');
}

async function wp_export_user_data(params) {
  const { id, ...body } = params;
  return await callWordPress(`/users/${id}/export`, 'POST', body);
}

// ============================================================================
// DATABASE
// ============================================================================

async function wp_database_query(params) {
  return await callWordPress('/database/query', 'POST', params);
}

async function wp_database_backup(params) {
  return await callWordPress('/database/backup', 'POST', params);
}

async function wp_database_optimize(params) {
  return await callWordPress('/database/optimize', 'POST', params);
}

async function wp_database_list_tables(params) {
  return await callWordPress('/database/tables', 'GET');
}

async function wp_database_table_structure(params) {
  return await callWordPress('/database/table-structure', 'POST', params);
}

async function wp_database_table_info(params) {
  return await callWordPress('/database/table-info', 'POST', params);
}

async function wp_database_execute(params) {
  return await callWordPress('/database/execute', 'POST', params);
}

async function wp_database_export_sql(params) {
  return await callWordPress('/database/export-sql', 'POST', params);
}

async function wp_database_import_sql(params) {
  return await callWordPress('/database/import-sql', 'POST', params);
}

// ============================================================================
// SYSTEM
// ============================================================================

async function wp_list_cron_jobs(params) {
  return await callWordPress('/cron/jobs', 'GET');
}

async function wp_run_cron_job(params) {
  return await callWordPress('/cron/run', 'POST', params);
}

async function wp_list_transients(params) {
  return await callWordPress('/transients', 'GET');
}

async function wp_clear_transients(params) {
  return await callWordPress('/transients', 'DELETE');
}

async function wp_list_capabilities(params) {
  return await callWordPress('/capabilities', 'GET');
}

async function wp_export_content(params) {
  return await callWordPress('/export', 'POST', params);
}

async function wp_import_content(params) {
  return await callWordPress('/import', 'POST', params);
}

async function wp_security_scan(params) {
  return await callWordPress('/security/scan', 'POST', params);
}

async function wp_analyze_performance(params) {
  return await callWordPress('/performance/analyze', 'POST', params);
}

async function wp_create_backup(params) {
  return await callWordPress('/backup/create', 'POST', params);
}

async function wp_get_multisite_info(params) {
  return await callWordPress('/multisite/info', 'GET');
}

async function wp_view_debug_log(params) {
  return await callWordPress('/debug/log', 'GET');
}

// ============================================================================
// COMMENTS
// ============================================================================

async function wp_list_comments(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/comments${query ? '?' + query : ''}`, 'GET');
}

async function wp_moderate_comment(params) {
  const { id, ...body } = params;
  return await callWordPress(`/comments/${id}/moderate`, 'POST', body);
}

async function wp_reply_to_comment(params) {
  const { id, ...body } = params;
  return await callWordPress(`/comments/${id}/reply`, 'POST', body);
}

async function wp_delete_comment(params) {
  return await callWordPress(`/comments/${params.id}`, 'DELETE');
}

// ============================================================================
// CATEGORIES & TAGS
// ============================================================================

async function wp_list_categories(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/categories${query ? '?' + query : ''}`, 'GET');
}

async function wp_create_category(params) {
  return await callWordPress('/categories', 'POST', params);
}

async function wp_update_category(params) {
  const { id, ...body } = params;
  return await callWordPress(`/categories/${id}`, 'PUT', body);
}

async function wp_delete_category(params) {
  return await callWordPress(`/categories/${params.id}`, 'DELETE');
}

async function wp_list_tags(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/tags${query ? '?' + query : ''}`, 'GET');
}

async function wp_create_tag(params) {
  return await callWordPress('/tags', 'POST', params);
}

async function wp_update_tag(params) {
  const { id, ...body } = params;
  return await callWordPress(`/tags/${id}`, 'PUT', body);
}

async function wp_delete_tag(params) {
  return await callWordPress(`/tags/${params.id}`, 'DELETE');
}

// ============================================================================
// PLUGINS
// ============================================================================

async function wp_list_plugins(params) {
  return await callWordPress('/plugins', 'GET');
}

async function wp_manage_plugin(params) {
  return await callWordPress('/plugins/manage', 'POST', params);
}

async function wp_install_plugin(params) {
  return await callWordPress('/plugins/install', 'POST', params);
}

async function wp_delete_plugin(params) {
  return await callWordPress('/plugins/delete', 'POST', params);
}

async function wp_update_plugin(params) {
  return await callWordPress('/plugins/update', 'POST', params);
}

async function wp_activate_plugin(params) {
  return await callWordPress('/plugins/activate', 'POST', params);
}

async function wp_deactivate_plugin(params) {
  return await callWordPress('/plugins/deactivate', 'POST', params);
}

async function wp_create_plugin(params) {
  return await callWordPress('/plugins/create', 'POST', params);
}

// ============================================================================
// THEMES
// ============================================================================

async function wp_list_themes(params) {
  return await callWordPress('/themes', 'GET');
}

async function wp_activate_theme(params) {
  return await callWordPress('/themes/activate', 'POST', params);
}

async function wp_install_theme(params) {
  return await callWordPress('/themes/install', 'POST', params);
}

async function wp_delete_theme(params) {
  return await callWordPress('/themes/delete', 'POST', params);
}

// ============================================================================
// SETTINGS
// ============================================================================

async function wp_get_general_settings(params) {
  return await callWordPress('/settings/general', 'GET');
}

async function wp_update_general_settings(params) {
  return await callWordPress('/settings/general', 'POST', params);
}

async function wp_get_reading_settings(params) {
  return await callWordPress('/settings/reading', 'GET');
}

async function wp_update_reading_settings(params) {
  return await callWordPress('/settings/reading', 'POST', params);
}

async function wp_get_writing_settings(params) {
  return await callWordPress('/settings/writing', 'GET');
}

async function wp_update_writing_settings(params) {
  return await callWordPress('/settings/writing', 'POST', params);
}

async function wp_get_discussion_settings(params) {
  return await callWordPress('/settings/discussion', 'GET');
}

async function wp_update_discussion_settings(params) {
  return await callWordPress('/settings/discussion', 'POST', params);
}

async function wp_get_media_settings(params) {
  return await callWordPress('/settings/media', 'GET');
}

async function wp_update_media_settings(params) {
  return await callWordPress('/settings/media', 'POST', params);
}

async function wp_get_permalink_settings(params) {
  return await callWordPress('/settings/permalink', 'GET');
}

async function wp_update_permalink_settings(params) {
  return await callWordPress('/settings/permalink', 'POST', params);
}

async function wp_get_privacy_settings(params) {
  return await callWordPress('/settings/privacy', 'GET');
}

async function wp_update_privacy_settings(params) {
  return await callWordPress('/settings/privacy', 'POST', params);
}

// ============================================================================
// WOOCOMMERCE
// ============================================================================

async function wp_wc_list_products(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/woocommerce/products${query ? '?' + query : ''}`, 'GET');
}

async function wp_wc_create_product(params) {
  return await callWordPress('/woocommerce/products', 'POST', params);
}

async function wp_wc_get_product(params) {
  return await callWordPress(`/woocommerce/products/${params.id}`, 'GET');
}

async function wp_wc_update_product(params) {
  const { id, ...body } = params;
  return await callWordPress(`/woocommerce/products/${id}`, 'PUT', body);
}

async function wp_wc_delete_product(params) {
  return await callWordPress(`/woocommerce/products/${params.id}`, 'DELETE');
}

async function wp_wc_list_orders(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/woocommerce/orders${query ? '?' + query : ''}`, 'GET');
}

async function wp_wc_get_order(params) {
  return await callWordPress(`/woocommerce/orders/${params.id}`, 'GET');
}

async function wp_wc_update_order(params) {
  const { id, ...body } = params;
  return await callWordPress(`/woocommerce/orders/${id}`, 'PUT', body);
}

async function wp_wc_list_customers(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/woocommerce/customers${query ? '?' + query : ''}`, 'GET');
}

async function wp_wc_get_customer(params) {
  return await callWordPress(`/woocommerce/customers/${params.id}`, 'GET');
}

// ============================================================================
// CUSTOM POST TYPES & TAXONOMIES
// ============================================================================

async function wp_list_custom_post_types(params) {
  return await callWordPress('/custom-post-types', 'GET');
}

async function wp_create_custom_post_type(params) {
  return await callWordPress('/custom-post-types', 'POST', params);
}

async function wp_list_custom_posts(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/custom-posts${query ? '?' + query : ''}`, 'GET');
}

async function wp_create_custom_post(params) {
  return await callWordPress('/custom-posts', 'POST', params);
}

async function wp_get_custom_post(params) {
  return await callWordPress(`/custom-posts/${params.id}`, 'GET');
}

async function wp_update_custom_post(params) {
  const { id, ...body } = params;
  return await callWordPress(`/custom-posts/${id}`, 'PUT', body);
}

async function wp_delete_custom_post(params) {
  return await callWordPress(`/custom-posts/${params.id}`, 'DELETE');
}

async function wp_list_taxonomies(params) {
  return await callWordPress('/taxonomies', 'GET');
}

async function wp_create_taxonomy(params) {
  return await callWordPress('/taxonomies', 'POST', params);
}

async function wp_list_terms(params) {
  const query = new URLSearchParams(params || {}).toString();
  return await callWordPress(`/terms${query ? '?' + query : ''}`, 'GET');
}

async function wp_create_term(params) {
  return await callWordPress('/terms', 'POST', params);
}

async function wp_update_term(params) {
  const { id, ...body } = params;
  return await callWordPress(`/terms/${id}`, 'PUT', body);
}

async function wp_delete_term(params) {
  return await callWordPress(`/terms/${params.id}`, 'DELETE');
}

// ============================================================================
// MENUS & WIDGETS
// ============================================================================

async function wp_list_menus(params) {
  return await callWordPress('/menus', 'GET');
}

async function wp_create_menu(params) {
  return await callWordPress('/menus', 'POST', params);
}

async function wp_update_menu(params) {
  const { id, ...body } = params;
  return await callWordPress(`/menus/${id}`, 'PUT', body);
}

async function wp_delete_menu(params) {
  return await callWordPress(`/menus/${params.id}`, 'DELETE');
}

async function wp_list_menu_items(params) {
  return await callWordPress(`/menus/${params.menu_id}/items`, 'GET');
}

async function wp_add_menu_item(params) {
  const { menu_id, ...body } = params;
  return await callWordPress(`/menus/${menu_id}/items`, 'POST', body);
}

async function wp_list_widgets(params) {
  return await callWordPress('/widgets', 'GET');
}

async function wp_update_widget(params) {
  const { id, ...body } = params;
  return await callWordPress(`/widgets/${id}`, 'PUT', body);
}

async function wp_list_sidebars(params) {
  return await callWordPress('/sidebars', 'GET');
}

// ============================================================================
// SITE HEALTH & MONITORING
// ============================================================================

async function wp_get_site_health(params) {
  return await callWordPress('/health/status', 'GET');
}

async function wp_get_system_info(params) {
  return await callWordPress('/health/system-info', 'GET');
}

async function wp_check_updates(params) {
  return await callWordPress('/health/check-updates', 'GET');
}

async function wp_get_php_info(params) {
  return await callWordPress('/health/php-info', 'GET');
}

// ============================================================================
// MCP SERVER SETUP
// ============================================================================

// Map of all tool names to their functions
const TOOLS = {
  // Posts
  wp_create_post, wp_list_posts, wp_get_post, wp_update_post, wp_delete_post,
  // Pages
  wp_create_page, wp_list_pages, wp_get_page, wp_update_page, wp_delete_page,
  // Spence Style
  wp_spence_list_pages, wp_spence_get_page, wp_spence_create_page, 
  wp_spence_update_page, wp_spence_edit,
  // Media
  wp_upload_media_url, wp_list_media, wp_get_media, wp_update_media, 
  wp_delete_media, wp_set_featured_image, wp_get_featured_image, 
  wp_upload_and_set_featured,
  // File System
  wp_fs_list, wp_fs_read, wp_fs_write, wp_fs_delete, wp_fs_move, 
  wp_fs_copy, wp_fs_mkdir,
  // Users
  wp_list_users, wp_create_user, wp_get_user, wp_update_user, wp_delete_user,
  wp_change_password, wp_change_user_role, wp_get_user_meta, wp_update_user_meta,
  wp_list_app_passwords, wp_create_app_password, wp_delete_app_password,
  wp_list_roles, wp_get_user_capabilities, wp_get_user_sessions,
  wp_destroy_user_sessions, wp_get_user_profile, wp_update_user_profile,
  wp_update_user_avatar, wp_get_user_activity, wp_export_user_data,
  // Database
  wp_database_query, wp_database_backup, wp_database_optimize,
  wp_database_list_tables, wp_database_table_structure, wp_database_table_info,
  wp_database_execute, wp_database_export_sql, wp_database_import_sql,
  // System
  wp_list_cron_jobs, wp_run_cron_job, wp_list_transients, wp_clear_transients,
  wp_list_capabilities, wp_export_content, wp_import_content,
  wp_security_scan, wp_analyze_performance, wp_create_backup,
  wp_get_multisite_info, wp_view_debug_log,
  // Comments
  wp_list_comments, wp_moderate_comment, wp_reply_to_comment, wp_delete_comment,
  // Categories & Tags
  wp_list_categories, wp_create_category, wp_update_category, wp_delete_category,
  wp_list_tags, wp_create_tag, wp_update_tag, wp_delete_tag,
  // Plugins
  wp_list_plugins, wp_manage_plugin, wp_install_plugin, wp_delete_plugin,
  wp_update_plugin, wp_activate_plugin, wp_deactivate_plugin, wp_create_plugin,
  // Themes
  wp_list_themes, wp_activate_theme, wp_install_theme, wp_delete_theme,
  // Settings
  wp_get_general_settings, wp_update_general_settings,
  wp_get_reading_settings, wp_update_reading_settings,
  wp_get_writing_settings, wp_update_writing_settings,
  wp_get_discussion_settings, wp_update_discussion_settings,
  wp_get_media_settings, wp_update_media_settings,
  wp_get_permalink_settings, wp_update_permalink_settings,
  wp_get_privacy_settings, wp_update_privacy_settings,
  // WooCommerce
  wp_wc_list_products, wp_wc_create_product, wp_wc_get_product,
  wp_wc_update_product, wp_wc_delete_product, wp_wc_list_orders,
  wp_wc_get_order, wp_wc_update_order, wp_wc_list_customers, wp_wc_get_customer,
  // Custom Post Types
  wp_list_custom_post_types, wp_create_custom_post_type,
  wp_list_custom_posts, wp_create_custom_post, wp_get_custom_post,
  wp_update_custom_post, wp_delete_custom_post,
  // Taxonomies
  wp_list_taxonomies, wp_create_taxonomy, wp_list_terms,
  wp_create_term, wp_update_term, wp_delete_term,
  // Menus & Widgets
  wp_list_menus, wp_create_menu, wp_update_menu, wp_delete_menu,
  wp_list_menu_items, wp_add_menu_item, wp_list_widgets,
  wp_update_widget, wp_list_sidebars,
  // Site Health
  wp_get_site_health, wp_get_system_info, wp_check_updates, wp_get_php_info,
};

// Tool descriptions for MCP
const TOOL_DESCRIPTIONS = {
  wp_create_post: 'Create a new WordPress post',
  wp_list_posts: 'List all posts',
  wp_get_post: 'Get a single post by ID',
  wp_update_post: 'Update an existing post',
  wp_delete_post: 'Delete a post',
  wp_create_page: 'Create a basic WordPress page (no Spence Style)',
  wp_list_pages: 'List all pages',
  wp_get_page: 'Get a single page by ID',
  wp_update_page: 'Update a basic WordPress page (no Spence Style)',
  wp_delete_page: 'Delete a page',
  wp_spence_list_pages: 'List pages with Spence Style custom HTML/CSS',
  wp_spence_get_page: 'Get page with Spence Style meta fields',
  wp_spence_create_page: 'Create page with custom HTML/CSS (Spence Style)',
  wp_spence_update_page: 'Update page with custom HTML/CSS (Spence Style)',
  wp_spence_edit: 'Surgical find/replace edit in Spence Style HTML or CSS',
  wp_upload_media_url: 'Upload media from URL',
  wp_list_media: 'List all media',
  wp_get_media: 'Get media by ID',
  wp_update_media: 'Update media metadata',
  wp_delete_media: 'Delete media',
  wp_set_featured_image: 'Set featured image for post/page',
  wp_get_featured_image: 'Get featured image for post/page',
  wp_upload_and_set_featured: 'Upload and set as featured image',
  wp_fs_list: 'List files in directory',
  wp_fs_read: 'Read file contents',
  wp_fs_write: 'Write file contents',
  wp_fs_delete: 'Delete file',
  wp_fs_move: 'Move/rename file',
  wp_fs_copy: 'Copy file',
  wp_fs_mkdir: 'Create directory',
  wp_list_users: 'List all users',
  wp_create_user: 'Create new user',
  wp_get_user: 'Get user by ID',
  wp_update_user: 'Update user',
  wp_delete_user: 'Delete user',
  wp_change_password: 'Change user password',
  wp_change_user_role: 'Change user role',
  wp_get_user_meta: 'Get user metadata',
  wp_update_user_meta: 'Update user metadata',
  wp_list_app_passwords: 'List application passwords',
  wp_create_app_password: 'Create application password',
  wp_delete_app_password: 'Delete application password',
  wp_list_roles: 'List all user roles',
  wp_get_user_capabilities: 'Get user capabilities',
  wp_get_user_sessions: 'Get user sessions',
  wp_destroy_user_sessions: 'Destroy all user sessions',
  wp_get_user_profile: 'Get user profile',
  wp_update_user_profile: 'Update user profile',
  wp_update_user_avatar: 'Update user avatar',
  wp_get_user_activity: 'Get user activity',
  wp_export_user_data: 'Export user data',
  wp_database_query: 'Execute database query (SELECT only)',
  wp_database_backup: 'Create database backup',
  wp_database_optimize: 'Optimize database tables',
  wp_database_list_tables: 'List all database tables',
  wp_database_table_structure: 'Get table structure',
  wp_database_table_info: 'Get table information',
  wp_database_execute: 'Execute database query (INSERT/UPDATE/DELETE)',
  wp_database_export_sql: 'Export database as SQL',
  wp_database_import_sql: 'Import SQL file',
  wp_list_cron_jobs: 'List scheduled cron jobs',
  wp_run_cron_job: 'Run cron job immediately',
  wp_list_transients: 'List all transients',
  wp_clear_transients: 'Clear expired transients',
  wp_list_capabilities: 'List all capabilities',
  wp_export_content: 'Export content',
  wp_import_content: 'Import content',
  wp_security_scan: 'Run security scan',
  wp_analyze_performance: 'Analyze site performance',
  wp_create_backup: 'Create full site backup',
  wp_get_multisite_info: 'Get multisite information',
  wp_view_debug_log: 'View debug log',
  wp_list_comments: 'List all comments',
  wp_moderate_comment: 'Moderate comment (approve/spam/trash)',
  wp_reply_to_comment: 'Reply to comment',
  wp_delete_comment: 'Delete comment',
  wp_list_categories: 'List all categories',
  wp_create_category: 'Create new category',
  wp_update_category: 'Update category',
  wp_delete_category: 'Delete category',
  wp_list_tags: 'List all tags',
  wp_create_tag: 'Create new tag',
  wp_update_tag: 'Update tag',
  wp_delete_tag: 'Delete tag',
  wp_list_plugins: 'List all plugins',
  wp_manage_plugin: 'Manage plugin (activate/deactivate)',
  wp_install_plugin: 'Install plugin from WordPress.org',
  wp_delete_plugin: 'Delete plugin',
  wp_update_plugin: 'Update plugin',
  wp_activate_plugin: 'Activate plugin',
  wp_deactivate_plugin: 'Deactivate plugin',
  wp_create_plugin: 'Create new plugin',
  wp_list_themes: 'List all themes',
  wp_activate_theme: 'Activate theme',
  wp_install_theme: 'Install theme from WordPress.org',
  wp_delete_theme: 'Delete theme',
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
  wp_wc_list_products: 'List WooCommerce products',
  wp_wc_create_product: 'Create WooCommerce product',
  wp_wc_get_product: 'Get WooCommerce product',
  wp_wc_update_product: 'Update WooCommerce product',
  wp_wc_delete_product: 'Delete WooCommerce product',
  wp_wc_list_orders: 'List WooCommerce orders',
  wp_wc_get_order: 'Get WooCommerce order',
  wp_wc_update_order: 'Update WooCommerce order',
  wp_wc_list_customers: 'List WooCommerce customers',
  wp_wc_get_customer: 'Get WooCommerce customer',
  wp_list_custom_post_types: 'List custom post types',
  wp_create_custom_post_type: 'Create custom post type',
  wp_list_custom_posts: 'List custom posts',
  wp_create_custom_post: 'Create custom post',
  wp_get_custom_post: 'Get custom post',
  wp_update_custom_post: 'Update custom post',
  wp_delete_custom_post: 'Delete custom post',
  wp_list_taxonomies: 'List all taxonomies',
  wp_create_taxonomy: 'Create custom taxonomy',
  wp_list_terms: 'List taxonomy terms',
  wp_create_term: 'Create taxonomy term',
  wp_update_term: 'Update taxonomy term',
  wp_delete_term: 'Delete taxonomy term',
  wp_list_menus: 'List all menus',
  wp_create_menu: 'Create new menu',
  wp_update_menu: 'Update menu',
  wp_delete_menu: 'Delete menu',
  wp_list_menu_items: 'List menu items',
  wp_add_menu_item: 'Add menu item',
  wp_list_widgets: 'List all widgets',
  wp_update_widget: 'Update widget',
  wp_list_sidebars: 'List all sidebars',
  wp_get_site_health: 'Get site health status',
  wp_get_system_info: 'Get system information',
  wp_check_updates: 'Check for available updates',
  wp_get_php_info: 'Get PHP information',
};

// Initialize MCP server
const server = new Server(
  {
    name: 'ml-wp-bridge',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle initialization request
server.setRequestHandler(InitializeRequestSchema, async (request) => {
  return {
    protocolVersion: '2024-11-05',
    serverInfo: {
      name: 'ml-wp-bridge',
      version: '2.0.0',
    },
    capabilities: {
      tools: {},
    },
  };
});

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = Object.keys(TOOLS).map(name => ({
    name,
    description: TOOL_DESCRIPTIONS[name] || name,
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Resource ID' },
        params: { type: 'object', description: 'Additional parameters' },
      },
    },
  }));

  return { tools };
});

// Handle call tool request
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
  console.error('ML Cursor MCP Server v2.0.0 running');
  console.error(`Connected to: ${WP_URL}`);
  console.error(`Tools available: ${Object.keys(TOOLS).length}`);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
