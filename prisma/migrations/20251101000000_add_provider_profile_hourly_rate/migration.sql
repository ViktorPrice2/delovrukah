-- Reintroduce the hourlyRate column for provider profiles
ALTER TABLE "ProviderProfile"
ADD COLUMN "hourlyRate" DECIMAL(10,2);
