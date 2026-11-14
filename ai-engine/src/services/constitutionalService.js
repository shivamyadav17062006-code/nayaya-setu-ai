/**
 * NyayaSaathi Constitutional Knowledge & Exact Reference Service
 * Handles direct Article lookups, clause hierarchies, Schedules, and amendment records.
 */

import fs from 'fs';
import path from 'path';

const CORPUS_PATH = path.resolve('data/constitution/constitution_corpus.json');

class ConstitutionalService {
  constructor() {
    this.corpus = null;
    this.articlesMap = new Map();
    this.schedulesMap = new Map();
    this.loadCorpus();
  }

  loadCorpus() {
    try {
      if (fs.existsSync(CORPUS_PATH)) {
        const raw = fs.readFileSync(CORPUS_PATH, 'utf-8');
        this.corpus = JSON.parse(raw);

        // Index articles
        for (const art of this.corpus.articles) {
          const numKey = art.articleNumber.toLowerCase().replace(/\s+/g, '');
          this.articlesMap.set(numKey, art);
          // Also index digits only e.g. "21" -> Article 21
          const match = art.articleNumber.match(/(\d+[A-Z]?)/i);
          if (match) {
            this.articlesMap.set(match[1].toLowerCase(), art);
          }
        }

        // Index schedules
        for (const sched of this.corpus.schedules) {
          this.schedulesMap.set(sched.number.toLowerCase(), sched);
        }
      }
    } catch (err) {
      console.warn('[ConstitutionalService] Failed to load corpus file:', err.message);
    }
  }

  /**
   * Identifies exact constitutional reference in user query.
   * Supports: Article 21, Art 19(1)(a), Article 39A, Preamble, Seventh Schedule, etc.
   */
  findExactReference(query = '') {
    if (!query || typeof query !== 'string') return null;

    const lower = query.toLowerCase();

    // 1. Preamble match
    if (/\bpreamble\b/i.test(lower)) {
      return {
        type: 'PREAMBLE',
        reference: 'Preamble',
        record: this.corpus?.preamble || null,
      };
    }

    // 2. Schedule match: "seventh schedule", "7th schedule", "schedule 7"
    const schedMatch = lower.match(/(?:(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|\d+(?:st|nd|rd|th)?)\s+schedule|schedule\s+(\d+|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth))/i);
    if (schedMatch) {
      const rawCapture = (schedMatch[1] || schedMatch[2]).toLowerCase();
      const captured = rawCapture.replace(/^(\d+)(?:st|nd|rd|th)$/, '$1');
      const numMap = {
        '1': 'first', 'first': 'first',
        '2': 'second', 'second': 'second',
        '3': 'third', 'third': 'third',
        '4': 'fourth', 'fourth': 'fourth',
        '5': 'fifth', 'fifth': 'fifth',
        '6': 'sixth', 'sixth': 'sixth',
        '7': 'seventh', 'seventh': 'seventh',
        '8': 'eighth', 'eighth': 'eighth',
        '9': 'ninth', 'ninth': 'ninth',
        '10': 'tenth', 'tenth': 'tenth',
        '11': 'eleventh', 'eleventh': 'eleventh',
        '12': 'twelfth', 'twelfth': 'twelfth'
      };
      const wordToNum = {
        first: '1', second: '2', third: '3', fourth: '4', fifth: '5', sixth: '6',
        seventh: '7', eighth: '8', ninth: '9', tenth: '10', eleventh: '11', twelfth: '12',
        '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6',
        '7': '7', '8': '8', '9': '9', '10': '10', '11': '11', '12': '12'
      };
      const schedKey = `${numMap[captured] || captured} schedule`;
      const sched = this.schedulesMap.get(schedKey);
      if (sched) {
        return {
          type: 'SCHEDULE',
          reference: sched.number,
          scheduleNumber: wordToNum[captured] || String(sched.schedule_number || ''),
          record: sched,
        };
      }
    }

    // 3. Article match: Article 21, Art. 19, Article 21A, Article 300A, Article 19(1)(a)
    const artMatch = lower.match(/(?:article|art\.?)\s*(\d+[a-z]?)(?:\s*\(([a-z0-9]+)\))?(?:\s*\(([a-z0-9]+)\))?/i);
    if (artMatch) {
      const artNum = artMatch[1].toLowerCase();
      const clauseNum = artMatch[2] ? artMatch[2].toLowerCase() : null;
      const subclauseNum = artMatch[3] ? artMatch[3].toLowerCase() : null;
      const art = this.articlesMap.get(artNum);

      if (art) {
        let matchedClause = null;
        if (clauseNum && Array.isArray(art.clauses)) {
          matchedClause = art.clauses.find(
            (c) => c.clauseNumber.toLowerCase() === clauseNum || c.clauseNumber.toLowerCase().includes(clauseNum)
          );
        }

        return {
          type: 'ARTICLE',
          reference: art.articleNumber,
          articleNumber: art.articleNumber.replace(/^article\s*/i, '').trim(),
          clause: clauseNum,
          subclause: subclauseNum,
          matchedClause,
          record: art,
        };
      }
    }

    // 4. Key Amendment match
    const amdMatch = lower.match(/(\d+)(?:st|nd|rd|th)?\s+(?:constitutional\s+)?amendment/i);
    if (amdMatch) {
      const amdNum = parseInt(amdMatch[1], 10);
      const amd = this.getAmendment(amdNum);
      if (amd) {
        return {
          type: 'AMENDMENT',
          reference: `${amdNum}th Amendment`,
          record: amd,
        };
      }
    }

    return null;
  }

  /**
   * Alias for findExactReference to support alternative naming conventions
   */
  detectConstitutionalReference(query = '') {
    return this.findExactReference(query);
  }

  /**
   * Retrieves Article details by number (e.g. "Article 21" or "21")
   */
  getArticle(articleNumber) {
    const key = String(articleNumber).toLowerCase().replace(/\s+/g, '').replace('article', '');
    const art = this.articlesMap.get(key) || null;
    if (art) {
      return {
        ...art,
        article_number: art.articleNumber.replace(/^article\s*/i, '').trim(),
      };
    }
    return null;
  }

  /**
   * Retrieves Schedule details by number or name (e.g. 7, "7", "seventh", "Seventh Schedule")
   */
  getSchedule(schedIdentifier) {
    const raw = String(schedIdentifier).toLowerCase().trim();
    const numToName = {
      '1': 'first', 'first': 'first',
      '2': 'second', 'second': 'second',
      '3': 'third', 'third': 'third',
      '4': 'fourth', 'fourth': 'fourth',
      '5': 'fifth', 'fifth': 'fifth',
      '6': 'sixth', 'sixth': 'sixth',
      '7': 'seventh', 'seventh': 'seventh',
      '8': 'eighth', 'eighth': 'eighth',
      '9': 'ninth', 'ninth': 'ninth',
      '10': 'tenth', 'tenth': 'tenth',
      '11': 'eleventh', 'eleventh': 'eleventh',
      '12': 'twelfth', 'twelfth': 'twelfth'
    };
    const cleanNum = raw.replace(/^schedule\s*/i, '').replace(/(st|nd|rd|th)?(\s+schedule)?$/i, '');
    const mappedWord = numToName[cleanNum] || cleanNum;
    const targetKey = `${mappedWord} schedule`;

    if (this.schedulesMap.has(targetKey)) {
      return this.schedulesMap.get(targetKey);
    }

    for (const [key, sched] of this.schedulesMap.entries()) {
      if (key.includes(raw) || sched.number.toLowerCase().includes(raw)) {
        return sched;
      }
    }
    return null;
  }

  /**
   * Retrieves amendment details from notes
   */
  getAmendment(amendmentNum) {
    const target = Number(amendmentNum);
    const amendments = [
      {
        amendment_number: 42,
        year: 1976,
        title: 'Constitution (Forty-second Amendment) Act, 1976',
        description: 'Inserted words "SOCIALIST", "SECULAR" and "integrity" into Preamble, added Fundamental Duties (Part IVA).'
      },
      {
        amendment_number: 44,
        year: 1978,
        title: 'Constitution (Forty-fourth Amendment) Act, 1978',
        description: 'Removed right to property as a fundamental right (moved to Article 300A), safeguarded Articles 20 and 21 during emergency.'
      },
      {
        amendment_number: 86,
        year: 2002,
        title: 'Constitution (Eighty-sixth Amendment) Act, 2002',
        description: 'Inserted Article 21A providing free and compulsory education for children aged 6 to 14.'
      },
      {
        amendment_number: 103,
        year: 2019,
        title: 'Constitution (One Hundred and Third Amendment) Act, 2019',
        description: 'Introduced 10% reservation for Economically Weaker Sections (EWS) by amending Articles 15 and 16.'
      },
      {
        amendment_number: 106,
        year: 2023,
        title: 'Constitution (One Hundred and Sixth Amendment) Act, 2023 (Nari Shakti Vandan Adhiniyam)',
        description: 'Introduced Article 330A reserving 33% seats for women in Lok Sabha and State Legislative Assemblies.'
      }
    ];

    return amendments.find(a => a.amendment_number === target) || null;
  }

  /**
   * Retrieves all Parts metadata
   */
  getParts() {
    return this.corpus?.parts || [];
  }

  /**
   * Retrieves all Schedules metadata
   */
  getSchedules() {
    return this.corpus?.schedules || [];
  }

  /**
   * Retrieves full corpus
   */
  getCorpus() {
    return this.corpus;
  }
}

export const constitutionalService = new ConstitutionalService();
export default constitutionalService;
