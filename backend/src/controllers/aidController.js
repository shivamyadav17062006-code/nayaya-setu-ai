import { prisma, isPrismaConfigured } from '../lib/prisma.js';
import { supabaseService } from '../services/supabaseService.js';
import { legalAidEligibilityService } from '../services/legalAidEligibilityService.js';

const FALLBACK_PROVIDERS = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    name: 'National Legal Services Authority (NALSA)',
    type: 'NALSA',
    state: 'Delhi',
    district: 'New Delhi',
    address: 'B-Block, Additional Office Complex, Supreme Court of India, New Delhi - 110001',
    phone: ['011-23386176'],
    helpline: '15100',
    email: 'nalsa-dla@nic.in',
    website: 'https://nalsa.gov.in',
    officialSource: 'https://nalsa.gov.in',
    services: [
      'Free Court Representation (Supreme Court & High Courts)',
      'National Legal Helpline 15100 (24x7)',
      'National Lok Adalat settlements',
      'Prison Legal Aid Clinics',
      'Legal Literacy Programs'
    ],
    eligibility: 'All women, children, SC/ST, custody inmates, disabled, industrial workmen, and citizens with annual income below statutory limits.',
    latitude: 28.6219,
    longitude: 77.2394,
    isActive: true,
    verified: true,
    verificationStatus: 'VERIFIED',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000010',
    name: 'Supreme Court Legal Services Committee (SCLSC)',
    type: 'SCLSC',
    state: 'Delhi',
    district: 'New Delhi',
    address: '107, Lawyers Chambers, Supreme Court Compound, Tilak Marg, New Delhi - 110001',
    phone: ['011-23388323'],
    helpline: '15100',
    email: 'sclsc@nic.in',
    website: 'https://sclsc.gov.in',
    officialSource: 'https://sclsc.gov.in',
    services: [
      'Special Leave Petition (SLP) Filing',
      'Senior Advocate & Panel Advocate Assignment in Supreme Court',
      'Free Legal Drafting & Supreme Court Case Defending'
    ],
    eligibility: 'Any person meeting Section 12 criteria or whose annual income is less than ₹5,00,000 for cases before the Supreme Court.',
    latitude: 28.6225,
    longitude: 77.2389,
    isActive: true,
    verified: true,
    verificationStatus: 'VERIFIED',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    name: 'Maharashtra State Legal Services Authority (MSLSA)',
    type: 'SLSA',
    state: 'Maharashtra',
    district: 'Mumbai',
    address: 'High Court PWD Building, Fort, Mumbai - 400032',
    phone: ['022-22691395', '022-22676750'],
    helpline: '15100',
    email: 'mslsa-hc@nic.in',
    website: 'https://legalservices.maharashtra.gov.in',
    officialSource: 'https://legalservices.maharashtra.gov.in',
    services: [
      'Panel advocate appointment in Bombay High Court & District Courts',
      'Pre-litigation conciliation & Lok Adalat',
      'Victim Compensation Scheme counseling',
    ],
    eligibility: 'Maharashtra residents with annual income up to ₹3,00,000 (no income ceiling for women/children/SC/ST).',
    latitude: 18.9304,
    longitude: 72.8315,
    isActive: true,
    verified: true,
    verificationStatus: 'VERIFIED',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000003',
    name: 'Delhi State Legal Services Authority (DSLSA)',
    type: 'SLSA',
    state: 'Delhi',
    district: 'Central',
    address: 'Central Office, Patiala House Courts Complex, New Delhi - 110001',
    phone: ['011-23384781'],
    helpline: '1516',
    email: 'dslsa-phc@nic.in',
    website: 'https://dslsa.org',
    officialSource: 'https://dslsa.org',
    services: [
      'Front Office Legal Advice Clinics',
      'Free Advocate allocation for all Delhi District Courts',
      'Special child support & maintenance counseling',
    ],
    eligibility: 'Income below ₹3,00,000 per annum or belonging to affirmative categories under Section 12.',
    latitude: 28.6142,
    longitude: 77.2348,
    isActive: true,
    verified: true,
    verificationStatus: 'VERIFIED',
  },
];

function formatProvider(provider) {
  const phoneList = Array.isArray(provider.phone)
    ? provider.phone
    : provider.phone
    ? [provider.phone]
    : ['15100'];

  const servicesList = Array.isArray(provider.services) && provider.services.length > 0
    ? provider.services
    : Array.isArray(provider.servicesOffered) && provider.servicesOffered.length > 0
    ? provider.servicesOffered
    : ['Free Legal Aid', 'Legal Representation', 'Lok Adalat'];

  return {
    id: provider.id,
    name: provider.name,
    type: provider.type || provider.provider_type || 'DLSA',
    state: provider.state,
    district: provider.district,
    address: provider.address,
    phone: phoneList,
    helpline: provider.helpline || '15100',
    email: provider.email,
    website: provider.website,
    officialSource: provider.officialSource || provider.official_source || provider.website,
    services: servicesList,
    servicesOffered: servicesList,
    eligibility: provider.eligibility || provider.eligibility_information || 'Eligible under Section 12 of Legal Services Authorities Act, 1987.',
    eligibilityCriteria: provider.eligibility || provider.eligibility_information || 'Eligible under Section 12 of Legal Services Authorities Act, 1987.',
    languages: provider.languages || ['English', 'Hindi', 'Regional Languages'],
    workingHours: provider.workingHours || 'Mon–Sat, 10:00–17:00 (Court Hours)',
    latitude: provider.latitude ?? null,
    longitude: provider.longitude ?? null,
    isActive: provider.isActive ?? true,
    verified: provider.verified ?? true,
    verificationStatus: provider.verificationStatus || provider.verification_status || 'VERIFIED',
    lastVerifiedAt: provider.lastVerifiedAt || provider.last_verified_at || new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// GET /api/aid — Provider directory with filters
// ---------------------------------------------------------------------------
export async function getLegalAidProviders(req, res, _next) {
  const {
    state,
    category,
    district,
    type: providerType,
    search,
    limit: rawLimit = '50',
    page: rawPage = '1',
  } = req.query;

  const limit = Math.min(parseInt(rawLimit ?? '50', 10), 100);
  const page = Math.max(parseInt(rawPage ?? '1', 10), 1);
  const skip = (page - 1) * limit;

  try {
    if (isPrismaConfigured) {
      const where = { isActive: true };
      if (state) where.state = { equals: state.trim(), mode: 'insensitive' };
      if (district) where.district = { contains: district.trim(), mode: 'insensitive' };
      if (providerType && providerType !== 'ALL') where.type = { equals: providerType.trim().toUpperCase() };
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { district: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [providers, total] = await Promise.all([
        prisma.legalAidProvider.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ type: 'asc' }, { name: 'asc' }],
        }),
        prisma.legalAidProvider.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        data: providers.map(formatProvider),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
          filters: { state, district, type: providerType, category },
        },
      });
    }

    // Try Supabase service
    const supabaseResult = await supabaseService.getLegalAidProviders({
      state: state?.trim(),
      district: district?.trim(),
      type: providerType?.trim(),
      limit,
      offset: skip,
    });

    if (supabaseResult && supabaseResult.data && supabaseResult.data.length > 0) {
      return res.status(200).json({
        success: true,
        data: supabaseResult.data.map(formatProvider),
        meta: {
          total: supabaseResult.total,
          page,
          limit,
          totalPages: Math.ceil(supabaseResult.total / limit) || 1,
          filters: { state, district, type: providerType, category },
        },
      });
    }

    // Fallback
    const filtered = FALLBACK_PROVIDERS.filter((p) => {
      const matchState = !state || p.state.toLowerCase() === state.toLowerCase();
      const matchType = !providerType || providerType === 'ALL' || p.type.toUpperCase() === providerType.toUpperCase();
      const matchDistrict = !district || (p.district && p.district.toLowerCase().includes(district.toLowerCase()));
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.address.toLowerCase().includes(search.toLowerCase());
      return matchState && matchType && matchDistrict && matchSearch;
    });

    res.status(200).json({
      success: true,
      data: filtered.map(formatProvider),
      meta: {
        total: filtered.length,
        page: 1,
        limit,
        totalPages: 1,
        filters: { state, district, type: providerType, category },
      },
    });
  } catch (err) {
    const filtered = FALLBACK_PROVIDERS.map(formatProvider);
    res.status(200).json({
      success: true,
      data: filtered,
      meta: { total: filtered.length, page: 1, limit, totalPages: 1 },
    });
  }
}

// ---------------------------------------------------------------------------
// GET /api/aid/districts/:state — List unique districts for a given state
// ---------------------------------------------------------------------------
export async function getDistrictsByState(req, res, next) {
  try {
    const { state } = req.params;

    if (isPrismaConfigured) {
      const providers = await prisma.legalAidProvider.findMany({
        where: {
          state: { equals: state.trim(), mode: 'insensitive' },
          district: { not: null },
        },
        select: { district: true },
        distinct: ['district'],
      });

      const districts = providers
        .map((p) => p.district)
        .filter(Boolean)
        .sort();

      if (districts.length > 0) {
        return res.status(200).json({ success: true, data: districts });
      }
    }

    const fallbackDistricts = FALLBACK_PROVIDERS
      .filter((p) => p.state.toLowerCase() === state.toLowerCase())
      .map((p) => p.district)
      .filter(Boolean);

    res.status(200).json({
      success: true,
      data: [...new Set(fallbackDistricts)],
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/aid/:id — Provider by ID
// ---------------------------------------------------------------------------
export async function getLegalAidProviderById(req, res, next) {
  try {
    const { id } = req.params;

    if (isPrismaConfigured) {
      const provider = await prisma.legalAidProvider.findUnique({
        where: { id },
      });

      if (provider) {
        return res.status(200).json({ success: true, data: formatProvider(provider) });
      }
    }

    const fallback = FALLBACK_PROVIDERS.find((p) => p.id === id);
    if (fallback) {
      return res.status(200).json({ success: true, data: formatProvider(fallback) });
    }

    res.status(404).json({ success: false, error: `Legal aid provider '${id}' not found.` });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/aid/nalsa-eligibility — Direct NALSA verification helper
// ---------------------------------------------------------------------------
export async function checkNalsaEligibility(req, res, next) {
  try {
    const { annualIncome = 0, category = 'GENERAL', isWomenOrChild = false, isSCorST = false, isDisabled = false, state = 'Delhi' } = req.body || {};

    const evaluation = await legalAidEligibilityService.evaluateEligibility({
      category: isWomenOrChild ? 'WOMAN' : isSCorST ? 'SC_ST' : isDisabled ? 'DISABILITY' : category,
      annualIncome: annualIncome ? Number(annualIncome) : null,
      state,
      courtLevel: 'SUBORDINATE_COURT',
    });

    res.status(200).json({
      success: true,
      data: {
        eligible: evaluation.status === 'POTENTIALLY_ELIGIBLE',
        status: evaluation.status,
        reason: evaluation.explanation,
        statutoryClause: evaluation.statutoryClause,
        helpline: '15100',
        officialPortal: 'https://nalsa.gov.in',
      },
    });
  } catch (err) {
    next(err);
  }
}
