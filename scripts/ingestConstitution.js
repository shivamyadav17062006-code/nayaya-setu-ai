/**
 * Complete Constitution of India Ingestion Engine
 * Ingests Preamble, Articles, Clauses, and Schedules into Supabase PostgreSQL & pgvector.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import { PrismaClient } from '@prisma/client';
import { embeddingService } from '../ai-engine/src/services/embeddingService.js';

const prisma = new PrismaClient();
const CONSTITUTION_ACT_ID = 'a0000000-0000-0000-0000-000000000009';
const CORPUS_PATH = path.resolve('data/constitution/constitution_corpus.json');

async function ingest() {
  console.log('================================================================');
  console.log('PHASE 10A — INGESTING CONSTITUTION OF INDIA INTO PGVECTOR');
  console.log('================================================================\n');

  if (!fs.existsSync(CORPUS_PATH)) {
    throw new Error(`Corpus file missing at ${CORPUS_PATH}. Run buildConstitutionCorpus.js first.`);
  }

  const raw = fs.readFileSync(CORPUS_PATH, 'utf-8');
  const corpus = JSON.parse(raw);

  // 1. Ensure Constitution LegalAct exists
  await prisma.legalAct.upsert({
    where: { id: CONSTITUTION_ACT_ID },
    update: {
      title: corpus.documentTitle,
      actNumber: 'Constituent Assembly of India',
      year: 1950,
      jurisdiction: corpus.jurisdiction,
      category: 'CONSTITUTIONAL',
      description: 'The supreme law of the Republic of India adopted on 26 Nov 1949 and in effect from 26 Jan 1950.',
      sourceUrl: 'https://legislative.gov.in/constitution-of-india',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
    },
    create: {
      id: CONSTITUTION_ACT_ID,
      title: corpus.documentTitle,
      actNumber: 'Constituent Assembly of India',
      year: 1950,
      jurisdiction: corpus.jurisdiction,
      category: 'CONSTITUTIONAL',
      description: 'The supreme law of the Republic of India adopted on 26 Nov 1949 and in effect from 26 Jan 1950.',
      sourceUrl: 'https://legislative.gov.in/constitution-of-india',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
    },
  });
  console.log(`✓ Act Record: ${corpus.documentTitle} (${CONSTITUTION_ACT_ID})`);

  let ingestedSections = 0;
  let ingestedChunks = 0;
  let failedChunks = 0;

  // 2. Ingest Preamble
  try {
    const preambleSec = await prisma.legalSection.upsert({
      where: {
        actId_sectionNumber: {
          actId: CONSTITUTION_ACT_ID,
          sectionNumber: 'Preamble',
        },
      },
      update: {
        title: corpus.preamble.heading,
        originalText: corpus.preamble.originalText,
        simplifiedText: corpus.preamble.simplifiedText,
      },
      create: {
        actId: CONSTITUTION_ACT_ID,
        sectionNumber: 'Preamble',
        title: corpus.preamble.heading,
        originalText: corpus.preamble.originalText,
        simplifiedText: corpus.preamble.simplifiedText,
      },
    });
    ingestedSections++;

    // Embed Preamble Chunk
    const chunkText = `Constitution of India, Preamble, Guiding Philosophy\n\n${corpus.preamble.simplifiedText}\n\n${corpus.preamble.originalText}`;
    const vec = await embeddingService.embedText(chunkText);
    const vecStr = `[${vec.join(',')}]`;

    await prisma.$executeRawUnsafe(
      `INSERT INTO legal_chunks (id, section_id, content, chunk_number, language, source_url, embedding, updated_at)
       VALUES (gen_random_uuid(), $1::uuid, $2, 1, 'en', $3, $4::vector, NOW())
       ON CONFLICT (section_id, chunk_number, language)
       DO UPDATE SET content = $2, source_url = $3, embedding = $4::vector, updated_at = NOW();`,
      preambleSec.id,
      chunkText,
      corpus.preamble.sourceUrl,
      vecStr
    );
    ingestedChunks++;
    console.log('  ✓ Ingested: Preamble (embedded & indexed)');
  } catch (err) {
    console.error('  ✗ Failed to ingest Preamble:', err.message);
    failedChunks++;
  }

  // 3. Ingest Articles (both article-level and clause-level chunks)
  for (const article of corpus.articles) {
    try {
      const sec = await prisma.legalSection.upsert({
        where: {
          actId_sectionNumber: {
            actId: CONSTITUTION_ACT_ID,
            sectionNumber: article.articleNumber,
          },
        },
        update: {
          title: article.heading,
          originalText: article.originalText,
          simplifiedText: article.simplifiedText,
        },
        create: {
          actId: CONSTITUTION_ACT_ID,
          sectionNumber: article.articleNumber,
          title: article.heading,
          originalText: article.originalText,
          simplifiedText: article.simplifiedText,
        },
      });
      ingestedSections++;

      // Article-level Chunk (Chunk #1)
      const articleChunkText = `Constitution of India, ${article.partNumber} (${article.partTitle}), ${article.articleNumber}: ${article.heading}\n\n${article.simplifiedText}\n\n${article.originalText}${article.amendmentNotes ? '\n\nAmendments: ' + article.amendmentNotes : ''}`;
      const articleVec = await embeddingService.embedText(articleChunkText);
      const articleVecStr = `[${articleVec.join(',')}]`;

      await prisma.$executeRawUnsafe(
        `INSERT INTO legal_chunks (id, section_id, content, chunk_number, language, source_url, embedding, updated_at)
         VALUES (gen_random_uuid(), $1::uuid, $2, 1, 'en', $3, $4::vector, NOW())
         ON CONFLICT (section_id, chunk_number, language)
         DO UPDATE SET content = $2, source_url = $3, embedding = $4::vector, updated_at = NOW();`,
        sec.id,
        articleChunkText,
        article.sourceUrl,
        articleVecStr
      );
      ingestedChunks++;

      // Clause-level Chunks (if present)
      if (Array.isArray(article.clauses) && article.clauses.length > 0) {
        for (let i = 0; i < article.clauses.length; i++) {
          const clause = article.clauses[i];
          const clauseNumber = i + 2; // Chunk 2, 3...
          const clauseChunkText = `Constitution of India, ${article.articleNumber}(${clause.clauseNumber}) — ${article.heading}\n\n${clause.simplified}\n\n${clause.text}`;
          const clauseVec = await embeddingService.embedText(clauseChunkText);
          const clauseVecStr = `[${clauseVec.join(',')}]`;

          await prisma.$executeRawUnsafe(
            `INSERT INTO legal_chunks (id, section_id, content, chunk_number, language, source_url, embedding, updated_at)
             VALUES (gen_random_uuid(), $1::uuid, $2, $3, 'en', $4, $5::vector, NOW())
             ON CONFLICT (section_id, chunk_number, language)
             DO UPDATE SET content = $2, source_url = $4, embedding = $5::vector, updated_at = NOW();`,
            sec.id,
            clauseChunkText,
            clauseNumber,
            article.sourceUrl,
            clauseVecStr
          );
          ingestedChunks++;
        }
      }

      console.log(`  ✓ Ingested: ${article.articleNumber} — ${article.heading} (${article.clauses?.length || 0} clauses)`);
    } catch (err) {
      console.error(`  ✗ Ingestion failed for ${article.articleNumber}:`, err.message);
      failedChunks++;
    }
  }

  // 4. Ingest Schedules
  for (const schedule of corpus.schedules) {
    try {
      const schedSec = await prisma.legalSection.upsert({
        where: {
          actId_sectionNumber: {
            actId: CONSTITUTION_ACT_ID,
            sectionNumber: schedule.number,
          },
        },
        update: {
          title: schedule.title,
          originalText: `${schedule.description}\nLinked Provisions: ${schedule.articlesLinked}`,
          simplifiedText: schedule.description,
        },
        create: {
          actId: CONSTITUTION_ACT_ID,
          sectionNumber: schedule.number,
          title: schedule.title,
          originalText: `${schedule.description}\nLinked Provisions: ${schedule.articlesLinked}`,
          simplifiedText: schedule.description,
        },
      });
      ingestedSections++;

      const schedChunkText = `Constitution of India, ${schedule.number}: ${schedule.title}\n\nArticles Linked: ${schedule.articlesLinked}\n\n${schedule.description}`;
      const schedVec = await embeddingService.embedText(schedChunkText);
      const schedVecStr = `[${schedVec.join(',')}]`;

      await prisma.$executeRawUnsafe(
        `INSERT INTO legal_chunks (id, section_id, content, chunk_number, language, source_url, embedding, updated_at)
         VALUES (gen_random_uuid(), $1::uuid, $2, 1, 'en', 'https://legislative.gov.in/constitution-of-india', $3::vector, NOW())
         ON CONFLICT (section_id, chunk_number, language)
         DO UPDATE SET content = $2, source_url = 'https://legislative.gov.in/constitution-of-india', embedding = $3::vector, updated_at = NOW();`,
        schedSec.id,
        schedChunkText,
        schedVecStr
      );
      ingestedChunks++;
      console.log(`  ✓ Ingested: ${schedule.number} — ${schedule.title}`);
    } catch (err) {
      console.error(`  ✗ Ingestion failed for ${schedule.number}:`, err.message);
      failedChunks++;
    }
  }

  console.log('\n================================================================');
  console.log(`INGESTION SUMMARY:`);
  console.log(`  Total Sections Ingested: ${ingestedSections}`);
  console.log(`  Total Chunks Embedded:   ${ingestedChunks}`);
  console.log(`  Failed Chunks:           ${failedChunks}`);
  console.log('================================================================');

  await prisma.$disconnect();
}

ingest().catch((err) => {
  console.error('Ingestion script failure:', err);
  process.exit(1);
});
