/**
 * Legal Intent Classification Service
 */

export const Intent = {
  LABOUR: 'LABOUR',
  WOMEN_RIGHTS: 'WOMEN_RIGHTS',
  CHILDREN: 'CHILDREN',
  CONSUMER: 'CONSUMER',
  PROPERTY: 'PROPERTY',
  CONSTITUTIONAL: 'CONSTITUTIONAL',
  CRIMINAL: 'CRIMINAL',
  GENERAL: 'GENERAL',
};

const KEYWORD_RULES = [
  {
    intent: Intent.LABOUR,
    weight: 1.0,
    keywords: [
      'salary', 'wage', 'wages', 'pay', 'employer', 'employee', 'job',
      'workplace', 'work', 'labour', 'labor', 'pf', 'provident fund', 'epf',
      'esi', 'gratuity', 'minimum wage', 'overtime', 'fired', 'dismissed',
      'retrenchment', 'layoff', 'trade union', 'strike', 'maternity leave',
      'factory', 'contract worker', 'bonded labour', 'श्रमिक', 'वेतन',
      'नौकरी', 'मजदूर', 'कर्मचारी', 'दिहाड़ी'
    ],
  },
  {
    intent: Intent.WOMEN_RIGHTS,
    weight: 1.2,
    keywords: [
      'domestic violence', 'dowry', 'harassment', 'sexual harassment',
      'posh', 'rape', 'assault', 'stalking', 'wife', 'husband',
      'matrimonial', 'divorce', 'maintenance', 'alimony', 'gender',
      'woman', 'women', 'girl', 'female', 'she', 'her',
      'mahila', 'streedhan', 'घरेलू हिंसा', 'दहेज', 'महिला', 'पत्नी'
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
    intent: Intent.CONSUMER,
    weight: 1.0,
    keywords: [
      'consumer', 'product', 'defective', 'refund', 'complaint',
      'service', 'ecommerce', 'online shopping', 'fraud', 'cheated',
      'insurance', 'bank', 'credit card', 'loan', 'emi',
      'consumer forum', 'consumer court', 'unfair trade',
      'उपभोक्ता', 'शिकायत', 'धोखाधड़ी'
    ],
  },
  {
    intent: Intent.PROPERTY,
    weight: 1.0,
    keywords: [
      'land', 'property', 'plot', 'house', 'flat', 'rent', 'tenant',
      'landlord', 'eviction', 'inheritance', 'will', 'succession',
      'registry', 'mutation', 'title deed', 'lease', 'encroachment',
      'zameen', 'makaan', 'किरायेदार', 'संपत्ति', 'भूमि'
    ],
  },
  {
    intent: Intent.CONSTITUTIONAL,
    weight: 1.1,
    keywords: [
      'fundamental right', 'right to information', 'rti', 'constitution',
      'discrimination', 'reservation', 'caste', 'equality', 'liberty',
      'freedom', 'article 14', 'article 19', 'article 21', 'article 32',
      'writ', 'habeas corpus', 'public interest litigation', 'pil',
      'मौलिक अधिकार', 'संविधान'
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

export function classifyIntent(query) {
  if (!query || typeof query !== 'string') {
    return { intent: Intent.GENERAL, confidence: 0.5, reasoning: 'Default fallback' };
  }

  const lower = query.toLowerCase();
  const scores = {};

  for (const rule of KEYWORD_RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += rule.weight;
      }
    }
    scores[rule.intent] = score;
  }

  let topIntent = Intent.GENERAL;
  let maxScore = 0;

  for (const [intent, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      topIntent = intent;
    }
  }

  if (maxScore === 0) {
    return {
      intent: Intent.GENERAL,
      confidence: 0.5,
      reasoning: 'No specific domain keywords matched; classified as general',
    };
  }

  const confidence = Math.min(1.0, 0.6 + maxScore * 0.1);
  return {
    intent: topIntent,
    confidence,
    reasoning: `Matched keywords in category ${topIntent} (score: ${maxScore.toFixed(1)})`,
  };
}
