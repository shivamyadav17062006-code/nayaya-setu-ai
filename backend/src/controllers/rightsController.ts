import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/rights
 * Returns all RightCategory records with the count of associated sections.
 */
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

    const data = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      sectionCount: cat._count.sections,
    }));

    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/rights/:slug
 * Returns a RightCategory with all its sections (and their parent act info).
 */
export async function getRightCategoryBySlug(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { slug } = req.params;

    const category = await prisma.rightCategory.findUnique({
      where: { slug: slug.toLowerCase() },
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

    if (!category) {
      res.status(404).json({ success: false, error: `Right category '${slug}' not found` });
      return;
    }

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
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/rights/search?q=<query>&limit=<n>
 * Full-text search across LegalSection originalText and simplifiedText.
 * Uses Prisma's string filtering (ILIKE). For production, use a pg_trgm GIN index.
 */
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
    next(err);
  }
}
