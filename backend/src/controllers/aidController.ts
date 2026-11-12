import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

export async function getLegalAidProviders(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const {
    state,
    category,
    district,
    type: providerType,
    limit: rawLimit = '50',
    page: rawPage = '1',
  } = req.query as Record<string, string | undefined>;

  const limit = Math.min(parseInt(rawLimit ?? '50', 10), 100);
  const page = Math.max(parseInt(rawPage ?? '1', 10), 1);
  const skip = (page - 1) * limit;

  try {
    const where: Record<string, unknown> = { isActive: true };

    if (state) {
      where['state'] = { equals: state.trim(), mode: 'insensitive' };
    }
    if (district) {
      where['district'] = { contains: district.trim(), mode: 'insensitive' };
    }
    if (providerType) {
      where['type'] = { equals: providerType.trim().toUpperCase() };
    }
    if (category) {
      where['services'] = { has: category.trim().toUpperCase() };
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
      res.status(200).json({
        success: true,
        data: providers,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          filters: { state, district, type: providerType, category },
        },
      });
      return;
    }

    // Filter fallback
    const filtered = FALLBACK_PROVIDERS.filter((p) => {
      const matchState = !state || p.state.toLowerCase() === state.toLowerCase();
      const matchType = !providerType || p.type.toUpperCase() === providerType.toUpperCase();
      return matchState && matchType;
    });

    res.status(200).json({
      success: true,
      data: filtered,
      meta: {
        total: filtered.length,
        page: 1,
        limit,
        totalPages: 1,
        filters: { state, district, type: providerType, category },
      },
    });
  } catch (err) {
    const filtered = FALLBACK_PROVIDERS.filter((p) => {
      const matchState = !state || p.state.toLowerCase() === state.toLowerCase();
      const matchType = !providerType || p.type.toUpperCase() === providerType.toUpperCase();
      return matchState && matchType;
    });

    res.status(200).json({
      success: true,
      data: filtered,
      meta: {
        total: filtered.length,
        page: 1,
        limit,
        totalPages: 1,
        filters: { state, district, type: providerType, category },
      },
    });
  }
}
