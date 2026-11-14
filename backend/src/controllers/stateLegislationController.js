/**
 * NyayaSaathi — State Legislation and Jurisdiction Controller
 *
 * Exposes endpoints for inspecting all 28 States and 8 Union Territories,
 * State Acts, State Subordinate Rules, and the live Coverage Tracker.
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

function loadRegistryData() {
  const p = getResolvedPath('data/jurisdiction/state_ut_registry.json');
  if (fs.existsSync(p)) {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  }
  return null;
}

function loadCoverageTrackerData() {
  const p = getResolvedPath('data/jurisdiction/coverage_tracker.json');
  if (fs.existsSync(p)) {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  }
  return null;
}

/**
 * Normalizes state code or name to canonical state name
 */
function normalizeStateIdentifier(input = '') {
  const trimmed = input.trim().toUpperCase();
  const map = {
    'MH': 'MAHARASHTRA',
    'MAHARASHTRA': 'MAHARASHTRA',
    'DL': 'DELHI',
    'DELHI': 'DELHI',
    'KA': 'KARNATAKA',
    'KARNATAKA': 'KARNATAKA',
    'TN': 'TAMIL NADU',
    'TAMIL NADU': 'TAMIL NADU',
    'UP': 'UTTAR PRADESH',
    'UTTAR PRADESH': 'UTTAR PRADESH',
    'WB': 'WEST BENGAL',
    'WEST BENGAL': 'WEST BENGAL',
    'GJ': 'GUJARAT',
    'GUJARAT': 'GUJARAT',
    'RJ': 'RAJASTHAN',
    'RAJASTHAN': 'RAJASTHAN',
    'KL': 'KERALA',
    'KERALA': 'KERALA',
    'AP': 'ANDHRA PRADESH',
    'ANDHRA PRADESH': 'ANDHRA PRADESH',
    'TS': 'TELANGANA',
    'TELANGANA': 'TELANGANA',
  };
  return map[trimmed] || trimmed;
}

/**
 * GET /api/states
 * Lists all 36 jurisdictions (28 States, 8 UTs) with coverage pills and filters
 */
export async function listStates(req, res, next) {
  try {
    const { type, coverage, q } = req.query;
    const tracker = loadCoverageTrackerData();
    const registry = loadRegistryData();

    if (!tracker || !registry) {
      return res.status(503).json({
        success: false,
        error: 'Jurisdiction registry not initialized. Run buildStateRegistry.js first.',
      });
    }

    let jurisdictions = tracker.jurisdictions || [];

    // Filter by type: STATE | UT_WITH_ASSEMBLY | UT_WITHOUT_ASSEMBLY | UT
    if (type) {
      const targetType = type.toUpperCase();
      if (targetType === 'UT') {
        jurisdictions = jurisdictions.filter((j) => j.type.startsWith('UT'));
      } else {
        jurisdictions = jurisdictions.filter((j) => j.type === targetType);
      }
    }

    // Filter by coverage status: VERIFIED_INGESTED | CATALOGUED_PENDING_INGESTION
    if (coverage) {
      const targetCoverage = coverage.toUpperCase();
      jurisdictions = jurisdictions.filter((j) => j.coverageStatus === targetCoverage);
    }

    // Text search on name or code
    if (q) {
      const term = q.toLowerCase();
      jurisdictions = jurisdictions.filter(
        (j) =>
          j.name.toLowerCase().includes(term) ||
          j.code.toLowerCase().includes(term) ||
          (j.keyStatutoryDomains || []).some((d) => d.toLowerCase().includes(term))
      );
    }

    return res.json({
      success: true,
      totalCount: tracker.auditSummary.totalJurisdictions,
      filteredCount: jurisdictions.length,
      auditSummary: tracker.auditSummary,
      data: jurisdictions,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/states/:stateCode
 * Retrieves full details for a State or UT including official portals and SLSA threshold
 */
export async function getStateByCode(req, res, next) {
  try {
    const { stateCode } = req.params;
    const registry = loadRegistryData();
    const tracker = loadCoverageTrackerData();

    if (!registry) {
      return res.status(503).json({
        success: false,
        error: 'Jurisdiction registry not available.',
      });
    }

    const codeUpper = stateCode.trim().toUpperCase();
    const stateRecord = registry.jurisdictions.find(
      (j) => j.code === codeUpper || j.name.toUpperCase() === codeUpper
    );

    if (!stateRecord) {
      return res.status(404).json({
        success: false,
        error: `Jurisdiction '${stateCode}' not found. Supported codes: ${registry.jurisdictions.map((j) => j.code).join(', ')}`,
      });
    }

    // Find tracker details
    const trackerItem = tracker?.jurisdictions?.find((j) => j.code === stateRecord.code);

    // Get count of acts in DB
    const canonicalState = normalizeStateIdentifier(stateRecord.code);
    let dbActsCount = 0;
    try {
      dbActsCount = await prisma.legalAct.count({
        where: {
          jurisdiction: 'STATE',
          state: canonicalState,
        },
      });
    } catch {
      dbActsCount = trackerItem?.ingestedDocumentsCount || 0;
    }

    return res.json({
      success: true,
      data: {
        ...stateRecord,
        coverageStatus: trackerItem?.coverageStatus || 'CATALOGUED_PENDING_INGESTION',
        ingestedDocumentsInDB: dbActsCount,
        trackerDetails: trackerItem || null,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/states/:stateCode/acts
 * Lists all active Acts, rules, and sections for a specific State
 */
export async function getStateActs(req, res, next) {
  try {
    const { stateCode } = req.params;
    const { documentType } = req.query;
    const canonicalState = normalizeStateIdentifier(stateCode);

    const where = {
      jurisdiction: 'STATE',
      state: canonicalState,
    };

    if (documentType && documentType !== 'ALL') {
      where.documentType = documentType.toUpperCase();
    }

    let acts = [];
    try {
      acts = await prisma.legalAct.findMany({
        where,
        include: {
          sections: {
            select: {
              id: true,
              sectionNumber: true,
              title: true,
              simplifiedText: true,
              originalText: true,
            },
            orderBy: { sectionNumber: 'asc' },
          },
          parentAct: {
            select: { id: true, title: true, year: true },
          },
        },
        orderBy: [{ documentType: 'asc' }, { year: 'desc' }],
      });
    } catch (dbErr) {
      console.warn('Prisma getStateActs error, falling back to corpus:', dbErr.message);
      // Fallback to local corpus JSON
      const corpusPath = getResolvedPath('data/jurisdiction/state_legislation_corpus.json');
      if (fs.existsSync(corpusPath)) {
        const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'));
        acts = corpus.documents.filter((d) => d.state === canonicalState);
      }
    }

    return res.json({
      success: true,
      state: canonicalState,
      totalActs: acts.length,
      data: acts,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/states/coverage/tracker
 * Returns the full honest coverage tracker audit report
 */
export async function getCoverageTracker(req, res, next) {
  try {
    const tracker = loadCoverageTrackerData();
    if (!tracker) {
      return res.status(503).json({
        success: false,
        error: 'Coverage tracker data not found. Run buildCoverageTracker.js first.',
      });
    }

    return res.json({
      success: true,
      data: tracker,
    });
  } catch (err) {
    next(err);
  }
}
