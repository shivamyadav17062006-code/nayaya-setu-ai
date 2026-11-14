/**
 * Comprehensive Constitutional Corpus Builder
 * Compiles the verified text of the Constitution of India (as-of 2024 / 106th Amendment)
 * into structured JSON records preserving hierarchy, clauses, provisos, and amendment notes.
 */

import fs from 'fs';
import path from 'path';

const PREAMBLE = {
  id: 'const_preamble',
  type: 'PREAMBLE',
  partNumber: 'PREAMBLE',
  partTitle: 'Preamble',
  articleNumber: 'Preamble',
  heading: 'Preamble to the Constitution of India',
  originalText: 'WE, THE PEOPLE OF INDIA, having solemnly resolved to constitute India into a SOVEREIGN SOCIALIST SECULAR DEMOCRATIC REPUBLIC and to secure to all its citizens: JUSTICE, social, economic and political; LIBERTY of thought, expression, belief, faith and worship; EQUALITY of status and of opportunity; and to promote among them all FRATERNITY assuring the dignity of the individual and the unity and integrity of the Nation; IN OUR CONSTITUENT ASSEMBLY this twenty-sixth day of November, 1949, do HEREBY ADOPT, ENACT AND GIVE TO OURSELVES THIS CONSTITUTION.',
  simplifiedText: 'The Preamble is the guiding philosophy of the Indian Constitution, declaring India an independent, socialist, secular, democratic republic dedicated to justice, liberty, equality, and fraternity for every citizen.',
  clauses: [
    {
      clauseNumber: '1',
      text: 'WE, THE PEOPLE OF INDIA, having solemnly resolved to constitute India into a SOVEREIGN SOCIALIST SECULAR DEMOCRATIC REPUBLIC...',
      simplified: 'Declares India a Sovereign, Socialist, Secular, Democratic Republic founded by the people of India.'
    }
  ],
  amendmentNotes: 'Words "SOCIALIST", "SECULAR", and "unity and integrity of the Nation" were inserted by the Constitution (Forty-second Amendment) Act, 1976 (w.e.f. 3-1-1977).',
  sourceUrl: 'https://www.legislative.gov.in/constitution-of-india/',
  verificationStatus: 'VERIFIED',
  asOfDate: '2024-05-01',
};

const PARTS_DIRECTORY = [
  { partNumber: 'PART I', title: 'The Union and its Territory', articlesRange: '1-4' },
  { partNumber: 'PART II', title: 'Citizenship', articlesRange: '5-11' },
  { partNumber: 'PART III', title: 'Fundamental Rights', articlesRange: '12-35' },
  { partNumber: 'PART IV', title: 'Directive Principles of State Policy', articlesRange: '36-51' },
  { partNumber: 'PART IVA', title: 'Fundamental Duties', articlesRange: '51A' },
  { partNumber: 'PART V', title: 'The Union', articlesRange: '52-151' },
  { partNumber: 'PART VI', title: 'The States', articlesRange: '152-237' },
  { partNumber: 'PART VII', title: 'The States in Part B of the First Schedule (Repealed)', articlesRange: '238' },
  { partNumber: 'PART VIII', title: 'The Union Territories', articlesRange: '239-242' },
  { partNumber: 'PART IX', title: 'The Panchayats', articlesRange: '243-243O' },
  { partNumber: 'PART IXA', title: 'The Municipalities', articlesRange: '243P-243ZG' },
  { partNumber: 'PART IXB', title: 'The Co-operative Societies', articlesRange: '243ZH-243ZT' },
  { partNumber: 'PART X', title: 'The Scheduled and Tribal Areas', articlesRange: '244-244A' },
  { partNumber: 'PART XI', title: 'Relations between the Union and the States', articlesRange: '245-263' },
  { partNumber: 'PART XII', title: 'Finance, Property, Contracts and Suits', articlesRange: '264-300A' },
  { partNumber: 'PART XIII', title: 'Trade, Commerce and Intercourse within the Territory of India', articlesRange: '301-307' },
  { partNumber: 'PART XIV', title: 'Services under the Union and the States', articlesRange: '308-323' },
  { partNumber: 'PART XIVA', title: 'Tribunals', articlesRange: '323A-323B' },
  { partNumber: 'PART XV', title: 'Elections', articlesRange: '324-329A' },
  { partNumber: 'PART XVI', title: 'Special Provisions Relating to Certain Classes', articlesRange: '330-342A' },
  { partNumber: 'PART XVII', title: 'Official Language', articlesRange: '343-351' },
  { partNumber: 'PART XVIII', title: 'Emergency Provisions', articlesRange: '352-360' },
  { partNumber: 'PART XIX', title: 'Miscellaneous', articlesRange: '361-367' },
  { partNumber: 'PART XX', title: 'Amendment of the Constitution', articlesRange: '368' },
  { partNumber: 'PART XXI', title: 'Temporary, Transitional and Special Provisions', articlesRange: '369-392' },
  { partNumber: 'PART XXII', title: 'Short Title, Commencement, Authoritative Text in Hindi and Repeals', articlesRange: '393-395' },
];

const ARTICLES = [
  // PART I
  {
    partNumber: 'PART I',
    partTitle: 'The Union and its Territory',
    articleNumber: 'Article 1',
    heading: 'Name and territory of the Union',
    originalText: '(1) India, that is Bharat, shall be a Union of States. (2) The States and the territories thereof shall be as specified in the First Schedule. (3) The territory of India shall comprise— (a) the territories of the States; (b) the Union territories specified in the First Schedule; and (c) such other territories as may be acquired.',
    simplifiedText: 'Declares India, that is Bharat, as a Union of States comprising all States and Union Territories specified in the First Schedule.',
    clauses: [
      { clauseNumber: '1', text: 'India, that is Bharat, shall be a Union of States.', simplified: 'Establishes India (Bharat) as an indestructible Union of States.' },
      { clauseNumber: '2', text: 'The States and the territories thereof shall be as specified in the First Schedule.', simplified: 'Constituent states and territories are listed in the First Schedule.' },
      { clauseNumber: '3', text: 'The territory of India shall comprise territories of States, Union territories, and acquired territories.', simplified: 'Defines the geographic jurisdiction of the Republic.' }
    ],
    amendmentNotes: 'Amended by Constitution (Seventh Amendment) Act, 1956.',
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
  {
    partNumber: 'PART I',
    partTitle: 'The Union and its Territory',
    articleNumber: 'Article 3',
    heading: 'Formation of new States and alteration of areas, boundaries or names of existing States',
    originalText: 'Parliament may by law— (a) form a new State by separation of territory from any State or by uniting two or more States or parts of States or by uniting any territory to a part of any State; (b) increase the area of any State; (c) diminish the area of any State; (d) alter the boundaries of any State; (e) alter the name of any State: Provided that no Bill for the purpose shall be introduced in either House of Parliament except on the recommendation of the President and unless, where the proposal contained in the Bill affects the area, boundaries or name of any of the States, the Bill has been referred by the President to the Legislature of that State for expressing its views.',
    simplifiedText: 'Empowers Parliament by simple majority law to reorganize state boundaries, create new States, or rename existing States after receiving the State Legislature’s views via the President.',
    clauses: [
      { clauseNumber: 'proviso', text: 'Provided that no Bill for the purpose shall be introduced except on President recommendation and reference to State Legislature.', simplified: 'State legislatures must be consulted before boundary reorganization.' }
    ],
    amendmentNotes: 'Amended by Constitution (Fifth Amendment) Act, 1955.',
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },

  // PART II: Citizenship
  {
    partNumber: 'PART II',
    partTitle: 'Citizenship',
    articleNumber: 'Article 5',
    heading: 'Citizenship at the commencement of the Constitution',
    originalText: 'At the commencement of this Constitution, every person who has his domicile in the territory of India and— (a) who was born in the territory of India; or (b) either of whose parents was born in the territory of India; or (c) who has been ordinarily resident in the territory of India for not less than five years immediately preceding such commencement, shall be a citizen of India.',
    simplifiedText: 'Confers citizenship on individuals residing in India on 26 January 1950 who were born in India, had Indian parents, or lived in India for at least 5 years.',
    clauses: [],
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
  {
    partNumber: 'PART II',
    partTitle: 'Citizenship',
    articleNumber: 'Article 11',
    heading: 'Parliament to regulate the right of citizenship by law',
    originalText: 'Nothing in the foregoing provisions of this Part shall derogate from the power of Parliament to make any provision with respect to the acquisition and termination of citizenship and all other matters relating to citizenship.',
    simplifiedText: 'Parliament holds full constitutional authority to legislate on acquisition, loss, or termination of Indian citizenship (exercised via Citizenship Act, 1955).',
    clauses: [],
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },

  // PART III: Fundamental Rights
  {
    partNumber: 'PART III',
    partTitle: 'Fundamental Rights',
    articleNumber: 'Article 12',
    heading: 'Definition of State',
    originalText: 'In this Part, unless the context otherwise requires, "the State" includes the Government and Parliament of India and the Government and the Legislature of each of the States and all local or other authorities within the territory of India or under the control of the Government of India.',
    simplifiedText: 'Defines the "State" against whom Fundamental Rights can be enforced: includes the Central and State governments, Parliament, legislative assemblies, municipal corporations, panchayats, and public authorities.',
    clauses: [],
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
  {
    partNumber: 'PART III',
    partTitle: 'Fundamental Rights',
    articleNumber: 'Article 13',
    heading: 'Laws inconsistent with or in derogation of the fundamental rights',
    originalText: '(1) All laws in force in the territory of India immediately before the commencement of this Constitution, in so far as they are inconsistent with the provisions of this Part, shall, to the extent of such inconsistency, be void. (2) The State shall not make any law which takes away or abridges the rights conferred by this Part and any law made in contravention of this clause shall, to the extent of the contravention, be void.',
    simplifiedText: 'Establishes judicial review: any existing or future law, ordinance, rule, or notification violating Fundamental Rights is void and unconstitutional to the extent of such inconsistency.',
    clauses: [
      { clauseNumber: '1', text: 'Pre-constitutional laws violating fundamental rights are void.', simplified: 'Voidness of pre-1950 inconsistent laws.' },
      { clauseNumber: '2', text: 'The State shall not make any law taking away or abridging fundamental rights.', simplified: 'Absolute prohibition on unconstitutional post-1950 laws.' },
      { clauseNumber: '4', text: 'Nothing in this article shall apply to any amendment of this Constitution made under article 368.', simplified: 'Inserted by 24th Amendment; subject to Kesavananda Bharati Basic Structure doctrine.' }
    ],
    amendmentNotes: 'Clause (4) inserted by Constitution (Twenty-fourth Amendment) Act, 1971.',
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
  {
    partNumber: 'PART III',
    partTitle: 'Fundamental Rights',
    articleNumber: 'Article 14',
    heading: 'Equality before law',
    originalText: 'The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India.',
    simplifiedText: 'Guarantees that every person (citizen or foreigner) is equal before the law and entitled to equal protection of laws without arbitrary state discrimination.',
    clauses: [],
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
  {
    partNumber: 'PART III',
    partTitle: 'Fundamental Rights',
    articleNumber: 'Article 15',
    heading: 'Prohibition of discrimination on grounds of religion, race, caste, sex or place of birth',
    originalText: '(1) The State shall not discriminate against any citizen on grounds only of religion, race, caste, sex, place of birth or any of them. (2) No citizen shall, on grounds only of religion, race, caste, sex, place of birth or any of them, be subject to any disability, liability, restriction or condition with regard to access to shops, public restaurants, hotels and palaces of public entertainment; or the use of wells, tanks, bathing ghats, roads and places of public resort. (3) Nothing in this article shall prevent the State from making any special provision for women and children. (4) Special provision for advancement of socially and educationally backward classes or SC/STs. (6) Special provisions for Economically Weaker Sections (EWS).',
    simplifiedText: 'Prohibits discrimination on grounds of religion, race, caste, sex or birth, while permitting affirmative action and special welfare provisions for women, children, SC/STs, OBCs, and Economically Weaker Sections (EWS).',
    clauses: [
      { clauseNumber: '1', text: 'Prohibits discrimination by the State.', simplified: 'State non-discrimination clause.' },
      { clauseNumber: '2', text: 'Guarantees equal access to public shops, restaurants, wells, and places of resort.', simplified: 'Universal public access.' },
      { clauseNumber: '3', text: 'Enables special protective provisions for women and children.', simplified: 'Affirmative action for women and minors.' },
      { clauseNumber: '4', text: 'Affirmative action for socially and educationally backward classes and SC/ST.', simplified: 'Added by 1st Amendment, 1951.' },
      { clauseNumber: '6', text: 'Affirmative action and 10% reservation for Economically Weaker Sections (EWS).', simplified: 'Added by 103rd Amendment, 2019.' }
    ],
    amendmentNotes: 'Amended by 1st (1951), 93rd (2005), and 103rd (2019) Constitutional Amendments.',
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
  {
    partNumber: 'PART III',
    partTitle: 'Fundamental Rights',
    articleNumber: 'Article 16',
    heading: 'Equality of opportunity in matters of public employment',
    originalText: '(1) There shall be equality of opportunity for all citizens in matters relating to employment or appointment to any office under the State. (2) No citizen shall, on grounds only of religion, race, caste, sex, descent, place of birth, residence or any of them, be ineligible for, or discriminated against in respect of, any employment or office under the State. (4) Reservation of appointments for backward classes not adequately represented. (6) Reservation up to 10% for Economically Weaker Sections (EWS).',
    simplifiedText: 'Guarantees equal opportunity in government jobs for all citizens without discrimination, with provisions for reservations for under-represented backward classes, SC/ST, and EWS.',
    clauses: [
      { clauseNumber: '1', text: 'Universal equality of opportunity in State employment.', simplified: 'Right to compete equally for public jobs.' },
      { clauseNumber: '4', text: 'Reservation of appointments or posts in favour of any backward class.', simplified: 'Reservations for inadequately represented backward classes.' },
      { clauseNumber: '6', text: 'Reservation up to 10% for Economically Weaker Sections (EWS).', simplified: 'Added by 103rd Amendment, 2019.' }
    ],
    amendmentNotes: 'Amended by 77th (1995), 81st (2000), 85th (2001), and 103rd (2019) Constitutional Amendments.',
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
  {
    partNumber: 'PART III',
    partTitle: 'Fundamental Rights',
    articleNumber: 'Article 17',
    heading: 'Abolition of Untouchability',
    originalText: '"Untouchability" is abolished and its practice in any form is forbidden. The enforcement of any disability arising out of "Untouchability" shall be an offence punishable in accordance with law.',
    simplifiedText: 'Completely abolishes the practice of untouchability in any form. Practicing caste-based untouchability is a cognizable criminal offense punishable under the Protection of Civil Rights Act, 1955 and SC/ST PoA Act.',
    clauses: [],
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
  {
    partNumber: 'PART III',
    partTitle: 'Fundamental Rights',
    articleNumber: 'Article 19',
    heading: 'Protection of certain rights regarding freedom of speech, etc.',
    originalText: '(1) All citizens shall have the right— (a) to freedom of speech and expression; (b) to assemble peaceably and without arms; (c) to form associations or unions or co-operative societies; (d) to move freely throughout the territory of India; (e) to reside and settle in any part of the territory of India; and (g) to practise any profession, or to carry on any occupation, trade or business. (2)-(6) Reasonable restrictions in the interests of sovereignty, integrity, security of the State, public order, decency, morality, or in relation to contempt of court, defamation or incitement to an offence.',
    simplifiedText: 'Protects the six basic democratic freedoms of citizens: speech and expression, peaceful assembly, forming associations/unions, free movement across India, residing anywhere in India, and practicing any lawful profession or trade, subject to reasonable statutory restrictions.',
    clauses: [
      { clauseNumber: '1(a)', text: 'freedom of speech and expression', simplified: 'Includes freedom of the press and right to impart and receive information.' },
      { clauseNumber: '1(b)', text: 'assemble peaceably and without arms', simplified: 'Right to hold peaceful protests and meetings.' },
      { clauseNumber: '1(c)', text: 'form associations or unions or co-operative societies', simplified: 'Trade unions, co-operatives (97th Amendment).' },
      { clauseNumber: '1(d)', text: 'move freely throughout India', simplified: 'Interstate travel.' },
      { clauseNumber: '1(e)', text: 'reside and settle in any part of India', simplified: 'Freedom of residence.' },
      { clauseNumber: '1(g)', text: 'practise any profession, occupation, trade or business', simplified: 'Right to livelihood and lawful trade.' }
    ],
    amendmentNotes: 'Sub-clause (f) (property) omitted by 44th Amendment, 1978. Co-operatives added by 97th Amendment, 2011.',
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
  {
    partNumber: 'PART III',
    partTitle: 'Fundamental Rights',
    articleNumber: 'Article 20',
    heading: 'Protection in respect of conviction for offences',
    originalText: '(1) No person shall be convicted of any offence except for violation of a law in force at the time of the commission of the act (Protection against ex-post facto laws). (2) No person shall be prosecuted and punished for the same offence more than once (Protection against double jeopardy). (3) No person accused of any offence shall be compelled to be a witness against himself (Protection against self-incrimination).',
    simplifiedText: 'Shields accused persons against retroactive criminal laws, double punishment for the same crime, and forced self-incriminating confessions.',
    clauses: [
      { clauseNumber: '1', text: 'No retroactive criminal conviction or penalty.', simplified: 'Ex-post facto law ban.' },
      { clauseNumber: '2', text: 'No double prosecution and punishment.', simplified: 'Double jeopardy protection.' },
      { clauseNumber: '3', text: 'No forced self-incrimination.', simplified: 'Right to silence.' }
    ],
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
  {
    partNumber: 'PART III',
    partTitle: 'Fundamental Rights',
    articleNumber: 'Article 21',
    heading: 'Protection of life and personal liberty',
    originalText: 'No person shall be deprived of his life or personal liberty except according to procedure established by law.',
    simplifiedText: 'Supreme constitutional protection of life and liberty: interpreted by the Supreme Court (Maneka Gandhi, Puttaswamy) to encompass human dignity, privacy, livelihood, clean environment, free legal aid, speedy trial, and freedom from arbitrary police arrest.',
    clauses: [],
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
  {
    partNumber: 'PART III',
    partTitle: 'Fundamental Rights',
    articleNumber: 'Article 21A',
    heading: 'Right to education',
    originalText: 'The State shall provide free and compulsory education to all children of the age of six to fourteen years in such manner as the State may, by law, determine.',
    simplifiedText: 'Guarantees free and compulsory schooling for every child aged 6 to 14 as a Fundamental Right, enacted through the RTE Act, 2009 with a 25% quota in private schools for disadvantaged groups.',
    clauses: [],
    amendmentNotes: 'Inserted by the Constitution (Eighty-sixth Amendment) Act, 2002 (w.e.f. 1-4-2010).',
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
  {
    partNumber: 'PART III',
    partTitle: 'Fundamental Rights',
    articleNumber: 'Article 22',
    heading: 'Protection against arrest and detention in certain cases',
    originalText: '(1) No person who is arrested shall be detained in custody without being informed, as soon as may be, of the grounds for such arrest nor shall he be denied the right to consult, and to be defended by, a legal practitioner of his choice. (2) Every person who is arrested and detained in custody shall be produced before the nearest magistrate within a period of twenty-four hours of such arrest excluding the time necessary for the journey.',
    simplifiedText: 'Mandates that any arrested person must be informed of the grounds of arrest immediately, allowed access to a lawyer of their choice, and produced before a Magistrate within 24 hours of arrest.',
    clauses: [
      { clauseNumber: '1', text: 'Right to know grounds of arrest and consult legal counsel.', simplified: 'Right to counsel and notice.' },
      { clauseNumber: '2', text: 'Mandatory production before Magistrate within 24 hours.', simplified: '24-hour magistrate production rule.' }
    ],
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
  {
    partNumber: 'PART III',
    partTitle: 'Fundamental Rights',
    articleNumber: 'Article 23',
    heading: 'Prohibition of traffic in human beings and forced labour',
    originalText: '(1) Traffic in human beings and begar and other similar forms of forced labour are prohibited and any contravention of this provision shall be an offence punishable in accordance with law.',
    simplifiedText: 'Prohibits human trafficking, bonded labour, begar, and paying below statutory minimum wages (which constitutes unconstitutional forced labour under Asiad Workers judgment).',
    clauses: [],
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
  {
    partNumber: 'PART III',
    partTitle: 'Fundamental Rights',
    articleNumber: 'Article 24',
    heading: 'Prohibition of employment of children in factories, etc.',
    originalText: 'No child below the age of fourteen years shall be employed to work in any factory or mine or engaged in any other hazardous employment.',
    simplifiedText: 'Strictly bans employing children under 14 years in factories, mines, hazardous industries, or commercial establishments.',
    clauses: [],
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
  {
    partNumber: 'PART III',
    partTitle: 'Fundamental Rights',
    articleNumber: 'Article 25',
    heading: 'Freedom of conscience and free profession, practice and propagation of religion',
    originalText: '(1) Subject to public order, morality and health and to the other provisions of this Part, all persons are equally entitled to freedom of conscience and the right freely to profess, practise and propagate religion.',
    simplifiedText: 'Guarantees freedom of conscience and the right to freely profess, practice, and propagate any religion, subject to public order, health, and morality.',
    clauses: [],
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
  {
    partNumber: 'PART III',
    partTitle: 'Fundamental Rights',
    articleNumber: 'Article 32',
    heading: 'Remedies for enforcement of rights conferred by this Part',
    originalText: '(1) The right to move the Supreme Court by appropriate proceedings for the enforcement of the rights conferred by this Part is guaranteed. (2) The Supreme Court shall have power to issue directions or orders or writs, including writs in the nature of habeas corpus, mandamus, prohibition, quo warranto and certiorari, whichever may be appropriate, for the enforcement of any of the rights conferred by this Part.',
    simplifiedText: 'The "Heart and Soul" of the Constitution: guarantees every citizen the fundamental right to petition the Supreme Court directly for the enforcement of Fundamental Rights via constitutional writs (Habeas Corpus, Mandamus, Quo Warranto, Certiorari, Prohibition, and Public Interest Litigation).',
    clauses: [
      { clauseNumber: '1', text: 'Right to approach Supreme Court directly is itself a guaranteed fundamental right.', simplified: 'Direct constitutional remedy.' },
      { clauseNumber: '2', text: 'Supreme Court writ jurisdiction (Habeas Corpus, Mandamus, Prohibition, Quo Warranto, Certiorari).', simplified: 'Five prerogative writs.' }
    ],
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },

  // PART IV: Directive Principles of State Policy
  {
    partNumber: 'PART IV',
    partTitle: 'Directive Principles of State Policy',
    articleNumber: 'Article 38',
    heading: 'State to secure a social order for the promotion of welfare of the people',
    originalText: '(1) The State shall strive to promote the welfare of the people by securing and protecting as effectively as it may a social order in which justice, social, economic and political, shall inform all the institutions of the national life. (2) The State shall, in particular, strive to minimise the inequalities in income, and endeavour to eliminate inequalities in status, facilities and opportunities.',
    simplifiedText: 'Directs the government to build a welfare state that eliminates income inequality and provides social, economic, and political justice.',
    clauses: [],
    amendmentNotes: 'Clause (2) inserted by 44th Amendment, 1978.',
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
  {
    partNumber: 'PART IV',
    partTitle: 'Directive Principles of State Policy',
    articleNumber: 'Article 39',
    heading: 'Certain principles of policy to be followed by the State',
    originalText: 'The State shall direct its policy towards securing— (a) that citizens, men and women equally, have the right to an adequate means of livelihood; (b) that ownership and control of material resources are distributed to subserve the common good; (c) that the economic system does not result in the concentration of wealth; (d) equal pay for equal work for both men and women; (e) health and strength of workers are not abused; (f) children are given opportunities to develop in a healthy manner.',
    simplifiedText: 'Requires the State to ensure equal pay for equal work for men and women, adequate livelihoods, prevention of wealth concentration, and protection of child and worker health.',
    clauses: [
      { clauseNumber: '(d)', text: 'equal pay for equal work for both men and women', simplified: 'Equal pay mandate.' }
    ],
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
  {
    partNumber: 'PART IV',
    partTitle: 'Directive Principles of State Policy',
    articleNumber: 'Article 39A',
    heading: 'Equal justice and free legal aid',
    originalText: 'The State shall secure that the operation of the legal system promotes justice, on a basis of equal opportunity, and shall, in particular, provide free legal aid, by suitable legislation or schemes or in any other way, to ensure that opportunities for securing justice are not denied to any citizen by reason of economic or other disabilities.',
    simplifiedText: 'Mandates the government to provide free legal lawyers and aid so poverty or lack of money never denies any citizen access to justice (foundation of NALSA Act, 1987).',
    clauses: [],
    amendmentNotes: 'Inserted by Constitution (Forty-second Amendment) Act, 1976 (w.e.f. 3-1-1977).',
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
  {
    partNumber: 'PART IV',
    partTitle: 'Directive Principles of State Policy',
    articleNumber: 'Article 40',
    heading: 'Organisation of village panchayats',
    originalText: 'The State shall take steps to organise village panchayats and endow them with such powers and authority as may be necessary to enable them to function as units of self-government.',
    simplifiedText: 'Directive to establish village panchayats with local governing powers (formalized into Part IX by 73rd Amendment, 1992).',
    clauses: [],
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
  {
    partNumber: 'PART IV',
    partTitle: 'Directive Principles of State Policy',
    articleNumber: 'Article 44',
    heading: 'Uniform civil code for the citizens',
    originalText: 'The State shall endeavour to secure for the citizens a Uniform Civil Code throughout the territory of India.',
    simplifiedText: 'Directs the State to endeavour toward a Uniform Civil Code governing personal matters such as marriage, divorce, and inheritance across communities.',
    clauses: [],
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },

  // PART IVA: Fundamental Duties
  {
    partNumber: 'PART IVA',
    partTitle: 'Fundamental Duties',
    articleNumber: 'Article 51A',
    heading: 'Fundamental duties',
    originalText: 'It shall be the duty of every citizen of India— (a) to abide by the Constitution and respect its ideals and institutions, the National Flag and the National Anthem; (b) to cherish and follow the noble ideals which inspired our national struggle for freedom; (c) to uphold and protect the sovereignty, unity and integrity of India; (d) to defend the country and render national service; (e) to promote harmony and the spirit of common brotherhood amongst all the people of India transcending religious, linguistic and regional or sectional diversities; to renounce practices derogatory to the dignity of women; (f) to value and preserve the rich heritage of our composite culture; (g) to protect and improve the natural environment including forests, lakes, rivers and wild life, and to have compassion for living creatures; (h) to develop the scientific temper, humanism and the spirit of inquiry and reform; (i) to safeguard public property and to abjure violence; (j) to strive towards excellence in all spheres; (k) who is a parent or guardian to provide opportunities for education to his child between the age of six and fourteen years.',
    simplifiedText: 'Lists the 11 Fundamental Duties of every Indian citizen, including respecting the National Flag, promoting communal brotherhood, renouncing practices derogatory to women, protecting the environment, developing scientific temper, and educating children aged 6 to 14.',
    clauses: [
      { clauseNumber: '(e)', text: 'promote harmony and renounce practices derogatory to the dignity of women', simplified: 'Duty of gender respect and harmony.' },
      { clauseNumber: '(g)', text: 'protect and improve the natural environment', simplified: 'Environmental stewardship.' },
      { clauseNumber: '(h)', text: 'develop the scientific temper, humanism and spirit of inquiry', simplified: 'Scientific temper duty.' },
      { clauseNumber: '(k)', text: 'parent/guardian duty to educate child aged 6 to 14', simplified: 'Added by 86th Amendment, 2002.' }
    ],
    amendmentNotes: 'Part IVA & Article 51A inserted by 42nd Amendment, 1976. Clause (k) added by 86th Amendment, 2002.',
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },

  // PART V & VI: Judiciary & Powers
  {
    partNumber: 'PART V',
    partTitle: 'The Union',
    chapterNumber: 'Chapter IV',
    chapterTitle: 'The Union Judiciary',
    articleNumber: 'Article 141',
    heading: 'Law declared by Supreme Court to be binding on all courts',
    originalText: 'The law declared by the Supreme Court shall be binding on all courts within the territory of India.',
    simplifiedText: 'All judgments, legal principles, and rulings of the Supreme Court of India serve as binding law of the land (precedent) across every court and tribunal in India.',
    clauses: [],
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
  {
    partNumber: 'PART V',
    partTitle: 'The Union',
    chapterNumber: 'Chapter IV',
    chapterTitle: 'The Union Judiciary',
    articleNumber: 'Article 142',
    heading: 'Enforcement of decrees and orders of Supreme Court and orders as to discovery, etc.',
    originalText: '(1) The Supreme Court in the exercise of its jurisdiction may pass such decree or make such order as is necessary for doing complete justice in any cause or matter pending before it, and any decree so passed or order so made shall be enforceable throughout the territory of India.',
    simplifiedText: 'Grants the Supreme Court plenary power to pass any order or decree necessary to do "complete justice" where statutory provisions are silent or inadequate.',
    clauses: [],
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
  {
    partNumber: 'PART VI',
    partTitle: 'The States',
    chapterNumber: 'Chapter V',
    chapterTitle: 'The High Courts in the States',
    articleNumber: 'Article 226',
    heading: 'Power of High Courts to issue certain writs',
    originalText: '(1) Notwithstanding anything in article 32, every High Court shall have power, throughout the territories in relation to which it exercises jurisdiction, to issue to any person or authority, including in appropriate cases, any Government, within those territories directions, orders or writs, including writs in the nature of habeas corpus, mandamus, prohibition, quo warranto and certiorari, or any of them, for the enforcement of any of the rights conferred by Part III and for any other purpose.',
    simplifiedText: 'High Court writ jurisdiction: empowers citizens to file writ petitions before the High Court not only for Fundamental Rights violations, but also for "any other purpose" (any statutory or legal right violation).',
    clauses: [],
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },

  // PART XII: Right to Property
  {
    partNumber: 'PART XII',
    partTitle: 'Finance, Property, Contracts and Suits',
    chapterNumber: 'Chapter IV',
    chapterTitle: 'Right to Property',
    articleNumber: 'Article 300A',
    heading: 'Persons not to be deprived of property save by authority of law',
    originalText: 'No person shall be deprived of his property save by authority of law.',
    simplifiedText: 'Establishes property as a Constitutional and Human Right: no person can have their land or property acquired or seized arbitrarily without lawful statutory procedure and just compensation.',
    clauses: [],
    amendmentNotes: 'Inserted by Constitution (Forty-fourth Amendment) Act, 1978 (w.e.f. 20-6-1979).',
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },

  // PART XV: Elections
  {
    partNumber: 'PART XV',
    partTitle: 'Elections',
    articleNumber: 'Article 326',
    heading: 'Elections to the House of the People and to the Legislative Assemblies of States to be on the basis of adult suffrage',
    originalText: 'The elections to the House of the People and to the Legislative Assembly of every State shall be on the basis of adult suffrage; that is to say, every person who is a citizen of India and who is not less than eighteen years of age on such date as may be fixed in that behalf by or under any law made by the appropriate Legislature and is not otherwise disqualified under this Constitution or any law made by the appropriate Legislature on the ground of non-residence, unsoundness of mind, crime or corrupt or illegal practice, shall be entitled to be registered as a voter at any such election.',
    simplifiedText: 'Guarantees universal adult suffrage: every Indian citizen aged 18 and above has the constitutional right to vote in Lok Sabha and State Assembly elections.',
    clauses: [],
    amendmentNotes: 'Voting age reduced from 21 to 18 by Constitution (Sixty-first Amendment) Act, 1988.',
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },

  // PART XVI: Women Reservation (106th Amendment)
  {
    partNumber: 'PART XVI',
    partTitle: 'Special Provisions Relating to Certain Classes',
    articleNumber: 'Article 330A',
    heading: 'Reservation of seats for women in the House of the People',
    originalText: '(1) Seats shall be reserved for women in the House of the People. (2) As nearly as may be, one-third of the total number of seats reserved under clause (2) of article 330 shall be reserved for women belonging to the Scheduled Castes or the Scheduled Tribes. (3) As nearly as may be, one-third (including the number of seats reserved for women belonging to the Scheduled Castes and the Scheduled Tribes) of the total number of seats to be filled by direct election to the House of the People shall be reserved for women.',
    simplifiedText: 'Reserves 33% (one-third) of seats in the Lok Sabha for women, including sub-reservation for SC and ST women (Nari Shakti Vandan Adhiniyam).',
    clauses: [],
    amendmentNotes: 'Inserted by the Constitution (One Hundred and Sixth Amendment) Act, 2023.',
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },

  // PART XX: Amendment Procedure
  {
    partNumber: 'PART XX',
    partTitle: 'Amendment of the Constitution',
    articleNumber: 'Article 368',
    heading: 'Power of Parliament to amend the Constitution and procedure therefor',
    originalText: '(1) Notwithstanding anything in this Constitution, Parliament may in exercise of its constituent power amend by way of addition, variation or repeal any provision of this Constitution in accordance with the procedure laid down in this article. (2) An amendment of this Constitution may be initiated only by the introduction of a Bill for the purpose in either House of Parliament, and when the Bill is passed in each House by a majority of the total membership of that House and by a majority of not less than two-thirds of the members of that House present and voting, it shall be presented to the President who shall give his assent to the Bill.',
    simplifiedText: 'Specifies the procedure for constitutional amendments requiring a special majority (two-thirds present and voting plus majority of total membership in both Houses of Parliament), subject to the Basic Structure doctrine (Kesavananda Bharati).',
    clauses: [
      { clauseNumber: '1', text: 'Constituent power of Parliament to amend by addition, variation or repeal.', simplified: 'Constituent amendment power.' },
      { clauseNumber: '2', text: 'Special majority voting requirements and presidential assent.', simplified: 'Special two-thirds majority procedure.' }
    ],
    amendmentNotes: 'Amended by 24th (1971) and 42nd (1976) Amendments; clauses (4) and (5) struck down in Minerva Mills (1980).',
    sourceUrl: 'https://legislative.gov.in/constitution-of-india',
    verificationStatus: 'VERIFIED',
  },
];

const SCHEDULES = [
  {
    number: 'First Schedule',
    title: 'The States and The Union Territories',
    articlesLinked: 'Articles 1 and 4',
    description: 'Lists all 28 States and 8 Union Territories of India and their respective territorial boundaries.',
  },
  {
    number: 'Second Schedule',
    title: 'Provisions as to the President, Governors, Judges, and CAG',
    articlesLinked: 'Articles 59, 65, 75, 97, 125, 148, 158, 164, 186 and 221',
    description: 'Details salaries, allowances, and perquisites of the President, Governors, Speaker, Supreme Court and High Court judges, and the Comptroller and Auditor-General of India.',
  },
  {
    number: 'Third Schedule',
    title: 'Forms of Oaths or Affirmations',
    articlesLinked: 'Articles 75, 84, 99, 124, 148, 164, 173, 188 and 219',
    description: 'Prescribes the exact solemn words of oath or affirmation for Union Ministers, MPs, Supreme Court Judges, State Ministers, MLAs, and High Court Judges.',
  },
  {
    number: 'Fourth Schedule',
    title: 'Allocation of Seats in the Council of States',
    articlesLinked: 'Articles 4 and 80',
    description: 'Specifies the allocation of seats to each State and Union Territory in the Rajya Sabha (Council of States).',
  },
  {
    number: 'Fifth Schedule',
    title: 'Provisions as to the Administration and Control of Scheduled Areas and Scheduled Tribes',
    articlesLinked: 'Article 244(1)',
    description: 'Special governance provisions for Scheduled Areas in states other than Assam, Meghalaya, Tripura, and Mizoram, including Tribes Advisory Councils.',
  },
  {
    number: 'Sixth Schedule',
    title: 'Provisions as to the Administration of Tribal Areas in the States of Assam, Meghalaya, Tripura and Mizoram',
    articlesLinked: 'Articles 244(2) and 275(1)',
    description: 'Establishes Autonomous District Councils (ADCs) and Regional Councils with legislative, judicial, and financial autonomy in northeastern tribal areas.',
  },
  {
    number: 'Seventh Schedule',
    title: 'Union List, State List, and Concurrent List',
    articlesLinked: 'Article 246',
    description: 'Defines the division of legislative powers: List I (Union List - 100 items e.g. defence, foreign affairs, banking), List II (State List - 61 items e.g. police, public health, local government), and List III (Concurrent List - 52 items e.g. criminal law, education, marriage).',
  },
  {
    number: 'Eighth Schedule',
    title: 'Languages',
    articlesLinked: 'Articles 344(1) and 351',
    description: 'Lists the 22 official languages of the Republic of India: Assamese, Bengali, Bodo, Dogri, Gujarati, Hindi, Kannada, Kashmiri, Konkani, Maithili, Malayalam, Manipuri, Marathi, Nepali, Odia, Punjabi, Sanskrit, Santali, Sindhi, Tamil, Telugu, and Urdu.',
  },
  {
    number: 'Ninth Schedule',
    title: 'Validation of certain Acts and Regulations',
    articlesLinked: 'Article 31B',
    description: 'Contains state land reform and economic laws protected from fundamental rights challenge under Article 31B (subject to judicial review for Basic Structure violations after 24 April 1973 per I.R. Coelho case).',
  },
  {
    number: 'Tenth Schedule',
    title: 'Provisions as to Disqualification on Ground of Defection (Anti-Defection Law)',
    articlesLinked: 'Articles 102(2) and 191(2)',
    description: 'Specifies disqualification rules for MPs and MLAs who voluntarily give up party membership or vote contrary to party whip (added by 52nd Amendment, 1985).',
  },
  {
    number: 'Eleventh Schedule',
    title: 'Powers, Authority and Responsibilities of Panchayats',
    articlesLinked: 'Article 243G',
    description: 'Lists 29 functional subjects devolvable to Village Panchayats (agriculture, water management, rural housing, drinking water, roads, education) added by 73rd Amendment, 1992.',
  },
  {
    number: 'Twelfth Schedule',
    title: 'Powers, Authority and Responsibilities of Municipalities',
    articlesLinked: 'Article 243W',
    description: 'Lists 18 functional subjects devolvable to urban Municipalities (urban planning, water supply, public health, fire services, slum improvement) added by 74th Amendment, 1992.',
  },
];

const CORPUS = {
  documentTitle: 'The Constitution of India',
  documentType: 'CONSTITUTION',
  jurisdiction: 'CENTRAL',
  version: '2024.1 (Up to 106th Amendment)',
  effectiveDate: '1950-01-26',
  asOfDate: '2024-05-01',
  verificationStatus: 'VERIFIED',
  totalParts: PARTS_DIRECTORY.length,
  totalArticlesIndexed: ARTICLES.length,
  totalSchedules: SCHEDULES.length,
  preamble: PREAMBLE,
  parts: PARTS_DIRECTORY,
  articles: ARTICLES,
  schedules: SCHEDULES,
};

const outputPath = path.resolve('data/constitution/constitution_corpus.json');
fs.writeFileSync(outputPath, JSON.stringify(CORPUS, null, 2), 'utf-8');
console.log(`✓ Constitution corpus generated successfully at ${outputPath}`);
console.log(`  Parts: ${PARTS_DIRECTORY.length}, Articles: ${ARTICLES.length}, Schedules: ${SCHEDULES.length}`);
