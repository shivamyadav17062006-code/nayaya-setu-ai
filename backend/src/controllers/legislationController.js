import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma.js';

function getResolvedPath(relativeSubPath) {
  const candidates = [
    path.resolve(process.cwd(), relativeSubPath),
    path.resolve(process.cwd(), '..', relativeSubPath),
    path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..', relativeSubPath)
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
}

function loadSourceRegister() {
  const registerPath = getResolvedPath('data/legislation/central_source_register.json');
  if (fs.existsSync(registerPath)) {
    const raw = fs.readFileSync(registerPath, 'utf-8');
    return JSON.parse(raw);
  }
  return null;
}

function loadCorpusData() {
  const corpusPath = getResolvedPath('data/legislation/central_legislation_corpus.json');
  if (fs.existsSync(corpusPath)) {
    const raw = fs.readFileSync(corpusPath, 'utf-8');
    return JSON.parse(raw);
  }
  return null;
}

/**
 * Lists Central Acts with optional search, category, status, and pagination
 */
export async function listActs(req, res, next) {
  try {
    const { q, category, status, documentType = 'ACT', limit = 50, page = 1 } = req.query;
    const take = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = ((parseInt(page, 10) || 1) - 1) * take;

    const where = {
      jurisdiction: 'CENTRAL',
    };

    if (documentType && documentType !== 'ALL') {
      where.documentType = documentType;
    }

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (status) {
      where.status = { equals: status, mode: 'insensitive' };
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { actNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, acts] = await Promise.all([
      prisma.legalAct.count({ where }),
      prisma.legalAct.findMany({
        where,
        take,
        skip,
        orderBy: [{ year: 'desc' }, { title: 'asc' }],
        include: {
          _count: {
            select: {
              sections: true,
              subordinateLegislation: true,
            },
          },
          parentAct: {
            select: { id: true, title: true, actNumber: true },
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        page: parseInt(page, 10) || 1,
        limit: take,
        acts: acts.map((a) => ({
          id: a.id,
          title: a.title,
          actNumber: a.actNumber,
          year: a.year,
          jurisdiction: a.jurisdiction,
          documentType: a.documentType || 'ACT',
          category: a.category,
          ministry: a.ministry,
          enablingProvision: a.enablingProvision,
          parentAct: a.parentAct,
          status: a.status,
          verificationStatus: a.verificationStatus,
          effectiveFrom: a.effectiveFrom,
          sectionsCount: a._count.sections,
          subordinateCount: a._count.subordinateLegislation,
          sourceUrl: a.sourceUrl,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves details for a specific Act or Subordinate Regulation
 */
export async function getActById(req, res, next) {
  try {
    const { id } = req.params;

    const act = await prisma.legalAct.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { sectionNumber: 'asc' },
          include: {
            remedies: true,
            rights: {
              include: { rightCategory: true },
            },
          },
        },
        parentAct: {
          select: { id: true, title: true, actNumber: true, year: true, sourceUrl: true },
        },
        subordinateLegislation: {
          select: {
            id: true,
            title: true,
            documentType: true,
            enablingProvision: true,
            verificationStatus: true,
            sourceUrl: true,
          },
        },
      },
    });

    if (!act) {
      return res.status(404).json({
        success: false,
        error: 'Legislation document not found',
      });
    }

    res.status(200).json({
      success: true,
      data: act,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Lists Subordinate Rules, Regulations, and Notifications linked to parent Acts
 */
export async function listRules(req, res, next) {
  try {
    const { parentActId, category } = req.query;

    const where = {
      documentType: { in: ['RULES', 'REGULATIONS', 'NOTIFICATION', 'ORDER'] },
    };

    if (parentActId) {
      where.parentActId = parentActId;
    }

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    const rules = await prisma.legalAct.findMany({
      where,
      orderBy: [{ year: 'desc' }, { title: 'asc' }],
      include: {
        parentAct: {
          select: { id: true, title: true, actNumber: true },
        },
        _count: {
          select: { sections: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        count: rules.length,
        rules: rules.map((r) => ({
          id: r.id,
          title: r.title,
          documentType: r.documentType,
          year: r.year,
          category: r.category,
          ministry: r.ministry,
          enablingProvision: r.enablingProvision,
          parentAct: r.parentAct,
          verificationStatus: r.verificationStatus,
          sectionsCount: r._count.sections,
          sourceUrl: r.sourceUrl,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Returns the verified Source Register
 */
export async function getSourceRegister(_req, res, next) {
  try {
    const register = loadSourceRegister();
    if (!register) {
      return res.status(503).json({
        success: false,
        error: 'Central source register not loaded',
      });
    }

    res.status(200).json({
      success: true,
      data: register,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Lists records in the verification lifecycle queue
 */
export async function getVerificationQueue(req, res, next) {
  try {
    const { status = 'AWAITING_REVIEW' } = req.query;

    const where = {};
    if (status && status !== 'ALL') {
      where.verificationStatus = status;
    }

    const queue = await prisma.legalAct.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        parentAct: {
          select: { id: true, title: true },
        },
        _count: {
          select: { sections: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        count: queue.length,
        statusFilter: status,
        items: queue,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Updates verification lifecycle state (requires admin review)
 */
export async function updateVerificationStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    const validStatuses = [
      'IMPORTED',
      'EXTRACTION_COMPLETE',
      'AWAITING_REVIEW',
      'PENDING',
      'VERIFIED',
      'PUBLISHED',
      'SUPERSEDED',
      'REJECTED',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status: must be one of ${validStatuses.join(', ')}`,
      });
    }

    const updated = await prisma.legalAct.update({
      where: { id },
      data: {
        verificationStatus: status,
        lastVerifiedAt: new Date(),
        description: reviewNotes ? reviewNotes : undefined,
      },
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Returns coverage analytics and telemetry reports
 */
export async function getCoverageReport(_req, res, next) {
  try {
    const corpus = loadCorpusData();
    const [totalActs, totalRules, totalRegulations, totalNotifications, totalSections, totalChunks] = await Promise.all([
      prisma.legalAct.count({ where: { documentType: 'ACT' } }),
      prisma.legalAct.count({ where: { documentType: 'RULES' } }),
      prisma.legalAct.count({ where: { documentType: 'REGULATIONS' } }),
      prisma.legalAct.count({ where: { documentType: 'NOTIFICATION' } }),
      prisma.legalSection.count(),
      prisma.legalChunk.count(),
    ]);

    const verificationBreakdown = await prisma.legalAct.groupBy({
      by: ['verificationStatus'],
      _count: { id: true },
    });

    res.status(200).json({
      success: true,
      data: {
        corpusChecksum: corpus?.sha256 || null,
        counts: {
          acts: totalActs,
          rules: totalRules,
          regulations: totalRegulations,
          notifications: totalNotifications,
          totalDocuments: totalActs + totalRules + totalRegulations + totalNotifications,
          sections: totalSections,
          chunks: totalChunks,
        },
        verificationBreakdown: verificationBreakdown.map((vb) => ({
          status: vb.verificationStatus || 'UNSET',
          count: vb._count.id,
        })),
        auditDate: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}
