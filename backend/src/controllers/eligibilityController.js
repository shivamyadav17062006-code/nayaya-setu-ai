import { legalAidEligibilityService } from '../services/legalAidEligibilityService.js';
import { prisma, isPrismaConfigured } from '../lib/prisma.js';

function buildSchemes(request, evaluation) {
  const schemes = [];
  const state = request.state || 'Your State';

  if (evaluation.status === 'POTENTIALLY_ELIGIBLE') {
    schemes.push({
      id: 'nalsa-free-legal-aid',
      name: 'NALSA Free Legal Services & Panel Advocate Scheme',
      authority: 'National Legal Services Authority (NALSA)',
      description:
        'Free court representation, legal drafting, and process fee exemption across District Courts, High Courts, and Supreme Court.',
      benefits: [
        'Free legal representation by an empanelled court advocate',
        'Exemption from court fees, process fees, and drafting charges',
        'Free certified copies of orders and judgments',
        'Assistance at all trial, appellate, and revisional stages',
      ],
      eligibilityCriteria: [
        evaluation.statutoryClause || 'Eligible under Section 12 of Legal Services Authorities Act, 1987',
      ],
      applicationProcess:
        'Visit your District Legal Services Authority (DLSA) front office, call National Legal Helpline 15100, or apply online on the NALSA Legal Services Portal.',
      officialUrl: 'https://nalsa.gov.in',
      contactInfo: 'National Legal Helpline: 15100 (Toll-Free, 24x7)',
    });

    schemes.push({
      id: 'slsa-state-aid',
      name: `${state} State Legal Services Authority (SLSA)`,
      authority: `${state} SLSA`,
      description: `State-level free legal representation, Lok Adalats, and pre-litigation mediation across ${state}.`,
      benefits: [
        'Free counsel appointment for district civil, criminal, and family courts',
        'Pre-litigation conciliation and Lok Adalat settlements',
        'Victim compensation scheme assistance',
      ],
      eligibilityCriteria: [
        'Resident of state with income within prescribed state threshold or belonging to Section 12 protected classes',
      ],
      applicationProcess: `Apply through the front office of your local DLSA or write to the Member Secretary, ${state} SLSA.`,
      officialUrl: 'https://nalsa.gov.in/slsa',
      contactInfo: 'Contact local DLSA or call 15100',
    });
  }

  const category = (request.category || request.beneficiaryType || '').toUpperCase();

  if (category === 'LABOUR' || category === 'WORKER' || category === 'INDUSTRIAL_WORKMAN') {
    schemes.push({
      id: 'labour-payment-of-wages',
      name: 'Payment of Wages Authority / Labour Tribunal Legal Aid',
      authority: 'Office of the Labour Commissioner & DLSA',
      description:
        'Expedited dispute recovery for unpaid salaries, unlawful deductions, and industrial retrenchment under the Payment of Wages Act, 1936.',
      benefits: [
        'Zero court fees for wage claims',
        'Statutory compensation penalty up to 10× on defaulting employers',
        'Conciliation meetings conducted by Labour Officers free of charge',
      ],
      eligibilityCriteria: ['Industrial workmen and contract employees with unpaid wages'],
      applicationProcess: 'File an application before the Labour Commissioner or Section 15 Authority within 12 months.',
      officialUrl: 'https://shramsuvidha.gov.in',
      contactInfo: 'Ministry of Labour Helpline: 14434',
    });
  }

  if (category === 'WOMAN' || category === 'WOMEN' || request.gender === 'female') {
    schemes.push({
      id: 'sakhi-one-stop-centre',
      name: 'One Stop Centre (Sakhi) & Domestic Violence Legal Aid',
      authority: 'Ministry of Women and Child Development & NALSA',
      description:
        'Integrated medical, police, shelter, and legal assistance under the Protection of Women from Domestic Violence Act, 2005.',
      benefits: [
        'Free Protection Officer DIR preparation',
        'Immediate police dispatch & emergency shelter',
        'Free DLSA legal aid advocate for Magistrate court proceedings',
      ],
      eligibilityCriteria: ['Any woman or girl facing domestic, physical, or workplace violence'],
      applicationProcess: 'Dial Women Helpline 181 or visit the district Sakhi One Stop Centre.',
      officialUrl: 'https://wcd.nic.in',
      contactInfo: 'Women Helpline: 181 | National Emergency: 112',
    });
  }

  if (category === 'CHILD' || (request.age !== undefined && request.age !== null && Number(request.age) < 18)) {
    schemes.push({
      id: 'childline-1098',
      name: 'CHILDLINE 1098 & Juvenile Justice Legal Aid',
      authority: 'Child Welfare Committee (CWC) & DLSA',
      description:
        '24/7 emergency protection, care, shelter, and free legal representation for children under the JJ Act and POCSO Act.',
      benefits: [
        'Immediate protection and rescue',
        'Support person & legal aid counsel before Juvenile Justice Board / CWC',
        'Free education restoration under the Right to Education Act',
      ],
      eligibilityCriteria: ['Any child under 18 years of age in need of care, protection, or legal defense'],
      applicationProcess: 'Dial CHILDLINE 1098 anytime.',
      officialUrl: 'https://childlineindia.org',
      contactInfo: 'CHILDLINE: 1098 (Toll-Free, 24/7)',
    });
  }

  return schemes;
}

// ---------------------------------------------------------------------------
// POST /api/eligibility — Main Legal Aid Evaluation Endpoint
// ---------------------------------------------------------------------------
export async function checkEligibility(req, res, next) {
  try {
    const body = req.body || {};
    const userId = req.user?.id || null;
    const sessionId = req.headers['x-session-id'] || body.sessionId || null;

    // Harmonize legacy parameter names (income -> annualIncome, beneficiaryType -> category)
    const annualIncome =
      body.annualIncome !== undefined && body.annualIncome !== null
        ? Number(body.annualIncome)
        : body.income !== undefined && body.income !== null
        ? Number(body.income)
        : null;

    const category = body.category && body.category !== 'GENERAL' ? body.category : body.beneficiaryType || 'GENERAL';

    const evaluation = await legalAidEligibilityService.evaluateEligibility({
      category,
      state: body.state || 'Delhi',
      courtLevel: body.courtLevel || 'SUBORDINATE_COURT',
      annualIncome,
      circumstances: body.circumstances || (body.situation ? [body.situation] : []),
      age: body.age !== undefined && body.age !== null ? Number(body.age) : null,
      gender: body.gender || '',
      userConsent: Boolean(body.userConsent),
      userId,
      sessionId,
    });

    const schemes = buildSchemes(body, evaluation);

    // Find nearby official legal aid providers
    let recommendedProviders = [];
    if (isPrismaConfigured && body.state) {
      try {
        recommendedProviders = await prisma.legalAidProvider.findMany({
          where: {
            state: { equals: body.state.trim(), mode: 'insensitive' },
            isActive: true,
          },
          take: 3,
          orderBy: { verified: 'desc' },
        });
      } catch (e) {
        console.warn('Could not query recommended providers:', e.message);
      }
    }

    const responsePayload = {
      status: evaluation.status,
      eligible: evaluation.status === 'POTENTIALLY_ELIGIBLE',
      isStatutoryExempt: evaluation.isStatutoryExempt,
      statutoryClause: evaluation.statutoryClause,
      explanation: evaluation.explanation,
      reason: evaluation.explanation, // for backward compatibility with frontend consumers
      criteriaBreakdown: evaluation.criteriaBreakdown,
      schemes,
      recommendedProviders,
      disclaimer: evaluation.disclaimer,
      helpline: evaluation.helpline || '15100',
      referralLink: 'https://nalsa.gov.in',
    };

    res.status(200).json({
      success: true,
      data: responsePayload,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/eligibility/income-limits — List state statutory income thresholds
// ---------------------------------------------------------------------------
export async function getIncomeLimits(req, res, next) {
  try {
    const { state } = req.query;

    if (isPrismaConfigured) {
      const where = {};
      if (state) where.state = { equals: state.trim(), mode: 'insensitive' };

      const limits = await prisma.legalAidIncomeLimit.findMany({
        where,
        orderBy: [{ state: 'asc' }, { courtLevel: 'asc' }],
      });

      return res.status(200).json({
        success: true,
        count: limits.length,
        data: limits,
      });
    }

    res.status(200).json({
      success: true,
      count: 0,
      data: [],
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/eligibility/assessments — Get user's saved assessments
// ---------------------------------------------------------------------------
export async function getSavedAssessments(req, res, next) {
  try {
    const userId = req.user?.id || null;
    const sessionId = req.headers['x-session-id'] || req.query.sessionId || null;

    if (!userId && !sessionId) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No user token or session provided.',
      });
    }

    if (isPrismaConfigured) {
      const assessments = await prisma.legalAidAssessment.findMany({
        where: {
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(sessionId ? [{ sessionId }] : []),
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        success: true,
        data: assessments,
      });
    }

    res.status(200).json({
      success: true,
      data: [],
    });
  } catch (err) {
    next(err);
  }
}
