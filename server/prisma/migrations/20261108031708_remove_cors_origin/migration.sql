/*
  Warnings:

  - You are about to drop the column `cors_origin` on the `service_connections` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "service_connections" DROP COLUMN "cors_origin";
