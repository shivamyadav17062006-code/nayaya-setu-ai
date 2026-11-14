/**
 * NyayaSaathi — Phase 10D: Case Law & Judicial Precedent Database Ingestion
 *
 * Ingests structured landmark judgments into public.court_judgments,
 * maps statutory relationships in public.judgment_statute_links,
 * and embeds dense 384-d vector embeddings in public.judgment_chunks.
 */

import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { embeddingService } from '../ai-engine/src/services/embeddingService.js';

const prisma = new PrismaClient();
const CORPUS_PATH = path.resolve('data/caselaw/judgment_corpus.json');

async function ingestCaseLaw() {
  console.log('='.repeat(80));
  console.log('⚖️  NYAYASAATHI PHASE 10D: INGESTING CASE LAW & JUDICIAL PRECEDENT');
  console.log('='.repeat(80));

  if (!fs.existsSync(CORPUS_PATH)) {
    throw new Error(`Corpus file not found at ${CORPUS_PATH}. Run buildCaseLawCorpus.js first.`);
  }

  const raw = fs.readFileSync(CORPUS_PATH, 'utf-8');
  const corpus = JSON.parse(raw);

  console.log(`Corpus version: ${corpus.version} (SHA-256: ${corpus.sha256.substring(0, 16)}...)`);
  console.log(`Total judgments to process: ${corpus.judgments.length}`);

  let judgmentsCount = 0;
  let statuteLinksCount = 0;
  let chunksCount = 0;
  let failedEmbeddings = 0;

  for (const doc of corpus.judgments) {
    console.log(`\n🏛️ [${doc.courtLevel}] [${doc.precedentAuthority}] ${doc.caseTitle} (${doc.decisionDate.substring(0, 4)})`);

    // 1. Upsert into public.court_judgments
    await prisma.$executeRawUnsafe(
      `INSERT INTO public.court_judgments (
        id, case_title, citation, neutral_citation, court_name, court_level, jurisdiction,
        precedent_authority, case_number, decision_date, bench, coram_size, source_url,
        pdf_source_url, checksum, summary_facts, issues, ratio_decidendi, obiter_dicta,
        final_order, subsequent_treatment, is_summary_machine_generated, verification_status,
        created_at, updated_at
      ) VALUES (
        $1::uuid, $2, $3, $4, $5, $6, $7,
        $8, $9, $10::date, $11, $12, $13,
        $14, $15, $16, $17::text[], $18, $19,
        $20, $21, $22, $23,
        NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        case_title = EXCLUDED.case_title,
        citation = EXCLUDED.citation,
        neutral_citation = EXCLUDED.neutral_citation,
        court_name = EXCLUDED.court_name,
        court_level = EXCLUDED.court_level,
        jurisdiction = EXCLUDED.jurisdiction,
        precedent_authority = EXCLUDED.precedent_authority,
        case_number = EXCLUDED.case_number,
        decision_date = EXCLUDED.decision_date,
        bench = EXCLUDED.bench,
        coram_size = EXCLUDED.coram_size,
        source_url = EXCLUDED.source_url,
        pdf_source_url = EXCLUDED.pdf_source_url,
        checksum = EXCLUDED.checksum,
        summary_facts = EXCLUDED.summary_facts,
        issues = EXCLUDED.issues,
        ratio_decidendi = EXCLUDED.ratio_decidendi,
        obiter_dicta = EXCLUDED.obiter_dicta,
        final_order = EXCLUDED.final_order,
        subsequent_treatment = EXCLUDED.subsequent_treatment,
        is_summary_machine_generated = EXCLUDED.is_summary_machine_generated,
        verification_status = EXCLUDED.verification_status,
        updated_at = NOW();`,
      doc.id,
      doc.caseTitle,
      doc.citation,
      doc.neutralCitation || null,
      doc.courtName,
      doc.courtLevel,
      doc.jurisdiction,
      doc.precedentAuthority,
      doc.caseNumber || null,
      doc.decisionDate,
      doc.bench,
      doc.coramSize || 1,
      doc.sourceUrl,
      doc.pdfSourceUrl || doc.sourceUrl,
      doc.checksum,
      doc.summaryFacts,
      doc.issues || [],
      doc.ratioDecidendi,
      doc.obiterDicta || null,
      doc.finalOrder || null,
      doc.subsequentTreatment || null,
      doc.isSummaryMachineGenerated ?? true,
      doc.verificationStatus || 'PUBLISHED'
    );
    judgmentsCount++;

    // 2. Ingest Statutory Links
    if (Array.isArray(doc.statuteLinks)) {
      for (const link of doc.statuteLinks) {
        // Try resolving act_id from legal_acts if possible
        const acts = await prisma.$queryRaw`
          SELECT id FROM public.legal_acts 
          WHERE title ILIKE '%' || ${link.actTitle} || '%' 
          LIMIT 1;
        `;
        const actId = acts[0]?.id || null;

        await prisma.$executeRawUnsafe(
          `INSERT INTO public.judgment_statute_links (
            judgment_id, act_title, act_id, provision_cited, relationship_type, notes, created_at
          ) VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6, NOW());`,
          doc.id,
          link.actTitle,
          actId,
          link.provisionCited,
          link.relationshipType || 'INTERPRETED',
          link.notes || null
        );
        statuteLinksCount++;
      }
    }

    // 3. Ingest and Embed Chunks (384-dimensional dense vectors)
    if (Array.isArray(doc.chunks)) {
      for (const chunk of doc.chunks) {
        const chunkText = `[JUDICIAL PRECEDENT] ${doc.courtName} (${doc.decisionDate.substring(0, 4)}): ${doc.caseTitle} [${doc.citation}]\n\n${chunk.content}\n\nCore Ratio: ${doc.ratioDecidendi}`;

        let embedding = null;
        try {
          embedding = await embeddingService.embedText(chunkText);
          if (!Array.isArray(embedding) || embedding.length !== 384) {
            throw new Error(`Invalid embedding vector dimension: expected 384, got ${embedding?.length}`);
          }
        } catch (embErr) {
          console.warn(`  ⚠️ Embedding error for Para ${chunk.paragraphNumber}: ${embErr.message}`);
          failedEmbeddings++;
        }

        if (embedding) {
          const vectorStr = `[${embedding.join(',')}]`;
          await prisma.$executeRawUnsafe(
            `INSERT INTO public.judgment_chunks (
              judgment_id, content, paragraph_number, chunk_type, source_url, embedding, created_at, updated_at
            ) VALUES (
              $1::uuid, $2, $3, $4, $5, $6::vector, NOW(), NOW()
            );`,
            doc.id,
            chunk.content,
            chunk.paragraphNumber || null,
            chunk.chunkType || 'RATIO',
            doc.sourceUrl,
            vectorStr
          );
          chunksCount++;
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // Audit & Verification
  // --------------------------------------------------------------------------
  console.log('\n' + '='.repeat(80));
  console.log('📊 CASE LAW INGESTION SUMMARY:');
  console.log('='.repeat(80));
  console.log(`  Judgments Ingested:        ${judgmentsCount}`);
  console.log(`  Statute Links Ingested:    ${statuteLinksCount}`);
  console.log(`  Judgment Chunks Embedded:  ${chunksCount}`);
  console.log(`  Failed Embeddings:         ${failedEmbeddings}`);

  const totalJudgmentsInDB = await prisma.$queryRaw`SELECT count(*)::int as count FROM public.court_judgments`;
  const totalJudgmentChunksInDB = await prisma.$queryRaw`SELECT count(*)::int as count FROM public.judgment_chunks WHERE embedding IS NOT NULL`;

  console.log('\n🏛️ DATABASE STATUS AFTER PHASE 10D:');
  console.log(`  Total Judgments in DB:       ${totalJudgmentsInDB[0]?.count}`);
  console.log(`  Total Judgment Chunks in DB: ${totalJudgmentChunksInDB[0]?.count}`);
  console.log('='.repeat(80));

  await prisma.$disconnect();
}

ingestCaseLaw().catch(async (err) => {
  console.error('Fatal Case Law Ingestion error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
