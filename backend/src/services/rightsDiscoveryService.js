/**
 * NyayaSaathi — Personalized Know Your Rights Discovery Service
 *
 * Implements the core rights discovery pipeline:
 * Situation Intake -> Domain Classification -> Follow-Up Question Generation ->
 * Hybrid pgvector & Statutory Section Retrieval -> Beneficiary Mapping ->
 * Remedy Synthesis & Grounded Citizen Dossier.
 */

import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma.js';
import { embeddingService } from '../../../ai-engine/src/services/embeddingService.js';

export const INDIAN_STATES_AND_UTS = [
  'ANDHRA PRADESH', 'ARUNACHAL PRADESH', 'ASSAM', 'BIHAR', 'CHHATTISGARH',
  'GOA', 'GUJARAT', 'HARYANA', 'HIMACHAL PRADESH', 'JHARKHAND',
  'KARNATAKA', 'KERALA', 'MADHYA PRADESH', 'MAHARASHTRA', 'MANIPUR',
  'MEGHALAYA', 'MIZORAM', 'NAGALAND', 'ODISHA', 'PUNJAB',
  'RAJASTHAN', 'SIKKIM', 'TAMIL NADU', 'TELANGANA', 'TRIPURA',
  'UTTAR PRADESH', 'UTTARAKHAND', 'WEST BENGAL',
  'ANDAMAN AND NICOBAR ISLANDS', 'CHANDIGARH', 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU',
  'DELHI', 'JAMMU AND KASHMIR', 'LADAKH', 'LAKSHADWEEP', 'PUDUCHERRY'
];

export class RightsDiscoveryService {
  /**
   * Returns metadata for discovery wizard (beneficiary groups, categories, states)
   */
  async getDiscoveryMetadata() {
    const [beneficiaries, categories] = await Promise.all([
      prisma.beneficiary.findMany({
        select: { id: true, name: true, slug: true, description: true, icon: true },
        orderBy: { name: 'asc' },
      }),
      prisma.rightCategory.findMany({
        select: { id: true, name: true, slug: true, description: true, icon: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      beneficiaries,
      categories,
      states: INDIAN_STATES_AND_UTS,
    };
  }

  /**
   * Classifies citizen situation and dynamically generates 2-3 minimal follow-up questions
   */
  classifyAndGenerateFollowUps(situationText = '', context = {}) {
    const text = situationText.toLowerCase();
    const detectedDomains = [];
    const suggestedBeneficiaries = [];
    const followUpQuestions = [];

    // 1. Labour & Wage Detection
    if (
      text.includes('wage') || text.includes('salary') || text.includes('unpaid') ||
      text.includes('employer') || text.includes('fired') || text.includes('boss') ||
      text.includes('factory') || text.includes('overtime') || text.includes('termination')
    ) {
      detectedDomains.push('LABOUR_WAGES');
      suggestedBeneficiaries.push('workers');
      followUpQuestions.push({
        id: 'wage_timeframe',
        question: 'Did the delay or deduction happen within the last 12 months?',
        explanation: 'Under Section 15(2) of the Payment of Wages Act, 1936, claims are normally filed within a 12-month limitation period.',
        options: ['Yes, within 12 months', 'No, more than a year ago', 'Not sure / Ongoing'],
      });
      followUpQuestions.push({
        id: 'written_proof',
        question: 'Do you have written proof of employment or wage records (e.g. appointment letter, bank statement, payslip, or messages)?',
        explanation: 'Documentary evidence establishes the employer-employee relationship and wage rate before the Labour Authority.',
        options: ['Yes, have payslips/messages', 'Only verbal agreement', 'Bank transfer records only'],
      });
    }

    // 2. Domestic Violence & Women's Protections
    if (
      text.includes('domestic violence') || text.includes('husband') || text.includes('in-laws') ||
      text.includes('beaten') || text.includes('abuse') || text.includes('harass') ||
      text.includes('kicked out') || text.includes('marital home') || text.includes('dowry')
    ) {
      detectedDomains.push('WOMEN_PROTECTION');
      suggestedBeneficiaries.push('women');
      followUpQuestions.push({
        id: 'shared_household',
        question: 'Are you currently living in the shared household, or have you been forced out?',
        explanation: 'Section 17 of PWDVA guarantees an absolute right of residence in the shared household regardless of ownership.',
        options: ['Still living in the house', 'Forced out / locked out', 'Relocated temporarily for safety'],
      });
      followUpQuestions.push({
        id: 'immediate_safety',
        question: 'Is there immediate physical danger requiring urgent police protection?',
        explanation: 'Section 18 permits the Magistrate to pass ex-parte emergency protection orders restraining the respondent.',
        options: ['Yes, need immediate protection', 'No immediate physical threat, but need legal orders', 'Facing verbal/economic abuse'],
      });
    }

    // 3. Consumer Grievance
    if (
      text.includes('defective') || text.includes('product') || text.includes('refund') ||
      text.includes('warranty') || text.includes('seller') || text.includes('amazon') ||
      text.includes('flipkart') || text.includes('e-commerce') || text.includes('cheated') ||
      text.includes('service deficiency') || text.includes('bought')
    ) {
      detectedDomains.push('CONSUMER_PROTECTION');
      suggestedBeneficiaries.push('consumers');
      followUpQuestions.push({
        id: 'purchase_proof',
        question: 'Do you have an invoice, receipt, or order ID for the purchase?',
        explanation: 'Section 2(7) of the Consumer Protection Act, 2019 requires establishing that consideration was paid or promised.',
        options: ['Yes, have formal invoice/order ID', 'Have payment proof only', 'No receipt'],
      });
      followUpQuestions.push({
        id: 'seller_notice',
        question: 'Have you formally communicated the grievance to the seller/manufacturer in writing?',
        explanation: 'A written grievance provides evidence of deficiency in service before the District Consumer Commission.',
        options: ['Yes, sent email/registered complaint', 'Phoned customer support only', 'Not yet contacted'],
      });
    }

    // 4. Tenancy & Property
    if (
      text.includes('tenant') || text.includes('landlord') || text.includes('evict') ||
      text.includes('rent') || text.includes('security deposit') || text.includes('lease')
    ) {
      detectedDomains.push('TENANCY_RIGHTS');
      suggestedBeneficiaries.push('tenants');
      followUpQuestions.push({
        id: 'rent_agreement',
        question: 'Is there a written rent agreement or rent receipts?',
        explanation: 'State Rent Control Acts protect tenants against arbitrary eviction if tenancy is evidenced.',
        options: ['Registered rent agreement', 'Unregistered agreement / receipts', 'Oral agreement only'],
      });
      followUpQuestions.push({
        id: 'eviction_notice',
        question: 'Has a written notice to vacate been served by the landlord?',
        explanation: 'Statutory law prohibits forceful extra-judicial eviction without due process of law.',
        options: ['Yes, formal notice received', 'Threatened verbally with force', 'No notice given'],
      });
    }

    // 5. Senior Citizens Maintenance
    if (
      text.includes('senior citizen') || text.includes('elderly') || text.includes('parents') ||
      text.includes('old age') || text.includes('abandoned') || text.includes('ill-treated by children')
    ) {
      detectedDomains.push('SENIOR_CITIZENS');
      suggestedBeneficiaries.push('seniors');
      followUpQuestions.push({
        id: 'financial_independence',
        question: 'Are you unable to maintain yourself from your own income or savings?',
        explanation: 'Section 4 of the Maintenance and Welfare of Parents Act, 2007 entitles parents/seniors unable to maintain themselves to claim support.',
        options: ['Cannot maintain myself', 'Have limited pension/savings', 'Property exists but children occupied it'],
      });
    }

    // 6. Persons with Disabilities
    if (
      text.includes('disability') || text.includes('handicap') || text.includes('wheelchair') ||
      text.includes('blind') || text.includes('deaf') || text.includes('pwd') ||
      text.includes('reasonable accommodation') || text.includes('accessible')
    ) {
      detectedDomains.push('DISABILITY_RIGHTS');
      suggestedBeneficiaries.push('pwd');
      followUpQuestions.push({
        id: 'disability_certificate',
        question: 'Do you hold a Disability Certificate or Unique Disability ID (UDID)?',
        explanation: 'Section 2(r) defines benchmark disability (40% or more) for statutory accommodations and affirmative action.',
        options: ['Yes, have UDID card / certificate', 'Medical documents exist', 'Not yet assessed'],
      });
    }

    // 7. Police Arrest & Detention Safeguards
    if (
      text.includes('arrest') || text.includes('police') || text.includes('custody') ||
      text.includes('lockup') || text.includes('detained') || text.includes('police station') ||
      text.includes('fir')
    ) {
      detectedDomains.push('CRIMINAL_CUSTODY');
      suggestedBeneficiaries.push('accused');
      followUpQuestions.push({
        id: 'magistrate_production',
        question: 'Has the person been produced before a Judicial Magistrate within 24 hours of arrest?',
        explanation: 'Article 22(2) of the Constitution and Section 58 BNSS (formerly Section 57 CrPC) mandate production before a Magistrate within 24 hours excluding journey time.',
        options: ['Not produced and over 24 hours', 'Produced before Magistrate', 'Detained less than 24 hours'],
      });
    }

    // 8. Education & Child Rights
    if (
      text.includes('school') || text.includes('admission') || text.includes('child') ||
      text.includes('student') || text.includes('elementary education') || text.includes('rte')
    ) {
      detectedDomains.push('CHILD_EDUCATION');
      suggestedBeneficiaries.push('children');
      suggestedBeneficiaries.push('students');
      followUpQuestions.push({
        id: 'child_age',
        question: 'Is the child between 6 and 14 years of age?',
        explanation: 'Article 21A and RTE Act, 2009 mandate free and compulsory elementary education for ages 6 to 14.',
        options: ['Between 6 and 14 years', 'Below 6 years', 'Above 14 years'],
      });
    }

    // Default if no domain strongly matched
    if (detectedDomains.length === 0) {
      detectedDomains.push('GENERAL_CIVIL');
      followUpQuestions.push({
        id: 'monetary_loss',
        question: 'Has this situation caused you direct financial loss or physical harm?',
        explanation: 'Helps determine whether civil damages, consumer compensation, or criminal complaint procedures apply.',
        options: ['Direct financial loss', 'Physical harm or harassment', 'Denial of service/rights only'],
      });
      followUpQuestions.push({
        id: 'government_or_private',
        question: 'Is the opposite party a government department or a private company/individual?',
        explanation: 'Constitutional writ remedies apply against Government entities, while statutory/contractual remedies apply to private entities.',
        options: ['Government department / authority', 'Private company or business', 'Private individual'],
      });
    }

    return {
      detectedDomains,
      suggestedBeneficiaries: Array.from(new Set(suggestedBeneficiaries)),
      followUpQuestions: followUpQuestions.slice(0, 3),
    };
  }

  /**
   * Discovers and structures applicable rights, laws, remedies, and action steps
   */
  async discoverRights(payload = {}) {
    const {
      situation = '',
      context = {},
      userConsent = true,
    } = payload;

    if (!situation || situation.trim().length < 10) {
      return {
        success: false,
        error: 'Please describe your situation in at least 10 characters to identify applicable rights.',
      };
    }

    const state = context.state ? context.state.trim().toUpperCase() : null;
    const beneficiarySlug = context.beneficiaryCategory || null;
    const answers = context.answers || {};

    // 1. Generate query embedding & perform vector search in pgvector
    const queryEmbedding = await embeddingService.embedText(situation);
    const vectorStr = `[${queryEmbedding.join(',')}]`;

    let matchedChunks = [];
    try {
      matchedChunks = await prisma.$queryRaw`
        SELECT c.id, c.section_id, c.content, c.chunk_number, c.source_url,
               (1 - (c.embedding <=> ${vectorStr}::vector)) as similarity,
               s.section_number, s.section_title, s.simplified_text, s.original_text,
               a.id as act_id, a.title as act_title, a.year as act_year, a.jurisdiction, a.state
        FROM public.legal_chunks c
        JOIN public.legal_sections s ON c.section_id = s.id
        JOIN public.legal_acts a ON s.act_id = a.id
        WHERE a.verification_status IN ('PUBLISHED', 'VERIFIED')
          AND s.verification_status IN ('PUBLISHED', 'VERIFIED')
        ORDER BY c.embedding <=> ${vectorStr}::vector ASC
        LIMIT 6;
      `;
    } catch (err) {
      console.warn('[RightsDiscovery] Vector search error:', err.message);
    }

    // 2. Classify domains
    const classification = this.classifyAndGenerateFollowUps(situation, context);

    // 3. Retrieve relevant sections and remedies
    const sectionIds = matchedChunks.map(m => m.section_id).filter(Boolean);

    // Fallback/additional direct lookup for detected domains
    const domainSections = await this.queryDomainSections(classification.detectedDomains, state);
    const allSectionIds = Array.from(new Set([...sectionIds, ...domainSections.map(s => s.id)]));

    // Fetch full section metadata, parent acts, and attached remedies
    const detailedSections = await prisma.legalSection.findMany({
      where: { id: { in: allSectionIds } },
      include: {
        act: true,
        remedies: true,
        beneficiaries: { include: { beneficiary: true } },
      },
    });

    // 4. Beneficiary Entitlements Check
    const beneficiaryEntitlements = await this.resolveBeneficiaryEntitlements(
      beneficiarySlug || classification.suggestedBeneficiaries[0],
      answers
    );

    // 5. Structure Applicable Rights
    const applicableRights = [];
    for (const sec of detailedSections) {
      const whyApplicable = this.synthesizeWhyApplicable(sec, situation, answers);
      const conditions = this.extractConditions(sec);

      applicableRights.push({
        id: sec.id,
        title: sec.title || `Right under ${sec.sectionNumber}`,
        actTitle: sec.act.title,
        actYear: sec.act.year,
        actNumber: sec.act.actNumber,
        sectionNumber: sec.sectionNumber,
        jurisdiction: sec.act.jurisdiction,
        state: sec.act.state,
        whyApplicable,
        conditions: conditions.conditions,
        exceptions: conditions.exceptions,
        simplifiedExplanation: sec.simplifiedText || sec.originalText.slice(0, 200) + '...',
        originalStatutoryText: sec.originalText,
        officialSourceUrl: sec.act.sourceUrl,
        verificationStatus: sec.act.verificationStatus,
        verificationDate: sec.act.lastVerifiedAt || sec.act.updatedAt,
      });
    }

    // 6. Aggregate Recommended Remedies
    const remedies = [];
    for (const sec of detailedSections) {
      if (Array.isArray(sec.remedies) && sec.remedies.length > 0) {
        for (const rem of sec.remedies) {
          remedies.push({
            id: rem.id,
            sectionId: sec.id,
            associatedAct: sec.act.title,
            sectionNumber: sec.sectionNumber,
            title: rem.title,
            remedyType: rem.remedyType,
            description: rem.description,
            authority: rem.authority || 'Appropriate Statutory Authority',
            timeLimit: rem.timeLimit || 'Statutory limitation period applies',
            contactInfo: rem.contactInfo || 'Local District Office',
            officialUrl: rem.officialUrl,
            steps: this.generateActionStepsForRemedy(rem, sec),
          });
        }
      }
    }

    // 7. General Next Steps & Helplines
    const actionSteps = this.synthesizeActionSteps(classification.detectedDomains, answers);
    const helplines = this.getOfficialHelplines(classification.detectedDomains);

    // 8. Confidence Assessment
    const confidenceAssessment = this.calculateConfidence(detailedSections, answers, classification.detectedDomains);

    // 9. Save Discovery Result if User Consented (Privacy-compliant session)
    let sessionToken = null;
    if (userConsent) {
      sessionToken = uuidv4();
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO public.saved_rights_discoveries (
            session_token, situation_summary, context_data, discovery_results, user_consent
          ) VALUES ($1, $2, $3::jsonb, $4::jsonb, $5);`,
          sessionToken,
          situation.slice(0, 150),
          JSON.stringify({ state, beneficiarySlug, answers }),
          JSON.stringify({
            rightsCount: applicableRights.length,
            domains: classification.detectedDomains,
            timestamp: new Date().toISOString(),
          }),
          true
        );
      } catch (saveErr) {
        console.warn('[RightsDiscovery] Failed to persist saved session:', saveErr.message);
      }
    }

    return {
      success: true,
      data: {
        sessionToken,
        detectedDomains: classification.detectedDomains,
        situationSummary: situation.length > 120 ? situation.slice(0, 120) + '...' : situation,
        applicableRights,
        beneficiaryEntitlements,
        recommendedRemedies: remedies,
        actionSteps,
        helplines,
        confidence: confidenceAssessment.level,
        confidenceExplanation: confidenceAssessment.explanation,
        missingInfoNote: confidenceAssessment.missingInfoNote,
        disclaimer: 'Statutory Notice: NyayaSaathi is a Know Your Rights legal awareness platform. This analysis informs citizens of statutory rights under verified Indian law and does not constitute formal advocate representation. For free court counsel, contact NALSA Helpline 15100 or your District Legal Services Authority.',
      },
    };
  }

  /**
   * Helper to retrieve sections matching detected domains
   */
  async queryDomainSections(domains = [], state = null) {
    const sectionQueries = [];

    if (domains.includes('LABOUR_WAGES')) {
      sectionQueries.push({
        act: { title: { contains: 'Wages', mode: 'insensitive' } },
        sectionNumber: { in: ['Section 5', 'Section 15', 'Section 6'] },
      });
    }
    if (domains.includes('WOMEN_PROTECTION')) {
      sectionQueries.push({
        act: { title: { contains: 'Domestic Violence', mode: 'insensitive' } },
        sectionNumber: { in: ['Section 3', 'Section 12', 'Section 17', 'Section 18'] },
      });
    }
    if (domains.includes('CONSUMER_PROTECTION')) {
      sectionQueries.push({
        act: { title: { contains: 'Consumer Protection', mode: 'insensitive' } },
      });
    }
    if (domains.includes('TENANCY_RIGHTS')) {
      sectionQueries.push({
        OR: [
          { act: { title: { contains: 'Rent Control', mode: 'insensitive' } } },
          { act: { title: { contains: 'Transfer of Property', mode: 'insensitive' } } },
        ],
      });
    }
    if (domains.includes('SENIOR_CITIZENS')) {
      sectionQueries.push({
        act: { title: { contains: 'Senior Citizens', mode: 'insensitive' } },
      });
    }
    if (domains.includes('DISABILITY_RIGHTS')) {
      sectionQueries.push({
        act: { title: { contains: 'Disabilities', mode: 'insensitive' } },
      });
    }
    if (domains.includes('CRIMINAL_CUSTODY')) {
      sectionQueries.push({
        act: { title: { contains: 'Constitution', mode: 'insensitive' } },
        sectionNumber: { in: ['Article 22', 'Article 21'] },
      });
    }
    if (domains.includes('CHILD_EDUCATION')) {
      sectionQueries.push({
        OR: [
          { act: { title: { contains: 'Compulsory Education', mode: 'insensitive' } } },
          { sectionNumber: 'Article 21A' },
        ],
      });
    }

    if (sectionQueries.length === 0) return [];

    return prisma.legalSection.findMany({
      where: {
        OR: sectionQueries,
        verificationStatus: { in: ['PUBLISHED', 'VERIFIED'] },
        act: { verificationStatus: { in: ['PUBLISHED', 'VERIFIED'] } },
      },
      take: 8,
    });
  }

  /**
   * Explains why a specific statutory section applies to the citizen's situation
   */
  synthesizeWhyApplicable(section, situation, answers) {
    const act = section.act.title;
    const secNum = section.sectionNumber;

    if (act.includes('Payment of Wages') || act.includes('Wages')) {
      return `Applies directly because your situation describes delayed or withheld earned wages. Under ${secNum}, the employer is mandated by law to release salary by the statutory deadline, and withholding it allows you to seek back-pay plus up to 10x penalty.`;
    }
    if (act.includes('Domestic Violence')) {
      return `Applies because the described conduct constitutes domestic abuse under ${secNum}. The statute grants women enforceable protection, safe shelter, and judicial orders prohibiting the abuser from entering your residence or workplace.`;
    }
    if (act.includes('Consumer Protection')) {
      return `Applies because purchasing a good or paying for a service makes you a statutory consumer under ${secNum}. Defective goods or refusal to refund enables formal complaint filing before the District Consumer Commission.`;
    }
    if (act.includes('Senior Citizens')) {
      return `Applies because as a senior citizen, ${secNum} legally obligates adult children and legal heirs to provide adequate maintenance. The Sub-Divisional Magistrate can order monthly allowance within 90 days.`;
    }
    if (act.includes('Disabilities')) {
      return `Applies because ${secNum} prohibits discrimination and makes denial of reasonable accommodation, accessible infrastructure, or fair employment conditions a statutory violation.`;
    }
    if (act.includes('Rent Control')) {
      return `Applies because ${secNum} protects verified tenants against arbitrary rent extortion and summary eviction without a formal court or Competent Authority decree.`;
    }
    if (act.includes('Constitution') && secNum.includes('22')) {
      return `Applies as an inviolable Fundamental Right under ${secNum}. Any detained individual must be informed of arrest grounds, permitted advocate consultation, and brought before a Magistrate within 24 hours.`;
    }
    if (act.includes('Constitution') && secNum.includes('21A')) {
      return `Applies as a Fundamental Right under ${secNum}. Every child between 6 and 14 has an absolute constitutional entitlement to free elementary education in a neighborhood school.`;
    }

    return `Applies under ${act} (${secNum}) to provide statutory safeguards, procedural remedies, and regulatory accountability for the described incident.`;
  }

  /**
   * Extracts conditions and exceptions for legal precision
   */
  extractConditions(section) {
    const text = section.originalText;
    const conditions = [];
    const exceptions = [];

    if (text.includes('Provided that')) {
      const parts = text.split(/Provided that/i);
      for (let i = 1; i < parts.length; i++) {
        exceptions.push(parts[i].trim().slice(0, 150));
      }
    }

    if (section.act.title.includes('Payment of Wages')) {
      conditions.push('Claim must typically be filed within 12 months from the date wages were payable.');
      conditions.push('Covers establishments where less than 1,000 employees are paid by 7th, or 10th day if more.');
    } else if (section.act.title.includes('Consumer Protection')) {
      conditions.push('Consumer complaint must be filed within 2 years from the date cause of action arose.');
      conditions.push('Goods or services must not have been purchased for commercial resale purpose.');
    } else if (section.act.title.includes('Senior Citizens')) {
      conditions.push('Senior citizen must be aged 60 or above and unable to maintain himself/herself.');
    } else if (section.act.title.includes('Domestic Violence')) {
      conditions.push('Parties must have lived together in a shared household in a domestic relationship.');
    } else {
      conditions.push('Applicant must demonstrate standing as an affected citizen or lawful beneficiary.');
    }

    return { conditions, exceptions };
  }

  /**
   * Resolves beneficiary-specific entitlements like Free Legal Aid under LSAA 1987 Sec. 12
   */
  async resolveBeneficiaryEntitlements(beneficiarySlug, answers) {
    const entitlements = [];

    // All women, children, workers, disabled, SC/ST get FREE legal aid under Section 12 of LSAA 1987
    const freeAidBeneficiaries = ['women', 'children', 'workers', 'pwd', 'sc-st', 'tribal', 'accused'];
    if (freeAidBeneficiaries.includes(beneficiarySlug)) {
      entitlements.push({
        title: '100% Free Court Representation (Section 12, Legal Services Authorities Act, 1987)',
        description: 'You are legally entitled to free legal aid regardless of income. The District Legal Services Authority (DLSA) will appoint an advocate, pay court fees, and cover certified copy expenses.',
        authority: 'District Legal Services Authority (DLSA) / NALSA',
        helpline: '15100 (24x7 Toll-Free)',
        portalUrl: 'https://nalsa.gov.in',
      });
    }

    if (beneficiarySlug === 'seniors') {
      entitlements.push({
        title: 'Summary Maintenance Hearing (Section 5, Senior Citizens Act, 2007)',
        description: 'Right to a summary trial before the Sub-Divisional Officer without heavy court fee stamp duties. Decision mandated within 90 days.',
        authority: 'Maintenance Tribunal (SDM Office)',
        helpline: '14567 (Elder Line)',
        portalUrl: 'https://socialjustice.gov.in',
      });
    }

    if (beneficiarySlug === 'consumers') {
      entitlements.push({
        title: 'Direct Online Filing without Mandatory Lawyer (Consumer Protection Act, 2019)',
        description: 'Citizens can file grievances directly on e-Daakhil without hiring a private advocate. Video conferencing hearings are permitted.',
        authority: 'District Consumer Disputes Redressal Commission',
        helpline: '1915 (National Consumer Helpline)',
        portalUrl: 'https://edaakhil.nic.in',
      });
    }

    return entitlements;
  }

  /**
   * Generates step-by-step remedy action items
   */
  generateActionStepsForRemedy(rem, sec) {
    if (rem.remedyType === 'AUTHORITY' && sec.act.title.includes('Payment of Wages')) {
      return [
        'Collect payslips, bank statements, appointment letters, and communication with employer.',
        'Issue a formal written demand notice to the employer demanding release of arrears within 7 days.',
        'If unpaid, file Form A application under Section 15 before the local Labour Commissioner.',
        'Request maximum statutory compensation (up to 10x) under Section 15(3).',
      ];
    }
    if (rem.remedyType === 'COURT' && sec.act.title.includes('Domestic Violence')) {
      return [
        'Contact the local Protection Officer (appointed at the Taluka/District level) or DLSA at 15100.',
        'Prepare Domestic Incident Report (DIR) under Section 9(1)(b).',
        'File Application under Section 12 before the Judicial Magistrate First Class (JMFC).',
        'Request immediate ex-parte interim Protection Order (Section 18) and Residence Order (Section 19).',
      ];
    }
    if (rem.remedyType === 'TRIBUNAL' && sec.act.title.includes('Consumer')) {
      return [
        'Register on e-Daakhil (edaakhil.nic.in) or call National Consumer Helpline at 1915.',
        'Upload invoice, proof of payment, photographs of defective item, and email grievance trail.',
        'Pay standard nominal online consumer filing fee.',
        'Track hearing notices and appear via video-conference without hiring a lawyer.',
      ];
    }

    return [
      `Draft formal petition or complaint citing ${sec.act.title} (${sec.sectionNumber}).`,
      `Submit before ${rem.authority}.`,
      'Obtain acknowledgment copy with date stamp.',
      'Track proceedings and seek free assistance from DLSA if required.',
    ];
  }

  /**
   * Action steps tailored to legal domains
   */
  synthesizeActionSteps(domains, answers) {
    const steps = [
      'Preserve and organize all relevant documents (invoices, receipts, chat logs, notices, agreements).',
      'Send a formal, polite written communication stating the facts and demanding statutory redress.',
      'If unresolved, file a formal complaint before the designated authority or tribunal.',
      'Contact NALSA Helpline 15100 for free court advocate appointment if legal representation is needed.',
    ];
    return steps;
  }

  /**
   * Official emergency and grievance helplines
   */
  getOfficialHelplines(domains) {
    const helplines = [
      { name: 'NALSA 24x7 Legal Aid Helpline', number: '15100', description: 'Free legal advice and advocate representation across India.' },
      { name: 'National Emergency Response System', number: '112', description: 'Immediate police, medical, or fire assistance.' },
    ];

    if (domains.includes('WOMEN_PROTECTION')) {
      helplines.push({ name: 'National Women Helpline', number: '181', description: '24x7 support for women facing domestic violence or harassment.' });
    }
    if (domains.includes('CONSUMER_PROTECTION')) {
      helplines.push({ name: 'National Consumer Helpline', number: '1915', description: 'Consumer grievance registration and dispute guidance.' });
    }
    if (domains.includes('SENIOR_CITIZENS')) {
      helplines.push({ name: 'Elderline (National Helpline for Senior Citizens)', number: '14567', description: 'Free support, abuse rescue, and legal maintenance guidance.' });
    }
    if (domains.includes('LABOUR_WAGES')) {
      helplines.push({ name: 'Shram Suvidha Portal', number: '14434', description: 'Labour grievance registration and compliance helpline.' });
    }

    return helplines;
  }

  /**
   * Confidence level calculation with plain-language explanations
   */
  calculateConfidence(sections, answers, domains) {
    if (sections.length >= 2 && Object.keys(answers).length >= 1) {
      return {
        level: 'HIGH',
        explanation: 'Strong match: Verified statutory sections and active legal remedies directly govern the facts described.',
        missingInfoNote: 'Verification of exact documentary dates and contracts will confirm precise statutory limitation deadlines.',
      };
    }
    if (sections.length >= 1) {
      return {
        level: 'MEDIUM',
        explanation: 'Probable match: Core legal provisions apply, but answering follow-up questions will sharpen specific remedies.',
        missingInfoNote: 'Clarifying the exact timeline and written agreements will determine whether tribunal or civil court jurisdiction applies.',
      };
    }
    return {
      level: 'LOW',
      explanation: 'Preliminary guidance: The situation may involve complex civil or criminal matters requiring personal counsel review.',
      missingInfoNote: 'Please provide more details regarding dates, contracts, and parties involved for deeper statutory matching.',
    };
  }

  /**
   * Retrieves saved session by token
   */
  async getSession(token) {
    const rows = await prisma.$queryRaw`
      SELECT session_token, situation_summary, context_data, discovery_results, created_at, expires_at
      FROM public.saved_rights_discoveries
      WHERE session_token = ${token}
      LIMIT 1;
    `;
    return rows[0] || null;
  }

  /**
   * Purges saved session (User Privacy Control)
   */
  async deleteSession(token) {
    const count = await prisma.$executeRawUnsafe(
      `DELETE FROM public.saved_rights_discoveries WHERE session_token = $1;`,
      token
    );
    return count > 0;
  }
}

export const rightsDiscoveryService = new RightsDiscoveryService();
export default rightsDiscoveryService;
