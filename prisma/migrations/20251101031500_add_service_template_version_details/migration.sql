-- AlterTable
ALTER TABLE "ServiceTemplateVersion"
  ADD COLUMN "whatsIncluded" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN "whatsNotIncluded" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN "unitOfMeasure" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "requiredTools" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN "customerRequirements" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN "media" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN "estimatedTime" TEXT;

-- Drop defaults to align with Prisma schema expectations
ALTER TABLE "ServiceTemplateVersion"
  ALTER COLUMN "unitOfMeasure" DROP DEFAULT,
  ALTER COLUMN "whatsIncluded" DROP DEFAULT,
  ALTER COLUMN "whatsNotIncluded" DROP DEFAULT,
  ALTER COLUMN "requiredTools" DROP DEFAULT,
  ALTER COLUMN "customerRequirements" DROP DEFAULT,
  ALTER COLUMN "media" DROP DEFAULT;
