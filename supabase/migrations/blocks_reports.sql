-- Phase 7: Block & Report User functionality

-- Drop existing tables to avoid schema conflicts (e.g. old user_id vs blocker_id)
DROP TABLE IF EXISTS blocks CASCADE;
DROP TABLE IF EXISTS reports CASCADE;

-- Create blocks table
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL, -- e.g., 'inappropriate_message', 'fake_profile', 'harassment'
  details TEXT, -- optional: user can add more context
  created_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'open' -- 'open', 'reviewing', 'resolved'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_id ON reports(reported_id);

-- Enable RLS
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blocks table
CREATE POLICY "Users can view their own blocks"
  ON blocks FOR SELECT
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

CREATE POLICY "Users can block others"
  ON blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock"
  ON blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- RLS Policies for reports table
CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- RPC: Block a user
CREATE OR REPLACE FUNCTION block_user(p_blocked_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO blocks (blocker_id, blocked_id)
  VALUES (auth.uid(), p_blocked_id)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Unblock a user
CREATE OR REPLACE FUNCTION unblock_user(p_blocked_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM blocks
  WHERE blocker_id = auth.uid()
    AND blocked_id = p_blocked_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Report a user
CREATE OR REPLACE FUNCTION report_user(p_reported_id UUID, p_reason TEXT, p_details TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
  INSERT INTO reports (reporter_id, reported_id, reason, details)
  VALUES (auth.uid(), p_reported_id, p_reason, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocks
    WHERE (blocker_id = auth.uid() AND blocked_id = p_user_id)
       OR (blocker_id = p_user_id AND blocked_id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Get blocked user IDs (for filtering)
CREATE OR REPLACE FUNCTION get_blocked_user_ids()
RETURNS TABLE(user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT blocked_id FROM blocks
  WHERE blocker_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
