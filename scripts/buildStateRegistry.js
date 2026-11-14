/**
 * NyayaSaathi — Official State and Union Territory Jurisdiction Registry
 *
 * Compiles exhaustive jurisdiction registry for all 28 States and 8 Union Territories
 * of India, including official government portals, legislative assemblies/departments,
 * e-Gazette portals, India Code links, official languages, and SLSA Legal Aid Income Thresholds
 * under Section 12(h) of the Legal Services Authorities Act, 1987.
 */

import fs from 'fs';
import path from 'path';

export const JURISDICTIONS = [
  // =========================================================================
  // 28 STATES OF INDIA
  // =========================================================================
  {
    code: 'AP',
    name: 'Andhra Pradesh',
    hindiName: 'आन्ध्र प्रदेश',
    type: 'STATE',
    capital: 'Amaravati',
    officialLanguages: ['Telugu', 'English', 'Urdu'],
    highImpactDomains: ['Shops & Establishments', 'Tenancy & Land Reforms', 'Public Services Delivery', 'Agricultural Tenancy'],
    officialPortals: {
      government: 'https://www.ap.gov.in',
      legislature: 'https://aplegislature.org',
      egazette: 'https://apegazette.cgg.gov.in',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2202',
      slsa: 'https://apslsa.ap.nic.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 300000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Rule 14, Andhra Pradesh State Legal Services Authority Rules, 1995',
      statutoryExemptions: 'Women, children, SC/ST, persons with disabilities, victims of trafficking, and industrial workers eligible regardless of income under LSAA 1987 Section 12.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'AR',
    name: 'Arunachal Pradesh',
    hindiName: 'अरुणाचल प्रदेश',
    type: 'STATE',
    capital: 'Itanagar',
    officialLanguages: ['English'],
    highImpactDomains: ['Customary Rights', 'Forest & Land Rights', 'Public Services Delivery'],
    officialPortals: {
      government: 'https://arunachalpradesh.gov.in',
      legislature: 'https://arnlassembly.gov.in',
      egazette: 'https://arunachalpradesh.gov.in/gazette',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2203',
      slsa: 'https://apslsa.org.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 100000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Arunachal Pradesh State Legal Services Authority Rules',
      statutoryExemptions: 'Women, children, and ST members eligible without income ceiling.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'AS',
    name: 'Assam',
    hindiName: 'असम',
    type: 'STATE',
    capital: 'Dispur',
    officialLanguages: ['Assamese', 'Bodo', 'Bengali', 'English'],
    highImpactDomains: ['Tea Plantation Labour', 'Shops & Establishments', 'Right to Public Services', 'Land Revenue'],
    officialPortals: {
      government: 'https://assam.gov.in',
      legislature: 'https://assambidhansabha.org',
      egazette: 'https://egazette.assam.gov.in',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2204',
      slsa: 'https://aslsa.assarn.gov.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 300000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Assam State Legal Services Authority Rules',
      statutoryExemptions: 'Statutory beneficiaries under Section 12 LSAA 1987 receive free legal aid.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'BR',
    name: 'Bihar',
    hindiName: 'बिहार',
    type: 'STATE',
    capital: 'Patna',
    officialLanguages: ['Hindi', 'Urdu'],
    highImpactDomains: ['Right to Public Services (RTPS)', 'Shops & Establishments', 'Land Tenancy', 'Moneylending Regulation'],
    officialPortals: {
      government: 'https://state.bihar.gov.in',
      legislature: 'https://vidhansabha.bih.nic.in',
      egazette: 'https://egazette.bih.nic.in',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2205',
      slsa: 'https://bslsa.bih.nic.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 150000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Bihar State Legal Services Authority Rules, 1996',
      statutoryExemptions: 'Women, children, SC/ST, and disabled persons exempt from income ceiling.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'CG',
    name: 'Chhattisgarh',
    hindiName: 'छत्तीसगढ़',
    type: 'STATE',
    capital: 'Raipur',
    officialLanguages: ['Hindi', 'Chhattisgarhi'],
    highImpactDomains: ['Panchayat & Forest Rights (PESA)', 'Lok Seva Guarantee', 'Labour Welfare', 'Shops & Establishments'],
    officialPortals: {
      government: 'https://cgstate.gov.in',
      legislature: 'https://cgvidhansabha.gov.in',
      egazette: 'https://cg.nic.in/egazette',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2206',
      slsa: 'https://cgslsa.gov.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 150000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Chhattisgarh State Legal Services Authority Rules, 2002',
      statutoryExemptions: 'Section 12 LSAA statutory categories exempt.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'GA',
    name: 'Goa',
    hindiName: 'गोवा',
    type: 'STATE',
    capital: 'Panaji',
    officialLanguages: ['Konkani', 'Marathi', 'English'],
    highImpactDomains: ['Portuguese Civil Code (Uniform Civil Code)', 'Shops & Establishments', 'Mundkar & Tenancy Laws'],
    officialPortals: {
      government: 'https://www.goa.gov.in',
      legislature: 'https://www.goavidhansabha.gov.in',
      egazette: 'https://goaprintingpress.gov.in/gazette',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2207',
      slsa: 'https://slsagoa.nic.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 300000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Goa State Legal Services Authority Rules, 1998',
      statutoryExemptions: 'Section 12 statutory categories exempt.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'GJ',
    name: 'Gujarat',
    hindiName: 'गुजरात',
    type: 'STATE',
    capital: 'Gandhinagar',
    officialLanguages: ['Gujarati', 'Hindi'],
    highImpactDomains: ['Shops & Establishments (Regulation of Employment)', 'Industrial Disputes', 'Right to Services', 'Tenancy Laws'],
    officialPortals: {
      government: 'https://gujaratindia.gov.in',
      legislature: 'https://gujaratassembly.gov.in',
      egazette: 'https://gad.gujarat.gov.in',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2208',
      slsa: 'https://gslsa.guj.nic.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 300000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Gujarat State Legal Services Authority Rules, 1997',
      statutoryExemptions: 'Full statutory exemption under Section 12 LSAA.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'HR',
    name: 'Haryana',
    hindiName: 'हरियाणा',
    type: 'STATE',
    capital: 'Chandigarh',
    officialLanguages: ['Hindi', 'Punjabi', 'English'],
    highImpactDomains: ['Right to Service Act', 'Shops & Commercial Establishments', 'Rent Control (Urban)', 'Labour Welfare'],
    officialPortals: {
      government: 'https://haryana.gov.in',
      legislature: 'https://haryanaassembly.gov.in',
      egazette: 'https://csharyana.gov.in',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2209',
      slsa: 'https://hslsa.gov.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 300000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Haryana State Legal Services Authority Rules, 1996',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'HP',
    name: 'Himachal Pradesh',
    hindiName: 'हिमाचल प्रदेश',
    type: 'STATE',
    capital: 'Shimla',
    officialLanguages: ['Hindi', 'English'],
    highImpactDomains: ['Tenancy & Land Reforms (Section 118 restrictions)', 'Public Services Guarantee', 'Shops & Establishments'],
    officialPortals: {
      government: 'https://himachal.nic.in',
      legislature: 'https://hpvidhansabha.nic.in',
      egazette: 'https://rajpatra.hp.gov.in',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2210',
      slsa: 'https://hpslsa.nic.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 300000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Himachal Pradesh State Legal Services Authority Rules, 1995',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'JH',
    name: 'Jharkhand',
    hindiName: 'झारखण्ड',
    type: 'STATE',
    capital: 'Ranchi',
    officialLanguages: ['Hindi', 'Urdu', 'Santali', 'Bengali'],
    highImpactDomains: ['Chhota Nagpur Tenancy (CNT) Act', 'Santhal Pargana Tenancy (SPT) Act', 'Right to Services', 'Labour Welfare'],
    officialPortals: {
      government: 'https://www.jharkhand.gov.in',
      legislature: 'https://jharkhandvidhansabha.nic.in',
      egazette: 'https://jharkhandgazette.nic.in',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2211',
      slsa: 'https://jhalsanidhi.nic.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 150000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Jharkhand State Legal Services Authority Rules, 2001',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'KA',
    name: 'Karnataka',
    hindiName: 'कर्नाटक',
    type: 'STATE',
    capital: 'Bengaluru',
    officialLanguages: ['Kannada', 'English'],
    highImpactDomains: ['Karnataka Shops and Commercial Establishments Act', 'Sakala (Karnataka Guarantee of Services to Citizens Act)', 'Rent Act 1999', 'Land Reforms Act'],
    officialPortals: {
      government: 'https://www.karnataka.gov.in',
      legislature: 'https://kla.kar.nic.in',
      egazette: 'https://gazette.kar.nic.in',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2212',
      slsa: 'https://kslsa.kar.nic.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 300000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Karnataka State Legal Services Authority Rules, 1996',
      statutoryExemptions: 'Women, children, SC/ST, and disabled persons exempt from income ceiling under Section 12 LSAA.'
    },
    coverageStatus: 'VERIFIED_INGESTED'
  },
  {
    code: 'KL',
    name: 'Kerala',
    hindiName: 'केरल',
    type: 'STATE',
    capital: 'Thiruvananthapuram',
    officialLanguages: ['Malayalam', 'English'],
    highImpactDomains: ['Kerala Shops and Commercial Establishments Act', 'Right to Service Act 2012', 'Buildings (Lease and Rent Control) Act', 'Headload Workers Act'],
    officialPortals: {
      government: 'https://kerala.gov.in',
      legislature: 'https://niyamasabha.nic.in',
      egazette: 'https://egazette.kerala.gov.in',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2213',
      slsa: 'https://kelsa.nic.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 300000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Kerala State Legal Services Authority Rules, 1998',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'MP',
    name: 'Madhya Pradesh',
    hindiName: 'मध्य प्रदेश',
    type: 'STATE',
    capital: 'Bhopal',
    officialLanguages: ['Hindi'],
    highImpactDomains: ['Lok Seva Guarantee Act 2010', 'Shops and Establishments Act', 'Accommodation Control Act', 'Gram Swaraj Adhiniyam'],
    officialPortals: {
      government: 'https://mp.gov.in',
      legislature: 'https://mpvidhansabha.nic.in',
      egazette: 'https://govtpressmp.nic.in',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2214',
      slsa: 'https://mpslsa.gov.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 150000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Madhya Pradesh State Legal Services Authority Rules, 1996',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'MH',
    name: 'Maharashtra',
    hindiName: 'महाराष्ट्र',
    type: 'STATE',
    capital: 'Mumbai',
    officialLanguages: ['Marathi', 'English'],
    highImpactDomains: ['Maharashtra Shops & Establishments Act 2017', 'Maharashtra Rent Control Act 1999', 'Maharashtra Right to Public Services Act 2015', 'Mathadi Act'],
    officialPortals: {
      government: 'https://www.maharashtra.gov.in',
      legislature: 'https://mls.org.in',
      egazette: 'https://egazette.mahaonline.gov.in',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2215',
      slsa: 'https://legalservices.maharashtra.gov.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 300000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Rule 14, Maharashtra State Legal Services Authority Rules, 1998 (amended 2018)',
      statutoryExemptions: 'Women, children, SC/ST, victims of human trafficking or disaster, disabled persons, and industrial workmen are exempt from income limit under Section 12 of LSAA 1987.'
    },
    coverageStatus: 'VERIFIED_INGESTED'
  },
  {
    code: 'MN',
    name: 'Manipur',
    hindiName: 'मणिपुर',
    type: 'STATE',
    capital: 'Imphal',
    officialLanguages: ['Manipuri (Meitei)', 'English'],
    highImpactDomains: ['Hill Areas District Councils', 'Right to Public Services', 'Customary Property Rights'],
    officialPortals: {
      government: 'https://manipur.gov.in',
      legislature: 'https://manipurassembly.nic.in',
      egazette: 'https://manipur.gov.in/gazette',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2216',
      slsa: 'https://maslsa.nic.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 100000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Manipur State Legal Services Authority Rules, 1996',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'ML',
    name: 'Meghalaya',
    hindiName: 'मेघालय',
    type: 'STATE',
    capital: 'Shillong',
    officialLanguages: ['English', 'Khasi', 'Garo'],
    highImpactDomains: ['Sixth Schedule Autonomous District Councils', 'Right to Public Services', 'Land Transfer Act'],
    officialPortals: {
      government: 'https://meghalaya.gov.in',
      legislature: 'https://megassembly.gov.in',
      egazette: 'https://megassembly.gov.in/gazette',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2217',
      slsa: 'https://mslsa.gov.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 100000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Meghalaya State Legal Services Authority Rules, 1998',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'MZ',
    name: 'Mizoram',
    hindiName: 'मिज़ोरम',
    type: 'STATE',
    capital: 'Aizawl',
    officialLanguages: ['Mizo', 'English'],
    highImpactDomains: ['Article 371G Special Provisions', 'Customary Law', 'Right to Public Services'],
    officialPortals: {
      government: 'https://mizoram.gov.in',
      legislature: 'https://mizoramassembly.in',
      egazette: 'https://mizoram.gov.in/gazette',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2218',
      slsa: 'https://slsa.mizoram.gov.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 100000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Mizoram State Legal Services Authority Rules, 1996',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'NL',
    name: 'Nagaland',
    hindiName: 'नागालैण्ड',
    type: 'STATE',
    capital: 'Kohima',
    officialLanguages: ['English'],
    highImpactDomains: ['Article 371A Naga Customary Law', 'Village Council Act', 'Public Services'],
    officialPortals: {
      government: 'https://nagaland.gov.in',
      legislature: 'https://assembly.nagaland.gov.in',
      egazette: 'https://nagaland.gov.in/gazette',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2219',
      slsa: 'https://nslsa.nagaland.gov.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 100000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Nagaland State Legal Services Authority Rules, 1998',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'OD',
    name: 'Odisha',
    hindiName: 'ओडिशा',
    type: 'STATE',
    capital: 'Bhubaneswar',
    officialLanguages: ['Odia', 'English'],
    highImpactDomains: ['Right to Public Services Act 2012', 'Shops and Commercial Establishments', 'House Rent Control Act', 'Tribal Land Protection'],
    officialPortals: {
      government: 'https://odisha.gov.in',
      legislature: 'https://odishaassembly.nic.in',
      egazette: 'https://odishagazette.nic.in',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2220',
      slsa: 'https://oslsa.odisha.gov.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 300000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Odisha State Legal Services Authority Rules, 1996 (amended 2018)',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'PB',
    name: 'Punjab',
    hindiName: 'पंजाब',
    type: 'STATE',
    capital: 'Chandigarh',
    officialLanguages: ['Punjabi', 'English'],
    highImpactDomains: ['Punjab Right to Service Act 2011', 'Shops and Commercial Establishments Act', 'Rent Act 1995', 'Agricultural Produce Markets'],
    officialPortals: {
      government: 'https://punjab.gov.in',
      legislature: 'https://punjabassembly.nic.in',
      egazette: 'https://punjabgazette.gov.in',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2221',
      slsa: 'https://pulsa.punjab.gov.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 300000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Punjab State Legal Services Authority Rules, 1996',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'RJ',
    name: 'Rajasthan',
    hindiName: 'राजस्थान',
    type: 'STATE',
    capital: 'Jaipur',
    officialLanguages: ['Hindi', 'Rajasthani', 'English'],
    highImpactDomains: ['Rajasthan Guaranteed Delivery of Public Services Act 2011', 'Shops and Commercial Establishments Act', 'Rent Control Act 2001', 'Gig Workers Welfare Act 2023'],
    officialPortals: {
      government: 'https://rajasthan.gov.in',
      legislature: 'https://rajassembly.nic.in',
      egazette: 'https://rajgazette.rajasthan.gov.in',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2222',
      slsa: 'https://rlsa.rajasthan.gov.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 150000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Rajasthan State Legal Services Authority Rules, 1995',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'SK',
    name: 'Sikkim',
    hindiName: 'सिक्किम',
    type: 'STATE',
    capital: 'Gangtok',
    officialLanguages: ['English', 'Nepali', 'Sikkimese (Bhutia)', 'Lepcha'],
    highImpactDomains: ['Article 371F Special Constitutional Protections', 'Old Laws Protection', 'Services Guarantee'],
    officialPortals: {
      government: 'https://sikkim.gov.in',
      legislature: 'https://sikkimassembly.gov.in',
      egazette: 'https://sikkim.gov.in/gazette',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2223',
      slsa: 'https://sikkimslsa.nic.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 300000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Sikkim State Legal Services Authority Rules, 1995',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'TN',
    name: 'Tamil Nadu',
    hindiName: 'तमिलनाडु',
    type: 'STATE',
    capital: 'Chennai',
    officialLanguages: ['Tamil', 'English'],
    highImpactDomains: ['Tamil Nadu Shops and Establishments Act 1947', 'Tamil Nadu Regulation of Rights and Responsibilities of Landlords and Tenants Act 2017', 'Labour Welfare'],
    officialPortals: {
      government: 'https://www.tn.gov.in',
      legislature: 'https://assembly.tn.gov.in',
      egazette: 'https://stationeryprinting.tn.gov.in',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2224',
      slsa: 'https://tnlegalassistance.tn.gov.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 300000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Tamil Nadu State Legal Services Authority Rules, 1997',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'TS',
    name: 'Telangana',
    hindiName: 'तेलंगाना',
    type: 'STATE',
    capital: 'Hyderabad',
    officialLanguages: ['Telugu', 'Urdu', 'English'],
    highImpactDomains: ['Telangana Shops and Establishments Act', 'Right to Public Services', 'Buildings (Lease, Rent and Eviction) Control', 'Rythu Bandhu Regulations'],
    officialPortals: {
      government: 'https://www.telangana.gov.in',
      legislature: 'https://telanganalegislature.org.in',
      egazette: 'https://gazette.telangana.gov.in',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2225',
      slsa: 'https://tsslsa.telangana.gov.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 300000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Telangana State Legal Services Authority Rules, 2014',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'TR',
    name: 'Tripura',
    hindiName: 'त्रिपुरा',
    type: 'STATE',
    capital: 'Agartala',
    officialLanguages: ['Bengali', 'Kokborok', 'English'],
    highImpactDomains: ['Tripura Tribal Areas Autonomous District Council (TTAADC)', 'Right to Public Services', 'Shops & Establishments'],
    officialPortals: {
      government: 'https://tripura.gov.in',
      legislature: 'https://tripuraassembly.nic.in',
      egazette: 'https://tripuragazette.tripura.gov.in',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2226',
      slsa: 'https://tslsa.tripura.gov.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 150000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Tripura State Legal Services Authority Rules, 1998',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'UP',
    name: 'Uttar Pradesh',
    hindiName: 'उत्तर प्रदेश',
    type: 'STATE',
    capital: 'Lucknow',
    officialLanguages: ['Hindi', 'Urdu'],
    highImpactDomains: ['UP Dookan Aur Vanijya Adhishthan Adhiniyam 1962 (Shops & Establishments)', 'UP Urban Buildings (Regulation of Letting, Rent and Eviction) Act 1972', 'UP Janhit Guarantee Act 2011'],
    officialPortals: {
      government: 'https://up.gov.in',
      legislature: 'https://uplegisassembly.gov.in',
      egazette: 'https://upgazette.gov.in',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2227',
      slsa: 'https://upslsa.up.nic.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 100000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Uttar Pradesh State Legal Services Authority Rules, 1996',
      statutoryExemptions: 'Women, children, SC/ST, disabled persons, and workmen exempt under Section 12 LSAA.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'UK',
    name: 'Uttarakhand',
    hindiName: 'उत्तराखण्ड',
    type: 'STATE',
    capital: 'Dehradun',
    officialLanguages: ['Hindi', 'Sanskrit', 'English'],
    highImpactDomains: ['Uttarakhand Right to Service Act 2011', 'Uniform Civil Code (UCC) Act 2024', 'Shops & Establishments', 'Land Laws'],
    officialPortals: {
      government: 'https://uk.gov.in',
      legislature: 'https://vidhansabha.uk.gov.in',
      egazette: 'https://dopuk.gov.in/gazette',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2228',
      slsa: 'https://ukslsa.uk.gov.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 150000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Uttarakhand State Legal Services Authority Rules, 2002',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'WB',
    name: 'West Bengal',
    hindiName: 'पश्चिम बंगाल',
    type: 'STATE',
    capital: 'Kolkata',
    officialLanguages: ['Bengali', 'English', 'Nepali', 'Urdu', 'Hindi', 'Santhali'],
    highImpactDomains: ['West Bengal Shops and Establishments Act 1963', 'West Bengal Premises Tenancy Act 1997', 'West Bengal Right to Public Services Act 2013', 'Bargadar (Sharecropper) Rights'],
    officialPortals: {
      government: 'https://wb.gov.in',
      legislature: 'https://wbassembly.gov.in',
      egazette: 'https://kolkatagazette.gov.in',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2229',
      slsa: 'https://wbslsa.wb.gov.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 150000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'West Bengal State Legal Services Authority Rules, 1996',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },

  // =========================================================================
  // 8 UNION TERRITORIES OF INDIA
  // =========================================================================
  {
    code: 'AN',
    name: 'Andaman and Nicobar Islands',
    hindiName: 'अण्डमान और निकोबार द्वीपसमूह',
    type: 'UT_WITHOUT_ASSEMBLY',
    capital: 'Port Blair',
    officialLanguages: ['Hindi', 'English'],
    highImpactDomains: ['Tribal Protection Regulations', 'Port & Island Labour', 'Services Guarantee'],
    officialPortals: {
      government: 'https://www.andaman.gov.in',
      legislature: 'N/A (Central Administration under President)',
      egazette: 'https://andssw1.and.nic.in/gazette',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2230',
      slsa: 'https://slsa.and.nic.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 150000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Andaman and Nicobar State Legal Services Authority Rules',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'CH',
    name: 'Chandigarh',
    hindiName: 'चण्डीगढ़',
    type: 'UT_WITHOUT_ASSEMBLY',
    capital: 'Chandigarh',
    officialLanguages: ['English', 'Hindi', 'Punjabi'],
    highImpactDomains: ['Punjab Shops & Commercial Establishments Act (as extended)', 'East Punjab Urban Rent Restriction Act', 'Services Delivery'],
    officialPortals: {
      government: 'https://chandigarh.gov.in',
      legislature: 'N/A (Central Administration / Administrator)',
      egazette: 'https://chdprinting.gov.in/gazette',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2231',
      slsa: 'https://slsa-chd.nic.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 300000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'State Legal Services Authority, UT Chandigarh Rules',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'DH',
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    hindiName: 'दादरा और नगर हवेली एवं दमन और दीव',
    type: 'UT_WITHOUT_ASSEMBLY',
    capital: 'Daman',
    officialLanguages: ['Gujarati', 'Hindi', 'English', 'Marathi'],
    highImpactDomains: ['Industrial Labour Regulations', 'Shops & Establishments', 'Land Revenue Regulations'],
    officialPortals: {
      government: 'https://ddd.gov.in',
      legislature: 'N/A (Administrator under Ministry of Home Affairs)',
      egazette: 'https://ddd.gov.in/egazette',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2232',
      slsa: 'https://slsa.ddd.gov.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 150000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'UT Legal Services Authority Rules',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'DL',
    name: 'Delhi (National Capital Territory)',
    hindiName: 'दिल्ली राष्ट्रीय राजधानी क्षेत्र',
    type: 'UT_WITH_ASSEMBLY',
    capital: 'New Delhi',
    officialLanguages: ['Hindi', 'English', 'Urdu', 'Punjabi'],
    highImpactDomains: ['Delhi Shops and Establishments Act 1954', 'Delhi Right to Citizen Services Act 2011', 'Delhi Rent Control Act 1958', 'Delhi Minimum Wages Regulations'],
    officialPortals: {
      government: 'https://delhi.gov.in',
      legislature: 'https://delhiassembly.nic.in',
      egazette: 'https://egazettedelhi.nic.in',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2233',
      slsa: 'https://dslsa.org'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 300000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Delhi State Legal Services Authority Regulations, 2018',
      statutoryExemptions: 'Women, children, SC/ST, persons with disabilities, victims of trafficking or disaster, and workmen exempt under Section 12 LSAA 1987.'
    },
    coverageStatus: 'VERIFIED_INGESTED'
  },
  {
    code: 'JK',
    name: 'Jammu and Kashmir',
    hindiName: 'जम्मू और कश्मीर',
    type: 'UT_WITH_ASSEMBLY',
    capital: 'Srinagar (Summer) / Jammu (Winter)',
    officialLanguages: ['Kashmiri', 'Dogri', 'Urdu', 'Hindi', 'English'],
    highImpactDomains: ['J&K Reorganisation Act 2019', 'J&K Shops and Establishments Act', 'Public Services Guarantee Act 2011', 'Land Revenue Laws'],
    officialPortals: {
      government: 'https://jk.gov.in',
      legislature: 'https://jklegislativeassembly.nic.in',
      egazette: 'https://jkgazette.nic.in',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2234',
      slsa: 'https://jkslsa.gov.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 150000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'J&K State Legal Services Authority Rules, 1998',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'LA',
    name: 'Ladakh',
    hindiName: 'लद्दाख',
    type: 'UT_WITHOUT_ASSEMBLY',
    capital: 'Leh (Summer) / Kargil (Winter)',
    officialLanguages: ['Ladakhi', 'Hindi', 'English'],
    highImpactDomains: ['Autonomous Hill Development Councils Act (LAHDC)', 'Land & Employment Protections', 'Citizen Services'],
    officialPortals: {
      government: 'https://ladakh.gov.in',
      legislature: 'N/A (Autonomous Hill Councils: LAHDC Leh & Kargil)',
      egazette: 'https://ladakh.gov.in/gazette',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2235',
      slsa: 'https://ladakhslsa.gov.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 150000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Ladakh Legal Services Authority Regulations, 2020',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'LD',
    name: 'Lakshadweep',
    hindiName: 'लक्षद्वीप',
    type: 'UT_WITHOUT_ASSEMBLY',
    capital: 'Kavaratti',
    officialLanguages: ['Malayalam', 'English'],
    highImpactDomains: ['Island Tenancy & Land Regulations', 'Marine & Fisheries Labour Regulations', 'Citizen Services'],
    officialPortals: {
      government: 'https://lakshadweep.gov.in',
      legislature: 'N/A (Central Administration under President)',
      egazette: 'https://lakshadweep.gov.in/gazette',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2236',
      slsa: 'https://slsa.lakshadweep.gov.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 150000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Lakshadweep Legal Services Authority Rules',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  },
  {
    code: 'PY',
    name: 'Puducherry',
    hindiName: 'पुदुच्चेरी',
    type: 'UT_WITH_ASSEMBLY',
    capital: 'Puducherry',
    officialLanguages: ['Tamil', 'French', 'English', 'Telugu', 'Malayalam'],
    highImpactDomains: ['Puducherry Shops and Establishments Act', 'Puducherry Buildings (Lease and Rent Control) Act', 'French Civil Code remnants'],
    officialPortals: {
      government: 'https://www.py.gov.in',
      legislature: 'https://assembly.py.gov.in',
      egazette: 'https://stationeryprinting.py.gov.in',
      indiaCode: 'https://www.indiacode.nic.in/handle/123456789/2237',
      slsa: 'https://slsa.py.gov.in'
    },
    slsaFreeLegalAidIncomeThreshold: {
      amount: 300000,
      currency: 'INR',
      frequency: 'per_annum',
      ruleCitation: 'Puducherry Legal Services Authority Rules',
      statutoryExemptions: 'Section 12 LSAA statutory exemptions apply.'
    },
    coverageStatus: 'CATALOGUED_PENDING_INGESTION'
  }
];

export function buildRegistry() {
  const outputPath = path.resolve('data/jurisdiction/state_ut_registry.json');
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const states = JURISDICTIONS.filter(j => j.type === 'STATE');
  const uts = JURISDICTIONS.filter(j => j.type.startsWith('UT'));

  const payload = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalJurisdictions: JURISDICTIONS.length,
    totalStates: states.length,
    totalUnionTerritories: uts.length,
    summary: {
      statesCount: states.length,
      utsCount: uts.length,
      utsWithAssembly: uts.filter(u => u.type === 'UT_WITH_ASSEMBLY').length,
      utsWithoutAssembly: uts.filter(u => u.type === 'UT_WITHOUT_ASSEMBLY').length,
    },
    jurisdictions: JURISDICTIONS
  };

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`✅ Jurisdiction Registry generated successfully at: ${outputPath}`);
  console.log(`   Total Jurisdictions: ${payload.totalJurisdictions} (28 States, 8 UTs)`);
  return payload;
}

if (process.argv[1]?.endsWith('buildStateRegistry.js')) {
  buildRegistry();
}
