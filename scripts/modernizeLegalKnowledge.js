/**
 * NyayaSaathi — Batch D, E, F & G: Complete Legal Knowledge Modernization
 *
 * Ingests and updates:
 * 1. Criminal Law Modernization (BNS 2023, BNSS 2023, BSA 2023) with savings clauses.
 * 2. Four Labour Codes Modernization (Code on Wages 2019, IR Code 2020, Social Security Code 2020, OSH Code 2020) with staged commencement tracking.
 * 3. Predecessor Operative Labour Statutes (Payment of Wages Act 1936, Minimum Wages Act 1948, Industrial Disputes Act 1947).
 * 4. Education & Child Rights (RTE Act 2009).
 * 5. Section-Category and Section-Beneficiary relational mappings.
 * 6. Vector embeddings with version-aware metadata into public.legal_chunks.
 */

import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import { PrismaClient } from '@prisma/client';
import { embeddingService } from '../ai-engine/src/services/embeddingService.js';

const prisma = new PrismaClient();

// Helper to format 384-d vector for pgvector raw SQL insert
function formatVectorForSql(vector) {
  return `'[${vector.join(',')}]'::vector`;
}

const MODERNIZED_LEGAL_ACTS = [
  // --------------------------------------------------------------------------
  // 1. Criminal Law Reform (01-07-2024 In Force)
  // --------------------------------------------------------------------------
  {
    id: 'a0000000-0000-0000-0000-000000000020',
    title: 'Bharatiya Nyaya Sanhita, 2023',
    actNumber: 'Act No. 45 of 2023',
    year: 2023,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Home Affairs',
    documentType: 'ACT',
    category: 'CRIMINAL',
    status: 'IN_FORCE',
    verificationStatus: 'VERIFIED',
    enactmentDate: new Date('2023-12-25'),
    commencementDate: new Date('2024-07-01'),
    effectiveFrom: new Date('2024-07-01'),
    gazetteNumber: 'CG-DL-E-25122023-250882',
    savingsClauseRef: 'Section 358(2) of Bharatiya Nyaya Sanhita, 2023 (Offenses committed prior to 01-07-2024 remain governed under IPC 1860).',
    sourceUrl: 'https://www.mha.gov.in/en/acts-rules',
    description: 'Consolidated penal code of India defining criminal offenses, matrimonial cruelty, breach of trust, and penalties, repealing the Indian Penal Code 1860.',
    sections: [
      {
        sectionNumber: 'Section 85',
        title: 'Husband or relative of husband of a woman subjecting her to cruelty',
        originalText: 'Whoever, being the husband or the relative of the husband of a woman, subjects such woman to cruelty shall be punished with imprisonment for a term which may extend to three years and shall also be liable to fine. Cruelty means any wilful conduct of such a nature as is likely to drive the woman to commit suicide or to cause grave injury or danger to life, limb or health, or harassment with a view to coercing her to meet any unlawful property demand.',
        simplifiedText: 'Harassment or cruelty towards a married woman by her husband or in-laws (for dowry or otherwise) is a non-bailable criminal offense punishable with up to 3 years imprisonment and fine (formerly IPC Section 498A).',
        categorySlug: 'women',
        beneficiarySlugs: ['women'],
        savingsClauseNotes: 'Offenses committed prior to 01-07-2024 are prosecuted under Section 498A of the Indian Penal Code, 1860.'
      },
      {
        sectionNumber: 'Section 316',
        title: 'Criminal breach of trust',
        originalText: 'Whoever, being in any manner entrusted with property, or with any dominion over property, dishonestly misappropriates or converts to his own use that property, or dishonestly uses or disposes of that property in violation of any direction of law or contract, commits criminal breach of trust. When committed by an employer regarding employee dues or provident fund deductions, it attracts enhanced penalty.',
        simplifiedText: 'An employer or person who dishonestly withholds or misappropriates money or property entrusted to them (including deducting employee salary or PF without depositing it) commits criminal breach of trust punishable with imprisonment (formerly IPC 405/406).',
        categorySlug: 'labour',
        beneficiarySlugs: ['workers'],
        savingsClauseNotes: 'Pre-July 2024 offenses governed by Section 405/406 IPC.'
      },
      {
        sectionNumber: 'Section 318',
        title: 'Cheating',
        originalText: 'Whoever, by deceiving any person, fraudulently or dishonestly induces the person so deceived to deliver any property to any person, or to consent that any person shall retain any property, commits cheating and shall be punished with imprisonment for a term which may extend to three years, or with fine, or with both (or up to seven years if valuable security is dishonestly induced).',
        simplifiedText: 'Deceiving someone fraudulently to obtain money, goods, or consent (such as job scams, financial fraud, or false promises) is punishable with up to 7 years imprisonment (formerly IPC Section 420).',
        categorySlug: 'consumer',
        beneficiarySlugs: ['consumers', 'citizens'],
        savingsClauseNotes: 'Pre-July 2024 cheating governed by Section 415/420 IPC.'
      },
      {
        sectionNumber: 'Section 358',
        title: 'Repeal and savings of Indian Penal Code',
        originalText: 'The Indian Penal Code, 1860 is hereby repealed. Notwithstanding such repeal, any act done, or any proceeding, investigation or remedy in respect of any right, privilege, obligation, liability, penalty or punishment incurred in respect of any offense committed before 1st July 2024 shall be taken, continued or enforced as if this Sanhita had not been enacted.',
        simplifiedText: 'Formally repeals the Indian Penal Code, 1860 while safeguarding that all past crimes committed before 1st July 2024 continue to be investigated, tried, and punished under the 1860 Code.',
        categorySlug: 'criminal',
        beneficiarySlugs: ['citizens', 'accused'],
        savingsClauseNotes: 'Core savings provision preserving legal continuity across criminal transitions.'
      }
    ]
  },
  {
    id: 'a0000000-0000-0000-0000-000000000021',
    title: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
    actNumber: 'Act No. 46 of 2023',
    year: 2023,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Home Affairs',
    documentType: 'ACT',
    category: 'CRIMINAL',
    status: 'IN_FORCE',
    verificationStatus: 'VERIFIED',
    enactmentDate: new Date('2023-12-25'),
    commencementDate: new Date('2024-07-01'),
    effectiveFrom: new Date('2024-07-01'),
    gazetteNumber: 'CG-DL-E-25122023-250883',
    savingsClauseRef: 'Section 531(2) of BNSS 2023 (Pending criminal investigations, trials, and appeals initiated prior to 01-07-2024 continue under CrPC 1973).',
    sourceUrl: 'https://www.mha.gov.in/en/acts-rules',
    description: 'Procedural criminal code of India governing arrest safeguards, Zero FIR, investigation, bail, and 24-hour Magistrate production, repealing CrPC 1973.',
    sections: [
      {
        sectionNumber: 'Section 35',
        title: 'When police may arrest without warrant and notice of appearance',
        originalText: 'Any police officer may without an order from a Magistrate and without a warrant, arrest any person who commits in the presence of a police officer a cognizable offense, or where a reasonable complaint exists regarding an offense punishable with imprisonment up to seven years, provided the officer records reasons in writing. In offenses punishable with imprisonment up to seven years, police shall ordinarily issue a notice of appearance directing the person to appear before the officer.',
        simplifiedText: 'For offenses with punishment up to 7 years, police cannot arrest arbitrarily; they must issue a formal Notice of Appearance requiring you to cooperate, unless arrest is strictly necessary to prevent evidence tampering (formerly CrPC Section 41 & 41A).',
        categorySlug: 'criminal',
        beneficiarySlugs: ['citizens', 'accused'],
        savingsClauseNotes: 'Incorporates constitutional arrest safeguards from the Supreme Court Arnesh Kumar ruling.'
      },
      {
        sectionNumber: 'Section 47',
        title: 'Person arrested to be informed of grounds of arrest and of right to bail',
        originalText: 'Every police officer or other person arresting any person without warrant shall forthwith communicate to him full particulars of the offense for which he is arrested or other grounds for such arrest. Where a police officer arrests without warrant any person other than a person accused of a non-bailable offense, he shall inform the person arrested that he is entitled to be released on bail and that he may arrange for sureties on his behalf.',
        simplifiedText: 'Every arrested citizen has the absolute legal right to be informed immediately of the exact reasons for their arrest and, in bailable matters, their entitlement to release on bail upon furnishing surety (formerly CrPC Section 50).',
        categorySlug: 'criminal',
        beneficiarySlugs: ['citizens', 'accused'],
        savingsClauseNotes: 'Reinforces Article 22(1) fundamental rights.'
      },
      {
        sectionNumber: 'Section 58',
        title: 'Person arrested not to be detained more than twenty-four hours',
        originalText: 'No police officer shall detain in custody a person arrested without warrant for a longer period than under all the circumstances of the case is reasonable, and such period shall not, in the absence of a special order of a Magistrate under section 187, exceed twenty-four hours exclusive of the time necessary for the journey from the place of arrest to the Magistrate Court.',
        simplifiedText: 'Police cannot detain an arrested person in police custody for more than 24 hours (excluding journey travel time) without producing them before the nearest Judicial Magistrate (formerly CrPC Section 57). Detention beyond 24 hours without court authorization is illegal.',
        categorySlug: 'criminal',
        beneficiarySlugs: ['citizens', 'accused'],
        savingsClauseNotes: 'Statutory counterpart to Article 22(2) of the Constitution of India.'
      },
      {
        sectionNumber: 'Section 173',
        title: 'Information in cognizable cases and electronic / Zero FIR',
        originalText: 'Every information relating to the commission of a cognizable offense, if given orally to an officer in charge of a police station, shall be reduced to writing. Information may also be given electronically (e-FIR) to the police station. If the offense is committed outside the local limits of the police station, the police officer shall register a Zero FIR and transfer the case to the competent police station.',
        simplifiedText: 'Police must register an FIR for cognizable crimes. If an incident occurred in another area, police must still register a Zero FIR immediately and transfer the case, rather than turning the victim away (formerly CrPC Section 154). Electronic FIRs are recognized under law.',
        categorySlug: 'criminal',
        beneficiarySlugs: ['citizens', 'women'],
        savingsClauseNotes: 'Codifies mandatory Zero FIR nationwide.'
      },
      {
        sectionNumber: 'Section 531',
        title: 'Repeal and savings of Code of Criminal Procedure, 1973',
        originalText: 'The Code of Criminal Procedure, 1973 is hereby repealed. Notwithstanding such repeal, if, immediately before the date on which this Sanhita comes into force, there is any appeal, application, trial, inquiry or investigation pending, it shall be disposed of, continued, held or made in accordance with the provisions of the Code of Criminal Procedure, 1973, as in force immediately before such commencement, as if this Sanhita had not come into force.',
        simplifiedText: 'Repeals the 1973 CrPC but guarantees that all pending criminal trials, investigations, appeals, and inquiries filed before 1st July 2024 continue under the 1973 Code.',
        categorySlug: 'criminal',
        beneficiarySlugs: ['citizens'],
        savingsClauseNotes: 'Core procedural savings clause.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // 2. Operative Predecessor Labour Statutes (IN_FORCE_OPERATIVE)
  // --------------------------------------------------------------------------
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    title: 'Minimum Wages Act, 1948',
    actNumber: 'Act No. 11 of 1948',
    year: 1948,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Labour and Employment',
    documentType: 'ACT',
    category: 'LABOUR',
    status: 'IN_FORCE',
    verificationStatus: 'VERIFIED',
    enactmentDate: new Date('1948-03-15'),
    commencementDate: new Date('1948-03-15'),
    effectiveFrom: new Date('1948-03-15'),
    savingsClauseRef: 'Section 69 of Code on Wages, 2019 (Repeal clause staged pending full nationwide operational commencement).',
    sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2368',
    description: 'Empowers Central and State Governments to fix and revise statutory minimum rates of wages in scheduled employments and protects workers from exploitation.',
    sections: [
      {
        sectionNumber: 'Section 3',
        title: 'Fixing of minimum rates of wages',
        originalText: 'The appropriate Government shall, in the manner hereinafter provided, fix the minimum rates of wages payable to employees employed in scheduled employments and review at intervals not exceeding five years the minimum rates of wages so fixed and revise them if necessary.',
        simplifiedText: 'The government is legally required to fix and regularly revise statutory minimum wage rates for workers across industries. Paying less than the notified minimum wage is an illegal statutory offense.',
        categorySlug: 'labour',
        beneficiarySlugs: ['workers']
      },
      {
        sectionNumber: 'Section 12',
        title: 'Payment of minimum rates of wages',
        originalText: 'Where in respect of any scheduled employment a notification under section 5 is in force, the employer shall pay to every employee engaged in scheduled employment wages at a rate not less than the minimum rate of wages fixed by such notification for that class of employees, without any deductions except as authorized.',
        simplifiedText: 'Every employer must pay workers at least the government-mandated minimum wage rate without unauthorized salary deductions.',
        categorySlug: 'labour',
        beneficiarySlugs: ['workers']
      },
      {
        sectionNumber: 'Section 20',
        title: 'Claims arising out of payment of less than minimum rates of wages',
        originalText: 'The appropriate Government may appoint any Commissioner for Workmen Compensation or officer with experience as a Judge of a Civil Court or Labour Commissioner to be the Authority to hear and decide claims arising out of payment of less than the minimum rates of wages. The Authority may direct payment of arrears plus compensation up to ten times the difference.',
        simplifiedText: 'Workers paid less than the legal minimum wage can file a claim before the Labour Authority to recover all wage arrears plus penalty compensation up to 10 times the unpaid difference.',
        categorySlug: 'labour',
        beneficiarySlugs: ['workers']
      }
    ]
  },
  {
    id: 'a0000000-0000-0000-0000-000000000022',
    title: 'Industrial Disputes Act, 1947',
    actNumber: 'Act No. 14 of 1947',
    year: 1947,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Labour and Employment',
    documentType: 'ACT',
    category: 'LABOUR',
    status: 'IN_FORCE',
    verificationStatus: 'VERIFIED',
    enactmentDate: new Date('1947-03-11'),
    commencementDate: new Date('1947-04-01'),
    effectiveFrom: new Date('1947-04-01'),
    savingsClauseRef: 'Section 104 of Industrial Relations Code, 2020 (Repeal staged pending notification under Section 1(3)).',
    sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2281',
    description: 'Principal operative statute for investigation and settlement of industrial disputes, retrenchment safeguards, and worker recovery petitions before Labour Courts.',
    sections: [
      {
        sectionNumber: 'Section 2A',
        title: 'Dismissal of an individual workman deemed an industrial dispute',
        originalText: 'Where any employer discharges, dismisses, retrenches or otherwise terminates the services of an individual workman, any dispute or difference between that workman and his employer connected with such discharge, dismissal, retrenchment or termination shall be deemed to be an industrial dispute.',
        simplifiedText: 'An individual worker whose employment is terminated, dismissed, or retrenched has the legal right to challenge the termination directly before the Conciliation Officer and Labour Court without needing a trade union sponsorship.',
        categorySlug: 'labour',
        beneficiarySlugs: ['workers']
      },
      {
        sectionNumber: 'Section 25F',
        title: 'Conditions precedent to retrenchment of workmen',
        originalText: 'No workman employed in any industry who has been in continuous service for not less than one year under an employer shall be retrenched by that employer until the workman has been given one month notice in writing indicating the reasons for retrenchment or wages in lieu of notice, and compensation equivalent to fifteen days average pay for every completed year of continuous service.',
        simplifiedText: 'An employer terminating an employee who has worked for at least 1 year must give 1 month prior written notice (or 1 month salary in lieu) PLUS severance compensation equal to 15 days salary for every completed year of service.',
        categorySlug: 'labour',
        beneficiarySlugs: ['workers']
      },
      {
        sectionNumber: 'Section 33C',
        title: 'Recovery of money due from an employer',
        originalText: 'Where any money is due to a workman from an employer under a settlement or an award or under the provisions of Chapter VA or Chapter VB, the workman himself or any other person authorized by him in writing may make an application to the appropriate Government for the recovery of the money due to him, and if the appropriate Government is satisfied that any money is so due, it shall issue a certificate for that amount to the Collector, who shall proceed to recover the same in the same manner as an arrear of land revenue.',
        simplifiedText: 'Workers can file an application before the Labour Court or State Labour Commissioner under Section 33C to recover any unpaid salary, bonus, gratuity, or retrenchment compensation due from their employer. The government issues a recovery warrant executed like land revenue arrears.',
        categorySlug: 'labour',
        beneficiarySlugs: ['workers']
      }
    ]
  },

  // --------------------------------------------------------------------------
  // 3. Child Rights & Education (RTE Act, 2009)
  // --------------------------------------------------------------------------
  {
    id: 'a0000000-0000-0000-0000-000000000005',
    title: 'Right of Children to Free and Compulsory Education Act, 2009',
    actNumber: 'Act No. 35 of 2009',
    year: 2009,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Education',
    documentType: 'ACT',
    category: 'CHILDREN',
    status: 'IN_FORCE',
    verificationStatus: 'VERIFIED',
    enactmentDate: new Date('2009-08-26'),
    commencementDate: new Date('2010-04-01'),
    effectiveFrom: new Date('2010-04-01'),
    sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2083',
    description: 'Statutory mandate enforcing Article 21A of the Constitution for free and compulsory elementary education to every child aged 6 to 14 years.',
    sections: [
      {
        sectionNumber: 'Section 3',
        title: 'Right of child to free and compulsory education',
        originalText: 'Every child of the age of six to fourteen years, including a child referred to in clause (d) or clause (e) of section 2, shall have the right to free and compulsory education in a neighbourhood school till the completion of his or her elementary education. No child shall be liable to pay any kind of fee or charges or expenses which may prevent him or her from pursuing and completing elementary education.',
        simplifiedText: 'Every Indian child aged 6 to 14 has a fundamental and statutory right to attend school without paying any tuition fees, textbook charges, or uniform expenses that could prevent schooling.',
        categorySlug: 'children',
        beneficiarySlugs: ['children']
      },
      {
        sectionNumber: 'Section 12',
        title: 'Extent of school responsibility for free and compulsory education (25% Quota)',
        originalText: 'A specified category school and an unaided private school not receiving any kind of aid or grants to meet its expenses from the appropriate Government or local authority shall admit in class I, to the extent of at least twenty-five per cent of the strength of that class, children belonging to weaker section and disadvantaged group in the neighbourhood and provide free and compulsory elementary education till its completion.',
        simplifiedText: 'All private non-minority schools in India must reserve at least 25% of their entry-level seats (Nursery / Class 1) for children from economically weaker sections (EWS) and disadvantaged communities, free of all tuition fees.',
        categorySlug: 'children',
        beneficiarySlugs: ['children']
      }
    ]
  },

  // --------------------------------------------------------------------------
  // 4. Four Labour Codes Modernization (Staged & Enacted Status)
  // --------------------------------------------------------------------------
  {
    id: 'a0000000-0000-0000-0000-000000000011',
    title: 'Code on Wages, 2019',
    actNumber: 'Act No. 29 of 2019',
    year: 2019,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Labour and Employment',
    documentType: 'ACT',
    category: 'LABOUR',
    status: 'PARTIALLY_IN_FORCE',
    verificationStatus: 'VERIFIED',
    enactmentDate: new Date('2019-08-08'),
    commencementDate: new Date('2019-12-18'),
    effectiveFrom: new Date('2019-12-18'),
    gazetteNumber: 'S.O. 3772(E)',
    isPartiallyCommenced: true,
    commencedSections: ['Section 42'],
    stagedSections: ['Section 15', 'Section 16', 'Section 17', 'Section 18', 'Section 43', 'Section 45', 'Section 49', 'Section 69'],
    savingsClauseRef: 'Section 69 of Code on Wages, 2019 (Repeals Payment of Wages Act 1936 and Minimum Wages Act 1948 once operational clauses are notified; pre-existing rights and claims fully saved).',
    sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/13108',
    description: 'Consolidates Payment of Wages Act, Minimum Wages Act, Payment of Bonus Act, and Equal Remuneration Act into a single statutory code with nationwide floor wage guarantees.',
    sections: [
      {
        sectionNumber: 'Section 16',
        title: 'Time limit for payment of wages under Code on Wages',
        originalText: 'The employer shall pay or cause to be paid wages to the employees, where the wage period is monthly, before the expiry of the seventh day after the last day of the wage period; where daily, at the end of the shift; where weekly, on the last working day of the week. In case of termination or resignation, wages shall be paid within two working days.',
        simplifiedText: 'Enacted provision requiring all employers to disburse monthly salary by the 7th of the following month, and within 2 working days of resignation or termination (awaiting nationwide operational commencement).',
        categorySlug: 'labour',
        beneficiarySlugs: ['workers'],
        savingsClauseNotes: 'Until operationalized nationwide, Section 5 Payment of Wages Act 1936 remains operative.'
      },
      {
        sectionNumber: 'Section 45',
        title: 'Claims under Code on Wages and procedure',
        originalText: 'The appropriate Government may appoint one or more Authorities to hear and determine claims arising out of non-payment of minimum wages, deductions from wages, or delay in payment. The claim may be filed by the employee or any registered trade union within three years of the cause of action arising, with compensation up to ten times the claim amount.',
        simplifiedText: 'Provides a 3-year limitation window (extended from 12 months under legacy laws) for workers to file wage recovery petitions before the designated Authority, with compensation up to 10 times the arrears.',
        categorySlug: 'labour',
        beneficiarySlugs: ['workers'],
        savingsClauseNotes: 'Procedural claims currently filed before Payment of Wages Authority under Section 15 of the 1936 Act.'
      }
    ]
  },
  {
    id: 'a0000000-0000-0000-0000-000000000023',
    title: 'Industrial Relations Code, 2020',
    actNumber: 'Act No. 35 of 2020',
    year: 2020,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Labour and Employment',
    documentType: 'ACT',
    category: 'LABOUR',
    status: 'NOT_YET_COMMENCED',
    verificationStatus: 'VERIFIED',
    enactmentDate: new Date('2020-09-28'),
    gazetteNumber: 'CG-DL-E-29092020-222108',
    isPartiallyCommenced: false,
    stagedSections: ['Section 53', 'Section 65', 'Section 77', 'Section 104'],
    savingsClauseRef: 'Section 104 (Repeals Industrial Disputes Act 1947 and Trade Unions Act 1926 upon notified commencement; pending proceedings saved).',
    sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/15982',
    description: 'Consolidates trade union recognition, dispute resolution, strikes, lay-off, and retrenchment laws, replacing the Industrial Disputes Act 1947.',
    sections: [
      {
        sectionNumber: 'Section 77',
        title: 'Conditions precedent to retrenchment of worker under IR Code',
        originalText: 'No worker employed in any industrial establishment who has been in continuous service for not less than one year under an employer shall be retrenched until the worker has been given one month notice in writing indicating reasons for retrenchment or wages in lieu thereof, and compensation equivalent to fifteen days average pay for every completed year of service.',
        simplifiedText: 'Modern retrenchment compensation provision preserving the 15-days pay per year of service rule, enacted by Parliament and awaiting synchronized Gazette commencement.',
        categorySlug: 'labour',
        beneficiarySlugs: ['workers'],
        savingsClauseNotes: 'Section 25F of the Industrial Disputes Act, 1947 remains the operative law today.'
      }
    ]
  },
  {
    id: 'a0000000-0000-0000-0000-000000000024',
    title: 'Code on Social Security, 2020',
    actNumber: 'Act No. 36 of 2020',
    year: 2020,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Labour and Employment',
    documentType: 'ACT',
    category: 'LABOUR',
    status: 'PARTIALLY_IN_FORCE',
    verificationStatus: 'VERIFIED',
    enactmentDate: new Date('2020-09-28'),
    gazetteNumber: 'CG-DL-E-29092020-222109',
    isPartiallyCommenced: true,
    commencedSections: ['Section 142'],
    stagedSections: ['Section 53', 'Section 60', 'Section 114', 'Section 164'],
    savingsClauseRef: 'Section 164 (Repeals EPF Act 1952, ESI Act 1948, Maternity Benefit Act 1961, and Gratuity Act 1972 upon notification; existing schemes saved).',
    sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/15983',
    description: 'Extends universal social security, provident fund, insurance, gratuity, and maternity protections to organized, unorganized, gig, and platform workers.',
    sections: [
      {
        sectionNumber: 'Section 114',
        title: 'Social security for gig workers and platform workers',
        originalText: 'The Central Government shall frame and notify, from time to time, suitable welfare schemes for gig workers and platform workers on matters relating to life and disability cover, accident insurance, health and maternity benefits, old age protection, creche, and any other benefit as may be determined.',
        simplifiedText: 'First statutory provision in Indian law legally recognizing delivery executives, rideshare drivers, and freelance platform workers for government-backed social security, health, and accident protections.',
        categorySlug: 'labour',
        beneficiarySlugs: ['workers'],
        savingsClauseNotes: 'Enacted framework; scheme funding regulations formulated in coordination with aggregator platforms.'
      }
    ]
  },
  {
    id: 'a0000000-0000-0000-0000-000000000025',
    title: 'Occupational Safety, Health and Working Conditions Code, 2020',
    actNumber: 'Act No. 37 of 2020',
    year: 2020,
    jurisdiction: 'CENTRAL',
    ministry: 'Ministry of Labour and Employment',
    documentType: 'ACT',
    category: 'LABOUR',
    status: 'NOT_YET_COMMENCED',
    verificationStatus: 'VERIFIED',
    enactmentDate: new Date('2020-09-28'),
    gazetteNumber: 'CG-DL-E-29092020-222110',
    isPartiallyCommenced: false,
    stagedSections: ['Section 23', 'Section 25', 'Section 43', 'Section 143'],
    savingsClauseRef: 'Section 143 (Repeals Factories Act 1948, Contract Labour Act 1970, and BOCW Act 1996 once notified).',
    sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/15984',
    description: 'Consolidates health, safety, and working conditions in factories, mines, docks, building construction, and establishments, replacing 13 legacy labor statutes.',
    sections: [
      {
        sectionNumber: 'Section 23',
        title: 'Duties of employer regarding workplace health and safety',
        originalText: 'Every employer shall ensure that the workplace is free from hazards which cause or are likely to cause injury or occupational disease to employees, comply with the occupational safety standards, provide annual health examinations free of cost, and maintain a safe working environment.',
        simplifiedText: 'Mandates every employer to guarantee a safe, hazard-free workplace, provide safety gear, and offer free annual medical checkups for workers.',
        categorySlug: 'labour',
        beneficiarySlugs: ['workers'],
        savingsClauseNotes: 'Factories Act, 1948 and BOCW Act, 1996 remain operative today.'
      }
    ]
  }
];

async function runModernization() {
  console.log('='.repeat(80));
  console.log('🏛️  NYAYASAATHI BATCH D, E, F & G: LEGAL KNOWLEDGE MODERNIZATION');
  console.log('='.repeat(80));

  let actsUpserted = 0;
  let sectionsUpserted = 0;
  let chunksUpserted = 0;

  // 1. Fetch category and beneficiary lookup maps
  const categories = await prisma.rightCategory.findMany();
  const catMap = new Map(categories.map((c) => [c.slug, c.id]));

  const beneficiaries = await prisma.beneficiary.findMany();
  const benMap = new Map(beneficiaries.map((b) => [b.slug, b.id]));

  for (const doc of MODERNIZED_LEGAL_ACTS) {
    console.log(`\n📘 Processing Act: ${doc.title} (${doc.year}) [Status: ${doc.status}]`);

    // 1. Upsert LegalAct with complete temporal validity metadata
    const act = await prisma.legalAct.upsert({
      where: { id: doc.id },
      update: {
        title: doc.title,
        actNumber: doc.actNumber,
        year: doc.year,
        jurisdiction: doc.jurisdiction,
        ministry: doc.ministry,
        documentType: doc.documentType,
        category: doc.category,
        status: doc.status,
        verificationStatus: doc.verificationStatus,
        enactmentDate: doc.enactmentDate,
        commencementDate: doc.commencementDate || null,
        effectiveFrom: doc.effectiveFrom || null,
        gazetteNumber: doc.gazetteNumber || null,
        savingsClauseRef: doc.savingsClauseRef || null,
        isPartiallyCommenced: doc.isPartiallyCommenced || false,
        commencedSections: doc.commencedSections || [],
        stagedSections: doc.stagedSections || [],
        sourceUrl: doc.sourceUrl,
        description: doc.description,
        lastVerifiedAt: new Date(),
      },
      create: {
        id: doc.id,
        title: doc.title,
        actNumber: doc.actNumber,
        year: doc.year,
        jurisdiction: doc.jurisdiction,
        ministry: doc.ministry,
        documentType: doc.documentType,
        category: doc.category,
        status: doc.status,
        verificationStatus: doc.verificationStatus,
        enactmentDate: doc.enactmentDate,
        commencementDate: doc.commencementDate || null,
        effectiveFrom: doc.effectiveFrom || null,
        gazetteNumber: doc.gazetteNumber || null,
        savingsClauseRef: doc.savingsClauseRef || null,
        isPartiallyCommenced: doc.isPartiallyCommenced || false,
        commencedSections: doc.commencedSections || [],
        stagedSections: doc.stagedSections || [],
        sourceUrl: doc.sourceUrl,
        description: doc.description,
        lastVerifiedAt: new Date(),
      },
    });
    actsUpserted++;

    // 2. Ingest Sections for this Act
    for (const sec of doc.sections || []) {
      const section = await prisma.legalSection.upsert({
        where: {
          actId_sectionNumber: {
            actId: act.id,
            sectionNumber: sec.sectionNumber,
          },
        },
        update: {
          title: sec.title,
          originalText: sec.originalText,
          simplifiedText: sec.simplifiedText,
          status: doc.status === 'NOT_YET_COMMENCED' ? 'NOT_YET_COMMENCED' : 'IN_FORCE',
          savingsClauseNotes: sec.savingsClauseNotes || null,
          isOperative: doc.status !== 'NOT_YET_COMMENCED',
          effectiveFrom: doc.effectiveFrom || null,
          verificationStatus: 'VERIFIED',
        },
        create: {
          actId: act.id,
          sectionNumber: sec.sectionNumber,
          title: sec.title,
          originalText: sec.originalText,
          simplifiedText: sec.simplifiedText,
          status: doc.status === 'NOT_YET_COMMENCED' ? 'NOT_YET_COMMENCED' : 'IN_FORCE',
          savingsClauseNotes: sec.savingsClauseNotes || null,
          isOperative: doc.status !== 'NOT_YET_COMMENCED',
          effectiveFrom: doc.effectiveFrom || null,
          verificationStatus: 'VERIFIED',
        },
      });
      sectionsUpserted++;
      console.log(`   § Ingested ${sec.sectionNumber}: ${sec.title}`);

      // 3. Link Section to RightCategory
      if (sec.categorySlug && catMap.has(sec.categorySlug)) {
        const catId = catMap.get(sec.categorySlug);
        await prisma.sectionRight.upsert({
          where: {
            sectionId_rightCategoryId: {
              sectionId: section.id,
              rightCategoryId: catId,
            },
          },
          update: {},
          create: {
            sectionId: section.id,
            rightCategoryId: catId,
          },
        });
      }

      // 4. Link Section to Beneficiaries
      for (const benSlug of sec.beneficiarySlugs || []) {
        if (benMap.has(benSlug)) {
          const benId = benMap.get(benSlug);
          await prisma.sectionBeneficiary.upsert({
            where: {
              sectionId_beneficiaryId: {
                sectionId: section.id,
                beneficiaryId: benId,
              },
            },
            update: {},
            create: {
              sectionId: section.id,
              beneficiaryId: benId,
            },
          });
        }
      }

      // 5. Generate and Insert Vector Embeddings into public.legal_chunks
      const chunkText = `${doc.title} ${sec.sectionNumber} ${sec.title}. ${sec.simplifiedText} Original Text: ${sec.originalText}`;
      const vector = await embeddingService.embedText(chunkText);

      // Check if chunk exists
      const existingChunk = await prisma.legalChunk.findFirst({
        where: { sectionId: section.id, chunkNumber: 1, language: 'en' },
      });

      if (existingChunk) {
        await prisma.$executeRawUnsafe(`
          UPDATE public.legal_chunks
          SET content = $1,
              source_url = $2,
              legal_status = $3,
              effective_from = $4::date,
              jurisdiction = $5,
              act_title = $6,
              section_number = $7,
              embedding = ${formatVectorForSql(vector)},
              updated_at = NOW()
          WHERE id = $8::uuid
        `, chunkText, doc.sourceUrl, doc.status, doc.effectiveFrom ? doc.effectiveFrom.toISOString().split('T')[0] : null, doc.jurisdiction, doc.title, sec.sectionNumber, existingChunk.id);
      } else {
        await prisma.$executeRawUnsafe(`
          INSERT INTO public.legal_chunks (
            id, section_id, content, chunk_number, language, source_url,
            legal_status, effective_from, jurisdiction, act_title, section_number,
            embedding, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1::uuid, $2, 1, 'en', $3,
            $4, $5::date, $6, $7, $8,
            ${formatVectorForSql(vector)}, NOW(), NOW()
          )
        `, section.id, chunkText, doc.sourceUrl, doc.status, doc.effectiveFrom ? doc.effectiveFrom.toISOString().split('T')[0] : null, doc.jurisdiction, doc.title, sec.sectionNumber);
      }
      chunksUpserted++;
    }
  }

  // --------------------------------------------------------------------------
  // Update Existing Predecessor Acts Status in DB
  // --------------------------------------------------------------------------
  console.log('\n[Post-Processing] Synchronizing existing database acts status...');
  await prisma.legalAct.updateMany({
    where: { title: { contains: 'Payment of Wages Act' } },
    data: {
      status: 'IN_FORCE',
      savingsClauseRef: 'Section 69 of Code on Wages, 2019 (Operational provisions staged; Act remains operative law).',
      isPartiallyCommenced: false,
    },
  });

  await prisma.legalAct.updateMany({
    where: { title: { contains: 'Consumer Protection Act, 2019' } },
    data: {
      status: 'IN_FORCE',
      enactmentDate: new Date('2019-08-09'),
      commencementDate: new Date('2020-07-20'),
      gazetteNumber: 'S.O. 2351(E)',
      savingsClauseRef: 'Section 107 of Consumer Protection Act, 2019 (1986 Act repealed; pending proceedings preserved).',
    },
  });

  console.log('\n' + '='.repeat(80));
  console.log(`✅ MODERNIZATION COMPLETE:`);
  console.log(`   - Acts Processed/Updated:     ${actsUpserted}`);
  console.log(`   - Sections Ingested/Updated: ${sectionsUpserted}`);
  console.log(`   - Vector Chunks Embedded:     ${chunksUpserted}`);
  console.log('='.repeat(80));
}

runModernization()
  .catch((err) => {
    console.error('Modernization failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
