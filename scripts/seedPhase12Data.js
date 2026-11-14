/**
 * NyayaSaathi — Phase 12: Seed Beneficiaries, Additional Core Acts & Legal Remedies
 *
 * Expands:
 * 1. Beneficiary Categories: Tenants, Students, Farmers, Senior Citizens, Accused/Detainees.
 * 2. Senior Citizens Act 2007 & RPwD Act 2016.
 * 3. Verified Legal Remedies linked to sections in public.legal_remedies.
 * 4. Syncs pgvector chunks via kmsRAGSyncService.
 */

import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import { prisma } from '../backend/src/lib/prisma.js';
import { kmsRAGSyncService } from '../backend/src/services/kmsRAGSyncService.js';

async function seedPhase12() {
  console.log('='.repeat(80));
  console.log('🌱 NYAYASAATHI PHASE 12: SEEDING BENEFICIARIES, ACTS & REMEDIES');
  console.log('='.repeat(80));

  try {
    // 1. Beneficiaries
    console.log('\n[1] Upserting Beneficiary Categories...');
    const beneficiariesData = [
      { name: 'Tenants', slug: 'tenants', description: 'Residential and commercial tenants seeking protection against illegal eviction or rent extortion.', icon: 'Home' },
      { name: 'Students', slug: 'students', description: 'Children, youth, and learners asserting educational rights, RTE admissions, and scholarships.', icon: 'GraduationCap' },
      { name: 'Farmers', slug: 'farmers', description: 'Agriculturalists, tenant farmers, and cultivators entitled to statutory crop insurance and land rights.', icon: 'Tractor' },
      { name: 'Arrested Persons / Accused', slug: 'accused', description: 'Individuals detained or facing criminal investigation entitled to fundamental bail and counsel safeguards.', icon: 'ShieldAlert' },
    ];

    for (const b of beneficiariesData) {
      await prisma.beneficiary.upsert({
        where: { slug: b.slug },
        update: { name: b.name, description: b.description, icon: b.icon },
        create: { name: b.name, slug: b.slug, description: b.description, icon: b.icon },
      });
      console.log(`  ✓ Beneficiary: ${b.name} (${b.slug})`);
    }

    // 2. Core Acts for Senior Citizens & Persons with Disabilities
    console.log('\n[2] Seeding Senior Citizens Act 2007 & RPwD Act 2016...');

    // 2.1 Maintenance and Welfare of Parents and Senior Citizens Act, 2007
    const seniorAct = await prisma.legalAct.upsert({
      where: { id: 'a0000000-0000-0000-0000-000000000012' },
      update: {
        verificationStatus: 'PUBLISHED',
        status: 'ACTIVE',
      },
      create: {
        id: 'a0000000-0000-0000-0000-000000000012',
        title: 'Maintenance and Welfare of Parents and Senior Citizens Act, 2007',
        actNumber: 'Act No. 56 of 2007',
        year: 2007,
        jurisdiction: 'CENTRAL',
        category: 'SENIOR_CITIZENS',
        documentType: 'ACT',
        sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2048',
        description: 'Statutory mandate requiring adult children and legal heirs to provide maintenance to senior citizens, and providing summary eviction of abusive relatives.',
        status: 'ACTIVE',
        verificationStatus: 'PUBLISHED',
        reviewNotes: 'Verified official statutory source (India Code)',
      },
    });

    // Section 4
    const secSenior4 = await prisma.legalSection.upsert({
      where: {
        actId_sectionNumber: {
          actId: seniorAct.id,
          sectionNumber: 'Section 4',
        },
      },
      update: {
        title: 'Maintenance of parents and senior citizens',
        originalText: 'A senior citizen including parent who is unable to maintain himself from his own earning or out of property owned by him, shall be entitled to make an application under section 5 against one or more children not being a minor, or against legal heirs who inherit his property.',
        simplifiedText: 'Any senior citizen or parent who cannot financially support themselves has the legal right to claim a monthly maintenance allowance from their adult children or legal heirs.',
        verificationStatus: 'PUBLISHED',
      },
      create: {
        actId: seniorAct.id,
        sectionNumber: 'Section 4',
        title: 'Maintenance of parents and senior citizens',
        originalText: 'A senior citizen including parent who is unable to maintain himself from his own earning or out of property owned by him, shall be entitled to make an application under section 5 against one or more children not being a minor, or against legal heirs who inherit his property.',
        simplifiedText: 'Any senior citizen or parent who cannot financially support themselves has the legal right to claim a monthly maintenance allowance from their adult children or legal heirs.',
        verificationStatus: 'PUBLISHED',
      },
    });

    // Section 5
    const secSenior5 = await prisma.legalSection.upsert({
      where: {
        actId_sectionNumber: {
          actId: seniorAct.id,
          sectionNumber: 'Section 5',
        },
      },
      update: {
        title: 'Application for maintenance before Maintenance Tribunal',
        originalText: 'An application for maintenance may be filed by a senior citizen or parent, or if he is incapable, by any other person or registered voluntary organization authorized by him, before the Maintenance Tribunal presided by the Sub-Divisional Officer.',
        simplifiedText: 'You or an authorized NGO can file a claim before the Sub-Divisional Magistrate (SDM) / Maintenance Tribunal without paying heavy court fees. The Tribunal must dispose of the case within 90 days.',
        verificationStatus: 'PUBLISHED',
      },
      create: {
        actId: seniorAct.id,
        sectionNumber: 'Section 5',
        title: 'Application for maintenance before Maintenance Tribunal',
        originalText: 'An application for maintenance may be filed by a senior citizen or parent, or if he is incapable, by any other person or registered voluntary organization authorized by him, before the Maintenance Tribunal presided by the Sub-Divisional Officer.',
        simplifiedText: 'You or an authorized NGO can file a claim before the Sub-Divisional Magistrate (SDM) / Maintenance Tribunal without paying heavy court fees. The Tribunal must dispose of the case within 90 days.',
        verificationStatus: 'PUBLISHED',
      },
    });

    // 2.2 Rights of Persons with Disabilities Act, 2016
    const rpwdAct = await prisma.legalAct.upsert({
      where: { id: 'a0000000-0000-0000-0000-000000000013' },
      update: {
        verificationStatus: 'PUBLISHED',
        status: 'ACTIVE',
      },
      create: {
        id: 'a0000000-0000-0000-0000-000000000013',
        title: 'Rights of Persons with Disabilities Act, 2016',
        actNumber: 'Act No. 49 of 2016',
        year: 2016,
        jurisdiction: 'CENTRAL',
        category: 'DISABILITY_RIGHTS',
        documentType: 'ACT',
        sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2155',
        description: 'Comprehensive statute guaranteeing equality, accessibility, reasonable accommodation, and statutory grievance mechanisms for persons with benchmark disabilities.',
        status: 'ACTIVE',
        verificationStatus: 'PUBLISHED',
        reviewNotes: 'Verified official statutory source (India Code)',
      },
    });

    // RPwD Section 3
    const secRpwd3 = await prisma.legalSection.upsert({
      where: {
        actId_sectionNumber: {
          actId: rpwdAct.id,
          sectionNumber: 'Section 3',
        },
      },
      update: {
        title: 'Equality and non-discrimination',
        originalText: 'The appropriate Government shall ensure that the persons with disabilities enjoy the right to equality, life with dignity and respect for his or her integrity equally with others. No person with disability shall be discriminated on the ground of disability.',
        simplifiedText: 'Persons with disabilities have the statutory right to equal treatment, dignity, barrier-free access, and reasonable accommodation. Denying adjustments or facilities is illegal.',
        verificationStatus: 'PUBLISHED',
      },
      create: {
        actId: rpwdAct.id,
        sectionNumber: 'Section 3',
        title: 'Equality and non-discrimination',
        originalText: 'The appropriate Government shall ensure that the persons with disabilities enjoy the right to equality, life with dignity and respect for his or her integrity equally with others. No person with disability shall be discriminated on the ground of disability.',
        simplifiedText: 'Persons with disabilities have the statutory right to equal treatment, dignity, barrier-free access, and reasonable accommodation. Denying adjustments or facilities is illegal.',
        verificationStatus: 'PUBLISHED',
      },
    });

    // RPwD Section 20
    const secRpwd20 = await prisma.legalSection.upsert({
      where: {
        actId_sectionNumber: {
          actId: rpwdAct.id,
          sectionNumber: 'Section 20',
        },
      },
      update: {
        title: 'Non-discrimination in employment',
        originalText: 'No government establishment shall discriminate against any person with disability in any matter relating to employment: Provided that the appropriate Government may, having regard to the type of work carried on, exempt any establishment from the provisions of this section.',
        simplifiedText: 'Workplaces cannot deny employment, promotions, or fair conditions because of disability, and must provide reasonable adjustments and accessible infrastructure.',
        verificationStatus: 'PUBLISHED',
      },
      create: {
        actId: rpwdAct.id,
        sectionNumber: 'Section 20',
        title: 'Non-discrimination in employment',
        originalText: 'No government establishment shall discriminate against any person with disability in any matter relating to employment: Provided that the appropriate Government may, having regard to the type of work carried on, exempt any establishment from the provisions of this section.',
        simplifiedText: 'Workplaces cannot deny employment, promotions, or fair conditions because of disability, and must provide reasonable adjustments and accessible infrastructure.',
        verificationStatus: 'PUBLISHED',
      },
    });

    // 3. Connect Beneficiaries to Sections
    console.log('\n[3] Linking Sections to Beneficiary Categories...');
    const seniorBeneficiary = await prisma.beneficiary.findUnique({ where: { slug: 'seniors' } });
    if (seniorBeneficiary) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO public.section_beneficiaries (section_id, beneficiary_id) VALUES ($1::uuid, $2::uuid) ON CONFLICT DO NOTHING;`,
        secSenior4.id, seniorBeneficiary.id
      );
      await prisma.$executeRawUnsafe(
        `INSERT INTO public.section_beneficiaries (section_id, beneficiary_id) VALUES ($1::uuid, $2::uuid) ON CONFLICT DO NOTHING;`,
        secSenior5.id, seniorBeneficiary.id
      );
    }

    const pwdBeneficiary = await prisma.beneficiary.findUnique({ where: { slug: 'pwd' } });
    if (pwdBeneficiary) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO public.section_beneficiaries (section_id, beneficiary_id) VALUES ($1::uuid, $2::uuid) ON CONFLICT DO NOTHING;`,
        secRpwd3.id, pwdBeneficiary.id
      );
      await prisma.$executeRawUnsafe(
        `INSERT INTO public.section_beneficiaries (section_id, beneficiary_id) VALUES ($1::uuid, $2::uuid) ON CONFLICT DO NOTHING;`,
        secRpwd20.id, pwdBeneficiary.id
      );
    }

    // 4. Seed Legal Remedies
    console.log('\n[4] Seeding Verified Legal Remedies...');
    // Find key sections in database to attach remedies:
    // 4.1 Payment of Wages Section 15
    const wagesSec = await prisma.legalSection.findFirst({
      where: { act: { title: { contains: 'Payment of Wages' } }, sectionNumber: 'Section 15' },
    });
    if (wagesSec) {
      await prisma.legalRemedy.create({
        data: {
          sectionId: wagesSec.id,
          remedyType: 'AUTHORITY',
          title: 'Section 15 Claim with Compensation up to 10x',
          description: 'File a formal claim before the Labour Commissioner / Payment of Wages Authority for delayed wages recovery plus statutory penalty up to 10 times the delayed amount.',
          authority: 'Authority under Section 15, Payment of Wages Act / Labour Commissioner',
          timeLimit: '12 months from the date wages were due',
          officialUrl: 'https://shramsuvidha.gov.in',
          contactInfo: 'Shram Suvidha Portal / Local District Labour Office',
        },
      });
      console.log('  ✓ Added Remedy for Payment of Wages Act Sec. 15');
    }

    // 4.2 Domestic Violence Protection Order
    const pwdvaSec = await prisma.legalSection.findFirst({
      where: { act: { title: { contains: 'Domestic Violence' } }, sectionNumber: { in: ['Section 3', 'Section 12'] } },
    });
    if (pwdvaSec) {
      await prisma.legalRemedy.create({
        data: {
          sectionId: pwdvaSec.id,
          remedyType: 'COURT',
          title: 'Magistrate Application for Protection & Residence Orders (Section 12)',
          description: 'Apply directly before the Judicial Magistrate First Class (JMFC) or Metropolitan Magistrate for Protection Orders (Sec. 18), Residence Orders (Sec. 19), and Monetary Relief (Sec. 20).',
          authority: 'Judicial Magistrate First Class / Protection Officer under PWDVA',
          timeLimit: 'Immediate; first court hearing mandated within 3 days',
          officialUrl: 'https://nalsa.gov.in',
          contactInfo: 'Women Helpline 181 / Local Protection Officer / DLSA',
        },
      });
      console.log('  ✓ Added Remedy for PWDVA Domestic Violence');
    }

    // 4.3 Consumer Protection Section 35
    const consumerSec = await prisma.legalSection.findFirst({
      where: { act: { title: { contains: 'Consumer Protection' } }, sectionNumber: { contains: '35' } },
    }) || await prisma.legalSection.findFirst({
      where: { act: { title: { contains: 'Consumer Protection' } } },
    });
    if (consumerSec) {
      await prisma.legalRemedy.create({
        data: {
          sectionId: consumerSec.id,
          remedyType: 'TRIBUNAL',
          title: 'Consumer Grievance Redressal before District Commission (e-Daakhil)',
          description: 'File an online consumer complaint via e-Daakhil portal for product replacement, full refund, and compensation for mental agony and deficiency in service.',
          authority: 'District Consumer Disputes Redressal Commission (DCDRC)',
          timeLimit: 'Within 2 years from date of cause of action',
          officialUrl: 'https://edaakhil.nic.in',
          contactInfo: 'National Consumer Helpline: 1915 or edaakhil.nic.in',
        },
      });
      console.log('  ✓ Added Remedy for Consumer Protection Act');
    }

    // 4.4 Senior Citizens Section 5
    await prisma.legalRemedy.create({
      data: {
        sectionId: secSenior5.id,
        remedyType: 'TRIBUNAL',
        title: 'Maintenance Tribunal Application before Sub-Divisional Magistrate',
        description: 'File summary petition before the SDM / Maintenance Tribunal for monthly maintenance allowance and eviction of abusive children/heirs from parent property.',
        authority: 'Maintenance Tribunal / Sub-Divisional Officer (SDO/SDM)',
        timeLimit: '90 days mandatory case disposal under Section 5(4)',
        officialUrl: 'https://socialjustice.gov.in',
        contactInfo: 'Senior Citizen Helpline 14567 (Elder Line)',
      },
    });
    console.log('  ✓ Added Remedy for Senior Citizens Maintenance Act');

    // 4.5 RPwD Section 3
    await prisma.legalRemedy.create({
      data: {
        sectionId: secRpwd3.id,
        remedyType: 'AUTHORITY',
        title: 'Complaint to State Commissioner for Persons with Disabilities',
        description: 'File complaint before the State Commissioner or Chief Commissioner for Persons with Disabilities against denial of reasonable accommodation, accessibility barriers, or workplace discrimination.',
        authority: 'State Commissioner for Persons with Disabilities',
        timeLimit: 'No strict limitation period; immediate hearing',
        officialUrl: 'https://disabilityaffairs.gov.in',
        contactInfo: 'Chief Commissioner for Persons with Disabilities (CCPD) portal',
      },
    });
    console.log('  ✓ Added Remedy for Rights of Persons with Disabilities Act');

    // 4.6 Constitution Article 22 / Criminal Custody
    const art22Sec = await prisma.legalSection.findFirst({
      where: { act: { title: { contains: 'Constitution' } }, sectionNumber: 'Article 22' },
    });
    if (art22Sec) {
      await prisma.legalRemedy.create({
        data: {
          sectionId: art22Sec.id,
          remedyType: 'COURT',
          title: 'Right to Counsel, Grounds of Arrest & 24-Hour Magistrate Production',
          description: 'Demand grounds of arrest in writing, immediate intimation to nominated friend/family, production before nearest Magistrate within 24 hours excluding travel time, and free legal aid counsel under Article 22(1) and CrPC Section 50/57.',
          authority: 'Judicial Magistrate / High Court under Article 226 (Habeas Corpus)',
          timeLimit: 'Mandatory 24 hours from detention',
          officialUrl: 'https://nalsa.gov.in',
          contactInfo: 'NALSA Helpline 15100 / DLSA Remand Advocate',
        },
      });
      console.log('  ✓ Added Remedy for Article 22 Arrest & Detention Safeguards');
    }

    // 4.7 Legal Services Authorities Act Section 12
    const lsaaSec = await prisma.legalSection.findFirst({
      where: { act: { title: { contains: 'Legal Services' } }, sectionNumber: { contains: '12' } },
    }) || await prisma.legalSection.findFirst({
      where: { act: { title: { contains: 'Legal Services' } } },
    });
    if (lsaaSec) {
      await prisma.legalRemedy.create({
        data: {
          sectionId: lsaaSec.id,
          remedyType: 'AUTHORITY',
          title: 'Free Legal Representation through District Legal Services Authority (DLSA)',
          description: 'Submit Application for Free Legal Services before District or Taluka Legal Services Committee. 100% free advocate appointed, court fees paid by State, and certified copy expenses covered for eligible beneficiaries.',
          authority: 'District Legal Services Authority (DLSA) / Taluka Legal Services Committee',
          timeLimit: 'At any stage before or during court proceedings',
          officialUrl: 'https://nalsa.gov.in',
          contactInfo: 'National Legal Helpline 15100 (Toll Free 24x7) / dlsa.gov.in',
        },
      });
      console.log('  ✓ Added Remedy for LSAA Free Legal Aid');
    }

    // 5. Trigger pgvector indexing for newly published Acts
    console.log('\n[5] Synchronizing pgvector chunks...');
    const resSenior = await kmsRAGSyncService.syncActChunks(seniorAct.id);
    const resRpwd = await kmsRAGSyncService.syncActChunks(rpwdAct.id);
    console.log(`  ✓ Synced Senior Citizens Act: ${resSenior.synced} chunks`);
    console.log(`  ✓ Synced RPwD Act: ${resRpwd.synced} chunks`);

    console.log('\n✅ PHASE 12 SEEDING COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedPhase12();
