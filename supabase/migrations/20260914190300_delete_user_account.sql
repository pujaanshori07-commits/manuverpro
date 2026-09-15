create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  -- Get the current authenticated user ID
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Tidak terautentikasi';
  end if;

  -- Delete the user from auth.users. 
  -- Due to foreign key constraints with ON DELETE CASCADE, 
  -- this will also delete the user's profile and related data.
  delete from auth.users where id = v_user_id;
end;
$$;
