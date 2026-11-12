import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase Client initialized for NyayaSaathi');
  } catch (err: any) {
    console.warn('⚠️ Supabase client initialization error:', err.message);
  }
} else {
  console.log('ℹ️ Supabase credentials not set in .env — using resilient in-memory legal data');
}

export const supabaseService = {
  /**
   * Fetch all right categories from Supabase
   */
  async getCategories() {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('right_categories')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    } catch (err: any) {
      console.warn('Supabase getCategories query failed:', err.message);
      return null;
    }
  },

  /**
   * Fetch legal sections by category name
   */
  async getSectionsByCategory(categoryName: string) {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('legal_sections')
        .select(`
          id,
          section_number,
          section_title,
          simplified_text,
          original_text,
          legal_acts ( id, title, year, jurisdiction, source_url, verification_status ),
          section_categories!inner (
            right_categories!inner ( name )
          )
        `)
        .ilike('section_categories.right_categories.name', `%${categoryName}%`);
      if (error) throw error;
      return data;
    } catch (err: any) {
      console.warn('Supabase getSectionsByCategory failed:', err.message);
      return null;
    }
  },

  /**
   * Fetch complaint workflows with steps from Supabase
   */
  async getWorkflows(category?: string) {
    if (!supabase) return null;
    try {
      let query = supabase
        .from('complaint_workflows')
        .select(`
          id,
          title,
          description,
          jurisdiction,
          target_authority,
          official_url,
          workflow_steps ( id, step_number, title, instructions, required_documents, official_url )
        `)
        .order('created_at', { ascending: true });

      if (category) {
        query = query.ilike('title', `%${category}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (err: any) {
      console.warn('Supabase getWorkflows failed:', err.message);
      return null;
    }
  },

  /**
   * Fetch legal aid providers filtered by state
   */
  async getLegalAidProviders(state?: string) {
    if (!supabase) return null;
    try {
      let query = supabase
        .from('legal_aid_providers')
        .select('*')
        .eq('verified', true)
        .order('name', { ascending: true });

      if (state) {
        query = query.ilike('state', `%${state}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (err: any) {
      console.warn('Supabase getLegalAidProviders failed:', err.message);
      return null;
    }
  },

  /**
   * Match legal chunks using Supabase pgvector RPC
   */
  async matchLegalChunks(queryEmbedding: number[], matchCount = 5) {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.rpc('match_legal_chunks', {
        query_embedding: queryEmbedding,
        match_count: matchCount,
      });
      if (error) throw error;
      return data;
    } catch (err: any) {
      console.warn('Supabase match_legal_chunks RPC failed:', err.message);
      return null;
    }
  },
};
