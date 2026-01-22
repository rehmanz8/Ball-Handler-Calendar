create extension if not exists "pgcrypto";

create table if not exists circles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists circle_members (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  color text not null,
  timezone text not null,
  role text not null check (role in ('host','member')),
  created_at timestamptz default now(),
  unique (circle_id, user_id)
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references circles(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  is_all_day boolean not null default false,
  recurrence_rule text null,
  recurrence_start date null,
  recurrence_end date null,
  created_at timestamptz default now()
);

create index if not exists events_circle_start_idx on events(circle_id, start_at);
create index if not exists events_owner_idx on events(owner_user_id);

alter table circles enable row level security;
alter table circle_members enable row level security;
alter table events enable row level security;

create or replace function public.is_circle_member(circle_uuid uuid, user_uuid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from circle_members
    where circle_id = circle_uuid
      and user_id = user_uuid
  );
$$;

create or replace function public.is_circle_host(circle_uuid uuid, user_uuid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from circle_members
    where circle_id = circle_uuid
      and user_id = user_uuid
      and role = 'host'
  );
$$;

create policy "circles_select" on circles
  for select
  using (public.is_circle_member(id, auth.uid()));

create policy "circles_insert" on circles
  for insert
  with check (created_by = auth.uid());

create policy "circles_update" on circles
  for update
  using (created_by = auth.uid());

create policy "circles_delete" on circles
  for delete
  using (created_by = auth.uid());

create policy "circle_members_select" on circle_members
  for select
  using (public.is_circle_member(circle_id, auth.uid()));

create policy "circle_members_insert" on circle_members
  for insert
  with check (auth.uid() = user_id);

create policy "circle_members_update" on circle_members
  for update
  using (auth.uid() = user_id);

create policy "circle_members_delete" on circle_members
  for delete
  using (
    auth.uid() = user_id
    or public.is_circle_host(circle_id, auth.uid())
  );

create policy "events_select" on events
  for select
  using (public.is_circle_member(circle_id, auth.uid()));

create policy "events_insert" on events
  for insert
  with check (
    auth.uid() = owner_user_id
    and public.is_circle_member(circle_id, auth.uid())
  );

create policy "events_update" on events
  for update
  using (auth.uid() = owner_user_id);

create policy "events_delete" on events
  for delete
  using (auth.uid() = owner_user_id);

create or replace function public.delete_events_on_member_remove()
returns trigger
language plpgsql
security definer
as $$
begin
  delete from events
  where circle_id = old.circle_id
    and owner_user_id = old.user_id;
  return old;
end;
$$;

drop trigger if exists circle_members_cleanup on circle_members;
create trigger circle_members_cleanup
  after delete on circle_members
  for each row
  execute procedure public.delete_events_on_member_remove();
