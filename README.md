# 🌐 Central Gateway

<div align="center">

[![CI Pipeline](https://github.com/thanhba0505/central-gateway/actions/workflows/ci.yml/badge.svg)](https://github.com/thanhba0505/central-gateway/actions/workflows/ci.yml)
[![Latest Release](https://img.shields.io/github/v/release/thanhba0505/central-gateway?color=0284c7&label=Release)](https://github.com/thanhba0505/central-gateway/releases)
[![Client Control Plane](https://img.shields.io/badge/Client-Live%20on%20Render-10b981?logo=render)](https://central-gateway-client.onrender.com)
[![Server API](https://img.shields.io/badge/Server-API%20v1-0284c7?logo=nestjs)](https://central-gateway-server.onrender.com/api/v1)
[![Swagger OpenAPI](https://img.shields.io/badge/Docs-Swagger%20OpenAPI-85ea2d?logo=swagger)](https://central-gateway-server.onrender.com/api/docs)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Centralized notification gateway and cloud infrastructure control plane for distributed applications & microservices.**

[Control Plane](https://central-gateway-client.onrender.com) • [API Swagger](https://central-gateway-server.onrender.com/api/docs) • [Architecture Guide](docs/architecture.md) • [Slack Integration](docs/slack-integration.md)

</div>

---

## 📌 Project Overview

**Central Gateway** is an enterprise-grade notification ingestion, formatting, and dispatch platform. It decouples distributed services, CI/CD pipelines, and microservices from third-party communication vendor SDKs, authentication credentials, and webhook topologies.

### Core Capabilities:
- **Intelligent Multi-Project Routing**: Dynamically dispatches events to designated Slack channels based on project slug and event scope (`ci`, `deploy`, `git`, `feedback`, `comment`).
- **Interactive Control Plane**: Real-time web dashboard providing delivery success rates, searchable audit trail logs, and a sandbox simulator.
- **Unified Design System**: Standardized, high-clarity notification cards formatted with Slack Block Kit.

---

## 🏗️ Monorepo Services

The repository is structured as a unified **pnpm monorepo**:

```
central-gateway/
├── client/          # Frontend Control Plane (Next.js 15, React 19, Tailwind CSS)
├── server/          # Backend Ingestion & Routing Engine (NestJS 10, Prisma, Slack API)
├── docs/            # Technical specifications and integration guides
└── scripts/         # Automated release sync and verification utilities
```

| Service | Stack | Default Port | Description |
| :--- | :--- | :---: | :--- |
| **`client`** | Next.js 15 App Router | `5000` | Web dashboard for monitoring delivery metrics, channel routing, audit logs, and sandbox testing. |
| **`server`** | NestJS 10 + Prisma ORM | `5001` | REST API for event ingestion, Bearer token authentication, Neon Postgres persistence, and Slack dispatch. |

---

## 🚀 Quick Start

### Prerequisites:
- **Node.js**: `v24.x` (enforced via `.nvmrc`)
- **Package Manager**: `pnpm` `12.11.2` (`npm i -g pnpm@12.11.2`)
- **Database**: PostgreSQL 16 (local port `5434` or Neon Lakebase cloud instance)

### 1. Install Dependencies
```bash
git clone https://github.com/thanhba0505/central-gateway.git
cd central-gateway
pnpm install
```

### 2. Database Migration & Seed
```bash
cd server
pnpm db:generate
pnpm db:migrate
pnpm db:seed
cd ..
```

### 3. Run Development Servers
```bash
# Start both Client and Server concurrently:
pnpm dev

# Or run individually:
pnpm dev:server    # Server API at http://localhost:5001
pnpm dev:client    # Client Web at http://localhost:5000
```

### 4. Verification & Testing
```bash
pnpm test          # Run unit test suites
pnpm lint          # Run ESLint validation
pnpm format:check  # Verify Prettier code formatting
```

---

## 📄 License

Licensed under the [MIT License](LICENSE).  
Copyright (c) 2026 Bá Lê Thanh.
