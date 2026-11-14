/**
 * NyayaSaathi — Central Legislation & Subordinate Rules Corpus Generator
 *
 * Compiles canonical structured metadata, section/rule provisions, enabling act links,
 * and plain-language KYR summaries for primary Central Acts and Subordinate Rules.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const OUTPUT_PATH = path.resolve('data/legislation/central_legislation_corpus.json');

const CENTRAL_LEGISLATION_DATA = [
  // --------------------------------------------------------------------------
  // 1. Primary Central Acts
  // --------------------------------------------------------------------------
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Payment of Wages Act, 1936',
    actNumber: 'Act No. 4 of 1936',
    year: 1936,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Labour and Employment',
    documentType: 'ACT',
    category: 'LABOUR',
    status: 'ACTIVE',
    verificationStatus: 'PUBLISHED',
    enactmentDate: '1936-04-23',
    effectiveFrom: '1937-03-28',
    sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2367',
    description: 'Regulates the timely payment of earned wages and prohibits unauthorized wage deductions from employees.',
    sections: [
      {
        sectionNumber: 'Section 5',
        title: 'Time of payment of wages',
        originalText: 'The wages of every person employed upon or in any railway, factory or industrial establishment upon or in which less than one thousand persons are employed, shall be paid before the expiry of the seventh day, and in other cases before the tenth day, after the last day of the wage-period.',
        simplifiedText: 'Employers must pay earned wages within 7 days of the wage period (or within 10 days if employing 1000+ workers). Delayed payment is punishable under law.',
        category: 'LABOUR'
      },
      {
        sectionNumber: 'Section 15',
        title: 'Claims arising out of deductions from wages or delay in payment',
        originalText: 'Where contrary to the provisions of this Act any deduction has been made from the wages of an employed person, or any payment of wages has been delayed, such person or legal practitioner or trade union official may apply to the Authority for payment of wages plus compensation up to ten times the withheld amount.',
        simplifiedText: 'Aggrieved workers can file a claim before the Labour Commissioner Authority to recover unpaid salary plus statutory compensation up to ten times the delayed amount.',
        category: 'LABOUR'
      }
    ]
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    title: 'Protection of Women from Domestic Violence Act, 2005',
    actNumber: 'Act No. 43 of 2005',
    year: 2005,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Women and Child Development',
    documentType: 'ACT',
    category: 'WOMEN_RIGHTS',
    status: 'ACTIVE',
    verificationStatus: 'PUBLISHED',
    enactmentDate: '2005-09-13',
    effectiveFrom: '2006-10-26',
    sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2021',
    description: 'Provides civil remedies, protection orders, residence rights, and maintenance for women experiencing domestic abuse.',
    sections: [
      {
        sectionNumber: 'Section 3',
        title: 'Definition of domestic violence',
        originalText: 'Any act, omission or commission or conduct of the respondent shall constitute domestic violence if it harms or injures or endangers the health, safety, life, limb or well-being, whether mental or physical, of the aggrieved person and includes physical abuse, sexual abuse, verbal and emotional abuse and economic abuse.',
        simplifiedText: 'Domestic violence includes physical assault, emotional humiliation, verbal insults, denial of financial support, and economic abuse.',
        category: 'WOMEN_RIGHTS'
      },
      {
        sectionNumber: 'Section 12',
        title: 'Application to Magistrate',
        originalText: 'An aggrieved person or a Protection Officer or any other person on behalf of the aggrieved person may present an application to the Magistrate seeking one or more reliefs under this Act.',
        simplifiedText: 'An aggrieved woman or Protection Officer can file a direct petition before the Judicial Magistrate for emergency protection, residence, and maintenance.',
        category: 'WOMEN_RIGHTS'
      }
    ]
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    title: 'Consumer Protection Act, 2019',
    actNumber: 'Act No. 35 of 2019',
    year: 2019,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Consumer Affairs, Food and Public Distribution',
    documentType: 'ACT',
    category: 'CONSUMER',
    status: 'ACTIVE',
    verificationStatus: 'PUBLISHED',
    enactmentDate: '2019-08-09',
    effectiveFrom: '2020-07-20',
    sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/15256',
    description: 'Protects consumer interests against unfair trade practices, misleading advertisements, and defective goods with e-filing provisions.',
    sections: [
      {
        sectionNumber: 'Section 2(7)',
        title: 'Definition of Consumer',
        originalText: 'Consumer means any person who buys any goods or hires or avails of any services for a consideration which has been paid or promised, whether through offline or online transactions via electronic means.',
        simplifiedText: 'Anyone who purchases goods or avails services for personal use, whether in physical retail stores or online e-commerce portals, is a protected consumer.',
        category: 'CONSUMER'
      },
      {
        sectionNumber: 'Section 35',
        title: 'Manner in which complaint shall be made',
        originalText: 'A complaint, in relation to any goods sold or delivered or agreed to be sold or delivered or any service provided or agreed to be provided, may be filed with a District Commission by the consumer or any recognized consumer association, either in person or through electronic e-Daakhil filing.',
        simplifiedText: 'Consumers can file claims against defective goods or deficient services before the District Consumer Commission in person or electronically via the National e-Daakhil portal.',
        category: 'CONSUMER'
      }
    ]
  },
  {
    id: 'a0000000-0000-0000-0000-000000000006',
    title: 'Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013',
    actNumber: 'Act No. 14 of 2013',
    year: 2013,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Women and Child Development',
    documentType: 'ACT',
    category: 'WORKPLACE_HARASSMENT',
    status: 'ACTIVE',
    verificationStatus: 'PUBLISHED',
    enactmentDate: '2013-04-22',
    effectiveFrom: '2013-12-09',
    sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2104',
    description: 'Mandates creation of Internal Complaints Committees to safeguard women from workplace harassment.',
    sections: [
      {
        sectionNumber: 'Section 4',
        title: 'Constitution of Internal Complaints Committee',
        originalText: 'Every employer of a workplace shall, by an order in writing, constitute a Committee to be known as the Internal Complaints Committee (ICC) consisting of a Presiding Officer who shall be a woman employed at a senior level.',
        simplifiedText: 'Workplaces with 10 or more employees must maintain an Internal Complaints Committee (ICC) headed by a senior woman employee to investigate harassment allegations.',
        category: 'WORKPLACE_HARASSMENT'
      },
      {
        sectionNumber: 'Section 9',
        title: 'Complaint of sexual harassment',
        originalText: 'Any aggrieved woman may make, in writing, a complaint of sexual harassment at workplace to the Internal Committee within three months from the date of incident.',
        simplifiedText: 'A female employee can submit a written complaint of sexual harassment to the ICC within 3 months of occurrence.',
        category: 'WORKPLACE_HARASSMENT'
      }
    ]
  },
  {
    id: 'a0000000-0000-0000-0000-000000000007',
    title: 'Legal Services Authorities Act, 1987',
    actNumber: 'Act No. 39 of 1987',
    year: 1987,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Law and Justice',
    documentType: 'ACT',
    category: 'LEGAL_AID',
    status: 'ACTIVE',
    verificationStatus: 'PUBLISHED',
    enactmentDate: '1987-10-11',
    effectiveFrom: '1995-11-09',
    sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/1944',
    description: 'Statutory framework establishing NALSA, SLSAs, and DLSAs to provide free and competent legal representation.',
    sections: [
      {
        sectionNumber: 'Section 12',
        title: 'Criteria for giving legal services',
        originalText: 'Every person who has to file or defend a case shall be entitled to legal services under this Act if that person is a member of a Scheduled Caste or Scheduled Tribe, a victim of trafficking in human beings, a woman or a child, a person with disability, or an industrial workman.',
        simplifiedText: 'Guarantees free legal representation by government-funded advocates for women, children, SC/ST citizens, industrial workers, and low-income individuals.',
        category: 'LEGAL_AID'
      }
    ]
  },
  {
    id: 'a0000000-0000-0000-0000-000000000010',
    title: 'Right to Information Act, 2005',
    actNumber: 'Act No. 22 of 2005',
    year: 2005,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Personnel, Public Grievances and Pensions',
    documentType: 'ACT',
    category: 'CIVIL_RIGHTS',
    status: 'ACTIVE',
    verificationStatus: 'PUBLISHED',
    enactmentDate: '2005-06-21',
    effectiveFrom: '2005-10-12',
    sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2065',
    description: 'Empowers citizens to request information from public authorities, promoting transparency and accountability.',
    sections: [
      {
        sectionNumber: 'Section 6',
        title: 'Request for obtaining information',
        originalText: 'A person, who desires to obtain any information under this Act, shall make a request in writing or through electronic means in English or Hindi or in the official language of the area to the Central Public Information Officer or State Public Information Officer.',
        simplifiedText: 'Any citizen can submit an RTI request to a Public Information Officer (PIO) with a standard fee (typically Rs 10). BPL cardholders are exempt from fees.',
        category: 'CIVIL_RIGHTS'
      },
      {
        sectionNumber: 'Section 7',
        title: 'Disposal of request',
        originalText: 'The Central Public Information Officer or State Public Information Officer shall as expeditiously as possible, and in any case within thirty days of the receipt of the request, either provide the information or reject the request for any of the reasons specified in sections 8 and 9.',
        simplifiedText: 'Public authorities must provide requested information within 30 days (or within 48 hours if it concerns the life or liberty of a person).',
        category: 'CIVIL_RIGHTS'
      }
    ]
  },
  {
    id: 'a0000000-0000-0000-0000-000000000011',
    title: 'Code on Wages, 2019',
    actNumber: 'Act No. 29 of 2019',
    year: 2019,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Labour and Employment',
    documentType: 'ACT',
    category: 'LABOUR',
    status: 'ACTIVE',
    verificationStatus: 'PUBLISHED',
    enactmentDate: '2019-08-08',
    effectiveFrom: '2019-12-18',
    sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/13108',
    description: 'Consolidates Payment of Wages Act, Minimum Wages Act, Payment of Bonus Act, and Equal Remuneration Act into a single statutory code.',
    sections: [
      {
        sectionNumber: 'Section 6',
        title: 'Fixation of minimum rate of wages',
        originalText: 'The appropriate Government shall fix the minimum rates of wages payable to employees in accordance with the provisions of section 8.',
        simplifiedText: 'Requires governments to establish statutory minimum wage rates based on skill level and geographic zone.',
        category: 'LABOUR'
      },
      {
        sectionNumber: 'Section 9',
        title: 'Power of Central Government to fix floor wage',
        originalText: 'The Central Government shall fix floor wage taking into account minimum living standards of a worker.',
        simplifiedText: 'Empowers Central Government to declare a national floor wage; state minimum wages cannot be set lower than this floor wage.',
        category: 'LABOUR'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // 2. Subordinate Rules & Regulations (Linked to Parent Enabling Acts)
  // --------------------------------------------------------------------------
  {
    id: 'b1000000-0000-0000-0000-000000000001',
    title: 'Payment of Wages (Procedure) Rules, 1937',
    actNumber: 'Central Rules of 1937',
    year: 1937,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Labour and Employment',
    documentType: 'RULES',
    category: 'LABOUR',
    status: 'ACTIVE',
    verificationStatus: 'PUBLISHED',
    parentActId: 'a0000000-0000-0000-0000-000000000001',
    enablingProvision: 'Section 26 of Payment of Wages Act, 1936',
    enactmentDate: '1937-02-27',
    effectiveFrom: '1937-03-28',
    sourceUrl: 'https://labour.gov.in/rules-and-regulations',
    description: 'Prescribes official application forms and procedural rules for recovering delayed wages before Labour Authorities.',
    sections: [
      {
        sectionNumber: 'Rule 3',
        title: 'Form of Application for wage claim',
        originalText: 'Applications by or on behalf of an employed person or group of employed persons shall be made in duplicate in Form A, Form B or Form C as the case may be.',
        simplifiedText: 'Specifies official Form A and Form B for filing unpaid wage claims before the Labour Authority.',
        category: 'LABOUR'
      }
    ]
  },
  {
    id: 'b1000000-0000-0000-0000-000000000002',
    title: 'Protection of Women from Domestic Violence Rules, 2006',
    actNumber: 'G.S.R. 644(E)',
    year: 2006,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Women and Child Development',
    documentType: 'RULES',
    category: 'WOMEN_RIGHTS',
    status: 'ACTIVE',
    verificationStatus: 'PUBLISHED',
    parentActId: 'a0000000-0000-0000-0000-000000000002',
    enablingProvision: 'Section 37 of Protection of Women from Domestic Violence Act, 2005',
    enactmentDate: '2006-10-17',
    effectiveFrom: '2006-10-26',
    sourceUrl: 'https://wcd.nic.in/act/protection-women-domestic-violence-rules-2006',
    description: 'Details duties of Protection Officers, safety plans, and procedure for filing Domestic Incident Reports (DIR).',
    sections: [
      {
        sectionNumber: 'Rule 4',
        title: 'Domestic Incident Report preparation',
        originalText: 'Upon receipt of a complaint of domestic violence, the Protection Officer shall prepare a Domestic Incident Report under Form I and submit the same to the Magistrate.',
        simplifiedText: 'Protection Officers must record domestic abuse complaints in Form I (Domestic Incident Report) and transmit it to the Judicial Magistrate within 24 hours.',
        category: 'WOMEN_RIGHTS'
      },
      {
        sectionNumber: 'Rule 8',
        title: 'Duties of Service Providers',
        originalText: 'Service providers registered under the Act shall provide immediate shelter, medical assistance, and legal aid counseling to aggrieved women.',
        simplifiedText: 'Recognized NGOs and service providers must offer free safe shelter, medical aid, and legal counseling to victims of domestic abuse.',
        category: 'WOMEN_RIGHTS'
      }
    ]
  },
  {
    id: 'b1000000-0000-0000-0000-000000000003',
    title: 'Sexual Harassment of Women at Workplace Rules, 2013',
    actNumber: 'G.S.R. 769(E)',
    year: 2013,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Women and Child Development',
    documentType: 'RULES',
    category: 'WORKPLACE_HARASSMENT',
    status: 'ACTIVE',
    verificationStatus: 'PUBLISHED',
    parentActId: 'a0000000-0000-0000-0000-000000000006',
    enablingProvision: 'Section 29 of POSH Act, 2013',
    enactmentDate: '2013-12-09',
    effectiveFrom: '2013-12-09',
    sourceUrl: 'https://wcd.nic.in/act/posh-rules-2013',
    description: 'Defines inquiry procedures, interim relief measures, and conciliation guidelines under the POSH framework.',
    sections: [
      {
        sectionNumber: 'Rule 7',
        title: 'Manner of inquiry into complaint',
        originalText: 'Subject to the provisions of section 11, at the time of filing the complaint, the complainant shall submit six copies of the complaint along with supporting documents to the Internal Committee.',
        simplifiedText: 'Sets out ICC inquiry procedures, ensuring both parties receive notices and evidence following principles of natural justice.',
        category: 'WORKPLACE_HARASSMENT'
      }
    ]
  },
  {
    id: 'b1000000-0000-0000-0000-000000000004',
    title: 'Consumer Protection (E-Commerce) Rules, 2020',
    actNumber: 'G.S.R. 462(E)',
    year: 2020,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Consumer Affairs, Food and Public Distribution',
    documentType: 'RULES',
    category: 'CONSUMER',
    status: 'ACTIVE',
    verificationStatus: 'PUBLISHED',
    parentActId: 'a0000000-0000-0000-0000-000000000003',
    enablingProvision: 'Section 101 of Consumer Protection Act, 2019',
    enactmentDate: '2020-07-23',
    effectiveFrom: '2020-07-23',
    sourceUrl: 'https://consumeraffairs.nic.in/acts-and-rules/consumer-protection',
    description: 'Mandates grievance officers, seller identity disclosure, and refund processing standards for e-commerce platforms.',
    sections: [
      {
        sectionNumber: 'Rule 4',
        title: 'Duties of e-commerce entities',
        originalText: 'Every e-commerce entity shall appoint a grievance officer for consumer grievance redressal and display the name and contact details of such officer prominently on its platform.',
        simplifiedText: 'E-commerce platforms must display Grievance Officer details and acknowledge consumer complaints within 48 hours and resolve within 1 month.',
        category: 'CONSUMER'
      },
      {
        sectionNumber: 'Rule 6',
        title: 'Duties of sellers on marketplace',
        originalText: 'No seller shall adopt any unfair trade practice whether in the course of the business on the marketplace e-commerce platform or otherwise.',
        simplifiedText: 'Marketplace sellers are prohibited from deceptive pricing, refusing legitimate returns of defective goods, or making false claims.',
        category: 'CONSUMER'
      }
    ]
  },
  {
    id: 'b1000000-0000-0000-0000-000000000005',
    title: 'National Legal Services Authority (Free and Competent Legal Services) Regulations, 2010',
    actNumber: 'F. No. L/28/09-NALSA',
    year: 2010,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Law and Justice',
    documentType: 'REGULATIONS',
    category: 'LEGAL_AID',
    status: 'ACTIVE',
    verificationStatus: 'PUBLISHED',
    parentActId: 'a0000000-0000-0000-0000-000000000007',
    enablingProvision: 'Section 29 of Legal Services Authorities Act, 1987',
    enactmentDate: '2010-09-09',
    effectiveFrom: '2010-09-09',
    sourceUrl: 'https://nalsa.gov.in/acts-rules/regulations',
    description: 'Standardizes Front Office legal aid clinics, panel lawyer appointments, and monitoring committees across courts in India.',
    sections: [
      {
        sectionNumber: 'Regulation 3',
        title: 'Front Offices in Legal Services Institutions',
        originalText: 'There shall be a Front Office in every Legal Services Institution for providing legal aid and advice to seekers who approach in person.',
        simplifiedText: 'Every District Court and Taluk must maintain a Front Office where citizens can get immediate free consultation and assign a panel lawyer.',
        category: 'LEGAL_AID'
      },
      {
        sectionNumber: 'Regulation 8',
        title: 'Selection of panel lawyers',
        originalText: 'Panel lawyers shall be selected from legal practitioners who have rendered not less than three years of practice at the Bar and have proven competence and integrity.',
        simplifiedText: 'Legal aid lawyers must have at least 3 years of court experience and are strictly prohibited from demanding fees from beneficiaries.',
        category: 'LEGAL_AID'
      }
    ]
  },
  {
    id: 'b1000000-0000-0000-0000-000000000006',
    title: 'Right to Information Rules, 2012',
    actNumber: 'G.S.R. 603(E)',
    year: 2012,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Personnel, Public Grievances and Pensions',
    documentType: 'RULES',
    category: 'CIVIL_RIGHTS',
    status: 'ACTIVE',
    verificationStatus: 'PUBLISHED',
    parentActId: 'a0000000-0000-0000-0000-000000000010',
    enablingProvision: 'Section 27 of Right to Information Act, 2005',
    enactmentDate: '2012-07-31',
    effectiveFrom: '2012-07-31',
    sourceUrl: 'https://dopt.gov.in/rti-rules',
    description: 'Prescribes standard application fees, photocopy costs, and procedural formats for appeals before the Central Information Commission.',
    sections: [
      {
        sectionNumber: 'Rule 3',
        title: 'Application fee',
        originalText: 'An application under sub-section (1) of section 6 of the Act shall be accompanied by a fee of rupees ten by way of cash, demand draft, banker cheque, or electronic payment.',
        simplifiedText: 'Sets RTI application fee at Rs 10. No fee is charged for Below Poverty Line (BPL) citizens upon submission of proof.',
        category: 'CIVIL_RIGHTS'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // 3. Central Statutory Notifications & Commencement Orders
  // --------------------------------------------------------------------------
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    title: 'Notification S.O. 2351(E) — Commencement of Consumer Protection Act, 2019',
    actNumber: 'S.O. 2351(E)',
    year: 2020,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Consumer Affairs, Food and Public Distribution',
    documentType: 'NOTIFICATION',
    category: 'CONSUMER',
    status: 'ACTIVE',
    verificationStatus: 'PUBLISHED',
    parentActId: 'a0000000-0000-0000-0000-000000000003',
    enablingProvision: 'Section 1(3) of Consumer Protection Act, 2019',
    enactmentDate: '2020-07-15',
    effectiveFrom: '2020-07-20',
    sourceUrl: 'https://egazette.gov.in',
    description: 'Official Gazette order notifying the enforcement of the Consumer Protection Act 2019 with effect from 20th July 2020.',
    sections: [
      {
        sectionNumber: 'Order 1',
        title: 'Commencement of Provisions',
        originalText: 'The Central Government appoints the 20th day of July, 2020 as the date on which sections 2 to 107 (except certain specialized clauses) of the Consumer Protection Act, 2019 shall come into force.',
        simplifiedText: 'Officially brought into force the modern consumer redressal mechanism and Central Consumer Protection Authority on July 20, 2020.',
        category: 'CONSUMER'
      }
    ]
  },
  {
    id: 'c1000000-0000-0000-0000-000000000002',
    title: 'Notification S.O. 3772(E) — Partial Commencement of Code on Wages, 2019',
    actNumber: 'S.O. 3772(E)',
    year: 2019,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Labour and Employment',
    documentType: 'NOTIFICATION',
    category: 'LABOUR',
    status: 'ACTIVE',
    verificationStatus: 'PUBLISHED',
    parentActId: 'a0000000-0000-0000-0000-000000000011',
    enablingProvision: 'Section 1(3) of Code on Wages, 2019',
    enactmentDate: '2019-09-18',
    effectiveFrom: '2019-12-18',
    sourceUrl: 'https://egazette.gov.in',
    description: 'Enforces provisions relating to the Central Advisory Board under the Code on Wages 2019 while broader wage provisions remain staged.',
    sections: [
      {
        sectionNumber: 'Order 1',
        title: 'Commencement of Advisory Provisions',
        originalText: 'The Central Government appoints the 18th day of December, 2019 as the date on which provisions of sub-section (1), (2), (3), (10) and (11) of section 42 of the Code on Wages shall come into force.',
        simplifiedText: 'Enacted the Central Advisory Board provisions while the full operational code awaits final coordinated state rule notifications.',
        category: 'LABOUR'
      }
    ]
  }
];

function generateCorpus() {
  console.log('Generating Central Legislation & Subordinate Rules Corpus...');
  const jsonContent = JSON.stringify(CENTRAL_LEGISLATION_DATA, null, 2);
  const hash = crypto.createHash('sha256').update(jsonContent).digest('hex');

  const corpus = {
    corpusTitle: 'NyayaSaathi Central Legislation & Subordinate Rules Corpus',
    version: '2024.2',
    jurisdiction: 'CENTRAL',
    compiledAt: new Date().toISOString(),
    sha256: hash,
    totalDocuments: CENTRAL_LEGISLATION_DATA.length,
    totalActs: CENTRAL_LEGISLATION_DATA.filter(d => d.documentType === 'ACT').length,
    totalRules: CENTRAL_LEGISLATION_DATA.filter(d => d.documentType === 'RULES').length,
    totalRegulations: CENTRAL_LEGISLATION_DATA.filter(d => d.documentType === 'REGULATIONS').length,
    totalNotifications: CENTRAL_LEGISLATION_DATA.filter(d => d.documentType === 'NOTIFICATION').length,
    totalSections: CENTRAL_LEGISLATION_DATA.reduce((acc, d) => acc + (d.sections?.length || 0), 0),
    documents: CENTRAL_LEGISLATION_DATA
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(corpus, null, 2), 'utf-8');
  console.log(`Corpus written successfully to: ${OUTPUT_PATH}`);
  console.log(`Total Documents: ${corpus.totalDocuments} (Acts: ${corpus.totalActs}, Rules: ${corpus.totalRules}, Regulations: ${corpus.totalRegulations}, Notifications: ${corpus.totalNotifications})`);
  console.log(`Total Provisions: ${corpus.totalSections}`);
  console.log(`SHA-256 Checksum: ${corpus.sha256}`);
}

generateCorpus();
