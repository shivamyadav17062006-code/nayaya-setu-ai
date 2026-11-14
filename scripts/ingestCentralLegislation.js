/**
 * NyayaSaathi — Central Legislation & Subordinate Rules Database Ingestion
 *
 * Ingests Central Acts, Rules, Regulations, and Notifications into PostgreSQL
 * via Prisma ORM and embeds dense 384-d vectors into public.legal_chunks.
 */

import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { embeddingService } from '../ai-engine/src/services/embeddingService.js';

const prisma = new PrismaClient();
const CORPUS_PATH = path.resolve('data/legislation/central_legislation_corpus.json');

async function ingestCentralLegislation() {
  console.log('='.repeat(80));
  console.log('⚖️  NYAYASAATHI: INGESTING CENTRAL ACTS, RULES & SUBORDINATE LEGISLATION');
  console.log('='.repeat(80));

  if (!fs.existsSync(CORPUS_PATH)) {
    throw new Error(`Corpus file not found at ${CORPUS_PATH}. Run buildCentralLegislationCorpus.js first.`);
  }

  const rawCorpus = fs.readFileSync(CORPUS_PATH, 'utf-8');
  const corpus = JSON.parse(rawCorpus);

  console.log(`Corpus version: ${corpus.version} (SHA-256: ${corpus.sha256.substring(0, 16)}...)`);
  console.log(`Total documents to process: ${corpus.documents.length}`);

  let actsCount = 0;
  let rulesCount = 0;
  let sectionsCount = 0;
  let chunksCount = 0;
  let failedEmbeddings = 0;

  // Process Primary Acts first (so parent_act_id foreign keys resolve)
  const sortedDocuments = [...corpus.documents].sort((a, b) => {
    if (a.documentType === 'ACT' && b.documentType !== 'ACT') return -1;
    if (a.documentType !== 'ACT' && b.documentType === 'ACT') return 1;
    return 0;
  });

  for (const doc of sortedDocuments) {
    console.log(`\n📄 [${doc.documentType}] Ingesting: ${doc.title} (${doc.year})`);

    // 1. Upsert into legal_acts
    const actRecord = await prisma.legalAct.upsert({
      where: { id: doc.id },
      update: {
        title: doc.title,
        actNumber: doc.actNumber || null,
        year: doc.year,
        jurisdiction: doc.jurisdiction || 'CENTRAL',
        category: doc.category || 'GENERAL',
        documentType: doc.documentType || 'ACT',
        parentActId: doc.parentActId || null,
        ministry: doc.ministry || null,
        enablingProvision: doc.enablingProvision || null,
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
        jurisdiction: doc.jurisdiction || 'CENTRAL',
        category: doc.category || 'GENERAL',
        documentType: doc.documentType || 'ACT',
        parentActId: doc.parentActId || null,
        ministry: doc.ministry || null,
        enablingProvision: doc.enablingProvision || null,
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
        // Upsert section by [actId, sectionNumber]
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
        const chunkText = `${doc.title}, ${sec.sectionNumber}, ${sec.title || ''}, ${sec.simplifiedText || ''}\n\n${sec.originalText}`;

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
  console.log('📊 INGESTION AUDIT SUMMARY:');
  console.log(`  - Central Acts Ingested: ${actsCount}`);
  console.log(`  - Subordinate Rules & Notifications Ingested: ${rulesCount}`);
  console.log(`  - Legal Provisions / Sections Ingested: ${sectionsCount}`);
  console.log(`  - Vector Chunks Indexed in pgvector: ${chunksCount}`);
  console.log(`  - Embedding Failures: ${failedEmbeddings}`);

  // Query live DB stats
  const [totalChunksRow] = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM public.legal_chunks`;
  const [validDimChunks] = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count FROM public.legal_chunks 
    WHERE embedding IS NOT NULL AND vector_dims(embedding) = 384
  `;

  console.log(`\n🔎 PostgreSQL Live State:`);
  console.log(`  - Total chunks in public.legal_chunks: ${totalChunksRow.count}`);
  console.log(`  - Total valid 384-dimension chunks: ${validDimChunks.count}`);
  console.log('='.repeat(80));
  console.log('✅ CENTRAL LEGISLATION INGESTION COMPLETED SUCCESSFULLY!\n');
}

ingestCentralLegislation()
  .catch((err) => {
    console.error('❌ Fatal error during Central Legislation ingestion:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
