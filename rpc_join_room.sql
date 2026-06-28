-- Run this in your Supabase SQL Editor

-- This function bypasses RLS to safely find the next alias_number and insert the membership
CREATE OR REPLACE FUNCTION join_room_securely(
  target_room_id UUID,
  target_account_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This makes it run as postgres (admin), bypassing RLS
AS $$
DECLARE
  next_alias INTEGER;
BEGIN
  -- Find the highest alias number currently in the room
  SELECT COALESCE(MAX(alias_number), 0) + 1
  INTO next_alias
  FROM memberships
  WHERE room_id = target_room_id;

  -- Insert the new membership
  INSERT INTO memberships (account_id, room_id, alias_number, upload_permission, individually_restricted)
  VALUES (target_account_id, target_room_id, next_alias, true, false);
END;
$$;
