/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Activity, Calendar, Heart, Shield, Sparkles, Plus, 
  Video, Eye, Check, TrendingUp, Users, Clock, PlusCircle, Trash2 
} from "lucide-react";

type ActiveTab = "patient" | "doctor" | "admin";

export default function PlatformDashboardPreview() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("patient");

  // Patient states
  const [meds, setMeds] = useState([
    { id: 1, name: "Lisinopril 10mg (BP control)", time: "09:00 AM", taken: true },
    { id: 2, name: "Vitamin D3 2000IU", time: "12:30 PM", taken: false },
    { id: 3, name: "Atorvastatin 20mg", time: "09:00 PM", taken: false },
  ]);

  // Doctor state
  const [selectedQueuePatient, setSelectedQueuePatient] = useState("Liam Chen");
  const [doctorNotes, setDoctorNotes] = useState(
    "Patient presenting post-exertional patellofemoral articulation discomfort with minor localized edema and stiffness."
  );
  const [translatedNotes, setTranslatedNotes] = useState(
    "Mild knee strain after jogging. No major ligament tearing. Recommend resting, putting ice on for 15 minutes, and wearing a compression sleeve."
  );

  const toggleMed = (id: number) => {
    setMeds(meds.map(m => m.id === id ? { ...m, taken: !m.taken } : m));
  };

  const handleTranslateNote = () => {
    // Simulating doctor note to plain-english translator
    setTranslatedNotes(
      "Loading plain language translation..."
    );
    setTimeout(() => {
      setTranslatedNotes(
        "Knee recovery update: Rest your knee, avoid heavy jogging, wear the support sleeve, and ice twice a day. Follow up in 2 weeks."
      );
    }, 1000);
  };

  return (
    <div className="space-y-6" id="platform-preview-component">
      {/* Switcher Tab Pills */}
      <div className="flex justify-center">
        <div className="bg-[#E9F8F1] p-1.5 rounded-2xl flex gap-1 border border-[#2E8B57]/10 shadow-inner">
          <button
            onClick={() => setActiveTab("patient")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "patient"
                ? "bg-[#2E8B57] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-[#E9F8F1]/60"
            }`}
            id="tab-btn-patient"
          >
            <User className="w-3.5 h-3.5" /> Patient Portal
          </button>
          <button
            onClick={() => setActiveTab("doctor")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "doctor"
                ? "bg-[#2E8B57] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-[#E9F8F1]/60"
            }`}
            id="tab-btn-doctor"
          >
            <Video className="w-3.5 h-3.5" /> Doctor Portal
          </button>
          <button
            onClick={() => setActiveTab("admin")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "admin"
                ? "bg-[#2E8B57] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-[#E9F8F1]/60"
            }`}
            id="tab-btn-admin"
          >
            <TrendingUp className="w-3.5 h-3.5" /> Admin Portal
          </button>
        </div>
      </div>

      {/* Frame with Soft Glass Backdrop Glows */}
      <div className="relative bg-[#FCFFFD]/80 backdrop-blur-md border border-[#E5E7EB] rounded-[24px] shadow-lg p-6 overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#5CC49A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#2E8B57]/5 rounded-full blur-3xl pointer-events-none" />

        <AnimatePresence mode="wait">
          
          {/* PATIENT PORTAL PREVIEW */}
          {activeTab === "patient" && (
            <motion.div
              key="patient"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
              id="patient-portal-mockup"
            >
              {/* Header block */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="text-xs font-medium text-[#2E8B57] flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Secure Health Record
                  </p>
                  <h4 className="text-lg font-bold text-gray-900 mt-1 font-sans tracking-tight">
                    Welcome back, Clara West
                  </h4>
                </div>
                <span className="text-[10px] bg-emerald-50 text-[#2E8B57] font-semibold border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <Shield className="w-3 h-3" /> Encrypted HIPAA Connection Active
                </span>
              </div>

              {/* Patient Core Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Upcoming consultation */}
                <div className="md:col-span-2 bg-white border border-[#E5E7EB] rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-[#2E8B57] uppercase bg-[#E9F8F1] px-2 py-0.5 rounded-md">
                        Upcoming Consultation
                      </span>
                      <h5 className="text-sm font-bold text-gray-900 mt-2">Cardiology Assessment Review</h5>
                      <p className="text-xs text-[#6B7280] mt-0.5">Dr. Sarah Jenkins • Metro Health Heart Institute</p>
                    </div>
                    <img 
                      src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150&h=150" 
                      alt="Dr. Sarah Jenkins" 
                      className="w-10 h-10 rounded-xl object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 py-3 border-y border-[#E5E7EB] text-center">
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#6B7280] font-medium uppercase">Date</p>
                      <strong className="text-xs text-gray-800">July 2, 2026</strong>
                    </div>
                    <div className="space-y-1 border-x border-[#E5E7EB]">
                      <p className="text-[10px] text-[#6B7280] font-medium uppercase">Time</p>
                      <strong className="text-xs text-gray-800">10:30 AM</strong>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#6B7280] font-medium uppercase">Format</p>
                      <strong className="text-xs text-[#2E8B57]">Video Room</strong>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button className="flex-grow py-2.5 bg-[#2E8B57] text-white rounded-xl text-xs font-bold hover:bg-[#2E8B57]/90 flex items-center justify-center gap-1.5 shadow-sm shadow-[#2E8B57]/15">
                      <Video className="w-3.5 h-3.5" /> Enter Virtual Consultation Room
                    </button>
                    <button className="px-4 py-2.5 bg-[#FCFFFD] hover:bg-[#E9F8F1]/40 text-gray-700 rounded-xl text-xs font-bold border border-[#E5E7EB] transition-all">
                      Reschedule
                    </button>
                  </div>
                </div>

                {/* Interactive Medication Reminders */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black uppercase text-gray-700 tracking-wider">Today's Reminders</h5>
                    <span className="text-[10px] text-[#2E8B57] font-semibold bg-[#E9F8F1] px-1.5 py-0.5 rounded-md">
                      {meds.filter(m => m.taken).length}/{meds.length} Done
                    </span>
                  </div>

                  <div className="space-y-2.5" id="patient-med-list">
                    {meds.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => toggleMed(m.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          m.taken
                            ? "bg-[#E9F8F1]/30 border-emerald-200 opacity-75"
                            : "bg-[#FCFFFD] border-[#E5E7EB] hover:border-[#2E8B57]/30"
                        }`}
                        id={`patient-med-row-${m.id}`}
                      >
                        <div className="min-w-0 pr-2">
                          <h6 className={`text-xs font-bold text-gray-900 truncate ${m.taken ? "line-through text-gray-400" : ""}`}>
                            {m.name}
                          </h6>
                          <span className="text-[9px] text-[#6B7280] font-medium">{m.time}</span>
                        </div>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          m.taken
                            ? "bg-[#2E8B57] border-[#2E8B57] text-white"
                            : "border-gray-300 bg-white"
                        }`}>
                          {m.taken && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-gray-400 leading-normal text-center">
                    Check or uncheck medications to log daily care compliance.
                  </p>
                </div>
              </div>

              {/* Vitals Row & SVG Chart */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Vitals Cards */}
                <div className="md:col-span-1 bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3.5 flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center border border-red-100">
                      <Heart className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <span className="text-[9px] text-[#6B7280] font-bold uppercase">Resting Pulse</span>
                      <p className="text-sm font-black text-gray-900 leading-none mt-1">72 BPM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 border-t border-[#E5E7EB] pt-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] text-[#6B7280] font-bold uppercase">Blood Pressure</span>
                      <p className="text-sm font-black text-gray-900 leading-none mt-1">118/74 mmHg</p>
                    </div>
                  </div>
                </div>

                {/* Vitals Chart */}
                <div className="md:col-span-3 bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Heart Rate Stability Log</h5>
                    <span className="text-[10px] text-gray-400 font-semibold">Past 7 Days</span>
                  </div>

                  {/* Clean SVG Line Chart */}
                  <div className="h-20 w-full relative">
                    <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                      {/* Grid lines */}
                      <line x1="0" y1="20" x2="400" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="50" x2="400" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="80" x2="400" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                      
                      {/* Gradient Fill under line */}
                      <defs>
                        <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2E8B57" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#2E8B57" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path 
                        d="M 0,80 L 0,60 L 66,70 L 132,55 L 198,65 L 264,45 L 330,50 L 400,38 L 400,100 L 0,100 Z" 
                        fill="url(#chart-glow)" 
                      />

                      {/* Spark line */}
                      <path 
                        d="M 0,60 L 66,70 L 132,55 L 198,65 L 264,45 L 330,50 L 400,38" 
                        fill="none" 
                        stroke="#2E8B57" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                      />

                      {/* Data Dots */}
                      <circle cx="66" cy="70" r="4" fill="#2E8B57" stroke="#FFFFFF" strokeWidth="1.5" />
                      <circle cx="132" cy="55" r="4" fill="#2E8B57" stroke="#FFFFFF" strokeWidth="1.5" />
                      <circle cx="264" cy="45" r="4" fill="#2E8B57" stroke="#FFFFFF" strokeWidth="1.5" />
                      <circle cx="400" cy="38" r="4.5" fill="#5CC49A" stroke="#FFFFFF" strokeWidth="2" />
                    </svg>
                    
                    {/* Floating Tooltip */}
                    <div className="absolute right-4 top-2 bg-gray-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                      Current: 68 bpm (Excellent)
                    </div>
                  </div>

                  <div className="flex justify-between text-[9px] text-[#6B7280] font-semibold font-mono">
                    <span>Jun 24</span>
                    <span>Jun 26</span>
                    <span>Jun 28</span>
                    <span>Jun 30 (Today)</span>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {/* DOCTOR PORTAL PREVIEW */}
          {activeTab === "doctor" && (
            <motion.div
              key="doctor"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
              id="doctor-portal-mockup"
            >
              {/* Header block */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="text-xs font-medium text-[#2E8B57] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> AI Clinician Copilot Active
                  </p>
                  <h4 className="text-lg font-bold text-gray-900 mt-1 font-sans tracking-tight">
                    Dr. Jenkins' Consultation Desk
                  </h4>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] bg-emerald-50 text-[#2E8B57] font-semibold border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    ● Clinical Network Connected
                  </span>
                </div>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Patient Queue selection */}
                <div className="md:col-span-1 bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-4">
                  <h5 className="text-xs font-black uppercase text-gray-700 tracking-wider">Consultation Queue (Today)</h5>
                  <div className="space-y-2">
                    {[
                      { name: "Liam Chen", specialty: "Orthopedics", time: "09:00 AM", finished: true },
                      { name: "Clara West", specialty: "Cardiology", time: "10:30 AM", active: true },
                      { name: "Marcus Rostova", specialty: "Neurology", time: "01:15 PM", active: false }
                    ].map((p, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedQueuePatient(p.name)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          selectedQueuePatient === p.name
                            ? "bg-[#E9F8F1]/40 border-[#2E8B57] ring-1 ring-[#2E8B57]"
                            : "bg-[#FCFFFD] border-[#E5E7EB] hover:bg-gray-50"
                        }`}
                        id={`queue-patient-${p.name.replace(/\s+/g, '-')}`}
                      >
                        <div>
                          <h6 className="text-xs font-bold text-gray-900">{p.name}</h6>
                          <p className="text-[9px] text-gray-400 mt-0.5">{p.specialty} • {p.time}</p>
                        </div>
                        {p.finished ? (
                          <span className="text-[9px] bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded border border-emerald-100">
                            Completed
                          </span>
                        ) : p.active ? (
                          <span className="text-[9px] bg-red-50 text-red-500 font-bold px-1.5 py-0.5 rounded border border-red-100 animate-pulse">
                            Active Desk
                          </span>
                        ) : (
                          <span className="text-[9px] bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded">
                            Pending
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Translator Note Pad */}
                <div className="md:col-span-2 bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black uppercase text-gray-700 tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#2E8B57]" /> Medical Translation Studio
                    </h5>
                    <button 
                      onClick={handleTranslateNote}
                      className="text-[10px] font-semibold text-[#2E8B57] bg-[#E9F8F1] px-2.5 py-1.5 rounded-xl hover:bg-[#E9F8F1]/80 transition-all border border-[#2E8B57]/10 flex items-center gap-1"
                      id="translate-btn"
                    >
                      <Sparkles className="w-3 h-3" /> Re-Translate Notes
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Doctor's Technical Notes Input */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider block">Doctor Clinical Input:</span>
                      <textarea
                        className="w-full h-36 p-3.5 text-xs border border-[#E5E7EB] rounded-xl bg-[#FCFFFD] font-mono focus:outline-none focus:ring-1 focus:ring-[#2E8B57]"
                        value={doctorNotes}
                        onChange={(e) => setDoctorNotes(e.target.value)}
                        id="doctor-notes-textarea"
                      />
                    </div>

                    {/* Patient plain language output */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-[#2E8B57] font-bold uppercase tracking-wider block">Patient Friendly Translation:</span>
                      <div className="w-full h-36 p-3.5 text-xs border border-emerald-100 rounded-xl bg-emerald-50/15 leading-relaxed overflow-y-auto" id="plain-language-translation">
                        {translatedNotes}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                    <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200">
                      Print Prescription
                    </button>
                    <button className="px-4 py-2 bg-[#2E8B57] text-white rounded-xl text-xs font-bold hover:bg-[#2E8B57]/90 shadow-sm">
                      Send Summary to Patient
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* ADMIN PORTAL PREVIEW */}
          {activeTab === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
              id="admin-portal-mockup"
            >
              {/* Header block */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="text-xs font-medium text-[#2E8B57]">CareBridge Central Admin Console</p>
                  <h4 className="text-lg font-bold text-gray-900 mt-1 font-sans tracking-tight">
                    Multi-Clinic Healthcare Network Analytics
                  </h4>
                </div>
                <span className="text-[10px] bg-gray-100 text-gray-600 font-semibold border border-gray-200 px-2.5 py-1 rounded-full">
                  Update Interval: Realtime Sync
                </span>
              </div>

              {/* KPI Mini Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="admin-kpis">
                {[
                  { title: "Total Bookings", value: "25,410", growth: "+14.8%", color: "text-[#2E8B57]" },
                  { title: "Active Licenses", value: "824 Clinic Drs", growth: "+6.1%", color: "text-blue-600" },
                  { title: "Platform Clinics", value: "154 Clinics", growth: "+8.2%", color: "text-indigo-600" },
                  { title: "Care Rating", value: "98.2%", growth: "WCAG AA OK", color: "text-emerald-600" }
                ].map((kpi, idx) => (
                  <div key={idx} className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-1 shadow-sm">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{kpi.title}</p>
                    <div className="flex justify-between items-baseline pt-1">
                      <strong className={`text-base font-black ${kpi.color}`}>{kpi.value}</strong>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">
                        {kpi.growth}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Admin Platform Analytics Graph mockup */}
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="text-xs font-black uppercase text-gray-700 tracking-wider">Clinical Booking Trend Matrix</h5>
                  <div className="flex gap-2">
                    <span className="text-[9px] font-semibold text-gray-500 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#2E8B57]" /> AI Pre-screened
                    </span>
                    <span className="text-[9px] font-semibold text-gray-500 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" /> Direct Bookings
                    </span>
                  </div>
                </div>

                {/* SVG Bar Chart */}
                <div className="h-28 w-full relative pt-2">
                  <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                    {/* Horizontal grid bars */}
                    <line x1="0" y1="20" x2="500" y2="20" stroke="#f8fafc" strokeWidth="1" />
                    <line x1="0" y1="50" x2="500" y2="50" stroke="#f8fafc" strokeWidth="1" />
                    <line x1="0" y1="80" x2="500" y2="80" stroke="#f8fafc" strokeWidth="1" />

                    {/* Bars grouping */}
                    {[
                      { x: 30, h1: 40, h2: 30, label: "Jan" },
                      { x: 100, h1: 55, h2: 35, label: "Feb" },
                      { x: 170, h1: 70, h2: 50, label: "Mar" },
                      { x: 240, h1: 60, h2: 40, label: "Apr" },
                      { x: 310, h1: 85, h2: 65, label: "May" },
                      { x: 380, h1: 95, h2: 80, label: "Jun" }
                    ].map((bar, i) => (
                      <g key={i}>
                        {/* Bar 1 (AI Pre-screened) */}
                        <rect 
                          x={bar.x} 
                          y={100 - bar.h1} 
                          width="14" 
                          height={bar.h1} 
                          fill="#2E8B57" 
                          rx="4" 
                        />
                        {/* Bar 2 (Direct Bookings) */}
                        <rect 
                          x={bar.x + 18} 
                          y={100 - bar.h2} 
                          width="14" 
                          height={bar.h2} 
                          fill="#3b82f6" 
                          rx="4" 
                        />
                      </g>
                    ))}
                  </svg>
                </div>

                <div className="flex justify-between px-8 text-[9px] text-[#6B7280] font-semibold font-mono">
                  <span>January</span>
                  <span>February</span>
                  <span>March</span>
                  <span>April</span>
                  <span>May</span>
                  <span>June (Peak)</span>
                </div>
              </div>

            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
}
