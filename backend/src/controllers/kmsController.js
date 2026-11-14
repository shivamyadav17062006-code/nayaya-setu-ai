/**
 * NyayaSaathi — Legal Knowledge Management System (KMS) Controller
 *
 * Exposes administrative endpoints for dashboard metrics, act & section management,
 * batch imports, review workflows, revisions, and audit trails.
 */

import { prisma } from '../lib/prisma.js';
import { legalIngestionService } from '../services/legalIngestionService.js';
import { legalWorkflowService, LegalWorkflowStatus } from '../services/legalWorkflowService.js';
import { kmsRAGSyncService } from '../services/kmsRAGSyncService.js';

/**
 * GET /api/kms/dashboard
 * Aggregates live system-wide metrics across all jurisdictions and statuses
 */
export async function getDashboardMetrics(req, res, next) {
  try {
    const totalActs = await prisma.legalAct.count();
    const totalSections = await prisma.legalSection.count();
    const totalChunks = await prisma.$queryRaw`
      SELECT count(*)::int as count FROM public.legal_chunks WHERE embedding IS NOT NULL;
    `;

    // Status Breakdown
    const actStatuses = await prisma.$queryRaw`
      SELECT COALESCE(verification_status, 'DRAFT') as status, count(*)::int as count
      FROM public.legal_acts
      GROUP BY verification_status;
    `;

    // Jurisdiction Breakdown
    const jurisdictionBreakdown = await prisma.$queryRaw`
      SELECT jurisdiction, count(*)::int as count
      FROM public.legal_acts
      GROUP BY jurisdiction;
    `;

    // Review Queue Count
    const reviewQueueActs = await prisma.legalAct.count({
      where: { verificationStatus: LegalWorkflowStatus.UNDER_REVIEW },
    });
    const reviewQueueSections = await prisma.legalSection.count({
      where: { verificationStatus: LegalWorkflowStatus.UNDER_REVIEW },
    });

    // Recent Audit Activity
    const recentAuditLogs = await prisma.$queryRaw`
      SELECT id, entity_type, entity_id, action, actor_email, review_notes, created_at
      FROM public.legal_audit_logs
      ORDER BY created_at DESC
      LIMIT 10;
    `;

    // Recent Import Batches
    const recentBatches = await prisma.$queryRaw`
      SELECT id, source_name, import_type, status, total_records, imported_records, rejected_records, created_at
      FROM public.legal_import_batches
      ORDER BY created_at DESC
      LIMIT 5;
    `;

    return res.json({
      success: true,
      data: {
        summary: {
          totalActs,
          totalSections,
          totalIndexedChunks: totalChunks[0]?.count || 0,
          pendingReviewQueue: reviewQueueActs + reviewQueueSections,
        },
        actStatuses: actStatuses.reduce((acc, curr) => {
          acc[curr.status] = curr.count;
          return acc;
        }, {}),
        jurisdictions: jurisdictionBreakdown,
        recentAuditLogs,
        recentBatches,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/kms/acts
 * Lists all acts with filters
 */
export async function listKMSActs(req, res, next) {
  try {
    const { status, jurisdiction, state, q, limit = 50, page = 1 } = req.query;
    const take = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = ((parseInt(page, 10) || 1) - 1) * take;

    const where = {};
    if (status && status !== 'ALL') {
      where.verificationStatus = status.toUpperCase();
    }
    if (jurisdiction && jurisdiction !== 'ALL') {
      where.jurisdiction = jurisdiction.toUpperCase();
    }
    if (state) {
      where.state = state.toUpperCase();
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { actNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [acts, totalCount] = await Promise.all([
      prisma.legalAct.findMany({
        where,
        include: {
          _count: { select: { sections: true } },
        },
        orderBy: [{ updatedAt: 'desc' }],
        take,
        skip,
      }),
      prisma.legalAct.count({ where }),
    ]);

    return res.json({
      success: true,
      totalCount,
      page: parseInt(page, 10) || 1,
      limit: take,
      data: acts,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/kms/acts
 * Creates a new Legal Act (Initial status: DRAFT)
 */
export async function createKMSAct(req, res, next) {
  try {
    const val = legalIngestionService.validateAct(req.body);
    if (!val.valid) {
      return res.status(400).json({ success: false, errors: val.errors });
    }

    const dup = await legalIngestionService.detectActDuplicates(req.body.title, req.body.actNumber, req.body.year);
    if (dup.isDuplicate) {
      return res.status(409).json({
        success: false,
        error: 'An Act with a matching title or act number already exists.',
        details: dup.details,
      });
    }

    const act = await prisma.legalAct.create({
      data: {
        title: req.body.title.trim(),
        actNumber: req.body.actNumber?.trim() || null,
        year: parseInt(req.body.year, 10),
        jurisdiction: req.body.jurisdiction.toUpperCase(),
        state: req.body.state ? req.body.state.trim().toUpperCase() : null,
        category: req.body.category || 'GENERAL',
        documentType: req.body.documentType || 'ACT',
        parentActId: req.body.parentActId || null,
        ministry: req.body.ministry?.trim() || null,
        sourceUrl: req.body.sourceUrl.trim(),
        description: req.body.description?.trim() || null,
        status: 'ACTIVE',
        verificationStatus: LegalWorkflowStatus.DRAFT,
        reviewNotes: 'Created manually in KMS',
      },
    });

    const actor = req.user || { email: 'admin@nyayasaathi.gov.in', role: 'ADMIN' };
    await legalWorkflowService.logAudit('ACT', act.id, 'CREATE', actor, null, act, 'Created Act in DRAFT mode');

    return res.status(201).json({
      success: true,
      message: 'Act created successfully in DRAFT mode.',
      data: act,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/kms/acts/:id
 * Updates an existing Legal Act
 */
export async function updateKMSAct(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.legalAct.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Act not found.' });
    }

    const actor = req.user || { email: 'admin@nyayasaathi.gov.in', role: 'ADMIN' };
    await legalWorkflowService.captureRevision('ACT', id, existing, actor.email);

    const updated = await prisma.legalAct.update({
      where: { id },
      data: {
        title: req.body.title ? req.body.title.trim() : existing.title,
        actNumber: req.body.actNumber !== undefined ? req.body.actNumber : existing.actNumber,
        year: req.body.year ? parseInt(req.body.year, 10) : existing.year,
        jurisdiction: req.body.jurisdiction ? req.body.jurisdiction.toUpperCase() : existing.jurisdiction,
        state: req.body.state !== undefined ? req.body.state : existing.state,
        category: req.body.category || existing.category,
        documentType: req.body.documentType || existing.documentType,
        parentActId: req.body.parentActId !== undefined ? req.body.parentActId : existing.parentActId,
        ministry: req.body.ministry !== undefined ? req.body.ministry : existing.ministry,
        sourceUrl: req.body.sourceUrl ? req.body.sourceUrl.trim() : existing.sourceUrl,
        description: req.body.description !== undefined ? req.body.description : existing.description,
        reviewNotes: req.body.review_notes || req.body.reviewNotes || existing.reviewNotes,
      },
    });

    // If published, resync chunks
    let ragSynced = false;
    if (updated.verificationStatus === 'PUBLISHED') {
      const resSync = await kmsRAGSyncService.syncActChunks(id);
      ragSynced = resSync.synced > 0;
    }

    await legalWorkflowService.logAudit('ACT', id, 'UPDATE', actor, existing, updated, 'Updated Act metadata');

    return res.json({
      success: true,
      message: 'Act updated successfully.',
      ragSynced,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/kms/acts/:id/sections
 * Lists sections for an Act
 */
export async function listActSections(req, res, next) {
  try {
    const { id } = req.params;
    const sections = await prisma.legalSection.findMany({
      where: { actId: id },
      orderBy: { sectionNumber: 'asc' },
    });
    return res.json({
      success: true,
      count: sections.length,
      data: sections,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/kms/acts/:id/sections
 * Creates a new section for an Act (DRAFT status)
 */
export async function createActSection(req, res, next) {
  try {
    const { id } = req.params;
    const val = legalIngestionService.validateSection(req.body);
    if (!val.valid) {
      return res.status(400).json({ success: false, errors: val.errors });
    }

    const act = await prisma.legalAct.findUnique({ where: { id } });
    if (!act) {
      return res.status(404).json({ success: false, error: 'Parent Act not found.' });
    }

    const section = await prisma.legalSection.create({
      data: {
        actId: id,
        sectionNumber: req.body.sectionNumber.trim(),
        title: req.body.title?.trim() || null,
        originalText: req.body.originalText.trim(),
        simplifiedText: req.body.simplifiedText?.trim() || null,
        verificationStatus: LegalWorkflowStatus.DRAFT,
      },
    });

    const actor = req.user || { email: 'admin@nyayasaathi.gov.in', role: 'ADMIN' };
    await legalWorkflowService.logAudit('SECTION', section.id, 'CREATE', actor, null, section, 'Created Section');

    return res.status(201).json({
      success: true,
      message: 'Section created in DRAFT mode.',
      data: section,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/kms/sections/:id
 * Updates an existing section
 */
export async function updateActSection(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.legalSection.findUnique({ where: { id }, include: { act: true } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Section not found.' });
    }

    const actor = req.user || { email: 'admin@nyayasaathi.gov.in', role: 'ADMIN' };
    await legalWorkflowService.captureRevision('SECTION', id, existing, actor.email);

    const updated = await prisma.legalSection.update({
      where: { id },
      data: {
        sectionNumber: req.body.sectionNumber ? req.body.sectionNumber.trim() : existing.sectionNumber,
        title: req.body.title !== undefined ? req.body.title : existing.title,
        originalText: req.body.originalText ? req.body.originalText.trim() : existing.originalText,
        simplifiedText: req.body.simplifiedText !== undefined ? req.body.simplifiedText : existing.simplifiedText,
      },
    });

    // If published, resync chunk
    let ragSynced = false;
    if (updated.verificationStatus === 'PUBLISHED') {
      ragSynced = await kmsRAGSyncService.syncSectionChunk(updated, existing.act);
    }

    await legalWorkflowService.logAudit('SECTION', id, 'UPDATE', actor, existing, updated, 'Updated Section content');

    return res.json({
      success: true,
      message: 'Section updated successfully.',
      ragSynced,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/kms/import
 * Ingests a structured JSON batch or parses raw legal text
 */
export async function importBatch(req, res, next) {
  try {
    const actor = req.user || { email: 'admin@nyayasaathi.gov.in', role: 'ADMIN' };
    let payload = req.body;

    // Check if raw text was submitted for automatic parsing
    if (payload.rawText && typeof payload.rawText === 'string') {
      const parsedSections = legalIngestionService.parseLegalText(payload.rawText);
      payload = {
        sourceName: payload.sourceName || 'Parsed Text Import',
        sourceUrl: payload.sourceUrl || 'https://www.indiacode.nic.in',
        importType: 'HTML_EXTRACT',
        documents: [
          {
            title: payload.title || 'Untitled Scraped Act',
            year: payload.year || new Date().getFullYear(),
            jurisdiction: payload.jurisdiction || 'CENTRAL',
            state: payload.state || null,
            sourceUrl: payload.sourceUrl || 'https://www.indiacode.nic.in',
            sections: parsedSections,
          },
        ],
      };
    }

    const result = await legalIngestionService.ingestBatch(payload, actor);
    return res.status(result.importedRecords > 0 ? 200 : 400).json({
      success: result.importedRecords > 0,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/kms/review-queue
 * Lists items awaiting review
 */
export async function getReviewQueue(req, res, next) {
  try {
    const [pendingActs, pendingSections] = await Promise.all([
      prisma.legalAct.findMany({
        where: {
          verificationStatus: { in: [LegalWorkflowStatus.UNDER_REVIEW, LegalWorkflowStatus.DRAFT] },
        },
        include: {
          _count: { select: { sections: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.legalSection.findMany({
        where: {
          verificationStatus: { in: [LegalWorkflowStatus.UNDER_REVIEW, LegalWorkflowStatus.DRAFT] },
        },
        include: {
          act: { select: { id: true, title: true, jurisdiction: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        totalPending: pendingActs.length + pendingSections.length,
        acts: pendingActs,
        sections: pendingSections,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/kms/review/:entityType/:id
 * Handles state transitions: SUBMIT_REVIEW, APPROVE_VERIFY, PUBLISH, REJECT, SUPERSEDE
 */
export async function handleReviewAction(req, res, next) {
  try {
    const { entityType, id } = req.params;
    const { action, notes } = req.body;
    const actor = req.user || { email: 'reviewer@nyayasaathi.gov.in', role: 'ADMIN' };

    const typeUpper = entityType.toUpperCase();
    if (typeUpper !== 'ACT' && typeUpper !== 'SECTION') {
      return res.status(400).json({ success: false, error: 'Entity type must be ACT or SECTION' });
    }

    let result = null;
    switch (action) {
      case 'SUBMIT_REVIEW':
        result = await legalWorkflowService.submitForReview(typeUpper, id, actor, notes);
        break;
      case 'APPROVE_VERIFY':
        result = await legalWorkflowService.approveVerify(typeUpper, id, actor, notes);
        break;
      case 'PUBLISH':
        result = await legalWorkflowService.publish(typeUpper, id, actor, notes);
        break;
      case 'REJECT':
        result = await legalWorkflowService.reject(typeUpper, id, actor, notes || 'Rejected by reviewer');
        break;
      case 'SUPERSEDE':
        result = await legalWorkflowService.supersede(typeUpper, id, actor, notes);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Invalid action '${action}'. Supported: SUBMIT_REVIEW, APPROVE_VERIFY, PUBLISH, REJECT, SUPERSEDE`,
        });
    }

    return res.json({
      success: true,
      message: `Action '${action}' applied successfully to ${typeUpper}.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/kms/revisions/:entityType/:id
 * Retrieves revision history for content diff and comparison
 */
export async function getRevisions(req, res, next) {
  try {
    const { entityType, id } = req.params;
    const revisions = await legalWorkflowService.getRevisions(entityType.toUpperCase(), id);
    return res.json({
      success: true,
      count: revisions.length,
      data: revisions,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/kms/audit-logs
 * Retrieves audit logs with pagination and entity filters
 */
export async function getAuditLogs(req, res, next) {
  try {
    const { entityType, action, limit = 50, page = 1 } = req.query;
    const take = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = ((parseInt(page, 10) || 1) - 1) * take;

    const logs = await prisma.$queryRaw`
      SELECT id, entity_type, entity_id, action, actor_email, actor_role, previous_state, new_state, review_notes, created_at
      FROM public.legal_audit_logs
      WHERE (${entityType || null}::text IS NULL OR entity_type = ${entityType || null})
        AND (${action || null}::text IS NULL OR action = ${action || null})
      ORDER BY created_at DESC
      LIMIT ${take} OFFSET ${skip};
    `;

    const totalCount = await prisma.$queryRaw`
      SELECT count(*)::int as count 
      FROM public.legal_audit_logs
      WHERE (${entityType || null}::text IS NULL OR entity_type = ${entityType || null})
        AND (${action || null}::text IS NULL OR action = ${action || null});
    `;

    return res.json({
      success: true,
      totalCount: totalCount[0]?.count || 0,
      page: parseInt(page, 10) || 1,
      limit: take,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
}
