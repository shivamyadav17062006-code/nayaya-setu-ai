import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/aid?state=<state>&category=<type>&district=<district>&type=<providerType>
 * Returns legal aid providers filtered by the given query params.
 * All parameters are optional — omitting them returns all active providers.
 */
export async function getLegalAidProviders(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
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

    // Build filter — all fields are optional
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
      // services is a String[] field — filter for providers whose services array
      // contains the requested category
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
  } catch (err) {
    next(err);
  }
}
