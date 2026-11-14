import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding NyayaSaathi database with canonical UUID records...');

  // 1. Right Categories
  const categories = [
    { name: 'Labour Rights', slug: 'labour', description: 'Wages, overtime, workplace conditions, and industrial dispute safeguards.', icon: 'Briefcase' },
    { name: 'Women Rights', slug: 'women', description: 'Protection against domestic violence, workplace harassment (POSH), and maintenance.', icon: 'ShieldAlert' },
    { name: 'Child Rights', slug: 'children', description: 'Right to free education, prohibition of child labour, and POCSO protections.', icon: 'Baby' },
    { name: 'Consumer Rights', slug: 'consumer', description: 'Remedies against defective goods, deficient services, unfair trade, and misleading ads.', icon: 'ShoppingBag' },
    { name: 'Constitutional Rights', slug: 'constitutional', description: 'Fundamental rights, right to equality, freedom of speech, and Article 32/226 remedies.', icon: 'Scale' },
    { name: 'Criminal Law', slug: 'criminal', description: 'FIR registration, arrest rights, bail provisions under BNS and BNSS.', icon: 'Gavel' },
    { name: 'Disability Rights', slug: 'disability', description: 'Rights of Persons with Disabilities Act (RPwD) 2016, accessibility and equality.', icon: 'Accessibility' },
    { name: 'Senior Citizen Rights', slug: 'senior-citizens', description: 'Maintenance and Welfare of Parents and Senior Citizens Act provisions.', icon: 'HeartHandshake' },
    { name: 'Property Rights', slug: 'property', description: 'Land records, tenant protections, inheritance laws, and rent agreements.', icon: 'Home' },
    { name: 'Tribal Rights', slug: 'tribal', description: 'Forest Rights Act (FRA), PESA provisions, and community resource entitlements.', icon: 'Trees' },
  ];

  for (const cat of categories) {
    await prisma.rightCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }

  // 2. Beneficiaries
  const beneficiaries = [
    { name: 'Workers', slug: 'workers', description: 'Formal and informal sector labourers, gig workers, and daily wage earners.', icon: 'HardHat' },
    { name: 'Women', slug: 'women', description: 'Women seeking domestic safety, financial independence, and equal treatment.', icon: 'UserCheck' },
    { name: 'Children', slug: 'children', description: 'Minors up to 18 years seeking education, welfare, and safety.', icon: 'Smile' },
    { name: 'Consumers', slug: 'consumers', description: 'Any individual purchasing goods or hiring services for personal consideration.', icon: 'ShoppingCart' },
    { name: 'SC/ST Communities', slug: 'sc-st', description: 'Scheduled Castes and Scheduled Tribes entitled to special protections.', icon: 'Users' },
    { name: 'Persons with Disabilities', slug: 'pwd', description: 'Individuals protected under the RPwD Act 2016 with physical or sensory impairments.', icon: 'LifeBuoy' },
    { name: 'Senior Citizens', slug: 'seniors', description: 'Citizens aged 60 and above requiring welfare, pension, and maintenance.', icon: 'Heart' },
    { name: 'Tribal Communities', slug: 'tribal', description: 'Forest Rights Act and Panchayats (Extension to Scheduled Areas) Act.', icon: 'Globe' },
  ];

  for (const ben of beneficiaries) {
    await prisma.beneficiary.upsert({
      where: { slug: ben.slug },
      update: ben,
      create: ben,
    });
  }

  // 3. Legal Acts (Canonical UUIDs matching supabase/schema.sql)
  const paymentOfWages = await prisma.legalAct.upsert({
    where: { id: 'a0000000-0000-0000-0000-000000000001' },
    update: {
      title: 'Payment of Wages Act, 1936',
      actNumber: 'Act No. 4 of 1936',
      year: 1936,
      jurisdiction: 'CENTRAL',
      category: 'LABOUR',
      sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2367',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
    },
    create: {
      id: 'a0000000-0000-0000-0000-000000000001',
      title: 'Payment of Wages Act, 1936',
      actNumber: 'Act No. 4 of 1936',
      year: 1936,
      jurisdiction: 'CENTRAL',
      category: 'LABOUR',
      sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2367',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
    },
  });

  const pwdva = await prisma.legalAct.upsert({
    where: { id: 'a0000000-0000-0000-0000-000000000002' },
    update: {
      title: 'Protection of Women from Domestic Violence Act, 2005',
      actNumber: 'Act No. 43 of 2005',
      year: 2005,
      jurisdiction: 'CENTRAL',
      category: 'WOMEN',
      sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2021',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
    },
    create: {
      id: 'a0000000-0000-0000-0000-000000000002',
      title: 'Protection of Women from Domestic Violence Act, 2005',
      actNumber: 'Act No. 43 of 2005',
      year: 2005,
      jurisdiction: 'CENTRAL',
      category: 'WOMEN',
      sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2021',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
    },
  });

  const cpa = await prisma.legalAct.upsert({
    where: { id: 'a0000000-0000-0000-0000-000000000003' },
    update: {
      title: 'Consumer Protection Act, 2019',
      actNumber: 'Act No. 35 of 2019',
      year: 2019,
      jurisdiction: 'CENTRAL',
      category: 'CONSUMER',
      sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/15256',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
    },
    create: {
      id: 'a0000000-0000-0000-0000-000000000003',
      title: 'Consumer Protection Act, 2019',
      actNumber: 'Act No. 35 of 2019',
      year: 2019,
      jurisdiction: 'CENTRAL',
      category: 'CONSUMER',
      sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/15256',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
    },
  });

  const minimumWages = await prisma.legalAct.upsert({
    where: { id: 'a0000000-0000-0000-0000-000000000004' },
    update: {
      title: 'Minimum Wages Act, 1948',
      actNumber: 'Act No. 11 of 1948',
      year: 1948,
      jurisdiction: 'CENTRAL',
      category: 'LABOUR',
      sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2368',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
    },
    create: {
      id: 'a0000000-0000-0000-0000-000000000004',
      title: 'Minimum Wages Act, 1948',
      actNumber: 'Act No. 11 of 1948',
      year: 1948,
      jurisdiction: 'CENTRAL',
      category: 'LABOUR',
      sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2368',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
    },
  });

  const rte = await prisma.legalAct.upsert({
    where: { id: 'a0000000-0000-0000-0000-000000000005' },
    update: {
      title: 'Right of Children to Free and Compulsory Education Act, 2009',
      actNumber: 'Act No. 35 of 2009',
      year: 2009,
      jurisdiction: 'CENTRAL',
      category: 'CHILDREN',
      sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2083',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
    },
    create: {
      id: 'a0000000-0000-0000-0000-000000000005',
      title: 'Right of Children to Free and Compulsory Education Act, 2009',
      actNumber: 'Act No. 35 of 2009',
      year: 2009,
      jurisdiction: 'CENTRAL',
      category: 'CHILDREN',
      sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2083',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
    },
  });

  // 4. Legal Sections (Canonical UUIDs matching supabase/schema.sql)
  const sec5Wages = await prisma.legalSection.upsert({
    where: { actId_sectionNumber: { actId: paymentOfWages.id, sectionNumber: 'Section 5' } },
    update: {},
    create: {
      id: 'b0000000-0000-0000-0000-000000000001',
      actId: paymentOfWages.id,
      sectionNumber: 'Section 5',
      title: 'Time of payment of wages',
      originalText: 'The wages of every person employed upon or in any railway, factory or industrial or other establishment upon or in which less than one thousand persons are employed, shall be paid before the expiry of the seventh day, and in other cases before the tenth day, after the last day of the wage-period.',
      simplifiedText: 'Your employer is required by law to pay your earned salary on or before the 7th of every month (or 10th if there are over 1000 employees). Withholding salary beyond this deadline is illegal.',
    },
  });

  const sec15Wages = await prisma.legalSection.upsert({
    where: { actId_sectionNumber: { actId: paymentOfWages.id, sectionNumber: 'Section 15' } },
    update: {},
    create: {
      id: 'b0000000-0000-0000-0000-000000000002',
      actId: paymentOfWages.id,
      sectionNumber: 'Section 15',
      title: 'Claims arising out of deductions from wages or delay in payment',
      originalText: 'Where contrary to the provisions of this Act any deduction has been made from the wages of an employed person, or any payment of wages has been delayed, such person himself, or any legal practitioner or any official of a registered trade union authorized in writing, may apply to such Authority for a direction under sub-section (3).',
      simplifiedText: 'If your wages are delayed or unlawfully deducted, you or your union can file an official compensation claim with the Labour Commissioner Authority to recover all back-pay plus statutory compensation up to 10 times the amount.',
    },
  });

  const sec3DV = await prisma.legalSection.upsert({
    where: { actId_sectionNumber: { actId: pwdva.id, sectionNumber: 'Section 3' } },
    update: {},
    create: {
      id: 'b0000000-0000-0000-0000-000000000003',
      actId: pwdva.id,
      sectionNumber: 'Section 3',
      title: 'Definition of domestic violence',
      originalText: 'Any act, omission or commission or conduct of the respondent shall constitute domestic violence if it harms or injures or endangers the health, safety, life, limb or well-being, whether mental or physical, of the aggrieved person and includes causing physical abuse, sexual abuse, verbal and emotional abuse and economic abuse.',
      simplifiedText: 'Domestic violence includes not just physical beating, but also emotional harassment, insults, denial of food/money (economic abuse), or threats. You have the right to live safely in the shared household without any intimidation.',
    },
  });

  const sec12DV = await prisma.legalSection.upsert({
    where: { actId_sectionNumber: { actId: pwdva.id, sectionNumber: 'Section 12' } },
    update: {},
    create: {
      id: 'b0000000-0000-0000-0000-000000000004',
      actId: pwdva.id,
      sectionNumber: 'Section 12',
      title: 'Application to Magistrate',
      originalText: 'An aggrieved person or a Protection Officer or any other person on behalf of the aggrieved person may present an application to the Magistrate seeking one or more reliefs under this Act.',
      simplifiedText: 'You or a Protection Officer can file a direct petition before the Judicial Magistrate to immediately obtain restraining orders, monthly maintenance, and medical expenses without needing costly private lawyers.',
    },
  });

  const sec35CPA = await prisma.legalSection.upsert({
    where: { actId_sectionNumber: { actId: cpa.id, sectionNumber: 'Section 35' } },
    update: {},
    create: {
      id: 'b0000000-0000-0000-0000-000000000005',
      actId: cpa.id,
      sectionNumber: 'Section 35',
      title: 'Complaint to District Commission',
      originalText: 'A complaint, in relation to any goods sold or delivered or agreed to be sold or delivered or any service provided or agreed to be provided, may be filed with a District Commission by the consumer to whom such goods are sold or delivered.',
      simplifiedText: 'Any customer who receives a defective item, expired goods, or fake warranty can file an online or physical consumer complaint via the eDaakhil portal without needing an advocate.',
    },
  });

  // Link Relations
  const labourCat = await prisma.rightCategory.findUnique({ where: { slug: 'labour' } });
  const womenCat = await prisma.rightCategory.findUnique({ where: { slug: 'women' } });
  const consumerCat = await prisma.rightCategory.findUnique({ where: { slug: 'consumer' } });

  const workerBen = await prisma.beneficiary.findUnique({ where: { slug: 'workers' } });
  const womenBen = await prisma.beneficiary.findUnique({ where: { slug: 'women' } });
  const consumerBen = await prisma.beneficiary.findUnique({ where: { slug: 'consumers' } });

  if (labourCat && workerBen) {
    await prisma.sectionRight.upsert({
      where: { sectionId_rightCategoryId: { sectionId: sec5Wages.id, rightCategoryId: labourCat.id } },
      update: {},
      create: { sectionId: sec5Wages.id, rightCategoryId: labourCat.id },
    });
    await prisma.sectionBeneficiary.upsert({
      where: { sectionId_beneficiaryId: { sectionId: sec5Wages.id, beneficiaryId: workerBen.id } },
      update: {},
      create: { sectionId: sec5Wages.id, beneficiaryId: workerBen.id },
    });
  }

  if (womenCat && womenBen) {
    await prisma.sectionRight.upsert({
      where: { sectionId_rightCategoryId: { sectionId: sec3DV.id, rightCategoryId: womenCat.id } },
      update: {},
      create: { sectionId: sec3DV.id, rightCategoryId: womenCat.id },
    });
    await prisma.sectionBeneficiary.upsert({
      where: { sectionId_beneficiaryId: { sectionId: sec3DV.id, beneficiaryId: womenBen.id } },
      update: {},
      create: { sectionId: sec3DV.id, beneficiaryId: womenBen.id },
    });
  }

  // 5. Workflows
  const unpaidWagesWf = await prisma.complaintWorkflow.upsert({
    where: { id: 'c0000000-0000-0000-0000-000000000001' },
    update: {
      category: 'LABOUR',
      title: 'Recovery of Unpaid Wages or Delayed Salary',
      description: 'Step-by-step statutory process for informal and formal employees to recover withheld salaries under the Payment of Wages Act.',
      targetAuthority: 'Labour Commissioner Office / DLSA',
      officialUrl: 'https://shramsuvidha.gov.in',
    },
    create: {
      id: 'c0000000-0000-0000-0000-000000000001',
      category: 'LABOUR',
      categoryId: labourCat?.id,
      title: 'Recovery of Unpaid Wages or Delayed Salary',
      description: 'Step-by-step statutory process for informal and formal employees to recover withheld salaries under the Payment of Wages Act.',
      targetAuthority: 'Labour Commissioner Office / DLSA',
      officialUrl: 'https://shramsuvidha.gov.in',
    },
  });

  const unpaidWagesSteps = [
    {
      stepNumber: 1,
      title: 'Compile Employment Proof & Attendance Logs',
      description: 'Assemble offer letter, salary slips, bank transaction records, WhatsApp chats, or muster roll logs showing worked hours.',
      instructions: 'Assemble offer letter, salary slips, bank transaction records, WhatsApp chats, or muster roll logs showing worked hours.',
      documents: ['Bank Statement', 'Appointment Letter / ID card', 'WhatsApp/Email communication', 'Muster roll entry'],
      requiredDocuments: ['Bank Statement', 'Appointment Letter / ID card', 'WhatsApp/Email communication', 'Muster roll entry'],
      timeLimit: 'Within 7 days of salary default',
    },
    {
      stepNumber: 2,
      title: 'Serve a Formal Demand Letter / Legal Notice',
      description: 'Send a registered notice giving employer 7 days to clear pending arrears failing which formal labour proceedings will commence.',
      instructions: 'Send a registered notice giving employer 7 days to clear pending arrears failing which formal labour proceedings will commence.',
      timeLimit: '7 to 15 days notice window',
    },
    {
      stepNumber: 3,
      title: 'File Grievance on Shram Suvidha / Samadhan Portal',
      description: 'Register an online dispute on the Ministry of Labour grievance portal or state labour commission website.',
      instructions: 'Register an online dispute on the Ministry of Labour grievance portal or state labour commission website.',
      officialUrl: 'https://shramsuvidha.gov.in',
      authority: 'Labour Commissioner Office / Shram Suvidha',
    },
    {
      stepNumber: 4,
      title: 'File Section 15 Claim before Authority / DLSA',
      description: 'If unresolved, file a formal petition under Section 15 of Payment of Wages Act. Free DLSA representation is guaranteed if needed.',
      instructions: 'If unresolved, file a formal petition under Section 15 of Payment of Wages Act. Free DLSA representation is guaranteed if needed.',
      authority: 'District Labour Court / District Legal Services Authority (DLSA)',
      officialUrl: 'https://nalsa.gov.in',
    },
  ];

  for (const step of unpaidWagesSteps) {
    await prisma.complaintStep.upsert({
      where: {
        workflowId_stepNumber: {
          workflowId: unpaidWagesWf.id,
          stepNumber: step.stepNumber,
        },
      },
      update: step,
      create: {
        ...step,
        workflowId: unpaidWagesWf.id,
      },
    });
  }

  // 6. Legal Aid Providers (NALSA / SLSAs)
  const providers = [
    {
      id: 'd0000000-0000-0000-0000-000000000001',
      name: 'National Legal Services Authority (NALSA)',
      type: 'NALSA',
      state: 'Delhi',
      district: 'New Delhi',
      address: 'B-Block, Additional Office Complex, Supreme Court of India, New Delhi',
      phone: '15100',
      email: 'nalsa-dla@nic.in',
      website: 'https://nalsa.gov.in',
      eligibility: 'All women, children, SC/ST, custody inmates, disabled, and citizens with annual income below ₹1-3 Lakhs.',
      services: ['Free Advocate in Court', 'Legal Advice', 'Lok Adalat dispute settlement', 'Prison legal aid'],
      isActive: true,
      verified: true,
    },
    {
      id: 'd0000000-0000-0000-0000-000000000002',
      name: 'Maharashtra State Legal Services Authority (MSLSA)',
      type: 'SLSA',
      state: 'Maharashtra',
      district: 'Mumbai',
      address: 'High Court PWD Building, Fort, Mumbai - 400032',
      phone: '022-22691395',
      email: 'mslsa-hc@nic.in',
      website: 'https://legalservices.maharashtra.gov.in',
      eligibility: 'Residents of Maharashtra meeting Section 12 criteria or income below ₹3 Lakhs.',
      services: ['DLSA referral', 'Panel advocate appointment', 'Pre-litigation mediation'],
      isActive: true,
      verified: true,
    },
    {
      id: 'd0000000-0000-0000-0000-000000000003',
      name: 'Delhi State Legal Services Authority (DSLSA)',
      type: 'SLSA',
      state: 'Delhi',
      district: 'Central',
      address: 'Central Office, Patiala House Courts Complex, New Delhi - 110001',
      phone: '1516',
      email: 'dslsa-phc@nic.in',
      website: 'https://dslsa.org',
      eligibility: 'Delhi residents with income below ₹3,00,000 or falling in protected classes.',
      services: ['Front office legal clinics', 'Free legal representation', 'Victim compensation scheme'],
      isActive: true,
      verified: true,
    },
  ];

  for (const prov of providers) {
    await prisma.legalAidProvider.upsert({
      where: { id: prov.id },
      update: prov,
      create: prov,
    });
  }

  console.log('Database successfully seeded with compatible UUID records!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
