/*
  # Update enums and add missing fields to leads table

  1. Updates
    - Update lead_type enum to match database schema
    - Update model_type enum to match database schema  
    - Update lead_status enum to match database schema
    - Add missing fields to leads table: address, location_url, pincode, follow_up, follow_up_date, follow_up_notes, lead_sealed

  2. Security
    - Maintain existing RLS policies
*/

-- Update lead_type enum to match database schema
DO $$
BEGIN
  -- Drop existing enum if it exists and recreate with correct values
  DROP TYPE IF EXISTS lead_type CASCADE;
  CREATE TYPE lead_type AS ENUM ('Individual', 'Business', 'Housing-Society', 'Agent');
EXCEPTION
  WHEN others THEN
    -- If there are dependencies, alter the enum instead
    ALTER TYPE lead_type RENAME TO lead_type_old;
    CREATE TYPE lead_type AS ENUM ('Individual', 'Business', 'Housing-Society', 'Agent');
END $$;

-- Update model_type enum to match database schema
DO $$
BEGIN
  -- Drop existing enum if it exists and recreate with correct values
  DROP TYPE IF EXISTS model_type CASCADE;
  CREATE TYPE model_type AS ENUM ('Purchase', 'Rent', 'Individual Home-kit');
EXCEPTION
  WHEN others THEN
    -- If there are dependencies, alter the enum instead
    ALTER TYPE model_type RENAME TO model_type_old;
    CREATE TYPE model_type AS ENUM ('Purchase', 'Rent', 'Individual Home-kit');
END $$;

-- Update lead_status enum to match database schema (status enum from schema)
DO $$
BEGIN
  -- Drop existing enum if it exists and recreate with correct values
  DROP TYPE IF EXISTS lead_status CASCADE;
  CREATE TYPE lead_status AS ENUM ('New', 'Closed', 'In-Progress');
EXCEPTION
  WHEN others THEN
    -- If there are dependencies, alter the enum instead
    ALTER TYPE lead_status RENAME TO lead_status_old;
    CREATE TYPE lead_status AS ENUM ('New', 'Closed', 'In-Progress');
END $$;

-- Add missing columns to leads table
DO $$
BEGIN
  -- Add address column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'address'
  ) THEN
    ALTER TABLE leads ADD COLUMN address text NOT NULL DEFAULT '';
  END IF;

  -- Add location_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'location_url'
  ) THEN
    ALTER TABLE leads ADD COLUMN location_url text;
  END IF;

  -- Add pincode column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'pincode'
  ) THEN
    ALTER TABLE leads ADD COLUMN pincode numeric;
  END IF;

  -- Add follow_up column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'follow_up'
  ) THEN
    ALTER TABLE leads ADD COLUMN follow_up boolean;
  END IF;

  -- Add follow_up_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'follow_up_date'
  ) THEN
    ALTER TABLE leads ADD COLUMN follow_up_date date;
  END IF;

  -- Add follow_up_notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'follow_up_notes'
  ) THEN
    ALTER TABLE leads ADD COLUMN follow_up_notes text;
  END IF;

  -- Add lead_sealed column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'lead_sealed'
  ) THEN
    ALTER TABLE leads ADD COLUMN lead_sealed boolean;
  END IF;
END $$;

-- Update the leads table to use the new enum types
DO $$
BEGIN
  -- Update lead_type column to use new enum
  ALTER TABLE leads ALTER COLUMN lead_type TYPE lead_type USING lead_type::text::lead_type;
  
  -- Update model_type column to use new enum
  ALTER TABLE leads ALTER COLUMN model_type TYPE model_type USING model_type::text::model_type;
  
  -- Update status column to use new enum
  ALTER TABLE leads ALTER COLUMN status TYPE lead_status USING 
    CASE 
      WHEN status::text = 'Contacted' THEN 'In-Progress'::lead_status
      WHEN status::text = 'Qualified' THEN 'In-Progress'::lead_status
      WHEN status::text = 'Proposal' THEN 'In-Progress'::lead_status
      WHEN status::text = 'Lost' THEN 'Closed'::lead_status
      ELSE status::text::lead_status
    END;
EXCEPTION
  WHEN others THEN
    -- If conversion fails, just set default
    ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'New'::lead_status;
END $$;

-- Clean up old enum types if they exist
DROP TYPE IF EXISTS lead_type_old;
DROP TYPE IF EXISTS model_type_old;
DROP TYPE IF EXISTS lead_status_old;