import { prisma, isPrismaConfigured } from '../lib/prisma.js';
import { supabaseService } from '../services/supabaseService.js';

// Curated fallbacks for offline mode
const FALLBACK_CATEGORIES = [
  { id: '1', slug: 'labour', name: 'Labour & Employment Rights', description: 'Wages, overtime, safety standards, and wrongful termination safeguards.', icon: 'Briefcase', sectionCount: 14, beneficiaryTypes: ['Workers', 'Daily Wagers'] },
  { id: '2', slug: 'women', name: "Women's Statutory Protections", description: 'Domestic violence remedies, POSH workplace safety, and maintenance rights.', icon: 'ShieldAlert', sectionCount: 18, beneficiaryTypes: ['Women', 'Mothers'] },
  { id: '3', slug: 'children', name: 'Child Rights & Education', description: 'Right to Education (RTE), prohibition of hazardous child labour, and POCSO laws.', icon: 'Baby', sectionCount: 12, beneficiaryTypes: ['Children', 'Students'] },
  { id: '4', slug: 'consumer', name: 'Consumer Grievance Redressal', description: 'Remedies for defective products, false advertisements, and e-commerce frauds.', icon: 'ShoppingBag', sectionCount: 16, beneficiaryTypes: ['Consumers', 'Buyers'] },
  { id: '5', slug: 'constitutional', name: 'Constitutional Fundamental Rights', description: 'Article 14 equality, Article 21 right to life, freedom of speech, and Article 32 writs.', icon: 'Scale', sectionCount: 22, beneficiaryTypes: ['All Citizens'] },
  { id: '6', slug: 'criminal', name: 'Criminal Procedure & Arrest Rights', description: 'Rights upon arrest, 24-hr magistrate production, bail basics under BNSS & BNS.', icon: 'Gavel', sectionCount: 20, beneficiaryTypes: ['Citizens', 'Accused'] },
  { id: '7', slug: 'disability', name: 'Disability Rights & Equality', description: 'Accessibility mandates, non-discrimination in jobs, and RPwD Act quotas.', icon: 'Accessibility', sectionCount: 9, beneficiaryTypes: ['Persons with Disabilities'] },
  { id: '8', slug: 'senior-citizens', name: 'Senior Citizens & Maintenance', description: 'Right to financial maintenance from adult children and eviction of abusive relatives.', icon: 'HeartHandshake', sectionCount: 8, beneficiaryTypes: ['Senior Citizens'] },
  { id: '9', slug: 'property', name: 'Property, Tenancy & Land', description: 'Tenant protections against illegal eviction, rent agreements, and inheritance.', icon: 'Home', sectionCount: 11, beneficiaryTypes: ['Tenants', 'Property Owners'] },
  { id: '10', slug: 'tribal', name: 'Tribal & Forest Rights', description: 'Forest Rights Act (FRA), PESA gram sabha consent, and traditional land entitlements.', icon: 'Trees', sectionCount: 7, beneficiaryTypes: ['ST Communities', 'Forest Dwellers'] },
];

const FALLBACK_SECTIONS_BY_SLUG = {
  labour: [
    {
      id: 'sec-5-wages',
      sectionNumber: 'Section 5',
      title: 'Time of payment of wages',
      simplifiedText: 'Your employer is required by law to disburse earned wages on or before the 7th day of the month (or 10th day if over 1,000 workers). Withholding salary beyond this deadline violates the statute.',
      originalText: 'The wages of every person employed upon or in any railway, factory or industrial or other establishment upon or in which less than one thousand persons are employed, shall be paid before the expiry of the seventh day, and in other cases before the tenth day, after the last day of the wage-period.',
      act: { title: 'Payment of Wages Act', year: 1936, jurisdiction: 'CENTRAL', sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2367' },
      beneficiaryTypes: ['Workers', 'Salaried Employees'],
      remedies: [
        {
          id: 'rem-labour-1',
          remedyType: 'COMPLAINT',
          title: 'Demand Notice & Labour Commissioner Claim',
          description: 'Serve a formal 7-day demand notice to employer. If unpaid, file application before Authority under Section 15.',
          authority: 'Labour Commissioner / Payment of Wages Authority',
          timeLimit: 'Within 12 months of delayed wage',
          officialUrl: 'https://shramsuvidha.gov.in',
        },
      ],
    },
    {
      id: 'sec-15-wages',
      sectionNumber: 'Section 15',
      title: 'Claims arising out of deductions from wages or delay in payment',
      simplifiedText: 'If your wages are delayed or unlawfully deducted, you can file a formal claim before the Labour Commissioner Authority to recover all back-pay plus statutory compensation up to 10 times the amount.',
      originalText: 'Where contrary to the provisions of this Act any deduction has been made from the wages of an employed person, or any payment of wages has been delayed, such person himself, or any legal practitioner or any official of a registered trade union authorized in writing, may apply to such Authority for a direction under sub-section (3).',
      act: { title: 'Payment of Wages Act', year: 1936, jurisdiction: 'CENTRAL', sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2367' },
      beneficiaryTypes: ['Workers', 'Salaried Employees'],
      remedies: [
        {
          id: 'rem-labour-2',
          remedyType: 'AUTHORITY',
          title: 'Section 15 Claim with Compensation up to 10x',
          description: 'File claim directly before the designated Authority for full recovery plus compensation up to 10 times the delayed amount.',
          authority: 'Designated Authority under Section 15',
          timeLimit: '12 months from due date',
          officialUrl: 'https://shramsuvidha.gov.in',
        },
      ],
    },
  ],
  women: [
    {
      id: 'sec-3-pwdva',
      sectionNumber: 'Section 3',
      title: 'Definition of domestic violence',
      simplifiedText: 'Domestic violence includes physical harm, verbal insults, emotional harassment, sexual abuse, and denial of financial resources (economic abuse).',
      originalText: 'Any act, omission or commission or conduct of the respondent shall constitute domestic violence if it harms or injures or endangers the health, safety, life, limb or well-being, whether mental or physical, of the aggrieved person.',
      act: { title: 'Protection of Women from Domestic Violence Act', year: 2005, jurisdiction: 'CENTRAL', sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2021' },
      beneficiaryTypes: ['Women', 'Aggrieved Wives/Partners'],
      remedies: [
        {
          id: 'rem-pwdva-1',
          remedyType: 'COURT',
          title: 'Section 12 Magistrate Application for Protection & Residence Orders',
          description: 'Apply before Judicial Magistrate First Class (JMFC) or Metropolitan Magistrate for Protection Order, Residence Order, and Monetary Relief.',
          authority: 'Judicial Magistrate / Protection Officer',
          timeLimit: 'Immediate; first hearing mandated within 3 days',
          officialUrl: 'https://nalsa.gov.in',
        },
      ],
    },
  ],
};

function formatSection(s) {
  const act = s.act || {};
  const categories = (s.rights || []).map((r) => r.rightCategory || r.category || r).filter(Boolean);
  const beneficiaries = (s.beneficiaries || []).map((b) => b.beneficiary?.name || b.name).filter(Boolean);

  return {
    id: s.id,
    sectionNumber: s.sectionNumber,
    title: s.title || `Section ${s.sectionNumber}`,
    simplifiedText: s.simplifiedText || '',
    originalText: s.originalText || '',
    actName: act.title || 'Indian Statute',
    year: act.year,
    jurisdiction: act.jurisdiction || 'CENTRAL',
    state: act.state || null,
    sourceUrl: act.sourceUrl || s.sourceUrl,
    verificationStatus: act.verificationStatus || 'VERIFIED',
    status: act.status || 'ACTIVE',
    act: {
      id: act.id,
      title: act.title,
      year: act.year,
      jurisdiction: act.jurisdiction,
      state: act.state,
      sourceUrl: act.sourceUrl,
      verificationStatus: act.verificationStatus,
      status: act.status,
    },
    categories,
    beneficiaryTypes: beneficiaries.length > 0 ? beneficiaries : ['All Citizens'],
    remedies: s.remedies || [],
  };
}

// ---------------------------------------------------------------------------
// GET /api/rights — List all legal categories
// ---------------------------------------------------------------------------
export async function listRightCategories(_req, res) {
  try {
    if (isPrismaConfigured) {
      const categories = await prisma.rightCategory.findMany({
        include: {
          _count: {
            select: { sections: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      if (categories && categories.length > 0) {
        const data = categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description || '',
          icon: cat.icon || 'Scale',
          sectionCount: cat._count.sections,
        }));
        return res.status(200).json({ success: true, data });
      }
    }

    // Try Supabase service
    const supabaseCategories = await supabaseService.getCategories();
    if (supabaseCategories && supabaseCategories.length > 0) {
      const data = supabaseCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        icon: 'Scale',
        sectionCount: c.sectionCount || 0,
      }));
      return res.status(200).json({ success: true, data });
    }

    res.status(200).json({ success: true, data: FALLBACK_CATEGORIES });
  } catch (err) {
    console.warn('[RightsController] Falling back to default categories:', err?.message);
    res.status(200).json({ success: true, data: FALLBACK_CATEGORIES });
  }
}

// ---------------------------------------------------------------------------
// GET /api/rights/search?q=&limit=&page= — Search statutory sections
// ---------------------------------------------------------------------------
export async function searchSections(req, res, next) {
  try {
    const q = (req.query.q ?? '').trim();
    const limit = Math.min(parseInt(req.query.limit ?? '20', 10), 50);
    const page = Math.max(parseInt(req.query.page ?? '1', 10), 1);
    const skip = (page - 1) * limit;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters (e.g. ?q=wages)',
      });
    }

    if (isPrismaConfigured) {
      const where = {
        OR: [
          { originalText: { contains: q, mode: 'insensitive' } },
          { simplifiedText: { contains: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } },
          { sectionNumber: { contains: q, mode: 'insensitive' } },
          { act: { title: { contains: q, mode: 'insensitive' } } },
        ],
      };

      const [sections, total] = await Promise.all([
        prisma.legalSection.findMany({
          where,
          skip,
          take: limit,
          include: {
            act: true,
            rights: {
              include: { rightCategory: { select: { id: true, name: true, slug: true } } },
            },
            beneficiaries: {
              include: { beneficiary: { select: { id: true, name: true, slug: true } } },
            },
            remedies: true,
          },
          orderBy: { act: { year: 'desc' } },
        }),
        prisma.legalSection.count({ where }),
      ]);

      const data = sections.map(formatSection);

      return res.status(200).json({
        success: true,
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
          query: q,
        },
      });
    }

    // Offline / fallback matches
    const allFallback = Object.values(FALLBACK_SECTIONS_BY_SLUG).flat();
    const matches = allFallback.filter(
      (s) =>
        s.simplifiedText.toLowerCase().includes(q.toLowerCase()) ||
        s.title.toLowerCase().includes(q.toLowerCase()) ||
        s.sectionNumber.toLowerCase().includes(q.toLowerCase()) ||
        s.act?.title.toLowerCase().includes(q.toLowerCase())
    );

    res.status(200).json({
      success: true,
      data: matches,
      meta: { total: matches.length, page: 1, limit, totalPages: 1, query: q },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/rights/acts — List all statutory acts
// ---------------------------------------------------------------------------
export async function listActs(req, res, next) {
  try {
    const { jurisdiction, search, status = 'ACTIVE' } = req.query;

    if (isPrismaConfigured) {
      const where = {};
      if (status) where.status = status;
      if (jurisdiction) where.jurisdiction = jurisdiction.toUpperCase();
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const acts = await prisma.legalAct.findMany({
        where,
        include: {
          _count: {
            select: { sections: true },
          },
        },
        orderBy: [{ year: 'asc' }, { title: 'asc' }],
      });

      const data = acts.map((act) => ({
        id: act.id,
        title: act.title,
        actNumber: act.actNumber,
        year: act.year,
        jurisdiction: act.jurisdiction,
        state: act.state,
        category: act.category,
        description: act.description,
        sourceUrl: act.sourceUrl,
        status: act.status,
        verificationStatus: act.verificationStatus,
        lastVerifiedAt: act.lastVerifiedAt,
        sectionCount: act._count.sections,
      }));

      return res.status(200).json({ success: true, data });
    }

    res.status(200).json({
      success: true,
      data: [
        {
          id: 'act-pwdva-2005',
          title: 'Protection of Women from Domestic Violence Act',
          year: 2005,
          jurisdiction: 'CENTRAL',
          sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2021',
          verificationStatus: 'VERIFIED',
          status: 'ACTIVE',
          sectionCount: 1,
        },
        {
          id: 'act-pwa-1936',
          title: 'Payment of Wages Act',
          year: 1936,
          jurisdiction: 'CENTRAL',
          sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2367',
          verificationStatus: 'VERIFIED',
          status: 'ACTIVE',
          sectionCount: 2,
        },
      ],
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/rights/acts/:id — Get single act details with sections
// ---------------------------------------------------------------------------
export async function getActById(req, res, next) {
  try {
    const { id } = req.params;

    if (isPrismaConfigured) {
      const act = await prisma.legalAct.findFirst({
        where: {
          OR: [{ id }, { title: { contains: id, mode: 'insensitive' } }],
        },
        include: {
          sections: {
            include: {
              remedies: true,
              rights: { include: { rightCategory: true } },
              beneficiaries: { include: { beneficiary: true } },
            },
            orderBy: { sectionNumber: 'asc' },
          },
        },
      });

      if (act) {
        return res.status(200).json({
          success: true,
          data: {
            ...act,
            sections: act.sections.map(formatSection),
          },
        });
      }
    }

    res.status(404).json({ success: false, error: `Legal act '${id}' not found.` });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/rights/sections — List statutory sections
// ---------------------------------------------------------------------------
export async function listSections(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit ?? '50', 10), 100);
    const page = Math.max(parseInt(req.query.page ?? '1', 10), 1);
    const skip = (page - 1) * limit;

    if (isPrismaConfigured) {
      const [sections, total] = await Promise.all([
        prisma.legalSection.findMany({
          skip,
          take: limit,
          include: {
            act: true,
            rights: { include: { rightCategory: true } },
            beneficiaries: { include: { beneficiary: true } },
            remedies: true,
          },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.legalSection.count(),
      ]);

      return res.status(200).json({
        success: true,
        data: sections.map(formatSection),
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
      });
    }

    const allFallback = Object.values(FALLBACK_SECTIONS_BY_SLUG).flat();
    res.status(200).json({
      success: true,
      data: allFallback,
      meta: { total: allFallback.length, page: 1, limit, totalPages: 1 },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/rights/sections/:id — Get single section details
// ---------------------------------------------------------------------------
export async function getSectionById(req, res, next) {
  try {
    const { id } = req.params;

    if (isPrismaConfigured) {
      const section = await prisma.legalSection.findFirst({
        where: {
          OR: [{ id }, { sectionNumber: id }],
        },
        include: {
          act: true,
          rights: { include: { rightCategory: true } },
          beneficiaries: { include: { beneficiary: true } },
          remedies: true,
        },
      });

      if (section) {
        return res.status(200).json({
          success: true,
          data: formatSection(section),
        });
      }
    }

    const allFallback = Object.values(FALLBACK_SECTIONS_BY_SLUG).flat();
    const fallback = allFallback.find((s) => s.id === id || s.sectionNumber.toLowerCase() === id.toLowerCase());
    if (fallback) {
      return res.status(200).json({ success: true, data: fallback });
    }

    res.status(404).json({ success: false, error: `Statutory section '${id}' not found.` });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/rights/beneficiaries — List all beneficiary groups
// ---------------------------------------------------------------------------
export async function listBeneficiaries(_req, res, next) {
  try {
    if (isPrismaConfigured) {
      const beneficiaries = await prisma.beneficiary.findMany({
        include: {
          _count: {
            select: { sections: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      if (beneficiaries && beneficiaries.length > 0) {
        const data = beneficiaries.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          description: b.description,
          icon: b.icon,
          sectionCount: b._count.sections,
        }));
        return res.status(200).json({ success: true, data });
      }
    }

    res.status(200).json({
      success: true,
      data: [
        { id: 'b1', name: 'Women', slug: 'women', description: 'Women citizens protecting against domestic and workplace violence.', sectionCount: 1 },
        { id: 'b2', name: 'Industrial Workmen & Labourers', slug: 'workers', description: 'Employees and informal labourers entitled to timely wages and safety.', sectionCount: 2 },
        { id: 'b3', name: 'Children', slug: 'children', description: 'Minors entitled to mandatory education and freedom from child labour.', sectionCount: 1 },
        { id: 'b4', name: 'Persons with Disabilities', slug: 'disabilities', description: 'Persons entitled to accessible infrastructure and non-discrimination.', sectionCount: 1 },
      ],
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/rights/:slug — Category details and its sections
// ---------------------------------------------------------------------------
export async function getRightCategoryBySlug(req, res, next) {
  const { slug } = req.params;
  const normalizedSlug = slug.toLowerCase();

  try {
    if (isPrismaConfigured) {
      const category = await prisma.rightCategory.findUnique({
        where: { slug: normalizedSlug },
        include: {
          sections: {
            include: {
              section: {
                include: {
                  act: true,
                  remedies: true,
                  rights: { include: { rightCategory: true } },
                  beneficiaries: { include: { beneficiary: true } },
                },
              },
            },
          },
        },
      });

      if (category) {
        const sections = category.sections.map((sr) => formatSection(sr.section));
        return res.status(200).json({
          success: true,
          data: {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            icon: category.icon || 'Scale',
            sections,
          },
        });
      }
    }

    // Try Supabase Service
    const supabaseCategory = await supabaseService.getCategoryBySlug(slug);
    if (supabaseCategory) {
      const supabaseSections = await supabaseService.getSectionsByCategoryId(supabaseCategory.id);
      if (supabaseSections) {
        return res.status(200).json({
          success: true,
          data: {
            id: supabaseCategory.id,
            name: supabaseCategory.name,
            slug: supabaseCategory.slug,
            description: supabaseCategory.description || '',
            icon: 'Scale',
            sections: supabaseSections.map(formatSection),
          },
        });
      }
    }

    // Fallback
    const fallbackCat = FALLBACK_CATEGORIES.find((c) => c.slug === normalizedSlug);
    if (fallbackCat) {
      return res.status(200).json({
        success: true,
        data: {
          ...fallbackCat,
          sections: FALLBACK_SECTIONS_BY_SLUG[normalizedSlug] || [],
        },
      });
    }

    res.status(404).json({ success: false, error: `Right category '${slug}' not found` });
  } catch (err) {
    const fallbackCat = FALLBACK_CATEGORIES.find((c) => c.slug === normalizedSlug);
    if (fallbackCat) {
      return res.status(200).json({
        success: true,
        data: {
          ...fallbackCat,
          sections: FALLBACK_SECTIONS_BY_SLUG[normalizedSlug] || [],
        },
      });
    }
    next(err);
  }
}
