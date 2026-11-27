<div align="center">

# Central Gateway

**Centralized Single Sign-On (SSO), IAM Master, and real-time notification hub for distributed applications — part of the Prism Hub ecosystem.**

[![CI Pipeline](https://github.com/thanhba0505/central-gateway/actions/workflows/ci.yml/badge.svg)](https://github.com/thanhba0505/central-gateway/actions/workflows/ci.yml)
[![Latest Release](https://img.shields.io/github/v/release/thanhba0505/central-gateway?color=0284c7&style=flat-square&label=Release)](https://github.com/thanhba0505/central-gateway/releases)
[![Version](https://img.shields.io/badge/version-v0.8.0-0284c7?style=flat-square)](https://github.com/thanhba0505/central-gateway/releases)
[![Client Control Plane](https://img.shields.io/badge/Client-Live%20on%20Vercel-10b981?style=flat-square&logo=vercel)](https://central-gateway-client.vercel.app)
[![Server API](https://img.shields.io/badge/Server-API%20v1-0284c7?style=flat-square&logo=nestjs)](https://central-gateway-server.vercel.app/api/v1)
[![Swagger OpenAPI](https://img.shields.io/badge/Docs-Swagger%20OpenAPI-85ea2d?style=flat-square&logo=swagger)](https://central-gateway-server.vercel.app/api/docs)
[![License: MIT](https://img.shields.io/badge/License-MIT-6366f1?style=flat-square)](LICENSE)

[🌐 Control Plane](https://central-gateway-client.vercel.app) • [📑 Swagger OpenAPI](https://central-gateway-server.vercel.app/api/docs) • [🧭 Prism Hub Docs](https://github.com/thanhba0505/prism-hub/blob/main/docs/README.md) • [📖 Architecture Guide](https://github.com/thanhba0505/prism-hub/blob/main/docs/central-gateway/architecture.md) • [🚀 Deployment Guide](https://github.com/thanhba0505/prism-hub/blob/main/docs/central-gateway/deployment.md) • [🤖 AGENTS.md](https://github.com/thanhba0505/prism-hub/blob/main/AGENTS.md)

</div>

---

## 📌 Project Overview

**Central Gateway** is the centralized Identity and Access Management (IAM) authority and communications broker for the Prism Hub ecosystem. It decouples client applications, microservices, and CI/CD pipelines from vendor-specific notification SDKs, authentication credentials, and webhook topologies while providing cryptographic Single Sign-On.

### Core Capabilities:

- **Ecosystem IAM & OAuth2 SSO**: Issues and validates centralized user credentials with OAuth2 Authorization Code flow and PKCE (`S256`).
- **Service-to-Service (S2S) Cryptographic Vault**: Authenticates inter-service communications using timing-safe HMAC-SHA256 request signatures with replay prevention windows.
- **Intelligent Multi-Project Routing**: Dispatches CI/CD, deployment, and operational alerts to designated Slack channels based on project slug and event scope.
- **Interactive Control Plane**: Real-time web dashboard providing delivery success rates, searchable audit trail logs, and interactive dispatch sandboxes.
- **Unified Design System**: Consistent, high-clarity notification cards formatted with Slack Block Kit and styled with a cosmic frosted glass aesthetic.

---

## 🌌 Prism Hub Ecosystem

Central Gateway operates as the identity and communication backbone within the **Prism Hub** engineering ecosystem:

| Application         | Role & Mission                                        | Standard Local Port | Live Production                                            | Interactive Docs                                                      |
| :------------------ | :---------------------------------------------------- | :-----------------: | :--------------------------------------------------------- | :-------------------------------------------------------------------- |
| **Central Gateway** | Centralized IAM Master, OAuth2 SSO & Notification Hub |   `5100` / `5101`   | [Control Plane](https://central-gateway-client.vercel.app) | [Swagger OpenAPI](https://central-gateway-server.vercel.app/api/docs) |
| **Wonderlab**       | Interactive Science, Probability & Paradox Laboratory |   `4100` / `4101`   | [Live Experience](https://wonderlab.io.vn)                 | [Swagger OpenAPI](https://wonderlab-server.vercel.app/api/docs)       |
| **Git Pulse**       | Developer Intelligence, Dual-Core AI & Activity Radar |   `6100` / `6101`   | [Developer Workspace](https://git-pulse-app.vercel.app)    | [Swagger OpenAPI](https://git-pulse-server.vercel.app/api/docs)       |

> All services share PostgreSQL 16 on local port `5432` during development and connect to serverless Neon Lakebase PostgreSQL in production.

---

## 🏗️ System Architecture

```mermaid
graph TD
    Clients["Client Services (Wonderlab / Git Pulse)"] -->|HMAC-SHA256 S2S / OAuth2| VercelEdge["Vercel Edge Network"]
    VercelEdge --> ClientApp["central-gateway-client (Next.js 15 Control Plane)"]
    VercelEdge --> ServerAPI["central-gateway-server (NestJS 10 IAM Engine)"]
    ServerAPI -->|Pooled Connection| NeonDB["Neon Lakebase PostgreSQL 16 (AWS Oregon)"]
    ServerAPI -->|Slack Block Kit Webhooks| Slack["Slack Workspaces (#deployments, #ci)"]
    ServerAPI -->|OAuth2 PKCE Handshake| GoogleOAuth["Google Identity Services"]
```

---

## 📦 Monorepo Structure

```text
central-gateway/
├── client/          # Next.js 15 App Router, React 19, Tailwind CSS v4, Lucide React
├── server/          # NestJS 10 REST API, Prisma ORM, Slack API, Neon PostgreSQL
├── .github/         # Parallel CI/CD workflows, release automation, PR & issue templates
└── scripts/         # Automated release version synchronization and verification scripts
```

> Architectural documentation, API contracts, AI rules (`AGENTS.md`), and shared local Docker PostgreSQL orchestration are centralized in [`thanhba0505/prism-hub`](https://github.com/thanhba0505/prism-hub).

| Workspace    | Technology Stack                              | Local Port | Role & Responsibility                                                              |
| :----------- | :-------------------------------------------- | :--------: | :--------------------------------------------------------------------------------- |
| **`client`** | Next.js 15 App Router, React 19, Tailwind CSS |   `5100`   | Management control plane, delivery analytics, audit trails, and simulator.         |
| **`server`** | NestJS 10, Prisma ORM, Slack SDK              |   `5101`   | REST API (`/api/v1`), OAuth2 SSO provider, Bearer token guard, and Slack dispatch. |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v24.x` (enforced via `.nvmrc`)
- **Package Manager**: `pnpm` `12.11.2` (`npm i -g pnpm@12.11.2`)
- **PostgreSQL 16**: Running on `127.0.0.1:5432` (managed centrally via Docker Compose in `prism-hub` or native local Postgres)

### 1. Recommended Setup via Prism Hub

```bash
git clone https://github.com/thanhba0505/prism-hub.git
cd prism-hub
make init            # Starts shared PostgreSQL (127.0.0.1:5432), installs deps & syncs DBs
make gateway-start   # Starts Central Gateway client (5100) + server (5101)
```

### 2. Standalone Usage (Requires PostgreSQL 16 on `127.0.0.1:5432` with `central_gateway` DB)

```bash
git clone https://github.com/thanhba0505/central-gateway.git
cd central-gateway
cp .env.example .env.local
pnpm install
pnpm dev             # Client on 5100 + Server on 5101
```

Or run individually:

- `pnpm dev:client` — Next.js Client on port `5100`
- `pnpm dev:server` — NestJS Server on port `5101`

### 3. Verification & Testing

```bash
pnpm check          # Verification pipeline: Format -> Lint -> Typecheck -> Unit Tests
pnpm build          # Production build (client + server)
pnpm test           # Run Jest test suites
pnpm lint           # ESLint validation with 0 warnings policy
pnpm format:check   # Prettier code formatting check
```

---

## 📑 Technical Documentation Index

All technical guides, API references, and AI coding guidelines have moved to the central **[Prism Hub](https://github.com/thanhba0505/prism-hub)** repository:

- [Prism Hub Documentation Hub](https://github.com/thanhba0505/prism-hub/blob/main/docs/README.md)
- [Unified AGENTS.md & Contributing Guide](https://github.com/thanhba0505/prism-hub/blob/main/AGENTS.md)
- [System Architecture & IAM Hub](https://github.com/thanhba0505/prism-hub/blob/main/docs/central-gateway/architecture.md)
- [API Reference & S2S Contracts](https://github.com/thanhba0505/prism-hub/blob/main/docs/central-gateway/api-reference.md)
- [Slack Integration & Block Kit Guide](https://github.com/thanhba0505/prism-hub/blob/main/docs/central-gateway/slack-integration.md)
- [Deployment & Vercel Serverless Operations](https://github.com/thanhba0505/prism-hub/blob/main/docs/central-gateway/deployment.md)
- [Shared Database & Neon Safety Guide](https://github.com/thanhba0505/prism-hub/blob/main/docs/shared/database.md)

---

## 📄 License

Licensed under the [MIT License](LICENSE) © 2026 **thanhba0505**.
