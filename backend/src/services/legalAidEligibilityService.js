/**
 * NyayaSaathi — Phase 14: Legal Aid Eligibility Rules Engine
 *
 * Implements:
 * 1. Legal Services Authorities Act, 1987 (LSAA 1987), Section 12
 * 2. Distinguishes automatic statutory exemptions (Sec. 12(a)-(g)) from income-based thresholds (Sec. 12(h))
 * 3. State-specific and Court-level income threshold queries (no universal assumption!)
 * 4. Four-state outcome: POTENTIALLY_ELIGIBLE, POTENTIALLY_NOT_ELIGIBLE, MORE_INFORMATION_REQUIRED, HUMAN_VERIFICATION_RECOMMENDED
 * 5. Explanations and statutory disclaimers for all outcomes
 */

import { prisma, isPrismaConfigured } from '../lib/prisma.js';

// Fallback income limits by state if database table unavailable
const FALLBACK_INCOME_LIMITS = {
  ALL_INDIA_SUPREME_COURT: 500000,
  DELHI: 300000,
  MAHARASHTRA: 300000,
  KARNATAKA: 300000,
  TAMIL_NADU: 300000,
  UTTAR_PRADESH: 300000,
  WEST_BENGAL: 300000,
  RAJASTHAN: 300000,
  GUJARAT: 300000,
  KERALA: 300000,
  MADHYA_PRADESH: 200000,
  BIHAR: 150000,
  PUNJAB: 300000,
  HARYANA: 300000,
  TELANGANA: 300000,
  ANDHRA_PRADESH: 300000,
  ODISHA: 300000,
  ASSAM: 300000,
  HIMACHAL_PRADESH: 300000,
  JAMMU_AND_KASHMIR: 300000,
  GOA: 300000,
  UTTARAKHAND: 300000,
  JHARKHAND: 300000,
  CHHATTISGARH: 200000,
  TRIPURA: 150000,
  MEGHALAYA: 300000,
  MANIPUR: 200000,
  NAGALAND: 150000,
  MIZORAM: 150000,
  ARUNACHAL_PRADESH: 200000,
  SIKKIM: 300000,
  DEFAULT_STATE: 300000,
};

const STATUTORY_DISCLAIMER =
  'Statutory Notice: This is an automated preliminary evaluation based on Section 12 of the Legal Services Authorities Act, 1987. ' +
  'It does not constitute an official grant or sanction of legal aid. Official assignment of a panel advocate is subject to verification ' +
  'of self-declaration/affidavit by the Secretary of the respective District Legal Services Authority (DLSA) or High Court/Supreme Court Legal Services Committee.';

export const legalAidEligibilityService = {
  /**
   * Evaluates legal aid eligibility based on LSAA 1987 criteria
   */
  async evaluateEligibility(input = {}) {
    const {
      category = '',
      state = '',
      courtLevel = 'SUBORDINATE_COURT', // SUBORDINATE_COURT | HIGH_COURT | SUPREME_COURT
      annualIncome = null,
      circumstances = [],
      age = null,
      gender = '',
      userConsent = false,
      userId = null,
      sessionId = null,
    } = input;

    // Normalization
    const normCategory = (category || '').trim().toUpperCase();
    const normGender = (gender || '').trim().toUpperCase();
    const normState = (state || '').trim();
    const normCourt = (courtLevel || 'SUBORDINATE_COURT').trim().toUpperCase();
    const normCircumstances = (Array.isArray(circumstances) ? circumstances : [circumstances])
      .map((c) => String(c).trim().toUpperCase());

    // -------------------------------------------------------------------------
    // STEP 1: Check for Missing Critical Information
    // -------------------------------------------------------------------------
    if (!normCategory && normCircumstances.length === 0 && !normGender && age === null) {
      return {
        status: 'MORE_INFORMATION_REQUIRED',
        isStatutoryExempt: false,
        statutoryClause: null,
        explanation:
          'Please provide your beneficiary category (e.g. woman, child, SC/ST, person with disability, workman) or your state and annual income to determine legal aid eligibility.',
        criteriaBreakdown: {
          categoryProvided: false,
          incomeRequired: true,
        },
        disclaimer: STATUTORY_DISCLAIMER,
        helpline: '15100',
      };
    }

    // -------------------------------------------------------------------------
    // STEP 2: Automatic Statutory Exemptions (Section 12(a) - 12(g))
    // Under Section 12, protected groups are entitled to free legal aid WITHOUT ANY income ceiling.
    // -------------------------------------------------------------------------

    // 2a. Section 12(a) — Scheduled Caste or Scheduled Tribe
    if (normCategory === 'SC_ST' || normCategory === 'SC' || normCategory === 'ST' || normCircumstances.includes('CASTE_ATROCITY')) {
      const assessment = {
        status: 'POTENTIALLY_ELIGIBLE',
        isStatutoryExempt: true,
        statutoryClause: 'Section 12(a) of Legal Services Authorities Act, 1987',
        explanation:
          'You are statutorily entitled to 100% free legal services as a member of a Scheduled Caste (SC) or Scheduled Tribe (ST). ' +
          'No income ceiling applies to this category under Section 12(a) of the Act.',
        criteriaBreakdown: {
          statutoryGround: 'SC / ST Membership',
          incomeCeilingApplies: false,
          entitlements: ['Free Court Advocate', 'Exemption from Court Fees', 'Free Certified Copies & Drafting', 'Jail Representation'],
        },
        disclaimer: STATUTORY_DISCLAIMER,
        helpline: '15100',
      };
      await this._maybePersistAssessment(assessment, input);
      return assessment;
    }

    // 2b. Section 12(b) — Victim of Human Trafficking or Begar (Article 23)
    if (
      normCategory === 'TRAFFICKING_BEGAR' ||
      normCategory === 'TRAFFICKING' ||
      normCircumstances.includes('TRAFFICKING') ||
      normCircumstances.includes('BEGAR') ||
      normCircumstances.includes('BONDED_LABOUR')
    ) {
      const assessment = {
        status: 'POTENTIALLY_ELIGIBLE',
        isStatutoryExempt: true,
        statutoryClause: 'Section 12(b) of Legal Services Authorities Act, 1987',
        explanation:
          'You are statutorily entitled to free legal services as a victim of human trafficking or bonded labour (begar) under Article 23 of the Constitution. ' +
          'No income ceiling applies.',
        criteriaBreakdown: {
          statutoryGround: 'Trafficking / Forced Labour Victim',
          incomeCeilingApplies: false,
          entitlements: ['Free Legal Representation', 'Emergency Protection Orders', 'Victim Compensation Scheme Assistance'],
        },
        disclaimer: STATUTORY_DISCLAIMER,
        helpline: '15100',
      };
      await this._maybePersistAssessment(assessment, input);
      return assessment;
    }

    // 2c. Section 12(c) — Woman or Child
    const isWoman = normCategory === 'WOMAN' || normCategory === 'WOMEN' || normGender === 'FEMALE';
    const isChild = normCategory === 'CHILD' || (age !== null && Number(age) < 18);

    if (isWoman || isChild) {
      const entityLabel = isWoman && isChild ? 'Woman / Minor Child' : isWoman ? 'Woman' : 'Child (under 18 years)';
      const assessment = {
        status: 'POTENTIALLY_ELIGIBLE',
        isStatutoryExempt: true,
        statutoryClause: 'Section 12(c) of Legal Services Authorities Act, 1987',
        explanation:
          `You are statutorily entitled to 100% free legal aid as a ${entityLabel}. ` +
          'Under Section 12(c) of the Legal Services Authorities Act, 1987, all women and children are unconditionally entitled to free legal representation in all civil, criminal, and family courts without any income limit.',
        criteriaBreakdown: {
          statutoryGround: entityLabel,
          incomeCeilingApplies: false,
          entitlements: ['Free Panel Advocate in Court', 'No Court Fees', 'Free Case Drafting & Process Fees', 'One Stop Centre (OSC) Sakhi Coordination'],
        },
        disclaimer: STATUTORY_DISCLAIMER,
        helpline: isWoman ? '181 / 15100' : '1098 / 15100',
      };
      await this._maybePersistAssessment(assessment, input);
      return assessment;
    }

    // 2d. Section 12(d) — Person with a Disability
    if (
      normCategory === 'DISABILITY' ||
      normCategory === 'DISABLED' ||
      normCircumstances.includes('DISABILITY') ||
      normCircumstances.includes('SPECIALLY_ABLED')
    ) {
      const assessment = {
        status: 'POTENTIALLY_ELIGIBLE',
        isStatutoryExempt: true,
        statutoryClause: 'Section 12(d) of Legal Services Authorities Act, 1987',
        explanation:
          'You are statutorily entitled to free legal aid as a person with a disability (as recognized under the Rights of Persons with Disabilities Act, 2016). ' +
          'No income ceiling applies under Section 12(d).',
        criteriaBreakdown: {
          statutoryGround: 'Person with Disability',
          incomeCeilingApplies: false,
          entitlements: ['Free Advocate in Court', 'Accessible Hearing & Barrier-Free Legal Aid', 'Zero Court Fees'],
        },
        disclaimer: STATUTORY_DISCLAIMER,
        helpline: '15100',
      };
      await this._maybePersistAssessment(assessment, input);
      return assessment;
    }

    // 2e. Section 12(e) — Victim of Mass Disaster, Ethnic Violence, Flood, Drought, Earthquake, or Industrial Disaster
    if (
      normCategory === 'DISASTER_VICTIM' ||
      normCircumstances.includes('MASS_DISASTER') ||
      normCircumstances.includes('ETHNIC_VIOLENCE') ||
      normCircumstances.includes('INDUSTRIAL_DISASTER') ||
      normCircumstances.includes('NATURAL_CALAMITY')
    ) {
      const assessment = {
        status: 'POTENTIALLY_ELIGIBLE',
        isStatutoryExempt: true,
        statutoryClause: 'Section 12(e) of Legal Services Authorities Act, 1987',
        explanation:
          'You are statutorily entitled to free legal aid as a person under circumstances of undeserved want (victim of a mass disaster, ethnic violence, caste atrocity, flood, earthquake, or industrial disaster). ' +
          'No income ceiling applies under Section 12(e).',
        criteriaBreakdown: {
          statutoryGround: 'Disaster / Calamity / Violence Victim',
          incomeCeilingApplies: false,
          entitlements: ['Immediate Legal Services', 'Disaster Relief Coordination', 'Compensation Claim Representation'],
        },
        disclaimer: STATUTORY_DISCLAIMER,
        helpline: '15100',
      };
      await this._maybePersistAssessment(assessment, input);
      return assessment;
    }

    // 2f. Section 12(f) — Industrial Workman
    if (
      normCategory === 'INDUSTRIAL_WORKMAN' ||
      normCategory === 'WORKER' ||
      normCircumstances.includes('INDUSTRIAL_DISPUTE') ||
      normCircumstances.includes('FACTORY_ACCIDENT')
    ) {
      const assessment = {
        status: 'POTENTIALLY_ELIGIBLE',
        isStatutoryExempt: true,
        statutoryClause: 'Section 12(f) of Legal Services Authorities Act, 1987',
        explanation:
          'You are statutorily entitled to free legal services as an industrial workman under the Industrial Disputes Act, 1947. ' +
          'No income ceiling applies for industrial workers pursuing labour tribunal and court claims under Section 12(f).',
        criteriaBreakdown: {
          statutoryGround: 'Industrial Workman',
          incomeCeilingApplies: false,
          entitlements: ['Free Labour Court Representation', 'Conciliation Legal Aid', 'Payment of Wages Recovery Aid'],
        },
        disclaimer: STATUTORY_DISCLAIMER,
        helpline: '15100',
      };
      await this._maybePersistAssessment(assessment, input);
      return assessment;
    }

    // 2g. Section 12(g) — Person in Custody / Juvenile Home / Mental Health Facility
    if (
      normCategory === 'CUSTODY' ||
      normCategory === 'PRISONER' ||
      normCategory === 'UNDER_TRIAL' ||
      normCircumstances.includes('IN_CUSTODY') ||
      normCircumstances.includes('ARREST_CUSTODY') ||
      normCircumstances.includes('JUVENILE_HOME') ||
      normCircumstances.includes('PSYCHIATRIC_HOSPITAL')
    ) {
      const assessment = {
        status: 'POTENTIALLY_ELIGIBLE',
        isStatutoryExempt: true,
        statutoryClause: 'Section 12(g) of Legal Services Authorities Act, 1987',
        explanation:
          'You are statutorily entitled to free legal aid as a person in custody, including police lockup, judicial jail custody, juvenile observation home, or psychiatric care facility. ' +
          'Every undertrial and convict is entitled to free legal representation regardless of financial means.',
        criteriaBreakdown: {
          statutoryGround: 'Person in Custody',
          incomeCeilingApplies: false,
          entitlements: ['Mandatory Remand Advocate', 'Free Bail Application Drafting', 'Jail Legal Clinic Lawyer'],
        },
        disclaimer: STATUTORY_DISCLAIMER,
        helpline: '15100',
      };
      await this._maybePersistAssessment(assessment, input);
      return assessment;
    }

    // -------------------------------------------------------------------------
    // STEP 3: Special State Policy Categories (Senior Citizens & Transgender Persons)
    // -------------------------------------------------------------------------
    if (normCategory === 'TRANSGENDER' || normCategory === 'TRANS') {
      const assessment = {
        status: 'POTENTIALLY_ELIGIBLE',
        isStatutoryExempt: true,
        statutoryClause: 'NALSA v. Union of India (2014) & State Legal Services Guidelines',
        explanation:
          'Following the landmark Supreme Court ruling in NALSA v. Union of India (2014), transgender persons are entitled to affirmative legal services. ' +
          'Several State Legal Services Authorities provide free legal aid unconditionally or with higher income thresholds (up to ₹4,00,000).',
        criteriaBreakdown: {
          statutoryGround: 'Transgender Person (NALSA Guidelines)',
          incomeCeilingApplies: false,
          entitlements: ['Free Panel Advocate', 'Identity Documentation Legal Support'],
        },
        disclaimer: STATUTORY_DISCLAIMER,
        helpline: '15100',
      };
      await this._maybePersistAssessment(assessment, input);
      return assessment;
    }

    if (normCategory === 'SENIOR_CITIZEN' || (age !== null && Number(age) >= 60)) {
      // Senior citizens have special thresholds in Delhi (₹4,00,000) and priority DLSA assistance
      if (annualIncome !== null && !isNaN(Number(annualIncome)) && Number(annualIncome) <= 400000) {
        const assessment = {
          status: 'POTENTIALLY_ELIGIBLE',
          isStatutoryExempt: false,
          statutoryClause: 'Maintenance and Welfare of Parents and Senior Citizens Act & State SLSA Rules',
          explanation:
            'As a Senior Citizen (age 60+), you qualify for priority legal assistance before the Maintenance Tribunal and Subordinate Courts. ' +
            'Your declared income is within the senior citizen legal aid ceiling.',
          criteriaBreakdown: {
            statutoryGround: 'Senior Citizen',
            incomeThreshold: 400000,
            annualIncomeDeclared: Number(annualIncome),
          },
          disclaimer: STATUTORY_DISCLAIMER,
          helpline: '14567 (Elderline) / 15100',
        };
        await this._maybePersistAssessment(assessment, input);
        return assessment;
      }
    }

    // -------------------------------------------------------------------------
    // STEP 4: Income-Based Evaluation under Section 12(h)
    // For general citizens not falling in affirmative categories, eligibility
    // depends on the verified statutory threshold of their specific state/court.
    // -------------------------------------------------------------------------

    // 4a. If income is not provided, we cannot make an automated determination
    if (annualIncome === null || annualIncome === undefined || isNaN(Number(annualIncome))) {
      // Determine what threshold applies to their state so we can inform them accurately
      const thresholdInfo = await this._getIncomeThreshold(normState, normCourt);

      return {
        status: 'MORE_INFORMATION_REQUIRED',
        isStatutoryExempt: false,
        statutoryClause: 'Section 12(h) of Legal Services Authorities Act, 1987',
        explanation:
          `You do not fall under automatic affirmative categories (women, children, SC/ST, disability, custody, industrial workmen). ` +
          `Eligibility under Section 12(h) is based on annual income. In ${thresholdInfo.jurisdictionName} for ${thresholdInfo.courtLevelLabel}, ` +
          `the statutory income ceiling is ₹${thresholdInfo.amount.toLocaleString('en-IN')} per annum. ` +
          `Please provide your approximate annual income to assess whether you qualify.`,
        criteriaBreakdown: {
          applicableState: thresholdInfo.jurisdictionName,
          courtLevel: thresholdInfo.courtLevel,
          statutoryThreshold: thresholdInfo.amount,
          officialNotification: thresholdInfo.notification,
          officialSource: thresholdInfo.source,
          incomeProvided: false,
        },
        disclaimer: STATUTORY_DISCLAIMER,
        helpline: '15100',
      };
    }

    const declaredIncome = Math.max(0, Number(annualIncome));
    const thresholdInfo = await this._getIncomeThreshold(normState, normCourt);

    if (declaredIncome <= thresholdInfo.amount) {
      const assessment = {
        status: 'POTENTIALLY_ELIGIBLE',
        isStatutoryExempt: false,
        statutoryClause: 'Section 12(h) of Legal Services Authorities Act, 1987',
        explanation:
          `Your declared annual income of ₹${declaredIncome.toLocaleString('en-IN')} is within the statutory income ceiling of ` +
          `₹${thresholdInfo.amount.toLocaleString('en-IN')} prescribed under Section 12(h) by the ${thresholdInfo.jurisdictionName} for ${thresholdInfo.courtLevelLabel}. ` +
          `You are potentially eligible for free legal representation, exemption from court fees, and assistance by a panel advocate.`,
        criteriaBreakdown: {
          applicableJurisdiction: thresholdInfo.jurisdictionName,
          courtLevel: thresholdInfo.courtLevel,
          declaredAnnualIncome: declaredIncome,
          statutoryIncomeCeiling: thresholdInfo.amount,
          statutoryNotification: thresholdInfo.notification,
          officialSource: thresholdInfo.source,
          entitlements: ['Free Panel Advocate', 'Court Fee Exemption', 'Lok Adalat Pre-Litigation Conciliation'],
        },
        disclaimer: STATUTORY_DISCLAIMER,
        helpline: '15100',
      };
      await this._maybePersistAssessment(assessment, input);
      return assessment;
    } else {
      const assessment = {
        status: 'POTENTIALLY_NOT_ELIGIBLE',
        isStatutoryExempt: false,
        statutoryClause: 'Section 12(h) of Legal Services Authorities Act, 1987',
        explanation:
          `Your declared annual income of ₹${declaredIncome.toLocaleString('en-IN')} exceeds the statutory limit of ` +
          `₹${thresholdInfo.amount.toLocaleString('en-IN')} prescribed for ${thresholdInfo.courtLevelLabel} in ${thresholdInfo.jurisdictionName}. ` +
          `While you do not qualify for a free court-appointed panel lawyer under Section 12(h), you can still access ` +
          `free walk-in legal advice at any DLSA Front Office, mediation centers, and dispute resolution through Lok Adalats.`,
        criteriaBreakdown: {
          applicableJurisdiction: thresholdInfo.jurisdictionName,
          courtLevel: thresholdInfo.courtLevel,
          declaredAnnualIncome: declaredIncome,
          statutoryIncomeCeiling: thresholdInfo.amount,
          statutoryNotification: thresholdInfo.notification,
          officialSource: thresholdInfo.source,
          accessibleRemedies: ['DLSA Front Office Legal Advice Clinics (Free for all)', 'Lok Adalat Dispute Settlement (Free for all)', 'Mediation & Conciliation Centers'],
        },
        disclaimer: STATUTORY_DISCLAIMER,
        helpline: '15100',
      };
      await this._maybePersistAssessment(assessment, input);
      return assessment;
    }
  },

  /**
   * Retrieves verified statutory income threshold for a specific state and court level
   */
  async _getIncomeThreshold(stateName, courtLevel = 'SUBORDINATE_COURT') {
    const isSupremeCourt = courtLevel === 'SUPREME_COURT';

    if (isSupremeCourt) {
      return {
        amount: 500000,
        jurisdictionName: 'Supreme Court of India (All-India)',
        courtLevel: 'SUPREME_COURT',
        courtLevelLabel: 'Supreme Court of India',
        notification: 'Supreme Court Legal Services Committee Regulations, 1996 / NALSA Rules',
        source: 'https://sclsc.gov.in',
      };
    }

    if (isPrismaConfigured && stateName) {
      try {
        const record = await prisma.legalAidIncomeLimit.findFirst({
          where: {
            state: { equals: stateName.trim(), mode: 'insensitive' },
            courtLevel: { in: [courtLevel, 'SUBORDINATE_COURT'] },
          },
        });

        if (record) {
          return {
            amount: record.annualIncomeLimit,
            jurisdictionName: record.state,
            courtLevel: record.courtLevel,
            courtLevelLabel: record.courtLevel === 'HIGH_COURT' ? 'High Court' : 'Subordinate / District Courts',
            notification: record.applicableNotification || 'State Legal Services Authority Rules',
            source: record.officialSource || 'https://nalsa.gov.in/slsa',
          };
        }
      } catch (err) {
        console.warn('Could not query legal_aid_income_limits table:', err.message);
      }
    }

    // Static fallback if state not in database
    const key = (stateName || '').toUpperCase().replace(/\s+/g, '_');
    const fallbackAmount = FALLBACK_INCOME_LIMITS[key] || FALLBACK_INCOME_LIMITS.DEFAULT_STATE;

    return {
      amount: fallbackAmount,
      jurisdictionName: stateName || 'State Jurisdiction',
      courtLevel,
      courtLevelLabel: courtLevel === 'HIGH_COURT' ? 'High Court' : 'Subordinate / District Courts',
      notification: 'State Legal Services Authority Rules',
      source: 'https://nalsa.gov.in/slsa',
    };
  },

  /**
   * Persists assessment record if user consent is given or authenticated
   */
  async _maybePersistAssessment(assessment, input) {
    if (!input.userConsent && !input.userId) {
      return; // Do not persist income or sensitive circumstances without consent
    }

    if (isPrismaConfigured) {
      try {
        await prisma.legalAidAssessment.create({
          data: {
            userId: input.userId || null,
            sessionId: input.sessionId || null,
            status: assessment.status,
            category: input.category || null,
            state: input.state || null,
            courtLevel: input.courtLevel || 'SUBORDINATE_COURT',
            annualIncome: input.userConsent && input.annualIncome ? Number(input.annualIncome) : null,
            isStatutoryExempt: Boolean(assessment.isStatutoryExempt),
            statutoryClause: assessment.statutoryClause || null,
            explanation: assessment.explanation,
            criteriaBreakdown: assessment.criteriaBreakdown || {},
            disclaimer: assessment.disclaimer,
            userConsent: Boolean(input.userConsent),
          },
        });
      } catch (err) {
        console.warn('Failed to persist legal aid assessment:', err.message);
      }
    }
  },
};
