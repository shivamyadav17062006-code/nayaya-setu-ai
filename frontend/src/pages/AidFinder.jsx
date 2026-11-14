import { useState, useEffect } from "react";
import {
  HeartHandshake,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Search,
  ExternalLink,
  PhoneCall
} from "lucide-react";
import { aidApi } from "@/api/aid";
import { INDIAN_STATES } from "@/types";
export default function AidFinder() {
  const [providers, setProviders] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [providerType, setProviderType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    async function fetchProviders() {
      try {
        const data = await aidApi.getProviders({
          state: selectedState || void 0,
          type: providerType !== "ALL" ? providerType : void 0
        });
        setProviders(data);
      } catch {
        setProviders([
          {
            id: "nalsa-hq",
            name: "National Legal Services Authority (NALSA)",
            type: "NALSA",
            state: "Delhi",
            district: "New Delhi",
            address: "B-Block, Additional Office Complex, Supreme Court of India, New Delhi - 110001",
            phone: ["15100", "011-23386176"],
            email: "nalsa-dla@nic.in",
            website: "https://nalsa.gov.in",
            servicesOffered: [
              "Free Court Representation (Supreme Court & High Courts)",
              "National Legal Helpline 15100 (24x7)",
              "National Lok Adalat settlements",
              "Prison Legal Aid Clinics"
            ],
            eligibilityCriteria: "Women, children, SC/ST, custody inmates, disabled, industrial workmen, and citizens with annual income below statutory limits.",
            languages: ["English", "Hindi", "Regional Languages"]
          },
          {
            id: "mslsa-mumbai",
            name: "Maharashtra State Legal Services Authority (MSLSA)",
            type: "SLSA",
            state: "Maharashtra",
            district: "Mumbai",
            address: "High Court PWD Building, Fort, Mumbai - 400032",
            phone: ["022-22691395", "022-22676750"],
            email: "mslsa-hc@nic.in",
            website: "https://legalservices.maharashtra.gov.in",
            servicesOffered: [
              "Panel advocate appointment in Bombay High Court & District Courts",
              "Pre-litigation conciliation & Lok Adalat",
              "Victim Compensation Scheme counseling"
            ],
            eligibilityCriteria: "Maharashtra residents with annual income up to \u20B93,00,000 (no income ceiling for women/children/SC/ST).",
            languages: ["Marathi", "Hindi", "English"]
          },
          {
            id: "dslsa-delhi",
            name: "Delhi State Legal Services Authority (DSLSA)",
            type: "SLSA",
            state: "Delhi",
            district: "Central",
            address: "Central Office, Patiala House Courts Complex, New Delhi - 110001",
            phone: ["1516", "011-23384781"],
            email: "dslsa-phc@nic.in",
            website: "https://dslsa.org",
            servicesOffered: [
              "Front Office Legal Advice Clinics",
              "Free Advocate allocation for all Delhi District Courts",
              "Special child support & maintenance counseling"
            ],
            eligibilityCriteria: "Income below \u20B93,00,000 per annum or belonging to affirmative categories under Section 12.",
            languages: ["Hindi", "English", "Punjabi", "Urdu"]
          },
          {
            id: "dlsa-pune",
            name: "District Legal Services Authority (DLSA) Pune",
            type: "DLSA",
            state: "Maharashtra",
            district: "Pune",
            address: "Shivajinagar District Court Compound, Pune - 411005",
            phone: ["020-25534977"],
            email: "dlsa.pune-mh@gov.in",
            website: "https://pune.dcourts.gov.in",
            servicesOffered: [
              "Free legal counseling on civil & criminal matters",
              "Family dispute mediation",
              "Free bail petition filing for undertrials"
            ],
            eligibilityCriteria: "Residents of Pune district under Section 12 criteria.",
            languages: ["Marathi", "Hindi", "English"]
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProviders();
  }, [selectedState, providerType]);
  const filteredProviders = providers.filter((p) => {
    const query = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(query) || p.state.toLowerCase().includes(query) || p.district && p.district.toLowerCase().includes(query) || p.servicesOffered.some((s) => s.toLowerCase().includes(query));
  });
  return <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">{
    /* Header Banner */
  }<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-200 pb-8"><div className="space-y-2"><div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold uppercase"><HeartHandshake className="w-3.5 h-3.5" /> Constitutional Legal Aid
          </div><h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Free Legal Aid Directory
          </h1><p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Locate your nearest District Legal Services Authority (DLSA), High Court Legal Services Committee, and frontline legal clinics established under the Legal Services Authorities Act, 1987.
          </p></div>{
    /* NALSA Helpline Card */
  }<div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg space-y-2 shrink-0"><span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
            National Legal Helpline (24x7)
          </span><a
    href="tel:15100"
    className="flex items-center gap-2 text-2xl font-black text-white hover:text-amber-400 transition-colors"
  ><PhoneCall className="w-6 h-6 text-emerald-400" />
            15100
          </a><p className="text-[11px] text-slate-400">Toll-free across all telecom networks in India</p></div></div>{
    /* Filter Toolbar */
  }<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">{
    /* Search */
  }<div className="relative"><Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" /><input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Search provider, city, or service..."
    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
  /></div>{
    /* State Filter */
  }<div><select
    value={selectedState}
    onChange={(e) => setSelectedState(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
  ><option value="">All States & Union Territories</option>{INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>{
    /* Provider Type Filter */
  }<div><select
    value={providerType}
    onChange={(e) => setProviderType(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
  ><option value="ALL">All Authority Levels</option><option value="NALSA">National Level (NALSA)</option><option value="SLSA">State Level (SLSA)</option><option value="DLSA">District Level (DLSA)</option></select></div></div>{
    /* NALSA Section 12 Callout */
  }<div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-900"><ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /><div className="space-y-1"><span className="font-bold">Who is entitled to 100% Free Legal Aid in India?</span><p className="text-emerald-800/90 leading-relaxed">
            Under <strong>Section 12 of the Legal Services Authorities Act, 1987</strong>: All women, children, persons with disabilities, members of SC/ST, victims of human trafficking or disaster, industrial workers, and persons in police/judicial custody receive completely free lawyers for any court proceedings, regardless of income.
          </p></div></div>{
    /* Results Grid */
  }{isLoading ? (
    <div className="py-16 text-center space-y-3">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs text-slate-500 font-medium">Loading verified legal aid providers...</p>
    </div>
  ) : filteredProviders.length === 0 ? (
    <div className="py-16 text-center space-y-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-8">
      <HeartHandshake className="w-10 h-10 text-slate-400 mx-auto" />
      <div>
        <h4 className="text-base font-bold text-slate-800">No legal aid authorities found for this filter</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Try selecting "All States" or clearing the search keyword. Every district in India has an operational DLSA.
        </p>
      </div>
      <a
        href="tel:15100"
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
      >
        <PhoneCall className="w-3.5 h-3.5 text-emerald-400" /> Dial NALSA Helpline 15100
      </a>
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {filteredProviders.map((provider) => (
        <div
          key={provider.id}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-all space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  {provider.type}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{provider.name}</h3>
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                {provider.state}
              </span>
            </div>
            {/* Address */}
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>{provider.address}</span>
            </div>
            {/* Contacts */}
            <div className="space-y-1 text-xs text-slate-600 pt-1">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <div className="flex gap-2">
                  {provider.phone.map((ph, idx) => (
                    <a key={idx} href={`tel:${ph}`} className="font-medium text-slate-800 hover:text-emerald-600">
                      {ph}
                    </a>
                  ))}
                </div>
              </div>
              {provider.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  <a href={`mailto:${provider.email}`} className="text-slate-600 hover:underline">
                    {provider.email}
                  </a>
                </div>
              )}
            </div>
            {/* Services List */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Free Services Provided:
              </span>
              <ul className="text-xs text-slate-700 space-y-1">
                {provider.servicesOffered.map((srv, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>{srv}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* Website Action */}
          {provider.website && (
            <div className="pt-3 border-t border-slate-100">
              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
              >
                Visit Official Authority Portal <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  )}
</div>;
}
