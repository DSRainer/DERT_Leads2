/*
  # Business Lead Management Platform Schema

  1. New Tables
    - `profiles` - User profile information
    - `products` - Available products with pricing
    - `services` - Available services with pricing  
    - `leads` - Lead information and tracking
    - `lead_products` - Junction table for lead-product relationships
    - `lead_services` - Junction table for lead-service relationships

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Products and services are readable by all authenticated users

  3. Features
    - Enum types for lead classification
    - Proper foreign key relationships
    - Indexes for performance optimization
    - Triggers for automatic timestamp updates
    - Sample data for products and services
*/

-- Create enum types if they don't exist
DO $$ BEGIN
    CREATE TYPE lead_type AS ENUM ('Individual', 'Corporate', 'Government', 'Educational');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE model_type AS ENUM ('Rent', 'Purchase', 'Subscription', 'Lease');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('New', 'Contacted', 'Qualified', 'Proposal', 'Closed', 'Lost');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  lead_type lead_type NOT NULL,
  model_type model_type NOT NULL,
  lead_score integer DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  status lead_status DEFAULT 'New',
  potential_amount decimal(10,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create junction table for lead-product relationships
CREATE TABLE IF NOT EXISTS lead_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(lead_id, product_id)
);

-- Create junction table for lead-service relationships
CREATE TABLE IF NOT EXISTS lead_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(lead_id, service_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_services ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
DO $$ BEGIN
    CREATE POLICY "Users can read own profile"
      ON profiles FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own profile"
      ON profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own profile"
      ON profiles FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create policies for products (read-only for all authenticated users)
DO $$ BEGIN
    CREATE POLICY "Authenticated users can read products"
      ON products FOR SELECT
      TO authenticated
      USING (is_active = true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create policies for services (read-only for all authenticated users)
DO $$ BEGIN
    CREATE POLICY "Authenticated users can read services"
      ON services FOR SELECT
      TO authenticated
      USING (is_active = true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create policies for leads
DO $$ BEGIN
    CREATE POLICY "Users can read own leads"
      ON leads FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own leads"
      ON leads FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own leads"
      ON leads FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete own leads"
      ON leads FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create policies for lead_products
DO $$ BEGIN
    CREATE POLICY "Users can manage own lead products"
      ON lead_products FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM leads 
          WHERE leads.id = lead_products.lead_id 
          AND leads.user_id = auth.uid()
        )
      );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create policies for lead_services
DO $$ BEGIN
    CREATE POLICY "Users can manage own lead services"
      ON lead_services FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM leads 
          WHERE leads.id = lead_services.lead_id 
          AND leads.user_id = auth.uid()
        )
      );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Insert sample products (only if they don't exist)
INSERT INTO products (name, description, price) 
SELECT * FROM (VALUES
  ('Aerobin - Large', 'Large capacity aerobic composting bin', 3500.00),
  ('Aerobin - Small', 'Compact aerobic composting bin', 2000.00),
  ('Compost Bin - Large', 'Indoor compost bin for organic waste management', 2500.00),
  ('Compost Bin - Small', 'Indoor compost bin for organic waste management', 1200.00),
  ('Dual Shaft 1 HP Shredder', 'High-capacity waste shredder', 10000.00),
  ('Dual Shaft 3 HP Shredder', 'Industrial-grade waste shredder', 20000.00),
  ('Organic Soil Mix', 'Premium organic soil mixture', 500.00),
  ('Planter Box - Medium', 'Medium-sized planter box for urban gardening', 800.00)
) AS v(name, description, price)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE products.name = v.name);

-- Insert sample services (only if they don't exist)
INSERT INTO services (name, description, price) 
SELECT * FROM (VALUES
  ('Waste Management Consultation', 'Expert consultation for waste management solutions', 5000.00),
  ('Installation Service', 'Professional installation of waste management equipment', 2000.00),
  ('Maintenance Package', 'Monthly maintenance and support service', 1500.00),
  ('Training Program', 'Comprehensive training on waste management best practices', 3000.00)
) AS v(name, description, price)
WHERE NOT EXISTS (SELECT 1 FROM services WHERE services.name = v.name);

-- Create indexes for better performance (only if they don't exist)
DO $$ BEGIN
    CREATE INDEX idx_leads_user_id ON leads(user_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_leads_lead_score ON leads(lead_score DESC);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_leads_status ON leads(status);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_leads_lead_type ON leads(lead_type);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_leads_model_type ON leads(model_type);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Create updated_at function and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers (drop first if they exist)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();