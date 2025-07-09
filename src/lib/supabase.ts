import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          email: string;
          phone: string | null;
          company: string | null;
          lead_type: 'Individual' | 'Business' | 'Housing-Society' | 'Agent';
          model_type: 'Purchase' | 'Rent' | 'Individual Home-kit';
          lead_score: number;
          status: 'New' | 'Closed' | 'In-Progress';
          potential_amount: number;
          notes: string | null;
          address: string;
          location_url: string | null;
          pincode: number | null;
          follow_up: boolean | null;
          follow_up_date: string | null;
          follow_up_notes: string | null;
          lead_sealed: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          company?: string | null;
          lead_type: 'Individual' | 'Business' | 'Housing-Society' | 'Agent';
          model_type: 'Purchase' | 'Rent' | 'Individual Home-kit';
          lead_score?: number;
          status?: 'New' | 'Closed' | 'In-Progress';
          potential_amount?: number;
          notes?: string | null;
          address?: string;
          location_url?: string | null;
          pincode?: number | null;
          follow_up?: boolean | null;
          follow_up_date?: string | null;
          follow_up_notes?: string | null;
          lead_sealed?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          company?: string | null;
          lead_type?: 'Individual' | 'Business' | 'Housing-Society' | 'Agent';
          model_type?: 'Purchase' | 'Rent' | 'Individual Home-kit';
          lead_score?: number;
          status?: 'New' | 'Closed' | 'In-Progress';
          potential_amount?: number;
          notes?: string | null;
          address?: string;
          location_url?: string | null;
          pincode?: number | null;
          follow_up?: boolean | null;
          follow_up_date?: string | null;
          follow_up_notes?: string | null;
          lead_sealed?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type Service = Database['public']['Tables']['services']['Row'];
export type Lead = Database['public']['Tables']['leads']['Row'];