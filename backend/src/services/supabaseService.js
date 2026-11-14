import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;

function sanitizeKey(key) {
  if (!key || key.startsWith('your-') || key.includes('[YOUR-')) return undefined;
  return key;
}

const SUPABASE_KEY = sanitizeKey(process.env.SUPABASE_SERVICE_ROLE_KEY) || sanitizeKey(process.env.SUPABASE_ANON_KEY);

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

export let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase Client initialized for NyayaSaathi');
  } catch (err) {
    console.warn('⚠️ Supabase client initialization error:', err.message);
  }
} else {
  console.log('ℹ️ Supabase credentials not set in .env — using resilient in-memory legal data');
}

/**
 * Canonical slugs used by the frontend routes and icon map.
 * Keeps `/rights/labour` and `/rights/labour-rights` both resolvable.
 */
const CATEGORY_SLUG_OVERRIDES = {
  'constitutional rights': 'constitutional',
  'labour rights': 'labour',
  'labor rights': 'labour',
  'women rights': 'women',
  "women's rights": 'women',
  'child rights': 'children',
  "children's rights": 'children',
  'property rights': 'property',
  'consumer rights': 'consumer',
  'criminal law': 'criminal',
  'criminal rights': 'criminal',
  'disability rights': 'disability',
  'senior citizen rights': 'senior-citizens',
  'senior citizens rights': 'senior-citizens',
  'tribal rights': 'tribal',
};

function normalizeKey(value = '') {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function toCategorySlug(name = '') {
  const normalized = name.trim().toLowerCase();
  return CATEGORY_SLUG_OVERRIDES[normalized] ?? normalizeKey(name);
}

function mapCategoryRow(row) {
  const relationship = row.section_categories;
  const count = Array.isArray(relationship)
    ? Number(relationship[0]?.count ?? 0)
    : 0;

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    slug: toCategorySlug(row.name),
    sectionCount: Number.isFinite(count) ? count : 0,
  };
}

export const supabaseService = {
  /**
   * Fetch every right category with its live section count.
   */
  async getCategories() {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('right_categories')
        .select('id, name, description, section_categories(count)')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapCategoryRow);
    } catch (err) {
      console.warn('Supabase getCategories query failed:', err.message);
      return null;
    }
  },

  /**
   * Resolve a URL slug (canonical or human-readable) to a category row.
   */
  async getCategoryBySlug(slug) {
    const categories = await this.getCategories();
    if (!categories) return null;

    const target = normalizeKey(slug);
    return (
      categories.find((category) => category.slug === target) ??
      categories.find((category) => normalizeKey(category.name) === target) ??
      categories.find((category) => category.slug === slug.toLowerCase()) ??
      null
    );
  },

  /**
   * Fetch verified legal sections mapped to a category id.
   */
  async getSectionsByCategoryId(categoryId) {
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
          legal_acts!inner ( id, title, year, jurisdiction, state, source_url, verification_status ),
          section_categories!inner ( category_id ),
          section_beneficiaries ( beneficiaries ( name ) )
        `)
        .eq('section_categories.category_id', categoryId)
        .eq('legal_acts.verification_status', 'VERIFIED')
        .order('section_number', { ascending: true });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase getSectionsByCategoryId failed:', err.message);
      return null;
    }
  },

  /**
   * Fetch complaint workflows with their steps and owning category.
   */
  async getWorkflows(categorySlug) {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('complaint_workflows')
        .select(`
          id,
          title,
          description,
          jurisdiction,
          target_authority,
          official_url,
          right_categories ( id, name, description ),
          workflow_steps ( id, step_number, title, instructions, required_documents, official_url )
        `)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const rows = (data ?? []).map((workflow) => ({
        ...workflow,
        categorySlug: workflow.right_categories?.name
          ? toCategorySlug(workflow.right_categories.name)
          : null,
        workflow_steps: [...(workflow.workflow_steps ?? [])].sort(
          (a, b) => a.step_number - b.step_number
        ),
      }));

      if (!categorySlug) return rows;

      const target = normalizeKey(categorySlug);
      return rows.filter(
        (workflow) =>
          workflow.categorySlug === target ||
          normalizeKey(workflow.right_categories?.name ?? '') === target
      );
    } catch (err) {
      console.warn('Supabase getWorkflows failed:', err.message);
      return null;
    }
  },

  /**
   * Fetch verified legal aid providers with filters and pagination.
   */
  async getLegalAidProviders(options = {}) {
    if (!supabase) return null;
    try {
      const { state, district, type, limit = 50, offset = 0 } = options;

      let query = supabase
        .from('legal_aid_providers')
        .select('*', { count: 'exact' })
        .eq('verified', true)
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (state) query = query.ilike('state', `%${state}%`);
      if (district) query = query.ilike('district', `%${district}%`);
      if (type) query = query.eq('provider_type', type.toUpperCase());

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data ?? [], total: count ?? (data?.length ?? 0) };
    } catch (err) {
      console.warn('Supabase getLegalAidProviders failed:', err.message);
      return null;
    }
  },

  /**
   * Match legal chunks using the Supabase pgvector RPC.
   */
  async matchLegalChunks(queryEmbedding, matchCount = 5) {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.rpc('match_legal_chunks', {
        query_embedding: queryEmbedding,
        match_count: matchCount,
        min_similarity: 0.0,
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase match_legal_chunks RPC failed:', err.message);
      return null;
    }
  },

  /**
   * Lightweight connectivity probe used by /health.
   */
  async ping() {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('right_categories')
        .select('id', { count: 'exact', head: true });
      return !error;
    } catch {
      return false;
    }
  },
};
