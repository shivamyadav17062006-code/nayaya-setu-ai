/**
 * NyayaSaathi — State Legislation & Subordinate Rules Database Ingestion
 *
 * Ingests verified State Acts, Rules, Regulations, and Notifications into PostgreSQL
 * via Prisma ORM and embeds dense 384-d vectors into public.legal_chunks.
 */

import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { embeddingService } from '../ai-engine/src/services/embeddingService.js';

const prisma = new PrismaClient();
const CORPUS_PATH = path.resolve('data/jurisdiction/state_legislation_corpus.json');

async function ingestStateLegislation() {
  console.log('='.repeat(80));
  console.log('🏛️  NYAYASAATHI: INGESTING STATE & UT LEGISLATION AND SUBORDINATE RULES');
  console.log('='.repeat(80));

  if (!fs.existsSync(CORPUS_PATH)) {
    throw new Error(`Corpus file not found at ${CORPUS_PATH}. Run buildStateLegislationCorpus.js first.`);
  }

  const rawCorpus = fs.readFileSync(CORPUS_PATH, 'utf-8');
  const corpus = JSON.parse(rawCorpus);

  console.log(`Corpus version: ${corpus.version} (SHA-256: ${corpus.sha256.substring(0, 16)}...)`);
  console.log(`Total state documents to process: ${corpus.documents.length}`);
  console.log(`Covered States: ${corpus.coveredStates.join(', ')}`);

  let actsCount = 0;
  let rulesCount = 0;
  let sectionsCount = 0;
  let chunksCount = 0;
  let failedEmbeddings = 0;

  // Process Primary Acts first, then rules/regulations
  const sortedDocuments = [...corpus.documents].sort((a, b) => {
    if (a.documentType === 'ACT' && b.documentType !== 'ACT') return -1;
    if (a.documentType !== 'ACT' && b.documentType === 'ACT') return 1;
    return 0;
  });

  for (const doc of sortedDocuments) {
    console.log(`\n📄 [${doc.documentType}] [${doc.state}] Ingesting: ${doc.title} (${doc.year})`);

    // 1. Upsert into legal_acts
    const actRecord = await prisma.legalAct.upsert({
      where: { id: doc.id },
      update: {
        title: doc.title,
        actNumber: doc.actNumber || null,
        year: doc.year,
        jurisdiction: 'STATE',
        state: doc.state,
        category: doc.category || 'GENERAL',
        documentType: doc.documentType || 'ACT',
        parentActId: doc.parentActId || null,
        ministry: doc.ministry || null,
        sourceUrl: doc.sourceUrl,
        status: doc.status || 'ACTIVE',
        verificationStatus: doc.verificationStatus || 'PUBLISHED',
        effectiveFrom: doc.effectiveFrom ? new Date(doc.effectiveFrom) : null,
        enactmentDate: doc.enactmentDate ? new Date(doc.enactmentDate) : null,
        description: doc.description || null,
        lastVerifiedAt: new Date(),
      },
      create: {
        id: doc.id,
        title: doc.title,
        actNumber: doc.actNumber || null,
        year: doc.year,
        jurisdiction: 'STATE',
        state: doc.state,
        category: doc.category || 'GENERAL',
        documentType: doc.documentType || 'ACT',
        parentActId: doc.parentActId || null,
        ministry: doc.ministry || null,
        sourceUrl: doc.sourceUrl,
        status: doc.status || 'ACTIVE',
        verificationStatus: doc.verificationStatus || 'PUBLISHED',
        effectiveFrom: doc.effectiveFrom ? new Date(doc.effectiveFrom) : null,
        enactmentDate: doc.enactmentDate ? new Date(doc.enactmentDate) : null,
        description: doc.description || null,
        lastVerifiedAt: new Date(),
      },
    });

    if (doc.documentType === 'ACT') actsCount++;
    else rulesCount++;

    // 2. Ingest Sections / Rules
    if (Array.isArray(doc.sections) && doc.sections.length > 0) {
      for (const sec of doc.sections) {
        let sectionRecord = await prisma.legalSection.findFirst({
          where: {
            actId: actRecord.id,
            sectionNumber: sec.sectionNumber,
          },
        });

        if (sectionRecord) {
          sectionRecord = await prisma.legalSection.update({
            where: { id: sectionRecord.id },
            data: {
              title: sec.title,
              originalText: sec.originalText,
              simplifiedText: sec.simplifiedText,
            },
          });
        } else {
          sectionRecord = await prisma.legalSection.create({
            data: {
              actId: actRecord.id,
              sectionNumber: sec.sectionNumber,
              title: sec.title,
              originalText: sec.originalText,
              simplifiedText: sec.simplifiedText,
            },
          });
        }

        sectionsCount++;

        // 3. Generate 384-dimensional embedding for pgvector
        const chunkText = `[${doc.state} STATE LAW] ${doc.title}, ${sec.sectionNumber}, ${sec.title || ''}, ${sec.simplifiedText || ''}\n\n${sec.originalText}`;

        let embedding = null;
        try {
          embedding = await embeddingService.embedText(chunkText);
          if (!Array.isArray(embedding) || embedding.length !== 384) {
            throw new Error(`Invalid embedding vector dimension: expected 384, got ${embedding?.length}`);
          }
        } catch (embErr) {
          console.warn(`  ⚠️ Embedding error for ${sec.sectionNumber}: ${embErr.message}`);
          failedEmbeddings++;
        }

        if (embedding) {
          const vectorStr = `[${embedding.join(',')}]`;

          // Check if chunk exists
          const existingChunks = await prisma.$queryRaw`
            SELECT id FROM public.legal_chunks 
            WHERE section_id = ${sectionRecord.id}::uuid AND chunk_number = 1
          `;

          if (existingChunks && existingChunks.length > 0) {
            await prisma.$executeRawUnsafe(
              `UPDATE public.legal_chunks 
               SET content = $1, source_url = $2, embedding = $3::vector, updated_at = NOW() 
               WHERE id = $4::uuid`,
              chunkText,
              doc.sourceUrl,
              vectorStr,
              existingChunks[0].id
            );
          } else {
            await prisma.$executeRawUnsafe(
              `INSERT INTO public.legal_chunks (section_id, content, chunk_number, language, source_url, embedding, created_at, updated_at)
               VALUES ($1::uuid, $2, 1, 'en', $3, $4::vector, NOW(), NOW())`,
              sectionRecord.id,
              chunkText,
              doc.sourceUrl,
              vectorStr
            );
          }
          chunksCount++;
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // Audit & Verification
  // --------------------------------------------------------------------------
  console.log('\n' + '='.repeat(80));
  console.log('📊 STATE LEGISLATION INGESTION SUMMARY:');
  console.log('='.repeat(80));
  console.log(`  State Acts Ingested:       ${actsCount}`);
  console.log(`  State Rules Ingested:      ${rulesCount}`);
  console.log(`  Total Sections Processed:  ${sectionsCount}`);
  console.log(`  Vector Chunks Embedded:    ${chunksCount}`);
  console.log(`  Failed Embeddings:         ${failedEmbeddings}`);

  // Query Database totals
  const totalStateActs = await prisma.legalAct.count({ where: { jurisdiction: 'STATE' } });
  const totalCentralActs = await prisma.legalAct.count({ where: { jurisdiction: 'CENTRAL' } });
  const totalChunks = await prisma.$queryRaw`SELECT count(*)::int as count FROM public.legal_chunks WHERE embedding IS NOT NULL`;
  const stateChunks = await prisma.$queryRaw`
    SELECT count(*)::int as count 
    FROM public.legal_chunks lc
    JOIN public.legal_sections ls ON ls.id = lc.section_id
    JOIN public.legal_acts la ON la.id = ls.act_id
    WHERE la.jurisdiction = 'STATE'
  `;

  console.log('\n🏛️ DATABASE STATUS AFTER PHASE 10C STATE INGESTION:');
  console.log(`  Total Central Acts in DB:    ${totalCentralActs}`);
  console.log(`  Total State Acts in DB:      ${totalStateActs}`);
  console.log(`  Total State Chunks in DB:    ${stateChunks[0]?.count}`);
  console.log(`  Total Knowledge Base Chunks: ${totalChunks[0]?.count}`);
  console.log('='.repeat(80));

  await prisma.$disconnect();
}

ingestStateLegislation().catch(async (err) => {
  console.error('Fatal State Ingestion error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
