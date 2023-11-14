/*
  Warnings:

  - The values [REJECTED] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "ArtworkStatus" AS ENUM ('ON_SALE', 'ARCHIVED', 'SOLD');

-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('IN_PROGRESS', 'ACCEPTED');
ALTER TABLE "feedbacks" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "feedbacks" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "Status_old";
ALTER TABLE "feedbacks" ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS';
COMMIT;

-- AlterTable
ALTER TABLE "artworks" ADD COLUMN     "status" "ArtworkStatus" NOT NULL DEFAULT 'ON_SALE';
