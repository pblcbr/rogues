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
          brand_name: string | null;
          brand_website: string | null;
          region: string | null;
          language: string | null;
          active_llms: string[] | null;
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
          brand_name?: string | null;
          brand_website?: string | null;
          region?: string | null;
          language?: string | null;
          active_llms?: string[] | null;
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
          brand_name?: string | null;
          brand_website?: string | null;
          region?: string | null;
          language?: string | null;
          active_llms?: string[] | null;
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
      prompt_kpi_snapshots: {
        Row: {
          id: string;
          prompt_id: string;
          workspace_id: string;
          snapshot_date: string;
          visibility_score: number;
          mention_rate: number;
          citation_rate: number;
          avg_position: number;
          total_measurements: number;
          mention_count: number;
          citation_count: number;
          avg_sentiment: number;
          avg_prominence: number;
          avg_alignment: number;
          avg_citation_authority: number;
          llm_provider: string;
          llm_model: string;
          calculated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          prompt_id: string;
          workspace_id: string;
          snapshot_date: string;
          visibility_score: number;
          mention_rate: number;
          citation_rate: number;
          avg_position: number;
          total_measurements: number;
          mention_count: number;
          citation_count: number;
          avg_sentiment: number;
          avg_prominence: number;
          avg_alignment: number;
          avg_citation_authority: number;
          llm_provider: string;
          llm_model: string;
          calculated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          prompt_id?: string;
          workspace_id?: string;
          snapshot_date?: string;
          visibility_score?: number;
          mention_rate?: number;
          citation_rate?: number;
          avg_position?: number;
          total_measurements?: number;
          mention_count?: number;
          citation_count?: number;
          avg_sentiment?: number;
          avg_prominence?: number;
          avg_alignment?: number;
          avg_citation_authority?: number;
          llm_provider?: string;
          llm_model?: string;
          calculated_at?: string;
          created_at?: string;
        };
      };
      topic_kpi_snapshots: {
        Row: {
          id: string;
          topic_id: string;
          workspace_id: string;
          workspace_region_id: string | null;
          snapshot_date: string;
          visibility_score: number;
          our_brand_mention_count: number;
          relevancy_score: number;
          total_brand_mentions: number;
          avg_rank: number | null;
          best_rank: number | null;
          worst_rank: number | null;
          total_citations: number;
          unique_domains_cited: number;
          competitor_mentions: Json;
          competitor_positions: Json;
          total_prompts_measured: number;
          total_llm_queries: number;
          llm_provider: string;
          llm_model: string;
          calculated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          workspace_id: string;
          workspace_region_id?: string | null;
          snapshot_date: string;
          visibility_score?: number;
          our_brand_mention_count?: number;
          relevancy_score?: number;
          total_brand_mentions?: number;
          avg_rank?: number | null;
          best_rank?: number | null;
          worst_rank?: number | null;
          total_citations?: number;
          unique_domains_cited?: number;
          competitor_mentions?: Json;
          competitor_positions?: Json;
          total_prompts_measured?: number;
          total_llm_queries?: number;
          llm_provider?: string;
          llm_model?: string;
          calculated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          topic_id?: string;
          workspace_id?: string;
          workspace_region_id?: string | null;
          snapshot_date?: string;
          visibility_score?: number;
          our_brand_mention_count?: number;
          relevancy_score?: number;
          total_brand_mentions?: number;
          avg_rank?: number | null;
          best_rank?: number | null;
          worst_rank?: number | null;
          total_citations?: number;
          unique_domains_cited?: number;
          competitor_mentions?: Json;
          competitor_positions?: Json;
          total_prompts_measured?: number;
          total_llm_queries?: number;
          llm_provider?: string;
          llm_model?: string;
          calculated_at?: string;
          created_at?: string;
          updated_at?: string;
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
