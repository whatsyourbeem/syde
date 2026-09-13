-- GitHub Integration(Deploy to production) 자동 배포 동작 확인용 무해한 테스트 마이그레이션.
-- 기존 테이블/데이터는 전혀 건드리지 않고, 아무 것도 하지 않는 함수 하나만 새로 추가한다.
-- 검증 후에는 자유롭게 삭제(DROP FUNCTION)하거나 이 마이그레이션을 되돌리는 후속 마이그레이션을 작성해도 된다.
CREATE OR REPLACE FUNCTION public.__github_integration_test()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- no-op: 배포 파이프라인 동작 확인용
END;
$$;

COMMENT ON FUNCTION public.__github_integration_test() IS 'GitHub Integration 자동 배포 테스트용 (2026-09-13). 확인 후 삭제 가능.';
