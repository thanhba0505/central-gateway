-- Seed Git Pulse project and default Slack channel mappings idempotently
INSERT INTO "projects" ("id", "slug", "name", "description", "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'git-pulse',
  'Git Pulse',
  'Git activity tracker and AI standup workspace for the Prism ecosystem',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "channel_mappings" ("id", "project_id", "event_type", "channel_id", "created_at", "updated_at")
SELECT
  gen_random_uuid()::text,
  p."id",
  v."event_type",
  v."channel_id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "projects" p
CROSS JOIN (
  VALUES
    ('deploy', 'C0CGL8EHU9E'),
    ('ci', 'C0CGL8EBFT2'),
    ('git', 'C0CFRUJUCSE')
) AS v("event_type", "channel_id")
WHERE p."slug" = 'git-pulse'
ON CONFLICT ("project_id", "event_type") DO NOTHING;
