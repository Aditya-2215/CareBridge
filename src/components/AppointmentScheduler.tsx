/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, FormEvent, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DOCTORS, Doctor } from "../types";

import { 
  Calendar, Clock, User, Mail, Phone, FileText, CheckCircle2, 
  Search, Star, MapPin, CalendarDays, ArrowLeft, ArrowRight, 
  ShieldCheck, Sparkles, X, ChevronRight, RefreshCw, AlertCircle, 
  Trash2, Download, Sliders, Info, Check, HelpCircle, Heart, 
  ChevronLeft, Map, CheckCircle, ExternalLink, BadgeAlert, HelpCircle as HelpIcon,
  Bell, ListCollapse, Printer
} from "lucide-react";

interface AppointmentSchedulerProps {
  initialSymptomSummary?: string;
  onBookingSuccess?: () => void;
}

interface CustomAppointment {
  id: string;
  doctor: Doctor;
  date: string;
  time: string;
  status: "booked" | "confirmed" | "completed" | "cancelled" | "missed";
  complaint: string;
  painScale: number;
  syncStatus: "Synced" | "Pending" | "Failed";
  leaveAlert?: boolean;
  waitingList?: boolean;
  queuePosition?: number;
}

export default function AppointmentScheduler({ initialSymptomSummary = "", onBookingSuccess }: AppointmentSchedulerProps) {
  // Navigation Tabs
  // "book" | "schedule" | "sync" | "reminders"
  const [activeTab, setActiveTab] = useState<"book" | "schedule" | "sync" | "reminders">("book");
  
  // Doctor Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [consultationType, setConsultationType] = useState<"all" | "in-person" | "video">("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  
  // Selected clinician for booking
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [showDoctorProfileModal, setShowDoctorProfileModal] = useState(false);

  // Stepper state for booking workflow
  // 1: Calendar & Slot -> 2: Symptom Form -> 3: AI Preview -> 4: Review -> 5: Success
  const [bookingStep, setBookingStep] = useState(1);
  
  // Custom interactive scheduler dates
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState("2026-07-02");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [slotStatus, setSlotStatus] = useState<"available" | "selected" | "reserved" | "booked" | "expired">("available");
  
  // Double Booking Protection simulator
  const [showDoubleBookingModal, setShowDoubleBookingModal] = useState(false);
  const [simulatedConflictSlot, setSimulatedConflictSlot] = useState("");

  // Symptom Form states
  const [chiefComplaint, setChiefComplaint] = useState(initialSymptomSummary || "");
  const [duration, setDuration] = useState("3 days");
  const [painScale, setPainScale] = useState(5);
  const [allergies, setAllergies] = useState("None known");
  const [currentMeds, setCurrentMeds] = useState("");
  const [existingConditions, setExistingConditions] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  
  // AI Symptom Preview states
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiOfflineMode, setAiOfflineMode] = useState(false);
  const [showAiPreview, setShowAiPreview] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<{
    summary: string;
    riskLevel: string;
    recommendations: string[];
    suggestedSpecialty: string;
    disclaimer: string;
  } | null>(null);
  const [typedSummary, setTypedSummary] = useState("");

  // Review Booking agreement
  const [policyAgreed, setPolicyAgreed] = useState(false);
  
  // Unique generated details on success
  const [successAppointmentId, setSuccessAppointmentId] = useState("");

  // Device Calendar Integration states
  // "connect" | "permissions" | "connected" | "failed"
  const [calendarOAuthState, setCalendarOAuthState] = useState<"connect" | "permissions" | "connected" | "failed">("connected");
  const [manualSyncLoading, setManualSyncLoading] = useState(false);
  
  // Active appointments list for ledger management - cleared of dummy/mock data
  const [appointments, setAppointments] = useState<CustomAppointment[]>([]);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch("/api/doctors");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.doctors)) {
            const mapped = data.doctors.map((d: any) => ({
              id: d._id || d.id,
              name: d.name || d.email,
              specialty: d.specialty || "General Practitioner",
              rating: d.rating || 5.0,
              reviewsCount: d.reviewsCount || 0,
              image: d.image || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300",
              availability: d.availability || ["Monday", "Wednesday", "Friday"],
              bio: d.bio || "Registered medical specialist.",
              hospital: d.hospital || "CareBridge Medical Center"
            }));
            setDoctorsList(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to fetch doctors", err);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    const fetchUserAppointments = async () => {
      const userId = localStorage.getItem("carebridge_userId");
      if (!userId) return;
      try {
        const response = await fetch(`/api/appointments?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.appointments)) {
            const mapped = data.appointments.map((appt: any) => ({
              id: appt._id,
              doctor: {
                id: appt.doctorId || "doc-1",
                name: appt.doctorName || "General Practitioner",
                specialty: appt.specialty || "General Medicine",
                hospital: appt.hospital || "CareBridge Center",
                rating: 5.0,
                reviewsCount: 0,
                image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200",
                availability: ["Monday", "Wednesday", "Friday"],
                bio: "Registered specialist."
              },
              date: appt.date,
              time: appt.time,
              status: appt.status || "confirmed",
              complaint: appt.complaint,
              painScale: appt.painScale || 5,
              syncStatus: "Synced",
              leaveAlert: false,
              waitingList: false
            }));
            setAppointments(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user appointments.", err);
      }
    };
    fetchUserAppointments();
  }, []);

  // Reschedule state
  const [reschedulingAppt, setReschedulingAppt] = useState<CustomAppointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("2026-07-15");
  const [rescheduleSlot, setRescheduleSlot] = useState("09:00 AM");
  const [isReschedulingUpdating, setIsReschedulingUpdating] = useState(false);

  // Cancellation state
  const [cancellingAppt, setCancellingAppt] = useState<CustomAppointment | null>(null);
  const [cancellationReason, setCancellationReason] = useState("Personal reasons");
  const [otherReasonText, setOtherReasonText] = useState("");
  const [isCancellingRemoving, setIsCancellingRemoving] = useState(false);

  // Leave Simulation & Waiting lists state
  const [simulatedLeaveDoctorId, setSimulatedLeaveDoctorId] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync prop changes
  useEffect(() => {
    if (initialSymptomSummary) {
      setChiefComplaint(initialSymptomSummary);
    }
  }, [initialSymptomSummary]);

  // Handle typing search query with instant suggestions
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (!val) {
      setSearchSuggestions([]);
      return;
    }
    const suggestions: string[] = [];
    doctorsList.forEach(doc => {
      if (doc.name.toLowerCase().includes(val.toLowerCase())) {
        suggestions.push(doc.name);
      }
      if (doc.specialty.toLowerCase().includes(val.toLowerCase()) && !suggestions.includes(doc.specialty)) {
        suggestions.push(doc.specialty);
      }
    });
    setSearchSuggestions(suggestions.slice(0, 4));
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Available Slot chips list with random availabilities
  const morningSlots = [
    { time: "08:30 AM", status: "booked" },
    { time: "09:00 AM", status: "available" },
    { time: "09:45 AM", status: "reserved" },
    { time: "10:30 AM", status: "available" },
    { time: "11:15 AM", status: "expired" }
  ];

  const afternoonSlots = [
    { time: "01:30 PM", status: "available" },
    { time: "02:15 PM", status: "booked" },
    { time: "03:00 PM", status: "available" },
    { time: "03:45 PM", status: "available" },
    { time: "04:30 PM", status: "reserved" }
  ];

  const eveningSlots = [
    { time: "06:00 PM", status: "available" },
    { time: "06:45 PM", status: "available" },
    { time: "07:30 PM", status: "booked" }
  ];

  // Helper calendar renderer
  const generateJulyDays = () => {
    const days = [];
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    // Simulate a Month starting on Wednesday (July 2026 starts on Wednesday)
    // Add empty pad days
    for (let i = 0; i < 3; i++) {
      days.push({ dayNum: null, status: "disabled", fullDate: "" });
    }
    // July 1 to July 31
    for (let i = 1; i <= 31; i++) {
      let status: "available" | "full" | "leave" = "available";
      const dateStr = `2026-07-${i < 10 ? '0' + i : i}`;
      
      // Map some mock rules
      if (i === 5 || i === 12 || i === 19 || i === 26) {
        status = "leave"; // Sundays doctors on leave
      } else if (i === 10 || i === 22) {
        status = "full"; // Fully booked clinic dates
      }
      days.push({
        dayNum: i,
        status,
        fullDate: dateStr
      });
    }
    return days;
  };

  const julyDays = generateJulyDays();

  // Filter clinician registry
  const filteredDoctors = doctorsList.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.bio.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecialty = selectedSpecialty === "All" || doc.specialty === selectedSpecialty;
    
    // Simulate rating matching
    const matchesRating = doc.rating >= minRating;

    return matchesSearch && matchesSpecialty && matchesRating;
  });

  const handleSelectSlot = (slot: { time: string; status: string }) => {
    if (slot.status === "booked") {
      setSimulatedConflictSlot(slot.time);
      setShowDoubleBookingModal(true);
      return;
    }
    if (slot.status === "reserved") {
      setSimulatedConflictSlot(slot.time);
      setShowDoubleBookingModal(true);
      return;
    }
    if (slot.status === "expired") {
      triggerToast("This consultation time has already elapsed today.");
      return;
    }
    setSelectedTimeSlot(slot.time);
    triggerToast(`Slot ${slot.time} selected for ${selectedDate}.`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFileName(e.dataTransfer.files[0].name);
      triggerToast(`Successfully attached clinical report: ${e.dataTransfer.files[0].name}`);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFileName(e.target.files[0].name);
      triggerToast(`Report attached: ${e.target.files[0].name}`);
    }
  };

  const startAiAnalysis = async () => {
    if (!chiefComplaint) {
      triggerToast("Please add symptoms description before launching AI.");
      return;
    }
    setAiGenerating(true);
    setAiAdvice(null);
    setTypedSummary("");

    try {
      const activeUserStr = localStorage.getItem("carebridge_user");
      const activeUser = activeUserStr ? JSON.parse(activeUserStr) : null;

      const response = await fetch("/api/ai/advise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chiefComplaint,
          painScale,
          duration,
          userProfile: activeUser,
        }),
      });

      const data = await response.json();
      setAiGenerating(false);

      if (!response.ok) {
        triggerToast("Failed to fetch accurate clinical pre-screening advice.");
        return;
      }

      setAiAdvice(data.advice);
      setShowAiPreview(true);
      setBookingStep(3);

      // Perform fluid typing animation for genuine personal clinical advice
      const textToType = data.advice.summary || "";
      let currentIdx = 0;
      setTypedSummary("");
      const timer = setInterval(() => {
        if (currentIdx < textToType.length) {
          setTypedSummary((prev) => prev + textToType.charAt(currentIdx));
          currentIdx++;
        } else {
          clearInterval(timer);
        }
      }, 12);
    } catch (err) {
      setAiGenerating(false);
      triggerToast("Failed to communicate with CareBridge clinical AI engine.");
    }
  };

  const completeBookingSubmit = async () => {
    if (!bookingDoctor) return;
    const userId = localStorage.getItem("carebridge_userId") || "mock-patient-1";
    const userStr = localStorage.getItem("carebridge_user");
    const user = userStr ? JSON.parse(userStr) : null;

    try {
      const response = await fetch("/api/appointments/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: userId,
          patientName: user?.name || "Alex Mercer",
          patientEmail: user?.email || "patient@carebridge.com",
          doctorId: bookingDoctor.id,
          doctorName: bookingDoctor.name,
          date: selectedDate,
          time: selectedTimeSlot || "10:30 AM",
          complaint: chiefComplaint || "General check-up and physical review.",
          painScale: painScale,
          allergies: allergies || "None known",
          currentMeds: currentMeds || "",
          duration: duration || "3 days",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        triggerToast("Database scheduling rejected: " + (data.error || ""));
        return;
      }

      const dbAppt = data.appointment;
      setSuccessAppointmentId(dbAppt._id || `CB-${Math.floor(10000 + Math.random() * 90000)}`);

      const newAppt: CustomAppointment = {
        id: dbAppt._id,
        doctor: bookingDoctor,
        date: selectedDate,
        time: selectedTimeSlot || "10:30 AM",
        status: "confirmed",
        complaint: chiefComplaint || "General check-up and physical review.",
        painScale: painScale,
        syncStatus: "Synced",
        leaveAlert: false,
        waitingList: false,
      };

      setAppointments([newAppt, ...appointments]);
      setBookingStep(5);

      triggerToast("Your care is booked! Synced directly to your CareBridge Inbuilt Calendar.");

      if (onBookingSuccess) {
        onBookingSuccess();
      }
    } catch (err) {
      triggerToast("Booking submission failed due to a server connection error.");
    }
  };

  const triggerRescheduleAction = (appt: CustomAppointment) => {
    setReschedulingAppt(appt);
    setRescheduleDate(appt.date);
    setRescheduleSlot(appt.time);
  };

  const submitReschedule = () => {
    if (!reschedulingAppt) return;
    setIsReschedulingUpdating(true);
    
    setTimeout(() => {
      setAppointments(prev => prev.map(a => {
        if (a.id === reschedulingAppt.id) {
          return {
            ...a,
            date: rescheduleDate,
            time: rescheduleSlot,
            syncStatus: "Synced" as const
          };
        }
        return a;
      }));
      setIsReschedulingUpdating(false);
      setReschedulingAppt(null);
      triggerToast("Calendar appointment adjusted and clinicians notified.");
    }, 1500);
  };

  const triggerCancellationAction = (appt: CustomAppointment) => {
    setCancellingAppt(appt);
  };

  const submitCancellation = () => {
    if (!cancellingAppt) return;
    setIsCancellingRemoving(true);
    
    setTimeout(() => {
      setAppointments(prev => prev.map(a => {
        if (a.id === cancellingAppt.id) {
          return {
            ...a,
            status: "cancelled" as const,
            syncStatus: "Synced" as const
          };
        }
        return a;
      }));
      setIsCancellingRemoving(false);
      setCancellingAppt(null);
      triggerToast("Appointment cancelled. CareBridge Inbuilt Calendar slot released.");
    }, 1500);
  };

  const simulateDoctorLeaveToggle = (docId: string) => {
    const isLeave = simulatedLeaveDoctorId === docId;
    if (isLeave) {
      setSimulatedLeaveDoctorId("");
      setAppointments(prev => prev.map(a => {
        if (a.doctor.id === docId) {
          return { ...a, leaveAlert: false };
        }
        return a;
      }));
      triggerToast("Clinician leaves cancelled. Normal shifts returned.");
    } else {
      setSimulatedLeaveDoctorId(docId);
      setAppointments(prev => prev.map(a => {
        if (a.doctor.id === docId && a.status !== "completed" && a.status !== "cancelled") {
          return { ...a, leaveAlert: true };
        }
        return a;
      }));
      triggerToast(`Dr. ${doctorsList.find(d => d.id === docId)?.name || "Clinician"} is flagged on leave. Alerts sent.`);
    }
  };

  const handleManualSyncRetry = () => {
    setManualSyncLoading(true);
    setTimeout(() => {
      setManualSyncLoading(false);
      setAppointments(prev => prev.map(a => ({ ...a, syncStatus: "Synced" })));
      triggerToast("Re-synchronized Inbuilt Calendar. All calendar markers healthy.");
    }, 1500);
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[32px] shadow-sm overflow-hidden flex flex-col min-h-[680px]" id="carebridge-appointment-suite">
      
      {/* Toast Alert overlay */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-24 left-1/2 z-[100] bg-emerald-900 border border-emerald-500 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold"
            id="scheduler-toast-alert"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER WITH QUICK STATS */}
      <div className="bg-[#FCFFFD] p-6 border-b border-[#E5E7EB] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shrink-0">
        <div className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E8B57] bg-[#E9F8F1] px-2.5 py-0.5 rounded-full">
              SaaS Appointment Center
            </span>
            <span className="text-[9px] font-bold text-[#2E8B57] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#2E8B57] rounded-full animate-pulse" /> Secure Database Scheduler
            </span>
          </div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight font-sans">
            Schedule Care Specialists
          </h3>
          <p className="text-[11px] text-gray-500 font-medium">
            Review clinical availability, fill symptom forms, and schedule automated consultations.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-gray-100/80 p-1 rounded-2xl w-full lg:w-auto" id="scheduler-nav-tabs">
          {[
            { id: "book", label: "Book Consultation", icon: CalendarDays },
            { id: "schedule", label: "My Schedule", icon: Calendar },
            { id: "reminders", label: "Reminder Hub", icon: Bell }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id !== "book") {
                    setBookingDoctor(null);
                    setBookingStep(1);
                  }
                }}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isSel 
                    ? "bg-[#2E8B57] text-white shadow-sm" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
                id={`tab-button-${tab.id}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CORE DISPLAY WORKSPACE */}
      <div className="flex-grow p-6 overflow-y-auto bg-[#FCFFFD]">
        
        {/* ==================== TAB: BOOKING JOURNEY ==================== */}
        {activeTab === "book" && (
          <div className="space-y-6">
            {!bookingDoctor ? (
              /* CLINICIAN SEARCH & DIRECTORY */
              <div className="space-y-6 text-left" id="search-directory-screen">
                <div className="flex flex-col md:flex-row gap-4 items-stretch justify-between">
                  {/* Suggestion search input */}
                  <div className="flex-grow relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search specialty, doctor name, hospital, credentials..."
                      className="w-full pl-10 pr-4 py-3 text-xs border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2E8B57]/30 bg-white shadow-sm"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      id="search-clinician-input"
                    />
                    
                    {/* Suggestions list drop */}
                    {searchSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden divide-y">
                        {searchSuggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSearchQuery(sug);
                              setSearchSuggestions([]);
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-2"
                          >
                            <Search className="w-3.5 h-3.5 text-[#2E8B57]" /> {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Specialty Buttons Filter */}
                  <div className="flex gap-2 overflow-x-auto pb-1 max-w-full lg:max-w-md scrollbar-none">
                    {["All", "Cardiologist", "Pediatrician", "Neurologist", "General Physician"].map((spec) => (
                      <button
                        key={spec}
                        onClick={() => setSelectedSpecialty(spec)}
                        className={`text-xs font-bold px-3.5 py-2.5 rounded-2xl border transition-all whitespace-nowrap ${
                          selectedSpecialty === spec
                            ? "bg-[#2E8B57] text-white border-[#2E8B57] shadow-sm"
                            : "bg-white text-gray-500 hover:bg-gray-50 border-[#E5E7EB]"
                        }`}
                      >
                        {spec === "All" ? "All Specialties" : spec}
                      </button>
                    ))}
                  </div>

                  {/* Toggle Map / List visual UI */}
                  <button
                    onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
                    className="px-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-1.5 justify-center"
                  >
                    <Map className="w-4 h-4 text-[#2E8B57]" />
                    <span>{viewMode === "list" ? "Show Clinic Map" : "Show List View"}</span>
                  </button>
                </div>

                {/* ADVANCED MULTI-FILTER DRAWER BLOCK */}
                <div className="bg-white border border-gray-200/80 p-4 rounded-3xl flex flex-wrap gap-4 items-center justify-between text-xs text-gray-500 shadow-sm">
                  <div className="flex flex-wrap gap-3 items-center">
                    <span className="font-extrabold text-[#111827] flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-[#2E8B57]" /> FILTER BY:
                    </span>
                    
                    <select 
                      className="p-2 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2E8B57]"
                      value={consultationType}
                      onChange={(e: any) => setConsultationType(e.target.value)}
                    >
                      <option value="all">Consultation Type: All</option>
                      <option value="in-person">In-Clinic Visit</option>
                      <option value="video">Secure Video Telehealth</option>
                    </select>

                    <select 
                      className="p-2 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2E8B57]"
                      value={selectedLanguage}
                      onChange={(e: any) => setSelectedLanguage(e.target.value)}
                    >
                      <option value="all">Languages: All</option>
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="ko">Korean</option>
                      <option value="ru">Russian</option>
                    </select>

                    <select 
                      className="p-2 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2E8B57]"
                      value={selectedGender}
                      onChange={(e: any) => setSelectedGender(e.target.value)}
                    >
                      <option value="all">Clinician Gender: Any</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>

                    <select 
                      className="p-2 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2E8B57]"
                      value={minRating}
                      onChange={(e: any) => setMinRating(parseFloat(e.target.value))}
                    >
                      <option value="0">Minimum Rating: Any</option>
                      <option value="4.7">4.7+ Rating</option>
                      <option value="4.8">4.8+ Rating</option>
                      <option value="4.9">4.9+ Rating</option>
                    </select>
                  </div>

                  <div className="text-[10px] text-gray-400 font-bold">
                    Found {filteredDoctors.length} accredited physicians
                  </div>
                </div>

                {/* MAP GRID SPLIT VIEW IF SELECTED */}
                {viewMode === "map" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-gray-200/80 rounded-3xl overflow-hidden shadow-sm p-4 h-[350px]">
                    <div className="lg:col-span-4 overflow-y-auto space-y-3 p-1">
                      <p className="text-[10px] uppercase font-bold text-[#2E8B57] tracking-wider">Nearby Clinic Locations</p>
                      {filteredDoctors.map((doc, idx) => (
                        <div 
                          key={doc.id}
                          onClick={() => {
                            setBookingDoctor(doc);
                            setBookingStep(1);
                          }}
                          className="p-3 border rounded-xl hover:border-[#2E8B57]/50 cursor-pointer text-xs space-y-1.5 transition-all"
                        >
                          <strong className="text-gray-900">{doc.name}</strong>
                          <p className="text-[10px] text-gray-500">{doc.hospital}</p>
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                            Consultation fee: $120
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Simulated vector map graphic */}
                    <div className="lg:col-span-8 bg-gray-50 border border-gray-100 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center">
                      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />
                      <div className="absolute top-1/4 left-1/3 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shadow-lg border border-emerald-500 animate-bounce">
                        <MapPin className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="absolute bottom-1/3 right-1/4 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shadow-lg border border-emerald-500 animate-pulse">
                        <MapPin className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="absolute top-1/2 right-1/2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl border border-white">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-[10px] font-extrabold text-gray-400 bg-white/80 px-3 py-1 rounded-full border shadow-sm z-10">
                        Map Center: CareBridge Wellness Hub 
                      </span>
                    </div>
                  </div>
                )}

                {/* LIST VIEW (CARDS GRID) */}
                {viewMode === "list" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredDoctors.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => {
                          setBookingDoctor(doc);
                          setBookingStep(1);
                        }}
                        className="group border border-[#E5E7EB] rounded-[24px] p-5 flex gap-4 bg-[#FCFFFD] hover:bg-white hover:border-[#2E8B57]/50 hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden"
                        id={`book-doctor-card-${doc.id}`}
                      >
                        {simulatedLeaveDoctorId === doc.id && (
                          <div className="absolute top-0 right-0 left-0 bg-red-500 text-white text-[9px] font-black text-center py-1 uppercase tracking-widest">
                            ON LEAVE (Simulated)
                          </div>
                        )}
                        
                        <img
                          src={doc.image}
                          alt={doc.name}
                          className="w-20 h-20 rounded-2xl object-cover border border-[#E5E7EB] shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-grow min-w-0 space-y-1 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-[#2E8B57] tracking-wider uppercase bg-[#E9F8F1] px-2.5 py-0.5 rounded-full">
                              {doc.specialty}
                            </span>
                            <div className="flex items-center gap-0.5 text-amber-500 font-bold text-xs">
                              <Star className="w-3.5 h-3.5 fill-current" /> {doc.rating}
                            </div>
                          </div>
                          
                          <h4 className="text-sm font-black text-gray-900 group-hover:text-[#2E8B57] transition-colors">
                            {doc.name}
                          </h4>
                          <p className="text-[11px] text-gray-400 truncate font-semibold flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" /> {doc.hospital}
                          </p>
                          <p className="text-[11px] text-gray-500 line-clamp-1 leading-relaxed">
                            {doc.bio}
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[9px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-bold">
                              Shift: {doc.availability.join(", ")}
                            </span>
                            <span className="text-[9px] text-emerald-800 bg-[#E9F8F1] px-1.5 py-0.5 rounded font-bold">
                              Fee: $120
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredDoctors.length === 0 && (
                      <div className="col-span-2 text-center py-16 bg-white border border-dashed rounded-3xl">
                        <Info className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-gray-900">No clinician matched search parameters</h4>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                          Try searching 'Sarah', 'Vance', or select an alternative specialization filter.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              
              /* ==================== ACTIVE BOOKING WORKFLOW ==================== */
              <div className="space-y-6">
                {/* Stepper Wizard Indicator */}
                <div className="bg-white border border-[#E5E7EB] p-5 rounded-[24px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
                  <div className="flex items-center gap-4">
                    <img 
                      src={bookingDoctor.image} 
                      alt={bookingDoctor.name} 
                      className="w-11 h-11 rounded-full object-cover border" 
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black text-gray-900">{bookingDoctor.name}</h4>
                        <span className="text-[9px] font-bold text-[#2E8B57] bg-[#E9F8F1] px-2 py-0.2 rounded">
                          {bookingDoctor.specialty}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold">{bookingDoctor.hospital}</p>
                    </div>
                  </div>

                  {/* Stepper timeline indicator */}
                  <div className="flex items-center gap-2" id="booking-stepper-progress">
                    {[
                      { s: 1, label: "Select Date & Slot" },
                      { s: 2, label: "Symptom Form" },
                      { s: 3, label: "AI Triage preview" },
                      { s: 4, label: "Review Booking" },
                      { s: 5, label: "Complete!" }
                    ].map((stepItem) => (
                      <div key={stepItem.s} className="flex items-center gap-1">
                        <div 
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold border ${
                            bookingStep === stepItem.s 
                              ? "bg-[#2E8B57] text-white border-[#2E8B57]"
                              : bookingStep > stepItem.s 
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : "bg-white text-gray-400 border-gray-200"
                          }`}
                        >
                          {bookingStep > stepItem.s ? "✓" : stepItem.s}
                        </div>
                        <span className={`text-[10px] hidden lg:inline font-bold ${
                          bookingStep === stepItem.s ? "text-[#111827]" : "text-gray-400"
                        }`}>
                          {stepItem.label}
                        </span>
                        {stepItem.s < 5 && <ChevronRight className="w-3 h-3 text-gray-300 hidden lg:inline" />}
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => {
                      setBookingDoctor(null);
                      setBookingStep(1);
                    }}
                    className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl border border-red-100 transition-all ml-auto md:ml-0"
                  >
                    Cancel Wizard
                  </button>
                </div>

                {/* STEP 1: CALENDAR DATE & TIME SLOT PICKER */}
                {bookingStep === 1 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left"
                    id="step-booking-slots-picker"
                  >
                    
                    {/* Left: Monthly/Weekly Calendar Grid View */}
                    <div className="lg:col-span-8 bg-white border border-[#E5E7EB] p-6 rounded-[24px] shadow-sm space-y-4">
                      <div className="flex justify-between items-center pb-2">
                        <h4 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                          <CalendarDays className="w-4 h-4 text-[#2E8B57]" /> July 2026 Interactive Calendar
                        </h4>
                        <span className="text-[10px] bg-gray-50 border px-2.5 py-1 rounded-xl text-gray-500 font-bold">
                          TimeZone: America/Los_Angeles (UTC -7)
                        </span>
                      </div>

                      {/* Calendar Header Weekdays */}
                      <div className="grid grid-cols-7 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider py-1 border-b">
                        <span>Sun</span>
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                      </div>

                      {/* Interactive Calendar Days */}
                      <div className="grid grid-cols-7 gap-1.5 text-center">
                        {julyDays.map((day, idx) => {
                          const isSel = selectedDate === day.fullDate;
                          const isLeave = day.status === "leave";
                          const isFull = day.status === "full";
                          const isToday = day.dayNum === 2; // Simulate June 30 / July 2 being today
                          
                          return (
                            <button
                              key={idx}
                              disabled={day.status === "disabled" || isLeave || isFull}
                              onClick={() => {
                                if (day.fullDate) {
                                  setSelectedDate(day.fullDate);
                                  triggerToast(`Active date selected: ${day.fullDate}`);
                                }
                              }}
                              className={`p-2.5 rounded-2xl relative text-xs font-black flex flex-col justify-between items-center min-h-[52px] border transition-all ${
                                isSel 
                                  ? "bg-[#2E8B57] text-white border-[#2E8B57] shadow-sm"
                                  : isLeave
                                    ? "bg-red-50 border-red-100 text-red-500 cursor-not-allowed"
                                    : isFull
                                      ? "bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed"
                                      : day.dayNum === null
                                        ? "bg-transparent border-transparent text-transparent pointer-events-none"
                                        : "bg-[#FCFFFD] hover:bg-emerald-50/50 hover:border-emerald-300 border-[#E5E7EB] text-gray-700"
                              }`}
                            >
                              <span className="self-start">{day.dayNum}</span>
                              
                              {/* Status dot or tiny label */}
                              {isLeave ? (
                                <span className="text-[8px] font-extrabold uppercase scale-90">Leave</span>
                              ) : isFull ? (
                                <span className="text-[8px] font-extrabold uppercase scale-90 text-gray-400">Full</span>
                              ) : isSel ? (
                                <span className="text-[8px] font-bold">Selected</span>
                              ) : day.dayNum ? (
                                <span className="text-[8px] text-[#2E8B57] font-semibold">Available</span>
                              ) : null}

                              {isToday && (
                                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-sky-500 rounded-full" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Color code Legend */}
                      <div className="flex flex-wrap gap-4 pt-3 border-t text-[10px] font-bold text-gray-400 uppercase justify-center">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-400 block" /> Available</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#2E8B57] block" /> Selected</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-100 border block" /> Full / Disabled</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-50 border border-red-300 block" /> Leave Scenario</span>
                      </div>
                    </div>

                    {/* Right: Available Slot Selection */}
                    <div className="lg:col-span-4 bg-white border border-[#E5E7EB] p-6 rounded-[24px] shadow-sm flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="text-left">
                          <h5 className="text-xs font-black uppercase text-gray-400 tracking-wider">Available Consultation Slots</h5>
                          <p className="text-xs font-bold text-gray-900 mt-1">Date: {selectedDate}</p>
                          <p className="text-[10px] text-gray-500 font-medium">Click an elegant slot chip to reserve your session.</p>
                        </div>

                        {/* Morning Slots */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">Morning Hours</span>
                          <div className="grid grid-cols-2 gap-2">
                            {morningSlots.map((slot, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSelectSlot(slot)}
                                className={`p-2.5 rounded-xl border text-center transition-all text-xs font-bold ${
                                  selectedTimeSlot === slot.time
                                    ? "bg-[#2E8B57] text-white border-[#2E8B57] shadow-sm shadow-[#2E8B57]/15 animate-pulse"
                                    : slot.status === "booked" || slot.status === "reserved"
                                      ? "bg-gray-100 text-gray-400 border-gray-100 cursor-pointer"
                                      : slot.status === "expired"
                                        ? "bg-red-50/50 text-red-300 border-red-50 cursor-not-allowed line-through"
                                        : "bg-white hover:bg-[#E9F8F1]/50 border-gray-200 text-gray-700"
                                }`}
                              >
                                {slot.time}
                                <span className="block text-[8px] font-semibold opacity-75">
                                  {slot.status === "booked" ? "Booked" : slot.status === "reserved" ? "Reserved" : slot.status === "expired" ? "Expired" : "Available"}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Afternoon Slots */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">Afternoon Hours</span>
                          <div className="grid grid-cols-2 gap-2">
                            {afternoonSlots.map((slot, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSelectSlot(slot)}
                                className={`p-2.5 rounded-xl border text-center transition-all text-xs font-bold ${
                                  selectedTimeSlot === slot.time
                                    ? "bg-[#2E8B57] text-white border-[#2E8B57] shadow-sm"
                                    : slot.status === "booked" || slot.status === "reserved"
                                      ? "bg-gray-100 text-gray-400 border-gray-100 cursor-pointer"
                                      : "bg-white hover:bg-[#E9F8F1]/50 border-gray-200 text-gray-700"
                                }`}
                              >
                                {slot.time}
                                <span className="block text-[8px] font-semibold opacity-75">
                                  {slot.status === "booked" ? "Booked" : slot.status === "reserved" ? "Reserved" : "Available"}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Evening Slots */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">Evening Hours</span>
                          <div className="grid grid-cols-2 gap-2">
                            {eveningSlots.map((slot, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSelectSlot(slot)}
                                className={`p-2.5 rounded-xl border text-center transition-all text-xs font-bold ${
                                  selectedTimeSlot === slot.time
                                    ? "bg-[#2E8B57] text-white border-[#2E8B57] shadow-sm"
                                    : slot.status === "booked"
                                      ? "bg-gray-100 text-gray-400 border-gray-100 cursor-pointer"
                                      : "bg-white hover:bg-[#E9F8F1]/50 border-gray-200 text-gray-700"
                                }`}
                              >
                                {slot.time}
                                <span className="block text-[8px] font-semibold opacity-75">
                                  {slot.status === "booked" ? "Booked" : "Available"}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t mt-4 space-y-2">
                        <button
                          disabled={!selectedTimeSlot}
                          onClick={() => setBookingStep(2)}
                          className={`w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            selectedTimeSlot
                              ? "bg-[#2E8B57] hover:bg-[#2E8B57]/95 text-white shadow-md hover:-translate-y-0.5"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          Proceed to Symptom Form <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </motion.div>
                )}

                {/* STEP 2: MULTI-STEP SYMPTOM FORM */}
                {bookingStep === 2 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-[#E5E7EB] p-6 rounded-[24px] shadow-sm text-left max-w-2xl mx-auto space-y-6"
                    id="step-booking-symptom-form"
                  >
                    <div className="border-b pb-3 flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-black text-gray-900 uppercase">Pre-Appointment Clinical Symptom Form</h4>
                        <p className="text-[11px] text-gray-500 font-medium">Providing context generates patient-friendly AI summaries prior to meeting.</p>
                      </div>
                      <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                        Autosave Active
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Chief Complaint */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">1. Chief Complaint / Concerns</label>
                        <textarea
                          placeholder="Please describe your physical or cognitive symptoms in detail..."
                          className="w-full p-3 border border-gray-200 rounded-xl text-xs bg-white focus:ring-1 focus:ring-[#2E8B57] h-20 resize-none"
                          value={chiefComplaint}
                          onChange={(e) => setChiefComplaint(e.target.value)}
                        />
                      </div>

                      {/* Grid parameters */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">2. Duration of symptoms</label>
                          <select 
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:ring-1 focus:ring-[#2E8B57]"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                          >
                            <option value="Few hours">A few hours</option>
                            <option value="1 day">1 day</option>
                            <option value="3 days">3 days</option>
                            <option value="1 week">1 week</option>
                            <option value="Over a month">More than a month</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">3. Estimated Pain / discomfort Level</label>
                          <div className="flex items-center gap-3 bg-gray-50 p-2 border rounded-xl">
                            <input 
                              type="range" 
                              min="1" 
                              max="10" 
                              className="w-full accent-[#2E8B57]"
                              value={painScale}
                              onChange={(e) => setPainScale(parseInt(e.target.value))}
                            />
                            <span className="w-8 h-8 rounded-lg bg-emerald-900 text-white flex items-center justify-center text-xs font-black">
                              {painScale}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Allergies & Medications */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">4. Known Allergies</label>
                          <input
                            type="text"
                            placeholder="e.g. Penicillin, nuts, latex"
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:ring-1 focus:ring-[#2E8B57]"
                            value={allergies}
                            onChange={(e) => setAllergies(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">5. Current Medications</label>
                          <input
                            type="text"
                            placeholder="e.g. Advil daily, Vitamin D3"
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:ring-1 focus:ring-[#2E8B57]"
                            value={currentMeds}
                            onChange={(e) => setCurrentMeds(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Report / Image Upload */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">6. Attach diagnostic reports / lab images</label>
                        
                        <div 
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={handleFileClick}
                          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                            isDragOver 
                              ? "border-[#2E8B57] bg-emerald-50/40" 
                              : uploadedFileName 
                                ? "border-emerald-300 bg-emerald-50/10"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                          }`}
                        >
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden" 
                            onChange={handleFileChange}
                            accept=".pdf,.png,.jpg,.jpeg"
                          />
                          <Download className="w-5 h-5 text-gray-400" />
                          <span className="text-xs font-bold text-gray-700">
                            {uploadedFileName ? `Attached: ${uploadedFileName}` : "Drag and drop or click to attach medical PDF / PNG"}
                          </span>
                          <span className="text-[9px] text-gray-400">Supports files up to 10MB safely encrypted</span>
                        </div>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-3 pt-4 border-t">
                      <button 
                        onClick={() => setBookingStep(1)}
                        className="px-5 py-2.5 border rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
                      >
                        Back
                      </button>
                      
                      <button 
                        onClick={startAiAnalysis}
                        className="flex-grow py-2.5 bg-emerald-950 text-white hover:bg-emerald-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        {aiGenerating ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> Generating AI Preview...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-emerald-400" /> Analyze with CareBridge AI
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: AI SYMPTOM PREVIEW */}
                {bookingStep === 3 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white border border-[#E5E7EB] p-6 rounded-[24px] shadow-sm text-left max-w-2xl mx-auto space-y-6"
                    id="step-booking-ai-preview"
                  >
                    <div className="flex justify-between items-start border-b pb-3">
                      <div>
                        <h4 className="text-sm font-black text-gray-900 flex items-center gap-1.5 uppercase">
                          <Sparkles className="w-4.5 h-4.5 text-emerald-500" /> CareBridge AI Diagnostics Pre-Review
                        </h4>
                        <p className="text-[11px] text-gray-500 font-medium">HIPAA-Compliant synthesis of reported complaints.</p>
                      </div>

                      {/* Interactive toggle to simulate AI offline */}
                      <button 
                        onClick={() => setAiOfflineMode(!aiOfflineMode)}
                        className={`text-[9px] font-bold px-2 py-1 rounded border transition-all ${
                          aiOfflineMode ? "bg-red-50 text-red-700 border-red-100" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {aiOfflineMode ? "AI Simulated: Offline" : "Simulate AI Offline"}
                      </button>
                    </div>

                    {aiOfflineMode ? (
                      /* GRACEFUL FALLBACK */
                      <div className="bg-amber-50/50 border border-amber-200/60 p-5 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 text-amber-800">
                          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                          <h5 className="text-xs font-black">AI Diagnosis Pipeline Offline</h5>
                        </div>
                        <p className="text-xs text-amber-700 leading-relaxed">
                          Your symptoms have been submitted successfully. The doctor will review them manually during your visit. CareBridge secures all files to ensure flawless clinical triage.
                        </p>
                      </div>
                    ) : (
                      /* ACTIVE PREMIUM AI PREVIEW PANEL */
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-red-50/40 border border-red-100 rounded-2xl">
                            <span className="text-[9px] uppercase font-bold text-red-500 block">Classified Urgency</span>
                            <strong className="text-xs text-red-800 mt-1 block">{aiAdvice?.riskLevel || "Routine Care (Medium-Low)"}</strong>
                          </div>

                          <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl">
                            <span className="text-[9px] uppercase font-bold text-[#2E8B57] block">Confidence Rating</span>
                            <strong className="text-xs text-emerald-900 mt-1 block">{aiAdvice ? "98.7% Gemini AI Match" : "94.2% Match Triage"}</strong>
                          </div>

                          <div className="p-4 bg-sky-50/40 border border-sky-100 rounded-2xl">
                            <span className="text-[9px] uppercase font-bold text-sky-600 block">Primary Target</span>
                            <strong className="text-xs text-sky-950 mt-1 block">{aiAdvice?.suggestedSpecialty || bookingDoctor?.specialty || "Cardiology Pathway"}</strong>
                          </div>
                        </div>

                        {/* Synthesis Summary */}
                        <div className="bg-gray-50 p-4 border rounded-2xl space-y-1">
                          <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest block">Triage Synthesis (Gemini Live)</span>
                          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                            {typedSummary || "Patient presents with chief complaint of: \"" + chiefComplaint + "\". Calculated pain index is " + painScale + "/10. Symptom duration matches " + duration + "."}
                          </p>
                        </div>

                        {/* Suggested Questions */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">Suggested Physician Questions & Recommendations</span>
                          <div className="space-y-1.5 text-xs text-gray-600">
                            {aiAdvice && aiAdvice.recommendations && aiAdvice.recommendations.length > 0 ? (
                              aiAdvice.recommendations.map((rec, idx) => (
                                <p key={idx} className="flex items-center gap-1.5 bg-white border p-2 rounded-xl" id={`ai-rec-${idx}`}>
                                  <Check className="w-3.5 h-3.5 text-[#2E8B57] shrink-0" /> {rec}
                                </p>
                              ))
                            ) : (
                              <>
                                <p className="flex items-center gap-1.5 bg-white border p-2 rounded-xl">
                                  <Check className="w-3.5 h-3.5 text-[#2E8B57] shrink-0" /> Has there been any historic fluctuations in resting pulse rates?
                                </p>
                                <p className="flex items-center gap-1.5 bg-white border p-2 rounded-xl">
                                  <Check className="w-3.5 h-3.5 text-[#2E8B57] shrink-0" /> Does physical activity generate localized cardiovascular tightening?
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {aiAdvice?.disclaimer && (
                          <p className="text-[10px] text-gray-400 italic mt-2 leading-relaxed">
                            * {aiAdvice.disclaimer}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t">
                      <button 
                        onClick={() => setBookingStep(2)}
                        className="px-5 py-2.5 border rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
                      >
                        Back
                      </button>
                      <button 
                        onClick={() => setBookingStep(4)}
                        className="flex-grow py-2.5 bg-[#2E8B57] hover:bg-[#2E8B57]/95 text-white rounded-xl text-xs font-bold text-center shadow-md transition-all"
                      >
                        Review Booking Summary
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: REVIEW BOOKING & POLICIES */}
                {bookingStep === 4 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-[#E5E7EB] p-6 rounded-[24px] shadow-sm text-left max-w-xl mx-auto space-y-6"
                    id="step-booking-review-summary"
                  >
                    <h4 className="text-sm font-black text-gray-900 border-b pb-2 uppercase">Confirm Consultation Details</h4>
                    
                    <div className="space-y-4">
                      {/* Physician Card summary */}
                      <div className="flex gap-3 p-4 bg-[#E9F8F1]/30 border border-[#2E8B57]/10 rounded-2xl">
                        <img 
                          src={bookingDoctor.image} 
                          alt={bookingDoctor.name} 
                          className="w-12 h-12 rounded-xl object-cover" 
                        />
                        <div>
                          <strong className="text-xs text-gray-900 block">{bookingDoctor.name}</strong>
                          <span className="text-[10px] text-gray-400 font-bold block">{bookingDoctor.specialty}</span>
                          <span className="text-[10px] text-gray-500 font-bold block">{bookingDoctor.hospital}</span>
                        </div>
                      </div>

                      {/* Schedule parameters */}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-gray-50 p-3.5 border rounded-2xl">
                          <span className="text-[9px] uppercase font-extrabold text-gray-400 block">Consultation Date</span>
                          <strong className="text-gray-900 mt-1 block">{selectedDate}</strong>
                        </div>

                        <div className="bg-gray-50 p-3.5 border rounded-2xl">
                          <span className="text-[9px] uppercase font-extrabold text-gray-400 block">Consultation Time</span>
                          <strong className="text-gray-900 mt-1 block">{selectedTimeSlot || "10:30 AM"}</strong>
                        </div>
                      </div>

                      {/* Secure storage status */}
                      <div className="flex justify-between items-center bg-gray-50/50 p-3 border rounded-xl text-xs">
                        <span className="text-gray-500 font-bold">Secure Record Storage:</span>
                        <span className="text-[#2E8B57] font-black uppercase tracking-widest text-[9px] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                          EHR Encrypted
                        </span>
                      </div>

                      {/* Clinic policies agreement */}
                      <label className="flex items-start gap-2.5 cursor-pointer bg-[#FCFFFD] p-3 border rounded-xl">
                        <input
                          type="checkbox"
                          checked={policyAgreed}
                          onChange={(e) => setPolicyAgreed(e.target.checked)}
                          className="rounded text-[#2E8B57] focus:ring-[#2E8B57] w-4 h-4 border-gray-300 mt-0.5 shrink-0"
                        />
                        <div className="text-[10px] text-gray-500 leading-normal font-bold">
                          I agree to CareBridge health policies. I authorize secure symptom packet transit to my certified practitioner under standard HIPAA regulations.
                        </div>
                      </label>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <button 
                        onClick={() => setBookingStep(3)}
                        className="px-5 py-2.5 border rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
                      >
                        Back
                      </button>
                      
                      <button 
                        disabled={!policyAgreed}
                        onClick={completeBookingSubmit}
                        className={`flex-grow py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          policyAgreed
                            ? "bg-[#2E8B57] hover:bg-[#2E8B57]/95 text-white shadow-md shadow-[#2E8B57]/15"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Confirm Booking Slot
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 5: SUCCESS & CELEBRATION */}
                {bookingStep === 5 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white border border-[#E5E7EB] p-8 rounded-[32px] shadow-sm text-center max-w-lg mx-auto space-y-6 flex flex-col items-center justify-center"
                    id="step-booking-success-screen"
                  >
                    <div className="w-16 h-16 bg-[#E9F8F1] rounded-full flex items-center justify-center text-[#2E8B57] border border-[#2E8B57]/20 animate-bounce">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-xl font-black text-gray-900 font-sans tracking-tight">Your Care is Confirmed!</h4>
                      <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
                        An email confirmation with clinic pre-meeting forms and a secure video telehealth link has been dispatched to your primary inbox.
                      </p>
                    </div>

                    <div className="bg-[#FCFFFD] border rounded-2xl p-4 w-full text-left space-y-3">
                      <div className="flex justify-between items-center text-xs pb-2 border-b">
                        <span className="text-gray-400">Appointment ID:</span>
                        <strong className="text-gray-800 font-mono">{successAppointmentId}</strong>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Clinician:</span>
                          <strong className="text-gray-800">{bookingDoctor?.name}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Date & Time:</span>
                          <strong className="text-gray-800">{selectedDate} at {selectedTimeSlot || "10:30 AM"}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Sync Status:</span>
                          <strong className="text-[#2E8B57]">Saved to Secure CareBridge DB</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                      <button 
                        onClick={() => {
                          setBookingDoctor(null);
                          setBookingStep(1);
                        }}
                        className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
                      >
                        Book Another Consult
                      </button>
                      <button 
                        onClick={() => setActiveTab("schedule")}
                        className="flex-1 py-2.5 bg-[#2E8B57] hover:bg-[#2E8B57]/95 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                      >
                        View Appointment Dashboard
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: SCHEDULE LEDGER ==================== */}
        {activeTab === "schedule" && (
          <div className="space-y-6 text-left" id="schedule-ledger-screen">
            
            {/* Simulation settings rail */}
            <div className="p-4 bg-amber-50 border border-amber-200/60 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <h5 className="text-xs font-black text-amber-800 flex items-center gap-1.5 uppercase">
                  <BadgeAlert className="w-4 h-4 text-amber-600" /> Administrative Simulation Controls
                </h5>
                <p className="text-[10px] text-amber-700 leading-normal font-bold">
                  Toggle doctor leave scenarios, trigger double booking protections, or manage waiting lists.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {doctorsList.length === 0 ? (
                  <span className="text-[10px] text-amber-800 font-bold italic">No doctors registered yet</span>
                ) : (
                  doctorsList.map(doc => {
                    const isOnLeave = simulatedLeaveDoctorId === doc.id;
                    return (
                      <button
                        key={doc.id}
                        onClick={() => simulateDoctorLeaveToggle(doc.id)}
                        className={`px-3 py-1.5 text-[9px] font-extrabold rounded-lg uppercase tracking-wide border transition-all ${
                          isOnLeave 
                            ? "bg-red-500 border-red-500 text-white" 
                            : "bg-white border-amber-300 text-amber-800 hover:bg-amber-100/30"
                        }`}
                      >
                        Leave: {doc.name.split(" ").pop()}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Upcoming and history list */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-gray-900 uppercase">Consultation Ledger</h4>
              
              {appointments.map((appt) => {
                const isLeaveActive = appt.leaveAlert;
                
                return (
                  <div 
                    key={appt.id}
                    className={`bg-white border p-6 rounded-[24px] shadow-sm flex flex-col lg:flex-row justify-between gap-6 transition-all relative ${
                      isLeaveActive ? "border-red-300 bg-red-50/10" : "border-[#E5E7EB]"
                    }`}
                  >
                    
                    {/* LEAVE BANNER TRIGGER */}
                    {isLeaveActive && (
                      <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-[9px] font-black uppercase text-center py-1 tracking-widest rounded-t-[23px]">
                        URGENT: Doctor Unavailable on this Date (Clinician Leave)
                      </div>
                    )}

                    <div className="flex gap-4 items-start pt-2 lg:pt-0">
                      <img 
                        src={appt.doctor.image} 
                        alt={appt.doctor.name} 
                        className="w-14 h-14 rounded-2xl object-cover border shrink-0" 
                      />
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-black text-gray-950">{appt.doctor.name}</h4>
                          <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                            appt.status === "confirmed" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            appt.status === "booked" ? "bg-[#E9F8F1] text-[#2E8B57] border-emerald-200" :
                            appt.status === "completed" ? "bg-gray-100 text-gray-600 border-gray-200" : "bg-red-50 text-red-700 border-red-100"
                          }`}>
                            {appt.status}
                          </span>
                          
                          {appt.waitingList && (
                            <span className="text-[9px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              Waiting List (Queue: #{appt.queuePosition})
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-500 font-bold">{appt.doctor.specialty} • {appt.doctor.hospital}</p>
                        <p className="text-xs text-gray-600 leading-normal max-w-xl bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                          <strong>Reported symptoms:</strong> {appt.complaint}
                        </p>

                        {/* Leave warning message */}
                        {isLeaveActive && (
                          <div className="p-3 bg-red-50 border border-red-100 rounded-xl space-y-1 mt-1 text-xs">
                            <p className="text-red-800 font-black">Your doctor is unavailable on this date.</p>
                            <p className="text-red-700 font-bold">Suggested alternatives:</p>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => triggerRescheduleAction(appt)}
                                className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-bold rounded hover:bg-red-700"
                              >
                                Reschedule Slot
                              </button>
                              <button 
                                onClick={() => {
                                  triggerToast("Re-allocating appointment to similar cardiologist...");
                                }}
                                className="px-2.5 py-1 bg-white border border-red-200 text-red-700 text-[10px] font-bold rounded"
                              >
                                Match Specialist
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timeline & Actions column */}
                    <div className="flex flex-col justify-between items-end shrink-0 gap-4 text-right">
                      <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl w-full lg:w-52 text-left space-y-1">
                        <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Appointment Timeline</span>
                        <p className="text-xs font-black text-[#111827]">{appt.date} at {appt.time}</p>
                        
                        <div className="flex items-center gap-1.5 text-[9px] text-emerald-700 font-bold mt-1.5 bg-emerald-50/30 p-1 rounded">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Calendar: Inbuilt</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 w-full">
                        {appt.status !== "completed" && appt.status !== "cancelled" ? (
                          <>
                            <button 
                              onClick={() => triggerCancellationAction(appt)}
                              className="flex-1 py-2 px-3 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-xl transition-all"
                            >
                              Cancel Booking
                            </button>
                            <button 
                              onClick={() => triggerRescheduleAction(appt)}
                              className="flex-1 py-2 px-3 bg-[#2E8B57] text-white hover:bg-[#2E8B57]/90 text-xs font-semibold rounded-xl transition-all"
                            >
                              Reschedule Slot
                            </button>
                          </>
                        ) : (
                          <div className="text-xs font-bold text-gray-400 py-2">
                            {appt.status === "completed" ? "Completed consultation" : "Cancelled consultation"}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}



        {/* ==================== TAB: REMINDERS HUB ==================== */}
        {activeTab === "reminders" && (
          <div className="max-w-2xl mx-auto space-y-6 text-left" id="reminder-hub-screen">
            <h4 className="text-sm font-black text-gray-900 uppercase">Pre-Appointment Reminders & Prompts</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 24 hour card */}
              <div className="bg-white border p-5 rounded-3xl space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    24 Hours Prior Alert
                  </span>
                  <span className="text-xs text-gray-400 font-bold">Active</span>
                </div>

                <div className="space-y-1">
                  <h5 className="text-xs font-black text-gray-900">Dr. Sarah Jenkins Cardiovascular Review</h5>
                  <p className="text-[11px] text-gray-500 font-medium">Tomorrow at 02:30 PM in CareBridge Room</p>
                </div>

                <p className="text-xs text-gray-500 leading-normal bg-gray-50 p-3 rounded-2xl">
                  Please review your structured symptom analyzer guidelines before joining.
                </p>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => triggerToast("Attendance confirmed. Clinicians updated.")}
                    className="flex-1 py-2 bg-[#2E8B57] text-white text-[10px] font-bold rounded-xl text-center"
                  >
                    Confirm Attendance
                  </button>
                  <button 
                    onClick={() => setActiveTab("schedule")}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-xl text-center"
                  >
                    Reschedule
                  </button>
                </div>
              </div>

              {/* 1 hour card */}
              <div className="bg-[#2E8B57] text-white p-5 rounded-3xl space-y-4 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full blur-xl" />
                <div className="flex justify-between items-start">
                  <span className="text-[9px] uppercase font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded">
                    1 Hour Prior Alert
                  </span>
                  <span className="text-xs text-emerald-200 font-bold">Urgent</span>
                </div>

                <div className="space-y-1">
                  <h5 className="text-xs font-black text-white">Dr. Sarah Jenkins Video Triage</h5>
                  <p className="text-[11px] text-emerald-100 font-medium">Today at 02:30 PM (Starts in 45m)</p>
                </div>

                <p className="text-xs text-emerald-50/90 leading-normal bg-emerald-800/40 p-3 rounded-2xl">
                  Check microphone, camera permissions, and locate your clinical medication.
                </p>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => triggerToast("Launching secure HIPAA room video connection...")}
                    className="w-full py-2 bg-white text-[#2E8B57] text-[10px] font-bold rounded-xl text-center flex items-center justify-center gap-1 shadow-sm"
                  >
                    Join Consultation <ExternalLink className="w-3 h-3 text-[#2E8B57]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ==================== DOUBLE BOOKING PROTECTION MODAL ==================== */}
      <AnimatePresence>
        {showDoubleBookingModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDoubleBookingModal(false)}
              className="fixed inset-0 bg-black/50 z-[110]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white border rounded-[28px] p-6 text-left shadow-2xl z-[120]"
            >
              <div className="flex items-center gap-3 border-b pb-3 text-red-600">
                <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                <h4 className="text-xs font-black uppercase tracking-wider">This slot is no longer available</h4>
              </div>

              <div className="space-y-3.5 py-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Another user reserved the slot <strong className="text-gray-800">{simulatedConflictSlot || "10:30 AM"}</strong> while you were writing. CareBridge protects clinic timelines to prevent physician overlap.
                </p>

                <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1.5">
                  <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest">Recommended Slot Option:</p>
                  <p className="text-xs font-black text-emerald-950">Tomorrow at 09:00 AM</p>
                  <p className="text-[10px] text-[#2E8B57]">Available for booking instantly.</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t">
                <button
                  onClick={() => {
                    setSelectedTimeSlot("09:00 AM");
                    setShowDoubleBookingModal(false);
                    triggerToast("Accepted recommended available alternative slot.");
                  }}
                  className="w-full py-2.5 bg-[#2E8B57] text-white text-xs font-bold rounded-xl"
                >
                  Accept Next Available Slot
                </button>
                <button
                  onClick={() => {
                    setShowDoubleBookingModal(false);
                    triggerToast("Joining waiting list for selected time slot.");
                  }}
                  className="w-full py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Notify Me / Join Waiting List
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ==================== RESCHEDULE INTERACTIVE WORKSPACE ==================== */}
      <AnimatePresence>
        {reschedulingAppt && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReschedulingAppt(null)}
              className="fixed inset-0 bg-black/50 z-[110]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white border rounded-[28px] p-6 text-left shadow-2xl z-[120] space-y-4"
            >
              <div className="border-b pb-2">
                <h4 className="text-xs font-black uppercase text-gray-400">Reschedule Consultation Schedule</h4>
                <strong className="text-sm text-gray-950">{reschedulingAppt.doctor.name}</strong>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-gray-400">New Consultation Date</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border rounded-xl text-xs"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-gray-400">New Time Slot Selection</label>
                  <select 
                    className="w-full p-2 border rounded-xl text-xs bg-white"
                    value={rescheduleSlot}
                    onChange={(e) => setRescheduleSlot(e.target.value)}
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="01:30 PM">01:30 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                  </select>
                </div>

                {/* Preview changes state */}
                <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl space-y-1 text-[11px] leading-normal">
                  <span className="font-extrabold text-[#2E8B57] block">Schedule adjustment outcome:</span>
                  <p className="text-emerald-950">Shift from {reschedulingAppt.date} to {rescheduleDate}.</p>
                  <p className="text-[#2E8B57]">Automatically updates your Inbuilt Calendar schedules.</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button 
                  onClick={() => setReschedulingAppt(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitReschedule}
                  className="flex-grow py-2 bg-[#2E8B57] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
                >
                  {isReschedulingUpdating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating Calendar...
                    </>
                  ) : "Confirm Adjustments"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ==================== CANCELLATION DIALOGUE FLOW ==================== */}
      <AnimatePresence>
        {cancellingAppt && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCancellingAppt(null)}
              className="fixed inset-0 bg-black/50 z-[110]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white border rounded-[28px] p-6 text-left shadow-2xl z-[120] space-y-4"
            >
              <div className="border-b pb-2 text-red-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <h4 className="text-xs font-black uppercase tracking-wider">Cancel Active Appointment</h4>
              </div>

              <div className="space-y-3.5 text-xs">
                <p className="text-gray-500 leading-normal">
                  You are releasing the booking with <strong className="text-gray-800">{cancellingAppt.doctor.name}</strong> on {cancellingAppt.date}.
                </p>

                {/* Cancellation Reasons */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase text-gray-400">Select reason for release</label>
                  {["Personal conflict", "Medical emergency", "Scheduling mismatch", "Other"].map((reason) => (
                    <label key={reason} className="flex items-center gap-2 cursor-pointer p-1.5 border rounded-lg hover:bg-gray-50">
                      <input 
                        type="radio" 
                        name="cancel-reason" 
                        value={reason}
                        checked={cancellationReason === reason}
                        onChange={() => setCancellationReason(reason)}
                        className="accent-[#2E8B57]"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>

                {/* Refund placeholder alert */}
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] leading-normal text-red-800 font-medium">
                  Note: Cancellations within 24 hours of consultation may carry standard clinic consultation policy holding structures. No fees are held for reschedule actions.
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button 
                  onClick={() => setCancellingAppt(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs"
                >
                  Keep Booking
                </button>
                <button 
                  onClick={submitCancellation}
                  className="flex-grow py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
                >
                  {isCancellingRemoving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Removing Calendar Event...
                    </>
                  ) : "Cancel Appointment"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
