# 🌐 Central Gateway

<div align="center">

[![CI Pipeline](https://github.com/thanhba0505/central-gateway/actions/workflows/ci.yml/badge.svg)](https://github.com/thanhba0505/central-gateway/actions/workflows/ci.yml)
[![Latest Release](https://img.shields.io/github/v/release/thanhba0505/central-gateway?color=0284c7&label=Release)](https://github.com/thanhba0505/central-gateway/releases)
[![Client Control Plane](https://img.shields.io/badge/Client-Live%20on%20Render-10b981?logo=render)](https://central-gateway-client.onrender.com)
[![Server API](https://img.shields.io/badge/Server-API%20v1-0284c7?logo=nestjs)](https://central-gateway-server.onrender.com/api/v1)
[![Swagger OpenAPI](https://img.shields.io/badge/Docs-Swagger%20OpenAPI-85ea2d?logo=swagger)](https://central-gateway-server.onrender.com/api/docs)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Slack Bot](https://img.shields.io/badge/Slack-Central%20Gateway-4A154B?logo=slack)](https://slack.com)

**Centralized Notification Gateway & Cloud Infrastructure Hub for the ThanhBa Ecosystem**

[Live Dashboard](https://central-gateway-client.onrender.com) • [REST API Documentation](https://central-gateway-server.onrender.com/api/docs) • [Architecture Guide](docs/architecture.md) • [Slack Integration](docs/slack-integration.md)

</div>

---

## 📌 Executive Summary

**Central Gateway** is an enterprise-grade notification ingestion, formatting, and dispatch platform. It decouples all upstream applications (such as [Wonderlab](https://github.com/thanhba0505/Wonderlab), microservices, GitHub Actions workflows, and cron workers) from third-party communication vendor SDKs, authentication tokens, and channel topologies.

Instead of managing individual bot tokens, webhook secrets, and custom payload builders in every separate project, client services communicate via a standardized, authenticated REST API. Central Gateway dynamically routes events based on project slug and event type, formats rich visual Slack Block Kit cards, records persistent audit trails, and provides an interactive web-based Control Plane.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Upstream ["Upstream Ecosystem"]
        WL["🧪 Wonderlab Platform"]
        GHA["⚙️ GitHub Actions (CI/CD)"]
        DEP["🤖 Dependabot"]
        EXT["🔌 Future Microservices"]
    end

    subgraph Gateway ["Central Gateway (Render Cloud)"]
        subgraph Server ["Backend: NestJS 10 REST API"]
            AUTH["🔐 API Key Guard (Bearer)"]
            ROUTER["🔀 Notification Router"]
            BUILDER["🎨 Slack Builder (Block Kit)"]
            PRISMA["💎 Prisma ORM Client"]
        end

        subgraph Client ["Frontend: Next.js 15 Control Plane"]
            DASH["📊 Dashboard & Metrics"]
            PROJ["📂 Project & Channel Config"]
            AUDIT["📜 Dispatch Audit Trail"]
            SAND["🧪 Live Sandbox Simulator"]
        end
    end

    subgraph Data ["Database Tier"]
        NEON[("🐘 Neon Lakebase PostgreSQL")]
    end

    subgraph Destination ["Notification Destinations"]
        SLACK["💬 Slack Workspace (ThanhBa)"]
        subgraph Channels ["Slack Channels"]
            C1["#ci-cd"]
            C2["#deployments"]
            C3["#git-activity"]
            C4["#wonderlab-feedback"]
            C5["#wonderlab-comments"]
        end
    end

    WL -->|POST /api/v1/notifications/*| AUTH
    GHA -->|POST /api/v1/notifications/*| AUTH
    DEP -->|POST /api/v1/notifications/*| AUTH
    EXT -->|POST /api/v1/notifications/*| AUTH

    AUTH --> ROUTER
    ROUTER --> PRISMA
    PRISMA <--> NEON
    ROUTER --> BUILDER
    BUILDER -->|Slack WebClient / chat.postMessage| SLACK
    SLACK --> Channels

    Client <-->|/api/proxy/*| Server
```

---

## ✨ Key Features

1. **Decoupled Architecture & Zero Secret Leaks**:
   - Upstream services require only one secret (`GATEWAY_SECRET_KEY`) and one endpoint (`GATEWAY_URL`).
   - Slack bot tokens (`xoxb-...`), webhook secrets, and database credentials reside exclusively within the Gateway environment.

2. **Interactive Cloud Infrastructure Control Plane**:
   - **System Overview (`/`)**: Real-time delivery health, 24h success rate, active channel count, and quick telemetry metrics.
   - **Projects & Routing (`/projects`)**: Manage registered services (`wonderlab`, `central-gateway`) and dynamic channel mappings (`ci`, `deploy`, `git`, `feedback`, `comment`).
   - **Dispatch Audit Log (`/logs`)**: Full payload inspector, delivery status (`SUCCESS` / `FAIL`), execution latency, and error tracing.
   - **Notification Sandbox Simulator (`/sandbox`)**: Form and JSON payload testing suite to preview messages in real Slack channels with zero risk.

3. **Slack Block Kit Design System**:
   - Consistent visual hierarchy across all events:
     - 🚀 **Deployments**: Status badge, commit hash, environment, target, and deep links to live app & health probes.
     - 🧪 **CI/CD Pipelines**: Monospace ASCII step breakdowns, execution branches, and build logs.
     - 🌿 **Git Activity**: Branch creation, multi-commit changelog feeds, and Pull Request lifecycle (`OPEN`, `MERGED`, `CLOSED`).
     - 💬 **Community Moderation**: User simulation suggestions and scientific feedback with one-click admin moderation buttons.

4. **Multi-Project & Scalable**:
   - Database-driven channel routing via PostgreSQL (Neon). Easily add new microservices, repositories, and custom webhook targets without modifying server code.

---

## 🔗 Live Deployments & Endpoints

| Component | Target URL | Environment | Description |
| :--- | :--- | :---: | :--- |
| **Control Plane** | [central-gateway-client.onrender.com](https://central-gateway-client.onrender.com) | Production | Next.js 15 Web Dashboard |
| **Backend REST API** | [central-gateway-server.onrender.com/api/v1](https://central-gateway-server.onrender.com/api/v1) | Production | NestJS 10 Engine |
| **Swagger OpenAPI** | [central-gateway-server.onrender.com/api/docs](https://central-gateway-server.onrender.com/api/docs) | Production | Interactive API Explorer |
| **Health Probe** | [central-gateway-server.onrender.com/api/v1/health](https://central-gateway-server.onrender.com/api/v1/health) | Production | Liveness & Readiness check |

---

## 📡 API Reference

All ingestion endpoints require the authorization header:
```http
Authorization: Bearer <GATEWAY_SECRET_KEY>
Content-Type: application/json
```

### 1. Production Deploy Notification
`POST /api/v1/notifications/slack/deploy`
```json
{
  "project": "wonderlab",
  "status": "SUCCESS",
  "version": "0.16.0",
  "commit": "ece4d89",
  "target": "Production (all)",
  "actor": "thanhba0505",
  "runUrl": "https://github.com/thanhba0505/Wonderlab/actions",
  "appUrl": "https://wonderlab.io.vn",
  "healthUrl": "https://wonderlab-server.onrender.com/api/v1/health"
}
```

### 2. CI Pipeline Result
`POST /api/v1/notifications/slack/ci`
```json
{
  "project": "wonderlab",
  "status": "SUCCESS",
  "branch": "develop",
  "commit": "92496d8",
  "trigger": "push by @thanhba0505",
  "pipeline": {
    "Quality & Types": "SUCCESS",
    "Unit Tests": "SUCCESS",
    "E2E DB Tests": "SUCCESS",
    "Production Build": "SUCCESS"
  },
  "runUrl": "https://github.com/thanhba0505/Wonderlab/actions"
}
```

### 3. Git Activity (Commits, Branches, PRs)
`POST /api/v1/notifications/slack/git`
```json
{
  "project": "wonderlab",
  "eventType": "pull_request",
  "actor": "dependabot[bot]",
  "prNumber": "43",
  "prTitle": "chore(deps): bump next from 15.1.7 to 15.5.28",
  "prUrl": "https://github.com/thanhba0505/Wonderlab/pull/43",
  "prAction": "opened",
  "prMerged": false,
  "prHeadRef": "dependabot/npm_and_yarn/next-15.5.28",
  "prBaseRef": "develop"
}
```

### 4. Community & Moderation
`POST /api/v1/notifications/slack/community`
```json
{
  "project": "wonderlab",
  "type": "feedback",
  "title": "Quantum Eraser Simulation",
  "author": "Dr. Minh",
  "category": "Quantum Physics",
  "content": "Proposal to add an interactive quantum eraser experiment.",
  "actionUrl": "https://wonderlab.io.vn/requests",
  "adminUrl": "https://wonderlab.io.vn/admin/requests"
}
```

---

## 🛠️ Local Development

### Prerequisites
- Node.js `24.x` (`.nvmrc`)
- `pnpm` `12.11.2` (`npm i -g pnpm@12.11.2`)
- Local PostgreSQL 16 on `localhost:5434` (or Neon DB connection string)

### 1. Clone & Install
```bash
git clone https://github.com/thanhba0505/central-gateway.git
cd central-gateway
pnpm install
```

### 2. Configure Environment
Create `server/.env`:
```env
SERVER_PORT=5001
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5434/central_gateway?schema=public"
GATEWAY_SECRET_KEY="gw_sec_dev_local_secret"
SLACK_BOT_TOKEN="xoxb-your-slack-bot-token"
CORS_ORIGINS="http://localhost:5000,http://localhost:5100"
```

Create `client/.env.local`:
```env
PORT=5000
NEXT_PUBLIC_API_BASE_URL="http://localhost:5001/api/v1"
GATEWAY_SECRET_KEY="gw_sec_dev_local_secret"
```

### 3. Database Migration & Seed
```bash
cd server
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 4. Run Development Servers
```bash
# Start both client (port 5000) and server (port 5001) concurrently:
pnpm dev

# Or run individually:
pnpm dev:server
pnpm dev:client
```

### 5. Verification & Tests
```bash
# Run unit tests
pnpm test

# Run linter & formatting checks
pnpm lint
pnpm format:check
```

---

## 🚀 CI/CD & Release Protocol

- **Branching Strategy**:
  - `develop`: Active feature development, continuous integration (`ci.yml`), automated release note drafting (`release-drafter.yml`), and Dependabot vulnerability auto-patching.
  - `main`: Production release branch. Merged automatically upon publishing an official tag or GitHub Release (`v*`).
- **Zero-Downtime Rollout**: GitHub Actions automatically triggers zero-downtime rolling deploys to Render via the authenticated Render REST API.
- **Continuous Dependabot Integration**: Security updates and dependency bumps are scanned and raised weekly with automatic Slack notifications in `#git-activity`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
Copyright (c) 2026 Bá Lê Thanh.
