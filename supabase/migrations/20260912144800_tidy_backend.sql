-- ==========================================
-- BACKEND TIDY-UP: TRIGGERS, RLS, STORAGE
-- ==========================================

-- 1. Create Storage Bucket for Avatars
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Auth Trigger to Auto-Create Profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nama)
  values (
    new.id,
    -- Extracts 'nama' from the user metadata provided during signUp
    coalesce(new.raw_user_meta_data->>'nama', 'Pengguna Baru')
  );
  return new;
end;
$$;

-- Drop trigger if exists to prevent duplicates, then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 3. Enable RLS and Create Policies
-- Note: 'alter table' will silently succeed if RLS is already enabled

-- PROFILES
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- SWIPES
alter table public.swipes enable row level security;
create policy "Users can view their own swipes."
  on swipes for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own swipes."
  on swipes for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own swipes (undo)."
  on swipes for delete
  using ( auth.uid() = user_id );

-- MATCHES
alter table public.matches enable row level security;
create policy "Users can view their matches."
  on matches for select
  using ( auth.uid() = user_a_id or auth.uid() = user_b_id );

create policy "Users can insert matches if they are involved."
  on matches for insert
  with check ( auth.uid() = user_a_id or auth.uid() = user_b_id );

create policy "Users can update their matches."
  on matches for update
  using ( auth.uid() = user_a_id or auth.uid() = user_b_id );

-- MESSAGES
alter table public.messages enable row level security;
create policy "Users can view messages of their matches."
  on messages for select
  using ( 
    exists (
      select 1 from matches m 
      where m.id = messages.match_id 
      and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  );

create policy "Users can send messages to their matches."
  on messages for insert
  with check ( 
    auth.uid() = sender_id and
    exists (
      select 1 from matches m 
      where m.id = messages.match_id 
      and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  );

-- MEETUPS
alter table public.meetups enable row level security;
create policy "Users can view meetups of their matches."
  on meetups for select
  using ( 
    exists (
      select 1 from matches m 
      where m.id = meetups.match_id 
      and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  );

create policy "Users can create meetups for their matches."
  on meetups for insert
  with check ( 
    auth.uid() = sender_id and
    exists (
      select 1 from matches m 
      where m.id = meetups.match_id 
      and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  );

create policy "Users can update meetups of their matches."
  on meetups for update
  using ( 
    exists (
      select 1 from matches m 
      where m.id = meetups.match_id 
      and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  );
