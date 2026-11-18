# Contributing to Central Gateway

Thank you for your interest in contributing to Central Gateway! Central Gateway serves as the centralized **Single Sign-On (SSO) & Identity Access Management (IAM) Hub**, cross-platform notification broker, and cloud infrastructure control plane for the Prism engineering ecosystem.

Please adhere to the guidelines outlined below to maintain our architectural clarity, zero-secret security model, and strict type safety standards.

---

## 1. Commit Guidelines (Conventional Commits)

Central Gateway strictly enforces the **Conventional Commits v1.0.0** specification in English:

- `feat: <description>`: Introduces a new feature or public capability.
- `fix: <description>`: Fixes a defect or resolves an issue.
- `chore: <description>`: Maintenance tasks, dependencies, build configs.
- `docs: <description>`: Technical documentation and architecture updates.
- `test: <description>`: Unit, integration, or E2E tests.
- `refactor: <description>`: Code modifications without behavior changes.
- `ci: <description>`: CI/CD configuration files, workflows, and scripts.

_Example_: `feat(iam): add OAuth2 PKCE authorization code exchange endpoint`

---

## 2. Development Workflow

Central Gateway uses a trunk-based workflow targeting `develop`:

1. **Branch Off `origin/develop`**:
   ```bash
   cd central-gateway
   git fetch origin
   git checkout -B <type>/<task-name> origin/develop
   ```
2. **Implement Changes**:
   - Strictly follow the core engineering guidelines in [AGENTS.md](AGENTS.md).
   - **Zero Secret Leaks**: Never commit `.env*` or API tokens.
   - **Standard Ecosystem Ports (Prism Hub)**:
     - Central Gateway Client: `http://localhost:5100`
     - Central Gateway Server: `http://localhost:5101` (`/api/v1`)
     - Database: Local PostgreSQL 16 on `127.0.0.1:5432`
   - **Cosmic Violet & Frosted Glass Aesthetic**: Crisp frosted glass cards (`backdrop-blur-2xl`), deep cosmic sky gradients, and glowing interactive elements.
3. **Mandatory Verification**:
   Before submitting changes, run the full verification pipeline:
   ```bash
   pnpm check
   ```
   All checks (`format:check`, `lint`, `typecheck`, `test`, `build`) must pass with exit code `0`.
4. **Merge Directly to `develop`**:
   ```bash
   git fetch origin && git rebase origin/develop && git push origin HEAD:develop
   git checkout develop && git pull origin develop && git branch -d <type>/<task-name>
   ```
   _Note_: The `main` branch is strictly reserved for production releases and automated CD synchronization.

---

## 3. Definition of Done (DoD)

A contribution is considered complete and ready for integration when:

- [ ] Linter reports zero errors and zero warnings (`pnpm lint`).
- [ ] TypeScript compiler passes in strict mode without `any` (`pnpm typecheck`).
- [ ] Unit and integration tests pass cleanly (`pnpm test`).
- [ ] Both Next.js control plane and NestJS server compile successfully (`pnpm build`).
- [ ] Architectural docs in `docs/` updated if endpoints, schema, or notification routing changed.
