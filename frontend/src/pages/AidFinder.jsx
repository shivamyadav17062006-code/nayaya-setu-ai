import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  HeartHandshake,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Search,
  ExternalLink,
  PhoneCall,
  Building,
  CheckCircle2,
  Navigation,
  Clock,
  Lock,
  Compass,
  AlertCircle
} from "lucide-react";
import { aidApi } from "@/api/aid";
import { INDIAN_STATES } from "@/types";

const PROVIDER_TYPES = [
  { value: "ALL", label: "All Authorities" },
  { value: "NALSA", label: "National (NALSA)" },
  { value: "SCLSC", label: "Supreme Court Committee" },
  { value: "SLSA", label: "State Legal Services" },
  { value: "DLSA", label: "District Authorities" },
];

export default function AidFinder() {
  const [searchParams] = useSearchParams();
  const initialParamState = searchParams.get("state") || "";

  const [providers, setProviders] = useState([]);
  const [selectedState, setSelectedState] = useState(initialParamState);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [districts, setDistricts] = useState([]);
  const [providerType, setProviderType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Safety modal for external government links
  const [safetyModalUrl, setSafetyModalUrl] = useState(null);
  const [safetyModalTitle, setSafetyModalTitle] = useState("");

  // 1. Fetch available districts whenever state changes
  useEffect(() => {
    async function fetchDistricts() {
      if (!selectedState) {
        setDistricts([]);
        setSelectedDistrict("");
        return;
      }
      try {
        const districtList = await aidApi.getDistricts(selectedState);
        setDistricts(districtList);
        setSelectedDistrict("");
      } catch {
        setDistricts([]);
      }
    }
    fetchDistricts();
  }, [selectedState]);

  // 2. Fetch providers with filters
  useEffect(() => {
    let isMounted = true;
    async function fetchProviders() {
      setIsLoading(true);
      try {
        const data = await aidApi.getProviders({
          state: selectedState || undefined,
          district: selectedDistrict || undefined,
          type: providerType !== "ALL" ? providerType : undefined,
          search: searchQuery || undefined,
        });
        if (isMounted) {
          setProviders(data);
        }
      } catch (err) {
        console.error("Failed to fetch legal aid providers:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchProviders();
    return () => {
      isMounted = false;
    };
  }, [selectedState, selectedDistrict, providerType, searchQuery]);

  // Safe external navigation prompt
  const openExternalSafely = (url, title) => {
    setSafetyModalUrl(url);
    setSafetyModalTitle(title || "Official Government Portal");
  };

  const confirmNavigation = () => {
    if (safetyModalUrl) {
      window.open(safetyModalUrl, "_blank", "noopener,noreferrer");
      setSafetyModalUrl(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
            <HeartHandshake className="w-3.5 h-3.5" /> Official Legal Aid Directory
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Free Legal Services Authorities Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Find official National, State, and District Legal Services Authorities across India.
            Access free advocates, Lok Adalat dispute settlement, and walk-in legal clinics.
          </p>
        </div>

        {/* Quick Link to Eligibility Checker */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Link
            to="/eligibility"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <ShieldCheck className="w-4 h-4" /> Check NALSA Eligibility
          </Link>
          <a
            href="tel:15100"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <PhoneCall className="w-4 h-4 text-amber-400" /> Helpline: 15100
          </a>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by court, city, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* State Filter (Manual selection - NO forced geolocation!) */}
          <div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full py-2.5 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All States / UTs</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* District Filter (Dynamic based on selected state) */}
          <div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedState || districts.length === 0}
              className="w-full py-2.5 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              <option value="">{selectedState ? "All Districts" : "Select State First"}</option>
              {districts.map((dst) => (
                <option key={dst} value={dst}>
                  {dst}
                </option>
              ))}
            </select>
          </div>

          {/* Provider Type Filter */}
          <div>
            <select
              value={providerType}
              onChange={(e) => setProviderType(e.target.value)}
              className="w-full py-2.5 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {PROVIDER_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {pt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary & Reset */}
        {(selectedState || selectedDistrict || providerType !== "ALL" || searchQuery) && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>
              Showing {providers.length} provider{providers.length !== 1 ? "s" : ""} matching your filters
            </span>
            <button
              onClick={() => {
                setSelectedState("");
                setSelectedDistrict("");
                setProviderType("ALL");
                setSearchQuery("");
              }}
              className="text-emerald-700 hover:text-emerald-800 font-semibold text-xs"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Directory Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          Loading official legal aid authorities...
        </div>
      ) : providers.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto shadow-xs">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Building className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Legal Aid Offices Found</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No matching records found for the selected state/district filter. Every district court complex
              in India has a functioning DLSA Front Office.
            </p>
          </div>
          <div className="pt-2">
            <a
              href="tel:15100"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <PhoneCall className="w-4 h-4 text-amber-400" /> Call NALSA National Helpline 15100
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((p) => {
            const hasCoords = p.latitude !== null && p.longitude !== null && !isNaN(p.latitude);
            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                      {p.type}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Official Authority
                    </span>
                  </div>

                  {/* Title & Jurisdiction */}
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-slate-900 leading-snug">
                      {p.name}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        {p.district ? `${p.district}, ` : ""}
                        {p.state}
                      </span>
                    </div>
                  </div>

                  {/* Address */}
                  {p.address && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                      {p.address}
                    </p>
                  )}

                  {/* Verified Coordinates (Only if verified - no invented coords!) */}
                  {hasCoords && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                      <span className="flex items-center gap-1 text-emerald-800 font-medium">
                        <Navigation className="w-3 h-3" /> Verified Coordinates: {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                      </span>
                      <a
                        href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-0.5"
                      >
                        Map <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}

                  {/* Eligibility summary */}
                  {p.eligibility && (
                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <span className="font-bold text-slate-700 block">Eligibility:</span>
                      <p className="line-clamp-2">{p.eligibility}</p>
                    </div>
                  )}

                  {/* Services tags */}
                  {p.services && p.services.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {p.services.slice(0, 3).map((srv, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium"
                        >
                          {srv}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Actions: Call, Helpline, Email, Website */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {p.phone && p.phone.length > 0 && (
                      <a
                        href={`tel:${p.phone[0]}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-600" />
                        {p.phone[0]}
                      </a>
                    )}

                    {p.helpline && (
                      <a
                        href={`tel:${p.helpline}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold rounded-lg transition-colors"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-amber-700" />
                        Helpline: {p.helpline}
                      </a>
                    )}

                    {p.email && (
                      <a
                        href={`mailto:${p.email}`}
                        className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                        title={`Email: ${p.email}`}
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {p.website && (
                    <div className="pt-1">
                      <button
                        onClick={() => openExternalSafely(p.website, `${p.name} Official Website`)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                      >
                        Official Government Website <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* External Portal Safety Interstitial Modal */}
      {safetyModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  External Official Portal Notice
                </h3>
                <span className="text-xs text-slate-500 font-medium">{safetyModalTitle}</span>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 space-y-2">
              <p>
                You are about to navigate to an official Legal Services Authority electronic portal:
              </p>
              <div className="font-mono text-[11px] bg-white p-2 rounded border border-amber-200 break-all text-slate-700">
                {safetyModalUrl}
              </div>
              <p className="text-[11px] text-amber-800 leading-normal">
                <strong>Statutory Notice:</strong> NyayaSaathi does not file legal aid applications or collect
                official credentials on your behalf. You will directly apply or access resources on the designated official server.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSafetyModalUrl(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Stay on Directory
              </button>
              <button
                onClick={confirmNavigation}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
              >
                Proceed to Official Portal <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
