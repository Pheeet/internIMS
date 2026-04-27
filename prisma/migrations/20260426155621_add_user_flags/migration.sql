-- AlterTable
ALTER TABLE "User" ADD COLUMN     "internship_submitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_first_login" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "profile_completed" BOOLEAN NOT NULL DEFAULT false;
