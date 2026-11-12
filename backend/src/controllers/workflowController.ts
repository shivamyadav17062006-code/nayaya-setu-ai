import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { supabaseService } from '../services/supabaseService';

const prisma = new PrismaClient();

const FALLBACK_WORKFLOWS = [
  {
    id: 'wf-labour',
    category: 'LABOUR',
    title: 'Recovery of Unpaid Wages or Delayed Salary',
    description: 'Step-by-step statutory process for informal and formal employees to recover withheld salaries under the Payment of Wages Act.',
    steps: [
      {
        id: 's1',
        stepNumber: 1,
        title: 'Compile Employment Proof & Attendance Logs',
        description: 'Assemble offer letter, salary slips, bank transaction records, WhatsApp chats, or muster roll logs showing worked hours.',
        documents: ['Bank Statement', 'Appointment Letter / ID card', 'WhatsApp/Email communication', 'Muster roll entry'],
        timeLimit: 'Within 7 days of salary default',
      },
      {
        id: 's2',
        stepNumber: 2,
        title: 'Serve a Formal Demand Letter / Legal Notice',
        description: 'Send a registered notice giving employer 7 days to clear pending arrears failing which formal labour proceedings will commence.',
        timeLimit: '7 to 15 days notice window',
      },
      {
        id: 's3',
        stepNumber: 3,
        title: 'File Grievance on Shram Suvidha / Samadhan Portal',
        description: 'Register an online dispute on the Ministry of Labour grievance portal or state labour commission website.',
        officialUrl: 'https://shramsuvidha.gov.in',
        authority: 'Labour Commissioner Office / Shram Suvidha',
      },
      {
        id: 's4',
        stepNumber: 4,
        title: 'File Section 15 Claim before Authority / DLSA',
        description: 'If unresolved, file a formal petition under Section 15 of Payment of Wages Act. Free DLSA representation is guaranteed if needed.',
        authority: 'District Labour Court / District Legal Services Authority (DLSA)',
        officialUrl: 'https://nalsa.gov.in',
      },
    ],
  },
  {
    id: 'wf-dv',
    category: 'DOMESTIC_VIOLENCE',
    title: 'Protection Order & Shelter against Domestic Abuse',
    description: 'Emergency and judicial remedies under the PWDV Act 2005 for women facing violence in matrimonial or shared homes.',
    steps: [
      {
        id: 'dv1',
        stepNumber: 1,
        title: 'Emergency Safety & Helpline Activation',
        description: 'Dial 112 (National Emergency) or 181 (Women Helpline) for immediate police PCR dispatch or emergency medical shelter.',
        authority: 'Emergency Response Support System (ERSS 112) / One Stop Centre',
        timeLimit: 'Immediate (24x7)',
      },
      {
        id: 'dv2',
        stepNumber: 2,
        title: 'Domestic Incident Report (DIR) with Protection Officer',
        description: 'Meet the Taluka/District Protection Officer or an empanelled NGO service provider to prepare a standardized DIR form.',
        documents: ['Medical examination report (if injured)', 'Proof of shared household', 'Incident journal/dates'],
      },
      {
        id: 'dv3',
        stepNumber: 3,
        title: 'Filing Application under Section 12 before Magistrate',
        description: 'Protection Officer files DIR with the Metropolitan or Judicial Magistrate seeking urgent interim Protection Orders (Sec 18).',
        authority: 'Judicial Magistrate First Class (JMFC)',
        timeLimit: 'First hearing within 3 days',
      },
    ],
  },
];

export async function listWorkflows(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Try Supabase
    const supabaseWfs = await supabaseService.getWorkflows();
    if (supabaseWfs && supabaseWfs.length > 0) {
      const formatted = supabaseWfs.map((w: any) => ({
        id: w.id,
        title: w.title,
        description: w.description,
        category: 'LABOUR',
        steps: (w.workflow_steps || []).map((s: any) => ({
          id: s.id,
          stepNumber: s.step_number,
          title: s.title,
          description: s.instructions,
          documents: s.required_documents,
          officialUrl: s.official_url,
        })),
      }));
      res.status(200).json({ success: true, data: formatted });
      return;
    }

    // 2. Try Prisma
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
      data: workflows.length > 0 ? workflows : FALLBACK_WORKFLOWS,
    });
  } catch (err) {
    res.status(200).json({
      success: true,
      data: FALLBACK_WORKFLOWS,
    });
  }
}

export async function getWorkflowByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { category } = req.params;
  const normalizedCategory = category.toUpperCase();

  try {
    // 1. Try Supabase
    const supabaseWfs = await supabaseService.getWorkflows(category);
    if (supabaseWfs && supabaseWfs.length > 0) {
      const w = supabaseWfs[0];
      const formatted = {
        id: w.id,
        title: w.title,
        description: w.description,
        category: normalizedCategory,
        steps: (w.workflow_steps || []).map((s: any) => ({
          id: s.id,
          stepNumber: s.step_number,
          title: s.title,
          description: s.instructions,
          documents: s.required_documents,
          officialUrl: s.official_url,
        })),
      };
      res.status(200).json({ success: true, data: formatted });
      return;
    }

    // 2. Try Prisma
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

    if (workflow) {
      res.status(200).json({ success: true, data: workflow });
      return;
    }

    const fallback = FALLBACK_WORKFLOWS.find(w => w.category === normalizedCategory);
    if (fallback) {
      res.status(200).json({ success: true, data: fallback });
      return;
    }

    res.status(404).json({
      success: false,
      error: `No workflow found for category: ${category}`,
    });
  } catch (err) {
    const fallback = FALLBACK_WORKFLOWS.find(w => w.category === normalizedCategory);
    if (fallback) {
      res.status(200).json({ success: true, data: fallback });
      return;
    }
    next(err);
  }
}
