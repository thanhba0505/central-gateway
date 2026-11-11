# AGENTS.md — Central Gateway AI Coding Guidelines

Primary rules and engineering standards for AI coding assistants working in Central Gateway.

---

## 1. Project Overview & Mission

- **Mission**: Central Gateway serves as the centralized **Single Sign-On (SSO) & Identity Access Management (IAM) Hub**, cross-platform notification broker, and cloud infrastructure control plane for the Prism engineering ecosystem.
- **Monorepo Architecture**:
  - `client/`: Next.js 15 App Router, React 19, Tailwind CSS v4, Lucide React.
  - `server/`: NestJS 10 REST API, Prisma ORM, Neon Lakebase PostgreSQL.
  - `docs/`: Technical specifications, architectural diagrams, API references.
  - `scripts/`: Deployment verification, version synchronization, and release utilities.
- **Runtime & Tools**: Node `v24.x` (`.nvmrc`), `pnpm@12.11.2`. Never use `npm` or `yarn`.

---

## 2. Security & Environment Standard

- **Zero Secret Leaks**: Never commit `.env*` or API tokens. Secrets must be registered in GitHub Secrets and Render Environment Variables.
- **Client Boundaries**: Only `NEXT_PUBLIC_*` variables allowed in client code; never expose `SLACK_BOT_TOKEN`, `DATABASE_URL`, or internal secret keys in client bundles.
- **SSO Security Standard**:
  - OAuth2 Authorization Code Flow with PKCE (`S256` code challenge).
  - Strict redirect URI whitelisting against registered client applications.
  - Session cookies must be `HttpOnly`, `SameSite: Lax`, and `Secure` in production.
- **API Guard**: Backend endpoints require `ApiKeyGuard` (Bearer token) or active user session guard.

---

## 3. UI/UX Standard ("Cosmic Violet & Frosted Glass")

- **Aesthetic**: Deep twilight cosmic skies, dynamic twinkling starfields, multi-layered mountain & evergreen pine tree silhouettes, and ultra-crisp frosted glass cards (`backdrop-blur-2xl`).
- **Color Palette**:
  - Cosmic Sky Gradients: `#130624` (Deep Space) -> `#250d42` (Midnight Purple) -> `#43146b` (Twilight Violet) -> `#631f8f` (Aurora Purple).
  - Frosted Glass Canvas: `bg-white/[0.08]` or `bg-white/[0.06]` with hairline border `border border-white/20`.
  - Ambient Glow: `shadow-[0_8px_32px_0_rgba(140,56,201,0.25)]`.
  - Text & Accents: Crisp white `#ffffff` headings, soft lavender `text-violet-200/80` body, glowing white interactive buttons.
- **Form Controls & Micro-Interactions**:
  - Capsule Pill Inputs: `rounded-full bg-white/[0.12] border border-white/25 px-5 py-3 text-white placeholder-white/60 focus:bg-white/[0.22] focus:border-white/50 focus:ring-4 focus:ring-violet-400/20`.
  - Solid Glowing Buttons: `rounded-full bg-white text-[#2a0e4e] font-bold py-3.5 hover:bg-white/95 hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] active:scale-[0.98] transition-all`.
  - Interactive tactile feedback (`active:scale-[0.98]`, `transition-all duration-200`).
  - Accessibility: `prefers-reduced-motion` compliance on canvas and particle animations.

---

## 4. Coding & TypeScript Conventions

- **Strict Zero-`any` Policy**:
  - Forbidden: `any`, `Record<string, any>`, `Array<any>`, `@ts-ignore`, `@ts-nocheck`.
  - Mandatory explicit TypeScript interfaces/DTOs for all entities, endpoints, and component props.
- **Clean Architecture & Guard Clauses**:
  - Early returns (maximum 2 levels of nesting), intent-revealing names, grouped imports.
- **React Anti-Re-render Standard**:
  - Zero derived state in `useEffect`: compute inline or memoize with `useMemo`.
  - Isolate high-frequency animations (canvas RAF, starfield ticks) into dedicated canvas hooks using `useRef`.

---

## 5. Verification & Testing Policy

- **Unified Verification**: Run `pnpm check` before claiming any task completion:
  ```bash
  pnpm check  # Executes format:check, lint, typecheck, test, and production builds
  ```
- **Lean Testing**:
  - Unit tests for notification formatters, Slack Block Kit builders, OAuth2 code generators, and auth services.
  - End-to-end checks for health and authentication endpoints.

---

## 6. Git Workflow, Versioning & Deployment

- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `ci:`.
- **Direct Push to `develop`**: Branch off `origin/develop`, verify with `pnpm check`, rebase, push `develop`.
- **Automated Production Releases**:
  - Release published or tag `v*.*.*` triggers `.github/workflows/deploy.yml`.
  - Auto-syncs `develop` into `main`, syncs version across `package.json` and lockfiles.
  - Deploys via Render REST API (`POST /v1/services/{id}/deploys`).
  - Records real-time GitHub Deployment environments:
    - ⏳ / 🟢 `production - server`
    - ⏳ / 🟢 `production - client`
    - ⏳ / 🟢 `production` (overall)
  - Runs fail-fast verification via `scripts/verify-deployment.sh` and sends real-time alerts to Slack `#deployments`.
