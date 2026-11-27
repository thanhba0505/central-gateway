-- CreateTable
CREATE TABLE "platform_links" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "category" VARCHAR(48) NOT NULL,
    "url" VARCHAR(512) NOT NULL,
    "secondary_url" VARCHAR(512),
    "secondary_label" VARCHAR(60),
    "description" VARCHAR(300),
    "account_note" VARCHAR(255),
    "environment" VARCHAR(24) NOT NULL DEFAULT 'ALL',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_links_slug_key" ON "platform_links"("slug");

-- CreateIndex
CREATE INDEX "platform_links_category_sort_order_idx" ON "platform_links"("category", "sort_order");

-- Idempotently seed initial Prism Hub platform & service links
INSERT INTO "platform_links" ("id", "slug", "title", "category", "url", "secondary_url", "secondary_label", "description", "account_note", "environment", "sort_order", "is_active", "created_at", "updated_at")
VALUES
  (gen_random_uuid()::text, 'wonderlab-prod', 'Wonderlab', 'apps', 'https://wonderlab.io.vn', 'https://wonderlab-server.vercel.app/api/docs', 'Swagger Docs', 'Interactive science, probability, and paradox simulation lab.', 'Local: 4100 / 4101 • Health: /api/v1/health-full', 'PRODUCTION', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'central-gateway-prod', 'Central Gateway', 'apps', 'https://central-gateway-client.vercel.app', 'https://central-gateway-server.vercel.app/api/docs', 'Swagger Docs', 'Centralized IAM SSO master, Slack/Cron broker, and platform hub.', 'Local: 5100 / 5101 • Health: /api/v1/health-full', 'PRODUCTION', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'git-pulse-prod', 'Git Pulse', 'apps', 'https://git-pulse-app.vercel.app', 'https://git-pulse-server.vercel.app/api/docs', 'Swagger Docs', 'Developer activity scanner, AI standup generator, and Parabol sync.', 'Local: 6100 / 6101 • MCP: /api/v1/mcp', 'PRODUCTION', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'vercel-dashboard', 'Vercel Dashboard', 'infra', 'https://vercel.com/thanhbas-projects', 'https://vercel.com/docs', 'Vercel Docs', 'Hosting & serverless runtime for all 6 Client/Server deployments.', 'Deploy Hooks & Env Vars cho Wonderlab, Gateway, Git Pulse', 'PRODUCTION', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'neon-console', 'Neon PostgreSQL Console', 'infra', 'https://console.neon.tech', 'https://neon.com/docs', 'Neon Docs', 'Managed Serverless PostgreSQL 16 databases (us-west-2 Oregon).', 'Databases: wonderlab, central_gateway, git_pulse', 'PRODUCTION', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'cron-job-org', 'cron-job.org Console', 'infra', 'https://console.cron-job.org', 'https://docs.cron-job.org/rest-api.html', 'REST API Docs', 'External scheduler managing prism-hub-* and prism-hub-*-test folders.', 'CRONJOB_API_KEY lưu trong server/.env.local & Vercel Env', 'ALL', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'github-prism-hub', 'GitHub — Prism Hub', 'source', 'https://github.com/thanhba0505/prism-hub', 'https://github.com/thanhba0505/prism-hub/tree/main/docs', 'Docs Index', 'Root umbrella workspace, Makefile orchestration, AGENTS.md, and docs.', 'Submodules: wonderlab, central-gateway, git-pulse', 'ALL', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'github-wonderlab', 'GitHub — Wonderlab', 'source', 'https://github.com/thanhba0505/wonderlab', 'https://github.com/thanhba0505/wonderlab/releases', 'Releases', 'Wonderlab repository, CI workflows, and production release tags.', 'Nhánh chính: develop -> main (qua release)', 'ALL', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'github-central-gateway', 'GitHub — Central Gateway', 'source', 'https://github.com/thanhba0505/central-gateway', 'https://github.com/thanhba0505/central-gateway/releases', 'Releases', 'Central Gateway repository, CI workflows, and production release tags.', 'Nhánh chính: develop -> main (qua release)', 'ALL', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'github-git-pulse', 'GitHub — Git Pulse', 'source', 'https://github.com/thanhba0505/git-pulse', 'https://github.com/thanhba0505/git-pulse/releases', 'Releases', 'Git Pulse repository, CI workflows, and production release tags.', 'Nhánh chính: develop -> main (qua release)', 'ALL', 40, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'github-oauth-settings', 'GitHub Developer Settings', 'source', 'https://github.com/settings/developers', 'https://github.com/settings/tokens', 'PAT Tokens', 'OAuth Apps and Personal Access Tokens for Git Pulse GitHub integration.', 'GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET (Git Pulse)', 'ALL', 50, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'google-cloud-oauth', 'Google Cloud Console (OAuth)', 'auth_notify', 'https://console.cloud.google.com/apis/credentials', NULL, NULL, 'OAuth 2.0 Client IDs for Google Sign-In across Prism services.', 'GOOGLE_CLIENT_ID trong Central Gateway & Git Pulse', 'ALL', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'slack-api-apps', 'Slack API Console', 'auth_notify', 'https://api.slack.com/apps', NULL, NULL, 'Slack Bot configuration dispatching #deployments, #ci-cd, and #git-activity.', 'SLACK_BOT_TOKEN chỉ lưu tại Central Gateway', 'ALL', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'groq-console', 'Groq Cloud Console', 'ai_standup', 'https://console.groq.com/keys', NULL, NULL, 'High-speed LPU inference API keys (gsk_...) for Git Pulse BYOK.', 'User tự lưu key mã hóa vào bảng ai_connections', 'ALL', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'google-ai-studio', 'Google AI Studio (Gemini)', 'ai_standup', 'https://aistudio.google.com/apikey', NULL, NULL, 'Gemini API keys (AIza...) for Git Pulse standup summarization BYOK.', 'User tự lưu key mã hóa vào bảng ai_connections', 'ALL', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'parabol-standup', 'Parabol Standup', 'ai_standup', 'https://action.parabol.co', NULL, NULL, 'Team standup workspace & Personal Access Tokens (pat_...) for Git Pulse.', 'Token mã hóa lưu trong parabol_connections', 'ALL', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'resend-email', 'Resend (Email — Sắp tích hợp)', 'planned', 'https://resend.com/api-keys', 'https://resend.com/domains', 'Domains', 'Transactional email API (Free 3,000/month) planned for Central Gateway.', 'Dự kiến dùng cho thông báo báo cáo tự động 20h', 'ALL', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'brevo-email', 'Brevo (Email dự phòng)', 'planned', 'https://app.brevo.com', NULL, NULL, 'Alternative transactional/SMTP email provider (Free 300 emails/day).', 'Dự phòng nếu cần SMTP thay thế Resend', 'ALL', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
