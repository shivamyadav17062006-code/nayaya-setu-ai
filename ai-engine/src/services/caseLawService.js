/**
 * NyayaSaathi — Case Law & Judicial Precedent Retrieval Service
 *
 * Provides a dedicated, separate retrieval channel for Indian landmark judgments.
 * Strictly separates judicial interpretation from statutory text and preserves
 * court hierarchy, decision dates, binding vs. persuasive authority, and later treatments.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { embeddingService } from './embeddingService.js';
import fs from 'fs';
import path from 'path';

function getResolvedPath(relativeSubPath) {
  const candidates = [
    path.resolve(process.cwd(), relativeSubPath),
    path.resolve(process.cwd(), '..', relativeSubPath),
    path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..', relativeSubPath),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
}

class CaseLawService {
  constructor() {
    this.supabase = null;
    if (config.supabaseUrl && config.supabaseAnonKey) {
      try {
        this.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
      } catch (err) {
        console.warn('[CaseLawService] Supabase initialization error:', err.message);
      }
    }
  }

  /**
   * Retrieves judicial precedents relevant to citizen query
   *
   * @param {string} query - Legal question
   * @param {Object} options - Filters { limit, court, targetState, minSimilarity }
   * @returns {Promise<Array>} List of precedent records
   */
  async retrieveCaseLaw(query, options = {}) {
    const limit = Math.min(options.limit || 3, 10);
    const minSimilarity = options.minSimilarity ?? 0.45;
    const targetCourt = options.court || null;
    const userState = options.targetState || null;

    let candidateJudgments = [];

    // 1. Generate 384-d dense embedding
    let queryEmbedding = null;
    try {
      queryEmbedding = await embeddingService.embedText(query);
    } catch (err) {
      console.warn('[CaseLawService] Embedding generation error:', err.message);
    }

    // 2. Query Supabase pgvector RPC public.match_case_law
    if (this.supabase && queryEmbedding && Array.isArray(queryEmbedding) && queryEmbedding.length === 384) {
      try {
        const { data, error } = await this.supabase.rpc('match_case_law', {
          query_embedding: queryEmbedding,
          match_count: limit * 3,
          min_similarity: 0.0,
          target_court: targetCourt,
        });

        if (!error && Array.isArray(data) && data.length > 0) {
          candidateJudgments = data.map((item) => {
            const isSupremeCourt = item.court_level === 'SUPREME_COURT';
            const stateMatches = userState && item.jurisdiction && item.jurisdiction.toUpperCase() === userState.toUpperCase();

            // Authority evaluation
            let authorityStatus = 'PERSUASIVE';
            let authorityLabel = 'Persuasive Precedent';
            let authorityExplanation = 'Persuasive authority from other High Courts; guiding but not strictly binding.';

            if (isSupremeCourt) {
              authorityStatus = 'BINDING_NATIONWIDE';
              authorityLabel = 'Binding Nationwide (Supreme Court)';
              authorityExplanation = 'Law declared by Supreme Court of India under Article 141 of the Constitution is binding on all courts within India.';
            } else if (stateMatches || item.precedentAuthority === 'BINDING_WITHIN_STATE') {
              authorityStatus = 'BINDING_WITHIN_STATE';
              authorityLabel = `Binding within ${item.jurisdiction}`;
              authorityExplanation = `Binding on all subordinate courts and authorities within ${item.jurisdiction}; persuasive elsewhere.`;
            }

            return {
              judgmentId: item.judgment_id,
              caseTitle: item.case_title,
              citation: item.citation,
              courtName: item.court_name,
              courtLevel: item.court_level,
              decisionDate: item.decision_date,
              bench: item.bench,
              jurisdiction: item.jurisdiction,
              precedentAuthority: authorityStatus,
              authorityLabel,
              authorityExplanation,
              relevantExcerpt: item.content,
              paragraphNumber: item.paragraph_number,
              chunkType: item.chunk_type,
              ratioDecidendi: item.ratio_decidendi,
              subsequentTreatment: item.subsequent_treatment,
              sourceUrl: item.source_url,
              isSummaryMachineGenerated: item.is_summary_machine_generated ?? true,
              similarity: parseFloat((item.similarity || 0.5).toFixed(4)),
            };
          });
        }
      } catch (rpcErr) {
        console.warn('[CaseLawService] match_case_law RPC error:', rpcErr.message);
      }
    }

    // 3. Fallback to local corpus JSON if database returned no results
    if (candidateJudgments.length === 0) {
      const corpusPath = getResolvedPath('data/caselaw/judgment_corpus.json');
      if (fs.existsSync(corpusPath)) {
        try {
          const raw = fs.readFileSync(corpusPath, 'utf-8');
          const corpus = JSON.parse(raw);
          const qLower = query.toLowerCase();

          for (const j of corpus.judgments) {
            const haystack = `${j.caseTitle} ${j.ratioDecidendi} ${j.summaryFacts} ${(j.issues || []).join(' ')}`.toLowerCase();
            let matches = false;
            if (qLower.includes('harassment') || qLower.includes('posh') || qLower.includes('women')) {
              matches = j.caseTitle.includes('Vishaka');
            } else if (qLower.includes('shared household') || qLower.includes('domestic violence') || qLower.includes('residence')) {
              matches = j.caseTitle.includes('Ahuja') || j.caseTitle.includes('Batra');
            } else if (qLower.includes('legal aid') || qLower.includes('speedy trial') || qLower.includes('poor')) {
              matches = j.caseTitle.includes('Hussainara');
            } else if (qLower.includes('arrest') || qLower.includes('police') || qLower.includes('custod')) {
              matches = j.caseTitle.includes('D.K. Basu');
            } else if (qLower.includes('equal pay') || qLower.includes('salary') || qLower.includes('wage')) {
              matches = j.caseTitle.includes('Jagjit Singh') || j.caseTitle.includes('Bharatiya Hotel');
            } else if (qLower.includes('medical') || qLower.includes('doctor') || qLower.includes('hospital')) {
              matches = j.caseTitle.includes('Shantha');
            }

            if (matches) {
              const firstChunk = (j.chunks && j.chunks[0]) || {};
              candidateJudgments.push({
                judgmentId: j.id,
                caseTitle: j.caseTitle,
                citation: j.citation,
                courtName: j.courtName,
                courtLevel: j.courtLevel,
                decisionDate: j.decisionDate,
                bench: j.bench,
                jurisdiction: j.jurisdiction,
                precedentAuthority: j.precedentAuthority,
                authorityLabel: j.courtLevel === 'SUPREME_COURT' ? 'Binding Nationwide (Supreme Court)' : 'Binding within State',
                authorityExplanation: j.courtLevel === 'SUPREME_COURT' ? 'Binding law under Article 141 of the Constitution.' : 'State-level precedent.',
                relevantExcerpt: firstChunk.content || j.ratioDecidendi,
                paragraphNumber: firstChunk.paragraphNumber || 1,
                chunkType: firstChunk.chunkType || 'RATIO',
                ratioDecidendi: j.ratioDecidendi,
                subsequentTreatment: j.subsequentTreatment,
                sourceUrl: j.sourceUrl,
                isSummaryMachineGenerated: true,
                similarity: 0.85,
              });
            }
          }
        } catch (corpusErr) {
          console.warn('[CaseLawService] Local corpus fallback error:', corpusErr.message);
        }
      }
    }

    // 4. Sort descending by similarity score & deduplicate by judgment
    candidateJudgments.sort((a, b) => b.similarity - a.similarity);

    const seen = new Set();
    const deduplicated = [];
    for (const item of candidateJudgments) {
      if (!seen.has(item.judgmentId)) {
        seen.add(item.judgmentId);
        deduplicated.push(item);
      }
    }

    return deduplicated.slice(0, limit);
  }
}

export const caseLawService = new CaseLawService();
export default caseLawService;
