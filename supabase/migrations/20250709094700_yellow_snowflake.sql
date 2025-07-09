/*
  # Update leads table schema to match database requirements

  1. New Columns Added
    - `address` (text) - Lead's address information
    - `location_url` (text) - URL for location mapping
    - `pincode` (numeric) - Postal/ZIP code
    - `follow_up` (boolean) - Whether follow-up is required
    - `follow_up_date` (date) - Date for follow-up
    - `follow_up_notes` (text) - Notes for follow-up
    - `lead_sealed` (boolean) - Whether lead is sealed/closed

  2. Enum Updates
    - Update `lead_type` enum to include all required values
    - Update `model_type` enum to include all required values  
    - Update `lead_status` enum to include all required values

  3. Data Migration
    - Convert old status values to new enum values where applicable
*/

-- First, let's add missing columns to the leads table
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

-- Update lead_type enum to include all required values
DO $$
BEGIN
  -- Add 'Business' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Business' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'lead_type')
  ) THEN
    ALTER TYPE lead_type ADD VALUE 'Business';
  END IF;
  
  -- Add 'Housing-Society' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Housing-Society' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'lead_type')
  ) THEN
    ALTER TYPE lead_type ADD VALUE 'Housing-Society';
  END IF;
  
  -- Add 'Agent' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Agent' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'lead_type')
  ) THEN
    ALTER TYPE lead_type ADD VALUE 'Agent';
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    -- If lead_type doesn't exist, create it
    CREATE TYPE lead_type AS ENUM ('Individual', 'Business', 'Housing-Society', 'Agent');
END $$;

-- Update model_type enum to include all required values
DO $$
BEGIN
  -- Add 'Individual Home-kit' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Individual Home-kit' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'model_type')
  ) THEN
    ALTER TYPE model_type ADD VALUE 'Individual Home-kit';
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    -- If model_type doesn't exist, create it
    CREATE TYPE model_type AS ENUM ('Purchase', 'Rent', 'Individual Home-kit');
END $$;

-- Update lead_status enum to include all required values
DO $$
BEGIN
  -- Add 'Contacted' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Contacted' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'lead_status')
  ) THEN
    ALTER TYPE lead_status ADD VALUE 'Contacted';
  END IF;
  
  -- Add 'Qualified' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Qualified' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'lead_status')
  ) THEN
    ALTER TYPE lead_status ADD VALUE 'Qualified';
  END IF;
  
  -- Add 'Proposal' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Proposal' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'lead_status')
  ) THEN
    ALTER TYPE lead_status ADD VALUE 'Proposal';
  END IF;
  
  -- Add 'Lost' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Lost' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'lead_status')
  ) THEN
    ALTER TYPE lead_status ADD VALUE 'Lost';
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    -- If lead_status doesn't exist, create it
    CREATE TYPE lead_status AS ENUM ('New', 'Contacted', 'Qualified', 'Proposal', 'Closed', 'Lost');
END $$;