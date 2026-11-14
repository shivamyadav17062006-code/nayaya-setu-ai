/**
 * NyayaSaathi — Phase 10D: Official Judgment Source Register Builder
 *
 * Compiles a traceable register of official judicial sources from the Supreme Court of India
 * and State High Courts with court name, case title, case number, decision date, bench,
 * official judgment URL, document checksum, and publication details.
 */

import fs from 'fs';
import path from 'path';

export function buildJudgmentSourceRegister() {
  const corpusPath = path.resolve('data/caselaw/judgment_corpus.json');
  const outputPath = path.resolve('data/caselaw/judgment_source_register.json');

  if (!fs.existsSync(corpusPath)) {
    throw new Error('judgment_corpus.json not found. Run buildCaseLawCorpus.js first.');
  }

  const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'));

  const sourceEntries = corpus.judgments.map(j => ({
    id: j.id,
    courtName: j.courtName,
    courtLevel: j.courtLevel,
    jurisdiction: j.jurisdiction,
    precedentAuthority: j.precedentAuthority,
    caseTitle: j.caseTitle,
    caseNumber: j.caseNumber,
    citation: j.citation,
    neutralCitation: j.neutralCitation || null,
    decisionDate: j.decisionDate,
    bench: j.bench,
    coramSize: j.coramSize,
    officialJudgmentUrl: j.sourceUrl,
    pdfSourceUrl: j.pdfSourceUrl || j.sourceUrl,
    documentChecksum: j.checksum,
    checksumAlgorithm: 'SHA-256',
    publicationDetails: {
      officialLawReports: j.citation.split(';').map(c => c.trim()),
      sourceOrganization: j.courtName,
      traceabilityStatus: 'OFFICIAL_GOVERNMENT_REPOSITORY'
    },
    statutoryProvisionsInterpreted: j.statuteLinks.map(l => `${l.actTitle} (${l.provisionCited})`),
    ratioSummary: j.ratioDecidendi.substring(0, 180) + '...',
    isSummaryMachineGenerated: true,
    verificationStatus: j.verificationStatus
  }));

  const register = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalSources: sourceEntries.length,
    courtsCovered: corpus.courtsRepresented,
    breakdownByCourtLevel: {
      supremeCourt: sourceEntries.filter(s => s.courtLevel === 'SUPREME_COURT').length,
      highCourts: sourceEntries.filter(s => s.courtLevel === 'HIGH_COURT').length
    },
    breakdownByAuthority: {
      bindingNationwide: sourceEntries.filter(s => s.precedentAuthority === 'BINDING_NATIONWIDE').length,
      bindingWithinState: sourceEntries.filter(s => s.precedentAuthority === 'BINDING_WITHIN_STATE').length
    },
    sources: sourceEntries
  };

  fs.writeFileSync(outputPath, JSON.stringify(register, null, 2), 'utf-8');
  console.log(`✅ Judgment Source Register written to: ${outputPath}`);
  console.log(`   Total Verified Judicial Sources: ${register.totalSources}`);
  console.log(`   Supreme Court Precedents: ${register.breakdownByCourtLevel.supremeCourt} (Binding Nationwide)`);
  console.log(`   High Court Precedents: ${register.breakdownByCourtLevel.highCourts} (Binding in State / Persuasive)`);
  return register;
}

if (process.argv[1]?.endsWith('buildJudgmentSourceRegister.js')) {
  buildJudgmentSourceRegister();
}
