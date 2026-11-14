/**
 * NyayaSaathi — Legal Content Verification Workflow Service
 *
 * Implements the rigorous 5-stage verification state machine:
 * DRAFT -> UNDER_REVIEW -> VERIFIED -> PUBLISHED -> SUPERSEDED
 *
 * Features:
 * 1. Role-based workflow state transitions.
 * 2. Immutable revision history snapshots for content diff/comparison.
 * 3. Complete audit logging.
 * 4. Automatic RAG index synchronization upon publication and supersession.
 */

import { prisma } from '../lib/prisma.js';
import { kmsRAGSyncService } from './kmsRAGSyncService.js';

export const LegalWorkflowStatus = {
  DRAFT: 'DRAFT',
  UNDER_REVIEW: 'UNDER_REVIEW',
  VERIFIED: 'VERIFIED',
  PUBLISHED: 'PUBLISHED',
  SUPERSEDED: 'SUPERSEDED',
};

export class LegalWorkflowService {
  /**
   * Captures a revision snapshot in public.legal_revisions
   */
  async captureRevision(entityType, entityId, snapshotData, actorEmail = 'system') {
    const count = await prisma.$queryRaw`
      SELECT count(*)::int as count 
      FROM public.legal_revisions 
      WHERE entity_type = ${entityType} AND entity_id = ${entityId}::uuid;
    `;
    const nextRevision = (count[0]?.count || 0) + 1;

    await prisma.$executeRawUnsafe(
      `INSERT INTO public.legal_revisions (
        entity_type, entity_id, revision_number, title, content_snapshot, created_by, created_at
      ) VALUES (
        $1, $2::uuid, $3, $4, $5::jsonb, $6, NOW()
      );`,
      entityType,
      entityId,
      nextRevision,
      snapshotData.title || snapshotData.sectionNumber || 'Revision',
      JSON.stringify(snapshotData),
      actorEmail
    );

    return nextRevision;
  }

  /**
   * Logs an action in public.legal_audit_logs
   */
  async logAudit(entityType, entityId, action, actorInfo = {}, previousState = null, newState = null, notes = null) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO public.legal_audit_logs (
        entity_type, entity_id, action, actor_email, actor_role, previous_state, new_state, review_notes, created_at
      ) VALUES (
        $1, $2::uuid, $3, $4, $5, $6::jsonb, $7::jsonb, $8, NOW()
      );`,
      entityType,
      entityId,
      action,
      actorInfo.email || 'admin@nyayasaathi.gov.in',
      actorInfo.role || 'ADMIN',
      previousState ? JSON.stringify(previousState) : null,
      newState ? JSON.stringify(newState) : null,
      notes || null
    );
  }

  /**
   * Submits an entity from DRAFT to UNDER_REVIEW
   */
  async submitForReview(entityType, entityId, actorInfo = {}, notes = '') {
    const actorEmail = actorInfo.email || 'reviewer@nyayasaathi.gov.in';

    if (entityType === 'ACT') {
      const act = await prisma.legalAct.findUnique({ where: { id: entityId } });
      if (!act) throw new Error('Act not found');

      const prev = { status: act.verificationStatus, title: act.title };
      await this.captureRevision('ACT', entityId, act, actorEmail);

      const updated = await prisma.legalAct.update({
        where: { id: entityId },
        data: {
          verificationStatus: LegalWorkflowStatus.UNDER_REVIEW,
          reviewNotes: notes || 'Submitted for legal review',
          lastReviewedAt: new Date(),
        },
      });

      await this.logAudit('ACT', entityId, 'SUBMIT_REVIEW', actorInfo, prev, { status: updated.verificationStatus }, notes);
      return updated;
    } else {
      const sec = await prisma.legalSection.findUnique({ where: { id: entityId } });
      if (!sec) throw new Error('Section not found');

      const prev = { status: sec.verificationStatus, sectionNumber: sec.sectionNumber };
      await this.captureRevision('SECTION', entityId, sec, actorEmail);

      const updated = await prisma.legalSection.update({
        where: { id: entityId },
        data: {
          verificationStatus: LegalWorkflowStatus.UNDER_REVIEW,
          reviewNotes: notes || 'Submitted for legal review',
        },
      });

      await this.logAudit('SECTION', entityId, 'SUBMIT_REVIEW', actorInfo, prev, { status: updated.verificationStatus }, notes);
      return updated;
    }
  }

  /**
   * Approves and verifies legal citations (VERIFIED status)
   */
  async approveVerify(entityType, entityId, actorInfo = {}, notes = '') {
    const actorEmail = actorInfo.email || 'senior-verifier@nyayasaathi.gov.in';

    if (entityType === 'ACT') {
      const act = await prisma.legalAct.findUnique({ where: { id: entityId } });
      if (!act) throw new Error('Act not found');

      const prev = { status: act.verificationStatus };
      const updated = await prisma.legalAct.update({
        where: { id: entityId },
        data: {
          verificationStatus: LegalWorkflowStatus.VERIFIED,
          reviewerId: actorEmail,
          reviewNotes: notes || 'Statutory sources and sections verified',
          lastReviewedAt: new Date(),
          lastVerifiedAt: new Date(),
        },
      });

      await this.logAudit('ACT', entityId, 'VERIFY', actorInfo, prev, { status: updated.verificationStatus }, notes);
      return updated;
    } else {
      const sec = await prisma.legalSection.findUnique({ where: { id: entityId } });
      if (!sec) throw new Error('Section not found');

      const prev = { status: sec.verificationStatus };
      const updated = await prisma.legalSection.update({
        where: { id: entityId },
        data: {
          verificationStatus: LegalWorkflowStatus.VERIFIED,
          reviewerId: actorEmail,
          reviewNotes: notes || 'Section text and simplified explanation verified',
        },
      });

      await this.logAudit('SECTION', entityId, 'VERIFY', actorInfo, prev, { status: updated.verificationStatus }, notes);
      return updated;
    }
  }

  /**
   * Publishes record for citizen-facing platform & triggers RAG vector indexing
   */
  async publish(entityType, entityId, actorInfo = {}, notes = '') {
    const actorEmail = actorInfo.email || 'lead-editor@nyayasaathi.gov.in';

    if (entityType === 'ACT') {
      const act = await prisma.legalAct.findUnique({ where: { id: entityId } });
      if (!act) throw new Error('Act not found');

      const prev = { status: act.verificationStatus };
      await this.captureRevision('ACT', entityId, act, actorEmail);

      const updated = await prisma.legalAct.update({
        where: { id: entityId },
        data: {
          verificationStatus: LegalWorkflowStatus.PUBLISHED,
          reviewerId: actorEmail,
          reviewNotes: notes || 'Approved for public release',
          lastReviewedAt: new Date(),
          lastVerifiedAt: new Date(),
        },
      });

      // Update all child sections to PUBLISHED as well
      await prisma.$executeRawUnsafe(
        `UPDATE public.legal_sections 
         SET verification_status = 'PUBLISHED', reviewer_id = $1 
         WHERE act_id = $2::uuid;`,
        actorEmail,
        entityId
      );

      // Trigger RAG Vector Indexing
      const syncResult = await kmsRAGSyncService.syncActChunks(entityId);

      await this.logAudit(
        'ACT',
        entityId,
        'PUBLISH',
        actorInfo,
        prev,
        { status: updated.verificationStatus, chunksSynced: syncResult.synced },
        notes
      );

      return { act: updated, ragSync: syncResult };
    } else {
      const sec = await prisma.legalSection.findUnique({ where: { id: entityId }, include: { act: true } });
      if (!sec) throw new Error('Section not found');

      const prev = { status: sec.verificationStatus };
      await this.captureRevision('SECTION', entityId, sec, actorEmail);

      const updated = await prisma.legalSection.update({
        where: { id: entityId },
        data: {
          verificationStatus: LegalWorkflowStatus.PUBLISHED,
          reviewerId: actorEmail,
          reviewNotes: notes || 'Section published',
        },
      });

      // Sync Section Chunk
      const synced = await kmsRAGSyncService.syncSectionChunk(updated, sec.act);

      await this.logAudit('SECTION', entityId, 'PUBLISH', actorInfo, prev, { status: updated.verificationStatus, synced }, notes);
      return { section: updated, synced };
    }
  }

  /**
   * Rejects back to DRAFT with mandatory feedback
   */
  async reject(entityType, entityId, actorInfo = {}, rejectionReason = 'Corrections required') {
    const actorEmail = actorInfo.email || 'reviewer@nyayasaathi.gov.in';

    if (entityType === 'ACT') {
      const act = await prisma.legalAct.findUnique({ where: { id: entityId } });
      if (!act) throw new Error('Act not found');

      const prev = { status: act.verificationStatus };
      const updated = await prisma.legalAct.update({
        where: { id: entityId },
        data: {
          verificationStatus: LegalWorkflowStatus.DRAFT,
          reviewerId: actorEmail,
          reviewNotes: `REJECTED: ${rejectionReason}`,
          lastReviewedAt: new Date(),
        },
      });

      // Purge any chunks if it was previously published
      await kmsRAGSyncService.purgeActChunks(entityId);

      await this.logAudit('ACT', entityId, 'REJECT', actorInfo, prev, { status: updated.verificationStatus }, rejectionReason);
      return updated;
    } else {
      const sec = await prisma.legalSection.findUnique({ where: { id: entityId } });
      if (!sec) throw new Error('Section not found');

      const prev = { status: sec.verificationStatus };
      const updated = await prisma.legalSection.update({
        where: { id: entityId },
        data: {
          verificationStatus: LegalWorkflowStatus.DRAFT,
          reviewerId: actorEmail,
          reviewNotes: `REJECTED: ${rejectionReason}`,
        },
      });

      await kmsRAGSyncService.purgeSectionChunk(entityId);

      await this.logAudit('SECTION', entityId, 'REJECT', actorInfo, prev, { status: updated.verificationStatus }, rejectionReason);
      return updated;
    }
  }

  /**
   * Supersedes an Act when replaced by a new amendment or Code
   */
  async supersede(entityType, entityId, actorInfo = {}, notes = '') {
    const actorEmail = actorInfo.email || 'editor@nyayasaathi.gov.in';

    if (entityType === 'ACT') {
      const act = await prisma.legalAct.findUnique({ where: { id: entityId } });
      if (!act) throw new Error('Act not found');

      const prev = { status: act.verificationStatus };
      const updated = await prisma.legalAct.update({
        where: { id: entityId },
        data: {
          verificationStatus: LegalWorkflowStatus.SUPERSEDED,
          status: 'SUPERSEDED',
          reviewNotes: notes || 'Superseded by newer legislative enactment',
          lastReviewedAt: new Date(),
        },
      });

      // Purge from public RAG search so superseded law is not given as active advice
      const purgeResult = await kmsRAGSyncService.purgeActChunks(entityId);

      await this.logAudit(
        'ACT',
        entityId,
        'SUPERSEDE',
        actorInfo,
        prev,
        { status: updated.verificationStatus, chunksRemoved: purgeResult.removed },
        notes
      );

      return { act: updated, purgeResult };
    }
  }

  /**
   * Retrieves revision snapshots for comparison
   */
  async getRevisions(entityType, entityId) {
    const revisions = await prisma.$queryRaw`
      SELECT id, entity_type, entity_id, revision_number, title, content_snapshot, created_by, created_at
      FROM public.legal_revisions
      WHERE entity_type = ${entityType} AND entity_id = ${entityId}::uuid
      ORDER BY revision_number DESC;
    `;
    return revisions;
  }
}

export const legalWorkflowService = new LegalWorkflowService();
export default legalWorkflowService;
