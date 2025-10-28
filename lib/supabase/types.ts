/**
 * Database types for Supabase
 * These will be auto-generated later with: npx supabase gen types typescript
 * For now, we define them manually
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          company_domain: string | null;
          company_size: string | null;
          is_agency: boolean;
          avatar_url: string | null;
          onboarding_completed: boolean;
          onboarding_step: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          company_domain?: string | null;
          company_size?: string | null;
          is_agency?: boolean;
          avatar_url?: string | null;
          onboarding_completed?: boolean;
          onboarding_step?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          company_domain?: string | null;
          company_size?: string | null;
          is_agency?: boolean;
          avatar_url?: string | null;
          onboarding_completed?: boolean;
          onboarding_step?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      workspace_regions: {
        Row: {
          id: string;
          workspace_id: string;
          region: string;
          language: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          region: string;
          language: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          region?: string;
          language?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          domain: string | null;
          owner_id: string;
          plan: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          trial_ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          domain?: string | null;
          owner_id: string;
          plan: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          domain?: string | null;
          owner_id?: string;
          plan?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      monitoring_prompts: {
        Row: {
          id: string;
          workspace_id: string;
          prompt_text: string;
          is_active: boolean;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          prompt_text: string;
          is_active?: boolean;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          prompt_text?: string;
          is_active?: boolean;
          source?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
