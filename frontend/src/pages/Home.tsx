import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Scale, 
  MessageSquare, 
  BookOpen, 
  Compass, 
  HeartHandshake, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Languages, 
  Sparkles, 
  PhoneCall,
  Users,
  FileText
} from 'lucide-react'

export default function Home() {
  const multilingualTaglines = [
    { text: "अपने अधिकारों को जानें, अपनी भाषा में।", lang: "Hindi" },
    { text: "உங்கள் உரிமைகளை உங்கள் மொழியில் அறியுங்கள்.", lang: "Tamil" },
    { text: "आपले हक्क जाणून घ्या, आपल्या भाषेत.", lang: "Marathi" },
    { text: "আপনার অধিকার জানুন, আপনার নিজের ভাষায়।", lang: "Bengali" },
    { text: "మీ హక్కులను మీ స్వంత భాషలో తెలుసుకోండి.", lang: "Telugu" },
    { text: "Know Your Rights. In Your Own Language.", lang: "English" },
  ]

  const [taglineIndex, setTaglineIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % multilingualTaglines.length)
    }, 3200)
    return () => clearInterval(timer)
  }, [multilingualTaglines.length])

  const modules = [
    {
      title: "AI Legal Assistant",
      description: "Ask legal questions in Hindi, English or regional languages. Get instant answers grounded in verified Indian statutes.",
      icon: MessageSquare,
      path: "/chat",
      badge: "Instant AI",
      color: "from-amber-500 to-amber-600",
    },
    {
      title: "Know Your Rights Library",
      description: "Explore simplified explanations of labour laws, women's protections, consumer remedies, and constitutional guarantees.",
      icon: BookOpen,
      path: "/rights",
      badge: "Verified Laws",
      color: "from-blue-600 to-indigo-600",
    },
    {
      title: "Legal Action Navigator",
      description: "Step-by-step grievance workflows for unpaid wages, domestic disputes, consumer frauds, and police reports.",
      icon: Compass,
      path: "/navigator",
      badge: "Step-by-Step",
      color: "from-emerald-600 to-teal-600",
    },
    {
      title: "Legal Aid Finder",
      description: "Locate your nearest District Legal Services Authority (DLSA), High Court Legal Aid Committee, and NALSA clinics.",
      icon: HeartHandshake,
      path: "/aid-finder",
      badge: "Free Legal Aid",
      color: "from-purple-600 to-pink-600",
    },
    {
      title: "Document & Eligibility Engine",
      description: "Check if you qualify for free court representation under Section 12 of the Legal Services Authorities Act.",
      icon: CheckCircle2,
      path: "/eligibility",
      badge: "NALSA Sec 12",
      color: "from-rose-500 to-red-600",
    },
  ]

  const sampleQuestions = [
    "Mere employer ne 3 mahine se salary nahi di. Main kya kar sakta hoon?",
    "Can a landlord evict a tenant without prior notice in Maharashtra?",
    "What are my legal rights if an e-commerce platform sends a defective phone?",
    "How does a woman obtain an emergency protection order against domestic abuse?",
    "Am I eligible for free lawyer representation in court under NALSA?",
  ]

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/60 via-white to-slate-50 pt-16 pb-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/80 border border-amber-200 text-amber-900 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            AI-Powered Legal Awareness Framework · India
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            One Platform. Every Citizen.{' '}
            <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-emerald-600 bg-clip-text text-transparent">
              Every Right.
            </span>
          </h1>

          {/* Animated Multilingual Tagline */}
          <div className="h-10 flex items-center justify-center">
            <p className="text-xl sm:text-2xl font-medium text-slate-700 transition-all duration-500 ease-in-out">
              {multilingualTaglines[taglineIndex].text}
            </p>
          </div>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            NyayaSaathi empowers ordinary Indian citizens to understand their statutory rights, recognize legal violations, and navigate official grievance redressals without intimidating jargon.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/chat"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-900/10 transition-all hover:-translate-y-0.5"
            >
              <MessageSquare className="w-5 h-5 text-amber-400" />
              Ask Legal Assistant
            </Link>
            <Link
              to="/rights"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <BookOpen className="w-5 h-5 text-slate-500" />
              Browse Rights Catalog
            </Link>
          </div>

          {/* Trust badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> India Code Verified Statutes</span>
            <span className="flex items-center gap-1.5"><Languages className="w-4 h-4 text-blue-600" /> 22 Official Scheduled Languages</span>
            <span className="flex items-center gap-1.5"><HeartHandshake className="w-4 h-4 text-purple-600" /> NALSA Section 12 Grounded</span>
          </div>
        </div>
      </section>

      {/* Interactive Query Prompt Bar */}
      <section className="max-w-4xl mx-auto px-4 -mt-10">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
              <Sparkles className="w-4 h-4 text-amber-500" /> Common citizen questions:
            </span>
            <span>Tap to try in Assistant</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((q, idx) => (
              <Link
                key={idx}
                to={`/chat?q=${encodeURIComponent(q)}`}
                className="text-xs bg-slate-50 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 border border-slate-200 text-slate-700 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>{q}</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-amber-600" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5 Core Modules Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Five Pillars of Legal Empowerment</h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
            Engineered specifically to solve the six core friction points Indian citizens face when seeking justice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((m, idx) => {
            const Icon = m.icon
            return (
              <Link
                key={idx}
                to={m.path}
                className="group relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${m.color} flex items-center justify-center text-white shadow-md`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      {m.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {m.description}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-amber-600 group-hover:gap-2 transition-all">
                  <span>Explore module</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* The Indian Citizen Problem Matrix */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Bridging the Legal Awareness Divide</h2>
            <p className="text-slate-400 text-xs sm:text-sm">How NyayaSaathi translates statutory complexity into actionable citizen outcomes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700 space-y-2">
              <span className="text-amber-400 text-xs font-bold uppercase">Problem 1</span>
              <h4 className="font-semibold text-sm">"I don't understand legal language"</h4>
              <p className="text-xs text-slate-300">
                NyayaSaathi decouples the original legal statute from AI-generated simplified explanations, preserving source fidelity while ensuring 5th-grade reading ease.
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700 space-y-2">
              <span className="text-emerald-400 text-xs font-bold uppercase">Problem 2</span>
              <h4 className="font-semibold text-sm">"I don't know where to complain"</h4>
              <p className="text-xs text-slate-300">
                The Action Navigator maps each violation directly to the competent statutory authority—Labour Commissioner, Consumer Forum, Magistrate, or Cybercell.
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700 space-y-2">
              <span className="text-purple-400 text-xs font-bold uppercase">Problem 3</span>
              <h4 className="font-semibold text-sm">"I cannot afford a private lawyer"</h4>
              <p className="text-xs text-slate-300">
                Under Section 12 of the Legal Services Authorities Act, over 70% of Indians qualify for 100% free court representation. NyayaSaathi identifies and links them directly to DLSAs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency & Free Legal Helpline Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">
              <PhoneCall className="w-3.5 h-3.5" /> 24x7 Government Legal Helpline
            </div>
            <h3 className="text-2xl font-bold">Need Immediate Free Legal Assistance?</h3>
            <p className="text-xs sm:text-sm text-white/90 max-w-xl">
              Dial <strong>15100</strong> to reach the National Legal Services Authority (NALSA) for toll-free counseling and court lawyer appointment.
            </p>
          </div>
          <a
            href="tel:15100"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-900 font-bold text-sm shadow-md hover:bg-slate-50 transition-colors"
          >
            <PhoneCall className="w-4 h-4 text-emerald-600" />
            Dial 15100 (Toll Free)
          </a>
        </div>
      </section>
    </div>
  )
}
