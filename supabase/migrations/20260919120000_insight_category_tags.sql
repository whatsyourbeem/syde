-- Blog categories and free-form tags for insights. Both are optional: existing posts stay
-- uncategorized with no tags.
alter table public.insights
  add column category text check (category in ('story', 'launch', 'tech', 'growth', 'til')),
  add column tags text[] not null default '{}';

create index insights_tags_idx on public.insights using gin (tags);
create index insights_category_created_idx on public.insights (category, created_at desc);
