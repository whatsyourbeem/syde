-- Create meetup_reviews table
create table public.meetup_reviews (
  id uuid not null default gen_random_uuid(),
  meetup_id uuid not null,
  user_id uuid not null,
  rating integer not null,
  content text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint meetup_reviews_pkey primary key (id),
  constraint meetup_reviews_meetup_id_fkey foreign key (meetup_id) references public.meetups (id) on delete cascade,
  constraint meetup_reviews_user_id_fkey foreign key (user_id) references public.profiles (id) on delete cascade,
  constraint meetup_reviews_rating_check check (rating >= 1 and rating <= 5)
);

-- Enable Row Level Security (RLS)
alter table public.meetup_reviews enable row level security;

-- Create RLS Policies
-- 1. SELECT (Allow everyone to read reviews)
create policy "Allow public read access to meetup reviews"
  on public.meetup_reviews for select
  using (true);

-- 2. INSERT (Allow approved participants to insert reviews)
create policy "Allow approved participants to insert reviews"
  on public.meetup_reviews for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.meetup_participants
      where meetup_id = meetup_reviews.meetup_id
        and user_id = auth.uid()
        and status = 'APPROVED'
    )
  );

-- 3. UPDATE (Allow only review author to update their review)
create policy "Allow users to update their own reviews"
  on public.meetup_reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. DELETE (Allow only review author to delete their review)
create policy "Allow users to delete their own reviews"
  on public.meetup_reviews for delete
  using (auth.uid() = user_id);
