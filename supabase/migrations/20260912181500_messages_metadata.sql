-- Add type and metadata columns to messages table for rich content like Sparing Invites

-- 1. Create message_type enum if you want strict typing (optional, but good practice)
-- CREATE TYPE public.message_type AS ENUM ('text', 'sparing_invite', 'system');

-- 2. Add columns to the messages table
-- We use VARCHAR instead of ENUM for simplicity and forward compatibility if needed
ALTER TABLE public.messages
ADD COLUMN type VARCHAR(50) DEFAULT 'text' NOT NULL,
ADD COLUMN metadata JSONB;

-- Example of what metadata will contain for a sparing_invite:
-- {
--   "invite_id": "uuid",
--   "sport": "badminton",
--   "venue_name": "GBK Senayan",
--   "scheduled_at": "2026-09-15T08:00:00Z"
-- }
