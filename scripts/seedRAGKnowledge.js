import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import { PrismaClient } from '@prisma/client';
import { embeddingService } from '../ai-engine/src/services/embeddingService.js';

const prisma = new PrismaClient();

const ADDITIONAL_ACTS = [
  {
    id: 'a0000000-0000-0000-0000-000000000006',
    title: 'Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013',
    actNumber: 'Act No. 14 of 2013',
    year: 2013,
    jurisdiction: 'CENTRAL',
    category: 'WOMEN',
    sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2104',
    status: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    sections: [
      {
        id: 'b0000000-0000-0000-0000-000000000006',
        sectionNumber: 'Section 4',
        title: 'Constitution of Internal Complaints Committee',
        originalText: 'Every employer of a workplace shall, by an order in writing, constitute a Committee to be known as the Internal Complaints Committee (ICC). Where the offices or administrative units of the workplace are located at different places or divisional or sub-divisional levels, the Internal Committee shall be constituted at all administrative units or offices.',
        simplifiedText: 'Any organization with 10 or more employees must mandatorily establish an Internal Complaints Committee (ICC) headed by a senior woman employee to receive and inquire into workplace harassment complaints.',
        categorySlug: 'women',
        beneficiarySlug: 'women',
      },
      {
        id: 'b0000000-0000-0000-0000-000000000007',
        sectionNumber: 'Section 9',
        title: 'Complaint of sexual harassment',
        originalText: 'Any aggrieved woman may make, in writing, a complaint of sexual harassment at workplace to the Internal Committee if so constituted, or the Local Committee, within a period of three months from the date of incident and in case of a series of incidents, within a period of three months from the date of last incident.',
        simplifiedText: 'A woman employee can file a written complaint of workplace sexual harassment to the Internal Committee (ICC) within 3 months of the incident, extendable by another 3 months if circumstances prevented timely filing.',
        categorySlug: 'women',
        beneficiarySlug: 'women',
      },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000007',
    title: 'Legal Services Authorities Act, 1987',
    actNumber: 'Act No. 39 of 1987',
    year: 1987,
    jurisdiction: 'CENTRAL',
    category: 'LEGAL_AID',
    sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/1944',
    status: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    sections: [
      {
        id: 'b0000000-0000-0000-0000-000000000008',
        sectionNumber: 'Section 12',
        title: 'Criteria for giving legal services',
        originalText: 'Every person who has to file or defend a case shall be entitled to legal services under this Act if that person is a member of a Scheduled Caste or Scheduled Tribe, a victim of trafficking in human beings or begar, a woman or a child, a person with disability, an industrial workman, or a person in custody, or a citizen whose annual income does not exceed statutory limits.',
        simplifiedText: 'All women, children, workers, persons with disabilities, SC/ST individuals, and citizens below statutory income ceilings are entitled to 100% free legal aid, including free court-appointed advocates via NALSA Helpline 15100 or local DLSAs.',
        categorySlug: 'constitutional',
        beneficiarySlug: 'women',
      },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000008',
    title: 'Transfer of Property Act, 1882',
    actNumber: 'Act No. 4 of 1882',
    year: 1882,
    jurisdiction: 'CENTRAL',
    category: 'PROPERTY',
    sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2338',
    status: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    sections: [
      {
        id: 'b0000000-0000-0000-0000-000000000009',
        sectionNumber: 'Section 106',
        title: 'Duration of certain leases in absence of written contract',
        originalText: 'In the absence of a contract or local law or usage to the contrary, a lease of immovable property for any other purpose shall be deemed to be a lease from month to month, terminable, on the part of either lessor or lessee, by fifteen days notice.',
        simplifiedText: 'Tenants cannot be evicted arbitrarily without proper legal notice. In month-to-month tenancies, landlords must give at least 15 days written notice before seeking possession.',
        categorySlug: 'property',
        beneficiarySlug: 'workers',
      },
      {
        id: 'b0000000-0000-0000-0000-000000000010',
        sectionNumber: 'Section 108',
        title: 'Rights and liabilities of lessor and lessee',
        originalText: 'The lessor is bound to disclose to the lessee any material defect in the property with reference to its intended use, and the lessee is entitled to quiet enjoyment of the property during the term without interruption, provided rent is paid.',
        simplifiedText: 'A tenant who pays rent on time has the statutory right to peaceful and uninterrupted possession of the rented premises. Landlords cannot cut off water, electricity, or lock doors unlawfully.',
        categorySlug: 'property',
        beneficiarySlug: 'workers',
      },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000009',
    title: 'Constitution of India, 1950',
    actNumber: 'Constituent Assembly of India',
    year: 1950,
    jurisdiction: 'CENTRAL',
    category: 'CONSTITUTIONAL',
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    status: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    sections: [
      {
        id: 'b0000000-0000-0000-0000-000000000011',
        sectionNumber: 'Article 14',
        title: 'Equality before law',
        originalText: 'The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India.',
        simplifiedText: 'All individuals are equal before the law and entitled to protection without arbitrary discrimination by any government body or state authority.',
        categorySlug: 'constitutional',
        beneficiarySlug: 'workers',
      },
      {
        id: 'b0000000-0000-0000-0000-000000000012',
        sectionNumber: 'Article 21',
        title: 'Protection of life and personal liberty',
        originalText: 'No person shall be deprived of his life or personal liberty except according to procedure established by law.',
        simplifiedText: 'The right to life includes the right to live with human dignity, livelihood, clean environment, privacy, and protection against unlawful police arrest or detention.',
        categorySlug: 'constitutional',
        beneficiarySlug: 'workers',
      },
      {
        id: 'b0000000-0000-0000-0000-000000000013',
        sectionNumber: 'Article 39A',
        title: 'Equal justice and free legal aid',
        originalText: 'The State shall secure that the operation of the legal system promotes justice, on a basis of equal opportunity, and shall, in particular, provide free legal aid, by suitable legislation or schemes or in any other way, to ensure that opportunities for securing justice are not denied to any citizen by reason of economic or other disabilities.',
        simplifiedText: 'The Constitution mandates the Indian government to provide free legal lawyers and aid so poverty or lack of money never denies any citizen access to courts.',
        categorySlug: 'constitutional',
        beneficiarySlug: 'workers',
      },
    ],
  },
];

async function seed() {
  console.log('Seeding additional canonical statutory acts, sections & vector embeddings...');

  for (const actData of ADDITIONAL_ACTS) {
    const { sections, ...actFields } = actData;
    await prisma.legalAct.upsert({
      where: { id: actFields.id },
      update: actFields,
      create: actFields,
    });
    console.log(`✓ Act: ${actFields.title}`);

    for (const secData of sections) {
      const { categorySlug, beneficiarySlug, ...secFields } = secData;
      await prisma.legalSection.upsert({
        where: { actId_sectionNumber: { actId: actFields.id, sectionNumber: secFields.sectionNumber } },
        update: {
          title: secFields.title,
          originalText: secFields.originalText,
          simplifiedText: secFields.simplifiedText,
        },
        create: {
          id: secFields.id,
          actId: actFields.id,
          sectionNumber: secFields.sectionNumber,
          title: secFields.title,
          originalText: secFields.originalText,
          simplifiedText: secFields.simplifiedText,
        },
      });

      // Link category if exists
      const cat = await prisma.rightCategory.findUnique({ where: { slug: categorySlug } });
      if (cat) {
        await prisma.sectionRight.upsert({
          where: { sectionId_rightCategoryId: { sectionId: secFields.id, rightCategoryId: cat.id } },
          update: {},
          create: { sectionId: secFields.id, rightCategoryId: cat.id },
        });
      }

      // Link beneficiary if exists
      const ben = await prisma.beneficiary.findUnique({ where: { slug: beneficiarySlug } });
      if (ben) {
        await prisma.sectionBeneficiary.upsert({
          where: { sectionId_beneficiaryId: { sectionId: secFields.id, beneficiaryId: ben.id } },
          update: {},
          create: { sectionId: secFields.id, beneficiaryId: ben.id },
        });
      }

      // Generate embedding & upsert chunk
      const chunkText = `${actFields.title}, ${secFields.sectionNumber}, ${secFields.title}\n\n${secFields.simplifiedText}\n\n${secFields.originalText}`;
      const vector = await embeddingService.embedText(chunkText);
      const vectorStr = `[${vector.join(',')}]`;

      // Upsert into legal_chunks using raw SQL for the vector column
      await prisma.$executeRawUnsafe(
        `INSERT INTO legal_chunks (id, section_id, content, chunk_number, language, source_url, embedding, updated_at)
         VALUES (gen_random_uuid(), $1::uuid, $2, 1, 'en', $3, $4::vector, NOW())
         ON CONFLICT (section_id, chunk_number, language)
         DO UPDATE SET content = $2, source_url = $3, embedding = $4::vector, updated_at = NOW();`,
        secFields.id,
        chunkText,
        actFields.sourceUrl,
        vectorStr
      );

      console.log(`  ✓ Section: ${secFields.sectionNumber} — ${secFields.title} (embedded & indexed)`);
    }
  }

  const totalChunks = await prisma.legalChunk.count();
  console.log(`\nAll statutory domains indexed! Total legal_chunks in database: ${totalChunks}`);
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
