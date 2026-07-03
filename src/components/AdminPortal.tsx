/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, Users, Calendar, Clock, Activity, Sparkles, 
  Settings, AlertTriangle, Search, Plus, Trash2, Edit, Shield, 
  FileText, Sliders, BarChart2, Database, Bell, Mail, Lock, 
  RefreshCw, X, CheckCircle2, HelpCircle, Check, ChevronRight, 
  LogOut, Filter, ArrowRight, History, ToggleLeft, Menu, Eye, 
  AlertCircle, ChevronDown, CheckCircle
} from "lucide-react";
import { Doctor, DOCTORS } from "../types";
import { apiFetch } from "./lib/api";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  contact: string;
  lastVisit: string;
  status: "Active" | "Disabled";
  allergies: string;
  notes: string;
}

interface AdminAppointment {
  id: string;
  doctorName: string;
  patientName: string;
  date: string;
  time: string;
  status: "Confirmed" | "Pending" | "Cancelled" | "Completed";
  specialty: string;
}

interface LeaveRequest {
  id: string;
  doctorName: string;
  dateRange: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  affectedCount: number;
}

interface Specialization {
  id: string;
  name: string;
  icon: string;
  description: string;
  doctorCount: number;
}

interface AIJob {
  id: string;
  service: string;
  status: "Completed" | "Failed" | "Running" | "Pending";
  responseTime: string;
  timestamp: string;
}

interface AuditLog {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  ip: string;
  module: string;
}

export default function AdminPortal({ onClose }: { onClose: () => void }) {
  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // UX Simulators for Empty and Error states
  const [isErrorState, setIsErrorState] = useState(false);
  const [isEmptyState, setIsEmptyState] = useState(false);

  // States for Doctor Management
  const [adminDoctors, setAdminDoctors] = useState<Doctor[]>(DOCTORS);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocSpecialty, setNewDocSpecialty] = useState("");
  const [newDocBio, setNewDocBio] = useState("");
  const [newDocHospital, setNewDocHospital] = useState("");

  // States for Patient Management - cleared of mock data
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // States for Appointment Management - cleared of mock data
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [selectedAptFilter, setSelectedAptFilter] = useState("All");
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month">("week");

  // States for Specializations
  const [specializations, setSpecializations] = useState<Specialization[]>([
    { id: "spec-1", name: "Cardiology", icon: "❤️", description: "Preventative heart care and telemetry.", doctorCount: 0 },
    { id: "spec-2", name: "Pediatrics", icon: "👶", description: "Comprehensive children health and development.", doctorCount: 0 },
    { id: "spec-3", name: "Neurology", icon: "🧠", description: "Migraine therapy and cognitive sleep neurology.", doctorCount: 0 }
  ]);
  const [newSpecName, setNewSpecName] = useState("");
  const [newSpecDesc, setNewSpecDesc] = useState("");

  // States for Leave Management - cleared of mock data
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [selectedLeaveReq, setSelectedLeaveReq] = useState<LeaveRequest | null>(null);

  // States for AI Monitoring
  const [aiJobs, setAiJobs] = useState<AIJob[]>([
    { id: "job-01", service: "Symptom Analysis Triage", status: "Completed", responseTime: "1.2s", timestamp: "10:15 AM" },
    { id: "job-02", service: "Patient Post-Visit Summary", status: "Failed", responseTime: "5.4s", timestamp: "10:12 AM" },
    { id: "job-03", service: "EHR Structured Parsing", status: "Running", responseTime: "0.8s", timestamp: "10:18 AM" },
    { id: "job-04", service: "Symptom Analysis Triage", status: "Completed", responseTime: "1.4s", timestamp: "09:55 AM" }
  ]);

  // States for Broadcast Center
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastChannel, setBroadcastChannel] = useState<"all" | "email" | "inapp">("all");
  const [broadcastTemplate, setBroadcastTemplate] = useState("Custom");

  // States for Roles & Permissions Matrix
  const [permissionsMatrix, setPermissionsMatrix] = useState({
    SuperAdmin: { read: true, create: true, update: true, delete: true, export: true },
    Admin: { read: true, create: true, update: true, delete: false, export: true },
    Support: { read: true, create: false, update: true, delete: false, export: false }
  });

  // Security Login Logs States
  const [patientLoginLogs, setPatientLoginLogs] = useState<any[]>([]);
  const [doctorLoginLogs, setDoctorLoginLogs] = useState<any[]>([]);
  const [adminLoginLogs, setAdminLoginLogs] = useState<any[]>([]);
  const [selectedLogType, setSelectedLogType] = useState<"all" | "patient" | "doctor" | "admin">("all");
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  const fetchLoginLogs = async () => {
    try {
      setIsLogsLoading(true);
      const response = await fetch("/api/admin/login-logs");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPatientLoginLogs(data.patientLogins || []);
          setDoctorLoginLogs(data.doctorLogins || []);
          setAdminLoginLogs(data.adminLogins || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch admin login logs:", err);
    } finally {
      setIsLogsLoading(false);
    }
  };

  // Settings State
  const [brandingName, setBrandingName] = useState("CareBridge");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [aiProvider, setAiProvider] = useState("Gemini-2.0-Flash-HIPAA");

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const docRes = await fetch("/api/doctors");
        if (docRes.ok) {
          const docData = await docRes.json();
          if (Array.isArray(docData.doctors)) {
            const mappedDoctors = docData.doctors.map((d: any) => ({
              id: d._id || d.id,
              name: d.name || d.email,
              specialty: d.specialty || "General Medicine",
              rating: d.rating || 5.0,
              reviewsCount: d.reviewsCount || 0,
              image: d.image || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300",
              availability: d.availability || ["Monday", "Wednesday", "Friday"],
              bio: d.bio || "Registered medical specialist.",
              hospital: d.hospital || "CareBridge Medical Center"
            }));
            setAdminDoctors(mappedDoctors);
          }
        }
        
        const patRes = await fetch("/api/patients");
        if (patRes.ok) {
          const patData = await patRes.json();
          if (Array.isArray(patData.patients)) {
            const mappedPatients = patData.patients.map((p: any) => ({
              id: p._id || p.id,
              name: p.name || p.email,
              age: p.age || 35,
              gender: p.gender || "Not specified",
              contact: p.email,
              lastVisit: p.lastVisit || "N/A",
              status: p.status || "Active",
              allergies: p.allergies || "None",
              notes: p.notes || ""
            }));
            setPatients(mappedPatients);
          }
        }

        const apptRes = await fetch("/api/appointments?role=admin&userId=admin");
        if (apptRes.ok) {
          const apptData = await apptRes.json();
          if (Array.isArray(apptData.appointments)) {
            const mappedAppointments = apptData.appointments.map((a: any) => ({
              id: a._id || a.id,
              doctorName: a.doctorName || "General Clinician",
              patientName: a.patientName || "Registered Patient",
              date: a.date,
              time: a.time,
              status: a.status ? (a.status.charAt(0).toUpperCase() + a.status.slice(1)) : "Confirmed",
              specialty: a.specialty || "Primary Care"
            }));
            setAppointments(mappedAppointments);
          }
        }
      } catch (err) {
        console.error("Failed to load real-time admin portal data", err);
      }
    };
    fetchData();
    fetchLoginLogs();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const handleAddDoctorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName || !newDocSpecialty) {
      triggerToast("Doctor name and specialty fields are required.");
      return;
    }
    const newDoc: Doctor = {
      id: `doc-${Date.now()}`,
      name: newDocName,
      specialty: newDocSpecialty,
      rating: 5.0,
      reviewsCount: 0,
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300",
      availability: ["Monday", "Wednesday"],
      bio: newDocBio || "Certified CareBridge practitioner.",
      hospital: newDocHospital || "CareBridge General Clinic"
    };
    setAdminDoctors([newDoc, ...adminDoctors]);
    setNewDocName("");
    setNewDocSpecialty("");
    setNewDocBio("");
    setNewDocHospital("");
    setShowAddDoctorModal(false);
    triggerToast(`Dr. ${newDocName} added to registry.`);
  };

  const toggleDoctorStatus = (docId: string) => {
    triggerToast("Doctor credential status toggled.");
  };

  const deleteDoctor = (docId: string) => {
    setAdminDoctors(adminDoctors.filter(d => d.id !== docId));
    triggerToast("Doctor removed from CareBridge portal.");
  };

  const togglePatientStatus = (patId: string) => {
    setPatients(patients.map(p => {
      if (p.id === patId) {
        const nextStatus = p.status === "Active" ? "Disabled" : "Active";
        triggerToast(`Patient Liam Chen flagged as ${nextStatus}.`);
        return { ...p, status: nextStatus };
      }
      return p;
    }));
  };

  const handleAddSpecialization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecName) return;
    const newSpec: Specialization = {
      id: `spec-${Date.now()}`,
      name: newSpecName,
      icon: "🌟",
      description: newSpecDesc || "General specialty department.",
      doctorCount: 0
    };
    setSpecializations([...specializations, newSpec]);
    setNewSpecName("");
    setNewSpecDesc("");
    triggerToast(`Department ${newSpecName} established.`);
  };

  const handleLeaveDecision = (id: string, status: "Approved" | "Rejected") => {
    setLeaveRequests(leaveRequests.map(r => r.id === id ? { ...r, status } : r));
    triggerToast(`Leave request ${status.toLowerCase()} and schedule auto-adjusted.`);
    setSelectedLeaveReq(null);
  };

  const handleRetryAiJob = (id: string) => {
    setAiJobs(aiJobs.map(j => j.id === id ? { ...j, status: "Running" } : j));
    setTimeout(() => {
      setAiJobs(prev => prev.map(j => j.id === id ? { ...j, status: "Completed" } : j));
      triggerToast("AI job retried and resolved successfully.");
    }, 1500);
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject || !broadcastBody) {
      triggerToast("Please define both subject and message parameters.");
      return;
    }
    triggerToast(`Global broadcast transmitted to patients & doctors via ${broadcastChannel}.`);
    setBroadcastSubject("");
    setBroadcastBody("");
  };

  const applyTemplate = (tpl: string) => {
    setBroadcastTemplate(tpl);
    if (tpl === "reminder") {
      setBroadcastSubject("Upcoming Appointment Health Reminder");
      setBroadcastBody("Hello, this is a CareBridge notification. Please log in to complete your pre-appointment symptom analysis.");
    } else if (tpl === "leave") {
      setBroadcastSubject("Schedule Adjustment Alert");
      setBroadcastBody("Notice: Your primary care doctor has updated their availability calendar. Please review your portal.");
    } else if (tpl === "maintenance") {
      setBroadcastSubject("Platform Maintenance Window Notice");
      setBroadcastBody("CareBridge databases will undergo brief optimization security procedures on Sunday at 02:00 AM UTC.");
    }
  };

  const simulateExport = (format: string) => {
    triggerToast(`Initiating database query... downloaded CareBridge_Report.${format}`);
  };

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "doctors", label: "Doctors", icon: Users },
    { id: "patients", label: "Patients", icon: Users },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "specializations", label: "Specialties", icon: Sliders },
    { id: "leave", label: "Leaves", icon: AlertTriangle, badge: leaveRequests.filter(r => r.status === "Pending").length || undefined },
    { id: "ai", label: "AI Monitoring", icon: Activity },
    { id: "notifications", label: "Broadcasts", icon: Bell },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "audit", label: "Audit Logs", icon: History },
    { id: "roles", label: "Roles", icon: Shield },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "help", label: "Help & Support", icon: HelpCircle }
  ];

  return (
    <div className="fixed inset-0 bg-[#FCFFFD] z-50 overflow-hidden flex flex-col md:flex-row font-sans text-[#111827]" id="admin-portal-root">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-6 left-1/2 z-[100] bg-[#2E8B57] border border-emerald-500 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold"
            id="admin-toast"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR (DESKTOP) */}
      <aside 
        className={`hidden md:flex flex-col bg-white border-r border-[#E5E7EB] h-full transition-all duration-300 relative ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
        id="admin-desktop-sidebar"
      >
        <div className="h-20 border-b border-[#E5E7EB] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 bg-[#2E8B57] text-white rounded-xl flex items-center justify-center font-black text-base shadow-sm shrink-0">
              C
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-[#111827]">{brandingName}</span>
                <span className="text-[9px] text-[#2E8B57] font-bold uppercase tracking-widest leading-none">Admin Suite</span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-grow py-6 px-3 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsErrorState(false);
                  setIsEmptyState(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all relative ${
                  isActive 
                    ? "bg-[#E9F8F1] text-[#2E8B57]" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
                id={`admin-sidebar-tab-${item.id}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#2E8B57]" : "text-gray-400"}`} />
                {!isSidebarCollapsed && <span>{item.label}</span>}
                {isActive && !isSidebarCollapsed && (
                  <div className="absolute right-3 w-1.5 h-5 bg-[#2E8B57] rounded-full" />
                )}
                {item.badge && !isSidebarCollapsed && (
                  <span className="absolute right-4 bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E5E7EB] space-y-2">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full hidden md:flex items-center gap-3 px-4 py-2 text-xs font-semibold text-gray-400 hover:text-gray-700 rounded-xl transition-all"
            id="admin-sidebar-toggle"
          >
            <Sliders className="w-4 h-4" />
            {!isSidebarCollapsed && <span>Toggle View</span>}
          </button>
          
          <button
            onClick={onClose}
            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
            id="admin-sidebar-exit"
          >
            <LogOut className="w-4 h-4" />
            {!isSidebarCollapsed && <span>Exit Suite</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] z-40 grid grid-cols-5 h-16 px-2 shadow-lg">
        {[
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          { id: "doctors", label: "Doctors", icon: Users },
          { id: "appointments", label: "Appts", icon: Calendar },
          { id: "ai", label: "AI", icon: Activity },
          { id: "settings", label: "Config", icon: Settings }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsErrorState(false);
                setIsEmptyState(false);
              }}
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${
                isActive ? "text-[#2E8B57]" : "text-gray-400"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* MAIN CONTAINER */}
      <div className="flex-grow flex flex-col h-full min-w-0 pb-16 md:pb-0 overflow-hidden bg-[#FCFFFD]">
        
        {/* TOP BAR */}
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
                {activeTab}
              </h2>
              <p className="text-[10px] text-gray-400 font-bold tracking-wide">
                Secure Enterprise Cloud Administration Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Simulation controls */}
            <div className="hidden lg:flex items-center gap-2 bg-[#E9F8F1] px-3.5 py-1.5 rounded-2xl border border-emerald-100 text-[10px]">
              <span className="font-extrabold text-emerald-800">SIMULATION MODE:</span>
              <button 
                onClick={() => {
                  setIsErrorState(!isErrorState);
                  setIsEmptyState(false);
                }}
                className={`px-2 py-0.5 rounded font-bold uppercase transition-all ${
                  isErrorState ? "bg-red-500 text-white" : "bg-white text-gray-600"
                }`}
                id="admin-btn-sim-error"
              >
                Error
              </button>
              <button 
                onClick={() => {
                  setIsEmptyState(!isEmptyState);
                  setIsErrorState(false);
                }}
                className={`px-2 py-0.5 rounded font-bold uppercase transition-all ${
                  isEmptyState ? "bg-amber-500 text-white" : "bg-white text-gray-600"
                }`}
                id="admin-btn-sim-empty"
              >
                Empty
              </button>
            </div>

            <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs">
              AD
            </div>
          </div>
        </header>

        {/* MOBILE SLIDE OVER MENU */}
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
                    <span className="font-black text-lg text-[#111827]">Admin Suite Menu</span>
                    <button onClick={() => setIsMobileMenuOpen(false)}>
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  <div className="space-y-1.5 text-left">
                    {sidebarItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                          setIsErrorState(false);
                          setIsEmptyState(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold"
                      >
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={onClose}
                  className="w-full py-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold"
                >
                  Exit Admin Portal
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* INNER SCROLL BODY */}
        <main className="flex-grow p-6 overflow-y-auto max-w-7xl w-full mx-auto" id="admin-main-body">
          
          {/* SIMULATED ERROR */}
          {isErrorState ? (
            <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center p-8 bg-white border border-red-100 rounded-3xl shadow-lg max-w-md mx-auto my-12 text-left" id="admin-error-card">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-100">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-gray-900">Secure Database Shard Offline</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                The CareBridge HIPAA database server was unable to handshake with the primary authentication nodes. Credentials remain safely encrypted.
              </p>
              <button 
                onClick={() => {
                  setIsErrorState(false);
                  triggerToast("HIPAA replication nodes re-engaged successfully.");
                }}
                className="mt-6 w-full py-2.5 bg-[#2E8B57] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Retry Security Tunnel
              </button>
            </div>
          ) : isEmptyState ? (
            
            /* SIMULATED EMPTY */
            <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center p-8 bg-white border border-gray-100 rounded-3xl shadow-sm max-w-md mx-auto my-12" id="admin-empty-card">
              <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4 border border-gray-200">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-gray-900">No Administrative Entries</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                No matching database logs, audit metrics, or clinical registers were returned in this query category.
              </p>
              <button 
                onClick={() => setIsEmptyState(false)}
                className="mt-6 px-6 py-2.5 bg-[#2E8B57] text-white rounded-xl text-xs font-bold"
              >
                Reset Visual Query
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              
              {/* TAB: DASHBOARD */}
              {activeTab === "dashboard" && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  {/* KPI cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left" id="admin-kpi-grid">
                    {[
                      { title: "Total Patients", val: patients.length, change: "+12% Growth" },
                      { title: "Registered Doctors", val: adminDoctors.length, change: "All Verified" },
                      { title: "Today's Appts", val: appointments.length, change: "3 Pending" },
                      { title: "Active Specializations", val: specializations.length, change: "Integrated" }
                    ].map((kpi, i) => (
                      <div key={i} className="bg-white border border-gray-200/80 p-5 rounded-2xl shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{kpi.title}</span>
                        <p className="text-2xl font-black text-gray-900 mt-1">{kpi.val}</p>
                        <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-2 inline-block">
                          {kpi.change}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Visual charts simulator & quick actions */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                    
                    {/* Weekly Utilization Trends */}
                    <div className="lg:col-span-8 bg-white border border-gray-200/80 p-6 rounded-3xl shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b pb-3">
                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Weekly Appointment Trends</h4>
                        <span className="text-[10px] text-gray-400 font-bold">Updated real-time</span>
                      </div>
                      
                      <div className="space-y-3">
                        {[
                          { day: "Cardiology Reviews", count: 84, pct: 100 },
                          { day: "Pediatric Wellness", count: 42, pct: 55 },
                          { day: "Neurology Diagnostics", count: 68, pct: 80 },
                          { day: "General Inquiries", count: 35, pct: 45 }
                        ].map((trend, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-gray-600">{trend.day}</span>
                              <span className="text-gray-900">{trend.count} visits</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-[#2E8B57] h-full rounded-full" style={{ width: `${trend.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick actions box */}
                    <div className="lg:col-span-4 bg-emerald-950 text-white p-6 rounded-3xl shadow-sm space-y-4 relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-800/20 rounded-full blur-2xl" />
                      <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider">Suite Quick Actions</h4>
                      <p className="text-xs text-emerald-100/90 leading-relaxed">
                        Execute master operations directly across CareBridge medical nodes.
                      </p>
                      
                      <div className="space-y-2.5 pt-2">
                        <button 
                          onClick={() => setShowAddDoctorModal(true)}
                          className="w-full py-2.5 bg-white text-emerald-950 font-bold text-xs rounded-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          id="admin-btn-quick-add-doc"
                        >
                          <Plus className="w-4 h-4" /> Add New Doctor
                        </button>
                        <button 
                          onClick={() => setActiveTab("notifications")}
                          className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                          <Bell className="w-4 h-4" /> Broadcast Notice
                        </button>
                        <button 
                          onClick={() => setActiveTab("reports")}
                          className="w-full py-2.5 bg-emerald-900/50 border border-emerald-800 hover:bg-emerald-900 text-emerald-200 font-bold text-xs rounded-xl transition-all"
                        >
                          Generate Reports
                        </button>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* TAB: DOCTOR DIRECTORY */}
              {activeTab === "doctors" && (
                <motion.div
                  key="doctors"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-black text-gray-900">Clinician Registry</h3>
                      <p className="text-xs text-gray-500">Manage verified practitioners, credentials, and profile settings.</p>
                    </div>
                    <button 
                      onClick={() => setShowAddDoctorModal(true)}
                      className="px-4 py-2.5 bg-[#2E8B57] text-white text-xs font-bold rounded-xl hover:bg-[#2E8B57]/90 transition-all flex items-center gap-2"
                      id="admin-btn-add-doc"
                    >
                      <Plus className="w-4 h-4" /> Add Clinician
                    </button>
                  </div>

                  <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">Practitioner Index</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-gray-600">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold border-b">
                          <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Specialty</th>
                            <th className="p-4">Hospital Affiliation</th>
                            <th className="p-4">Rating</th>
                            <th className="p-4">Cred. Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {adminDoctors.map((doc) => (
                            <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                              <td className="p-4 font-bold text-gray-900 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center text-xs">
                                  {doc.name.split(" ").pop()?.charAt(0)}
                                </div>
                                {doc.name}
                              </td>
                              <td className="p-4">{doc.specialty}</td>
                              <td className="p-4 text-gray-500">{doc.hospital}</td>
                              <td className="p-4">★ {doc.rating}</td>
                              <td className="p-4">
                                <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[9px]">
                                  Active Verified
                                </span>
                              </td>
                              <td className="p-4 text-right space-x-1.5">
                                <button 
                                  onClick={() => setSelectedDoctor(doc)}
                                  className="p-1 text-[#2E8B57] hover:bg-[#E9F8F1] rounded"
                                >
                                  <Eye className="w-4 h-4 inline" />
                                </button>
                                <button 
                                  onClick={() => toggleDoctorStatus(doc.id)}
                                  className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                                >
                                  <Sliders className="w-4 h-4 inline" />
                                </button>
                                <button 
                                  onClick={() => deleteDoctor(doc.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="w-4 h-4 inline" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB: PATIENT DIRECTORY */}
              {activeTab === "patients" && (
                <motion.div
                  key="patients"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left"
                >
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Patient Directory</h3>
                    <p className="text-xs text-gray-500">Acknowledge registered medical profiles, disable inactive accounts, and view telemetry.</p>
                  </div>

                  <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-gray-600">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold border-b">
                          <tr>
                            <th className="p-4">Patient Name</th>
                            <th className="p-4">Age / Gender</th>
                            <th className="p-4">Contact</th>
                            <th className="p-4">Last Sync Visit</th>
                            <th className="p-4">Account Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {patients.map((pat) => (
                            <tr key={pat.id} className="hover:bg-gray-50 transition-colors">
                              <td className="p-4 font-bold text-gray-900">{pat.name}</td>
                              <td className="p-4">{pat.age} yrs • {pat.gender}</td>
                              <td className="p-4 text-gray-500">{pat.contact}</td>
                              <td className="p-4">{pat.lastVisit}</td>
                              <td className="p-4">
                                <span className={`font-bold px-2 py-0.5 rounded text-[9px] ${
                                  pat.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                                }`}>
                                  {pat.status}
                                </span>
                              </td>
                              <td className="p-4 text-right space-x-1">
                                <button 
                                  onClick={() => setSelectedPatient(pat)}
                                  className="px-3 py-1 bg-[#E9F8F1] text-[#2E8B57] font-bold text-[10px] rounded hover:bg-emerald-100 transition-all"
                                >
                                  Inspect Records
                                </button>
                                <button 
                                  onClick={() => togglePatientStatus(pat.id)}
                                  className={`px-3 py-1 font-bold text-[10px] rounded border transition-all ${
                                    pat.status === "Active" ? "bg-white text-red-600 border-red-200 hover:bg-red-50" : "bg-white text-emerald-600 border-emerald-200 hover:bg-[#E9F8F1]"
                                  }`}
                                >
                                  {pat.status === "Active" ? "Disable" : "Enable"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB: APPOINTMENT MASTER LIST */}
              {activeTab === "appointments" && (
                <motion.div
                  key="appointments"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-black text-gray-900">Master Consultation Ledger</h3>
                      <p className="text-xs text-gray-500">Track pending bookings, adjust slot durations, and allocate clinics.</p>
                    </div>
                    <div className="flex bg-[#E9F8F1] p-1 rounded-xl">
                      {(["week", "month"] as const).map((view) => (
                        <button
                          key={view}
                          onClick={() => setCalendarView(view)}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase transition-all ${
                            calendarView === view ? "bg-[#2E8B57] text-white" : "text-emerald-800"
                          }`}
                        >
                          {view} Visual
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter and Table */}
                  <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm space-y-4">
                    <div className="p-4 border-b flex flex-wrap gap-2 justify-between items-center">
                      <div className="flex gap-1">
                        {["All", "Confirmed", "Pending", "Cancelled"].map((f) => (
                          <button
                            key={f}
                            onClick={() => setSelectedAptFilter(f)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold ${
                              selectedAptFilter === f ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={() => simulateExport("csv")}
                        className="text-[10px] font-bold text-[#2E8B57] hover:underline"
                      >
                        Export Grid CSV
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-gray-600">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold border-b">
                          <tr>
                            <th className="p-4">Appt ID</th>
                            <th className="p-4">Doctor</th>
                            <th className="p-4">Patient</th>
                            <th className="p-4">Date & Time</th>
                            <th className="p-4">Department</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {appointments
                            .filter(a => selectedAptFilter === "All" || a.status === selectedAptFilter)
                            .map((apt) => (
                              <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-mono font-bold text-gray-500">{apt.id}</td>
                                <td className="p-4 font-bold text-gray-900">{apt.doctorName}</td>
                                <td className="p-4">{apt.patientName}</td>
                                <td className="p-4 text-gray-500">{apt.date} at {apt.time}</td>
                                <td className="p-4">{apt.specialty}</td>
                                <td className="p-4">
                                  <span className={`font-bold px-2 py-0.5 rounded text-[9px] ${
                                    apt.status === "Confirmed" ? "bg-emerald-50 text-emerald-700" :
                                    apt.status === "Pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                                  }`}>
                                    {apt.status}
                                  </span>
                                </td>
                                <td className="p-4 text-right space-x-1">
                                  <button 
                                    onClick={() => {
                                      setAppointments(appointments.map(a => a.id === apt.id ? { ...a, status: "Confirmed" } : a));
                                      triggerToast("Consultation slot confirmed with SMS sync.");
                                    }}
                                    className="px-2 py-1 bg-[#2E8B57] text-white text-[9px] font-bold rounded"
                                  >
                                    Confirm
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setAppointments(appointments.map(a => a.id === apt.id ? { ...a, status: "Cancelled" } : a));
                                      triggerToast("Appointment rescheduled/cancelled.");
                                    }}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 text-[9px] font-bold rounded hover:bg-gray-200"
                                  >
                                    Cancel
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB: SPECIALIZATIONS */}
              {activeTab === "specializations" && (
                <motion.div
                  key="specializations"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Add Spec */}
                    <div className="lg:col-span-4 bg-white border border-gray-200/80 p-6 rounded-2xl shadow-sm h-fit">
                      <h4 className="text-sm font-black text-gray-900 border-b pb-2 mb-4">Establish Department</h4>
                      <form onSubmit={handleAddSpecialization} className="space-y-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-400">Specialty Name</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Dermatology"
                            value={newSpecName}
                            onChange={(e) => setNewSpecName(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-400">Scope Description</label>
                          <textarea 
                            placeholder="Acupuncture, skin treatment, etc."
                            value={newSpecDesc}
                            onChange={(e) => setNewSpecDesc(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg text-xs h-20"
                          />
                        </div>
                        <button 
                          type="submit"
                          className="w-full py-2.5 bg-[#2E8B57] text-white font-bold text-xs rounded-xl hover:bg-[#2E8B57]/90 transition-all"
                        >
                          Create Department Code
                        </button>
                      </form>
                    </div>

                    {/* Department list */}
                    <div className="lg:col-span-8 bg-white border border-gray-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                      <h4 className="text-sm font-black text-gray-900">Operational Clinical Departments</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {specializations.map((spec) => (
                          <div key={spec.id} className="p-4 border rounded-xl flex items-start gap-3">
                            <span className="text-2xl p-2 bg-gray-50 rounded-xl">{spec.icon}</span>
                            <div className="space-y-1">
                              <h5 className="text-xs font-black text-gray-900">{spec.name}</h5>
                              <p className="text-[10px] text-gray-500 leading-relaxed">{spec.description}</p>
                              <span className="text-[9px] font-bold text-[#2E8B57] bg-[#E9F8F1] px-1.5 py-0.2 rounded mt-1 inline-block">
                                {spec.doctorCount} Doctors Assigned
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB: LEAVE MANAGEMENT */}
              {activeTab === "leave" && (
                <motion.div
                  key="leave"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left"
                >
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Clinician Leave & Agenda Board</h3>
                    <p className="text-xs text-gray-500">Conflict-detection algorithm automatically counts patients affected before confirming leave.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {leaveRequests.map((req) => (
                      <div key={req.id} className="bg-white border border-gray-200/80 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-gray-900">{req.doctorName}</h4>
                            <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              req.status === "Pending" ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700"
                            }`}>
                              {req.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium">Requested Period: <strong className="text-gray-700">{req.dateRange}</strong></p>
                          <p className="text-xs text-gray-600">Reason: "{req.reason}"</p>
                          
                          <div className="p-2 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-lg border border-amber-200/60 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Conflict Warning: {req.affectedCount} appointments exist during this leave period.</span>
                          </div>
                        </div>

                        {req.status === "Pending" ? (
                          <div className="flex gap-2 w-full md:w-auto">
                            <button 
                              onClick={() => setSelectedLeaveReq(req)}
                              className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700"
                            >
                              Resolve Conflicts & Approve
                            </button>
                            <button 
                              onClick={() => handleLeaveDecision(req.id, "Rejected")}
                              className="px-4 py-2 border border-gray-200 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-50"
                            >
                              Reject Request
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-gray-400">Leave decision filed</span>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* TAB: AI MONITORING */}
              {activeTab === "ai" && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left"
                >
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="admin-ai-metrics">
                    {[
                      { l: "Processed Jobs Today", v: "1,402", c: "99.2% Success" },
                      { l: "Avg Model Response", v: "1.12 seconds", c: "Gemini HIPAA cluster" },
                      { l: "Active Pipeline Stream", v: "Online", c: "Dual-TLS Security" },
                      { l: "Failed Pre-Triage Jobs", v: aiJobs.filter(j => j.status === "Failed").length, c: "Needs manual retry" }
                    ].map((m, i) => (
                      <div key={i} className="bg-white border border-gray-200/80 p-5 rounded-2xl shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-gray-400">{m.l}</span>
                        <p className="text-xl font-black text-gray-900 mt-1">{m.v}</p>
                        <span className="text-[9px] font-bold text-emerald-700 mt-2 block">{m.c}</span>
                      </div>
                    ))}
                  </div>

                  {/* Queue table */}
                  <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b flex justify-between items-center">
                      <span className="text-xs font-black uppercase text-gray-400">AI Diagnostic Queue Streams</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-gray-600">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold border-b">
                          <tr>
                            <th className="p-4">Queue ID</th>
                            <th className="p-4">NLP/ML Core Service</th>
                            <th className="p-4">Processing Time</th>
                            <th className="p-4">Sync Timestamp</th>
                            <th className="p-4">State</th>
                            <th className="p-4 text-right">Emergency Retry</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {aiJobs.map((job) => (
                            <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                              <td className="p-4 font-mono text-gray-500">{job.id}</td>
                              <td className="p-4 font-bold text-gray-900">{job.service}</td>
                              <td className="p-4">{job.responseTime}</td>
                              <td className="p-4 text-gray-500">{job.timestamp}</td>
                              <td className="p-4">
                                <span className={`font-bold px-2 py-0.5 rounded text-[9px] ${
                                  job.status === "Completed" ? "bg-emerald-50 text-emerald-700" :
                                  job.status === "Failed" ? "bg-red-50 text-red-700 animate-pulse" : "bg-blue-50 text-blue-700"
                                }`}>
                                  {job.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                {job.status === "Failed" && (
                                  <button 
                                    onClick={() => handleRetryAiJob(job.id)}
                                    className="px-3 py-1 bg-[#2E8B57] text-white text-[10px] font-bold rounded-lg"
                                  >
                                    Retry NLP Cluster
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB: NOTIFICATIONS CENTER (BROADCAST) */}
              {activeTab === "notifications" && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Presets */}
                    <div className="lg:col-span-4 bg-white border border-gray-200/80 p-6 rounded-2xl shadow-sm h-fit space-y-4">
                      <h4 className="text-sm font-black text-gray-900">Broadcast Presets</h4>
                      <div className="space-y-2">
                        {[
                          { id: "custom", label: "Custom Slate Draft", desc: "Write from scratch" },
                          { id: "reminder", label: "Pre-Appointment Triage", desc: "Encourage symptom analysis" },
                          { id: "leave", label: "Clinician Agenda Notice", desc: "Notify patients of schedule updates" },
                          { id: "maintenance", label: "System Security Window", desc: "Maintenance procedures notice" }
                        ].map((tpl) => (
                          <button
                            key={tpl.id}
                            onClick={() => applyTemplate(tpl.id)}
                            className={`w-full p-3 rounded-xl border text-left transition-all ${
                              broadcastTemplate === tpl.id ? "bg-[#E9F8F1] border-[#2E8B57]" : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <h5 className="text-xs font-black text-gray-900">{tpl.label}</h5>
                            <p className="text-[10px] text-gray-500 mt-0.5">{tpl.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Editor */}
                    <div className="lg:col-span-8 bg-white border border-gray-200/80 p-6 rounded-2xl shadow-sm">
                      <h4 className="text-sm font-black text-gray-900 border-b pb-2 mb-4">Transmission Console</h4>
                      
                      <form onSubmit={handleSendBroadcast} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-400">Subject / Header Title</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Critical weather advisory/Platform update"
                            value={broadcastSubject}
                            onChange={(e) => setBroadcastSubject(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-400">Main Message Content</label>
                          <textarea 
                            required
                            placeholder="Type important patient notification rules here..."
                            value={broadcastBody}
                            onChange={(e) => setBroadcastBody(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg text-xs h-36"
                          />
                        </div>
                        
                        <div className="flex flex-wrap gap-4 items-center justify-between pt-2">
                          <div className="space-x-1.5">
                            {(["all", "email", "inapp"] as const).map((channel) => (
                              <button
                                key={channel}
                                type="button"
                                onClick={() => setBroadcastChannel(channel)}
                                className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                  broadcastChannel === channel ? "bg-[#2E8B57] text-white" : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {channel}
                              </button>
                            ))}
                          </div>

                          <button 
                            type="submit"
                            className="px-6 py-2.5 bg-[#2E8B57] hover:bg-[#2E8B57]/90 text-white font-black text-xs rounded-xl transition-all"
                          >
                            Transmit Global Broadcast
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB: REPORTS */}
              {activeTab === "reports" && (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left"
                >
                  <div className="bg-white border border-gray-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-gray-900 border-b pb-2">Generate Analytics PDF / Spreadsheet</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      {[
                        { title: "Appointment Compliance Ledger", desc: "Audit completed, missed, or rescheduled consults." },
                        { title: "Clinician Performance & Ratings", desc: "Examine satisfaction index and total consultation hours." },
                        { title: "Registered Cohort Metrics", desc: "Chart overall growth timelines for patients." }
                      ].map((rep, idx) => (
                        <div key={idx} className="p-4 border rounded-xl space-y-3 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-black text-gray-900">{rep.title}</h4>
                            <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{rep.desc}</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => simulateExport("pdf")}
                              className="flex-1 py-1.5 bg-[#2E8B57] text-white text-[10px] font-bold rounded hover:bg-emerald-700"
                            >
                              PDF Download
                            </button>
                            <button 
                              onClick={() => simulateExport("csv")}
                              className="flex-1 py-1.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded hover:bg-gray-200"
                            >
                              CSV File
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB: AUDIT LOGS */}
              {activeTab === "audit" && (
                <motion.div
                  key="audit"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left"
                >
                  <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 bg-gray-50 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-black uppercase text-gray-400">HIPAA Security & Access Logs</span>
                        <h3 className="text-lg font-black text-gray-900 mt-1">Unified Authentication Auditing</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => fetchLoginLogs()}
                          disabled={isLogsLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border rounded-xl hover:bg-gray-50 transition active:scale-95 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isLogsLoading ? "animate-spin" : ""}`} />
                          Sync Logs
                        </button>
                      </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="p-4 border-b bg-white flex flex-wrap gap-2">
                      {[
                        { id: "all", label: "All Logs" },
                        { id: "patient", label: "Patient Logins" },
                        { id: "doctor", label: "Doctor Logins" },
                        { id: "admin", label: "Admin Logins" },
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setSelectedLogType(type.id as any)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                            selectedLogType === type.id
                              ? "bg-[#2E8B57] text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-gray-600">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold border-b">
                          <tr>
                            <th className="p-4">Accessor Email / ID</th>
                            <th className="p-4">System Role</th>
                            <th className="p-4">Auth Status</th>
                            <th className="p-4">Platform & Device</th>
                            <th className="p-4">Secure IP</th>
                            <th className="p-4">Audit Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {(() => {
                            let combinedLogs: any[] = [];
                            if (selectedLogType === "all" || selectedLogType === "patient") {
                              combinedLogs.push(...patientLoginLogs.map(l => ({ ...l, type: "patient", targetId: l.patientId })));
                            }
                            if (selectedLogType === "all" || selectedLogType === "doctor") {
                              combinedLogs.push(...doctorLoginLogs.map(l => ({ ...l, type: "doctor", targetId: l.doctorId })));
                            }
                            if (selectedLogType === "all" || selectedLogType === "admin") {
                              combinedLogs.push(...adminLoginLogs.map(l => ({ ...l, type: "admin", email: l.adminEmail, targetId: l.sessionId })));
                            }

                            // Sort combined logs by timestamp desc
                            combinedLogs.sort((a, b) => new Date(b.loginTimestamp).getTime() - new Date(a.loginTimestamp).getTime());

                            if (combinedLogs.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} className="p-8 text-center text-gray-400">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                    No authentication audit logs found in this category.
                                  </td>
                                </tr>
                              );
                            }

                            return combinedLogs.map((log, idx) => {
                              const isSuccess = log.status === "success";
                              return (
                                <tr key={idx} className="hover:bg-gray-50/50 transition">
                                  <td className="p-4">
                                    <div className="font-bold text-gray-900">{log.email || "system-admin"}</div>
                                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {log.targetId || "unknown"}</div>
                                  </td>
                                  <td className="p-4">
                                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${
                                      log.type === "admin"
                                        ? "bg-red-50 text-red-700 border border-red-100"
                                        : log.type === "doctor"
                                        ? "bg-blue-50 text-blue-700 border border-blue-100"
                                        : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    }`}>
                                      {log.type}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`w-2 h-2 rounded-full ${isSuccess ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                                      <span className={`font-black uppercase text-[10px] ${isSuccess ? "text-emerald-700" : "text-red-700"}`}>
                                        {log.status}
                                      </span>
                                    </div>
                                    {log.failedReason && (
                                      <div className="text-[10px] text-red-500 mt-1 max-w-[200px] truncate" title={log.failedReason}>
                                        {log.failedReason}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-4">
                                    <div className="text-gray-800">{log.browser || "Unknown Browser"}</div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">{log.os || "Unknown OS"} • {log.device || "Desktop"}</div>
                                  </td>
                                  <td className="p-4 font-mono text-[11px] text-gray-500">{log.ipAddress || log.ip || "127.0.0.1"}</td>
                                  <td className="p-4 text-gray-500">
                                    <div>{log.loginTimestamp ? new Date(log.loginTimestamp).toLocaleDateString() : "N/A"}</div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">{log.loginTimestamp ? new Date(log.loginTimestamp).toLocaleTimeString() : ""}</div>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB: ROLES & PERMISSIONS */}
              {activeTab === "roles" && (
                <motion.div
                  key="roles"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left"
                >
                  <div className="bg-white border border-gray-200/80 p-6 rounded-2xl shadow-sm">
                    <h3 className="text-sm font-black text-gray-900 border-b pb-2 mb-4">Enterprise Role-Based Access Matrix</h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-gray-600">
                        <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase border-b">
                          <tr>
                            <th className="p-4">Profile Role</th>
                            <th className="p-4">Read Node</th>
                            <th className="p-4">Create Node</th>
                            <th className="p-4">Update State</th>
                            <th className="p-4">Delete Record</th>
                            <th className="p-4">Export CSV</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {Object.entries(permissionsMatrix).map(([roleName, rawPerms]) => {
                            const perms = rawPerms as { read: boolean; create: boolean; update: boolean; delete: boolean; export: boolean };
                            return (
                              <tr key={roleName} className="hover:bg-gray-50">
                                <td className="p-4 font-black text-gray-900">{roleName}</td>
                                {[
                                  { key: "read", val: perms.read },
                                  { key: "create", val: perms.create },
                                  { key: "update", val: perms.update },
                                  { key: "delete", val: perms.delete },
                                  { key: "export", val: perms.export }
                                ].map((item) => (
                                  <td key={item.key} className="p-4">
                                    <button
                                      onClick={() => {
                                        setPermissionsMatrix({
                                          ...permissionsMatrix,
                                          [roleName]: {
                                            ...perms,
                                            [item.key]: !item.val
                                          }
                                        });
                                        triggerToast(`Security policy updated for ${roleName}.`);
                                      }}
                                      className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                                        item.val ? "bg-[#E9F8F1] border-[#2E8B57] text-[#2E8B57]" : "border-gray-200"
                                      }`}
                                    >
                                      {item.val && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB: SETTINGS */}
              {activeTab === "settings" && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left max-w-xl"
                >
                  <div className="bg-white border border-gray-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-gray-900 border-b pb-2">Global Suite Adjustments</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400">Clinic White-Label Branding Name</label>
                        <input 
                          type="text"
                          value={brandingName}
                          onChange={(e) => setBrandingName(e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400">AI Symptom Model Engine Provider</label>
                        <select 
                          value={aiProvider}
                          onChange={(e) => {
                            setAiProvider(e.target.value);
                            triggerToast("Clinical AI provider adjusted.");
                          }}
                          className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                        >
                          <option value="Gemini-2.0-Flash-HIPAA">Gemini 2.0 Flash (HIPAA Compliant)</option>
                          <option value="Gemini-1.5-Pro">Gemini 1.5 Pro (Clinical Fine-tune)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <span className="text-xs font-black text-gray-900 block">Clinic Maintenance Mode</span>
                          <p className="text-[10px] text-gray-500 mt-0.5">Locks patient login screens temporarily during backups.</p>
                        </div>
                        <button
                          onClick={() => {
                            setMaintenanceMode(!maintenanceMode);
                            triggerToast(`Maintenance status adjusted to: ${!maintenanceMode}`);
                          }}
                          className={`w-12 h-6 rounded-full p-1 transition-colors ${
                            maintenanceMode ? "bg-red-500" : "bg-gray-200"
                          }`}
                        >
                          <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${
                            maintenanceMode ? "translate-x-6" : ""
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB: HELP */}
              {activeTab === "help" && (
                <motion.div
                  key="help"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left max-w-2xl"
                >
                  <div className="bg-white border border-gray-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-gray-900 border-b pb-2">Support Portal & System Health</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl space-y-1 border">
                        <span className="text-xs font-black text-gray-900">CareBridge Core Engine</span>
                        <p className="text-[10px] text-gray-500">Version 3.4.1 (Stable Release)</p>
                        <span className="text-[9px] font-extrabold text-emerald-700 uppercase bg-emerald-100/50 px-1.5 py-0.2 rounded mt-2 inline-block">
                          SYSTEM HEALTHY
                        </span>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-xl space-y-1 border">
                        <span className="text-xs font-black text-gray-900">Need Enterprise Assistance?</span>
                        <p className="text-[10px] text-gray-500">Call CareBridge Cloud Support 24/7</p>
                        <span className="text-[9px] font-bold text-gray-600 bg-gray-200 px-1.5 py-0.2 rounded mt-2 inline-block">
                          support@carebridge.com
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          )}

        </main>
      </div>

      {/* ----------------- MODAL: LEAVE CONFLICT RESOLUTION ----------------- */}
      <AnimatePresence>
        {selectedLeaveReq && (
          <>
            <div 
              onClick={() => setSelectedLeaveReq(null)}
              className="fixed inset-0 bg-black/40 z-[90]" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white p-6 rounded-3xl shadow-2xl z-[100] text-left space-y-4"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h4 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                  <AlertTriangle className="text-amber-500 w-5 h-5" /> Resolve Schedule Conflicts
                </h4>
                <button onClick={() => setSelectedLeaveReq(null)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-600 leading-relaxed">
                  Approving leave for <strong>{selectedLeaveReq.doctorName}</strong> will affect <strong>{selectedLeaveReq.affectedCount}</strong> appointments.
                </p>
                <div className="p-3 bg-[#E9F8F1] border border-emerald-100 rounded-xl">
                  <span className="text-[9px] uppercase font-bold text-emerald-800">AUTOMATED ENVELOPE PROTOCOL:</span>
                  <p className="text-[10px] text-gray-600 mt-1">
                    CareBridge will automatically notify the affected roster via SMS and Email to reschedule in their Patient Portals. No manual rescheduling is required.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => handleLeaveDecision(selectedLeaveReq.id, "Approved")}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Approve & Notify Patients
                </button>
                <button
                  onClick={() => setSelectedLeaveReq(null)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL: ADD CLINICIAN ----------------- */}
      <AnimatePresence>
        {showAddDoctorModal && (
          <>
            <div 
              onClick={() => setShowAddDoctorModal(false)}
              className="fixed inset-0 bg-black/40 z-[90]" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white p-6 rounded-3xl shadow-2xl z-[100] text-left space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h4 className="text-sm font-black text-gray-900">Add New Clinician</h4>
                <button onClick={() => setShowAddDoctorModal(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleAddDoctorSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Doctor Full Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Dr. Marcus Vance"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    className="w-full p-2 border rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Specialty</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Pediatrician / Neurologist"
                    value={newDocSpecialty}
                    onChange={(e) => setNewDocSpecialty(e.target.value)}
                    className="w-full p-2 border rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Hospital/Clinic Branch</label>
                  <input 
                    type="text"
                    placeholder="e.g. St. Jude Children's Clinic"
                    value={newDocHospital}
                    onChange={(e) => setNewDocHospital(e.target.value)}
                    className="w-full p-2 border rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Clinician Bio/Credentials</label>
                  <textarea 
                    placeholder="Brief description of board qualifications..."
                    value={newDocBio}
                    onChange={(e) => setNewDocBio(e.target.value)}
                    className="w-full p-2 border rounded-lg text-xs h-20"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#2E8B57] text-white font-bold text-xs rounded-xl hover:bg-[#2E8B57]/90 transition-all"
                >
                  Register Clinician Profile
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL: VIEW CLINICIAN DETAIL ----------------- */}
      <AnimatePresence>
        {selectedDoctor && (
          <>
            <div 
              onClick={() => setSelectedDoctor(null)}
              className="fixed inset-0 bg-black/40 z-[90]" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white p-6 rounded-3xl shadow-2xl z-[100] text-left space-y-4"
            >
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="text-sm font-black text-gray-900">Clinician Credentials Panel</h4>
                <button onClick={() => setSelectedDoctor(null)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
                    {selectedDoctor.name.charAt(4)}
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-gray-900">{selectedDoctor.name}</h5>
                    <p className="text-[11px] text-gray-500">{selectedDoctor.specialty} • FACC Certified</p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                  <span className="text-[8px] uppercase font-bold text-gray-400 block">Biography / Scope of Practice</span>
                  <p className="text-xs text-gray-700 leading-relaxed">"{selectedDoctor.bio}"</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[8px] uppercase font-bold text-gray-400 block">Assigned Clinic</span>
                    <strong className="text-gray-700 text-[11px]">{selectedDoctor.hospital}</strong>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-bold text-gray-400 block">Weekly Availability</span>
                    <strong className="text-[#2E8B57] text-[11px]">{selectedDoctor.availability.join(", ")}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedDoctor(null)}
                className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl"
              >
                Close Profile Inspection
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL: VIEW PATIENT DETAIL ----------------- */}
      <AnimatePresence>
        {selectedPatient && (
          <>
            <div 
              onClick={() => setSelectedPatient(null)}
              className="fixed inset-0 bg-black/40 z-[90]" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white p-6 rounded-3xl shadow-2xl z-[100] text-left space-y-4"
            >
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="text-sm font-black text-gray-900">Patient Diagnostic Timeline</h4>
                <button onClick={() => setSelectedPatient(null)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <h5 className="text-sm font-black text-gray-900">{selectedPatient.name}</h5>
                  <p className="text-[11px] text-gray-400">Account status: <strong>{selectedPatient.status}</strong></p>
                </div>

                <div className="p-3 bg-red-50 text-red-800 rounded-xl space-y-1 border border-red-100">
                  <span className="text-[8px] uppercase font-bold text-red-500 block">Allergies Warning</span>
                  <p className="text-xs font-bold">"{selectedPatient.allergies}"</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[8px] uppercase font-bold text-gray-400 block">Recent Consultations History</span>
                  <div className="border-l-2 border-[#2E8B57] pl-3 py-1 space-y-2">
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-bold text-gray-900">Preventative Heart Assessment</p>
                      <p className="text-[10px] text-gray-500">Completed on {selectedPatient.lastVisit}</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedPatient(null)}
                className="w-full py-2 bg-gray-900 text-white font-bold text-xs rounded-xl"
              >
                Close Records
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
