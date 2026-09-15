-- Jalankan file ini di Supabase SQL Editor (Project > SQL Editor > New query).
--
-- Fungsi ini menggantikan pola lama "update profiles per slide" +
-- "delete lalu insert user_sports terpisah dari client". Sekarang semua
-- ditulis dalam SATU transaksi Postgres: kalau ada bagian yang gagal,
-- semuanya di-rollback.
--
-- PENTING: cek dulu tipe kolom `sport_id` di tabel user_sports kamu.
-- Kalau bertipe uuid, ganti p_sport_ids dan cast di bagian INSERT
-- dari integer[] menjadi uuid[].

create or replace function public.complete_onboarding(
  p_nama text,
  p_tanggal_lahir date,
  p_negara text,
  p_alamat text,
  p_foto_url text,
  p_skill_level text,
  p_hobi text,
  p_looking_for text,
  p_availability text,
  p_bio text,
  p_pendidikan text,
  p_pekerjaan text,
  p_sport_ids text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Tidak terautentikasi';
  end if;

  update public.profiles
  set
    nama            = coalesce(p_nama, nama),
    tanggal_lahir   = coalesce(p_tanggal_lahir, tanggal_lahir),
    negara          = coalesce(p_negara, negara),
    alamat          = coalesce(p_alamat, alamat),
    foto_url        = coalesce(p_foto_url, foto_url),
    skill_level     = coalesce(p_skill_level, skill_level),
    hobi            = coalesce(p_hobi, hobi),
    looking_for     = coalesce(p_looking_for, looking_for),
    availability    = coalesce(p_availability, availability),
    bio             = coalesce(p_bio, bio),
    pendidikan      = coalesce(p_pendidikan, pendidikan),
    pekerjaan       = coalesce(p_pekerjaan, pekerjaan),
    onboarding_complete = true
  where id = v_user_id;

  if not found then
    raise exception 'Profil tidak ditemukan untuk user %', v_user_id;
  end if;

  if p_sport_ids is not null and array_length(p_sport_ids, 1) > 0 then
    delete from public.user_sports where user_id = v_user_id;

    insert into public.user_sports (user_id, sport_id)
    select v_user_id, unnest(p_sport_ids);
  end if;
end;
$$;

grant execute on function public.complete_onboarding(
  text, date, text, text, text, text, text, text, text, text, text, text, text[]
) to authenticated;
