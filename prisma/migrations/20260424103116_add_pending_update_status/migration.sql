-- AlterEnum
ALTER TYPE "InternshipStatus" ADD VALUE 'PENDING_UPDATE';

-- AlterTable
ALTER TABLE "Internship" ADD COLUMN     "previousSnapshot" JSONB;
