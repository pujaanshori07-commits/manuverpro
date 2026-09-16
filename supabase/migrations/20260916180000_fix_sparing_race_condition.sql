-- Phase: Security Fix - Open Sparing Race Condition
-- Introduces a BEFORE INSERT trigger with FOR UPDATE lock to prevent overfilling sessions.

-- 1. Fungsi Validasi Sebelum Insert
CREATE OR REPLACE FUNCTION public.fn_prevent_overfill_session()
RETURNS TRIGGER AS $$
DECLARE
  v_slots_total INTEGER;
  v_slots_filled INTEGER;
  v_status TEXT;
BEGIN
  -- Kunci baris sesi (FOR UPDATE) agar tidak ada eksekusi ganda (Race Condition) di milidetik yang sama
  SELECT slots_total, slots_filled, status 
  INTO v_slots_total, v_slots_filled, v_status
  FROM public.open_sessions
  WHERE id = NEW.session_id
  FOR UPDATE;
  
  IF v_status != 'open' OR v_slots_filled >= v_slots_total THEN
    RAISE EXCEPTION 'Mohon maaf, sesi ini sudah penuh atau ditutup.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Pasang Trigger SEBELUM Insert
DROP TRIGGER IF EXISTS trg_prevent_overfill_session ON public.session_participants;
CREATE TRIGGER trg_prevent_overfill_session
BEFORE INSERT ON public.session_participants
FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_overfill_session();
