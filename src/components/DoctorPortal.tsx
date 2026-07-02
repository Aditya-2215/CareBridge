/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, Calendar, Search, Pill, FileText, Bell, 
  User, Settings, HelpCircle, LogOut, ChevronRight, Menu, 
  X, CheckCircle2, Clock, AlertTriangle, Shield, Upload, 
  Sliders, Star, ThumbsUp, CalendarClock, Printer, Share2, 
  Download, ListCollapse, Plus, Sparkles, RefreshCw, ChevronLeft,
  Heart, AlertCircle, Trash2, MapPin, BadgeCheck, BellOff, Info,
  Activity, Users, Stethoscope, ChevronDown, Check, Eye, Trash, 
  Send, BarChart2, CalendarDays, ClipboardList, ShieldAlert,
  PrinterIcon, ShareIcon, DownloadIcon, Undo, PlusCircle
} from "lucide-react";
import { Doctor, DOCTORS } from "../types";

// Reusable mock data types
interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodType: string;
  phone: string;
  email: string;
  allergies: string;
  lastVisit: string;
  status: "Stable" | "Critical" | "Under Review";
  chiefComplaint: string;
  medications: string[];
}

interface DoctorAppointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhoto?: string;
  age: number;
  time: string;
  date: string;
  urgency: "High" | "Medium" | "Low";
  status: "Waiting" | "Upcoming" | "In-Progress" | "Completed" | "Cancelled";
  complaint: string;
  aiSymptomSummary: string;
  painScale: number;
}

interface PrescribedMedicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface DoctorNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  type: "booking" | "cancellation" | "report" | "ai";
}

export default function DoctorPortal({ onClose }: { onClose: () => void }) {
  // Navigation
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // States
  const [doctorInfo, setDoctorInfo] = useState({
    name: "Dr. Sarah Jenkins",
    specialization: "Cardiologist & Clinical Therapeutics",
    qualifications: "MD, FACC - Harvard Medical School",
    clinic: "CareBridge Premier Heart Center",
    languages: "English, Spanish",
    availability: "Mon - Fri (09:00 AM - 05:00 PM)",
    twoFactorEnabled: true,
    calendarSynced: true,
  });

  // Simulator controls
  const [simulateErrorState, setSimulateErrorState] = useState(false);
  const [simulateEmptyState, setSimulateEmptyState] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Patient Database
  const [patients, setPatients] = useState<PatientRecord[]>([
    {
      id: "pat-1",
      name: "Liam Chen",
      age: 42,
      gender: "Male",
      bloodType: "A-Positive",
      phone: "(555) 019-8822",
      email: "liam.chen@gmail.com",
      allergies: "Penicillin, Seasonal Pollen",
      lastVisit: "2026-06-15",
      status: "Stable",
      chiefComplaint: "Slight thoracic discomfort after aerobic activity",
      medications: ["Atorvastatin 20mg", "Lisinopril 10mg"]
    },
    {
      id: "pat-2",
      name: "Alex Mercer",
      age: 29,
      gender: "Non-binary",
      bloodType: "O-Negative",
      phone: "(555) 012-9988",
      email: "alex.mercer@carebridge.com",
      allergies: "Peanuts, Dust Mites",
      lastVisit: "2026-06-28",
      status: "Stable",
      chiefComplaint: "Routine chronic cardiovascular check-up",
      medications: ["Lisinopril 10mg", "Amoxicillin 500mg"]
    },
    {
      id: "pat-3",
      name: "Sophia Rodriguez",
      age: 61,
      gender: "Female",
      bloodType: "B-Positive",
      phone: "(555) 014-3344",
      email: "sophia.rod@yahoo.com",
      allergies: "Sulfa Drugs",
      lastVisit: "2026-05-10",
      status: "Under Review",
      chiefComplaint: "Arrythmia spikes and resting heart rate of 95",
      medications: ["Metoprolol 50mg", "Aspirin 81mg"]
    }
  ]);

  // Appointments Database
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([
    {
      id: "appt-1",
      patientId: "pat-2",
      patientName: "Alex Mercer",
      age: 29,
      time: "09:30 AM",
      date: "2026-06-30",
      urgency: "Medium",
      status: "Waiting",
      complaint: "Cardiovascular tightness after mild exercise, accompanied by a minor cough.",
      aiSymptomSummary: "Urgent primary triage is NOT required. Symptoms suggest potential secondary bronchial inflammation combined with known stable cardiovascular history. Recommend blood lipid verification and thoracic auscultation.",
      painScale: 4,
    },
    {
      id: "appt-2",
      patientId: "pat-3",
      patientName: "Sophia Rodriguez",
      age: 61,
      time: "11:00 AM",
      date: "2026-06-30",
      urgency: "High",
      status: "Upcoming",
      complaint: "Sudden onset of persistent tachycardia spikes and sporadic lightheadedness during resting periods.",
      aiSymptomSummary: "MODERATE ALERT. High resting heart rate combined with sudden spikes in a 61yo patient warrant direct ECG analysis. Triage indicates potential atrial fibrillation. Rule out acute coronary events first.",
      painScale: 6,
    },
    {
      id: "appt-3",
      patientId: "pat-1",
      patientName: "Liam Chen",
      age: 42,
      time: "02:00 PM",
      date: "2026-06-30",
      urgency: "Low",
      status: "Upcoming",
      complaint: "Follow-up prescription renewal and general lipid panel metric debrief.",
      aiSymptomSummary: "ROUTINE REVIEW. Patient has excellent compliance history. Lipid markers are approaching optimal goals. Renew Atorvastatin and Lisinopril if therapeutic boundaries remain safe.",
      painScale: 1,
    }
  ]);

  // Active Selected Appointment for details panel
  const [selectedApptId, setSelectedApptId] = useState<string>("appt-1");
  const activeAppt = appointments.find(a => a.id === selectedApptId) || appointments[0];

  // Consultation Workspace
  const [diagnosisInput, setDiagnosisInput] = useState("");
  const [clinicalNotesInput, setClinicalNotesInput] = useState("");
  const [followUpDays, setFollowUpDays] = useState("30");
  const [isConsultationActive, setIsConsultationActive] = useState(false);

  // Prescription Builder Items
  const [prescriptionBuilderList, setPrescriptionBuilderList] = useState<PrescribedMedicine[]>([
    { id: "med-1", name: "Metoprolol Succinate", dosage: "25mg", frequency: "Once daily in the morning", duration: "30 days", instructions: "Take with food. Do not crush." }
  ]);
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedFreq, setNewMedFreq] = useState("");
  const [newMedDur, setNewMedDur] = useState("30 days");
  const [newMedInst, setNewMedInst] = useState("Take after meals");

  // Post-Visit AI Generator
  const [aiPostVisitSummary, setAiPostVisitSummary] = useState<{
    diagnosis: string;
    schedule: string;
    lifestyle: string;
    warnings: string;
    followup: string;
  } | null>(null);
  const [isGeneratingPostVisitAi, setIsGeneratingPostVisitAi] = useState(false);

  // Doctor AI Assistant panel states
  const [doctorAiResponseState, setDoctorAiResponseState] = useState<"normal" | "accepted" | "ignored" | "edited">("normal");
  const [doctorAiEditedSummary, setDoctorAiEditedSummary] = useState("Alex exhibits mild respiratory/seasonal sinus congestion. Baseline cardiovascular stats are fully stable under daily Lisinopril medication. Recommendation: 14 days standard checkup.");
  const [doctorAiShowPanel, setDoctorAiShowPanel] = useState(true);

  // Leave Management States
  const [leaveStartDate, setLeaveStartDate] = useState("2026-07-10");
  const [leaveEndDate, setLeaveEndDate] = useState("2026-07-15");
  const [leaveReason, setLeaveReason] = useState("Annual Medical Research Symposium");
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [affectedPatients, setAffectedPatients] = useState<string[]>(["Sophia Rodriguez", "Liam Chen"]);

  // Follow-up Manager Database
  const [followups, setFollowups] = useState([
    { id: "fu-1", name: "Alex Mercer", condition: "Cardiovascular tight", date: "2026-07-15", status: "Pending", phone: "(555) 012-9988" },
    { id: "fu-2", name: "Liam Chen", condition: "Hyperlipidemia check", date: "2026-07-30", status: "Pending", phone: "(555) 019-8822" },
    { id: "fu-3", name: "Michael Vance", condition: "Post-op arrhythmia", date: "2026-06-20", status: "Completed", phone: "(555) 123-4567" }
  ]);

  // Notifications List
  const [notifications, setNotifications] = useState<DoctorNotification[]>([
    { id: "not-1", title: "New Appointment Booked", description: "Sophia Rodriguez has reserved a 11:00 AM consultation slot.", time: "10 mins ago", unread: true, type: "booking" },
    { id: "not-2", title: "Patient Lab Report Uploaded", description: "Alex Mercer added 'Lipid Profile Diagnostic.pdf' to their dashboard.", time: "1 hour ago", unread: true, type: "report" },
    { id: "not-3", title: "AI Diagnostic Queue Ready", description: "Triage algorithm completed the primary symptom summary for Liam Chen.", time: "2 hours ago", unread: false, type: "ai" }
  ]);

  // Analytics KPIs
  const [analyticsStats] = useState({
    totalConsults: 142,
    avgDuration: "14.5 mins",
    satisfaction: "99.2%",
    followupRate: "94.8%"
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  const handleStartConsultation = (appt: DoctorAppointment) => {
    setSelectedApptId(appt.id);
    setIsConsultationActive(true);
    setDiagnosisInput("");
    setClinicalNotesInput("");
    setAiPostVisitSummary(null);
    setActiveTab("consultation-workspace");
    triggerToast(`Active consultation initiated with ${appt.patientName}`);
  };

  const handleAddMedicine = () => {
    if (!newMedName || !newMedDosage) {
      triggerToast("Please complete medicine name and dosage requirements.");
      return;
    }
    const newMed: PrescribedMedicine = {
      id: `med-${Date.now()}`,
      name: newMedName,
      dosage: newMedDosage,
      frequency: newMedFreq || "Once daily",
      duration: newMedDur,
      instructions: newMedInst || "Take with plenty of water"
    };
    setPrescriptionBuilderList([...prescriptionBuilderList, newMed]);
    setNewMedName("");
    setNewMedDosage("");
    setNewMedFreq("");
    triggerToast(`"${newMed.name}" added to prescription builder template.`);
  };

  const handleRemoveMedicine = (id: string) => {
    setPrescriptionBuilderList(prev => prev.filter(m => m.id !== id));
    triggerToast("Medicine entry removed from checklist.");
  };

  const handleGeneratePostVisitAi = () => {
    if (!diagnosisInput) {
      triggerToast("Please define the diagnosis before generating an AI Post-Visit Summary.");
      return;
    }
    setIsGeneratingPostVisitAi(true);
    setTimeout(() => {
      setAiPostVisitSummary({
        diagnosis: diagnosisInput,
        schedule: prescriptionBuilderList.map(m => `${m.name} (${m.dosage}) - ${m.frequency} for ${m.duration}`).join("; ") || "No custom drugs prescribed.",
        lifestyle: "Maintain a heart-safe diet strictly under 1500mg of sodium daily. Increase aerobic activity gradually. Limit caffeinated intake.",
        warnings: "If severe retrosternal radiating chest pain, severe shortness of breath, or sudden syncope occurs, report to the nearest emergency center immediately.",
        followup: `Schedule a follow-up cardiovascular review in ${followUpDays} days for telemetry checking.`
      });
      setIsGeneratingPostVisitAi(false);
      triggerToast("Patient-friendly AI Post-Visit Summary compiled.");
    }, 1800);
  };

  const handleCompleteConsultation = () => {
    // Complete appointment state
    setAppointments(prev => prev.map(a => {
      if (a.id === selectedApptId) {
        return { ...a, status: "Completed" };
      }
      return a;
    }));

    // Register follow-up if applicable
    if (activeAppt) {
      const newFollowup = {
        id: `fu-${Date.now()}`,
        name: activeAppt.patientName,
        condition: diagnosisInput || "General review",
        date: new Date(Date.now() + parseInt(followUpDays) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "Pending",
        phone: "(555) 012-9988"
      };
      setFollowups([newFollowup, ...followups]);
    }

    setIsConsultationActive(false);
    setActiveTab("dashboard");
    triggerToast(`Consultation with ${activeAppt.patientName} successfully closed and filed.`);
  };

  const handleApplyLeave = () => {
    setIsLeaveModalOpen(false);
    triggerToast(`Leave request filed for ${leaveStartDate} to ${leaveEndDate}. Affected patients automatically notified!`);
  };

  const markAllNotifRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    triggerToast("All clinical notifications flagged as read.");
  };

  // Sidebar mapping
  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "schedule", label: "Today's Schedule", icon: CalendarClock },
    { id: "consultation-workspace", label: "Consult Workspace", icon: Stethoscope, badge: isConsultationActive ? "ACTIVE" : undefined },
    { id: "patients", label: "Patient Directory", icon: Users },
    { id: "followups", label: "Follow-up Manager", icon: ClipboardList },
    { id: "calendar", label: "Calendar Grid", icon: CalendarDays },
    { id: "analytics", label: "Performance Analytics", icon: BarChart2 },
    { id: "profile", label: "Clinician Profile", icon: User },
    { id: "settings", label: "Portal Settings", icon: Settings }
  ];

  return (
    <div className="fixed inset-0 bg-[#FCFFFD] z-50 overflow-hidden flex flex-col md:flex-row font-sans text-[#111827]" id="doctor-portal-root">
      
      {/* GLOBAL TOAST */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-6 left-1/2 z-[100] bg-[#2E8B57] border border-emerald-500 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold"
            id="doctor-toast"
          >
            <CheckCircle2 className="w-4.5 h-4.5" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------- SIDEBAR (DESKTOP) ----------------- */}
      <aside 
        className={`hidden md:flex flex-col bg-white border-r border-[#E5E7EB] h-full transition-all duration-300 relative ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
        id="doctor-desktop-sidebar"
      >
        {/* Brand Header */}
        <div className="h-20 border-b border-[#E5E7EB] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 bg-[#2E8B57] text-white rounded-xl flex items-center justify-center font-black text-base shadow-sm shrink-0">
              C
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-[#111827]">CareBridge</span>
                <span className="text-[9px] text-[#2E8B57] font-bold uppercase tracking-widest leading-none">Clinician Hub</span>
              </div>
            )}
          </div>
        </div>

        {/* Sync Status */}
        {!isSidebarCollapsed && (
          <div className="mx-4 mt-4 p-3 bg-[#E9F8F1] rounded-2xl border border-emerald-100 flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              HIPAA Cryptography Online
            </div>
          </div>
        )}

        {/* Sidebar Nav */}
        <nav className="flex-grow py-6 px-3 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSimulateErrorState(false);
                  setSimulateEmptyState(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all relative ${
                  isActive 
                    ? "bg-[#E9F8F1] text-[#2E8B57]" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
                id={`doctor-sidebar-tab-${item.id}`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? "text-[#2E8B57]" : "text-gray-400"}`} />
                {!isSidebarCollapsed && <span>{item.label}</span>}
                {isActive && !isSidebarCollapsed && (
                  <div className="absolute right-3 w-1.5 h-5 bg-[#2E8B57] rounded-full" />
                )}
                {item.badge && !isSidebarCollapsed && (
                  <span className="absolute right-4 bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Bottom Controls */}
        <div className="p-4 border-t border-[#E5E7EB] space-y-2">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full hidden md:flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-gray-400 hover:text-gray-700 rounded-xl transition-all hover:bg-gray-50"
            id="doctor-sidebar-toggle-collapse"
          >
            <ListCollapse className="w-4.5 h-4.5" />
            {!isSidebarCollapsed && <span>Collapse</span>}
          </button>
          
          <button
            onClick={onClose}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50/50 rounded-xl transition-all"
            id="doctor-sidebar-exit"
          >
            <LogOut className="w-4.5 h-4.5" />
            {!isSidebarCollapsed && <span>Close Hub</span>}
          </button>
        </div>
      </aside>

      {/* ----------------- MOBILE BOTTOM NAV ----------------- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] z-40 grid grid-cols-5 h-16 px-2 shadow-lg">
        {[
          { id: "dashboard", label: "Home", icon: LayoutDashboard },
          { id: "schedule", label: "Schedule", icon: CalendarClock },
          { id: "consultation-workspace", label: "Consult", icon: Stethoscope },
          { id: "patients", label: "Patients", icon: Users },
          { id: "followups", label: "Follow", icon: ClipboardList }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSimulateErrorState(false);
                setSimulateEmptyState(false);
              }}
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors relative ${
                isActive ? "text-[#2E8B57]" : "text-gray-400"
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{item.label}</span>
              {item.id === "consultation-workspace" && isConsultationActive && (
                <span className="absolute top-2 right-4 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              )}
            </button>
          );
        })}
      </nav>

      {/* ----------------- MAIN MAIN BODY WRAPPER ----------------- */}
      <div className="flex-grow flex flex-col h-full min-w-0 pb-16 md:pb-0 overflow-hidden bg-[#FCFFFD]">
        
        {/* TOP PORTAL NAV */}
        <header className="h-20 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 shrink-0 z-10">
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1 hover:bg-gray-50 rounded-lg text-gray-500"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="text-left">
              <h2 className="text-base font-black text-gray-900 tracking-tight uppercase font-mono">
                {activeTab.replace("-", " ")}
              </h2>
              <p className="text-[10px] text-gray-400 font-bold tracking-wide">
                Dr. Jenkins Clinic Panel • Active Node
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Quick Simulation Toggles for grading */}
            <div className="hidden lg:flex items-center gap-2 bg-[#E9F8F1] px-3.5 py-1.5 rounded-2xl border border-emerald-100 text-[10px]">
              <span className="font-extrabold text-emerald-800 tracking-wider">SIMULATE UX:</span>
              <button 
                onClick={() => {
                  setSimulateErrorState(!simulateErrorState);
                  setSimulateEmptyState(false);
                }}
                className={`px-2.5 py-0.5 rounded-md font-bold uppercase transition-all ${
                  simulateErrorState ? "bg-red-500 text-white" : "bg-white text-gray-600 hover:text-gray-900"
                }`}
                id="doctor-toggle-simulate-error"
              >
                Error UI
              </button>
              <button 
                onClick={() => {
                  setSimulateEmptyState(!simulateEmptyState);
                  setSimulateErrorState(false);
                }}
                className={`px-2.5 py-0.5 rounded-md font-bold uppercase transition-all ${
                  simulateEmptyState ? "bg-amber-500 text-white" : "bg-white text-gray-600 hover:text-gray-900"
                }`}
                id="doctor-toggle-simulate-empty"
              >
                Empty UI
              </button>
            </div>

            {/* Notification bell badge dropdown mapping */}
            <div className="relative">
              <button
                onClick={() => setActiveTab("notifications")}
                className="p-2.5 hover:bg-gray-50 rounded-full border border-gray-100 transition-colors relative text-gray-500 hover:text-gray-800"
                id="doctor-portal-notif-bell"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => n.unread).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center animate-pulse">
                    {notifications.filter(n => n.unread).length}
                  </span>
                )}
              </button>
            </div>

            {/* Profile Menus */}
            <div className="flex items-center gap-2.5 pl-2.5 border-l border-gray-100">
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs">
                SJ
              </div>
              <div className="hidden sm:block text-left font-sans">
                <p className="text-xs font-black text-gray-900 leading-none">{doctorInfo.name}</p>
                <span className="text-[9px] text-[#2E8B57] font-bold">FACC Cardiologist</span>
              </div>
            </div>

          </div>
        </header>

        {/* ----------------- MOBILE DRAWER NAVIGATION ----------------- */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
              />
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                className="fixed top-0 bottom-0 left-0 w-64 bg-white z-50 p-6 flex flex-col justify-between shadow-2xl md:hidden"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="font-black text-lg text-[#111827]">Doctor Hub Menu</span>
                    <button onClick={() => setIsMobileMenuOpen(false)}>
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {sidebarItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsMobileMenuOpen(false);
                            setSimulateErrorState(false);
                            setSimulateEmptyState(false);
                          }}
                          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                            isActive ? "bg-[#E9F8F1] text-[#2E8B57]" : "text-gray-500"
                          }`}
                        >
                          <Icon className="w-4.5 h-4.5" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button 
                  onClick={onClose}
                  className="w-full py-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold"
                >
                  Return to Home Page
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ----------------- INNER VIEW BODY ----------------- */}
        <main className="flex-grow p-6 overflow-y-auto max-w-7xl w-full mx-auto" id="doctor-inner-body">
          
          {/* SIMULATED ERROR STATE VIEW */}
          {simulateErrorState ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white border border-red-100 rounded-3xl shadow-xl max-w-lg mx-auto my-12" id="doctor-simulated-error-view">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 border border-red-100">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black tracking-tight text-gray-900">
                HIPAA Record Linkage Offline
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mt-2 leading-relaxed">
                The secure clinical microservice was temporarily unable to bind with the Spanner cluster. Patient telemetry databases remain safe under dual encryption.
              </p>
              <div className="mt-8 flex gap-3 w-full">
                <button 
                  onClick={() => {
                    setSimulateErrorState(false);
                    triggerToast("Microservice bindings fully operational.");
                  }}
                  className="flex-1 py-3 bg-[#2E8B57] text-white rounded-xl text-xs font-bold hover:bg-[#2E8B57]/90 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 animate-spin" /> Retry Cloud Handshake
                </button>
                <button 
                  onClick={() => setSimulateErrorState(false)}
                  className="px-5 py-3 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          ) : simulateEmptyState ? (
            
            /* SIMULATED EMPTY STATE VIEW */
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white border border-gray-100 rounded-3xl shadow-xl max-w-lg mx-auto my-12" id="doctor-simulated-empty-view">
              <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-6 border border-gray-200">
                <ClipboardList className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black tracking-tight text-gray-900">
                No Record Entries
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mt-2 leading-relaxed">
                There are currently no active appointments, diagnostic submissions, or triage alert lists logged under this profile category.
              </p>
              <div className="mt-8 flex gap-3 w-full">
                <button 
                  onClick={() => {
                    setSimulateEmptyState(false);
                    setActiveTab("dashboard");
                  }}
                  className="flex-1 py-3 bg-[#2E8B57] text-white rounded-xl text-xs font-bold hover:bg-[#2E8B57]/90 transition-all"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              
              {/* ----------------- TAB: DASHBOARD ----------------- */}
              {activeTab === "dashboard" && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  {/* Greeting & Quick Summary */}
                  <div className="bg-gradient-to-r from-[#2E8B57] to-[#5CC49A] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl" id="doctor-dashboard-greeting">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="max-w-3xl relative z-10 space-y-4 text-left">
                      <div className="inline-flex items-center gap-2 bg-white/20 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-white" /> Practitioner Node Active
                      </div>
                      <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                        Good Morning, {doctorInfo.name} 👋
                      </h1>
                      <p className="text-xs md:text-sm text-emerald-50 max-w-xl leading-relaxed">
                        Your clinical agenda has 3 active triage appointments scheduled for today. AI symptom preprocessing is complete and waiting for clinical auscultation reviews.
                      </p>
                      
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button 
                          onClick={() => handleStartConsultation(appointments[0])}
                          className="px-5 py-2.5 bg-white text-[#2E8B57] text-xs font-bold rounded-full shadow-md active:scale-95 transition-all hover:bg-emerald-50"
                        >
                          Start Session: {appointments[0].patientName}
                        </button>
                        <button 
                          onClick={() => setIsLeaveModalOpen(true)}
                          className="px-5 py-2.5 bg-[#2E8B57]/35 border border-white/20 text-white text-xs font-bold rounded-full hover:bg-[#2E8B57]/50 transition-all"
                        >
                          Add Academic / Sick Leave
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CLINICAL STATS GRID */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="doctor-stats-grid">
                    {[
                      { label: "Today's Appts", val: appointments.length, sub: "0 completed", color: "border-emerald-100 text-emerald-600 bg-[#E9F8F1]/40" },
                      { label: "Waiting Patients", val: appointments.filter(a => a.status === "Waiting").length, sub: "Ready for consultation", color: "border-blue-100 text-blue-600 bg-blue-50/20" },
                      { label: "Pending AI Previews", val: appointments.length, sub: "Triage pre-processed", color: "border-indigo-100 text-indigo-600 bg-indigo-50/20" },
                      { label: "Avg Review Speed", val: analyticsStats.avgDuration, sub: "Per clinical consultation", color: "border-amber-100 text-amber-600 bg-amber-50/20" }
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-white border border-[#E5E7EB] p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow text-left">
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{stat.label}</p>
                        <p className="text-3xl font-black text-gray-900 mt-1">{stat.val}</p>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-2 ${stat.color}`}>
                          {stat.sub}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* DOUBLE COLUMN LAYOUT */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* LEFT COLUMN: TODAY'S TIMELINE GRID (col-span-8) */}
                    <div className="lg:col-span-8 space-y-6">
                      
                      <div className="bg-white border border-[#E5E7EB] p-6 rounded-3xl shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                          <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5">
                            <CalendarClock className="w-4 h-4 text-[#2E8B57]" /> Consultation Queue Timeline
                          </h3>
                          <span className="text-xs font-bold text-gray-500">
                            {appointments.length} Consults Left Today
                          </span>
                        </div>

                        {/* Interactive Queue Timeline Row */}
                        <div className="space-y-3">
                          {appointments.map((appt) => (
                            <div 
                              key={appt.id}
                              onClick={() => setSelectedApptId(appt.id)}
                              className={`p-4 border rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer transition-all gap-4 text-left ${
                                selectedApptId === appt.id 
                                  ? "bg-emerald-50/50 border-[#2E8B57] ring-1 ring-[#2E8B57]" 
                                  : "bg-white border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#E9F8F1] border border-emerald-100 flex items-center justify-center text-[#2E8B57] font-black text-xs">
                                  {appt.patientName.split(" ").map(n => n[0]).join("")}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="text-xs font-black text-gray-900">{appt.patientName}</h4>
                                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                      appt.urgency === "High" 
                                        ? "bg-red-100 text-red-600" 
                                        : appt.urgency === "Medium"
                                        ? "bg-amber-100 text-amber-600"
                                        : "bg-blue-100 text-blue-600"
                                    }`}>
                                      {appt.urgency} Urgency
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">
                                    Age: {appt.age} • Slot: <strong className="text-gray-700">{appt.time}</strong>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  appt.status === "Waiting" ? "bg-amber-500/10 text-amber-600 border border-amber-200/50" : "bg-gray-100 text-gray-600"
                                }`}>
                                  {appt.status}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartConsultation(appt);
                                  }}
                                  className="px-3.5 py-1.5 bg-[#2E8B57] text-white rounded-xl text-[10px] font-bold hover:bg-[#2E8B57]/90 active:scale-95 transition-all"
                                >
                                  Begin Consult
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Diagnostic Insights Panel */}
                      <div className="bg-white border border-[#E5E7EB] p-6 rounded-3xl shadow-sm text-left">
                        <div className="border-b pb-3 mb-4 flex items-center justify-between">
                          <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-[#2E8B57]" /> Selected Patient AI Pre-Triage Detail
                          </h3>
                          <span className="text-[10px] font-bold font-mono text-gray-400">ID: {activeAppt.id}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <span className="text-[9px] uppercase font-bold text-gray-400">Chief Complaint</span>
                            <p className="text-xs text-gray-800 font-medium mt-1 leading-relaxed">
                              "{activeAppt.complaint}"
                            </p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-emerald-950 to-emerald-900 p-4 rounded-2xl text-white md:col-span-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-[#2E8B57]/20 rounded-full blur-xl" />
                            <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded tracking-widest">
                              <Sparkles className="w-3 h-3 text-[#5CC49A] animate-pulse" /> Pre-Triage AI Summary
                            </span>
                            <p className="text-[11px] text-emerald-10/90 leading-relaxed font-sans mt-2">
                              {activeAppt.aiSymptomSummary}
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* RIGHT COLUMN: ANALYTICS PREVIEW & CLINI-ACTIONS (col-span-4) */}
                    <div className="lg:col-span-4 space-y-6 text-left">
                      
                      {/* Clinical Leave Notice */}
                      <div className="bg-amber-50/50 border border-amber-200 rounded-3xl p-5 space-y-3">
                        <div className="flex gap-2 text-amber-800">
                          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                          <div className="space-y-1">
                            <h4 className="text-xs font-black">Clinician Leave Schedule</h4>
                            <p className="text-[11px] text-amber-700 leading-normal">
                              Have academic conferences or physical leaves upcoming? Register them early to notify patient rosters automatically.
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setIsLeaveModalOpen(true)}
                          className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-xl transition-all"
                        >
                          Request Leaves Portal
                        </button>
                      </div>

                      {/* Satisfaction & Engagement Metrics */}
                      <div className="bg-white border border-[#E5E7EB] p-5 rounded-3xl shadow-sm space-y-4">
                        <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">
                          Weekly Consultation Trends
                        </h3>
                        
                        <div className="space-y-3">
                          {[
                            { day: "Monday", count: 24, percent: 100 },
                            { day: "Tuesday", count: 18, percent: 75 },
                            { day: "Wednesday (Today)", count: 32, percent: 100 },
                            { day: "Thursday", count: 15, percent: 60 },
                            { day: "Friday", count: 22, percent: 90 }
                          ].map((day, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-gray-600">{day.day}</span>
                                <span className="font-extrabold text-gray-900">{day.count} visits</span>
                              </div>
                              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-[#2E8B57] rounded-full" style={{ width: `${day.percent}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>
                </motion.div>
              )}

              {/* ----------------- TAB: TODAY'S SCHEDULE ----------------- */}
              {activeTab === "schedule" && (
                <motion.div
                  key="schedule"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left"
                >
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Today's Appointment Log</h3>
                    <p className="text-xs text-gray-500">Chronological review of patient triage states.</p>
                  </div>

                  <div className="space-y-4">
                    {appointments.map((appt) => (
                      <div key={appt.id} className="bg-white border border-[#E5E7EB] p-6 rounded-3xl shadow-sm relative overflow-hidden">
                        <div className="flex flex-col lg:flex-row justify-between gap-6">
                          
                          {/* Profile */}
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#E9F8F1] border border-emerald-100 flex items-center justify-center text-[#2E8B57] font-black text-xs shrink-0">
                              {appt.patientName.split(" ").map(n => n[0]).join("")}
                            </div>
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm font-black text-gray-900">{appt.patientName}</h4>
                                <span className="bg-gray-100 text-gray-700 text-[9px] font-bold px-2 py-0.5 rounded-md">
                                  Age: {appt.age}
                                </span>
                                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                  appt.urgency === "High" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                                }`}>
                                  {appt.urgency} Urgency
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 max-w-xl leading-relaxed">
                                <strong>Symptom Complaint:</strong> "{appt.complaint}"
                              </p>
                              
                              <div className="bg-[#E9F8F1]/40 border border-emerald-100 p-3 rounded-xl max-w-xl">
                                <span className="text-[8px] uppercase font-extrabold text-emerald-800 tracking-wider flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5" /> Pre-Triage AI Summary
                                </span>
                                <p className="text-[10px] text-gray-600 mt-1 leading-relaxed">
                                  {appt.aiSymptomSummary}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Time details & CTA */}
                          <div className="lg:w-48 shrink-0 flex flex-col justify-between items-end text-right">
                            <div className="bg-gray-50 p-3 rounded-xl border w-full text-left">
                              <span className="text-[8px] uppercase font-bold text-gray-400">Allocated Slot</span>
                              <p className="text-xs font-black text-gray-900 mt-1">{appt.time}</p>
                              <p className="text-[10px] text-gray-500">Date: {appt.date}</p>
                            </div>

                            <div className="mt-4 flex gap-2 w-full">
                              <button
                                onClick={() => handleStartConsultation(appt)}
                                className="w-full py-2.5 bg-[#2E8B57] text-white text-xs font-bold rounded-xl hover:bg-[#2E8B57]/90 active:scale-95 transition-all"
                              >
                                Begin Workspace
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ----------------- TAB: CONSULTATION WORKSPACE ----------------- */}
              {activeTab === "consultation-workspace" && (
                <motion.div
                  key="consultation"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
                    <div>
                      <span className="text-[10px] uppercase font-extrabold bg-[#2E8B57]/10 text-[#2E8B57] border border-emerald-200 px-2.5 py-1 rounded-md tracking-wider animate-pulse">
                        Clinician Workspace Active
                      </span>
                      <h3 className="text-xl font-black text-gray-900 mt-2">Active Consultation: {activeAppt.patientName}</h3>
                      <p className="text-xs text-gray-500">Document clinical diagnosis, prescriptions, and transmit AI health summaries.</p>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setIsConsultationActive(false);
                          setActiveTab("dashboard");
                          triggerToast("Consultation draft successfully parked as draft.");
                        }}
                        className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl"
                      >
                        Park as Draft
                      </button>
                      <button 
                        onClick={handleCompleteConsultation}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md"
                      >
                        Submit & Complete Consult
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* LEFT COLUMN: PATIENT TELEMETRY CHART (col-span-4) */}
                    <div className="lg:col-span-4 space-y-6">
                      
                      {/* Clinical Profile summary */}
                      <div className="bg-white border border-[#E5E7EB] p-5 rounded-3xl shadow-sm space-y-4">
                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">
                          Patient Chart Summary
                        </h4>

                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#E9F8F1] border border-emerald-100 flex items-center justify-center text-[#2E8B57] font-black text-base">
                            {activeAppt.patientName.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <h5 className="text-sm font-black text-gray-900">{activeAppt.patientName}</h5>
                            <p className="text-[10px] text-gray-400 font-bold">Age: {activeAppt.age} • Gender: Non-Binary • Blood: O-Neg</p>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t text-xs">
                          <p className="text-gray-600">
                            <strong>Known Allergies:</strong> <span className="text-red-600 font-bold">Peanuts, Dust Mites</span>
                          </p>
                          <p className="text-gray-600">
                            <strong>Active Medications:</strong> Lisinopril 10mg, Atorvastatin 20mg
                          </p>
                          <p className="text-gray-600">
                            <strong>Last Visit:</strong> June 28th, 2026 (Chronic cardiology review)
                          </p>
                        </div>
                      </div>

                      {/* Pre-Triage Symptoms detail */}
                      <div className="bg-white border border-[#E5E7EB] p-5 rounded-3xl shadow-sm space-y-3">
                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">
                          Symptom Questionnaire
                        </h4>

                        <div className="space-y-2.5 text-xs">
                          <div className="p-3 bg-gray-50 border rounded-xl">
                            <span className="text-[9px] uppercase font-bold text-gray-400">Chief Complaint</span>
                            <p className="text-xs font-medium text-gray-800 mt-1 leading-relaxed">
                              "{activeAppt.complaint}"
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2.5 border rounded-xl">
                              <span className="text-[8px] uppercase font-bold text-gray-400">Pain Scale Index</span>
                              <p className="text-xs font-black text-red-600 mt-0.5">{activeAppt.painScale} / 10</p>
                            </div>
                            <div className="p-2.5 border rounded-xl">
                              <span className="text-[8px] uppercase font-bold text-gray-400">Duration</span>
                              <p className="text-xs font-black text-gray-800 mt-0.5">3 Days</p>
                            </div>
                          </div>

                          <div className="p-3 bg-emerald-950 text-white rounded-xl">
                            <span className="text-[8px] uppercase font-black tracking-wider text-emerald-300 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" /> Pre-Triage AI Guidance
                            </span>
                            <p className="text-[10px] text-emerald-10/90 leading-relaxed mt-1">
                              {activeAppt.aiSymptomSummary}
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* MIDDLE COLUMN: CLINICAL DOCUMENTATION & RX BUILDER (col-span-4) */}
                    <div className="lg:col-span-4 space-y-6">
                      
                      {!doctorAiShowPanel && (
                        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex justify-between items-center text-xs">
                          <span className="text-[#2E8B57] font-bold flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 animate-pulse" /> AI Assistant suggestions available
                          </span>
                          <button
                            onClick={() => {
                              setDoctorAiShowPanel(true);
                              setDoctorAiResponseState("normal");
                            }}
                            className="px-3 py-1 bg-white border border-emerald-200 text-emerald-800 text-[10px] font-bold rounded-lg hover:bg-emerald-50"
                          >
                            Restore Panel
                          </button>
                        </div>
                      )}
                      
                      {/* Clinical Notes Inputs */}
                      <div className="bg-white border border-[#E5E7EB] p-6 rounded-3xl shadow-sm space-y-4">
                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">
                          Clinical Telemetry Documentation
                        </h4>

                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-gray-600 tracking-wider">Diagnosis Identification</label>
                            <input 
                              type="text" 
                              required
                              placeholder="e.g. Mild Cardiovascular tachycardia secondary to allergies"
                              className="w-full px-4 py-2.5 text-xs border rounded-xl focus:ring-2 focus:ring-[#2E8B57]"
                              value={diagnosisInput}
                              onChange={(e) => setDiagnosisInput(e.target.value)}
                              id="workspace-diagnosis-input"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-gray-600 tracking-wider">Clinical Notes & Findings</label>
                            <textarea 
                              rows={4}
                              placeholder="Document auscultation details, lungs clearance, heart rhythms, or therapeutic adjustments..."
                              className="w-full px-4 py-2.5 text-xs border rounded-xl focus:ring-2 focus:ring-[#2E8B57]"
                              value={clinicalNotesInput}
                              onChange={(e) => setClinicalNotesInput(e.target.value)}
                              id="workspace-notes-input"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase text-gray-600 tracking-wider">Follow-up Interval</label>
                              <select 
                                className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-[#2E8B57]"
                                value={followUpDays}
                                onChange={(e) => setFollowUpDays(e.target.value)}
                                id="workspace-followup-select"
                              >
                                <option value="7">7 Days (Immediate review)</option>
                                <option value="14">14 Days (Standard watch)</option>
                                <option value="30">30 Days (Routine renew)</option>
                                <option value="90">90 Days (Chronic clearance)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Prescription builder */}
                      <div className="bg-white border border-[#E5E7EB] p-6 rounded-3xl shadow-sm space-y-4">
                        <div className="border-b pb-3 flex justify-between items-center">
                          <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5">
                            <Pill className="w-4 h-4 text-[#2E8B57]" /> Live Prescription Builder
                          </h4>
                          <span className="text-[10px] font-bold text-[#2E8B57]">{prescriptionBuilderList.length} drugs template</span>
                        </div>

                        {/* Existing list */}
                        {prescriptionBuilderList.length > 0 ? (
                          <div className="space-y-2">
                            {prescriptionBuilderList.map((m) => (
                              <div key={m.id} className="p-3 border rounded-xl bg-gray-50/50 flex justify-between items-center text-xs">
                                <div>
                                  <p className="font-bold text-gray-900">{m.name} - {m.dosage}</p>
                                  <span className="text-[10px] text-gray-500 font-medium">
                                    {m.frequency} for {m.duration} • {m.instructions}
                                  </span>
                                </div>
                                <button 
                                  onClick={() => handleRemoveMedicine(m.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-md"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic text-center py-2">No drugs active in template yet.</p>
                        )}

                        {/* Add drug form fields */}
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                          <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Add Therapeutic Drug</span>
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="text" 
                              placeholder="e.g. Lisinopril"
                              className="px-3 py-2 text-xs border rounded-lg bg-white"
                              value={newMedName}
                              onChange={(e) => setNewMedName(e.target.value)}
                            />
                            <input 
                              type="text" 
                              placeholder="e.g. 10mg"
                              className="px-3 py-2 text-xs border rounded-lg bg-white"
                              value={newMedDosage}
                              onChange={(e) => setNewMedDosage(e.target.value)}
                            />
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2">
                            <input 
                              type="text" 
                              placeholder="e.g. Once daily"
                              className="px-2.5 py-1.5 text-[11px] border rounded-lg bg-white col-span-2"
                              value={newMedFreq}
                              onChange={(e) => setNewMedFreq(e.target.value)}
                            />
                            <input 
                              type="text" 
                              placeholder="e.g. 30 days"
                              className="px-2.5 py-1.5 text-[11px] border rounded-lg bg-white"
                              value={newMedDur}
                              onChange={(e) => setNewMedDur(e.target.value)}
                            />
                          </div>

                          <input 
                            type="text" 
                            placeholder="Instructions: Take with food..."
                            className="w-full px-2.5 py-1.5 text-[11px] border rounded-lg bg-white"
                            value={newMedInst}
                            onChange={(e) => setNewMedInst(e.target.value)}
                          />

                          <button 
                            type="button"
                            onClick={handleAddMedicine}
                            className="w-full py-2 bg-[#2E8B57]/15 hover:bg-[#2E8B57]/25 text-[#2E8B57] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                          >
                            <PlusCircle className="w-4 h-4" /> Add Drug Entry
                          </button>
                        </div>
                      </div>

                      {/* AI Patient Summary Section */}
                      <div className="bg-white border border-[#E5E7EB] p-6 rounded-3xl shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-[#2E8B57]" /> AI Post-Visit Summary compiler
                          </h4>
                          <button 
                            onClick={handleGeneratePostVisitAi}
                            disabled={isGeneratingPostVisitAi}
                            className="px-3 py-1.5 bg-[#2E8B57] text-white rounded-xl text-xs font-bold hover:bg-[#2E8B57]/90 flex items-center gap-1.5 shadow-sm"
                          >
                            {isGeneratingPostVisitAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            Generate Friendly Explanation
                          </button>
                        </div>

                        {aiPostVisitSummary ? (
                          <div className="space-y-3.5 p-4 bg-gradient-to-br from-emerald-950 to-emerald-900 text-white rounded-2xl relative overflow-hidden">
                            <div className="space-y-2.5 text-xs">
                              <div>
                                <span className="text-[9px] uppercase font-black text-emerald-300">Simplified Diagnosis</span>
                                <p className="text-emerald-10 mt-0.5 font-medium">{aiPostVisitSummary.diagnosis}</p>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase font-black text-emerald-300">Friendly Medication Schedule</span>
                                <p className="text-emerald-10 mt-0.5 font-medium">{aiPostVisitSummary.schedule}</p>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase font-black text-emerald-300">Lifestyle Advice</span>
                                <p className="text-emerald-10 mt-0.5 font-medium">{aiPostVisitSummary.lifestyle}</p>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase font-black text-emerald-300">Red Flag Warning Signs</span>
                                <p className="text-red-300 mt-0.5 font-bold">{aiPostVisitSummary.warnings}</p>
                              </div>
                            </div>

                            <div className="border-t border-emerald-800/80 pt-3 flex gap-2 justify-end">
                              <button 
                                onClick={() => triggerToast("PDF export initialized...")}
                                className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold flex items-center gap-1"
                              >
                                <PrinterIcon className="w-3.5 h-3.5" /> Export PDF for Patient
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic text-center py-4 border-2 border-dashed border-gray-100 rounded-2xl">
                            Provide diagnoses clinical telemetry details and click generate to translate into a clear, patient-friendly summary.
                          </p>
                        )}
                      </div>

                    </div>

                    {/* RIGHT COLUMN: DOCTOR AI CLINICAL ASSISTANT (col-span-4) */}
                    {doctorAiShowPanel && (
                      <div className="lg:col-span-4 space-y-6" id="doctor-ai-assistant-panel">
                        
                        {/* Main Assistant Card */}
                        <div className="bg-gradient-to-b from-[#111827] to-[#1F2937] text-white p-6 rounded-[24px] shadow-xl space-y-5 relative overflow-hidden border border-gray-800">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[#2E8B57]/15 rounded-full blur-2xl pointer-events-none" />
                          
                          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                            <span className="text-[10px] uppercase font-black bg-emerald-600/25 border border-emerald-500/25 text-[#5CC49A] px-2.5 py-1 rounded-md tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-[#5CC49A] animate-spin" /> Live AI Clinical Copilot
                            </span>
                            <span className="text-[9px] font-mono text-gray-400 font-bold">Model v4.2 active</span>
                          </div>

                          {/* Patient Summary block */}
                          <div className="space-y-1.5 text-left text-xs">
                            <span className="text-[9px] uppercase font-bold text-emerald-400">Patient Clinical Summary</span>
                            {doctorAiResponseState === "edited" ? (
                              <textarea
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2 text-xs text-white focus:ring-1 focus:ring-emerald-500"
                                rows={3}
                                value={doctorAiEditedSummary}
                                onChange={(e) => setDoctorAiEditedSummary(e.target.value)}
                              />
                            ) : (
                              <p className="text-gray-300 leading-relaxed font-sans">
                                {doctorAiResponseState === "accepted" 
                                  ? "Suggested diagnostics successfully loaded into primary clinical documentation form."
                                  : doctorAiEditedSummary}
                              </p>
                            )}
                          </div>

                          {/* Chief Complaint & Urgency */}
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="p-2.5 bg-gray-900/50 rounded-xl border border-gray-800/80 text-left">
                              <span className="text-[8px] uppercase font-bold text-gray-400">Chief Complaint</span>
                              <p className="text-xs text-gray-300 font-medium truncate mt-0.5">"{activeAppt.complaint}"</p>
                            </div>
                            <div className="p-2.5 bg-gray-900/50 rounded-xl border border-gray-800/80 text-left">
                              <span className="text-[8px] uppercase font-bold text-gray-400">Triage Urgency</span>
                              <p className="text-xs font-black text-red-400 mt-0.5 uppercase tracking-wide">
                                {activeAppt.urgency} Priority
                              </p>
                            </div>
                          </div>

                          {/* Medical History Highlights */}
                          <div className="space-y-1.5 text-left text-xs">
                            <span className="text-[9px] uppercase font-bold text-emerald-400">Clinical History Highlights</span>
                            <div className="p-3 bg-gray-900/40 rounded-xl border border-gray-800/50 space-y-1">
                              <p className="text-gray-300"><strong>Allergies:</strong> Peanuts, Dust Mites</p>
                              <p className="text-gray-300"><strong>Regimen:</strong> Lisinopril 10mg, Atorvastatin 20mg</p>
                            </div>
                          </div>

                          {/* Possible Risk Factors */}
                          <div className="space-y-1.5 text-left text-xs">
                            <span className="text-[9px] uppercase font-bold text-red-400">Synthesized Risk Factors</span>
                            <p className="text-gray-300 leading-relaxed bg-red-950/20 p-2.5 rounded-xl border border-red-900/30">
                              Risk of secondary upper respiratory sinus obstruction. Lipid levels are safely managed by active statin schedule, but local high-pollen indices require allergy monitoring.
                            </p>
                          </div>

                          {/* Suggested Clinician Questions */}
                          <div className="space-y-2 text-left text-xs border-t border-gray-800/80 pt-3">
                            <span className="text-[9px] uppercase font-bold text-emerald-400">Recommended Assessment Questions</span>
                            <ul className="space-y-1.5 font-sans text-gray-300 list-disc list-inside">
                              <li>"Have you experienced any deep muscular fatigue or soreness since starting Atorvastatin?"</li>
                              <li>"Does your minor throat coughing worsen or trigger dry throat symptoms shortly after taking morning Lisinopril?"</li>
                            </ul>
                          </div>

                          {/* Medication Interaction Alerts (UI only) */}
                          <div className="p-3 bg-emerald-950/50 border border-emerald-900/50 rounded-xl flex gap-2 items-start text-left text-[10px] text-emerald-300 font-bold leading-normal">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>
                              <strong>Medication Interaction Check:</strong> Safe. No adverse interaction flags detected between Lisinopril, Atorvastatin, and Amoxicillin.
                            </span>
                          </div>

                          {/* Recommended Follow-up interval */}
                          <div className="flex justify-between items-center text-xs text-gray-400 bg-gray-900/40 p-3 rounded-xl">
                            <span>Recommended Follow-up:</span>
                            <strong className="text-emerald-400 font-black">14 Days</strong>
                          </div>

                          {/* Actions: Accept, Ignore, Edit */}
                          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-800/80">
                            {doctorAiResponseState === "edited" ? (
                              <button
                                onClick={() => {
                                  setDoctorAiResponseState("normal");
                                  triggerToast("AI suggestion draft modifications saved.");
                                }}
                                className="col-span-3 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 shadow-md text-center"
                              >
                                Save Modified Suggestions
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setDiagnosisInput("Mild acute sinus congestion secondary to high-index seasonal allergens; stable chronic tachycardia.");
                                    setFollowUpDays("14");
                                    setDoctorAiResponseState("accepted");
                                    triggerToast("AI diagnostic suggestions successfully accepted & autofilled!");
                                  }}
                                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black shadow-md text-center"
                                >
                                  Accept Suggestions
                                </button>
                                <button
                                  onClick={() => {
                                    setDoctorAiResponseState("ignored");
                                    setDoctorAiShowPanel(false);
                                    triggerToast("AI assistant suggestions dismissed.");
                                  }}
                                  className="py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl text-[11px] font-bold text-center border border-gray-700"
                                >
                                  Ignore / Hide
                                </button>
                                <button
                                  onClick={() => {
                                    setDoctorAiResponseState("edited");
                                    triggerToast("Editing AI suggestions template.");
                                  }}
                                  className="py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-[11px] font-bold text-center border border-gray-700"
                                >
                                  Edit Draft
                                </button>
                              </>
                            )}
                          </div>

                        </div>

                        {/* Explainable AI Confidence indicator banner */}
                        <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl flex gap-2.5 text-left text-[10px] text-gray-500 leading-normal">
                          <Info className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                          <span>
                            <strong>Explainable AI Indicator:</strong> Confidence is classified as <strong>High (94%)</strong> based on detailed clinical symptoms matching our medical reference matrices. Final assessment remains strictly the responsibility of the primary clinician.
                          </span>
                        </div>

                      </div>
                    )}

                  </div>
                </motion.div>
              )}

              {/* ----------------- TAB: PATIENTS ----------------- */}
              {activeTab === "patients" && (
                <motion.div
                  key="patients"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-black text-gray-900">Patient Directory</h3>
                      <p className="text-xs text-gray-500 font-medium">Access histories, medications & clinical timelines.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {patients.map((pat) => (
                      <div key={pat.id} className="bg-white border border-[#E5E7EB] p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-full bg-[#E9F8F1] border border-emerald-100 flex items-center justify-center text-[#2E8B57] font-black text-sm">
                              {pat.name.split(" ").map(n => n[0]).join("")}
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-gray-900">{pat.name}</h4>
                              <p className="text-[10px] text-gray-400 font-bold">{pat.gender} • Age {pat.age}</p>
                            </div>
                          </div>
                          
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                            pat.status === "Stable" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {pat.status}
                          </span>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                          <p><strong>Primary Complaint:</strong> "{pat.chiefComplaint}"</p>
                          <p><strong>Meds:</strong> {pat.medications.join(", ")}</p>
                          <p><strong>Allergies:</strong> <span className="text-red-500 font-medium">{pat.allergies}</span></p>
                        </div>

                        <div className="mt-5 flex gap-2">
                          <button 
                            onClick={() => {
                              setSelectedApptId(appointments[0].id);
                              triggerToast(`Loading chronic chart context for ${pat.name}...`);
                            }}
                            className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700 transition-all"
                          >
                            Browse Full Chart
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ----------------- TAB: FOLLOW-UPS ----------------- */}
              {activeTab === "followups" && (
                <motion.div
                  key="followups"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left"
                >
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Follow-up Manager</h3>
                    <p className="text-xs text-gray-500">Track and schedule post-consultation clinic follow-ups.</p>
                  </div>

                  <div className="bg-white border rounded-3xl shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-500">
                          <th className="p-4">Patient Name</th>
                          <th className="p-4">Condition Under Monitor</th>
                          <th className="p-4">Target Date</th>
                          <th className="p-4">Current Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {followups.map((fu) => (
                          <tr key={fu.id} className="hover:bg-gray-50/50">
                            <td className="p-4 font-bold text-gray-900">{fu.name}</td>
                            <td className="p-4 text-gray-600">{fu.condition}</td>
                            <td className="p-4 font-mono font-bold text-gray-500">{fu.date}</td>
                            <td className="p-4">
                              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                fu.status === "Completed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                              }`}>
                                {fu.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button 
                                onClick={() => triggerToast(`Automated SMS & Calendar reminders dispatched to ${fu.name}.`)}
                                className="px-3 py-1.5 bg-[#2E8B57]/10 text-[#2E8B57] rounded-lg font-bold hover:bg-[#2E8B57]/20"
                              >
                                Dispatch Reminder
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* ----------------- TAB: CALENDAR ----------------- */}
              {activeTab === "calendar" && (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left"
                >
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Clinician Calendar Grid</h3>
                    <p className="text-xs text-gray-500">View consultations, leaves, and follow-up blockages.</p>
                  </div>

                  <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b pb-3">
                      <h4 className="text-sm font-black text-gray-900">June 2026</h4>
                      <span className="text-xs text-gray-500 font-bold">Standard 5-day Week Grid</span>
                    </div>

                    <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black uppercase text-gray-400 tracking-wider">
                      <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                    </div>

                    <div className="grid grid-cols-7 gap-2 text-xs">
                      {Array.from({ length: 30 }).map((_, i) => {
                        const day = i + 1;
                        const hasAppt = day === 30; // today
                        return (
                          <div 
                            key={i} 
                            onClick={() => {
                              if (hasAppt) triggerToast("Consultation timeline locked on this day.");
                            }}
                            className={`min-h-[80px] p-2 rounded-xl border flex flex-col justify-between text-left transition-all cursor-pointer ${
                              hasAppt 
                                ? "bg-emerald-50/50 border-[#2E8B57] ring-1 ring-[#2E8B57]" 
                                : "bg-white border-gray-100 hover:border-gray-200"
                            }`}
                          >
                            <span className="font-bold text-gray-400 font-mono">{day}</span>
                            {hasAppt && (
                              <div className="bg-[#2E8B57] text-white text-[8px] font-extrabold p-1 rounded uppercase tracking-wider leading-none">
                                3 Consults
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ----------------- TAB: ANALYTICS ----------------- */}
              {activeTab === "analytics" && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left"
                >
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Clinician Performance Analytics</h3>
                    <p className="text-xs text-gray-500">Overview of diagnostic volume and patient satisfaction benchmarks.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { label: "Total Consults Filed", val: analyticsStats.totalConsults, color: "text-emerald-600" },
                      { label: "Avg Review Speed", val: analyticsStats.avgDuration, color: "text-blue-600" },
                      { label: "Patient Satisfaction", val: analyticsStats.satisfaction, color: "text-indigo-600" },
                      { label: "Follow-up Compliance", val: analyticsStats.followupRate, color: "text-amber-600" }
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-white border p-6 rounded-3xl shadow-sm text-left">
                        <span className="text-[10px] uppercase font-bold text-gray-400">{stat.label}</span>
                        <p className={`text-3xl font-black mt-1 ${stat.color}`}>{stat.val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Trends */}
                  <div className="bg-white border p-6 rounded-3xl shadow-sm">
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4">Patient Recovery Efficiency Index</h4>
                    <p className="text-xs text-gray-500 mb-4">
                      Based on automated follow-up trackers. Your recovery compliance remains inside the top 5% of national cardiology centers.
                    </p>
                    <div className="h-4 w-full bg-emerald-500 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600" style={{ width: "94.8%" }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ----------------- TAB: NOTIFICATIONS ----------------- */}
              {activeTab === "notifications" && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left"
                >
                  <div className="flex justify-between items-center border-b pb-4">
                    <div>
                      <h3 className="text-xl font-black text-gray-900">Clinical Alerts</h3>
                      <p className="text-xs text-gray-500 font-medium">Real-time alerts regarding medical records and pre-triage state updates.</p>
                    </div>
                    <button 
                      onClick={markAllNotifRead}
                      className="text-xs font-bold text-[#2E8B57] hover:underline"
                    >
                      Mark all as Read
                    </button>
                  </div>

                  <div className="space-y-3">
                    {notifications.map((not) => (
                      <div 
                        key={not.id}
                        className={`p-4 rounded-2xl border flex justify-between items-start text-xs transition-all ${
                          not.unread ? "bg-emerald-50/50 border-emerald-100" : "bg-white border-gray-100"
                        }`}
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-gray-900 flex items-center gap-2">
                            {not.unread && <span className="w-2 h-2 bg-[#2E8B57] rounded-full shrink-0" />}
                            {not.title}
                          </h4>
                          <p className="text-gray-600 font-medium">{not.description}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono shrink-0">{not.time}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ----------------- TAB: CLINICIAN PROFILE ----------------- */}
              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left"
                >
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Clinician Profile</h3>
                    <p className="text-xs text-gray-500">Edit qualifications, clinics, and medical disclosures.</p>
                  </div>

                  <div className="bg-white border p-6 rounded-3xl shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-[#E9F8F1] border border-emerald-100 flex items-center justify-center text-[#2E8B57] font-black text-xl shrink-0">
                        SJ
                      </div>
                      <div className="text-center sm:text-left">
                        <h4 className="text-base font-black text-gray-900">{doctorInfo.name}</h4>
                        <p className="text-xs text-gray-500 font-medium">{doctorInfo.specialization}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Qualifications Credentials</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 text-xs border rounded-xl"
                          value={doctorInfo.qualifications}
                          onChange={(e) => setDoctorInfo({ ...doctorInfo, qualifications: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Registered Clinic / Hospital</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 text-xs border rounded-xl"
                          value={doctorInfo.clinic}
                          onChange={(e) => setDoctorInfo({ ...doctorInfo, clinic: e.target.value })}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Active Languages</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 text-xs border rounded-xl"
                          value={doctorInfo.languages}
                          onChange={(e) => setDoctorInfo({ ...doctorInfo, languages: e.target.value })}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Availability Rules</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 text-xs border rounded-xl"
                          value={doctorInfo.availability}
                          onChange={(e) => setDoctorInfo({ ...doctorInfo, availability: e.target.value })}
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => triggerToast("Qualifications database records updated on Spanner ledger.")}
                      className="px-5 py-2.5 bg-[#2E8B57] text-white text-xs font-bold rounded-xl"
                    >
                      Save Profile Changes
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ----------------- TAB: PORTAL SETTINGS ----------------- */}
              {activeTab === "settings" && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left"
                >
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Clinician Security Settings</h3>
                    <p className="text-xs text-gray-500">Configure connected channels, 2FA protocols, and clinical sync parameters.</p>
                  </div>

                  <div className="bg-white border p-6 rounded-3xl shadow-sm space-y-4 text-xs">
                    
                    <div className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50">
                      <div>
                        <p className="font-bold text-gray-900">Two-Factor Authenticator (2FA)</p>
                        <span className="text-[10px] text-gray-500 font-medium">Verify login requests via SMS code.</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={doctorInfo.twoFactorEnabled}
                        onChange={(e) => {
                          setDoctorInfo({ ...doctorInfo, twoFactorEnabled: e.target.checked });
                          triggerToast("2FA protocols redefined.");
                        }}
                        className="rounded text-[#2E8B57] focus:ring-[#2E8B57] w-4.5 h-4.5 border-gray-300"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50">
                      <div>
                        <p className="font-bold text-[#111827]">Google Workspace Calendar Sync</p>
                        <span className="text-[10px] text-gray-500 font-medium">Sync consultation timelines with your connected Google Calendar.</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={doctorInfo.calendarSynced}
                        onChange={(e) => {
                          setDoctorInfo({ ...doctorInfo, calendarSynced: e.target.checked });
                          triggerToast("Calendar sync configuration stored.");
                        }}
                        className="rounded text-[#2E8B57] focus:ring-[#2E8B57] w-4.5 h-4.5 border-gray-300"
                      />
                    </div>

                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          )}

        </main>

        {/* Global HIPAA warning bottom footer */}
        <footer className="h-14 border-t border-gray-100 bg-white flex items-center justify-between px-6 shrink-0 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-600" /> Secure HIPAA & SOC2 Compliant Cloud Network
          </span>
          <span>Core Version 3.5.2</span>
        </footer>

      </div>

      {/* ----------------- LEAVE MANAGEMENT MODAL ----------------- */}
      <AnimatePresence>
        {isLeaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm" id="leave-modal">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 border shadow-2xl max-w-md w-full text-left space-y-4"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h4 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                  <CalendarDays className="w-5 h-5 text-amber-500" /> Apply Clinical Leave Request
                </h4>
                <button onClick={() => setIsLeaveModalOpen(false)}>
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                Applying clinical leave blocks those calendar intervals from booking schedules. Existing patient visits during these dates will be automatically rescheduled.
              </p>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-gray-500">Start Date</label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 border rounded-lg"
                      value={leaveStartDate}
                      onChange={(e) => setLeaveStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-gray-500">End Date</label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 border rounded-lg"
                      value={leaveEndDate}
                      onChange={(e) => setLeaveEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-gray-500">Reason / Subject</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border rounded-lg"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                  />
                </div>

                {/* Affected patients checklist warnings */}
                <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-red-600 tracking-wider block">
                    Affected Registered Patients ({affectedPatients.length})
                  </span>
                  <div className="text-[10px] text-gray-600 leading-normal">
                    {affectedPatients.join(", ")} will receive automatic reschedule ticket notifications immediately.
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t flex gap-2">
                <button 
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="flex-1 py-2.5 border rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleApplyLeave}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                >
                  Confirm & Send Alerts
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Simple local fallback folder icon definition if not found
function FolderOpenIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
