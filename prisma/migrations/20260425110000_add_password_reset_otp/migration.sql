-- CreateEnum
CREATE TYPE "OtpAuditAction" AS ENUM (
  'REQUESTED',
  'SENT',
  'SEND_FAILED',
  'VERIFY_FAILED',
  'VERIFIED',
  'EXPIRED',
  'RATE_LIMITED',
  'USER_NOT_FOUND',
  'RESET_COMPLETED',
  'CLEANED_UP'
);

-- CreateTable
CREATE TABLE "PasswordResetOtp" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "otpHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT,

  CONSTRAINT "PasswordResetOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetOtpAudit" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "action" "OtpAuditAction" NOT NULL,
  "message" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "otpId" TEXT,

  CONSTRAINT "PasswordResetOtpAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetOtp_email_key" ON "PasswordResetOtp"("email");

-- CreateIndex
CREATE INDEX "PasswordResetOtp_expiresAt_idx" ON "PasswordResetOtp"("expiresAt");

-- CreateIndex
CREATE INDEX "PasswordResetOtp_verifiedAt_idx" ON "PasswordResetOtp"("verifiedAt");

-- CreateIndex
CREATE INDEX "PasswordResetOtp_userId_idx" ON "PasswordResetOtp"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetOtpAudit_email_idx" ON "PasswordResetOtpAudit"("email");

-- CreateIndex
CREATE INDEX "PasswordResetOtpAudit_action_idx" ON "PasswordResetOtpAudit"("action");

-- CreateIndex
CREATE INDEX "PasswordResetOtpAudit_createdAt_idx" ON "PasswordResetOtpAudit"("createdAt");

-- CreateIndex
CREATE INDEX "PasswordResetOtpAudit_otpId_idx" ON "PasswordResetOtpAudit"("otpId");

-- AddForeignKey
ALTER TABLE "PasswordResetOtp"
ADD CONSTRAINT "PasswordResetOtp_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetOtpAudit"
ADD CONSTRAINT "PasswordResetOtpAudit_otpId_fkey"
FOREIGN KEY ("otpId") REFERENCES "PasswordResetOtp"("id") ON DELETE SET NULL ON UPDATE CASCADE;
