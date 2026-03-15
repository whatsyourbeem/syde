-- Enable RLS
alter table "public"."showcases_images" enable row level security;

-- Policy for INSERT: Users can insert images only to showcases they own
create policy "Users can insert images to their own showcases"
on "public"."showcases_images"
for insert
to authenticated
with check (
  exists (
    select 1 from showcases
    where id = showcases_images.showcase_id
    and user_id = auth.uid()
  )
);

-- Policy for SELECT: Everyone can view showcase images
create policy "Everyone can view showcase images"
on "public"."showcases_images"
for select
using (true);

-- Policy for DELETE: Users can delete images from showcases they own
create policy "Users can delete images from their own showcases"
on "public"."showcases_images"
for delete
to authenticated
using (
  exists (
    select 1 from showcases
    where id = showcases_images.showcase_id
    and user_id = auth.uid()
  )
);
