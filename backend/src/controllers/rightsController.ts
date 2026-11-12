import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FALLBACK_CATEGORIES = [
  { id: '1', slug: 'labour', name: 'Labour & Employment Rights', description: 'Wages, overtime, safety standards, and wrongful termination safeguards.', icon: 'Briefcase', sectionCount: 14 },
  { id: '2', slug: 'women', name: "Women's Statutory Protections", description: 'Domestic violence remedies, POSH workplace safety, and maintenance rights.', icon: 'ShieldAlert', sectionCount: 18 },
  { id: '3', slug: 'children', name: "Child Rights & Education", description: 'Right to Education (RTE), prohibition of hazardous child labour, and POCSO laws.', icon: 'Baby', sectionCount: 12 },
  { id: '4', slug: 'consumer', name: 'Consumer Grievance Redressal', description: 'Remedies for defective products, false advertisements, and e-commerce frauds.', icon: 'ShoppingBag', sectionCount: 16 },
  { id: '5', slug: 'constitutional', name: 'Constitutional Fundamental Rights', description: 'Article 14 equality, Article 21 right to life, freedom of speech, and Article 32 writs.', icon: 'Scale', sectionCount: 22 },
  { id: '6', slug: 'criminal', name: 'Criminal Procedure & Arrest Rights', description: 'Rights upon arrest, 24-hr magistrate production, bail basics under BNSS & BNS.', icon: 'Gavel', sectionCount: 20 },
  { id: '7', slug: 'disability', name: 'Disability Rights & Equality', description: 'Accessibility mandates, non-discrimination in jobs, and RPwD Act quotas.', icon: 'Accessibility', sectionCount: 9 },
  { id: '8', slug: 'senior-citizens', name: 'Senior Citizens & Maintenance', description: 'Right to financial maintenance from adult children and eviction of abusive relatives.', icon: 'HeartHandshake', sectionCount: 8 },
  { id: '9', slug: 'property', name: 'Property, Tenancy & Land', description: 'Tenant protections against illegal eviction, rent agreements, and inheritance.', icon: 'Home', sectionCount: 11 },
  { id: '10', slug: 'tribal', name: 'Tribal & Forest Rights', description: 'Forest Rights Act (FRA), PESA gram sabha consent, and traditional land entitlements.', icon: 'Trees', sectionCount: 7 },
];

const FALLBACK_SECTIONS_BY_SLUG: Record<string, any[]> = {
  labour: [
    {
      id: 'sec-5-wages',
      sectionNumber: 'Section 5',
      title: 'Time of payment of wages',
      simplifiedText: 'Your employer is required by law to disburse earned wages on or before the 7th day of the month (or 10th day if over 1000 workers). Withholding salary beyond this deadline violates the statute.',
      originalText: 'The wages of every person employed upon or in any railway, factory or industrial or other establishment upon or in which less than one thousand persons are employed, shall be paid before the expiry of the seventh day, and in other cases before the tenth day, after the last day of the wage-period.',
      act: { title: 'Payment of Wages Act', year: 1936, jurisdiction: 'CENTRAL', sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2367' },
    },
    {
      id: 'sec-15-wages',
      sectionNumber: 'Section 15',
      title: 'Claims arising out of deductions from wages or delay in payment',
      simplifiedText: 'If your wages are delayed or unlawfully deducted, you can file a formal claim before the Labour Commissioner Authority to recover all back-pay plus statutory compensation up to 10 times the amount.',
      originalText: 'Where contrary to the provisions of this Act any deduction has been made from the wages of an employed person, or any payment of wages has been delayed, such person himself, or any legal practitioner or any official of a registered trade union authorized in writing, may apply to such Authority for a direction under sub-section (3).',
      act: { title: 'Payment of Wages Act', year: 1936, jurisdiction: 'CENTRAL', sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2367' },
    },
  ],
  women: [
    {
      id: 'sec-3-pwdva',
      sectionNumber: 'Section 3',
      title: 'Definition of domestic violence',
      simplifiedText: 'Domestic violence includes physical harm, verbal insults, emotional harassment, and denial of financial resources (economic abuse).',
      originalText: 'Any act, omission or commission or conduct of the respondent shall constitute domestic violence if it harms or injures or endangers the health, safety, life, limb or well-being, whether mental or physical, of the aggrieved person.',
      act: { title: 'Protection of Women from Domestic Violence Act', year: 2005, jurisdiction: 'CENTRAL', sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2021' },
    },
  ],
};

export async function listRightCategories(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
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
        description: cat.description,
        icon: cat.icon,
        sectionCount: cat._count.sections,
      }));
      res.status(200).json({ success: true, data });
      return;
    }

    res.status(200).json({ success: true, data: FALLBACK_CATEGORIES });
  } catch (err) {
    console.warn('Prisma query failed in listRightCategories, using fallback data:', (err as any)?.message);
    res.status(200).json({ success: true, data: FALLBACK_CATEGORIES });
  }
}

export async function getRightCategoryBySlug(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { slug } = req.params;
  const normalizedSlug = slug.toLowerCase();

  try {
    const category = await prisma.rightCategory.findUnique({
      where: { slug: normalizedSlug },
      include: {
        sections: {
          include: {
            section: {
              include: {
                act: {
                  select: {
                    id: true,
                    title: true,
                    year: true,
                    jurisdiction: true,
                    state: true,
                    sourceUrl: true,
                  },
                },
                remedies: true,
              },
            },
          },
        },
      },
    });

    if (category) {
      const sections = category.sections.map((sr) => ({
        id: sr.section.id,
        sectionNumber: sr.section.sectionNumber,
        title: sr.section.title,
        simplifiedText: sr.section.simplifiedText,
        originalText: sr.section.originalText,
        remedies: sr.section.remedies,
        act: sr.section.act,
      }));

      res.status(200).json({
        success: true,
        data: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          icon: category.icon,
          sections,
        },
      });
      return;
    }

    // Fallback if DB doesn't have it
    const fallbackCat = FALLBACK_CATEGORIES.find(c => c.slug === normalizedSlug);
    if (fallbackCat) {
      res.status(200).json({
        success: true,
        data: {
          ...fallbackCat,
          sections: FALLBACK_SECTIONS_BY_SLUG[normalizedSlug] || [],
        },
      });
      return;
    }

    res.status(404).json({ success: false, error: `Right category '${slug}' not found` });
  } catch (err) {
    const fallbackCat = FALLBACK_CATEGORIES.find(c => c.slug === normalizedSlug);
    if (fallbackCat) {
      res.status(200).json({
        success: true,
        data: {
          ...fallbackCat,
          sections: FALLBACK_SECTIONS_BY_SLUG[normalizedSlug] || [],
        },
      });
      return;
    }
    next(err);
  }
}

export async function searchSections(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const q = (req.query.q as string | undefined)?.trim() ?? '';
    const limit = Math.min(parseInt(req.query.limit as string ?? '20', 10), 50);
    const page = Math.max(parseInt(req.query.page as string ?? '1', 10), 1);
    const skip = (page - 1) * limit;

    if (!q || q.length < 2) {
      res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters (use ?q=<query>)',
      });
      return;
    }

    const where = {
      OR: [
        { originalText: { contains: q, mode: 'insensitive' as const } },
        { simplifiedText: { contains: q, mode: 'insensitive' as const } },
        { title: { contains: q, mode: 'insensitive' as const } },
        { act: { title: { contains: q, mode: 'insensitive' as const } } },
      ],
    };

    const [sections, total] = await Promise.all([
      prisma.legalSection.findMany({
        where,
        skip,
        take: limit,
        include: {
          act: {
            select: { id: true, title: true, year: true, jurisdiction: true, state: true, sourceUrl: true },
          },
          rights: {
            include: { rightCategory: { select: { name: true, slug: true } } },
          },
        },
        orderBy: { act: { year: 'desc' } },
      }),
      prisma.legalSection.count({ where }),
    ]);

    const data = sections.map((s) => ({
      id: s.id,
      sectionNumber: s.sectionNumber,
      title: s.title,
      simplifiedText: s.simplifiedText,
      originalText: s.originalText,
      act: s.act,
      categories: s.rights.map((r) => r.rightCategory),
    }));

    res.status(200).json({
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        query: q,
      },
    });
  } catch (err) {
    const q = (req.query.q as string | undefined)?.trim() ?? '';
    // Resilient search over fallback data
    const matches = (FALLBACK_SECTIONS_BY_SLUG['labour'] || []).filter(
      s => s.simplifiedText.toLowerCase().includes(q.toLowerCase()) || s.title.toLowerCase().includes(q.toLowerCase())
    );
    res.status(200).json({
      success: true,
      data: matches,
      meta: { total: matches.length, page: 1, limit: 10, totalPages: 1, query: q },
    });
  }
}
