-- owlleak 운영 보강 SQL (2026-11-16)
-- Supabase SQL Editor에서 한 번 실행하세요. 모두 IF NOT EXISTS라 여러 번 실행해도 안전합니다.

-- 1) 로그인 실패 잠금용 컬럼 (로그인 잠금 코드 배포 전에 먼저 실행)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "failedLoginCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);

-- 2) 주요 조회 인덱스 (데이터가 쌓여도 목록 조회가 느려지지 않게)
CREATE INDEX IF NOT EXISTS "Task_partnerId_idx" ON "Task"("partnerId");
CREATE INDEX IF NOT EXISTS "Task_customerId_idx" ON "Task"("customerId");
CREATE INDEX IF NOT EXISTS "Task_registeredByPartnerId_idx" ON "Task"("registeredByPartnerId");
CREATE INDEX IF NOT EXISTS "Task_status_idx" ON "Task"("status");
CREATE INDEX IF NOT EXISTS "TaskPhoto_taskId_idx" ON "TaskPhoto"("taskId");
CREATE INDEX IF NOT EXISTS "TaskLog_taskId_idx" ON "TaskLog"("taskId");
CREATE INDEX IF NOT EXISTS "Settlement_partnerId_idx" ON "Settlement"("partnerId");
CREATE INDEX IF NOT EXISTS "Settlement_taskId_idx" ON "Settlement"("taskId");
CREATE INDEX IF NOT EXISTS "PaymentHistory_subscriptionId_idx" ON "PaymentHistory"("subscriptionId");
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Estimate_customerId_idx" ON "Estimate"("customerId");
