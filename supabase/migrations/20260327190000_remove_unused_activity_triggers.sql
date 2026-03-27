-- 1. Remove creation triggers and functions for unused activity types
DROP TRIGGER IF EXISTS trigger_activity_user_joined ON public.profiles;
DROP TRIGGER IF EXISTS trigger_activity_meetup_joined ON public.meetup_participants;
DROP FUNCTION IF EXISTS public.create_activity_on_user_joined();
DROP FUNCTION IF EXISTS public.create_activity_on_meetup_joined();

-- 2. Remove the cleanup trigger and function for meetup participation (was just added)
DROP TRIGGER IF EXISTS trigger_delete_activity_on_meetup_left ON public.meetup_participants;
DROP FUNCTION IF EXISTS public.delete_activity_on_meetup_left();

-- 3. Cleanup existing data for these types
DELETE FROM public.activity_feed 
WHERE activity_type IN ('USER_JOINED', 'MEETUP_JOINED');
