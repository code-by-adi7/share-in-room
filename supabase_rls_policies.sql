-- =============================================
-- RoomShare — Create missing tables + RLS Policies
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. CREATE TABLES (IF NOT EXISTS)
-- =================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_enabled BOOLEAN DEFAULT true,
  total_visitor_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  alias_number INTEGER NOT NULL,
  upload_permission BOOLEAN DEFAULT true,
  individually_restricted BOOLEAN DEFAULT false,
  first_entry_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(account_id, room_id)
);

CREATE TABLE IF NOT EXISTS active_room_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  last_heartbeat TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  last_entry_at TIMESTAMPTZ DEFAULT now(),
  encrypted_room_password TEXT NOT NULL,
  UNIQUE(account_id, room_id)
);


-- 2. ENABLE RLS ON ALL TABLES
-- ============================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_room_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;


-- 3. RLS POLICIES
-- ================

-- PROFILES
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


-- ROOMS
CREATE POLICY "Authenticated users can read rooms"
  ON rooms FOR SELECT
  USING (auth.role() = 'authenticated' AND is_deleted = false);

CREATE POLICY "Authenticated users can create rooms"
  ON rooms FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own rooms"
  ON rooms FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own rooms"
  ON rooms FOR DELETE
  USING (auth.uid() = author_id);


-- MEMBERSHIPS
CREATE POLICY "Users can read own memberships"
  ON memberships FOR SELECT
  USING (auth.uid() = account_id);

CREATE POLICY "Users can join rooms"
  ON memberships FOR INSERT
  WITH CHECK (auth.uid() = account_id);

CREATE POLICY "Authors can read room memberships"
  ON memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = memberships.room_id
      AND rooms.author_id = auth.uid()
    )
  );


-- ACTIVE_ROOM_SESSIONS
CREATE POLICY "Users can read own sessions"
  ON active_room_sessions FOR SELECT
  USING (auth.uid() = account_id);

CREATE POLICY "Users can insert own sessions"
  ON active_room_sessions FOR INSERT
  WITH CHECK (auth.uid() = account_id);

CREATE POLICY "Users can update own sessions"
  ON active_room_sessions FOR UPDATE
  USING (auth.uid() = account_id);

CREATE POLICY "Users can delete own sessions"
  ON active_room_sessions FOR DELETE
  USING (auth.uid() = account_id);

CREATE POLICY "Members can read room sessions"
  ON active_room_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.room_id = active_room_sessions.room_id
      AND memberships.account_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = active_room_sessions.room_id
      AND rooms.author_id = auth.uid()
    )
  );


-- FILES
CREATE POLICY "Members can read room files"
  ON files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.room_id = files.room_id
      AND memberships.account_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = files.room_id
      AND rooms.author_id = auth.uid()
    )
  );

CREATE POLICY "Members can upload files"
  ON files FOR INSERT
  WITH CHECK (
    auth.uid() = uploader_id
    AND (
      EXISTS (
        SELECT 1 FROM memberships
        WHERE memberships.room_id = files.room_id
        AND memberships.account_id = auth.uid()
        AND memberships.upload_permission = true
        AND memberships.individually_restricted = false
      )
      OR
      EXISTS (
        SELECT 1 FROM rooms
        WHERE rooms.id = files.room_id
        AND rooms.author_id = auth.uid()
      )
    )
  );


-- HISTORY
CREATE POLICY "Users can read own history"
  ON history FOR SELECT
  USING (auth.uid() = account_id);

CREATE POLICY "Users can insert own history"
  ON history FOR INSERT
  WITH CHECK (auth.uid() = account_id);

CREATE POLICY "Users can update own history"
  ON history FOR UPDATE
  USING (auth.uid() = account_id);


-- 4. HELPER FUNCTION (for incrementing visitor count)
-- ====================================================

CREATE OR REPLACE FUNCTION increment_visitor_count(room_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE rooms
  SET total_visitor_count = total_visitor_count + 1
  WHERE id = room_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. STORAGE BUCKET + POLICIES
-- ==============================

-- Create the storage bucket (run this separately if it errors)
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-files', 'room-files', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'room-files'
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to read/download files
CREATE POLICY "Authenticated users can read files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'room-files'
    AND auth.role() = 'authenticated'
  );
