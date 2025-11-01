-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "Price" ALTER COLUMN "expiresAt" SET DEFAULT (now() + interval '90 day');
