-- CreateTable
CREATE TABLE "cron_folders" (
    "id" TEXT NOT NULL,
    "service_slug" VARCHAR(64) NOT NULL,
    "folder_title" VARCHAR(128) NOT NULL,
    "external_folder_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cron_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cron_jobs" (
    "id" TEXT NOT NULL,
    "service_slug" VARCHAR(64) NOT NULL,
    "job_key" VARCHAR(80) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "endpoint_path" VARCHAR(255) NOT NULL,
    "http_method" VARCHAR(16) NOT NULL DEFAULT 'POST',
    "target_url" VARCHAR(512) NOT NULL,
    "schedule" JSONB NOT NULL,
    "timeout_seconds" INTEGER NOT NULL DEFAULT 30,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "save_responses" BOOLEAN NOT NULL DEFAULT true,
    "encrypted_headers" TEXT,
    "header_keys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "external_job_id" INTEGER,
    "folder_id" TEXT,
    "last_synced_at" TIMESTAMP(3),
    "last_trigger_at" TIMESTAMP(3),
    "last_trigger_status" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cron_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cron_folders_folder_title_key" ON "cron_folders"("folder_title");

-- CreateIndex
CREATE INDEX "cron_folders_service_slug_idx" ON "cron_folders"("service_slug");

-- CreateIndex
CREATE UNIQUE INDEX "cron_jobs_external_job_id_key" ON "cron_jobs"("external_job_id");

-- CreateIndex
CREATE INDEX "cron_jobs_service_slug_idx" ON "cron_jobs"("service_slug");

-- CreateIndex
CREATE UNIQUE INDEX "cron_jobs_service_slug_job_key_key" ON "cron_jobs"("service_slug", "job_key");

-- AddForeignKey
ALTER TABLE "cron_jobs" ADD CONSTRAINT "cron_jobs_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "cron_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
