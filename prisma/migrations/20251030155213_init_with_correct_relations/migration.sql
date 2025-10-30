/*
  Warnings:

  - You are about to drop the column `hourlyRate` on the `ProviderProfile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[categoryId,slug]` on the table `ServiceTemplate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `ServiceTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."ServiceTemplate" DROP CONSTRAINT "ServiceTemplate_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ServiceTemplate" DROP CONSTRAINT "ServiceTemplate_keeperId_fkey";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProviderProfile" DROP COLUMN "hourlyRate";

-- AlterTable
ALTER TABLE "ServiceTemplate" ADD COLUMN     "slug" TEXT NOT NULL,
ALTER COLUMN "authorId" DROP NOT NULL,
ALTER COLUMN "keeperId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTemplate_categoryId_slug_key" ON "ServiceTemplate"("categoryId", "slug");

-- AddForeignKey
ALTER TABLE "ServiceTemplate" ADD CONSTRAINT "ServiceTemplate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTemplate" ADD CONSTRAINT "ServiceTemplate_keeperId_fkey" FOREIGN KEY ("keeperId") REFERENCES "ProviderProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
