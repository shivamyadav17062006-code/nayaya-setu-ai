/**
 * Legal Intent Classification Service
 * Classifies citizen inquiries into specific statutory domains and procedural goals.
 */

export const Intent = {
  LABOUR: 'LABOUR',
  WOMEN_RIGHTS: 'WOMEN_RIGHTS',
  WORKPLACE_HARASSMENT: 'WORKPLACE_HARASSMENT',
  CHILDREN: 'CHILDREN',
  CONSUMER: 'CONSUMER',
  LEGAL_AID: 'LEGAL_AID',
  PROPERTY: 'PROPERTY',
  CONSTITUTIONAL: 'CONSTITUTIONAL',
  CRIMINAL: 'CRIMINAL',
  GENERAL: 'GENERAL',
};

export const GoalType = {
  GENERAL_EXPLANATION: 'GENERAL_LEGAL_EXPLANATION',
  RIGHTS_DISCOVERY: 'RIGHTS_DISCOVERY',
  LEGAL_AID_GUIDANCE: 'LEGAL_AID_GUIDANCE',
  COMPLAINT_PROCEDURE: 'COMPLAINT_PROCEDURE',
  DOCUMENT_EXPLANATION: 'DOCUMENT_EXPLANATION',
};

const DOMAIN_RULES = [
  {
    intent: Intent.WORKPLACE_HARASSMENT,
    weight: 1.4,
    keywords: [
      'posh', 'posh act', 'sexual harassment', 'workplace harassment',
      'internal complaints committee', 'icc', 'local committee', 'hostile work environment',
      'office harassment', 'harassed at work', 'colleague harassment', 'boss harassment'
    ],
  },
  {
    intent: Intent.LEGAL_AID,
    weight: 1.3,
    keywords: [
      'legal aid', 'free lawyer', 'nalsa', 'dlsa', 'slsa', '15100',
      'court representation', 'cannot afford lawyer', 'free legal services',
      'section 12', 'lok adalat', 'panel advocate', 'मुफ्त वकील', 'कानूनी सहायता'
    ],
  },
  {
    intent: Intent.LABOUR,
    weight: 1.2,
    keywords: [
      'salary', 'wage', 'wages', 'pay', 'employer', 'employee', 'job',
      'workplace', 'work', 'labour', 'labor', 'pf', 'provident fund', 'epf',
      'esi', 'gratuity', 'minimum wage', 'overtime', 'fired', 'dismissed',
      'retrenchment', 'layoff', 'trade union', 'strike', 'maternity leave',
      'factory', 'contract worker', 'bonded labour', 'withheld', 'arrears',
      'श्रमिक', 'वेतन', 'नौकरी', 'मजदूर', 'कर्मचारी', 'दिहाड़ी', 'पगार'
    ],
  },
  {
    intent: Intent.WOMEN_RIGHTS,
    weight: 1.2,
    keywords: [
      'domestic violence', 'dowry', 'harassment', 'beating', 'abused',
      'pwdva', 'rape', 'assault', 'stalking', 'wife', 'husband',
      'matrimonial', 'divorce', 'maintenance', 'alimony', 'gender',
      'woman', 'women', 'girl', 'female', 'protection order',
      'mahila', 'streedhan', 'घरेलू हिंसा', 'दहेज', 'महिला', 'पत्नी'
    ],
  },
  {
    intent: Intent.CONSUMER,
    weight: 1.1,
    keywords: [
      'consumer', 'product', 'defective', 'refund', 'complaint',
      'service', 'ecommerce', 'online shopping', 'fraud', 'cheated',
      'insurance', 'bank', 'credit card', 'loan', 'emi', 'warranty',
      'consumer forum', 'consumer court', 'unfair trade', 'edaakhil',
      'उपभोक्ता', 'शिकायत', 'धोखाधड़ी'
    ],
  },
  {
    intent: Intent.PROPERTY,
    weight: 1.1,
    keywords: [
      'land', 'property', 'plot', 'house', 'flat', 'rent', 'tenant',
      'tenancy', 'landlord', 'eviction', 'evict', 'lease', 'notice',
      'inheritance', 'will', 'succession', 'registry', 'mutation',
      'title deed', 'encroachment', 'zameen', 'makaan', 'kiraya',
      'किरायेदार', 'संपत्ति', 'भूमि', 'किराया'
    ],
  },
  {
    intent: Intent.CONSTITUTIONAL,
    weight: 1.1,
    keywords: [
      'fundamental right', 'right to information', 'rti', 'constitution',
      'discrimination', 'reservation', 'caste', 'equality', 'liberty',
      'freedom', 'article 14', 'article 19', 'article 21', 'article 32',
      'article 39a', 'writ', 'habeas corpus', 'public interest litigation',
      'pil', 'state action', 'मौलिक अधिकार', 'संविधान'
    ],
  },
  {
    intent: Intent.CHILDREN,
    weight: 1.1,
    keywords: [
      'child', 'children', 'minor', 'juvenile', 'pocso', 'rte',
      'right to education', 'school', 'child labour', 'adoption',
      'custody', 'guardian', 'बच्चा', 'बच्चे'
    ],
  },
  {
    intent: Intent.CRIMINAL,
    weight: 1.1,
    keywords: [
      'police', 'fir', 'arrest', 'bail', 'jail', 'custody', 'handcuff',
      'magistrate', 'remand', 'crpc', 'bnss', 'ipc', 'bns', 'thana',
      'police station', 'warrant', 'गिरफ्तारी', 'जमानत', 'पुलिस'
    ],
  },
];

const GOAL_RULES = [
  {
    goal: GoalType.LEGAL_AID_GUIDANCE,
    keywords: ['free lawyer', 'legal aid', 'nalsa', 'dlsa', 'afford', 'cost', 'representation', 'advocate', 'fees'],
  },
  {
    goal: GoalType.COMPLAINT_PROCEDURE,
    keywords: ['how to file', 'how do i complain', 'procedure', 'process', 'steps', 'where to report', 'lodge complaint', 'portal', 'edaakhil', 'fir kaise'],
  },
  {
    goal: GoalType.RIGHTS_DISCOVERY,
    keywords: ['what are my rights', 'do i have the right', 'entitlement', 'protection', 'am i entitled', 'rights of', 'kya adhikar'],
  },
  {
    goal: GoalType.DOCUMENT_EXPLANATION,
    keywords: ['notice', 'agreement', 'clause', 'meaning of', 'document', 'what does this section mean', 'explain section'],
  },
];

export function classifyIntent(query = '') {
  if (!query || typeof query !== 'string') {
    return {
      intent: Intent.GENERAL,
      goal: GoalType.GENERAL_EXPLANATION,
      confidence: 0.5,
      reasoning: 'Default fallback',
    };
  }

  const lower = query.toLowerCase();

  // 1. Domain Intent Classification
  const domainScores = {};
  for (const rule of DOMAIN_RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) {
        score += kw.includes(' ') ? 2.0 : 1.0;
      }
    }
    score *= rule.weight;
    if (score > 0) domainScores[rule.intent] = score;
  }

  let bestIntent = Intent.GENERAL;
  let maxDomainScore = 0;
  for (const [intent, score] of Object.entries(domainScores)) {
    if (score > maxDomainScore) {
      maxDomainScore = score;
      bestIntent = intent;
    }
  }

  // 2. Goal Type Classification
  let bestGoal = GoalType.GENERAL_EXPLANATION;
  let maxGoalScore = 0;
  for (const rule of GOAL_RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) score += 1;
    }
    if (score > maxGoalScore) {
      maxGoalScore = score;
      bestGoal = rule.goal;
    }
  }

  // Domain overrides for specific goals
  if (bestIntent === Intent.LEGAL_AID) {
    bestGoal = GoalType.LEGAL_AID_GUIDANCE;
  }

  const confidence = maxDomainScore > 0 ? Math.min(0.95, 0.5 + maxDomainScore * 0.1) : 0.5;

  return {
    intent: bestIntent,
    goal: bestGoal,
    confidence: parseFloat(confidence.toFixed(2)),
    matchedScores: domainScores,
  };
}

export default { Intent, GoalType, classifyIntent };
