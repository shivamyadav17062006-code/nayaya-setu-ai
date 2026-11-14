import { prisma, isPrismaConfigured } from '../lib/prisma.js';
import { supabaseService } from '../services/supabaseService.js';

const FALLBACK_WORKFLOWS = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    category: 'LABOUR',
    title: 'Recovery of Unpaid Salary or Delayed Wages',
    description: 'Statutory legal recovery procedure under the Payment of Wages Act 1936 and Industrial Disputes Act 1947.',
    jurisdiction: 'BOTH',
    targetAuthority: 'Office of the Labour Commissioner & DLSA',
    officialUrl: 'https://shramsuvidha.gov.in',
    eligibilityConditions: [
      'Employed in formal, contract, or informal establishment',
      'Wages withheld beyond statutory 7th/10th day deadline',
      'Valid identity and proof of work/engagement available'
    ],
    applicableLaws: [
      'Payment of Wages Act, 1936 (Sections 5 & 15)',
      'Industrial Relations Code, 2020',
      'Legal Services Authorities Act, 1987 (Free Legal Aid)'
    ],
    requiredDocuments: [
      'Appointment letter or contract agreement',
      'Bank statement showing missing salary credit',
      'Muster roll / attendance screenshot / WhatsApp logs',
      'Salary slips or wage register copy',
      'Formal demand notice sent to employer'
    ],
    verifiedTimelines: 'Statutory 7 days after wage period; 30-day notice response; 90 days tribunal resolution',
    fees: 'Free of Cost for wage claims under ₹1,600/month; nominal ₹10-₹50 stamp duty or free via DLSA',
    escalationRoute: 'Employer HR/Director -> Conciliation Officer (Labour Commissioner) -> Labour Court / Industrial Tribunal',
    appealMechanism: 'Appeal lies to the District Court within 30 days of the Authority order under Section 17 of Payment of Wages Act.',
    officialSourceLinks: [
      'https://shramsuvidha.gov.in',
      'https://labour.gov.in',
      'https://nalsa.gov.in'
    ],
    lastVerifiedAt: new Date().toISOString(),
    verificationStatus: 'VERIFIED',
    estimatedDays: 30,
    steps: [
      {
        id: 's1',
        stepNumber: 1,
        title: 'Compile Employment Proof & Wage Arrears Ledger',
        description: 'Assemble offer letter, salary slips, bank transaction records, WhatsApp chats, or muster roll logs showing worked hours.',
        instructions: 'Assemble offer letter, salary slips, bank transaction records, WhatsApp chats, or muster roll logs showing worked hours.',
        requiredDocuments: ['Bank Statement', 'Appointment Letter / ID card', 'WhatsApp/Email communication', 'Muster roll entry'],
        authorityName: 'Your Records / Trade Union',
        timeLimit: '7 days',
        timeLimitDays: 7,
        fees: 'Free',
        tips: ['UPI logs, bank statements and WhatsApp work instructions are admissible in labour tribunals.'],
      },
      {
        id: 's2',
        stepNumber: 2,
        title: 'Serve a Formal Demand Letter / Legal Notice',
        description: 'Send a registered notice giving employer 7 to 15 days to clear pending arrears failing which formal labour proceedings will commence.',
        instructions: 'Send a registered notice giving employer 7 to 15 days to clear pending arrears failing which formal labour proceedings will commence.',
        requiredDocuments: ['Written Demand Notice', 'Proof of Registered Post or Email Delivery'],
        authorityName: 'Employer Management / HR',
        timeLimit: '14 days',
        timeLimitDays: 14,
        fees: 'Postal charges (~₹35-₹50)',
        tips: ['Keep postal dispatch receipt and delivery tracking screenshot.'],
        conditionalBranch: {
          question: 'Did your employer clear the wages or respond within 14 days?',
          options: [
            { label: 'Yes, full settlement received', nextAction: 'Close dispute and request written settlement voucher.' },
            { label: 'Partial or no payment received', nextAction: 'Proceed to Step 3: File grievance on Shram Suvidha portal.' }
          ]
        }
      },
      {
        id: 's3',
        stepNumber: 3,
        title: 'File Grievance on Shram Suvidha / Samadhan Portal',
        description: 'Register an online dispute on the Ministry of Labour grievance portal or state labour commission website.',
        instructions: 'Register an online dispute on the Ministry of Labour grievance portal or state labour commission website.',
        requiredDocuments: ['Aadhaar Card', 'Demand Notice Copy', 'Company Details'],
        authorityName: 'Labour Commissioner Office / Shram Suvidha',
        officialLink: 'https://shramsuvidha.gov.in',
        timeLimit: '30 days',
        timeLimitDays: 30,
        fees: 'Free of Cost',
      },
      {
        id: 's4',
        stepNumber: 4,
        title: 'File Section 15 Claim before Authority / DLSA',
        description: 'If unresolved, file a formal petition under Section 15 of Payment of Wages Act. Free DLSA representation is guaranteed if needed.',
        instructions: 'If unresolved, file a formal petition under Section 15 of Payment of Wages Act. Free DLSA representation is guaranteed if needed.',
        requiredDocuments: ['Form A (Application under Section 15)', 'Unpaid Wage Calculation Sheet', 'Identity Proof'],
        authorityName: 'District Labour Court / District Legal Services Authority (DLSA)',
        officialLink: 'https://nalsa.gov.in',
        timeLimit: '90 days',
        timeLimitDays: 90,
        fees: 'Free via DLSA (National Legal Services Authority Helpline 15100)',
      },
    ],
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    category: 'DOMESTIC_VIOLENCE',
    title: 'Protection Order, Residence & Shelter against Domestic Abuse',
    description: 'Emergency and judicial remedies under the Protection of Women from Domestic Violence Act, 2005 (PWDVA).',
    jurisdiction: 'BOTH',
    targetAuthority: 'Judicial Magistrate / Protection Officer / One Stop Centre (Sakhi)',
    officialUrl: 'https://nalsa.gov.in',
    eligibilityConditions: [
      'Aggrieved woman living or lived in a domestic relationship with respondent in a shared household',
      'Subjected to physical, emotional, verbal, sexual, or economic domestic abuse'
    ],
    applicableLaws: [
      'Protection of Women from Domestic Violence Act, 2005 (PWDVA)',
      'Indian Penal Code / Bharatiya Nyaya Sanhita (Cruelty provisions)',
      'Legal Services Authorities Act, 1987'
    ],
    requiredDocuments: [
      'Proof of identity (Aadhaar, Voter ID or any available photo ID)',
      'Medical examination report or injury photos (if physical abuse occurred)',
      'Proof of marriage or shared domestic relationship (wedding photos, invitation, ration card)',
      'Domestic Incident Report (DIR) prepared by Protection Officer'
    ],
    verifiedTimelines: 'Emergency response immediate; First Magistrate hearing within 3 days; Application disposal within 60 days',
    fees: 'Completely Free of Cost for all women under Section 12 of PWDVA',
    escalationRoute: 'Dial 112 / 181 -> Sakhi One Stop Centre / Protection Officer -> Judicial Magistrate First Class (JMFC) -> Sessions Court',
    appealMechanism: 'Appeal against Magistrate order lies to the Sessions Court within 30 days under Section 29 of PWDVA.',
    officialSourceLinks: ['https://nalsa.gov.in', 'https://wcd.nic.in'],
    lastVerifiedAt: new Date().toISOString(),
    verificationStatus: 'VERIFIED',
    estimatedDays: 15,
    steps: [
      {
        id: 'dv1',
        stepNumber: 1,
        title: 'Emergency Safety & Helpline Activation',
        description: 'Dial 112 (National Emergency) or 181 (Women Helpline) for immediate police PCR dispatch or emergency medical shelter.',
        instructions: 'Dial 112 (National Emergency) or 181 (Women Helpline) for immediate police PCR dispatch or emergency medical shelter.',
        requiredDocuments: ['No documents required for emergency assistance'],
        authorityName: 'Emergency Response Support System (ERSS 112) / One Stop Centre',
        timeLimit: 'Immediate / 24 hours',
        timeLimitDays: 1,
        fees: 'Free of Cost',
      },
      {
        id: 'dv2',
        stepNumber: 2,
        title: 'Domestic Incident Report (DIR) with Protection Officer',
        description: 'Meet the Taluka/District Protection Officer or an empanelled NGO service provider to prepare a standardized DIR form.',
        instructions: 'Meet the Taluka/District Protection Officer or an empanelled NGO service provider to prepare a standardized DIR form.',
        requiredDocuments: ['Medical examination report (if injured)', 'Proof of shared household', 'Incident journal/dates'],
        authorityName: 'Protection Officer / Sakhi One Stop Centre',
        timeLimit: '3 days',
        timeLimitDays: 3,
        fees: 'Free of Cost',
      },
      {
        id: 'dv3',
        stepNumber: 3,
        title: 'Filing Application under Section 12 before Magistrate',
        description: 'Protection Officer files DIR with the Metropolitan or Judicial Magistrate seeking urgent interim Protection Orders (Sec 18).',
        instructions: 'Protection Officer files DIR with the Metropolitan or Judicial Magistrate seeking urgent interim Protection Orders (Sec 18).',
        requiredDocuments: ['DIR Copy', 'Affidavit under Section 12', 'Relief Claims (Residence, Monetary, Custody)'],
        authorityName: 'Judicial Magistrate First Class (JMFC)',
        officialLink: 'https://nalsa.gov.in',
        timeLimit: '3 to 60 days',
        timeLimitDays: 3,
        fees: 'Free of Cost (DLSA legal representation available)',
      },
    ],
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    category: 'CONSUMER',
    title: 'Consumer Redressal for Defective Products or Deficient Services',
    description: 'Two-tier statutory grievance process under the Consumer Protection Act 2019 using National Consumer Helpline and e-Daakhil.',
    jurisdiction: 'BOTH',
    targetAuthority: 'National Consumer Helpline (NCH) & District Consumer Commission',
    officialUrl: 'https://edaakhil.nic.in',
    eligibilityConditions: [
      'Individual consumer who buys goods or hires services for consideration (not for commercial resale)',
      'Defect in goods or deficiency in services occurred within 2 years of cause of action'
    ],
    applicableLaws: [
      'Consumer Protection Act, 2019 (Sections 34, 35 & 47)',
      'Consumer Protection (Consumer Disputes Redressal Commissions) Rules, 2020',
      'Consumer Protection (E-Commerce) Rules, 2020'
    ],
    requiredDocuments: [
      'Tax invoice or cash memo',
      'Warranty / guarantee card or service agreement',
      'Photographs/videos depicting the defect or proof of deficient service',
      'Correspondence history with seller/manufacturer',
      'Payment transaction receipt / bank debit statement'
    ],
    verifiedTimelines: 'NCH grievance resolution: 15-45 days; Commission admission: 21 days; Final disposal: 90 days',
    fees: 'Nil fee up to ₹5 Lakhs claim value; ₹200 for ₹5L-₹10L; ₹400 for ₹10L-₹20L; ₹1,000 for ₹20L-₹50L',
    escalationRoute: 'Seller Grievance Officer -> National Consumer Helpline (1915) -> District Commission (e-Daakhil) -> State Commission -> NCDRC',
    appealMechanism: 'Appeal against District Commission order lies to State Consumer Commission within 45 days with 50% deposit.',
    officialSourceLinks: ['https://consumerhelpline.gov.in', 'https://edaakhil.nic.in'],
    lastVerifiedAt: new Date().toISOString(),
    verificationStatus: 'VERIFIED',
    estimatedDays: 45,
    steps: [
      {
        id: 'c1',
        stepNumber: 1,
        title: 'Preserve Purchase and Complaint Records',
        description: 'Keep the invoice, warranty card, delivery receipt, photographs of the defect, and all written communication with the seller.',
        instructions: 'Keep the invoice, warranty card, delivery receipt, photographs of the defect, and all written communication with the seller.',
        requiredDocuments: ['Tax invoice', 'Warranty card', 'Photos or videos of the defect', 'Customer support ticket'],
        authorityName: 'Your Records',
        timeLimit: '7 days',
        timeLimitDays: 7,
        fees: 'Free',
      },
      {
        id: 'c2',
        stepNumber: 2,
        title: 'Raise a Written Complaint with the Seller',
        description: 'Send a written complaint to the seller or e-commerce platform and allow a reasonable time for repair, replacement or refund.',
        instructions: 'Send a written complaint to the seller or e-commerce platform and allow a reasonable time for repair, replacement or refund.',
        requiredDocuments: ['Complaint copy', 'Proof of dispatch'],
        authorityName: 'Seller / Platform Grievance Officer',
        timeLimit: '15 days',
        timeLimitDays: 15,
        fees: 'Free',
        conditionalBranch: {
          question: 'Did the merchant or platform resolve your grievance or offer full refund?',
          options: [
            { label: 'Yes, replacement or refund issued', nextAction: 'Close dispute once funds reflect in account.' },
            { label: 'No, request refused or ignored', nextAction: 'Proceed to Step 3: Register grievance on National Consumer Helpline.' }
          ]
        }
      },
      {
        id: 'c3',
        stepNumber: 3,
        title: 'Escalate to the National Consumer Helpline',
        description: 'Register the grievance on consumerhelpline.gov.in or dial 1915. Many registered companies resolve complaints at this stage.',
        instructions: 'Register the grievance on consumerhelpline.gov.in or dial 1915. Many registered companies resolve complaints at this stage.',
        requiredDocuments: ['Invoice Copy', 'Seller Response / Refusal'],
        authorityName: 'National Consumer Helpline (NCH)',
        officialLink: 'https://consumerhelpline.gov.in',
        timeLimit: '30 days',
        timeLimitDays: 30,
        fees: 'Free of Cost',
      },
      {
        id: 'c4',
        stepNumber: 4,
        title: 'File a Complaint before the District Commission',
        description: 'If unresolved, file a complaint electronically on the e-Daakhil portal before the District Consumer Disputes Redressal Commission.',
        instructions: 'If unresolved, file a complaint electronically on the e-Daakhil portal before the District Consumer Disputes Redressal Commission.',
        requiredDocuments: ['e-Daakhil petition', 'Affidavit', 'Supporting Documents', 'Court Fee Payment Receipt'],
        authorityName: 'District Consumer Disputes Redressal Commission',
        officialLink: 'https://edaakhil.nic.in',
        timeLimit: '90 days',
        timeLimitDays: 90,
        fees: 'Nil up to ₹5 Lakh claim value; ₹200 for ₹5L-₹10L',
      },
    ],
  },
];

function normalizeStep(step, index) {
  const stepNumber = step.stepNumber ?? step.step_number ?? index + 1;
  const docs = step.requiredDocuments?.length ? step.requiredDocuments : (step.documents?.length ? step.documents : (step.required_documents || []));

  return {
    id: step.id ?? `step-${stepNumber}`,
    stepNumber,
    title: step.title ?? `Step ${stepNumber}`,
    description: step.description ?? step.instructions ?? '',
    instructions: step.instructions ?? step.description ?? '',
    requiredDocuments: Array.isArray(docs) ? docs : [docs],
    authorityName: step.authority ?? step.authorityName ?? step.target_authority ?? 'Competent Authority',
    officialLink: (step.officialUrl ?? step.officialLink ?? step.official_url) || null,
    timeLimit: step.timeLimit ?? (step.timeLimitDays ? `${step.timeLimitDays} days` : '14 days'),
    timeLimitDays: step.timeLimitDays ?? (step.timeLimit ? parseInt(step.timeLimit, 10) || 14 : 14),
    fees: step.fees || 'Free of Cost',
    conditionalBranch: step.conditionalBranch ?? step.conditional_branch ?? null,
    tips: Array.isArray(step.tips) ? step.tips : [],
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
    jurisdiction: workflow.jurisdiction ?? 'BOTH',
    state: workflow.state || null,
    targetAuthority: workflow.targetAuthority ?? workflow.target_authority ?? 'Competent Authority',
    officialUrl: (workflow.officialUrl ?? workflow.official_url) || null,
    eligibilityConditions: workflow.eligibilityConditions ?? workflow.eligibility_conditions ?? [],
    applicableLaws: workflow.applicableLaws ?? workflow.applicable_laws ?? [],
    requiredDocuments: workflow.requiredDocuments ?? workflow.required_documents ?? [],
    verifiedTimelines: workflow.verifiedTimelines ?? workflow.verified_timelines ?? `${steps.length * 15} days`,
    fees: workflow.fees || 'Free of Cost / Statutory Nominal',
    escalationRoute: workflow.escalationRoute ?? workflow.escalation_route ?? '',
    appealMechanism: workflow.appealMechanism ?? workflow.appeal_mechanism ?? '',
    officialSourceLinks: workflow.officialSourceLinks ?? workflow.official_source_links ?? [],
    lastVerifiedAt: workflow.lastVerifiedAt ?? workflow.last_verified_at ?? null,
    verificationStatus: workflow.verificationStatus ?? workflow.verification_status ?? 'VERIFIED',
    totalSteps: steps.length,
    estimatedDays: workflow.estimatedDays ?? (steps.length * 15),
    steps,
  };
}

// ---------------------------------------------------------------------------
// GET /api/workflows — List all workflows (with search, category, jurisdiction filter)
// ---------------------------------------------------------------------------
export async function listWorkflows(req, res) {
  const { q, category, jurisdiction } = req.query;

  try {
    if (isPrismaConfigured) {
      const where = {};
      if (category && category !== 'ALL') {
        where.OR = [
          { category: { equals: category.toUpperCase(), mode: 'insensitive' } },
          { categoryRel: { slug: { equals: category.toLowerCase(), mode: 'insensitive' } } }
        ];
      }
      if (jurisdiction) {
        where.jurisdiction = { in: [jurisdiction.toUpperCase(), 'BOTH'] };
      }
      if (q && q.trim()) {
        const query = q.trim();
        where.AND = [
          ...(where.AND || []),
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { targetAuthority: { contains: query, mode: 'insensitive' } },
            ]
          }
        ];
      }

      const workflows = await prisma.complaintWorkflow.findMany({
        where,
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
          count: workflows.length,
          data: workflows.map(normalizeWorkflow),
        });
      }
    }

    const supabaseWfs = await supabaseService.getWorkflows();
    if (supabaseWfs && supabaseWfs.length > 0) {
      let filtered = supabaseWfs.map(normalizeWorkflow);
      if (category && category !== 'ALL') {
        filtered = filtered.filter(w => w.category === category.toUpperCase() || w.categoryId === category.toLowerCase());
      }
      if (q && q.trim()) {
        const query = q.toLowerCase();
        filtered = filtered.filter(w =>
          w.title.toLowerCase().includes(query) ||
          w.description.toLowerCase().includes(query) ||
          w.targetAuthority.toLowerCase().includes(query)
        );
      }
      return res.status(200).json({ success: true, count: filtered.length, data: filtered });
    }

    let fallbackData = FALLBACK_WORKFLOWS.map(normalizeWorkflow);
    if (category && category !== 'ALL') {
      fallbackData = fallbackData.filter(w => w.category === category.toUpperCase() || w.categoryId === category.toLowerCase());
    }
    if (q && q.trim()) {
      const query = q.toLowerCase();
      fallbackData = fallbackData.filter(w =>
        w.title.toLowerCase().includes(query) ||
        w.description.toLowerCase().includes(query) ||
        w.targetAuthority.toLowerCase().includes(query)
      );
    }

    res.status(200).json({
      success: true,
      count: fallbackData.length,
      data: fallbackData,
    });
  } catch (err) {
    res.status(200).json({
      success: true,
      count: FALLBACK_WORKFLOWS.length,
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
        ? { OR: [{ id: category }, { category: { equals: normalizedCategory, mode: 'insensitive' } }, { categoryId: category }] }
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
        w.id === category ||
        w.category.toLowerCase() === lowerCategory ||
        w.categoryId?.toLowerCase() === lowerCategory ||
        (lowerCategory.includes('labour') && w.category === 'LABOUR') ||
        (lowerCategory.includes('domestic') && w.category === 'DOMESTIC_VIOLENCE') ||
        (lowerCategory.includes('consumer') && w.category === 'CONSUMER')
    );

    if (fallback) {
      return res.status(200).json({ success: true, data: normalizeWorkflow(fallback) });
    }

    res.status(404).json({
      success: false,
      error: `No workflow found for category or ID: ${category}`,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/workflows/:id/progress — Get user/session progress for workflow
// ---------------------------------------------------------------------------
export async function getWorkflowProgress(req, res, next) {
  const { id } = req.params;
  const userId = req.user?.id || null;
  const sessionId = req.headers['x-session-id'] || req.query.sessionId || null;

  if (!userId && !sessionId) {
    return res.status(200).json({
      success: true,
      data: null,
      message: 'No user or session identifier provided. Progress not stored.',
    });
  }

  try {
    if (isPrismaConfigured) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let workflowId = id;

      if (!isUuid) {
        const wf = await prisma.complaintWorkflow.findFirst({
          where: {
            OR: [
              { category: { equals: id.toUpperCase(), mode: 'insensitive' } },
              { categoryRel: { slug: { equals: id.toLowerCase(), mode: 'insensitive' } } }
            ]
          },
          select: { id: true }
        });
        if (wf) workflowId = wf.id;
      }

      const progress = await prisma.userWorkflowProgress.findFirst({
        where: {
          workflowId,
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(sessionId ? [{ sessionId }] : []),
          ],
        },
        orderBy: { updatedAt: 'desc' },
      });

      return res.status(200).json({
        success: true,
        data: progress || null,
      });
    }

    res.status(200).json({
      success: true,
      data: null,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/workflows/:id/progress — Save or update user/session progress
// ---------------------------------------------------------------------------
export async function updateWorkflowProgress(req, res, next) {
  const { id } = req.params;
  const userId = req.user?.id || null;
  const sessionId = req.headers['x-session-id'] || req.body?.sessionId || null;

  if (!userId && !sessionId) {
    return res.status(400).json({
      success: false,
      error: 'Either authentication token or x-session-id header is required to save progress.',
    });
  }

  const {
    currentStep = 1,
    completedSteps = [],
    checkedDocuments = [],
    branchChoices = {},
    notes = '',
    isCompleted = false,
  } = req.body;

  try {
    if (isPrismaConfigured) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let workflowId = id;

      if (!isUuid) {
        const wf = await prisma.complaintWorkflow.findFirst({
          where: {
            OR: [
              { category: { equals: id.toUpperCase(), mode: 'insensitive' } },
              { categoryRel: { slug: { equals: id.toLowerCase(), mode: 'insensitive' } } }
            ]
          },
          select: { id: true }
        });
        if (!wf) {
          return res.status(404).json({ success: false, error: 'Workflow not found.' });
        }
        workflowId = wf.id;
      }

      // Check existing progress
      const existing = await prisma.userWorkflowProgress.findFirst({
        where: {
          workflowId,
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(sessionId ? [{ sessionId }] : []),
          ],
        },
      });

      let saved;
      if (existing) {
        saved = await prisma.userWorkflowProgress.update({
          where: { id: existing.id },
          data: {
            currentStep: Number(currentStep) || 1,
            completedSteps: Array.isArray(completedSteps) ? completedSteps.map(Number) : [],
            checkedDocuments: Array.isArray(checkedDocuments) ? checkedDocuments : [],
            branchChoices: branchChoices || {},
            notes: typeof notes === 'string' ? notes : '',
            isCompleted: Boolean(isCompleted),
            ...(userId && !existing.userId ? { userId } : {}),
          },
        });
      } else {
        saved = await prisma.userWorkflowProgress.create({
          data: {
            workflowId,
            userId,
            sessionId: userId ? sessionId : (sessionId || 'anon_session'),
            currentStep: Number(currentStep) || 1,
            completedSteps: Array.isArray(completedSteps) ? completedSteps.map(Number) : [],
            checkedDocuments: Array.isArray(checkedDocuments) ? checkedDocuments : [],
            branchChoices: branchChoices || {},
            notes: typeof notes === 'string' ? notes : '',
            isCompleted: Boolean(isCompleted),
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: saved,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        workflowId: id,
        currentStep,
        completedSteps,
        checkedDocuments,
        branchChoices,
        notes,
        isCompleted,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/workflows/:id/progress — Reset user/session progress
// ---------------------------------------------------------------------------
export async function resetWorkflowProgress(req, res, next) {
  const { id } = req.params;
  const userId = req.user?.id || null;
  const sessionId = req.headers['x-session-id'] || req.query.sessionId || null;

  if (!userId && !sessionId) {
    return res.status(400).json({
      success: false,
      error: 'Either authentication token or x-session-id is required to reset progress.',
    });
  }

  try {
    if (isPrismaConfigured) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let workflowId = id;

      if (!isUuid) {
        const wf = await prisma.complaintWorkflow.findFirst({
          where: {
            OR: [
              { category: { equals: id.toUpperCase(), mode: 'insensitive' } },
              { categoryRel: { slug: { equals: id.toLowerCase(), mode: 'insensitive' } } }
            ]
          },
          select: { id: true }
        });
        if (wf) workflowId = wf.id;
      }

      await prisma.userWorkflowProgress.deleteMany({
        where: {
          workflowId,
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(sessionId ? [{ sessionId }] : []),
          ],
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Workflow progress has been reset successfully.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Workflow progress reset.',
    });
  } catch (err) {
    next(err);
  }
}
