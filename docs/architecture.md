# System Architecture & Technical Specifications

## 1. High-Level Topology

Central Gateway serves as the centralized communications broker across the ThanhBa engineering ecosystem.

```mermaid
graph TD
    subgraph Clients ["Clients & Producers"]
        A["Client Applications & Microservices"]
        B["GitHub Actions CI/CD"]
        C["Dependabot Security Updates"]
        D["Cron Workers & Monitoring"]
    end

    subgraph Ingress ["API Gateway Ingress"]
        E["Cloudflare / Render Edge"]
        F["NestJS 10 Application"]
        G["ApiKeyGuard (Bearer Authentication)"]
    end

    subgraph Core ["Processing Engine"]
        H["NotificationsService"]
        I["SlackBuilderService (Block Kit Formatter)"]
        J["Prisma ORM Client"]
    end

    subgraph Persistence ["Persistence Layer"]
        K[("Neon Lakebase Postgres (AWS Oregon)")]
        L["Table: Project"]
        M["Table: ChannelMapping"]
        N["Table: DispatchLog"]
    end

    subgraph Providers ["Delivery Providers"]
        O["Slack WebClient API"]
        P["Telegram Bot API (Planned)"]
        Q["Discord Webhooks (Planned)"]
    end

    A & B & C & D -->|HTTPS REST| E
    E --> F
    F --> G
    G --> H
    H --> J
    J <--> K
    K --- L & M & N
    H --> I
    I --> O & P & Q
```

---

## 2. Database Schema (Prisma)

The persistence layer runs on Neon Lakebase PostgreSQL.

```prisma
model Project {
  id          String           @id @default(uuid())
  slug        String           @unique
  name        String
  description String?
  isActive    Boolean          @default(true)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  channels    ChannelMapping[]
  logs        DispatchLog[]

  @@map("projects")
}

model ChannelMapping {
  id          String   @id @default(uuid())
  projectId   String
  eventType   String
  channelId   String
  channelName String?
  provider    String   @default("slack")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([projectId, eventType, provider])
  @@map("channel_mappings")
}

model DispatchLog {
  id         String   @id @default(uuid())
  projectId  String?
  provider   String   @default("slack")
  eventType  String
  status     String
  payload    Json
  response   Json?
  error      String?
  durationMs Int?
  createdAt  DateTime @default(now())
  project    Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)

  @@index([projectId, eventType])
  @@index([createdAt])
  @@map("dispatch_logs")
}
```

---

## 3. Security Boundary & Threat Model

1. **Authentication**:
   - Upstream services must provide the `Authorization: Bearer <GATEWAY_SECRET_KEY>` header.
   - Guarded by NestJS `ApiKeyGuard`. Unauthorized requests immediately return `401 Unauthorized`.

2. **Zero Secret Leakage**:
   - `SLACK_BOT_TOKEN`, `DATABASE_URL`, and internal Render Service IDs are strictly isolated to Central Gateway environment variables.
   - Connected microservices and upstream repositories contain zero direct Slack credentials.

3. **CORS Restrictions**:
   - Configured via `CORS_ORIGINS` in `server/src/main.ts` with explicit domain whitelisting (`localhost:5000`, `localhost:5100`, `https://central-gateway-client.onrender.com`).

---

## 4. Service-to-Service (S2S) & Centralized IAM Sync

1. **Dynamic Service Registry (`service_connections`)**:
   - Central Gateway stores connections to ecosystem microservices dynamically in PostgreSQL instead of static environment variables.
   - Decouples domain hostnames (`domain`) from endpoints (`apiPrefix`), outbound tokens (`apiKey`), and incoming verification tokens (`incomingSecret`).

2. **Master IAM & User Synchronization**:
   - Central Gateway is the authoritative master for user identities and authentication tokens.
   - When a user profile (`PATCH /auth/profile`) or account status (`PATCH /auth/users/:id/status`) is updated, `S2SService.dispatchUserSync` broadcasts the updated record to all active services configured with `metadata.syncUser = true` via `POST /internal/users/sync`.
