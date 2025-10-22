/*
  # Fix RLS Policies for Anonymous Access

  ## Overview
  This migration updates RLS policies to allow anonymous users to interact with the race system.
  The original policies required authentication, but this application runs without auth.

  ## Changes

  ### `races` table policies
  - Update INSERT policy to allow anonymous users
  - Update UPDATE policy to allow anonymous users
  - Update DELETE policy to allow anonymous users
  - Keep SELECT policy allowing both anonymous and authenticated users

  ### `participants` table policies
  - Update INSERT policy to allow anonymous users
  - Update UPDATE policy to allow anonymous users
  - Update DELETE policy to allow anonymous users
  - Keep SELECT policy allowing both anonymous and authenticated users

  ### `cadence_events` table policies
  - Update INSERT policy to allow anonymous users
  - Update DELETE policy to allow anonymous users
  - Keep SELECT policy allowing both anonymous and authenticated users

  ## Security Note
  These policies allow full public access since this is a race display system
  without authentication. In a production environment with authentication,
  these policies should be more restrictive.
*/

-- Drop existing restrictive policies for races
DROP POLICY IF EXISTS "Authenticated users can insert races" ON races;
DROP POLICY IF EXISTS "Authenticated users can update races" ON races;
DROP POLICY IF EXISTS "Authenticated users can delete races" ON races;

-- Create new permissive policies for races
CREATE POLICY "Anyone can insert races"
  ON races FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update races"
  ON races FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete races"
  ON races FOR DELETE
  TO anon, authenticated
  USING (true);

-- Drop existing restrictive policies for participants
DROP POLICY IF EXISTS "Authenticated users can insert participants" ON participants;
DROP POLICY IF EXISTS "Authenticated users can update participants" ON participants;
DROP POLICY IF EXISTS "Authenticated users can delete participants" ON participants;

-- Create new permissive policies for participants
CREATE POLICY "Anyone can insert participants"
  ON participants FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update participants"
  ON participants FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete participants"
  ON participants FOR DELETE
  TO anon, authenticated
  USING (true);

-- Drop existing restrictive policies for cadence_events
DROP POLICY IF EXISTS "Authenticated users can insert cadence events" ON cadence_events;
DROP POLICY IF EXISTS "Authenticated users can delete cadence events" ON cadence_events;

-- Create new permissive policies for cadence_events
CREATE POLICY "Anyone can insert cadence events"
  ON cadence_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can delete cadence events"
  ON cadence_events FOR DELETE
  TO anon, authenticated
  USING (true);