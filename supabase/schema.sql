create table if not exists public.rooms (
  code text primary key,
  password text not null,
  host_token text not null,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rooms enable row level security;
alter table public.rooms replica identity full;

grant select, insert, update on public.rooms to anon;
grant select, insert, update on public.rooms to authenticated;

drop policy if exists "rooms_select_anon" on public.rooms;
drop policy if exists "rooms_insert_anon" on public.rooms;
drop policy if exists "rooms_update_anon" on public.rooms;

create policy "rooms_select_anon"
  on public.rooms
  for select
  to anon
  using (true);

create policy "rooms_insert_anon"
  on public.rooms
  for insert
  to anon
  with check (true);

create policy "rooms_update_anon"
  on public.rooms
  for update
  to anon
  using (true)
  with check (true);

create or replace function public.set_room_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_rooms_updated_at on public.rooms;

create trigger set_rooms_updated_at
  before update on public.rooms
  for each row
  execute function public.set_room_updated_at();

drop function if exists public.delete_room(text, text);

create function public.delete_room(
  room_code text,
  room_host_token text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.rooms
  where code = upper(trim(room_code))
    and host_token = room_host_token;

  get diagnostics deleted_count = row_count;

  return deleted_count = 1;
end;
$$;

grant execute on function public.delete_room(text, text) to anon;
grant execute on function public.delete_room(text, text) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;
end;
$$;

notify pgrst, 'reload schema';
