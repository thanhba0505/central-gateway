# Central Gateway REST API Reference

Interactive OpenAPI documentation is live at [central-gateway-server.onrender.com/api/docs](https://central-gateway-server.onrender.com/api/docs).

All requests to `/api/v1/notifications/*` must include:

```http
Authorization: Bearer <GATEWAY_SECRET_KEY>
Content-Type: application/json
```

---

## 1. Notification Endpoints

### 1.1 Deploy Notification

- **Endpoint**: `POST /api/v1/notifications/slack/deploy`
- **Description**: Dispatches a production deployment status card to `#deployments`.
- **Payload Schema**:
  ```typescript
  interface SendDeployNotificationDto {
    project: string; // e.g. "wonderlab", "central-gateway"
    status: 'STARTED' | 'SUCCESS' | 'FAIL';
    version: string; // e.g. "0.16.0"
    commit: string; // SHA hash
    target: string; // e.g. "Production (all)", "Production (server)"
    actor?: string; // GitHub username
    runUrl?: string; // Link to Actions run
    appUrl?: string; // Link to live web application
    healthUrl?: string; // Link to live health probe
  }
  ```

---

### 1.2 CI Pipeline Notification

- **Endpoint**: `POST /api/v1/notifications/slack/ci`
- **Description**: Dispatches a CI quality verification result card to `#ci-cd`.
- **Payload Schema**:
  ```typescript
  interface SendCiNotificationDto {
    project: string;
    status: 'SUCCESS' | 'FAIL';
    branch: string;
    commit: string;
    trigger?: string; // e.g. "push by @thanhba0505"
    pipeline: Record<string, 'SUCCESS' | 'FAIL' | 'SKIPPED'>;
    runUrl?: string;
  }
  ```

---

### 1.3 Git Activity Notification

- **Endpoint**: `POST /api/v1/notifications/slack/git`
- **Description**: Dispatches commits, branches, and PR activities to `#git-activity`.
- **Payload Schema**:
  ```typescript
  interface SendGitNotificationDto {
    project: string;
    eventType: 'push' | 'branch_created' | 'pull_request';
    actor?: string;
    refName?: string;
    baseBranch?: string;
    headCommit?: string;
    commitCount?: string;
    commitLines?: string[];
    compareUrl?: string;
    prNumber?: string;
    prTitle?: string;
    prUrl?: string;
    prAction?: string;
    prMerged?: boolean;
    prHeadRef?: string;
    prBaseRef?: string;
  }
  ```

---

### 1.4 Community Feedback & Moderation

- **Endpoint**: `POST /api/v1/notifications/slack/community`
- **Description**: Dispatches user simulation proposals or comments to `#wonderlab-feedback` / `#wonderlab-comments`.
- **Payload Schema**:
  ```typescript
  interface SendCommunityNotificationDto {
    project: string;
    type: 'feedback' | 'comment';
    title: string;
    author: string;
    content: string;
    category?: string;
    actionUrl?: string;
    adminUrl?: string;
  }
  ```

---

### 1.5 System Test Dispatch

- **Endpoint**: `POST /api/v1/notifications/slack/test`
- **Description**: Test dispatch for sandbox simulation.
- **Payload Schema**:
  ```typescript
  interface SendTestNotificationDto {
    project: string;
    channelId?: string; // Optional target channel override
    message: string;
    eventType?: string;
  }
  ```

---

## 2. Management & Observability Endpoints

| Method | Endpoint                        | Description                                          |
| :----- | :------------------------------ | :--------------------------------------------------- |
| `GET`  | `/api/v1/health`                | Health probe (Liveness & Readiness)                  |
| `GET`  | `/api/v1/projects`              | List all registered projects and channel mappings    |
| `POST` | `/api/v1/projects`              | Register a new project                               |
| `PUT`  | `/api/v1/projects/:id/channels` | Update project channel mappings                      |
| `GET`  | `/api/v1/logs`                  | Query dispatch audit trail with pagination and stats |
