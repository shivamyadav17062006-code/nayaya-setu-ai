import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { embeddingService } from './embeddingService.js';

export const LEGAL_KNOWLEDGE_BASE = [
  {
    act: 'Payment of Wages Act',
    year: 1936,
    section: 'Section 5',
    title: 'Time of payment of wages',
    category: 'LABOUR',
    text: 'Wages must be paid before the expiry of the 7th day (or 10th day if over 1000 employees) after the wage period ends.',
    simplified: 'Your employer cannot withhold salary past the 7th or 10th of the following month. Withholding pay beyond this is an actionable legal violation.',
    remedy: 'File a claim with the Labour Commissioner Authority under Section 15.',
    source_url: 'https://www.indiacode.nic.in/handle/123456789/2367',
  },
  {
    act: 'Payment of Wages Act',
    year: 1936,
    section: 'Section 15',
    title: 'Claims arising out of deductions from wages or delay in payment',
    category: 'LABOUR',
    text: 'Where any deduction has been made from wages or payment has been delayed, the worker or trade union official may apply to the Authority for payment plus compensation up to ten times the withheld amount.',
    simplified: 'You can recover all unpaid wages along with statutory penalty compensation up to 10x the delayed amount through the Labour Court / Authority.',
    remedy: 'File an application before District Labour Court / DLSA.',
    source_url: 'https://www.indiacode.nic.in/handle/123456789/2367',
  },
  {
    act: 'Protection of Women from Domestic Violence Act',
    year: 2005,
    section: 'Section 3',
    title: 'Definition of domestic violence',
    category: 'WOMEN_RIGHTS',
    text: 'Domestic violence includes physical abuse, sexual abuse, verbal and emotional abuse, and economic abuse (deprivation of financial resources).',
    simplified: 'Domestic violence covers physical harm, verbal abuse, threats, or depriving a woman of maintenance or financial support.',
    remedy: 'Call 112 / 181 or contact the District Protection Officer.',
    source_url: 'https://www.indiacode.nic.in/handle/123456789/2021',
  },
  {
    act: 'Protection of Women from Domestic Violence Act',
    year: 2005,
    section: 'Section 12 & 18',
    title: 'Application to Magistrate and Protection Orders',
    category: 'WOMEN_RIGHTS',
    text: 'An aggrieved person or Protection Officer may apply to the Magistrate for Protection Orders prohibiting acts of domestic violence, entering the workplace, or alienating shared household assets.',
    simplified: 'The Magistrate can pass urgent interim orders barring the abuser from entering your residence or workplace within 3 days of complaint.',
    remedy: 'File an application under Section 12 before the Judicial Magistrate with free legal representation from DLSA.',
    source_url: 'https://www.indiacode.nic.in/handle/123456789/2021',
  },
  {
    act: 'Consumer Protection Act',
    year: 2019,
    section: 'Section 35',
    title: 'Complaint to District Commission',
    category: 'CONSUMER',
    text: 'A complaint regarding defective goods, deficiency of service, unfair contract, or misleading advertisement may be filed before the District Commission electronically via e-Daakhil or physically.',
    simplified: 'You can file an official complaint against a seller or company online without a lawyer to get a refund, replacement, and compensation.',
    remedy: 'File online complaint on https://edaakhil.nic.in or National Consumer Helpline 1915.',
    source_url: 'https://www.indiacode.nic.in/handle/123456789/15256',
  },
  {
    act: 'Right of Children to Free and Compulsory Education Act',
    year: 2009,
    section: 'Section 3 & 12',
    title: 'Right of child to free and compulsory education',
    category: 'CHILDREN',
    text: 'Every child between 6 to 14 years has the right to free education in a neighbourhood school, including a 25% quota in private unaided schools for economically weaker sections (EWS).',
    simplified: 'Every child aged 6-14 is guaranteed free schooling. Private schools must reserve 25% of seats for disadvantaged and EWS children.',
    remedy: 'Approach the District Education Officer (DEO) or State Commission for Protection of Child Rights.',
    source_url: 'https://www.indiacode.nic.in/handle/123456789/2088',
  },
  {
    act: 'Constitution of India',
    year: 1950,
    section: 'Article 39A',
    title: 'Equal justice and free legal aid',
    category: 'CONSTITUTIONAL',
    text: 'The State shall secure that the operation of the legal system promotes justice on a basis of equal opportunity, and shall provide free legal aid by suitable legislation or schemes.',
    simplified: 'No citizen should be denied justice due to poverty. The government is constitutionally bound to provide free lawyers through NALSA.',
    remedy: 'Call NALSA National Legal Helpline at 15100.',
    source_url: 'https://www.indiacode.nic.in',
  },
];

const STOPWORDS = new Set([
  'the', 'and', 'for', 'not', 'has', 'have', 'with', 'what', 'can', 'how',
  'are', 'was', 'were', 'you', 'your', 'his', 'her', 'its', 'from', 'this',
  'that', 'under', 'about', 'after', 'before', 'when', 'who', 'why', 'will',
  'should', 'would', 'could', 'does', 'did', 'been', 'being', 'they', 'them',
  'there', 'their', 'our', 'out', 'get', 'got', 'any', 'all', 'more', 'most',
]);

function extractTokens(str = '') {
  return new Set(
    (str.toLowerCase().match(/[a-z0-9\u0900-\u097F]+/g) || [])
      .filter((t) => t.length > 2 && !STOPWORDS.has(t))
  );
}

class LegalService {
  constructor() {
    this.supabase = null;
    if (config.supabaseUrl && config.supabaseAnonKey) {
      try {
        this.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
      } catch (err) {
        console.warn('[LegalService] Supabase client init warning:', err.message);
      }
    }
  }

  get isConfigured() {
    return Boolean(this.supabase);
  }

  /**
   * Retrieve provisions matching query & intent.
   * Tries pgvector RPC first; falls back to static verified provisions.
   */
  async retrieve(query, intent = 'GENERAL', limit = 5, queryEmbedding = null) {
    if (!queryEmbedding) {
      try {
        queryEmbedding = await embeddingService.embedText(query);
      } catch {
        queryEmbedding = null;
      }
    }

    if (this.supabase && queryEmbedding && Array.isArray(queryEmbedding) && queryEmbedding.length === 384) {
      try {
        const { data, error } = await this.supabase.rpc('match_legal_chunks', {
          query_embedding: queryEmbedding,
          match_count: limit,
          min_similarity: config.ragSimilarityThreshold,
        });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((item) => ({
            act: item.act_title,
            year: null,
            section: item.section_number,
            title: item.section_title || item.section_number,
            category: intent,
            text: item.chunk_text,
            simplified: item.simplified_text || item.chunk_text,
            remedy: 'Contact local DLSA or call NALSA 15100.',
            source_url: item.act_source_url,
            similarity: item.similarity,
          }));
        }
      } catch (err) {
        console.warn('[LegalService] pgvector retrieval warning:', err.message);
      }
    }

    // Static verified knowledge base matching with keyword ranking
    const pool = LEGAL_KNOWLEDGE_BASE.filter(
      (p) => p.category === intent || intent === 'GENERAL'
    );
    const activePool = pool.length > 0 ? pool : LEGAL_KNOWLEDGE_BASE;
    const queryTokens = extractTokens(query);

    const scored = activePool.map((prov) => {
      const haystack = extractTokens(`${prov.act} ${prov.section} ${prov.title} ${prov.text} ${prov.simplified}`);
      let score = prov.category === intent ? 2.0 : 0.0;
      for (const tok of queryTokens) {
        if (haystack.has(tok)) score += 1.0;
      }
      return { score, prov };
    });

    scored.sort((a, b) => b.score - a.score);
    const selected = scored.slice(0, limit).map((s) => ({
      ...s.prov,
      similarity: s.score > 0 ? 0.75 : 0.5,
    }));

    return selected;
  }

  /**
   * Semantic search endpoint handler
   */
  async semanticSearch(query, limit = 5) {
    const provisions = await this.retrieve(query, 'GENERAL', limit);
    return provisions;
  }

  /**
   * Upsert a chunk + embedding into Supabase `legal_chunks`
   */
  async storeChunk(section_id, content, embedding, language = 'en', source_url = null, chunk_number = 1) {
    if (!this.supabase || !section_id) {
      return false;
    }

    try {
      const { error } = await this.supabase
        .from('legal_chunks')
        .upsert(
          {
            section_id,
            content,
            chunk_number,
            language,
            source_url,
            embedding,
          },
          { onConflict: 'section_id,chunk_number,language' }
        );

      return !error;
    } catch (err) {
      console.warn('[LegalService] storeChunk error:', err.message);
      return false;
    }
  }
}

export const legalService = new LegalService();
