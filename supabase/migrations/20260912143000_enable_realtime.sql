-- Enable realtime for tables
-- This allows clients to listen to inserts/updates/deletes on these tables

begin;
  
  -- Create or replace publication for supabase_realtime if it doesn't exist
  -- (Normally supabase_realtime publication is created by default by Supabase)
  
  -- Add messages table to realtime publication
  alter publication supabase_realtime add table public.messages;
  
  -- Add matches table to realtime publication
  alter publication supabase_realtime add table public.matches;
  
  -- Add meetups table to realtime publication
  alter publication supabase_realtime add table public.meetups;
  
commit;
