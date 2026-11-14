import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  ShieldAlert,
  Baby,
  ShoppingBag,
  Scale,
  Gavel,
  Accessibility,
  HeartHandshake,
  Home,
  Trees,
  Search,
  ArrowRight,
  Filter
} from "lucide-react";
import { rightsApi } from "@/api/rights";
const CATEGORY_ICONS = {
  labour: Briefcase,
  women: ShieldAlert,
  children: Baby,
  consumer: ShoppingBag,
  constitutional: Scale,
  criminal: Gavel,
  disability: Accessibility,
  "senior-citizens": HeartHandshake,
  property: Home,
  tribal: Trees
};
export default function Rights() {
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBeneficiary, setSelectedBeneficiary] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await rightsApi.getCategories();
        setCategories(data);
      } catch {
        setCategories([
          { id: "1", slug: "labour", name: "Labour & Employment Rights", description: "Wages, overtime, safety standards, and wrongful termination safeguards.", icon: "Briefcase", color: "amber", sectionCount: 14, beneficiaryTypes: ["Workers", "Daily Wagers"] },
          { id: "2", slug: "women", name: "Women's Statutory Protections", description: "Domestic violence remedies, POSH workplace safety, and maintenance rights.", icon: "ShieldAlert", color: "rose", sectionCount: 18, beneficiaryTypes: ["Women", "Mothers"] },
          { id: "3", slug: "children", name: "Child Rights & Education", description: "Right to Education (RTE), prohibition of hazardous child labour, and POCSO laws.", icon: "Baby", color: "blue", sectionCount: 12, beneficiaryTypes: ["Children", "Students"] },
          { id: "4", slug: "consumer", name: "Consumer Grievance Redressal", description: "Remedies for defective products, false advertisements, and e-commerce frauds.", icon: "ShoppingBag", color: "emerald", sectionCount: 16, beneficiaryTypes: ["Consumers", "Buyers"] },
          { id: "5", slug: "constitutional", name: "Constitutional Fundamental Rights", description: "Article 14 equality, Article 21 right to life, freedom of speech, and Article 32 writs.", icon: "Scale", color: "purple", sectionCount: 22, beneficiaryTypes: ["All Citizens"] },
          { id: "6", slug: "criminal", name: "Criminal Procedure & Arrest Rights", description: "Rights upon arrest, 24-hr magistrate production, bail basics under BNSS & BNS.", icon: "Gavel", color: "slate", sectionCount: 20, beneficiaryTypes: ["Citizens", "Accused"] },
          { id: "7", slug: "disability", name: "Disability Rights & Equality", description: "Accessibility mandates, non-discrimination in jobs, and RPwD Act quotas.", icon: "Accessibility", color: "teal", sectionCount: 9, beneficiaryTypes: ["Disabled"] },
          { id: "8", slug: "senior-citizens", name: "Senior Citizens & Maintenance", description: "Right to financial maintenance from adult children and eviction of abusive relatives.", icon: "HeartHandshake", color: "orange", sectionCount: 8, beneficiaryTypes: ["Seniors"] },
          { id: "9", slug: "property", name: "Property, Tenancy & Land", description: "Tenant protections against illegal eviction, rent agreements, and inheritance.", icon: "Home", color: "cyan", sectionCount: 11, beneficiaryTypes: ["Tenants", "Owners"] },
          { id: "10", slug: "tribal", name: "Tribal & Forest Rights", description: "Forest Rights Act (FRA), PESA gram sabha consent, and traditional land entitlements.", icon: "Trees", color: "green", sectionCount: 7, beneficiaryTypes: ["ST Communities"] }
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCategories();
  }, []);
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || cat.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBeneficiary = selectedBeneficiary === "ALL" || cat.beneficiaryTypes && cat.beneficiaryTypes.some((b) => b.toLowerCase().includes(selectedBeneficiary.toLowerCase()));
    return matchesSearch && matchesBeneficiary;
  });
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">{
    /* Header */
  }<div className="space-y-3 max-w-3xl"><div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider"><Scale className="w-3.5 h-3.5" /> Structured Legal Knowledge Graph
        </div><h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Know Your Rights Library
        </h1><p className="text-sm sm:text-base text-slate-600">
          Indian statutes categorized by legal subject and beneficiary group. Understand original legal provisions side-by-side with verified plain-language summaries.
        </p></div>{
    /* Search and Filters */
  }<div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"><div className="relative w-full sm:w-96"><Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" /><input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Search rights (e.g. salary, domestic violence, bail)..."
    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
  /></div><div className="flex items-center gap-2 w-full sm:w-auto"><Filter className="w-4 h-4 text-slate-400" /><span className="text-xs font-medium text-slate-500 whitespace-nowrap">Filter by Person:</span><select
    value={selectedBeneficiary}
    onChange={(e) => setSelectedBeneficiary(e.target.value)}
    className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
  ><option value="ALL">All Beneficiaries</option><option value="Workers">Workers & Daily Labourers</option><option value="Women">Women</option><option value="Children">Children</option><option value="Consumers">Consumers</option><option value="Seniors">Senior Citizens</option><option value="Disabled">Persons with Disability</option><option value="ST">Tribal / ST Communities</option></select></div></div>{
    /* Categories Grid */
  }<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredCategories.map((cat) => {
    const Icon = CATEGORY_ICONS[cat.slug] || Scale;
    return <Link
      key={cat.id || cat.slug}
      to={`/rights/${cat.slug}`}
      className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 flex flex-col justify-between"
    ><div className="space-y-4"><div className="flex items-center justify-between"><div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors shadow-sm"><Icon className="w-6 h-6" /></div><span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{cat.sectionCount} Sections
                  </span></div><div className="space-y-1.5"><h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{cat.name}</h3><p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{cat.description}</p></div>{cat.beneficiaryTypes && <div className="flex flex-wrap gap-1 pt-1">{cat.beneficiaryTypes.map((ben, idx) => <span
      key={idx}
      className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
    >{ben}</span>)}</div>}</div><div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-600"><span>View Legal Provisions</span><ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></div></Link>;
  })}</div></div>;
}
