import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Printer,
  Copy,
  Check,
  Download,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Sparkles,
  Scale
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const TEMPLATES = [
  {
    id: "wage-demand",
    title: "Unpaid Salary Legal Demand Notice",
    statute: "Payment of Wages Act, 1936 — Section 15 / Form VI",
    authority: "Authority appointed under Section 15 / Labour Commissioner",
    description: "Statutory demand notice sent to an employer demanding release of withheld salary within 15 days prior to filing a formal claim before the Labour Authority.",
    fields: [
      { key: "workerName", label: "Your Full Name", placeholder: "e.g. Ramesh Kumar" },
      { key: "workerAddress", label: "Your Residential Address", placeholder: "Street, City, State, PIN" },
      { key: "workerPhone", label: "Contact Phone Number", placeholder: "+91 9876543210" },
      { key: "employerName", label: "Employer / Company Name", placeholder: "e.g. Acme Tech Solutions Pvt Ltd" },
      { key: "employerAddress", label: "Company Official Address", placeholder: "Registered Office, City, State" },
      { key: "designation", label: "Your Job Designation", placeholder: "e.g. Software Engineer / Site Supervisor" },
      { key: "joiningDate", label: "Date of Joining", placeholder: "e.g. 15 March 2023" },
      { key: "unpaidMonths", label: "Unpaid Months / Period", placeholder: "e.g. August 2024 to October 2024" },
      { key: "totalDues", label: "Total Unpaid Amount (₹)", placeholder: "e.g. ₹75,000" },
    ],
    generate: (data) => `LEGAL DEMAND NOTICE
(Under Section 15 of the Payment of Wages Act, 1936 & State Labour Rules)

Date: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}

TO:
${data.employerName || "[Employer/Company Name]"}
${data.employerAddress || "[Company Registered Address]"}

FROM:
${data.workerName || "[Your Full Name]"}
Designation: ${data.designation || "[Job Designation]"}
Address: ${data.workerAddress || "[Your Address]"}
Contact: ${data.workerPhone || "[Contact Number]"}

SUBJECT: DEMAND FOR IMMEDIATE DISBURSEMENT OF WITHHELD SALARY / WAGES AMOUNTING TO ${data.totalDues || "₹[Amount]"} FOR THE PERIOD ${data.unpaidMonths || "[Months]"}

Sir/Madam,

I, ${data.workerName || "[Your Full Name]"}, was employed with your establishment as ${data.designation || "[Job Designation]"} since ${data.joiningDate || "[Joining Date]"}.

1. That in terms of my employment contract and the statutory mandate under Section 5 of the Payment of Wages Act, 1936, wages are required to be paid before the expiry of the 7th/10th day of the subsequent wage period.

2. That despite rendering satisfactory services, you have unlawfully withheld my earned wages for the period ${data.unpaidMonths || "[Months]"}, aggregating to ${data.totalDues || "₹[Amount]"}.

3. That repeated verbal and written requests regarding the pending disbursement have failed to elicit payment or compliance.

4. YOU ARE HEREBY CALLED UPON to disburse the entire outstanding amount of ${data.totalDues || "₹[Amount]"} into my registered bank account within FIFTEEN (15) DAYS from receipt of this notice.

5. TAKE NOTICE that failing compliance, I shall be constrained to initiate formal recovery proceedings under Section 15 of the Payment of Wages Act, 1936, before the Competent Labour Authority, claiming the unpaid wages along with statutory compensation up to ten times the amount deducted under Section 15(3), entirely at your cost and consequences.

Yours faithfully,

_______________________
(${data.workerName || "[Your Full Name]"})
Applicant / Workman`,
  },
  {
    id: "rti-application",
    title: "Right to Information (RTI) Application",
    statute: "Right to Information Act, 2005 — Section 6(1)",
    authority: "Public Information Officer (PIO)",
    description: "Statutory application to obtain certified records, scheme beneficiary lists, or government action-taken reports within 30 days.",
    fields: [
      { key: "applicantName", label: "Applicant Full Name", placeholder: "e.g. Priya Sharma" },
      { key: "applicantAddress", label: "Address for Correspondence", placeholder: "Complete postal address" },
      { key: "applicantPhone", label: "Phone / Email", placeholder: "+91 9876543210" },
      { key: "publicAuthority", label: "Public Authority / Department", placeholder: "e.g. Municipal Corporation / Labour Dept" },
      { key: "infoParticulars", label: "Information / Documents Requested", placeholder: "Certified copies of file notes, inquiry reports, etc." },
      { key: "periodRequested", label: "Period to which Information Pertains", placeholder: "e.g. 01/01/2023 to 31/12/2023" },
    ],
    generate: (data) => `APPLICATION UNDER SECTION 6(1) OF THE RIGHT TO INFORMATION ACT, 2005

To,
The Central / State Public Information Officer (CPIO / SPIO),
${data.publicAuthority || "[Public Authority / Department Name]"}
Government of India / State Government

1. Full Name of Applicant: ${data.applicantName || "[Applicant Name]"}
2. Address for Correspondence: ${data.applicantAddress || "[Postal Address]"}
3. Contact Details: ${data.applicantPhone || "[Phone / Email]"}
4. Particulars of Information Required:
   ${data.infoParticulars || "[Specify precisely the certified files, orders, or data sought]"}
5. Period for which information is sought: ${data.periodRequested || "[Date range]"}
6. Format of Information: Certified physical copy / inspection of records.
7. Application Fee: Attached herewith statutory fee of ₹10 via IPO / Court Fee Stamp / Online Receipt.
8. Citizenship: I hereby state that I am a Citizen of India.

Date: ${new Date().toLocaleDateString("en-IN")}
Place: ________________

_______________________
(${data.applicantName || "[Applicant Name]"})
Applicant`,
  },
  {
    id: "consumer-notice",
    title: "Consumer Dispute Notice for Defective Goods",
    statute: "Consumer Protection Act, 2019 — Section 35",
    authority: "District Consumer Disputes Redressal Commission",
    description: "Formal pre-litigation notice demanding refund or replacement for defective products or deficient services before approaching e-Daakhil.",
    fields: [
      { key: "consumerName", label: "Your Full Name", placeholder: "e.g. Amit Patel" },
      { key: "consumerAddress", label: "Your Address", placeholder: "City, State, PIN" },
      { key: "sellerName", label: "Seller / E-Commerce Entity", placeholder: "e.g. ABC Retail Pvt Ltd" },
      { key: "productName", label: "Product / Service Purchased", placeholder: "e.g. Smart TV Model XYZ" },
      { key: "invoiceNumber", label: "Invoice / Order Number", placeholder: "e.g. INV-2024-8891" },
      { key: "purchaseDate", label: "Date of Purchase", placeholder: "e.g. 10 August 2024" },
      { key: "defectDetails", label: "Specific Defect / Deficiency", placeholder: "Screen blacked out, service centre refused repair" },
      { key: "claimAmount", label: "Refund / Compensation Demanded (₹)", placeholder: "e.g. ₹32,000" },
    ],
    generate: (data) => `LEGAL NOTICE FOR DEFICIENT GOODS / SERVICES
(Under Consumer Protection Act, 2019)

Date: ${new Date().toLocaleDateString("en-IN")}

TO:
${data.sellerName || "[Seller / Manufacturer / Service Provider]"}
Registered Address: _________________________________________

FROM:
${data.consumerName || "[Your Full Name]"}
Address: ${data.consumerAddress || "[Your Address]"}

SUBJECT: NOTICE UNDER SECTION 35 OF CONSUMER PROTECTION ACT, 2019 IN RESPECT OF DEFECTIVE PRODUCT ${data.productName || "[Product]"} (INVOICE NO: ${data.invoiceNumber || "[Invoice]"})

Sir/Madam,

1. That I purchased ${data.productName || "[Product Name]"} on ${data.purchaseDate || "[Purchase Date]"} under invoice number ${data.invoiceNumber || "[Invoice Number]"} for valuable consideration.

2. That within the warranty period, the said product developed serious defects:
   "${data.defectDetails || "[Details of failure / deficiency]"}"

3. That despite bringing the defect to your notice, your establishment has failed to repair, replace, or refund the amount, constituting "deficiency in service" and "unfair trade practice" under Sections 2(11) and 2(47) of the Act.

4. YOU ARE HEREBY CALLED UPON to refund the purchase amount of ${data.claimAmount || "₹[Amount]"} along with damages within 15 days, failing which an online complaint will be registered before the District Consumer Commission via e-Daakhil.

Yours faithfully,

_______________________
(${data.consumerName || "[Your Name]"})`,
  },
];

export default function DocumentAssistant() {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [formData, setFormData] = useState({});
  const [copied, setCopied] = useState(false);

  const handleFieldChange = (key, val) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const generatedText = selectedTemplate.generate(formData);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    toast.success("Document copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`<pre style="font-family: monospace; white-space: pre-wrap; padding: 20px;">${generatedText}</pre>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold uppercase tracking-wider">
          <FileText className="w-3.5 h-3.5 text-amber-600" /> Statutory Legal Document Assistant
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Verified Legal Notice & Application Generator
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
          Draft official pre-litigation notices and statutory applications grounded in verified Indian legislation. Ready to print, sign, and deliver by Registered Post or official online portal.
        </p>
      </div>

      {/* Template Selector Pills */}
      <div className="flex flex-wrap gap-2.5">
        {TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => {
              setSelectedTemplate(tmpl);
              setFormData({});
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedTemplate.id === tmpl.id
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tmpl.title}
          </button>
        ))}
      </div>

      {/* Main Grid: Form Inputs (Left) and Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Input Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-1 pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">{selectedTemplate.title}</h2>
            <p className="text-xs text-amber-700 font-medium">{selectedTemplate.statute}</p>
            <p className="text-[11px] text-slate-500 pt-1">{selectedTemplate.description}</p>
          </div>

          <div className="space-y-4">
            {selectedTemplate.fields.map((f) => (
              <div key={f.key} className="space-y-1">
                <label className="text-xs font-bold text-slate-700">{f.label}</label>
                <input
                  type="text"
                  placeholder={f.placeholder}
                  value={formData[f.key] || ""}
                  onChange={(e) => handleFieldChange(f.key, e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Always dispatch formal legal notices via <strong>Speed Post with Acknowledgment Due (AD)</strong> or verified email to preserve statutory postal delivery receipts.
            </span>
          </div>
        </div>

        {/* Right: Live Preview & Action Bar */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" /> Live Document Preview
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Save PDF
              </button>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-[550px] overflow-y-auto">
            {generatedText}
          </div>
        </div>
      </div>
    </div>
  );
}
