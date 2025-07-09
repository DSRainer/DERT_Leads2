/*
  # Update enums and add missing fields to match database schema

  1. Updates enum types to match the actual database schema
  2. Adds missing columns to leads table
  3. Handles enum conversions safely
*/

-- First, let's check what columns actually exist and add missing ones
DO $$
BEGIN
  -- Add address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'address'
  ) THEN
    ALTER TABLE leads ADD COLUMN address text;
  END IF;

  -- Add location_url column if it doesn't exist  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'location_url'
  ) THEN
    ALTER TABLE leads ADD COLUMN location_url text;
  END IF;

  -- Add pincode column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'pincode'
  ) THEN
    ALTER TABLE leads ADD COLUMN pincode numeric;
  END IF;

  -- Add follow_up column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'follow_up'
  ) THEN
    ALTER TABLE leads ADD COLUMN follow_up boolean;
  END IF;

  -- Add follow_up_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'follow_up_date'
  ) THEN
    ALTER TABLE leads ADD COLUMN follow_up_date date;
  END IF;

  -- Add follow_up_notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'follow_up_notes'
  ) THEN
    ALTER TABLE leads ADD COLUMN follow_up_notes text;
  END IF;

  -- Add lead_sealed column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'lead_sealed'
  ) THEN
    ALTER TABLE leads ADD COLUMN lead_sealed boolean;
  END IF;
END $$;

-- Update enum values to match database schema
-- Note: We're working with existing enums, so we need to be careful about dependencies

-- For lead_type enum: Add missing values if they don't exist
DO $$
BEGIN
  -- Add 'Business' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Business' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'lead_type')) THEN
    ALTER TYPE lead_type ADD VALUE 'Business';
  END IF;
  
  -- Add 'Housing-Society' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Housing-Society' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'lead_type')) THEN
    ALTER TYPE lead_type ADD VALUE 'Housing-Society';
  END IF;
  
  -- Add 'Agent' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Agent' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'lead_type')) THEN
    ALTER TYPE lead_type ADD VALUE 'Agent';
  END IF;
EXCEPTION
  WHEN others THEN
    -- If lead_type doesn't exist, create it
    CREATE TYPE lead_type AS ENUM ('Individual', 'Business', 'Housing-Society', 'Agent');
END $$;

-- For model_type enum: Add missing values if they don't exist
DO $$
BEGIN
  -- Add 'Individual Home-kit' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Individual Home-kit' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'model_type')) THEN
    ALTER TYPE model_type ADD VALUE 'Individual Home-kit';
  END IF;
EXCEPTION
  WHEN others THEN
    -- If model_type doesn't exist, create it
    CREATE TYPE model_type AS ENUM ('Purchase', 'Rent', 'Individual Home-kit');
END $$;

-- For status enum: Add missing values if they don't exist
DO $$
BEGIN
  -- Add 'In-Progress' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'In-Progress' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'status')) THEN
    ALTER TYPE status ADD VALUE 'In-Progress';
  END IF;
EXCEPTION
  WHEN others THEN
    -- If status doesn't exist, create it
    CREATE TYPE status AS ENUM ('New', 'Closed', 'In-Progress');
END $$;

-- Update any existing data to use correct enum values
-- This handles the case where we have old enum values that need to be converted
DO $$
BEGIN
  -- Check if the Status column exists (with capital S as per your schema)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'Status'
  ) THEN
    -- Update any old status values to new ones
    UPDATE leads SET "Status" = 'In-Progress' WHERE "Status" IN ('Contacted', 'Qualified', 'Proposal');
    UPDATE leads SET "Status" = 'Closed' WHERE "Status" = 'Lost';
  END IF;
  
  -- Check if the status column exists (lowercase s)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'status'
  ) THEN
    -- Update any old status values to new ones
    UPDATE leads SET status = 'In-Progress' WHERE status IN ('Contacted', 'Qualified', 'Proposal');
    UPDATE leads SET status = 'Closed' WHERE status = 'Lost';
  END IF;
END $$;