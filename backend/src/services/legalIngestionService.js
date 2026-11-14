/**
 * NyayaSaathi — Legal Data Ingestion & Extraction Service
 *
 * Handles:
 * 1. Data validation and schema enforcement.
 * 2. Duplicate detection across existing Acts and Sections.
 * 3. Structured JSON imports with batch logging.
 * 4. Text/HTML legal section parser.
 * 5. Strict policy: Never automatically publishes scraped/imported content;
 *    all imported records enter as DRAFT or UNDER_REVIEW.
 */

import { prisma } from '../lib/prisma.js';

export class LegalIngestionService {
  /**
   * Validates legal act data payload
   */
  validateAct(data = {}) {
    const errors = [];
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long.');
    }
    const year = parseInt(data.year, 10);
    if (isNaN(year) || year < 1850 || year > 2030) {
      errors.push('Year must be a valid four-digit year between 1850 and 2030.');
    }
    const validJurisdictions = ['CENTRAL', 'STATE'];
    if (!data.jurisdiction || !validJurisdictions.includes(data.jurisdiction.toUpperCase())) {
      errors.push('Jurisdiction must be CENTRAL or STATE.');
    }
    if (data.jurisdiction?.toUpperCase() === 'STATE' && (!data.state || data.state.trim().length < 2)) {
      errors.push('State name is mandatory for STATE jurisdiction.');
    }
    if (!data.sourceUrl || !/^https?:\/\/.+/.test(data.sourceUrl)) {
      errors.push('Official source URL is required and must be an HTTP/HTTPS URL.');
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * Validates section payload
   */
  validateSection(data = {}) {
    const errors = [];
    if (!data.sectionNumber || typeof data.sectionNumber !== 'string' || data.sectionNumber.trim().length < 1) {
      errors.push('Section number is required (e.g. Section 5, Article 21, Rule 14).');
    }
    if (!data.originalText || typeof data.originalText !== 'string' || data.originalText.trim().length < 10) {
      errors.push('Original statutory legal text must be at least 10 characters long.');
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * Detects duplicate Acts in the database
   */
  async detectActDuplicates(title, actNumber = null, year = null) {
    const duplicates = [];

    // 1. Exact title match
    const titleMatches = await prisma.legalAct.findMany({
      where: {
        title: { equals: title.trim(), mode: 'insensitive' },
      },
      select: { id: true, title: true, year: true, verificationStatus: true },
    });
    if (titleMatches.length > 0) {
      duplicates.push({ reason: 'EXACT_TITLE_MATCH', matchedRecords: titleMatches });
    }

    // 2. Act Number match in the same year
    if (actNumber && year) {
      const numberMatches = await prisma.legalAct.findMany({
        where: {
          actNumber: { equals: actNumber.trim(), mode: 'insensitive' },
          year: parseInt(year, 10),
        },
        select: { id: true, title: true, actNumber: true, year: true },
      });
      if (numberMatches.length > 0) {
        duplicates.push({ reason: 'ACT_NUMBER_AND_YEAR_MATCH', matchedRecords: numberMatches });
      }
    }

    return {
      isDuplicate: duplicates.length > 0,
      details: duplicates,
    };
  }

  /**
   * Ingests a structured JSON payload of Acts and Sections
   */
  async ingestBatch(payload = {}, actorInfo = {}) {
    const { sourceName, sourceUrl, importType = 'JSON_IMPORT', documents = [] } = payload;
    const actorEmail = actorInfo.email || 'system-admin@nyayasaathi.gov.in';

    // 1. Create Batch Record
    const batchResult = await prisma.$queryRaw`
      INSERT INTO public.legal_import_batches (
        source_name, source_url, import_type, status, total_records, imported_records, rejected_records, imported_by
      ) VALUES (
        ${sourceName || 'Manual Batch'}, ${sourceUrl || null}, ${importType}, 'PENDING', ${documents.length}, 0, 0, ${actorEmail}
      )
      RETURNING id;
    `;
    const batchId = batchResult[0]?.id;

    let importedCount = 0;
    let rejectedCount = 0;
    const errorLogs = [];
    const createdActIds = [];

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const val = this.validateAct(doc);
      if (!val.valid) {
        rejectedCount++;
        errorLogs.push({ index: i, title: doc.title || 'Untitled', errors: val.errors });
        continue;
      }

      // Check duplicates
      const dup = await this.detectActDuplicates(doc.title, doc.actNumber, doc.year);
      if (dup.isDuplicate) {
        rejectedCount++;
        errorLogs.push({ index: i, title: doc.title, error: 'Duplicate detected', details: dup.details });
        continue;
      }

      try {
        // Create Act with DRAFT status
        const act = await prisma.legalAct.create({
          data: {
            title: doc.title.trim(),
            actNumber: doc.actNumber?.trim() || null,
            year: parseInt(doc.year, 10),
            jurisdiction: doc.jurisdiction.toUpperCase(),
            state: doc.state ? doc.state.trim().toUpperCase() : null,
            category: doc.category || 'GENERAL',
            documentType: doc.documentType || 'ACT',
            sourceUrl: doc.sourceUrl.trim(),
            description: doc.description || null,
            status: 'ACTIVE',
            verificationStatus: 'DRAFT', // Mandatory: Enters as DRAFT
            reviewNotes: `Ingested via Batch ${batchId} (${importType})`,
          },
        });

        createdActIds.push(act.id);
        importedCount++;

        // Audit log
        await prisma.$executeRawUnsafe(
          `INSERT INTO public.legal_audit_logs (
            entity_type, entity_id, action, actor_email, actor_role, new_state, review_notes
          ) VALUES (
            'ACT', $1::uuid, 'CREATE', $2, 'ADMIN', $3::jsonb, 'Imported via Batch'
          );`,
          act.id,
          actorEmail,
          JSON.stringify({ title: act.title, jurisdiction: act.jurisdiction, status: 'DRAFT' })
        );

        // Ingest Sections if provided
        if (Array.isArray(doc.sections) && doc.sections.length > 0) {
          for (const sec of doc.sections) {
            const secVal = this.validateSection(sec);
            if (secVal.valid) {
              const createdSec = await prisma.legalSection.create({
                data: {
                  actId: act.id,
                  sectionNumber: sec.sectionNumber.trim(),
                  title: sec.title?.trim() || null,
                  originalText: sec.originalText.trim(),
                  simplifiedText: sec.simplifiedText?.trim() || null,
                  verificationStatus: 'DRAFT',
                },
              });

              await prisma.$executeRawUnsafe(
                `INSERT INTO public.legal_audit_logs (
                  entity_type, entity_id, action, actor_email, actor_role, new_state, review_notes
                ) VALUES (
                  'SECTION', $1::uuid, 'CREATE', $2, 'ADMIN', $3::jsonb, 'Section imported in batch'
                );`,
                createdSec.id,
                actorEmail,
                JSON.stringify({ sectionNumber: createdSec.sectionNumber, status: 'DRAFT' })
              );
            }
          }
        }
      } catch (ingestErr) {
        rejectedCount++;
        errorLogs.push({ index: i, title: doc.title, error: ingestErr.message });
      }
    }

    // Update batch status
    const finalStatus = importedCount > 0 ? (rejectedCount > 0 ? 'PARTIAL' : 'PROCESSED') : 'FAILED';
    await prisma.$executeRawUnsafe(
      `UPDATE public.legal_import_batches 
       SET status = $1, imported_records = $2, rejected_records = $3, error_log = $4::jsonb 
       WHERE id = $5::uuid;`,
      finalStatus,
      importedCount,
      rejectedCount,
      JSON.stringify(errorLogs),
      batchId
    );

    return {
      batchId,
      status: finalStatus,
      totalRecords: documents.length,
      importedRecords: importedCount,
      rejectedRecords: rejectedCount,
      createdActIds,
      errors: errorLogs,
    };
  }

  /**
   * Rule-based text section parser for raw legal text/HTML extracts
   */
  parseLegalText(rawText = '') {
    const sections = [];
    const sectionRegex = /(?:Section|Article|Rule|Clause)\s+([0-9A-Za-z\(\)]+)[\.:\-\s]+([^\n]+)?\n([\s\S]*?)(?=(?:Section|Article|Rule|Clause)\s+[0-9A-Za-z\(\)]+|$)/gi;

    let match;
    while ((match = sectionRegex.exec(rawText)) !== null) {
      const num = match[1]?.trim();
      const title = match[2]?.trim() || '';
      const content = match[3]?.trim();

      if (num && content && content.length > 15) {
        sections.push({
          sectionNumber: `Section ${num}`,
          title: title || `Provisions of Section ${num}`,
          originalText: content,
          simplifiedText: null, // Left for editorial team or AI-assisted review
        });
      }
    }

    return sections;
  }
}

export const legalIngestionService = new LegalIngestionService();
export default legalIngestionService;
