alter table public.locations enable row level security;

create policy "public can read locations"
on public.locations
for select
to anon
using (true);

create policy "authenticated can read locations"
on public.locations
for select
to authenticated
using (true);

create policy "authenticated can insert locations"
on public.locations
for insert
to authenticated
with check (true);

create policy "authenticated can update locations"
on public.locations
for update
to authenticated
using (true)
with check (true);

create policy "authenticated can delete locations"
on public.locations
for delete
to authenticated
using (true);