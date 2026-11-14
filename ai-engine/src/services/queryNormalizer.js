/**
 * NyayaSaathi Query Normalization Service
 * Prepares and normalizes citizen inquiries across languages and legal acronyms.
 */

// Common legal acronyms and abbreviations in Indian jurisprudence
const LEGAL_ACRONYMS = {
  posh: 'sexual harassment of women at workplace internal complaints committee',
  fir: 'first information report police station',
  rte: 'right to education 25% quota free schooling',
  pwdva: 'protection of women from domestic violence act magistrate protection order',
  dlsa: 'district legal services authority free legal aid lawyer',
  slsa: 'state legal services authority free legal aid',
  nalsa: 'national legal services authority 15100 free court advocate',
  crpc: 'code of criminal procedure arrest bail',
  bnss: 'bharatiya nagarik suraksha sanhita arrest bail custody',
  ipc: 'indian penal code criminal offence',
  bns: 'bharatiya nyaya sanhita criminal offence',
  pil: 'public interest litigation high court supreme court',
  rti: 'right to information public authority',
  epf: 'employees provident fund retirement pension',
  pf: 'provident fund salary deduction',
  edaakhil: 'edaakhil online consumer commission complaint',
  icc: 'internal complaints committee workplace harassment',
  cpa: 'consumer protection act district commission',
  powa: 'payment of wages act unpaid salary',
  mwa: 'minimum wages act statutory wage',
};

// Common Indic/Hinglish legal keywords and their standardized English search terms
const TRANSLITERATION_MAP = {
  vetan: 'salary wages payment',
  tankhwah: 'salary wages payment',
  pagar: 'salary wages payment',
  nokri: 'job employment workplace',
  kaam: 'work employment labour',
  shikayat: 'complaint grievance legal action',
  kirayedaar: 'tenant tenancy rent lease',
  kiraya: 'rent lease tenancy',
  makaan: 'house property premises landlord',
  zameen: 'land property plot',
  hinsa: 'violence abuse domestic harassment',
  dahej: 'dowry domestic harassment',
  police: 'police station fir arrest',
  thana: 'police station fir',
  giraftaar: 'arrest custody detention',
  zamanat: 'bail bond release',
  adhikaar: 'rights fundamental statutory rights',
  mahila: 'woman female protection',
  patni: 'wife domestic maintenance',
  pati: 'husband domestic dispute',
  bachha: 'child minor education custody',
};

const NOISE_WORDS = new Set([
  'please', 'help', 'me', 'sir', 'madam', 'tell', 'want', 'know',
  'what', 'is', 'are', 'can', 'i', 'do', 'how', 'to', 'give', 'information',
  'kya', 'kare', 'bataiye', 'madad', 'chahiye', 'mujhe', 'humko'
]);

/**
 * Normalizes citizen inquiry:
 * 1. Unicode NFC normalization (handles Devanagari/Indic scripts cleanly)
 * 2. Normalizes whitespace and punctuation
 * 3. Expands legal acronyms (e.g. POSH, FIR, DLSA)
 * 4. Augments transliterated Hinglish keywords
 * 5. Extracts key legal search concepts for embedding & lexical retrieval
 */
export function normalizeQuery(rawQuery = '') {
  if (!rawQuery || typeof rawQuery !== 'string') {
    return {
      original: '',
      normalized: '',
      expanded: '',
      keywords: [],
      detectedAcronyms: [],
    };
  }

  // 1. Unicode Normalization Form C
  const unicodeClean = rawQuery.normalize('NFC').trim();

  // 2. Lowercase and clean noise
  const lower = unicodeClean.toLowerCase();

  // 3. Detect and expand acronyms
  const detectedAcronyms = [];
  const words = lower.split(/[\s,.;:?!'"`()\[\]{}<>\/\\_-]+/);
  const expandedTokens = [];

  for (const word of words) {
    if (!word) continue;
    if (LEGAL_ACRONYMS[word]) {
      detectedAcronyms.push(word.toUpperCase());
      expandedTokens.push(word);
      expandedTokens.push(LEGAL_ACRONYMS[word]);
    } else if (TRANSLITERATION_MAP[word]) {
      expandedTokens.push(word);
      expandedTokens.push(TRANSLITERATION_MAP[word]);
    } else {
      expandedTokens.push(word);
    }
  }

  const normalized = words.join(' ').trim();
  const expanded = expandedTokens.join(' ').trim();

  // 4. Extract meaningful search keywords (length > 2 and not noise)
  const keywords = Array.from(
    new Set(
      expandedTokens
        .flatMap((t) => t.split(/\s+/))
        .filter((tok) => tok.length > 2 && !NOISE_WORDS.has(tok))
    )
  );

  return {
    original: unicodeClean,
    normalized,
    expanded,
    keywords,
    detectedAcronyms,
  };
}

export default { normalizeQuery };
