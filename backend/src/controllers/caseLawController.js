/**
 * NyayaSaathi — Case Law & Judicial Precedent Controller
 *
 * Exposes endpoints for searching, listing, and retrieving landmark
 * Indian court judgments, ratio decidendi, and statutory interpretations.
 */

import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma.js';

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

function loadCorpusData() {
  const p = getResolvedPath('data/caselaw/judgment_corpus.json');
  if (fs.existsSync(p)) {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  }
  return null;
}

/**
 * GET /api/case-law
 * Lists judgments with optional filtering by court, authority, topic, or search query
 */
export async function listJudgments(req, res, next) {
  try {
    const { court, authority, q, limit = 20, page = 1 } = req.query;
    const take = Math.min(parseInt(limit, 10) || 20, 50);
    const skip = ((parseInt(page, 10) || 1) - 1) * take;

    let judgments = [];
    let totalCount = 0;

    try {
      // Query PostgreSQL
      const where = {
        verification_status: { in: ['VERIFIED', 'PUBLISHED'] },
      };

      if (court) {
        where.court_level = court.toUpperCase();
      }
      if (authority) {
        where.precedent_authority = authority.toUpperCase();
      }
      if (q) {
        where.OR = [
          { case_title: { contains: q, mode: 'insensitive' } },
          { citation: { contains: q, mode: 'insensitive' } },
          { ratio_decidendi: { contains: q, mode: 'insensitive' } },
        ];
      }

      // Raw SQL query to support custom schema if not generated in Prisma client
      const rawJudgments = await prisma.$queryRaw`
        SELECT 
          cj.id, cj.case_title, cj.citation, cj.neutral_citation, cj.court_name,
          cj.court_level, cj.jurisdiction, cj.precedent_authority, cj.case_number,
          cj.decision_date, cj.bench, cj.source_url, cj.pdf_source_url,
          cj.ratio_decidendi, cj.summary_facts, cj.subsequent_treatment,
          cj.is_summary_machine_generated,
          (
            SELECT json_agg(json_build_object(
              'actTitle', jsl.act_title,
              'provisionCited', jsl.provision_cited,
              'relationshipType', jsl.relationship_type
            ))
            FROM public.judgment_statute_links jsl
            WHERE jsl.judgment_id = cj.id
          ) AS statute_links
        FROM public.court_judgments cj
        WHERE cj.verification_status IN ('VERIFIED', 'PUBLISHED')
          AND (${court || null}::text IS NULL OR cj.court_level = ${court || null} OR cj.court_name ILIKE '%' || ${court || null} || '%')
          AND (${authority || null}::text IS NULL OR cj.precedent_authority = ${authority || null})
          AND (${q || null}::text IS NULL OR cj.case_title ILIKE '%' || ${q || null} || '%' OR cj.ratio_decidendi ILIKE '%' || ${q || null} || '%' OR cj.citation ILIKE '%' || ${q || null} || '%')
        ORDER BY cj.decision_date DESC
        LIMIT ${take} OFFSET ${skip};
      `;

      const countResult = await prisma.$queryRaw`
        SELECT count(*)::int as count 
        FROM public.court_judgments cj
        WHERE cj.verification_status IN ('VERIFIED', 'PUBLISHED')
          AND (${court || null}::text IS NULL OR cj.court_level = ${court || null} OR cj.court_name ILIKE '%' || ${court || null} || '%')
          AND (${authority || null}::text IS NULL OR cj.precedent_authority = ${authority || null})
          AND (${q || null}::text IS NULL OR cj.case_title ILIKE '%' || ${q || null} || '%' OR cj.ratio_decidendi ILIKE '%' || ${q || null} || '%' OR cj.citation ILIKE '%' || ${q || null} || '%');
      `;

      judgments = rawJudgments;
      totalCount = countResult[0]?.count || rawJudgments.length;
    } catch (dbErr) {
      console.warn('Prisma listJudgments error, falling back to corpus:', dbErr.message);
      const corpus = loadCorpusData();
      if (corpus) {
        let filtered = corpus.judgments;
        if (court) filtered = filtered.filter((j) => j.courtLevel === court.toUpperCase());
        if (authority) filtered = filtered.filter((j) => j.precedentAuthority === authority.toUpperCase());
        if (q) {
          const qL = q.toLowerCase();
          filtered = filtered.filter(
            (j) =>
              j.caseTitle.toLowerCase().includes(qL) ||
              j.citation.toLowerCase().includes(qL) ||
              j.ratioDecidendi.toLowerCase().includes(qL)
          );
        }
        totalCount = filtered.length;
        judgments = filtered.slice(skip, skip + take);
      }
    }

    return res.json({
      success: true,
      totalCount,
      page: parseInt(page, 10) || 1,
      limit: take,
      data: judgments,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/case-law/:id
 * Retrieves full judgment dossier including facts, issues, ratio, obiter, and statute links
 */
export async function getJudgmentById(req, res, next) {
  try {
    const { id } = req.params;

    let judgment = null;
    try {
      const records = await prisma.$queryRaw`
        SELECT 
          cj.*,
          (
            SELECT json_agg(json_build_object(
              'actTitle', jsl.act_title,
              'provisionCited', jsl.provision_cited,
              'relationshipType', jsl.relationship_type,
              'notes', jsl.notes
            ))
            FROM public.judgment_statute_links jsl
            WHERE jsl.judgment_id = cj.id
          ) AS statute_links,
          (
            SELECT json_agg(json_build_object(
              'id', jc.id,
              'paragraphNumber', jc.paragraph_number,
              'chunkType', jc.chunk_type,
              'content', jc.content
            ))
            FROM public.judgment_chunks jc
            WHERE jc.judgment_id = cj.id
          ) AS chunks
        FROM public.court_judgments cj
        WHERE cj.id = ${id}::uuid
        LIMIT 1;
      `;
      judgment = records[0] || null;
    } catch (dbErr) {
      console.warn('Prisma getJudgmentById fallback:', dbErr.message);
      const corpus = loadCorpusData();
      if (corpus) {
        judgment = corpus.judgments.find((j) => j.id === id) || null;
      }
    }

    if (!judgment) {
      return res.status(404).json({
        success: false,
        error: `Judgment with ID '${id}' not found.`,
      });
    }

    return res.json({
      success: true,
      data: judgment,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/case-law/statute/:provision
 * Retrieves judgments interpreting a specific Constitutional Article or Act
 */
export async function getJudgmentsByStatute(req, res, next) {
  try {
    const { provision } = req.params;
    const term = provision.trim();

    const judgments = await prisma.$queryRaw`
      SELECT DISTINCT 
        cj.id, cj.case_title, cj.citation, cj.court_name, cj.court_level,
        cj.precedent_authority, cj.decision_date, cj.ratio_decidendi, cj.source_url,
        jsl.provision_cited, jsl.act_title, jsl.relationship_type
      FROM public.court_judgments cj
      JOIN public.judgment_statute_links jsl ON jsl.judgment_id = cj.id
      WHERE jsl.provision_cited ILIKE '%' || ${term} || '%'
         OR jsl.act_title ILIKE '%' || ${term} || '%'
      ORDER BY cj.decision_date DESC;
    `;

    return res.json({
      success: true,
      provision: term,
      count: judgments.length,
      data: judgments,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/case-law/search
 * Semantic vector search over landmark case law
 */
export async function searchCaseLaw(req, res, next) {
  try {
    const { query, limit = 5, court = null } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query parameter is required' });
    }

    // Call AI Engine case law retrieval
    const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8001';
    let results = [];

    try {
      const resp = await fetch(`${aiEngineUrl}/api/v1/case-law/retrieve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit, court }),
      });
      if (resp.ok) {
        const payload = await resp.json();
        results = payload.data || [];
      }
    } catch {
      // Fallback: direct DB query
      const corpus = loadCorpusData();
      results = (corpus?.judgments || []).slice(0, limit);
    }

    return res.json({
      success: true,
      query,
      count: results.length,
      data: results,
    });
  } catch (err) {
    next(err);
  }
}
