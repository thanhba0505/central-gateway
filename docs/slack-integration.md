# Slack Bot Setup & Integration Guide

## 1. Slack App Configuration

Central Gateway communicates with Slack using an authenticated Bot User (`xoxb-...`) via the official `@slack/web-api` client.

### Manifest Configuration (JSON)
To create or update the Slack application, use the following App Manifest in the [Slack API Console](https://api.slack.com/apps):

```json
{
  "display_information": {
    "name": "Central Gateway",
    "description": "Centralized Notification Gateway for Wonderlab & Microservices",
    "background_color": "#0284c7"
  },
  "features": {
    "bot_user": {
      "display_name": "Central Gateway",
      "always_online": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "chat:write",
        "chat:write.public",
        "chat:write.customize",
        "channels:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": false,
    "socket_mode_enabled": false,
    "is_hosted": false,
    "token_rotation_enabled": false
  }
}
```

---

## 2. OAuth Scopes Explained

| Scope | Category | Description |
| :--- | :---: | :--- |
| `chat:write` | Mandatory | Allows posting formatted messages into conversations. |
| `chat:write.public` | **Critical** | Allows the bot to post into **any public channel** without needing explicit `/invite @bot` invocation. |
| `chat:write.customize` | Recommended | Allows dynamically customizing sender name and avatar per upstream service. |
| `channels:read` | Optional | Allows listing public channels to discover names and IDs. |

---

## 3. Channel Topology & Routing

| Channel Name | Channel ID | Mapped Event Types | Primary Producer |
| :--- | :--- | :--- | :--- |
| **`#ci-cd`** | `C0CGL8EBFT2` | `ci` | Wonderlab CI, Gateway CI |
| **`#deployments`** | `C0CGL8EHU9E` | `deploy` | Wonderlab Deploy, Gateway Deploy |
| **`#git-activity`** | `C0CFRUJUCSE` | `git` | GitHub Push, Branches, PRs, Dependabot |
| **`#wonderlab-feedback`** | `C0CFAFQH739` | `feedback` | Wonderlab Community Simulation Proposals |
| **`#wonderlab-comments`** | `C0CFAFQRU2K` | `comment` | Wonderlab Community Discussions |

---

## 4. Upstream Integration Example (Python / GitHub Actions)

In your upstream project's GitHub Actions workflow:

```yaml
- name: Notify Slack Deployment Started
  env:
    GATEWAY_URL: 'https://central-gateway-server.onrender.com/api/v1'
    GATEWAY_SECRET_KEY: ${{ secrets.GATEWAY_SECRET_KEY }}
  run: |
    curl -s -X POST "$GATEWAY_URL/notifications/slack/deploy" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $GATEWAY_SECRET_KEY" \
      -d '{
        "project": "wonderlab",
        "status": "STARTED",
        "version": "0.16.0",
        "commit": "${{ github.sha }}",
        "target": "Production (all)",
        "actor": "${{ github.actor }}",
        "runUrl": "https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}"
      }'
```
