-- Update Git Pulse service connection domain from deprecated Render URL to Vercel production URL
UPDATE "service_connections"
SET "domain" = 'https://git-pulse-server.vercel.app',
    "updated_at" = CURRENT_TIMESTAMP
WHERE "slug" = 'git-pulse'
  AND "domain" = 'https://git-pulse-server.onrender.com';
