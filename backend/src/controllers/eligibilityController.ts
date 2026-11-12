import { Request, Response, NextFunction } from 'express';
import { EligibilityRequest, EligibilityResult, EligibilityScheme } from '../types/index';

/**
 * NALSA annual income threshold (in INR).
 * Per NALSA guidelines, persons with annual income below ₹1,00,000 are eligible
 * for free legal services. Some states have higher thresholds.
 */
const NALSA_INCOME_THRESHOLD = 100000; // ₹1 lakh

/** Beneficiary types that are automatically eligible regardless of income. */
const AUTOMATIC_ELIGIBILITY_TYPES = new Set([
  'SC_ST',
  'WOMEN', // Women victims of domestic violence, trafficking, etc.
  'CHILD',
  'DISABILITY',
  'VICTIM_DISASTER',
  'VICTIM_ETHNIC_VIOLENCE',
  'INDUSTRIAL_WORKMAN',
  'CUSTODY', // Persons in custody
]);

function buildSchemes(
  request: EligibilityRequest,
  isEligible: boolean
): EligibilityScheme[] {
  const schemes: EligibilityScheme[] = [];

  if (isEligible) {
    schemes.push({
      name: 'NALSA Free Legal Services',
      authority: 'National Legal Services Authority (NALSA)',
      description:
        'Free legal representation, advice, and aid through the district or state Legal Services Authority.',
      benefits: [
        'Free court fee and process fees',
        'Free legal representation by a panel advocate',
        'Free legal advice and consultation',
        'Mediation and Lok Adalat access',
      ],
      eligibilityCriteria: [
        'Annual income below ₹1,00,000 (varies by state)',
        'OR member of SC/ST community',
        'OR woman or child',
        'OR person with disability',
        'OR victim of trafficking, mass disaster, or ethnic violence',
        'OR person in custody',
      ],
      applicationProcess:
        'Visit your District Legal Services Authority (DLSA) office with income proof, ID, and case documents. Apply in writing or use the NALSA mobile app.',
      officialUrl: 'https://nalsa.gov.in',
      contactInfo: 'Toll-free: 15100 | NALSA Legal Aid App',
    });

    // State Legal Services Authority
    schemes.push({
      name: `${request.state} State Legal Services Authority (SLSA)`,
      authority: `${request.state} SLSA`,
      description: `State-level legal services authority providing free aid and Lok Adalats in ${request.state}.`,
      benefits: [
        'Free legal aid in state courts',
        'Lok Adalat settlements',
        'Pre-litigation mediation',
        'Legal awareness camps',
      ],
      eligibilityCriteria: ['Same as NALSA criteria, with possible higher income threshold in this state'],
      applicationProcess: `Contact the ${request.state} SLSA directly or through the DLSA of your district.`,
      officialUrl: `https://nalsa.gov.in/slsa`,
      contactInfo: 'Contact your District Legal Services Authority (DLSA)',
    });
  }

  // Category-specific schemes
  if (request.category === 'LABOUR' || request.beneficiaryType === 'WORKERS') {
    schemes.push({
      name: 'Labour Commissioner / Payment of Wages Authority',
      authority: 'State Labour Department',
      description:
        'Free remedy for wage disputes, wrongful termination, and minimum wage violations under the Payment of Wages Act, 1936.',
      benefits: [
        'Claim unpaid wages with up to 10× penalty on employer',
        'No court fees for claims',
        'Fast disposal within 3 months',
      ],
      eligibilityCriteria: ['Any worker/employee whose wages have been unlawfully deducted or withheld'],
      applicationProcess:
        'File a written complaint with the Payment of Wages Authority (usually the Labour Commissioner or Assistant Labour Commissioner of your area) within 1 year of the violation.',
      officialUrl: 'https://labour.gov.in',
      contactInfo: 'State Labour Department helpline',
    });
  }

  if (request.category === 'WOMEN' || request.beneficiaryType === 'WOMEN') {
    schemes.push({
      name: 'Protection Officer / One Stop Centre (Sakhi)',
      authority: 'Ministry of Women and Child Development',
      description:
        'One Stop Centres (Sakhi) provide integrated support for women affected by violence — legal, medical, psychological, and shelter.',
      benefits: [
        'Emergency response within 24 hours',
        'Free legal aid and police assistance',
        'Medical help and shelter',
        'Psychological counselling',
      ],
      eligibilityCriteria: ['Any woman or girl who has experienced violence of any kind'],
      applicationProcess:
        'Visit the nearest One Stop Centre (Sakhi) or call the Women Helpline 181. No documentation required at first contact.',
      officialUrl: 'https://wcd.nic.in/schemes/one-stop-centre-scheme-osc',
      contactInfo: 'Women Helpline: 181 | Police: 112',
    });
  }

  if (request.beneficiaryType === 'CHILD' || (request.age !== undefined && request.age < 18)) {
    schemes.push({
      name: 'Child Welfare Committee (CWC) / CHILDLINE',
      authority: 'Ministry of Women and Child Development',
      description:
        'Free legal protection, counselling and rehabilitation for children in need of care and protection.',
      benefits: [
        'Emergency response 24/7',
        'Free legal representation for the child',
        'Rehabilitation and restoration support',
        'Free education support under RTE Act',
      ],
      eligibilityCriteria: ['Any child (person under 18 years of age)'],
      applicationProcess: 'Call CHILDLINE 1098. Available 24/7 across India.',
      officialUrl: 'https://childlineindia.org',
      contactInfo: 'CHILDLINE: 1098 (Free, 24/7)',
    });
  }

  if (request.beneficiaryType === 'SC_ST') {
    schemes.push({
      name: 'SC/ST Protection Cell & Legal Aid',
      authority: 'State Social Welfare Department / NALSA',
      description:
        'Special legal aid for Scheduled Caste and Scheduled Tribe members under the Scheduled Castes and Scheduled Tribes (Prevention of Atrocities) Act, 1989.',
      benefits: [
        'Free legal aid from first complaint stage',
        'Government-appointed special public prosecutor',
        'Right to victim compensation',
        'Free travel to courts/authorities',
      ],
      eligibilityCriteria: ['Must be a member of a Scheduled Caste or Scheduled Tribe'],
      applicationProcess:
        'Register FIR with police under SC/ST Atrocities Act and simultaneously apply to the District Legal Services Authority for legal aid.',
      officialUrl: 'https://nalsa.gov.in',
      contactInfo: 'State Social Welfare Department | NALSA: 15100',
    });
  }

  return schemes;
}

/**
 * POST /api/eligibility
 * Checks NALSA legal aid eligibility based on income, state, category, and beneficiary type.
 */
export async function checkEligibility(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const request = req.body as EligibilityRequest;
    const { income, beneficiaryType, state, category } = request;

    // Determine eligibility
    const incomeEligible = income <= NALSA_INCOME_THRESHOLD;
    const categoryEligible = AUTOMATIC_ELIGIBILITY_TYPES.has(
      beneficiaryType.toUpperCase().replace(/ /g, '_')
    );
    const isEligible = incomeEligible || categoryEligible;

    let reason: string;
    if (categoryEligible && !incomeEligible) {
      reason = `You are automatically eligible for free legal aid as a member of the ${beneficiaryType} category, regardless of income, under Section 12 of the Legal Services Authorities Act, 1987.`;
    } else if (incomeEligible && !categoryEligible) {
      reason = `Your annual income of ₹${income.toLocaleString('en-IN')} is below the NALSA threshold of ₹1,00,000, making you eligible for free legal services.`;
    } else if (incomeEligible && categoryEligible) {
      reason = `You qualify on both income grounds (₹${income.toLocaleString('en-IN')} < ₹1,00,000) and as a member of the ${beneficiaryType} protected category.`;
    } else {
      reason = `Your annual income of ₹${income.toLocaleString('en-IN')} exceeds the NALSA threshold of ₹1,00,000 and your category (${beneficiaryType}) does not qualify for automatic eligibility. You may still access low-cost legal aid from NGO clinics or bar association pro-bono panels.`;
    }

    const schemes = buildSchemes(request, isEligible);

    const result: EligibilityResult = {
      eligible: isEligible,
      schemes,
      reason,
      referralLink: 'https://nalsa.gov.in',
    };

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
