/*
  Warnings:

  - The values [REJECTED] on the enum `InternshipStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InternshipStatus_new" AS ENUM ('PENDING', 'EDIT_REQUESTED', 'PENDING_UPDATE', 'APPROVED', 'COMPLETED');
ALTER TABLE "public"."Internship" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Internship" ALTER COLUMN "status" TYPE "InternshipStatus_new" USING ("status"::text::"InternshipStatus_new");
ALTER TYPE "InternshipStatus" RENAME TO "InternshipStatus_old";
ALTER TYPE "InternshipStatus_new" RENAME TO "InternshipStatus";
DROP TYPE "public"."InternshipStatus_old";
ALTER TABLE "Internship" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
