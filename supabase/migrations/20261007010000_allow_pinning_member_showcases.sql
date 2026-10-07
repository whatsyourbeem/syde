-- 대표 프로젝트 핀: 직접 만든 쇼케이스뿐 아니라 팀원(showcases_members)으로 참여한 쇼케이스도 고정할 수 있게 한다.
CREATE OR REPLACE FUNCTION public.set_pinned_showcases(p_showcase_ids uuid[])
RETURNS SETOF public.profile_pinned_showcases
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_valid_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF array_length(p_showcase_ids, 1) > 3 THEN
    RAISE EXCEPTION 'Cannot pin more than 3 showcases';
  END IF;

  SELECT COUNT(*) INTO v_valid_count
  FROM public.showcases s
  WHERE s.id = ANY(p_showcase_ids)
    AND (
      s.user_id = v_user_id
      OR EXISTS (
        SELECT 1 FROM public.showcases_members m
        WHERE m.showcase_id = s.id AND m.user_id = v_user_id
      )
    );

  IF v_valid_count <> COALESCE(array_length(p_showcase_ids, 1), 0) THEN
    RAISE EXCEPTION 'Can only pin showcases you own or participate in';
  END IF;

  DELETE FROM public.profile_pinned_showcases WHERE user_id = v_user_id;

  INSERT INTO public.profile_pinned_showcases (user_id, showcase_id, display_order)
  SELECT v_user_id, sid, ord - 1
  FROM unnest(p_showcase_ids) WITH ORDINALITY AS t(sid, ord);

  RETURN QUERY
    SELECT * FROM public.profile_pinned_showcases
    WHERE user_id = v_user_id ORDER BY display_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_pinned_showcases(uuid[]) TO authenticated;

NOTIFY pgrst, 'reload schema';
