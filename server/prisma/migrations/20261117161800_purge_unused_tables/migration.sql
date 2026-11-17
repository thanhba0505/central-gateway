-- DropForeignKey
ALTER TABLE "api_keys" DROP CONSTRAINT IF EXISTS "api_keys_project_id_fkey";

-- DropForeignKey
ALTER TABLE "auth_codes" DROP CONSTRAINT IF EXISTS "auth_codes_client_id_fkey";

-- DropForeignKey
ALTER TABLE "auth_codes" DROP CONSTRAINT IF EXISTS "auth_codes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "dispatch_logs" DROP CONSTRAINT IF EXISTS "dispatch_logs_project_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "channel_mappings_project_id_event_type_provider_key";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "channel_mappings_project_id_event_type_key" ON "channel_mappings"("project_id", "event_type");

-- AlterTable
ALTER TABLE "channel_mappings" DROP COLUMN IF EXISTS "channel_name",
DROP COLUMN IF EXISTS "provider";

-- DropTable
DROP TABLE IF EXISTS "api_keys";

-- DropTable
DROP TABLE IF EXISTS "auth_codes";

-- DropTable
DROP TABLE IF EXISTS "dispatch_logs";

-- DropTable
DROP TABLE IF EXISTS "oauth_clients";
