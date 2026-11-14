/**
 * NyayaSaathi — KMS RAG Sync Service
 *
 * Automatically manages dense 384-d pgvector chunk indexing in public.legal_chunks
 * when legal records are published, updated, or superseded.
 *
 * STRICT RULE: Only records with verification_status = 'PUBLISHED' or 'VERIFIED'
 * are indexed in public.legal_chunks. DRAFT, UNDER_REVIEW, and SUPERSEDED records
 * are immediately purged or de-indexed from citizen-facing RAG search.
 */

import { prisma } from '../lib/prisma.js';
import { embeddingService } from '../../../ai-engine/src/services/embeddingService.js';

export class KMSRAGSyncService {
  /**
   * Syncs and embeds chunks for a published Act
   */
  async syncActChunks(actId) {
    const act = await prisma.legalAct.findUnique({
      where: { id: actId },
      include: {
        sections: true,
      },
    });

    if (!act) return { synced: 0, removed: 0 };

    // If Act is NOT published/verified, purge its chunks from vector search
    if (act.verificationStatus !== 'PUBLISHED' && act.verificationStatus !== 'VERIFIED') {
      return this.purgeActChunks(actId);
    }

    let synced = 0;
    for (const sec of act.sections) {
      if (sec.verificationStatus === 'PUBLISHED' || sec.verificationStatus === 'VERIFIED') {
        const res = await this.syncSectionChunk(sec, act);
        if (res) synced++;
      }
    }

    return { synced, removed: 0 };
  }

  /**
   * Syncs a single section into public.legal_chunks with 384-d embedding
   */
  async syncSectionChunk(section, act = null) {
    let parentAct = act;
    if (!parentAct) {
      parentAct = await prisma.legalAct.findUnique({ where: { id: section.actId } });
    }
    if (!parentAct) return false;

    // Check publication status
    if (
      (parentAct.verificationStatus !== 'PUBLISHED' && parentAct.verificationStatus !== 'VERIFIED') ||
      (section.verificationStatus !== 'PUBLISHED' && section.verificationStatus !== 'VERIFIED')
    ) {
      await this.purgeSectionChunk(section.id);
      return false;
    }

    const statePrefix = parentAct.jurisdiction === 'STATE' && parentAct.state ? `[${parentAct.state} STATE LAW] ` : '';
    const chunkText = `${statePrefix}${parentAct.title}, ${section.sectionNumber}, ${section.title || ''}, ${section.simplifiedText || ''}\n\n${section.originalText}`;

    let embedding = null;
    try {
      embedding = await embeddingService.embedText(chunkText);
      if (!Array.isArray(embedding) || embedding.length !== 384) {
        console.warn(`[KMSRAGSync] Embedding dimension mismatch for section ${section.id}`);
        return false;
      }
    } catch (err) {
      console.warn(`[KMSRAGSync] Embedding error for section ${section.id}:`, err.message);
      return false;
    }

    const vectorStr = `[${embedding.join(',')}]`;

    // Upsert chunk in public.legal_chunks
    const existing = await prisma.$queryRaw`
      SELECT id FROM public.legal_chunks 
      WHERE section_id = ${section.id}::uuid AND chunk_number = 1
      LIMIT 1;
    `;

    if (existing && existing.length > 0) {
      await prisma.$executeRawUnsafe(
        `UPDATE public.legal_chunks 
         SET content = $1, source_url = $2, embedding = $3::vector, updated_at = NOW() 
         WHERE id = $4::uuid`,
        chunkText,
        parentAct.sourceUrl || 'https://www.indiacode.nic.in',
        vectorStr,
        existing[0].id
      );
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO public.legal_chunks (section_id, content, chunk_number, language, source_url, embedding, created_at, updated_at)
         VALUES ($1::uuid, $2, 1, 'en', $3, $4::vector, NOW(), NOW())`,
        section.id,
        chunkText,
        parentAct.sourceUrl || 'https://www.indiacode.nic.in',
        vectorStr
      );
    }

    return true;
  }

  /**
   * Purges all chunks belonging to an Act when draft, rejected or superseded
   */
  async purgeActChunks(actId) {
    const deleted = await prisma.$executeRawUnsafe(
      `DELETE FROM public.legal_chunks 
       WHERE section_id IN (
         SELECT id FROM public.legal_sections WHERE act_id = $1::uuid
       );`,
      actId
    );
    return { synced: 0, removed: deleted };
  }

  /**
   * Purges chunks for a specific section
   */
  async purgeSectionChunk(sectionId) {
    const deleted = await prisma.$executeRawUnsafe(
      `DELETE FROM public.legal_chunks WHERE section_id = $1::uuid;`,
      sectionId
    );
    return deleted;
  }
}

export const kmsRAGSyncService = new KMSRAGSyncService();
export default kmsRAGSyncService;
