-- B10 migration B: remove the insight compatibility layer and switch the activity value.
--
-- Apply only after the code that uses the blog_post names is live everywhere AND the blog images have been copied
-- to the blog-images bucket and the stored URLs replaced (scripts/migrate-blog-images.ts, then
-- scripts/blog-images-url-replace.sql). Anything still reading the old names breaks the moment this runs.
--
-- The old bucket insight-images and its three storage policies are left alone; they are retired later, by hand.
begin;

-- 1. activity feed: rows written under the old name become the new value, and new rows use it too.
update public.activity_feed
   set activity_type = 'BLOG_POST_CREATED'
 where activity_type = 'INSIGHT_CREATED';

create or replace function public.create_activity_on_blog_post_created()
returns trigger
language plpgsql
security definer
as $$
begin
    insert into public.activity_feed (user_id, activity_type, target_id)
    values (new.user_id, 'BLOG_POST_CREATED', new.id);
    return new;
end;
$$;

-- 2. compatibility views under the old names (nothing depends on one another, so the order does not matter)
drop view public.insight_comment_likes;
drop view public.insight_bookmarks;
drop view public.insight_likes;
drop view public.insight_comments;
drop view public.insights;

-- 3. old view-counter RPC (its wrapper body called increment_blog_post_views)
drop function public.increment_insight_views(uuid);

notify pgrst, 'reload schema';

commit;
