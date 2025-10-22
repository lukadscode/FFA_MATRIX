/*
  # Create Race Management Schema

  ## Overview
  This migration creates the database schema for managing rowing race sessions
  with PM5 Concept2 integration, supporting both solo and team modes.

  ## New Tables
  
  ### `races`
  Stores race session configuration
  - `id` (uuid, primary key) - Unique race identifier
  - `name` (text) - Race name/description
  - `mode` (text) - Race mode: 'solo' or 'team'
  - `target_cadence_min` (integer) - Minimum target strokes per minute
  - `target_cadence_max` (integer) - Maximum target strokes per minute
  - `duration_seconds` (integer) - Race duration (default 300 for 5 minutes)
  - `status` (text) - Race status: 'setup', 'active', 'completed'
  - `started_at` (timestamptz) - When race started
  - `ended_at` (timestamptz) - When race ended
  - `created_at` (timestamptz) - Record creation time

  ### `participants`
  Stores participant information for each race
  - `id` (uuid, primary key) - Unique participant identifier
  - `race_id` (uuid, foreign key) - Reference to race
  - `name` (text) - Participant name
  - `team_id` (integer) - Team number (for team mode, null for solo)
  - `ws_connection_id` (text) - WebSocket connection identifier for PM5
  - `total_distance_in_cadence` (integer) - Total meters in correct cadence
  - `current_cadence` (integer) - Current strokes per minute
  - `is_in_cadence` (boolean) - Whether currently rowing at target cadence
  - `created_at` (timestamptz) - Record creation time

  ### `cadence_events`
  Stores each stroke event for tracking and replay
  - `id` (uuid, primary key) - Unique event identifier
  - `participant_id` (uuid, foreign key) - Reference to participant
  - `race_id` (uuid, foreign key) - Reference to race
  - `cadence` (integer) - Strokes per minute at this event
  - `was_in_cadence` (boolean) - Whether this stroke was in target range
  - `distance_gained` (integer) - Meters gained from this stroke
  - `timestamp` (timestamptz) - When stroke occurred

  ## Security
  
  ### Row Level Security (RLS)
  - All tables have RLS enabled
  - Public read access for race display screens
  - Authenticated write access for race management
  
  ### Policies
  - Anyone can view races and participants (for display purposes)
  - Only authenticated users can create/modify races
  - Only authenticated users can insert cadence events
*/

-- Create races table
CREATE TABLE IF NOT EXISTS races (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('solo', 'team')),
  target_cadence_min integer NOT NULL DEFAULT 20,
  target_cadence_max integer NOT NULL DEFAULT 24,
  duration_seconds integer NOT NULL DEFAULT 300,
  status text NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'completed')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  name text NOT NULL,
  team_id integer,
  ws_connection_id text,
  total_distance_in_cadence integer DEFAULT 0,
  current_cadence integer DEFAULT 0,
  is_in_cadence boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create cadence events table
CREATE TABLE IF NOT EXISTS cadence_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  race_id uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  cadence integer NOT NULL,
  was_in_cadence boolean NOT NULL,
  distance_gained integer NOT NULL DEFAULT 0,
  timestamp timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_participants_race_id ON participants(race_id);
CREATE INDEX IF NOT EXISTS idx_cadence_events_participant_id ON cadence_events(participant_id);
CREATE INDEX IF NOT EXISTS idx_cadence_events_race_id ON cadence_events(race_id);
CREATE INDEX IF NOT EXISTS idx_cadence_events_timestamp ON cadence_events(timestamp);

-- Enable Row Level Security
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadence_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for races table
CREATE POLICY "Anyone can view races"
  ON races FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert races"
  ON races FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update races"
  ON races FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete races"
  ON races FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for participants table
CREATE POLICY "Anyone can view participants"
  ON participants FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert participants"
  ON participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update participants"
  ON participants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete participants"
  ON participants FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for cadence_events table
CREATE POLICY "Anyone can view cadence events"
  ON cadence_events FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert cadence events"
  ON cadence_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cadence events"
  ON cadence_events FOR DELETE
  TO authenticated
  USING (true);