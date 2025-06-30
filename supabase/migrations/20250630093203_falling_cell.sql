/*
  # Fix RLS policy for events table to allow trigger operations

  1. Security Changes
    - Update RLS policy on `events` table to allow public insert access
    - This is needed because signals can be inserted by public users, and database triggers
      automatically create events from signals
    - The triggers run with the same permissions as the user inserting the signal

  2. Changes Made
    - Add policy to allow public users to insert events (needed for triggers)
    - Keep existing policies for authenticated user management
    - Maintain read access for public users
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Allow public insert access to events" ON events;

-- Add policy to allow public users to insert events (needed for database triggers)
CREATE POLICY "Allow public insert access to events"
  ON events
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Ensure the existing policies are still in place
-- (These should already exist based on the schema, but we'll recreate them to be safe)

DROP POLICY IF EXISTS "Allow authenticated users to manage events" ON events;
CREATE POLICY "Allow authenticated users to manage events"
  ON events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to events" ON events;
CREATE POLICY "Allow public read access to events"
  ON events
  FOR SELECT
  TO public
  USING (true);