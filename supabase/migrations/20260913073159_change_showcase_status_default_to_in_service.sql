-- 쇼케이스 상태(status) 기본값을 DEVELOPING -> IN_SERVICE(서비스 중)로 변경.
-- 이전 마이그레이션(20260913070817_add_showcase_status.sql)에서 컬럼을 추가하며
-- 기존 로우가 전부 DEVELOPING으로 백필되었는데, 실제로는 서비스 중인 프로젝트들이므로
-- 기존 로우 전체를 IN_SERVICE로 재백필한다. 신규 등록 시 기본값도 함께 변경.
ALTER TABLE "public"."showcases"
  ALTER COLUMN "status" SET DEFAULT 'IN_SERVICE';

UPDATE "public"."showcases" SET "status" = 'IN_SERVICE';
