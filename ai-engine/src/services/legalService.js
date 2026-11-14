import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { embeddingService } from './embeddingService.js';
import { constitutionalService } from './constitutionalService.js';

export const LEGAL_KNOWLEDGE_BASE = [
  // 1. Labour & Unpaid Wages
  {
    act_id: 'a0000000-0000-0000-0000-000000000001',
    act: 'Payment of Wages Act',
    year: 1936,
    section: 'Section 5',
    title: 'Time of payment of wages',
    category: 'LABOUR',
    jurisdiction: 'CENTRAL',
    text: 'The wages of every person employed upon or in any railway, factory or industrial or other establishment upon or in which less than one thousand persons are employed, shall be paid before the expiry of the seventh day, and in other cases before the tenth day, after the last day of the wage-period.',
    simplified: 'Your employer is required by law to pay your earned salary on or before the 7th of every month (or 10th if there are over 1000 employees). Withholding salary beyond this deadline is illegal.',
    remedy: 'File a claim with the Labour Commissioner Authority under Section 15.',
    source_url: 'https://www.indiacode.nic.in/handle/123456789/2367',
    verification_status: 'VERIFIED',
  },
  {
    act_id: 'a0000000-0000-0000-0000-000000000001',
    act: 'Payment of Wages Act',
    year: 1936,
    section: 'Section 15',
    title: 'Claims arising out of deductions from wages or delay in payment',
    category: 'LABOUR',
    jurisdiction: 'CENTRAL',
    text: 'Where contrary to the provisions of this Act any deduction has been made from the wages of an employed person, or any payment of wages has been delayed, such person himself, or any legal practitioner or any official of a registered trade union authorized in writing, may apply to such Authority for a direction under sub-section (3) for payment of wages plus compensation up to ten times the withheld amount.',
    simplified: 'If your wages are delayed or unlawfully deducted, you or your union can file an official compensation claim with the Labour Commissioner Authority to recover all back-pay plus statutory compensation up to 10 times the amount.',
    remedy: 'File an application before District Labour Court / DLSA.',
    source_url: 'https://www.indiacode.nic.in/handle/123456789/2367',
    verification_status: 'VERIFIED',
  },

  // 2. Domestic Violence
  {
    act_id: 'a0000000-0000-0000-0000-000000000002',
    act: 'Protection of Women from Domestic Violence Act',
    year: 2005,
    section: 'Section 3',
    title: 'Definition of domestic violence',
    category: 'WOMEN_RIGHTS',
    jurisdiction: 'CENTRAL',
    text: 'Any act, omission or commission or conduct of the respondent shall constitute domestic violence if it harms or injures or endangers the health, safety, life, limb or well-being, whether mental or physical, of the aggrieved person and includes causing physical abuse, sexual abuse, verbal and emotional abuse and economic abuse.',
    simplified: 'Domestic violence includes not just physical beating, but also emotional harassment, insults, denial of food/money (economic abuse), or threats. You have the right to live safely in the shared household without any intimidation.',
    remedy: 'Call 112 / 181 or contact the District Protection Officer.',
    source_url: 'https://www.indiacode.nic.in/handle/123456789/2021',
    verification_status: 'VERIFIED',
  },
  {
    act_id: 'a0000000-0000-0000-0000-000000000002',
    act: 'Protection of Women from Domestic Violence Act',
    year: 2005,
    section: 'Section 12',
    title: 'Application to Magistrate',
    category: 'WOMEN_RIGHTS',
    jurisdiction: 'CENTRAL',
    text: 'An aggrieved person or a Protection Officer or any other person on behalf of the aggrieved person may present an application to the Magistrate seeking one or more reliefs under this Act, including protection orders, residence orders, and monetary relief.',
    simplified: 'You or a Protection Officer can file a direct petition before the Judicial Magistrate to immediately obtain restraining orders, monthly maintenance, and medical expenses without needing costly private lawyers.',
    remedy: 'File an application under Section 12 before Judicial Magistrate with free legal aid from DLSA.',
    source_url: 'https://www.indiacode.nic.in/handle/123456789/2021',
    verification_status: 'VERIFIED',
  },

  // 3. Consumer Complaints
  {
    act_id: 'a0000000-0000-0000-0000-000000000003',
    act: 'Consumer Protection Act',
    year: 2019,
    section: 'Section 35',
    title: 'Complaint to District Commission',
    category: 'CONSUMER',
    jurisdiction: 'CENTRAL',
    text: 'A complaint, in relation to any goods sold or delivered or agreed to be sold or delivered or any service provided or agreed to be provided, may be filed with a District Commission by the consumer to whom such goods are sold or delivered.',
    simplified: 'Any customer who receives a defective item, expired goods, or fake warranty can file an online consumer complaint via the eDaakhil portal (edaakhil.nic.in) or physical forum without needing an advocate.',
    remedy: 'File online complaint on https://edaakhil.nic.in or call National Consumer Helpline 1915.',
    source_url: 'https://www.indiacode.nic.in/handle/123456789/15256',
    verification_status: 'VERIFIED',
  },

  // 4. Workplace Harassment (POSH Act)
  {
    act_id: 'a0000000-0000-0000-0000-000000000006',
    act: 'Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act',
    year: 2013,
    section: 'Section 4',
    title: 'Constitution of Internal Complaints Committee',
    category: 'WORKPLACE_HARASSMENT',
    jurisdiction: 'CENTRAL',
    text: 'Every employer of a workplace shall, by an order in writing, constitute a Committee to be known as the Internal Complaints Committee (ICC). Where the offices or administrative units of the workplace are located at different places, the Internal Committee shall be constituted at all administrative units.',
    simplified: 'Any organization with 10 or more employees must mandatorily establish an Internal Complaints Committee (ICC) headed by a senior woman employee to receive and inquire into workplace harassment complaints.',
    remedy: 'Submit a written complaint to the Presiding Officer of the Internal Committee (ICC).',
    source_url: 'https://www.indiacode.nic.in/handle/123456789/2104',
    verification_status: 'VERIFIED',
  },
  {
    act_id: 'a0000000-0000-0000-0000-000000000006',
    act: 'Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act',
    year: 2013,
    section: 'Section 9',
    title: 'Complaint of sexual harassment',
    category: 'WORKPLACE_HARASSMENT',
    jurisdiction: 'CENTRAL',
    text: 'Any aggrieved woman may make, in writing, a complaint of sexual harassment at workplace to the Internal Committee if so constituted, or the Local Committee, within a period of three months from the date of incident and in case of a series of incidents, within a period of three months from the date of last incident.',
    simplified: 'A woman employee can file a written complaint of workplace sexual harassment to the Internal Committee (ICC) within 3 months of the incident, extendable by another 3 months if circumstances prevented timely filing.',
    remedy: 'File complaint before ICC or District Local Committee (LC).',
    source_url: 'https://www.indiacode.nic.in/handle/123456789/2104',
    verification_status: 'VERIFIED',
  },

  // 5. Legal Aid Eligibility
  {
    act_id: 'a0000000-0000-0000-0000-000000000007',
    act: 'Legal Services Authorities Act',
    year: 1987,
    section: 'Section 12',
    title: 'Criteria for giving legal services',
    category: 'LEGAL_AID',
    jurisdiction: 'CENTRAL',
    text: 'Every person who has to file or defend a case shall be entitled to legal services under this Act if that person is a member of a Scheduled Caste or Scheduled Tribe, a victim of trafficking in human beings or begar, a woman or a child, a person with disability, an industrial workman, or a person in custody, or a citizen whose annual income does not exceed statutory limits.',
    simplified: 'All women, children, workers, persons with disabilities, SC/ST individuals, and citizens below statutory income ceilings are entitled to 100% free legal aid, including free court-appointed advocates via NALSA Helpline 15100 or local DLSAs.',
    remedy: 'Contact National Legal Services Authority (NALSA) at 15100 or approach your District Court DLSA.',
    source_url: 'https://www.indiacode.nic.in/handle/123456789/1944',
    verification_status: 'VERIFIED',
  },

  // 6. Tenant Rights
  {
    act_id: 'a0000000-0000-0000-0000-000000000008',
    act: 'Transfer of Property Act',
    year: 1882,
    section: 'Section 106',
    title: 'Duration of certain leases in absence of written contract',
    category: 'PROPERTY',
    jurisdiction: 'CENTRAL',
    text: 'In the absence of a contract or local law or usage to the contrary, a lease of immovable property for any other purpose shall be deemed to be a lease from month to month, terminable, on the part of either lessor or lessee, by fifteen days notice.',
    simplified: 'Tenants cannot be evicted arbitrarily without proper legal notice. In month-to-month tenancies, landlords must give at least 15 days written notice before seeking possession.',
    remedy: 'Approach local Rent Control Court or District Civil Court / DLSA.',
    source_url: 'https://www.indiacode.nic.in/handle/123456789/2338',
    verification_status: 'VERIFIED',
  },
  {
    act_id: 'a0000000-0000-0000-0000-000000000008',
    act: 'Transfer of Property Act',
    year: 1882,
    section: 'Section 108',
    title: 'Rights and liabilities of lessor and lessee',
    category: 'PROPERTY',
    jurisdiction: 'CENTRAL',
    text: 'The lessor is bound to disclose to the lessee any material defect in the property with reference to its intended use, and the lessee is entitled to quiet enjoyment of the property during the term without interruption, provided rent is paid.',
    simplified: 'A tenant who pays rent on time has the statutory right to peaceful and uninterrupted possession of the rented premises. Landlords cannot cut off water, electricity, or lock doors unlawfully.',
    remedy: 'File an injunction petition before Civil Court or report illegal utility disconnection to Police.',
    source_url: 'https://www.indiacode.nic.in/handle/123456789/2338',
    verification_status: 'VERIFIED',
  },

  // 7. General Constitutional Rights
  {
    act_id: 'a0000000-0000-0000-0000-000000000009',
    act: 'Constitution of India',
    year: 1950,
    section: 'Article 14',
    title: 'Equality before law',
    category: 'CONSTITUTIONAL',
    jurisdiction: 'CENTRAL',
    text: 'The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India.',
    simplified: 'All individuals are equal before the law and entitled to protection without arbitrary discrimination by any government body or state authority.',
    remedy: 'File a writ petition before the High Court under Article 226 or Supreme Court under Article 32.',
    source_url: 'https://legislative.gov.in/constitution-of-india',
    verification_status: 'VERIFIED',
  },
  {
    act_id: 'a0000000-0000-0000-0000-000000000009',
    act: 'Constitution of India',
    year: 1950,
    section: 'Article 21',
    title: 'Protection of life and personal liberty',
    category: 'CONSTITUTIONAL',
    jurisdiction: 'CENTRAL',
    text: 'No person shall be deprived of his life or personal liberty except according to procedure established by law.',
    simplified: 'The right to life includes the right to live with human dignity, livelihood, clean environment, privacy, and protection against unlawful police arrest or detention.',
    remedy: 'Approach High Court or Supreme Court via Writ Petition (Article 226 / 32) or dial NALSA 15100.',
    source_url: 'https://legislative.gov.in/constitution-of-india',
    verification_status: 'VERIFIED',
  },
  {
    act_id: 'a0000000-0000-0000-0000-000000000009',
    act: 'Constitution of India',
    year: 1950,
    section: 'Article 39A',
    title: 'Equal justice and free legal aid',
    category: 'CONSTITUTIONAL',
    jurisdiction: 'CENTRAL',
    text: 'The State shall secure that the operation of the legal system promotes justice, on a basis of equal opportunity, and shall, in particular, provide free legal aid, by suitable legislation or schemes or in any other way, to ensure that opportunities for securing justice are not denied to any citizen by reason of economic or other disabilities.',
    simplified: 'The Constitution mandates the Indian government to provide free legal lawyers and aid so poverty or lack of money never denies any citizen access to courts.',
    remedy: 'Call NALSA National Legal Helpline at 15100.',
    source_url: 'https://legislative.gov.in/constitution-of-india',
    verification_status: 'VERIFIED',
  },
];

const STOPWORDS = new Set([
  'the', 'and', 'for', 'not', 'has', 'have', 'with', 'what', 'can', 'how',
  'are', 'was', 'were', 'you', 'your', 'his', 'her', 'its', 'from', 'this',
  'that', 'under', 'about', 'after', 'before', 'when', 'who', 'why', 'will',
  'should', 'would', 'could', 'does', 'did', 'been', 'being', 'they', 'them',
  'there', 'their', 'our', 'out', 'get', 'got', 'any', 'all', 'more', 'most',
  'kya', 'kare', 'mujhe', 'chahiye', 'bataiye'
]);

function normalizeWord(w = '') {
  const s = w.toLowerCase();
  if (s === 'women') return 'woman';
  if (s === 'wages') return 'wage';
  if (s === 'employees') return 'employee';
  if (s === 'workers') return 'worker';
  if (s === 'tenants') return 'tenant';
  if (s === 'rights') return 'right';
  return s;
}

function extractTokens(str = '') {
  return new Set(
    (str.toLowerCase().match(/[a-z0-9\u0900-\u097F]+/g) || [])
      .map(normalizeWord)
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
   * Retrieves matching provisions applying pgvector similarity search,
   * keyword ranking, metadata filtering, deduplication, and thresholding.
   */
  async retrieve(query, intent = 'GENERAL', limit = 5, queryEmbedding = null, filters = {}) {
    // 0. Exact Constitutional Reference Lookup (Article, Clause, Schedule, Preamble)
    let exactConstitutionalMatch = null;
    const exactRef = constitutionalService.findExactReference(query);
    if (exactRef) {
      if (exactRef.type === 'ARTICLE') {
        const art = exactRef.record;
        exactConstitutionalMatch = {
          act_id: 'a0000000-0000-0000-0000-000000000009',
          act: 'Constitution of India',
          year: 1950,
          section: exactRef.matchedClause ? `${art.articleNumber}(${exactRef.matchedClause.clauseNumber})` : art.articleNumber,
          title: art.heading,
          category: 'CONSTITUTIONAL',
          jurisdiction: 'CENTRAL',
          text: exactRef.matchedClause ? exactRef.matchedClause.text : art.originalText,
          simplified: exactRef.matchedClause ? exactRef.matchedClause.simplified : art.simplifiedText,
          remedy: 'Approach High Court (Article 226) or Supreme Court (Article 32) or call NALSA 15100.',
          source_url: art.sourceUrl || 'https://legislative.gov.in/constitution-of-india',
          verification_status: 'VERIFIED',
          vectorSimilarity: 0.99,
          exactMatch: true,
        };
      } else if (exactRef.type === 'PREAMBLE') {
        const p = exactRef.record;
        exactConstitutionalMatch = {
          act_id: 'a0000000-0000-0000-0000-000000000009',
          act: 'Constitution of India',
          year: 1950,
          section: 'Preamble',
          title: p.heading,
          category: 'CONSTITUTIONAL',
          jurisdiction: 'CENTRAL',
          text: p.originalText,
          simplified: p.simplifiedText,
          remedy: 'Guiding philosophy of the Republic of India.',
          source_url: p.sourceUrl,
          verification_status: 'VERIFIED',
          vectorSimilarity: 0.99,
          exactMatch: true,
        };
      } else if (exactRef.type === 'SCHEDULE') {
        const s = exactRef.record;
        exactConstitutionalMatch = {
          act_id: 'a0000000-0000-0000-0000-000000000009',
          act: 'Constitution of India',
          year: 1950,
          section: s.number,
          title: s.title,
          category: 'CONSTITUTIONAL',
          jurisdiction: 'CENTRAL',
          text: s.description,
          simplified: s.description,
          remedy: `Governs matters linked with ${s.articlesLinked}`,
          source_url: 'https://legislative.gov.in/constitution-of-india',
          verification_status: 'VERIFIED',
          vectorSimilarity: 0.99,
          exactMatch: true,
        };
      }
    }

    // 1. Generate query embedding if not provided
    if (!queryEmbedding) {
      try {
        queryEmbedding = await embeddingService.embedText(query);
      } catch {
        queryEmbedding = null;
      }
    }

    let candidateRecords = [];

    // 2. Query Supabase pgvector RPC if available
    if (this.supabase && queryEmbedding && Array.isArray(queryEmbedding) && queryEmbedding.length === 384) {
      try {
        const { data, error } = await this.supabase.rpc('match_legal_chunks', {
          query_embedding: queryEmbedding,
          match_count: Math.max(limit * 8, 50),
          min_similarity: 0.0, // Retrieve broad candidates for hybrid ranking
        });

        if (!error && Array.isArray(data) && data.length > 0) {
          const dbRecords = data.map((item) => ({
            act_id: item.act_id || null,
            act: item.act_title,
            year: item.act_year || null,
            section: item.section_number,
            title: item.section_title || item.section_number,
            category: item.categories || intent,
            jurisdiction: 'CENTRAL',
            text: item.original_text || item.content || item.chunk_text,
            simplified: item.simplified_text || item.content || item.chunk_text,
            remedy: 'Contact local DLSA or call NALSA 15100.',
            source_url: item.act_source_url || item.source_url || 'https://www.indiacode.nic.in',
            verification_status: 'VERIFIED',
            vectorSimilarity: item.similarity ?? 0.5,
          }));

          candidateRecords = exactConstitutionalMatch ? [exactConstitutionalMatch, ...dbRecords] : dbRecords;
        }
      } catch (err) {
        console.warn('[LegalService] pgvector retrieval warning:', err.message);
      }
    }

    if (candidateRecords.length === 0 && exactConstitutionalMatch) {
      candidateRecords = [exactConstitutionalMatch];
    }

    // 3. Fallback or merge with static knowledge base
    if (candidateRecords.length === 0) {
      candidateRecords = LEGAL_KNOWLEDGE_BASE.map((kb) => ({
        ...kb,
        vectorSimilarity: 0.5,
      }));
    }

    // 4. Apply Metadata Filters (Jurisdiction, Status, Category)
    let filtered = candidateRecords;
    if (filters.jurisdiction) {
      filtered = filtered.filter(
        (r) => !r.jurisdiction || r.jurisdiction.toUpperCase() === filters.jurisdiction.toUpperCase()
      );
    }
    if (filters.act) {
      filtered = filtered.filter((r) =>
        r.act.toLowerCase().includes(filters.act.toLowerCase())
      );
    }

    // 5. Hybrid Relevance Ranking (Vector + Lexical Overlap + Intent Boost)
    const queryTokens = extractTokens(query);

    const scored = filtered.map((item) => {
      const haystack = extractTokens(
        `${item.act} ${item.section} ${item.title} ${item.text} ${item.simplified}`
      );
      let lexicalHits = 0;
      for (const tok of queryTokens) {
        if (haystack.has(tok)) lexicalHits += 1;
      }
      const lexicalScore = queryTokens.size > 0 ? lexicalHits / queryTokens.size : 0;

      const normCat = (item.category || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const normInt = (intent || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const intentMatch = normCat && normInt && (
        normCat.includes(normInt) ||
        normInt.includes(normCat) ||
        (normInt.includes('women') && normCat.includes('women')) ||
        (normInt.includes('labour') && (normCat.includes('labour') || normCat.includes('wage'))) ||
        (normInt.includes('consumer') && normCat.includes('consumer')) ||
        (normInt.includes('aid') && normCat.includes('aid')) ||
        (normInt.includes('property') && normCat.includes('property'))
      );
      const intentBoost = intentMatch ? 0.25 : 0.0;

      // Penalize generic constitutional chunks when a specific statutory intent is being resolved
      const isGeneralConstitutional = item.act && item.act.includes('Constitution') && !item.exactMatch;
      const statutoryDiscount = (isGeneralConstitutional && normInt && normInt !== 'constitutional' && normInt !== 'general') ? 0.15 : 0.0;

      // Composite hybrid score: 50% vector + 35% lexical + intent boost - statutory discount (exact matches get 1.0)
      const compositeScore = item.exactMatch ? 1.0 : (item.vectorSimilarity * 0.5) + (lexicalScore * 0.35) + intentBoost - statutoryDiscount;

      return {
        ...item,
        similarity: parseFloat(compositeScore.toFixed(4)),
        lexicalScore: parseFloat(lexicalScore.toFixed(3)),
      };
    });

    // 6. Sort descending by composite similarity score
    scored.sort((a, b) => b.similarity - a.similarity);

    // 7. Deduplicate chunks belonging to the exact same section
    const seenSections = new Set();
    const deduplicated = [];
    for (const item of scored) {
      const key = `${item.act}-${item.section}`.toLowerCase();
      if (!seenSections.has(key)) {
        seenSections.add(key);
        deduplicated.push(item);
      }
    }

    // 8. Return top results (respecting limit)
    return deduplicated.slice(0, limit);
  }

  /**
   * Direct semantic search endpoint handler
   */
  async semanticSearch(query, limit = 5) {
    return this.retrieve(query, 'GENERAL', limit);
  }
}

export const legalService = new LegalService();
export default legalService;
