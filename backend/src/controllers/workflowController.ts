import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function listWorkflows(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const workflows = await prisma.complaintWorkflow.findMany({
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: workflows,
    });
  } catch (err) {
    next(err);
  }
}

export async function getWorkflowByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { category } = req.params;
    const normalizedCategory = category.toUpperCase();

    const workflow = await prisma.complaintWorkflow.findFirst({
      where: {
        category: {
          equals: normalizedCategory,
          mode: 'insensitive',
        },
      },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    });

    if (!workflow) {
      res.status(404).json({
        success: false,
        error: `No workflow found for category: ${category}`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: workflow,
    });
  } catch (err) {
    next(err);
  }
}
