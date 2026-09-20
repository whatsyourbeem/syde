-- B10 migration A: rename the insight tables, columns, constraints, indexes, policies, functions, triggers and
-- storage bucket to blog_post / blog names, and keep a compatibility layer (views, the old RPC, the old bucket
-- and its policies) so the code deployed before this change keeps working until the new code is live.
-- The compatibility layer is removed by the follow-up migration (drop_insight_compat).
--
-- Data is renamed, never copied: rows, indexes, foreign keys and RLS policies follow their tables.
-- Function bodies are NOT rewritten by RENAME, so every function that mentions a renamed object is recreated.
begin;

-- 1. tables ---------------------------------------------------------------------------------------------------
alter table public.insights rename to blog_posts;
alter table public.insight_comments rename to blog_post_comments;
alter table public.insight_likes rename to blog_post_likes;
alter table public.insight_bookmarks rename to blog_post_bookmarks;
alter table public.insight_comment_likes rename to blog_post_comment_likes;

-- 2. columns --------------------------------------------------------------------------------------------------
alter table public.blog_post_comments rename column insight_id to blog_post_id;
alter table public.blog_post_likes rename column insight_id to blog_post_id;
alter table public.blog_post_bookmarks rename column insight_id to blog_post_id;

-- 3. constraints (renaming a primary key / unique constraint renames its index too) --------------------------
alter table public.blog_posts rename constraint insights_pkey to blog_posts_pkey;
alter table public.blog_posts rename constraint insights_user_id_fkey to blog_posts_user_id_fkey;
alter table public.blog_posts rename constraint insights_slug_key to blog_posts_slug_key;
alter table public.blog_posts rename constraint insights_category_check to blog_posts_category_check;

alter table public.blog_post_comments rename constraint insight_comments_pkey to blog_post_comments_pkey;
alter table public.blog_post_comments rename constraint insight_comments_insight_id_fkey to blog_post_comments_blog_post_id_fkey;
alter table public.blog_post_comments rename constraint insight_comments_user_id_fkey to blog_post_comments_user_id_fkey;
alter table public.blog_post_comments rename constraint insight_comments_parent_comment_id_fkey to blog_post_comments_parent_comment_id_fkey;

alter table public.blog_post_likes rename constraint insight_likes_insight_id_fkey to blog_post_likes_blog_post_id_fkey;
alter table public.blog_post_likes rename constraint insight_likes_user_id_fkey to blog_post_likes_user_id_fkey;
alter table public.blog_post_likes rename constraint insight_likes_insight_id_user_id_key to blog_post_likes_blog_post_id_user_id_key;

alter table public.blog_post_bookmarks rename constraint insight_bookmarks_pkey to blog_post_bookmarks_pkey;
alter table public.blog_post_bookmarks rename constraint insight_bookmarks_insight_id_fkey to blog_post_bookmarks_blog_post_id_fkey;
alter table public.blog_post_bookmarks rename constraint insight_bookmarks_user_id_fkey to blog_post_bookmarks_user_id_fkey;

alter table public.blog_post_comment_likes rename constraint insight_comment_likes_pkey to blog_post_comment_likes_pkey;
alter table public.blog_post_comment_likes rename constraint insight_comment_likes_comment_id_user_id_key to blog_post_comment_likes_comment_id_user_id_key;
alter table public.blog_post_comment_likes rename constraint insight_comment_likes_comment_id_fkey to blog_post_comment_likes_comment_id_fkey;
alter table public.blog_post_comment_likes rename constraint insight_comment_likes_user_id_fkey to blog_post_comment_likes_user_id_fkey;

-- 4. standalone indexes ---------------------------------------------------------------------------------------
alter index public.insights_tags_idx rename to blog_posts_tags_idx;
alter index public.insights_category_created_idx rename to blog_posts_category_created_idx;

-- 5. RLS policies whose names mention insight (policies without insight in the name follow their table) ---------
alter policy "anyone can view insights" on public.blog_posts rename to "anyone can view blog posts";
alter policy "users can insert their own insights" on public.blog_posts rename to "users can insert their own blog posts";
alter policy "users can update their own insights" on public.blog_posts rename to "users can update their own blog posts";
alter policy "users can delete their own insights" on public.blog_posts rename to "users can delete their own blog posts";
alter policy "anyone can view insight comments" on public.blog_post_comments rename to "anyone can view blog post comments";
alter policy "anyone can view insight likes" on public.blog_post_likes rename to "anyone can view blog post likes";
alter policy "anyone can view insight comment likes" on public.blog_post_comment_likes rename to "anyone can view blog post comment likes";

-- 6. functions and triggers -----------------------------------------------------------------------------------
-- slug generator: no table reference inside, a plain rename is enough
alter function public.generate_insight_slug(text) rename to generate_blog_post_slug;

-- slug trigger function: the body names public.insights and the generator, so it is recreated
create function public.trig_handle_blog_post_slug()
returns trigger
language plpgsql
as $$
begin
    if new.slug is null and new.title is not null then
        new.slug := public.generate_blog_post_slug(new.title);
        -- If slug already exists, append partial ID for uniqueness
        if exists (select 1 from public.blog_posts where slug = new.slug) then
            new.slug := new.slug || '-' || substr(new.id::text, 1, 8);
        end if;
    end if;
    return new;
end;
$$;

drop trigger handle_insight_slug_on_insert on public.blog_posts;
create trigger handle_blog_post_slug_on_insert
    before insert on public.blog_posts
    for each row execute function public.trig_handle_blog_post_slug();
drop function public.trig_handle_insight_slug();

-- activity feed trigger function. It still writes 'INSIGHT_CREATED' on purpose: the code deployed before this
-- change only understands that value. The follow-up migration switches it to 'BLOG_POST_CREATED'.
create function public.create_activity_on_blog_post_created()
returns trigger
language plpgsql
security definer
as $$
begin
    insert into public.activity_feed (user_id, activity_type, target_id)
    values (new.user_id, 'INSIGHT_CREATED', new.id);
    return new;
end;
$$;

drop trigger trigger_activity_insight_created on public.blog_posts;
create trigger trigger_activity_blog_post_created
    after insert on public.blog_posts
    for each row execute function public.create_activity_on_blog_post_created();
drop function public.create_activity_on_insight_created();

-- triggers that keep their (shared) function only change name
alter trigger trigger_delete_activity_on_insight_deleted on public.blog_posts
    rename to trigger_delete_activity_on_blog_post_deleted;
alter trigger set_insight_comments_updated_at on public.blog_post_comments
    rename to set_blog_post_comments_updated_at;

-- view counter RPC: a parameter name cannot change through create or replace, so add the new function and turn
-- the old one into a thin wrapper (old code keeps calling increment_insight_views(insight_id)).
create function public.increment_blog_post_views(p_blog_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    update public.blog_posts set views = views + 1 where id = p_blog_post_id;
end;
$$;
grant execute on function public.increment_blog_post_views(uuid) to anon, authenticated, service_role;

create or replace function public.increment_insight_views(insight_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    perform public.increment_blog_post_views(insight_id);
end;
$$;

-- 7. compatibility views under the old names (security_invoker: the base tables' RLS policies still apply) -----
create view public.insights with (security_invoker = true) as
    select * from public.blog_posts;
create view public.insight_comments with (security_invoker = true) as
    select id, blog_post_id as insight_id, user_id, content, created_at, updated_at, parent_comment_id
      from public.blog_post_comments;
create view public.insight_likes with (security_invoker = true) as
    select id, blog_post_id as insight_id, user_id, created_at
      from public.blog_post_likes;
create view public.insight_bookmarks with (security_invoker = true) as
    select blog_post_id as insight_id, user_id, created_at
      from public.blog_post_bookmarks;
create view public.insight_comment_likes with (security_invoker = true) as
    select * from public.blog_post_comment_likes;

grant select, insert, update, delete on
    public.insights, public.insight_comments, public.insight_likes,
    public.insight_bookmarks, public.insight_comment_likes
    to anon, authenticated, service_role;

-- 8. storage: a new bucket (bucket ids cannot be renamed) with the same settings as the old one, plus policies.
-- The old bucket and its policies stay until the files are copied and the old bucket is retired.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select 'blog-images', 'blog-images', public, file_size_limit, allowed_mime_types
  from storage.buckets
 where id = 'insight-images'
on conflict (id) do nothing;

create policy "Public Read Blog Images" on storage.objects
    for select using (bucket_id = 'blog-images');

create policy "Auth Upload Blog Images" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'blog-images' and (storage.foldername(name))[1] = (auth.uid())::text);

create policy "Auth Delete Blog Images" on storage.objects
    for delete to authenticated
    using (bucket_id = 'blog-images' and (storage.foldername(name))[1] = (auth.uid())::text);

notify pgrst, 'reload schema';

commit;
