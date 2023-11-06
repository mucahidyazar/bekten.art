-- AlterTable
ALTER TABLE "users" ADD COLUMN     "receiveEmails" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shareData" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shareSomeData" BOOLEAN NOT NULL DEFAULT false;
