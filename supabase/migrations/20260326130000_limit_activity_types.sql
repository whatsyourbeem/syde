-- ==========================================
-- Limit Activity Feed Types
-- ==========================================

-- 1. 트리거 삭제
DROP TRIGGER IF EXISTS trigger_activity_user_joined ON public.profiles;
DROP TRIGGER IF EXISTS trigger_activity_meetup_joined ON public.meetup_participants;

-- 2. 트리거 함수 삭제
DROP FUNCTION IF EXISTS public.create_activity_on_user_joined();
DROP FUNCTION IF EXISTS public.create_activity_on_meetup_joined();

-- 3. 기존 데이터 정리 (가입 및 참여 데이터 삭제)
DELETE FROM public.activity_feed 
WHERE activity_type IN ('USER_JOINED', 'MEETUP_JOINED');
