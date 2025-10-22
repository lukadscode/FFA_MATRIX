/*
  # Update Race Cadence System

  ## Overview
  This migration updates the race system to use a single target cadence with tolerance
  instead of min/max range, enabling live cadence adjustments from a dashboard.

  ## Changes to Tables

  ### `races` table modifications
  - Drop `target_cadence_min` column
  - Drop `target_cadence_max` column
  - Add `target_cadence` (integer) - The exact target cadence in SPM
  - Add `cadence_tolerance` (integer) - The acceptable variance (+/-) from target
  - Add `last_cadence_change` (timestamptz) - Track when cadence was last modified

  ## Migration Strategy
  - Uses safe column addition with default values
  - Removes old columns only after adding new ones
  - Preserves existing data where possible

  ## Important Notes
  - Default target cadence set to 22 SPM (typical rowing cadence)
  - Default tolerance set to 2 SPM (+/- 2 strokes per minute)
  - Dashboard can modify these values in real-time during active races
*/

-- Add new columns for target cadence system
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'races' AND column_name = 'target_cadence'
  ) THEN
    ALTER TABLE races ADD COLUMN target_cadence integer NOT NULL DEFAULT 22;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'races' AND column_name = 'cadence_tolerance'
  ) THEN
    ALTER TABLE races ADD COLUMN cadence_tolerance integer NOT NULL DEFAULT 2;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'races' AND column_name = 'last_cadence_change'
  ) THEN
    ALTER TABLE races ADD COLUMN last_cadence_change timestamptz;
  END IF;
END $$;

-- Drop old min/max columns if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'races' AND column_name = 'target_cadence_min'
  ) THEN
    ALTER TABLE races DROP COLUMN target_cadence_min;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'races' AND column_name = 'target_cadence_max'
  ) THEN
    ALTER TABLE races DROP COLUMN target_cadence_max;
  END IF;
END $$;