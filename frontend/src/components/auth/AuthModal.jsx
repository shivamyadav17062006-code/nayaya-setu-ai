import { useState } from "react";
import { X, Lock, Mail, Phone, User, CheckCircle2, AlertCircle, Scale } from "lucide-react";
import { authApi } from "@/api/auth";

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [identifierType, setIdentifierType] = useState("email"); // "email" | "phone"
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    name: "",
    state: "Delhi",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isRegister) {
        const payload = {
          email: identifierType === "email" ? formData.email : undefined,
          phone: identifierType === "phone" ? formData.phone : undefined,
          password: formData.password,
          name: formData.name || undefined,
          state: formData.state || undefined,
        };
        const res = await authApi.register(payload);
        setSuccessMsg("Account registered successfully!");
        setTimeout(() => {
          onAuthSuccess(res.user);
          onClose();
        }, 800);
      } else {
        const payload = {
          email: identifierType === "email" ? formData.email : undefined,
          phone: identifierType === "phone" ? formData.phone : undefined,
          password: formData.password,
        };
        const res = await authApi.login(payload);
        setSuccessMsg("Logged in successfully!");
        setTimeout(() => {
          onAuthSuccess(res.user);
          onClose();
        }, 800);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Authentication failed. Please check your credentials.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                {isRegister ? "Create Citizen Account" : "Sign In to NyayaSaathi"}
              </h3>
              <p className="text-xs text-amber-100">
                {isRegister ? "Secure access to persistent legal sessions" : "Welcome back to your rights companion"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Identifier Toggle */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setIdentifierType("email")}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                identifierType === "email" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              Email Address
            </button>
            <button
              type="button"
              onClick={() => setIdentifierType("phone")}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                identifierType === "phone" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              Mobile Number
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            {identifierType === "email" ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="citizen@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone (10 digits)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password {isRegister && <span className="text-slate-400 font-normal">(min 8 chars, letters & numbers)</span>}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50 mt-2"
            >
              {isLoading ? "Verifying..." : isRegister ? "Create Free Account" : "Sign In"}
            </button>
          </form>

          {/* Switch Register/Login */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
            {isRegister ? (
              <span>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setError(null); }}
                  className="text-amber-600 font-semibold hover:underline"
                >
                  Sign in
                </button>
              </span>
            ) : (
              <span>
                New to NyayaSaathi?{" "}
                <button
                  type="button"
                  onClick={() => { setIsRegister(true); setError(null); }}
                  className="text-amber-600 font-semibold hover:underline"
                >
                  Create citizen account
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
