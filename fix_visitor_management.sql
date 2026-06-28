-- Allow authors to update memberships (toggle permissions) in their rooms
CREATE POLICY "Authors can update room memberships"
  ON memberships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = memberships.room_id
      AND rooms.author_id = auth.uid()
    )
  );

-- Allow authors to delete memberships (remove users) in their rooms
CREATE POLICY "Authors can delete room memberships"
  ON memberships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = memberships.room_id
      AND rooms.author_id = auth.uid()
    )
  );
