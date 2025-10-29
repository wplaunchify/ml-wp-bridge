# WP Bridge

Generic WordPress REST API bridge.

## Setup

```json
{
  "mcpServers": {
    "wp-bridge": {
      "command": "npx",
      "args": ["-y", "github:wplaunchify/ml-wp-bridge"],
      "env": {
        "WP_URL": "https://yoursite.com",
        "WP_USERNAME": "username",
        "WP_PASSWORD": "app-password"
      }
    }
  }
}
```

Requires WordPress Application Password.

