import { prisma, isPrismaConfigured } from '../lib/prisma.js';
import { supabaseService } from '../services/supabaseService.js';

const FALLBACK_PROVIDERS = [
  {
    id: 'nalsa-hq',
    name: 'National Legal Services Authority (NALSA)',
    type: 'NALSA',
    state: 'Delhi',
    district: 'New Delhi',
    address: 'B-Block, Additional Office Complex, Supreme Court of India, New Delhi - 110001',
    phone: ['15100', '011-23386176'],
    email: 'nalsa-dla@nic.in',
    website: 'https://nalsa.gov.in',
    services: [
      'Free Court Representation (Supreme Court & High Courts)',
      'National Legal Helpline 15100 (24x7)',
      'National Lok Adalat settlements',
      'Prison Legal Aid Clinics',
    ],
    eligibility: 'Women, children, SC/ST, custody inmates, disabled, industrial workmen, and citizens with annual income below statutory limits.',
    isActive: true,
  },
  {
    id: 'mslsa-mumbai',
    name: 'Maharashtra State Legal Services Authority (MSLSA)',
    type: 'SLSA',
    state: 'Maharashtra',
    district: 'Mumbai',
    address: 'High Court PWD Building, Fort, Mumbai - 400032',
    phone: ['022-22691395', '022-22676750'],
    email: 'mslsa-hc@nic.in',
    website: 'https://legalservices.maharashtra.gov.in',
    services: [
      'Panel advocate appointment in Bombay High Court & District Courts',
      'Pre-litigation conciliation & Lok Adalat',
      'Victim Compensation Scheme counseling',
    ],
    eligibility: 'Maharashtra residents with annual income up to ₹3,00,000 (no income ceiling for women/children/SC/ST).',
    isActive: true,
  },
  {
    id: 'dslsa-delhi',
    name: 'Delhi State Legal Services Authority (DSLSA)',
    type: 'SLSA',
    state: 'Delhi',
    district: 'Central',
    address: 'Central Office, Patiala House Courts Complex, New Delhi - 110001',
    phone: ['1516', '011-23384781'],
    email: 'dslsa-phc@nic.in',
    website: 'https://dslsa.org',
    services: [
      'Front Office Legal Advice Clinics',
      'Free Advocate allocation for all Delhi District Courts',
      'Special child support & maintenance counseling',
    ],
    eligibility: 'Income below ₹3,00,000 per annum or belonging to affirmative categories under Section 12.',
    isActive: true,
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
    email: provider.email,
    website: provider.website,
    services: servicesList,
    servicesOffered: servicesList,
    eligibility: provider.eligibility || provider.eligibility_information || 'Eligible under Section 12 of Legal Services Authorities Act, 1987.',
    eligibilityCriteria: provider.eligibility || provider.eligibility_information || 'Eligible under Section 12 of Legal Services Authorities Act, 1987.',
    languages: provider.languages || ['English', 'Hindi', 'Regional Languages'],
    workingHours: provider.workingHours || 'Mon–Sat, 10:00–17:00',
    isActive: provider.isActive ?? true,
    verified: provider.verified ?? true,
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

      if (providers && providers.length > 0) {
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
      return matchState && matchType && matchDistrict;
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
    const { annualIncome = 0, category = 'GENERAL', isWomenOrChild = false, isSCorST = false, isDisabled = false } = req.body || {};

    const isAutoEligible = isWomenOrChild || isSCorST || isDisabled || ['WOMEN', 'CHILD', 'SC_ST', 'DISABILITY'].includes(category.toUpperCase());
    const isIncomeEligible = Number(annualIncome) <= 100000;
    const eligible = isAutoEligible || isIncomeEligible;

    let reason = '';
    if (isAutoEligible) {
      reason = 'You are automatically entitled to 100% free legal aid under Section 12 of the Legal Services Authorities Act, 1987 without income ceilings.';
    } else if (isIncomeEligible) {
      reason = 'Your annual income qualifies for free legal services through your State or District Legal Services Authority (DLSA).';
    } else {
      reason = 'Your annual income exceeds statutory free legal aid ceilings. Pro bono and Lok Adalat services remain accessible.';
    }

    res.status(200).json({
      success: true,
      data: {
        eligible,
        reason,
        helpline: '15100',
        officialPortal: 'https://nalsa.gov.in',
      },
    });
  } catch (err) {
    next(err);
  }
}
