/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from "react";
import { motion } from "motion/react";
import { 
  Sparkles, Stethoscope, Clock, Calendar, CheckCircle, Bell, ArrowRight, 
  ArrowUpRight, Star, Heart, Lock, Shield, Mail, Users, Building, HelpCircle,
  Activity, Video, Laptop, ShieldCheck, Check, Send, ChevronRight, Plus
} from "lucide-react";

import Navbar from "./components/Navbar";
import SymptomAnalyzer from "./components/SymptomAnalyzer";
import AppointmentScheduler from "./components/AppointmentScheduler";
import PlatformDashboardPreview from "./components/PlatformDashboardPreview";
import FAQAccordion from "./components/FAQAccordion";
import AuthModal, { AuthScreen, UserRole } from "./components/AuthModal";
import PatientPortal from "./components/PatientPortal";
import DoctorPortal from "./components/DoctorPortal";
import AdminPortal from "./components/AdminPortal";
import { TESTIMONIALS } from "./types";

// Image assets generated previously
const HERO_ILLUSTRATION_URL = "/src/assets/images/hero_doctor_patient_1782837949690.jpg";
const ECOSYSTEM_ILLUSTRATION_URL = "/src/assets/images/healthcare_ecosystem_1782837963312.jpg";

export default function App() {
  const [selectedSymptomSummary, setSelectedSymptomSummary] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [focusedFeature, setFocusedFeature] = useState<number | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPortalView, setIsPortalView] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("patient");

  const handleLogout = () => {
    localStorage.removeItem("carebridge_userId");
    localStorage.removeItem("carebridge_user");
    setIsLoggedIn(false);
    setIsPortalView(false);
  };

  useEffect(() => {
    // Check if redirect query has userId from Google OAuth callback!
    const queryParams = new URLSearchParams(window.location.search);
    const oauthUserId = queryParams.get("userId");
    const oauthUserRole = queryParams.get("role") as UserRole | null;
    const oauthSuccess = queryParams.get("oauthSuccess");

    if (oauthSuccess === "true" && oauthUserId) {
      localStorage.setItem("carebridge_userId", oauthUserId);
      if (oauthUserRole) {
        localStorage.setItem("carebridge_user", JSON.stringify({ _id: oauthUserId, role: oauthUserRole }));
        setIsLoggedIn(true);
        setUserRole(oauthUserRole);
        setIsPortalView(true);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const userId = localStorage.getItem("carebridge_userId");
    const userStr = localStorage.getItem("carebridge_user");
    if (userId && userStr) {
      try {
        const cachedUser = JSON.parse(userStr);
        setIsLoggedIn(true);
        setUserRole(cachedUser.role || "patient");
        setIsPortalView(true);
      } catch (err) {
        console.error("Failed to parse cached user.", err);
      }
    }
  }, []);

  const handleLoginSuccess = (role: UserRole, userRecord?: any) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setIsPortalView(true);
    if (userRecord) {
      localStorage.setItem("carebridge_userId", userRecord._id);
      localStorage.setItem("carebridge_user", JSON.stringify(userRecord));
    }
  };

  const handleScrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSymptomSummarySelect = (summary: string) => {
    setSelectedSymptomSummary(summary);
    
    // Smooth scroll down to appointment scheduler section
    setTimeout(() => {
      handleScrollToSection("scheduler-section");
    }, 100);
  };

  const handleNewsletterSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSuccess(true);
    setNewsletterEmail("");
    setTimeout(() => setNewsletterSuccess(false), 4000);
  };

  if (isPortalView) {
    if (userRole === "doctor") {
      return (
        <DoctorPortal 
          onClose={handleLogout} 
        />
      );
    }
    if (userRole === "admin") {
      return (
        <AdminPortal 
          onClose={handleLogout} 
        />
      );
    }
    return (
      <PatientPortal 
        onClose={handleLogout} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-white relative font-sans text-gray-900" id="carebridge-root">
      
      {/* Background Section Ambient Glows */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-[#E9F8F1] rounded-full blur-[120px] opacity-60 z-0 pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] bg-[#E9F8F1] rounded-full blur-[120px] opacity-40 z-0 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[800px] bg-gradient-to-b from-[#E9F8F1]/40 to-transparent pointer-events-none z-0" />
      <div className="absolute top-[1600px] left-1/2 -translate-x-1/2 w-[80vw] h-[600px] bg-gradient-to-r from-[#E9F8F1]/20 via-[#5CC49A]/5 to-transparent rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="absolute bottom-[800px] left-1/2 -translate-x-1/2 w-[90vw] h-[500px] bg-gradient-to-r from-[#E9F8F1]/30 via-transparent to-[#E9F8F1]/20 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Sticky Header Navigation */}
      <Navbar 
        onNavClick={handleScrollToSection} 
        onBookClick={() => handleScrollToSection("scheduler-section")} 
        onLoginClick={() => {
          setAuthScreen("login");
          setIsAuthOpen(true);
        }}
        onSignUpClick={() => {
          setAuthScreen("signup");
          setIsAuthOpen(true);
        }}
        isLoggedIn={isLoggedIn}
        onPortalClick={() => setIsPortalView(true)}
        onLogoutClick={handleLogout}
      />

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-6 overflow-hidden" id="hero">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Hero Left content */}
          <div className="lg:col-span-7 space-y-8 text-left z-10">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E9F8F1] border border-[#2E8B57]/10 text-xs font-bold text-[#2E8B57]"
              id="hero-badge"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#2E8B57]" />
              ✨ AI Powered Healthcare Platform
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-[64px] font-black tracking-tight text-gray-900 leading-[1.05] font-display"
              id="hero-headline"
            >
              Care That Keeps <br className="hidden sm:inline" />
              <span className="text-[#2E8B57]">You Connected.</span>
            </motion.h2>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-base sm:text-lg text-[#6B7280] leading-relaxed max-w-2xl"
              id="hero-subheadline"
            >
              Book appointments, share symptoms, receive AI-powered summaries, manage prescriptions, and never miss a follow-up care plan. Connect with top doctors securely.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 pt-2"
              id="hero-ctas"
            >
              <button
                onClick={() => handleScrollToSection("scheduler-section")}
                className="bg-[#2E8B57] text-white px-8 py-4 rounded-[24px] text-sm font-bold shadow-xl shadow-emerald-900/20 active:scale-95 transition-all hover:bg-[#2E8B57]/90 hover:-translate-y-0.5"
                id="hero-primary-cta"
              >
                Book Appointment
              </button>
              <button
                onClick={() => handleScrollToSection("scheduler-section")}
                className="border border-[#E5E7EB] bg-white text-[#111827] px-8 py-4 rounded-[24px] text-sm font-bold hover:bg-gray-50 active:scale-95 transition-all hover:-translate-y-0.5"
                id="hero-secondary-cta"
              >
                Find Doctors
              </button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex flex-wrap items-center gap-6 pt-6 border-t border-[#E5E7EB]/80"
              id="hero-trust"
            >
              {/* Avatars Stack */}
              <div className="flex -space-x-3.5">
                {[
                  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=80&h=80",
                  "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=80&h=80",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=80&h=80",
                  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=80&h=80"
                ].map((avatarUrl, idx) => (
                  <img
                    key={idx}
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                    src={avatarUrl}
                    alt="Patient avatar"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>

              {/* Trust counts */}
              <div className="grid grid-cols-3 gap-6 sm:gap-8">
                <div>
                  <strong className="block text-lg font-black text-gray-900 leading-none">25k+</strong>
                  <span className="text-xs text-[#6B7280] font-medium mt-1 block">Active Patients</span>
                </div>
                <div className="border-l border-gray-200 pl-6 sm:pl-8">
                  <strong className="block text-lg font-black text-gray-900 leading-none">800+</strong>
                  <span className="text-xs text-[#6B7280] font-medium mt-1 block">Specialists</span>
                </div>
                <div className="border-l border-gray-200 pl-6 sm:pl-8">
                  <strong className="block text-lg font-black text-gray-900 leading-none">98%</strong>
                  <span className="text-xs text-[#6B7280] font-medium mt-1 block">Satisfaction</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Hero Right: Premium Illustration + Floating Glass Cards */}
          <div className="lg:col-span-5 relative z-10 flex justify-center items-center">
            
            {/* Visual Frame */}
            <div className="relative w-full max-w-md aspect-square sm:aspect-[4/3] lg:aspect-square rounded-[32px] overflow-hidden shadow-2xl border border-white/80 bg-white">
              <img
                src={HERO_ILLUSTRATION_URL}
                alt="Caring doctor explaining treatment to a patient on tablet"
                className="w-full h-full object-cover select-none"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Floating Glass Card 1: AI Symptom Analysis */}
            <div className="absolute -top-6 -left-6 bg-white/75 backdrop-blur-md border border-[#E5E7EB] rounded-2xl p-3.5 shadow-lg max-w-[200px] flex items-center gap-3 animate-[bounce_5s_infinite_ease-in-out]">
              <div className="p-2 bg-[#E9F8F1] text-[#2E8B57] rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h5 className="text-[11px] font-black text-gray-900 leading-none">Symptom Analyzed</h5>
                <p className="text-[9px] text-[#6B7280] font-bold mt-1">Structured clinical notes ready</p>
              </div>
            </div>

            {/* Floating Glass Card 2: Appointment Confirmed */}
            <div className="absolute top-[40%] -right-8 bg-white/75 backdrop-blur-md border border-[#E5E7EB] rounded-2xl p-3.5 shadow-lg max-w-[190px] flex items-center gap-3 animate-[bounce_6s_infinite_ease-in-out_1s]">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h5 className="text-[11px] font-black text-gray-900 leading-none">Consultation Booked</h5>
                <p className="text-[9px] text-emerald-600 font-bold mt-1">Calendar & email synced</p>
              </div>
            </div>

            {/* Floating Glass Card 3: Medication Reminder */}
            <div className="absolute -bottom-6 left-10 bg-white/75 backdrop-blur-md border border-[#E5E7EB] rounded-2xl p-3.5 shadow-lg max-w-[210px] flex items-center gap-3 animate-[bounce_4s_infinite_ease-in-out_2s]">
              <div className="p-2 bg-[#E9F8F1] text-[#2E8B57] rounded-xl">
                <Bell className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h5 className="text-[11px] font-black text-gray-900 leading-none">Pill Alert • 9:00 AM</h5>
                <p className="text-[9px] text-gray-500 font-bold mt-1">Lisinopril 10mg reminder</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* TRUSTED CLINICS LOGO STRIP */}
      <section className="bg-gray-50/30 py-10 border-y border-[#E5E7EB] overflow-hidden relative animate-fade-in" id="clinics-strip">
        {/* Gradient Mask for smooth fade edge effect */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">
            Trusted by Elite Partner Clinics and Medical Associations
          </p>
        </div>

        {/* Marquee Container */}
        <div className="relative w-full overflow-hidden">
          <div className="animate-marquee flex gap-12 whitespace-nowrap">
            {[...Array(4)].flatMap((_, blockIdx) => [
              {
                name: "Apex Cardiology",
                slogan: "Heart & Vascular",
                color: "text-rose-600 bg-rose-50/60 border-rose-100",
                icon: (
                  <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#FDA4AF" />
                    <path d="M12 5v12M8 11h8M10 9l2-2 2 2M10 13l2 2 2-2" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6 10l2 2 2-2" stroke="#E11D48" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )
              },
              {
                name: "Oak Pediatrics",
                slogan: "Children's Health",
                color: "text-amber-600 bg-amber-50/60 border-amber-100",
                icon: (
                  <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.53c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.4z" fill="#FDE68A" />
                    <circle cx="12" cy="11" r="3" fill="#D97706" />
                    <circle cx="15" cy="8" r="1.5" fill="#B45309" />
                  </svg>
                )
              },
              {
                name: "Summit Neurology",
                slogan: "Brain & Spine Care",
                color: "text-indigo-600 bg-indigo-50/60 border-indigo-100",
                icon: (
                  <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 22h20L12 2z" fill="#C7D2FE" />
                    <circle cx="12" cy="9" r="2" fill="#4F46E5" />
                    <circle cx="9" cy="14" r="2" fill="#4F46E5" />
                    <circle cx="15" cy="14" r="2" fill="#4F46E5" />
                    <line x1="12" y1="9" x2="9" y2="14" stroke="#4F46E5" strokeWidth="1.5" />
                    <line x1="12" y1="9" x2="15" y2="14" stroke="#4F46E5" strokeWidth="1.5" />
                    <line x1="9" y1="14" x2="15" y2="14" stroke="#4F46E5" strokeWidth="1.5" />
                  </svg>
                )
              },
              {
                name: "Meridian Health",
                slogan: "Clinical Network",
                color: "text-cyan-600 bg-cyan-50/60 border-cyan-100",
                icon: (
                  <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#CFFAFE" />
                    <circle cx="12" cy="12" r="6" stroke="#0891B2" strokeWidth="2" />
                    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="#0891B2" strokeWidth="1.5" />
                    <path d="M2 12h20" stroke="#0891B2" strokeWidth="1.5" />
                  </svg>
                )
              },
              {
                name: "CareBridge Wellness",
                slogan: "Holistic Prevention",
                color: "text-[#2E8B57] bg-emerald-50/60 border-emerald-100",
                icon: (
                  <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="5" fill="#A7F3D0" />
                    <path d="M12 7v10M7 12h10" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
                    <path d="M12 12l4-4M12 12l-4 4" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )
              }
            ]).map((clinic, index) => (
              <div 
                key={`clinic-marquee-${index}`} 
                className={`flex items-center gap-3.5 px-6 py-3 border rounded-2xl ${clinic.color} shadow-sm transition-all duration-300 hover:scale-[1.03] shrink-0 cursor-pointer`}
              >
                {clinic.icon}
                <div className="text-left">
                  <span className="text-sm font-black tracking-tight block font-display text-gray-900">{clinic.name}</span>
                  <span className="text-[9px] font-bold text-gray-400 block uppercase tracking-wider">{clinic.slogan}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE AI PRE-SCREENING DEMO CARD */}
      <section className="py-20 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center" id="demo-analysis-section">
        <div className="lg:col-span-5 space-y-6 text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2E8B57] bg-[#E9F8F1] px-2.5 py-1 rounded-full">
            Try Live Interactive Demo
          </span>
          <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-snug font-display">
            Pre-Screen Your Symptoms <br />
            with CareBridge AI
          </h3>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            Enter physical symptoms to see how the platform immediately converts raw text into structured clinical translations for your practitioner, and sets up your personalized clinical consultation queries automatically!
          </p>
          
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E9F8F1] text-[#2E8B57] flex items-center justify-center text-xs font-bold">✓</span>
              <p className="text-xs text-[#6B7280]">Select a symptom card inside the demo to begin.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E9F8F1] text-[#2E8B57] flex items-center justify-center text-xs font-bold">✓</span>
              <p className="text-xs text-[#6B7280]">Review the clinical translated terminology.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E9F8F1] text-[#2E8B57] flex items-center justify-center text-xs font-bold">✓</span>
              <p className="text-xs text-[#6B7280]">Directly attach results to your booking sheet instantly!</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <SymptomAnalyzer onSummarySelect={handleSymptomSummarySelect} />
        </div>
      </section>

      {/* SCHEDULER SECTION */}
      <section className="py-20 bg-gray-50/40 border-y border-[#E5E7EB] px-6" id="scheduler-section">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2E8B57] bg-[#E9F8F1] px-2.5 py-1 rounded-full">
              SaaS Appointment System
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight font-display">
              Book a Secure Consultation
            </h3>
            <p className="text-sm text-[#6B7280] leading-relaxed max-w-xl mx-auto">
              Find an accredited medical specialist, schedule your interactive video slot, and experience the next generation of patient-doctor collaboration.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <AppointmentScheduler 
              initialSymptomSummary={selectedSymptomSummary} 
              onBookingSuccess={() => setSelectedSymptomSummary("")}
            />
          </div>
        </div>
      </section>

      {/* FEATURE HIGHLIGHTS */}
      <section className="py-24 px-6 max-w-7xl mx-auto" id="features-section">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2E8B57] bg-[#E9F8F1] px-2.5 py-1 rounded-full">
            Product Features
          </span>
          <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight font-display">
            Built for Connected Modern Medicine
          </h3>
          <p className="text-sm text-[#6B7280] max-w-xl mx-auto leading-relaxed">
            Every instrument you need to access care, digest clinical diagnostics, schedule appointments, and coordinate clinical recovery under one unified, accessible framework.
          </p>
        </div>

        {/* Features 6-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              id: 1,
              title: "AI Symptom Analysis",
              description: "Translates patient-described symptoms into clinical terminology so doctors digest cases in seconds.",
              icon: Sparkles,
              tag: "AI Engine",
              color: "text-[#2E8B57] bg-[#E9F8F1]"
            },
            {
              id: 2,
              title: "Smart Appointment Booking",
              description: "Dynamic date and slot optimization matched automatically to clinician hospital shift availability.",
              icon: Calendar,
              tag: "Scheduler",
              color: "text-blue-600 bg-blue-50"
            },
            {
              id: 3,
              title: "Doctor Collaboration Dashboard",
              description: "Direct real-time link for specialists to preview pre-screened files and prepare diagnostics.",
              icon: Stethoscope,
              tag: "Clinician App",
              color: "text-amber-600 bg-amber-50"
            },
            {
              id: 4,
              title: "Automated Patient Follow-up",
              description: "Proactive platform outreach to monitor patient recuperation, feedback, and post-visit symptoms.",
              icon: Activity,
              tag: "Care Follow-up",
              color: "text-rose-600 bg-rose-50"
            },
            {
              id: 5,
              title: "Smart Medication Reminders",
              description: "Converts complex dosage sheets into friendly alarm queues synced right to your smartphone.",
              icon: Bell,
              tag: "Patient Reminders",
              color: "text-violet-600 bg-violet-50"
            },
            {
              id: 6,
              title: "Calendar & Email Sync",
              description: "Two-way communication hooks instantly writing meetings and intake sheets to Google Calendar.",
              icon: Clock,
              tag: "Workspace Hook",
              color: "text-emerald-600 bg-emerald-50"
            }
          ].map((feature, idx) => (
            <div
              key={feature.id}
              onClick={() => setFocusedFeature(focusedFeature === feature.id ? null : feature.id)}
              className="border border-[#E5E7EB] hover:border-[#2E8B57]/40 rounded-3xl p-6 bg-[#FCFFFD] hover:bg-white transition-all duration-300 hover:shadow-lg cursor-pointer group flex flex-col justify-between space-y-6"
              id={`feature-card-${feature.id}`}
            >
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl ${feature.color} flex items-center justify-center shadow-sm`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{feature.tag}</span>
                </div>
                
                <h4 className="text-base font-black text-gray-900 group-hover:text-[#2E8B57] transition-colors font-sans">
                  {feature.title}
                </h4>
                
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-[#2E8B57] font-semibold">
                <span>{focusedFeature === feature.id ? "Minimize Info" : "Learn More"}</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${focusedFeature === feature.id ? "rotate-90" : "group-hover:translate-x-1"}`} />
              </div>

              {focusedFeature === feature.id && (
                <div className="p-3 bg-[#E9F8F1] rounded-xl text-[11px] text-[#2E8B57] font-medium leading-relaxed mt-2 text-left">
                  🌟 CareBridge fully encrypts this operational feature with 256-bit TLS to uphold HIPAA privacy guidelines while syncing schedules seamlessly in real-time.
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS TIMELINE */}
      <section className="py-24 bg-gray-50/50 border-y border-[#E5E7EB] px-6" id="how-it-works-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2E8B57] bg-[#E9F8F1] px-2.5 py-1 rounded-full">
              Seamless Patient Journey
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight font-display">
              How CareBridge Works
            </h3>
            <p className="text-sm text-[#6B7280] max-w-xl mx-auto leading-relaxed">
              We design every node of the healthcare loop to be incredibly human, fluid, and predictable. From scheduling to continuous recuperation support.
            </p>
          </div>

          {/* Timeline Nodes */}
          <div className="relative" id="timeline-container">
            {/* Horizontal connection line for desktop */}
            <div className="hidden lg:block absolute top-[44px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-emerald-100 via-emerald-300 to-emerald-100 z-0" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
              {[
                { step: "01", title: "Find Doctor", desc: "Select an verified cardiology, pediatric, neurology, or general health physician.", icon: Stethoscope },
                { step: "02", title: "Book Appointment", desc: "Lock in an optimized date and hour slot within our instant secure calendar board.", icon: Calendar },
                { step: "03", title: "Share Symptoms", desc: "Structure your patient case pre-meeting using our live clinical translation AI tool.", icon: Sparkles },
                { step: "04", title: "Meet Doctor", desc: "Conduct a encrypted, high-definition video call from any browser without installation.", icon: Video },
                { step: "05", title: "Continue Follow-up", desc: "Log automated medication checklists and review simplified plain language charts.", icon: Activity }
              ].map((node, index) => (
                <div key={index} className="flex flex-col items-center text-center space-y-4 group" id={`timeline-node-${index}`}>
                  {/* Icon Circle */}
                  <div className="w-20 h-20 bg-white border-2 border-emerald-100 rounded-3xl flex items-center justify-center text-[#2E8B57] shadow-sm group-hover:border-[#2E8B57] group-hover:shadow-md transition-all duration-300 relative">
                    <node.icon className="w-8 h-8" />
                    <span className="absolute -top-2.5 -right-2.5 bg-[#2E8B57] text-white text-[10px] font-black w-6 h-6 rounded-xl flex items-center justify-center border-2 border-white shadow-sm">
                      {node.step}
                    </span>
                  </div>
                  
                  {/* Text details */}
                  <div className="space-y-1.5 max-w-[190px]">
                    <h4 className="text-sm font-extrabold text-gray-900 group-hover:text-[#2E8B57] transition-colors">
                      {node.title}
                    </h4>
                    <p className="text-[11px] text-[#6B7280] leading-relaxed">
                      {node.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY CAREBRIDGE - SYSTEM ECOSYSTEM */}
      <section className="py-24 px-6 max-w-7xl mx-auto" id="why-carebridge-section">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left: Ecosystem illustration */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-[32px] overflow-hidden shadow-xl border border-gray-100 bg-white">
              <img
                src={ECOSYSTEM_ILLUSTRATION_URL}
                alt="Healthcare connected ecosystem illustration with icons"
                className="w-full h-full object-cover select-none"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Right: Ecosystem text highlights */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2E8B57] bg-[#E9F8F1] px-2.5 py-1 rounded-full">
              Unified Medical Care
            </span>
            <div className="space-y-4">
              <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-snug font-display">
                One Platform. <br />
                Complete Healthcare Journey.
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed max-w-2xl">
                We eliminate friction from healthcare management by integrating scheduling, clinical transcription translation, medication alerts, and post-consultation reports into a beautifully clean, secure, and intuitive web application.
              </p>
            </div>

            {/* Bullet Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {[
                { title: "Clinical AI Assistance", desc: "Translates diagnostic medical jargon into action items." },
                { title: "HIPAA Secure Records", desc: "Every transmission of medical records is encrypted." },
                { title: "Personal Calendar Sync", desc: "Integrates instantly with Google Calendar and Outlook." },
                { title: "Simplifed Chart Summaries", desc: "Clear directions for recovery, medications, and visits." },
                { title: "Automated Pill Alarms", desc: "Receive text, mail, or push notifications for prescriptions." }
              ].map((bullet, idx) => (
                <div key={idx} className="flex gap-3 items-start" id={`ecosystem-bullet-${idx}`}>
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-[#E9F8F1] text-[#2E8B57] flex items-center justify-center flex-shrink-0 text-xs font-black">
                    ✓
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">{bullet.title}</h5>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-normal">{bullet.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* AI EXPERIENCE BEFORE / AFTER CARDS */}
      <section className="py-24 bg-gray-50/50 border-t border-b border-[#E5E7EB] px-6" id="ai-experience-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2E8B57] bg-[#E9F8F1] px-2.5 py-1 rounded-full">
              Transforming Healthcare Notes
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight font-display">
              The CareBridge AI Experience
            </h3>
            <p className="text-sm text-[#6B7280] max-w-xl mx-auto leading-relaxed">
              Witness how our secure clinical translation engine simplifies communication between patients and practitioners, stripping away complexity.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Card 1: Symptoms Transformation */}
            <div className="border border-[#E5E7EB] rounded-3xl overflow-hidden bg-white shadow-sm flex flex-col justify-between">
              <div className="bg-[#E9F8F1]/40 px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-[#2E8B57] tracking-wider">Patient Symptoms Translation</h4>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">AI Output</span>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest block">Before (Raw Symptoms)</span>
                  <div className="p-3.5 rounded-xl bg-red-50/30 border border-red-100 text-[11px] text-gray-700 h-40 overflow-y-auto leading-relaxed">
                    "My head is pounding, feels like a pulse behind my left eye, throwing up slightly. It gets really worse when I turn on lights. Happened on and off for two days."
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest block">After (Clinical Intake File)</span>
                  <div className="p-3.5 rounded-xl bg-emerald-50/20 border border-emerald-100 text-[11px] text-gray-800 h-40 overflow-y-auto space-y-2 leading-relaxed">
                    <p className="font-bold text-[#2E8B57]">Chief Complaint:</p>
                    <p className="font-mono text-[10px]">Acute hemicranial head pain localized left-ocular, associated photophobia & secondary emesis symptoms.</p>
                    <p className="font-bold text-[#2E8B57] pt-1">Suggested Neurology Questions:</p>
                    <p className="text-[10px]">- Tension vs. vascular migraine?</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Doctor Notes Transformation */}
            <div className="border border-[#E5E7EB] rounded-3xl overflow-hidden bg-white shadow-sm flex flex-col justify-between">
              <div className="bg-[#E9F8F1]/40 px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-[#2E8B57] tracking-wider">Doctor Notes Translation</h4>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">AI Output</span>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest block">Before (Dense Medical Notes)</span>
                  <div className="p-3.5 rounded-xl bg-red-50/30 border border-red-100 text-[11px] text-gray-700 h-40 overflow-y-auto leading-relaxed">
                    "Rx Lisinopril 10mg PO QD mane. Contraindicated with potassium sparing diuretics. Patellofemoral articulation inflammation. Rest knee, ice 15min bid, support sleeve."
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest block">After (Patient-Friendly Summary)</span>
                  <div className="p-3.5 rounded-xl bg-emerald-50/20 border border-emerald-100 text-[11px] text-gray-800 h-40 overflow-y-auto space-y-2 leading-relaxed">
                    <p className="font-bold text-[#2E8B57]">Daily Action Plan:</p>
                    <p className="text-[10px]">1. Take 1 tablet Lisinopril (10mg) in the morning for blood pressure control.</p>
                    <p className="text-[10px]">2. Apply cold compress on your knee joint twice daily for 15 mins.</p>
                    <p className="text-[10px]">3. Wrap knee in support sleeve.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM PREVIEW - DASHBOARD TAB DEMO */}
      <section className="py-24 px-6 max-w-7xl mx-auto" id="platform-preview-section">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2E8B57] bg-[#E9F8F1] px-2.5 py-1 rounded-full">
            Product Walkthrough
          </span>
          <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight font-display">
            Explore the CareBridge Portals
          </h3>
          <p className="text-sm text-[#6B7280] max-w-xl mx-auto leading-relaxed">
            Click through our responsive Patient, Doctor, and Administrative consoles below to interact with real healthcare charts, checklists, and clinical notes translation desks.
          </p>
        </div>

        <PlatformDashboardPreview />
      </section>

      {/* STATISTICS MODULE */}
      <section className="bg-[#2E8B57] text-white py-16 px-6 relative overflow-hidden rounded-[40px] max-w-7xl mx-auto mb-24 shadow-xl border border-[#2E8B57]/10" id="statistics-section">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#5CC49A]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10 text-center">
          {[
            { value: "25K+", label: "Happy Patients Registered" },
            { value: "800+", label: "Verified Board Doctors" },
            { value: "150+", label: "Partner Clinics Onboard" },
            { value: "98%", label: "Patient Care Rating" }
          ].map((stat, idx) => (
            <div key={idx} className="space-y-2" id={`stat-node-${idx}`}>
              <strong className="block text-4xl sm:text-5xl font-black font-display tracking-tight text-white leading-none">
                {stat.value}
              </strong>
              <p className="text-xs sm:text-sm text-emerald-100 font-medium tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-gray-50/50 border-t border-b border-[#E5E7EB] px-6" id="testimonials-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2E8B57] bg-[#E9F8F1] px-2.5 py-1 rounded-full">
              Success Stories
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight font-display">
              Loved by Patients and Clinicians
            </h3>
            <p className="text-sm text-[#6B7280] max-w-xl mx-auto leading-relaxed">
              Discover how CareBridge makes healthcare coordinate smoothly for patients, caregivers, and modern clinic teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6"
                id={`testimonial-card-${t.id}`}
              >
                <div className="space-y-4">
                  {/* Five stars */}
                  <div className="flex gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs text-gray-700 italic leading-relaxed text-left">
                    "{t.text}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-left">
                    <h5 className="text-xs font-black text-gray-950">{t.name}</h5>
                    <p className="text-[10px] text-gray-500 mt-0.5">{t.role}</p>
                  </div>
                  <span className="ml-auto text-[9px] text-[#6B7280] font-medium">{t.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-24 px-6 max-w-7xl mx-auto" id="faq-section">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2E8B57] bg-[#E9F8F1] px-2.5 py-1 rounded-full">
            Help Center
          </span>
          <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight font-display">
            Frequently Asked Questions
          </h3>
          <p className="text-sm text-[#6B7280] max-w-xl mx-auto leading-relaxed">
            Have questions about care summaries, patient privacy, and booking synchronization? We are here to answer everything.
          </p>
        </div>

        <FAQAccordion />
      </section>

      {/* CALL TO ACTION (CTA) CARD */}
      <section className="py-12 px-6 max-w-7xl mx-auto mb-24" id="cta-section">
        <div className="relative bg-gradient-to-r from-[#2E8B57] to-[#5CC49A] text-white rounded-[40px] p-8 sm:p-12 md:p-16 text-center overflow-hidden shadow-xl border border-[#2E8B57]/10">
          
          {/* Decorative glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-96 h-96 bg-emerald-800/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest bg-white/10 text-emerald-100 px-3.5 py-1.5 rounded-full">
                Get Connected Today
              </span>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight font-display text-white">
                Ready to Experience <br />
                Smarter Healthcare?
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-lg mx-auto leading-relaxed">
                Join 25,000+ patients who sync their doctors' appointments, symptom tracking worksheets, and automated medication checklists on CareBridge seamlessly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => handleScrollToSection("scheduler-section")}
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 font-bold rounded-[24px] text-sm shadow-md transition-all hover:-translate-y-0.5 active:scale-95"
                id="cta-get-started-btn"
              >
                Get Started Now
              </button>
              <button
                onClick={() => handleScrollToSection("scheduler-section")}
                className="w-full sm:w-auto px-8 py-4 bg-[#2E8B57]/20 hover:bg-[#2E8B57]/30 text-white font-bold rounded-[24px] text-sm border border-white/20 transition-all hover:border-white/50 active:scale-95"
                id="cta-book-btn"
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-950 text-gray-400 py-16 px-6 border-t border-gray-900" id="carebridge-footer">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-gray-900">
          
          {/* Logo & Description */}
          <div className="md:col-span-4 space-y-6 text-left">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-[#2E8B57] text-white rounded-xl flex items-center justify-center font-black text-lg">
                C
              </div>
              <div>
                <h3 className="text-sm font-black text-white tracking-tight leading-none">
                  CareBridge
                </h3>
                <span className="text-[8px] text-gray-500 font-medium uppercase tracking-widest">
                  Keeps you connected
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed max-w-sm text-gray-500">
              CareBridge is a premium healthcare coordination SaaS engineered to sync patients, doctors, medical charts, and recovery procedures securely in a beautiful connected layout.
            </p>
            <div className="p-3 bg-gray-900/40 rounded-xl border border-gray-900 flex items-center gap-2 max-w-xs">
              <ShieldCheck className="w-5 h-5 text-[#2E8B57]" />
              <p className="text-[10px] text-gray-600 leading-normal">
                WCAG AA High Contrast, encrypted 256-bit TLS, and HIPAA compliant medical standard.
              </p>
            </div>
          </div>

          {/* Nav columns */}
          <div className="md:col-span-5 grid grid-cols-3 gap-6 text-left">
            <div className="space-y-4">
              <h5 className="text-[10px] font-black uppercase text-white tracking-wider">Product</h5>
              <ul className="space-y-2.5 text-xs text-gray-500">
                <li><button onClick={() => handleScrollToSection("demo-analysis-section")} className="hover:text-white transition-colors">Symptom Analyzer</button></li>
                <li><button onClick={() => handleScrollToSection("scheduler-section")} className="hover:text-white transition-colors">Smart Scheduler</button></li>
                <li><button onClick={() => handleScrollToSection("platform-preview-section")} className="hover:text-white transition-colors">Clinician Portals</button></li>
                <li><a href="#" className="hover:text-white transition-colors">HIPAA Shield</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="text-[10px] font-black uppercase text-white tracking-wider">Company</h5>
              <ul className="space-y-2.5 text-xs text-gray-500">
                <li><button onClick={() => handleScrollToSection("why-carebridge-section")} className="hover:text-white transition-colors">About Us</button></li>
                <li><a href="#" className="hover:text-white transition-colors">Medical Board</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press Kit</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="text-[10px] font-black uppercase text-white tracking-wider">Legal</h5>
              <ul className="space-y-2.5 text-xs text-gray-500">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">HIPAA Agreement</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security Audits</a></li>
              </ul>
            </div>
          </div>

          {/* Newsletter signup */}
          <div className="md:col-span-3 space-y-4 text-left">
            <h5 className="text-[10px] font-black uppercase text-white tracking-wider">Stay Connected</h5>
            <p className="text-xs text-gray-500 leading-relaxed">
              Subscribe to our clinical newsletter to receive healthcare insights and platform updates directly.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="space-y-2.5" id="newsletter-form">
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@clinical.com"
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs border border-gray-800 rounded-xl bg-gray-900 text-white focus:outline-none focus:ring-1 focus:ring-[#2E8B57]"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  id="newsletter-email-input"
                />
                <button
                  type="submit"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#2E8B57] hover:text-[#2E8B57]/80"
                  id="newsletter-submit-btn"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {newsletterSuccess && (
                <p className="text-[10px] text-emerald-500 font-bold animate-pulse">
                  ✓ Successfully subscribed to newsletters!
                </p>
              )}
            </form>
          </div>

        </div>

        {/* Footer bottom details */}
        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] text-gray-600 gap-4 text-center">
          <p>© 2026 CareBridge Inc. All rights reserved. CareBridge™ is a registered service mark.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Security Shield</a>
            <span>•</span>
            <a href="#" className="hover:underline">HIPAA Vault</a>
            <span>•</span>
            <a href="#" className="hover:underline">WCAG AA Standard</a>
          </div>
        </div>
      </footer>

      {/* Premium Authentication Module Portal */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        initialScreen={authScreen} 
        onLoginSuccess={handleLoginSuccess}
      />

    </div>
  );
}
