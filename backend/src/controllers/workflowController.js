import { prisma } from '../lib/prisma.js';
import { supabaseService } from '../services/supabaseService.js';

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
  {
    id: 'wf-consumer',
    category: 'CONSUMER',
    title: 'Consumer Complaint against Defective Goods or Deficient Service',
    description: 'Two-stage grievance process under the Consumer Protection Act, 2019 using the National Consumer Helpline and the e-Daakhil portal.',
    steps: [
      {
        id: 'c1',
        stepNumber: 1,
        title: 'Preserve Purchase and Complaint Records',
        description: 'Keep the invoice, warranty card, delivery receipt, photographs of the defect, and all written communication with the seller.',
        documents: ['Tax invoice', 'Warranty card', 'Photos or videos of the defect', 'Customer support ticket'],
      },
      {
        id: 'c2',
        stepNumber: 2,
        title: 'Raise a Written Complaint with the Seller',
        description: 'Send a written complaint to the seller or e-commerce platform and allow a reasonable time for repair, replacement or refund.',
        documents: ['Complaint copy', 'Proof of dispatch'],
        timeLimit: '15 days',
      },
      {
        id: 'c3',
        stepNumber: 3,
        title: 'Escalate to the National Consumer Helpline',
        description: 'Register the grievance on consumerhelpline.gov.in or dial 1915. Many registered companies resolve complaints at this stage.',
        authority: 'National Consumer Helpline (NCH)',
        officialUrl: 'https://consumerhelpline.gov.in',
      },
      {
        id: 'c4',
        stepNumber: 4,
        title: 'File a Complaint before the District Commission',
        description: 'If unresolved, file a complaint electronically on the e-Daakhil portal before the District Consumer Disputes Redressal Commission.',
        authority: 'District Consumer Disputes Redressal Commission',
        officialUrl: 'https://edaakhil.nic.in',
      },
    ],
  },
];

function normalizeStep(step, index) {
  const stepNumber = step.stepNumber ?? step.step_number ?? index + 1;
  return {
    id: step.id ?? `step-${stepNumber}`,
    stepNumber,
    title: step.title ?? `Step ${stepNumber}`,
    description: step.description ?? step.instructions ?? '',
    requiredDocuments:
      step.requiredDocuments ?? step.documents ?? step.required_documents ?? [],
    authorityName:
      step.authorityName ?? step.authority ?? step.target_authority ?? 'Competent Authority',
    officialLink: step.officialLink ?? step.officialUrl ?? step.official_url,
    timeLimitDays: step.timeLimitDays,
    tips: step.tips,
  };
}

function normalizeWorkflow(workflow) {
  const rawSteps = workflow.steps ?? workflow.workflow_steps ?? [];
  const steps = (Array.isArray(rawSteps) ? rawSteps : []).map(normalizeStep);
  const categoryId =
    workflow.categoryId ??
    workflow.categorySlug ??
    (typeof workflow.category === 'string' ? workflow.category.toLowerCase() : 'general');

  return {
    id: workflow.id,
    categoryId,
    category: categoryId.toUpperCase(),
    title: workflow.title,
    description: workflow.description ?? '',
    targetAuthority: workflow.target_authority ?? workflow.targetAuthority,
    officialUrl: workflow.officialUrl ?? workflow.official_url,
    totalSteps: steps.length,
    estimatedDays: workflow.estimatedDays ?? 0,
    steps,
  };
}

export async function listWorkflows(_req, res, next) {
  try {
    const supabaseWfs = await supabaseService.getWorkflows();
    if (supabaseWfs && supabaseWfs.length > 0) {
      return res.status(200).json({ success: true, data: supabaseWfs.map(normalizeWorkflow) });
    }

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
      data: (workflows.length > 0 ? workflows : FALLBACK_WORKFLOWS).map(normalizeWorkflow),
    });
  } catch (err) {
    res.status(200).json({
      success: true,
      data: FALLBACK_WORKFLOWS.map(normalizeWorkflow),
    });
  }
}

export async function getWorkflowByCategory(req, res, next) {
  const { category } = req.params;
  const normalizedCategory = category.toUpperCase();

  try {
    const supabaseWfs = await supabaseService.getWorkflows(category);
    if (supabaseWfs && supabaseWfs.length > 0) {
      return res.status(200).json({ success: true, data: normalizeWorkflow(supabaseWfs[0]) });
    }

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
      return res.status(200).json({ success: true, data: normalizeWorkflow(workflow) });
    }

    const fallback = FALLBACK_WORKFLOWS.find(w => w.category === normalizedCategory);
    if (fallback) {
      return res.status(200).json({ success: true, data: normalizeWorkflow(fallback) });
    }

    res.status(404).json({
      success: false,
      error: `No workflow found for category: ${category}`,
    });
  } catch (err) {
    const fallback = FALLBACK_WORKFLOWS.find(w => w.category === normalizedCategory);
    if (fallback) {
      return res.status(200).json({ success: true, data: normalizeWorkflow(fallback) });
    }
    next(err);
  }
}
