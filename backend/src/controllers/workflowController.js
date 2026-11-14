import { prisma, isPrismaConfigured } from '../lib/prisma.js';
import { supabaseService } from '../services/supabaseService.js';

const FALLBACK_WORKFLOWS = [
  {
    id: 'wf-labour',
    category: 'LABOUR',
    title: 'Recovery of Unpaid Wages or Delayed Salary',
    description: 'Step-by-step statutory process for informal and formal employees to recover withheld salaries under the Payment of Wages Act.',
    targetAuthority: 'Office of the Labour Commissioner & DLSA',
    officialUrl: 'https://shramsuvidha.gov.in',
    estimatedDays: 30,
    steps: [
      {
        id: 's1',
        stepNumber: 1,
        title: 'Compile Employment Proof & Attendance Logs',
        description: 'Assemble offer letter, salary slips, bank transaction records, WhatsApp chats, or muster roll logs showing worked hours.',
        requiredDocuments: ['Bank Statement', 'Appointment Letter / ID card', 'WhatsApp/Email communication', 'Muster roll entry'],
        authorityName: 'Your Records / Trade Union',
        timeLimitDays: 7,
        tips: ['UPI logs, bank statements and WhatsApp work instructions are admissible in labour tribunals.'],
      },
      {
        id: 's2',
        stepNumber: 2,
        title: 'Serve a Formal Demand Letter / Legal Notice',
        description: 'Send a registered notice giving employer 7 to 15 days to clear pending arrears failing which formal labour proceedings will commence.',
        requiredDocuments: ['Written Demand Notice', 'Proof of Registered Post or Email Delivery'],
        authorityName: 'Employer Management / HR',
        timeLimitDays: 14,
        tips: ['Keep postal dispatch receipt and delivery tracking screenshot.'],
      },
      {
        id: 's3',
        stepNumber: 3,
        title: 'File Grievance on Shram Suvidha / Samadhan Portal',
        description: 'Register an online dispute on the Ministry of Labour grievance portal or state labour commission website.',
        requiredDocuments: ['Aadhaar Card', 'Demand Notice Copy', 'Company Details'],
        officialLink: 'https://shramsuvidha.gov.in',
        authorityName: 'Labour Commissioner Office / Shram Suvidha',
        timeLimitDays: 30,
      },
      {
        id: 's4',
        stepNumber: 4,
        title: 'File Section 15 Claim before Authority / DLSA',
        description: 'If unresolved, file a formal petition under Section 15 of Payment of Wages Act. Free DLSA representation is guaranteed if needed.',
        requiredDocuments: ['Form A (Application under Section 15)', 'Unpaid Wage Calculation Sheet', 'Identity Proof'],
        authorityName: 'District Labour Court / District Legal Services Authority (DLSA)',
        officialLink: 'https://nalsa.gov.in',
        timeLimitDays: 90,
      },
    ],
  },
  {
    id: 'wf-dv',
    category: 'DOMESTIC_VIOLENCE',
    title: 'Protection Order & Shelter against Domestic Abuse',
    description: 'Emergency and judicial remedies under the PWDV Act 2005 for women facing violence in matrimonial or shared homes.',
    targetAuthority: 'Judicial Magistrate / Protection Officer / One Stop Centre',
    officialUrl: 'https://nalsa.gov.in',
    estimatedDays: 15,
    steps: [
      {
        id: 'dv1',
        stepNumber: 1,
        title: 'Emergency Safety & Helpline Activation',
        description: 'Dial 112 (National Emergency) or 181 (Women Helpline) for immediate police PCR dispatch or emergency medical shelter.',
        requiredDocuments: ['No documents required for emergency assistance'],
        authorityName: 'Emergency Response Support System (ERSS 112) / One Stop Centre',
        timeLimitDays: 1,
      },
      {
        id: 'dv2',
        stepNumber: 2,
        title: 'Domestic Incident Report (DIR) with Protection Officer',
        description: 'Meet the Taluka/District Protection Officer or an empanelled NGO service provider to prepare a standardized DIR form.',
        requiredDocuments: ['Medical examination report (if injured)', 'Proof of shared household', 'Incident journal/dates'],
        authorityName: 'Protection Officer / Sakhi One Stop Centre',
        timeLimitDays: 3,
      },
      {
        id: 'dv3',
        stepNumber: 3,
        title: 'Filing Application under Section 12 before Magistrate',
        description: 'Protection Officer files DIR with the Metropolitan or Judicial Magistrate seeking urgent interim Protection Orders (Sec 18).',
        requiredDocuments: ['DIR Copy', 'Affidavit under Section 12', 'Relief Claims (Residence, Monetary, Custody)'],
        authorityName: 'Judicial Magistrate First Class (JMFC)',
        officialLink: 'https://nalsa.gov.in',
        timeLimitDays: 3,
      },
    ],
  },
  {
    id: 'wf-consumer',
    category: 'CONSUMER',
    title: 'Consumer Complaint against Defective Goods or Deficient Service',
    description: 'Two-stage grievance process under the Consumer Protection Act, 2019 using the National Consumer Helpline and the e-Daakhil portal.',
    targetAuthority: 'National Consumer Helpline & District Consumer Commission',
    officialUrl: 'https://edaakhil.nic.in',
    estimatedDays: 45,
    steps: [
      {
        id: 'c1',
        stepNumber: 1,
        title: 'Preserve Purchase and Complaint Records',
        description: 'Keep the invoice, warranty card, delivery receipt, photographs of the defect, and all written communication with the seller.',
        requiredDocuments: ['Tax invoice', 'Warranty card', 'Photos or videos of the defect', 'Customer support ticket'],
        authorityName: 'Your Records',
        timeLimitDays: 7,
      },
      {
        id: 'c2',
        stepNumber: 2,
        title: 'Raise a Written Complaint with the Seller',
        description: 'Send a written complaint to the seller or e-commerce platform and allow a reasonable time for repair, replacement or refund.',
        requiredDocuments: ['Complaint copy', 'Proof of dispatch'],
        authorityName: 'Seller / Platform Grievance Officer',
        timeLimitDays: 15,
      },
      {
        id: 'c3',
        stepNumber: 3,
        title: 'Escalate to the National Consumer Helpline',
        description: 'Register the grievance on consumerhelpline.gov.in or dial 1915. Many registered companies resolve complaints at this stage.',
        requiredDocuments: ['Invoice Copy', 'Seller Response / Refusal'],
        authorityName: 'National Consumer Helpline (NCH)',
        officialLink: 'https://consumerhelpline.gov.in',
        timeLimitDays: 30,
      },
      {
        id: 'c4',
        stepNumber: 4,
        title: 'File a Complaint before the District Commission',
        description: 'If unresolved, file a complaint electronically on the e-Daakhil portal before the District Consumer Disputes Redressal Commission.',
        requiredDocuments: ['e-Daakhil petition', 'Affidavit', 'Supporting Documents', 'Court Fee Payment Receipt'],
        authorityName: 'District Consumer Disputes Redressal Commission',
        officialLink: 'https://edaakhil.nic.in',
        timeLimitDays: 90,
      },
    ],
  },
];

function normalizeStep(step, index) {
  const stepNumber = step.stepNumber ?? step.step_number ?? index + 1;
  const docs = step.requiredDocuments ?? step.documents ?? step.required_documents ?? [];

  return {
    id: step.id ?? `step-${stepNumber}`,
    stepNumber,
    title: step.title ?? `Step ${stepNumber}`,
    description: step.description ?? step.instructions ?? '',
    requiredDocuments: Array.isArray(docs) ? docs : [docs],
    authorityName: step.authorityName ?? step.authority ?? step.target_authority ?? 'Competent Authority',
    officialLink: (step.officialLink ?? step.officialUrl ?? step.official_url) || null,
    timeLimitDays: step.timeLimitDays ?? (step.timeLimit ? parseInt(step.timeLimit, 10) || 14 : 14),
    tips: step.tips || [],
  };
}

function normalizeWorkflow(workflow) {
  const rawSteps = workflow.steps ?? workflow.workflow_steps ?? [];
  const steps = (Array.isArray(rawSteps) ? rawSteps : []).map(normalizeStep);
  const categorySlug =
    workflow.categoryRel?.slug ??
    workflow.categorySlug ??
    (workflow.category && !workflow.category.includes('-') ? workflow.category : 'labour');

  const normalizedCategory = categorySlug.toUpperCase();
  const normalizedCategoryId = categorySlug.toLowerCase();

  return {
    id: workflow.id,
    categoryId: normalizedCategoryId,
    category: normalizedCategory,
    categoryName: workflow.categoryRel?.name || (normalizedCategory === 'LABOUR' ? 'Labour & Employment Rights' : workflow.title),
    title: workflow.title,
    description: workflow.description ?? '',
    targetAuthority: workflow.target_authority ?? workflow.targetAuthority ?? 'Competent Authority',
    officialUrl: (workflow.officialUrl ?? workflow.official_url) || null,
    totalSteps: steps.length,
    estimatedDays: workflow.estimatedDays ?? (steps.length * 15),
    steps,
  };
}

// ---------------------------------------------------------------------------
// GET /api/workflows — List all workflows
// ---------------------------------------------------------------------------
export async function listWorkflows(_req, res) {
  try {
    if (isPrismaConfigured) {
      const workflows = await prisma.complaintWorkflow.findMany({
        include: {
          categoryRel: { select: { slug: true, name: true } },
          steps: {
            orderBy: { stepNumber: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (workflows && workflows.length > 0) {
        return res.status(200).json({
          success: true,
          data: workflows.map(normalizeWorkflow),
        });
      }
    }

    const supabaseWfs = await supabaseService.getWorkflows();
    if (supabaseWfs && supabaseWfs.length > 0) {
      return res.status(200).json({ success: true, data: supabaseWfs.map(normalizeWorkflow) });
    }

    res.status(200).json({
      success: true,
      data: FALLBACK_WORKFLOWS.map(normalizeWorkflow),
    });
  } catch (err) {
    res.status(200).json({
      success: true,
      data: FALLBACK_WORKFLOWS.map(normalizeWorkflow),
    });
  }
}

// ---------------------------------------------------------------------------
// GET /api/workflows/:category — Get workflow by category or ID
// ---------------------------------------------------------------------------
export async function getWorkflowByCategory(req, res, next) {
  const { category } = req.params;
  const normalizedCategory = category.toUpperCase();
  const lowerCategory = category.toLowerCase();

  try {
    if (isPrismaConfigured) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
      const where = isUuid
        ? { OR: [{ category: { equals: normalizedCategory, mode: 'insensitive' } }, { id: category }, { categoryId: category }] }
        : {
            OR: [
              { category: { equals: normalizedCategory, mode: 'insensitive' } },
              { categoryRel: { slug: { equals: lowerCategory, mode: 'insensitive' } } },
            ],
          };

      const workflow = await prisma.complaintWorkflow.findFirst({
        where,
        include: {
          categoryRel: { select: { slug: true, name: true } },
          steps: {
            orderBy: { stepNumber: 'asc' },
          },
        },
      });

      if (workflow) {
        return res.status(200).json({ success: true, data: normalizeWorkflow(workflow) });
      }
    }

    const supabaseWfs = await supabaseService.getWorkflows(category);
    if (supabaseWfs && supabaseWfs.length > 0) {
      return res.status(200).json({ success: true, data: normalizeWorkflow(supabaseWfs[0]) });
    }

    const fallback = FALLBACK_WORKFLOWS.find(
      (w) =>
        w.category.toLowerCase() === lowerCategory ||
        w.id.toLowerCase() === lowerCategory ||
        (lowerCategory.includes('labour') && w.category === 'LABOUR') ||
        (lowerCategory.includes('domestic') && w.category === 'DOMESTIC_VIOLENCE') ||
        (lowerCategory.includes('consumer') && w.category === 'CONSUMER')
    );

    if (fallback) {
      return res.status(200).json({ success: true, data: normalizeWorkflow(fallback) });
    }

    res.status(404).json({
      success: false,
      error: `No workflow found for category: ${category}`,
    });
  } catch (err) {
    next(err);
  }
}
