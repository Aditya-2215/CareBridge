/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Pill, Bell, BellRing, BellOff, Calendar, CalendarClock, Search, Sparkles,
  Clock, Settings, Mail, Phone, Shield, ShieldAlert, CheckCircle2, XCircle,
  AlertTriangle, Trash2, Archive, Check, X, ChevronRight, Info, CalendarDays,
  ExternalLink, RefreshCw, Sliders, Eye, Undo, Smartphone, Send, Share2,
  UserPlus, MapPin, Activity, FileText, CalendarRange, Lock, Plus, ArrowRight
} from "lucide-react";
import { Doctor } from "../types";

// Types for local state
interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  timeStr: string;
  foodRelation: "Before Food" | "After Food" | "With Food";
  status: "pending" | "taken" | "snoozed" | "skipped";
  missed?: boolean;
}

interface NotificationItem {
  id: string;
  category: "appointments" | "medication" | "ai" | "system";
  title: string;
  message: string;
  timestamp: string;
  unread: boolean;
  archived: boolean;
  doctor?: string;
  date?: string;
  time?: string;
  location?: string;
  actionText?: string;
  actionId?: string;
}

interface FollowUpItem {
  id: string;
  title: string;
  doctorName: string;
  doctorSpecialty: string;
  dueInDays: number;
  type: "upcoming" | "suggested" | "overdue";
  timelinePhase: string;
  description: string;
}

interface CommHistoryItem {
  id: string;
  type: "email" | "notification" | "calendar" | "sms";
  title: string;
  recipient: string;
  timestamp: string;
  status: "delivered" | "failed" | "pending";
}

export default function CommunicationRemindersHub() {
  // Active inner sub-tab of the communication ecosystem
  const [activeSubTab, setActiveSubTab] = useState<"medications" | "notifications" | "followup" | "emails" | "preferences">("medications");

  // TOAST feedback trigger
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "info" | "error">("success");

  const triggerToast = (msg: string, type: "success" | "info" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. CELEBRATION STATE (Confetti/Spray particle celebration)
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");
  const triggerCelebration = (text: string) => {
    setCelebrationText(text);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  // 2. DOCTOR LEAVE BANNER AND RE-SCHEDULING EXPERIENCE STATE
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [isDoctorOnLeave, setIsDoctorOnLeave] = useState(true);
  const [selectedAlternativeDoc, setSelectedAlternativeDoc] = useState<Doctor | null>(null);
  const [showAltDocDialog, setShowAltDocDialog] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await apifetch("/api/doctors");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.doctors)) {
            const mapped = data.doctors.map((d: any) => ({
              id: d._id || d.id,
              name: d.name || d.email,
              specialty: d.specialty || "General Medicine Specialist",
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
        console.error("Failed to load doctors list", err);
      }
    };
    fetchDoctors();
  }, []);

  // 3. MEDICATION STATE
  const [medications, setMedications] = useState<MedicationItem[]>([
    {
      id: "med-1",
      name: "Lisinopril",
      dosage: "10mg",
      frequency: "Once Daily",
      timeOfDay: "morning",
      timeStr: "08:30 AM",
      foodRelation: "After Food",
      status: "pending"
    },
    {
      id: "med-2",
      name: "Atorvastatin",
      dosage: "20mg",
      frequency: "Once Daily",
      timeOfDay: "night",
      timeStr: "09:30 PM",
      foodRelation: "After Food",
      status: "pending"
    },
    {
      id: "med-3",
      name: "Amoxicillin",
      dosage: "500mg",
      frequency: "Three Times Daily",
      timeOfDay: "afternoon",
      timeStr: "01:30 PM",
      foodRelation: "With Food",
      status: "pending"
    },
    {
      id: "med-4",
      name: "Vitamin D3",
      dosage: "2000 IU",
      frequency: "Once Daily",
      timeOfDay: "morning",
      timeStr: "08:30 AM",
      foodRelation: "With Food",
      status: "pending",
      missed: true
    }
  ]);

  // Intake queue filter by timeline segment
  const [selectedTimeOfDayFilter, setSelectedTimeOfDayFilter] = useState<"all" | "morning" | "afternoon" | "evening" | "night">("all");

  // Completion calculation
  const totalDosesToday = medications.length;
  const takenDosesToday = medications.filter(m => m.status === "taken").length;
  const missedDosesToday = medications.filter(m => m.missed).length;
  const completionRate = totalDosesToday > 0 ? Math.round((takenDosesToday / totalDosesToday) * 100) : 100;

  const handleMedAction = (id: string, action: "taken" | "snoozed" | "skipped") => {
    setMedications(prev => prev.map(m => {
      if (m.id === id) {
        if (action === "taken") {
          triggerCelebration(`Dose of ${m.name} logged successfully!`);
          triggerToast(`Dose of ${m.name} marked as taken.`, "success");
          return { ...m, status: "taken", missed: false };
        } else if (action === "snoozed") {
          triggerToast(`${m.name} snoozed for 15 minutes.`, "info");
          return { ...m, status: "snoozed" };
        } else {
          triggerToast(`${m.name} dosage skipped for today.`, "info");
          return { ...m, status: "skipped" };
        }
      }
      return m;
    }));
  };

  const resetMedications = () => {
    setMedications(prev => prev.map(m => ({ ...m, status: "pending", missed: m.id === "med-4" })));
    triggerToast("Today's medicine intake schedule reset for evaluation.", "info");
  };

  // 4. NOTIFICATION STATE
  const [notificationsFilter, setNotificationsFilter] = useState<"all" | "unread" | "appointments" | "medication" | "ai" | "system">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "notif-1",
      category: "appointments",
      title: "Booking Confirmed",
      message: "Your appointment with Dr. Sarah Jenkins has been secured.",
      timestamp: "10 mins ago",
      unread: true,
      archived: false,
      doctor: "Dr. Sarah Jenkins",
      date: "Friday, July 3rd",
      time: "10:30 AM",
      location: "Metro Health Heart Institute (Room 402)",
      actionText: "Pre-appointment Forms"
    },
    {
      id: "notif-2",
      category: "appointments",
      title: "Teleconsultation in 1 hour",
      message: "Dr. David Kim is preparing for your remote assessment.",
      timestamp: "50 mins ago",
      unread: true,
      archived: false,
      doctor: "Dr. David Kim",
      date: "Today",
      time: "11:50 AM",
      location: "Telehealth Room Alpha",
      actionText: "Launch Teleconsultation"
    },
    {
      id: "notif-3",
      category: "appointments",
      title: "Rescheduled: Cardiology Review",
      message: "Your checkup has been shifted to accommodate clinical availability.",
      timestamp: "2 hours ago",
      unread: true,
      archived: false,
      doctor: "Dr. Sarah Jenkins",
      date: "Monday, July 6th",
      time: "02:00 PM",
      location: "Metro Health Heart Institute",
      actionText: "Accept New Slot"
    },
    {
      id: "notif-4",
      category: "system",
      title: "Doctor Elena Rostova on Sudden Leave",
      message: "Dr. Elena Rostova is temporarily unavailable. Sessions scheduled from July 10th are suspended.",
      timestamp: "3 hours ago",
      unread: true,
      archived: false,
      doctor: "Dr. Elena Rostova",
      date: "July 10th - 15th",
      time: "All Day",
      location: "Neuroscience Alliance",
      actionText: "Re-schedule Session",
      actionId: "doctor-leave-trigger"
    },
    {
      id: "notif-5",
      category: "medication",
      title: "Medication Reminder: Lisinopril 10mg",
      message: "Take 1 tablet after food to manage optimal daily vascular stability.",
      timestamp: "Today, 08:30 AM",
      unread: false,
      archived: false,
      actionText: "Mark Taken"
    },
    {
      id: "notif-6",
      category: "ai",
      title: "AI Clinical Summary Ready",
      message: "Your previous heart rate telemetry report has been translated into patient-friendly metrics.",
      timestamp: "Yesterday",
      unread: false,
      archived: false,
      actionText: "View Summary"
    },
    {
      id: "notif-7",
      category: "appointments",
      title: "Cancelled: Consultation",
      message: "Appointment canceled by your request.",
      timestamp: "3 days ago",
      unread: false,
      archived: false,
      doctor: "Dr. Marcus Vance",
      date: "June 27th",
      time: "03:00 PM",
      location: "St. Jude Children's Clinic",
      actionText: "Rebook Visit"
    },
    {
      id: "notif-8",
      category: "appointments",
      title: "Appointment Reminder (24h)",
      message: "Friendly 24-hour reminder for your clinical visit tomorrow.",
      timestamp: "1 day ago",
      unread: false,
      archived: false,
      doctor: "Dr. Marcus Vance",
      date: "June 28th",
      time: "09:30 AM",
      location: "St. Jude Children's Clinic",
      actionText: "Check Directions"
    },
    {
      id: "notif-9",
      category: "appointments",
      title: "Delay Alert: Doctor Running Late",
      message: "Dr. Marcus Vance is delayed by approximately 25 minutes due to an emergency.",
      timestamp: "2 days ago",
      unread: false,
      archived: false,
      doctor: "Dr. Marcus Vance",
      date: "June 28th",
      time: "09:30 AM",
      location: "St. Jude Children's Clinic (Delay Room 1A)"
    }
  ]);

  const handleMarkNotifRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    triggerToast("Notification marked as read.", "success");
  };

  const handleArchiveNotif = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, archived: true } : n));
    triggerToast("Notification archived successfully.", "success");
  };

  const handleDeleteNotif = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    triggerToast("Notification deleted permanently.", "info");
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    triggerToast("All notifications marked as read.", "success");
  };

  // 5. FOLLOW-UP MANAGER STATE
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([
    {
      id: "fu-1",
      title: "Sinus Assessment Checkup",
      doctorName: "Dr. Sarah Jenkins",
      doctorSpecialty: "Cardiologist & General Care",
      dueInDays: 14,
      type: "upcoming",
      timelinePhase: "Post-Prescription Phase",
      description: "Evaluation of potential throat coughs relative to morning Lisinopril schedules."
    },
    {
      id: "fu-2",
      title: "Lipid Index Blood Screen",
      doctorName: "Dr. David Kim",
      doctorSpecialty: "General Physician",
      dueInDays: 3,
      type: "suggested",
      timelinePhase: "Proactive Screening",
      description: "Routine biometric testing to check long-term statin metabolic tolerance."
    },
    {
      id: "fu-3",
      title: "Annual Cardiovascular Echo",
      doctorName: "Dr. Sarah Jenkins",
      doctorSpecialty: "Cardiologist",
      dueInDays: -5,
      type: "overdue",
      timelinePhase: "Critical Annual Review",
      description: "Urgent physical telemetry required to establish heart rate stability parameters."
    }
  ]);

  const handleBookFollowUp = (id: string) => {
    triggerCelebration("Follow-up appointment booked successfully!");
    triggerToast("Appointment scheduled. Inbuilt Calendar synchronized automatically.", "success");
    setFollowUps(prev => prev.filter(fu => fu.id !== id));
  };

  // 6. PORTAL INBUILT CALENDAR SYNC STATE
  const [gcalSyncState, setGcalSyncState] = useState<"Connected" | "Pending" | "Failed">("Connected");
  const [lastSyncTime, setLastSyncTime] = useState("Just now");
  const [isSyncing, setIsSyncing] = useState(false);
  const [gcalPreferences, setGcalPreferences] = useState({
    remind24h: true,
    remind1h: true,
    emailRemind: true,
    calRemind: true
  });

  const handleReSyncGcal = () => {
    setIsSyncing(true);
    setGcalSyncState("Pending");
    setTimeout(() => {
      const lucky = Math.random() > 0.3; // 70% success rate
      if (lucky) {
        setGcalSyncState("Connected");
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        triggerToast("Inbuilt Calendar synchronization succeeded.", "success");
      } else {
        setGcalSyncState("Failed");
        triggerToast("Inbuilt Calendar sync failed. Host timed out.", "error");
      }
      setIsSyncing(false);
    }, 1500);
  };

  // 7. EMAIL TEMPLATES (UI PREVIEWS)
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<string>("booking_confirm");
  const emailTemplates = [
    { id: "booking_confirm", label: "Booking Confirmation" },
    { id: "appt_reminder", label: "Appointment Reminder" },
    { id: "reschedule", label: "Reschedule Notice" },
    { id: "cancellation", label: "Cancellation Notice" },
    { id: "doc_leave", label: "Doctor Leave Advisory" },
    { id: "med_reminder", label: "Medication Reminder" },
    { id: "followup_reminder", label: "Follow-up Reminder" },
    { id: "ai_summary", label: "AI Summary Ready" },
    { id: "new_rx", label: "New Prescription Released" }
  ];

  // Helper to retrieve selected email template content
  const getEmailContent = () => {
    switch (selectedEmailTemplate) {
      case "booking_confirm":
        return {
          subject: "CONFIRMED: Clinical consultation with Dr. Sarah Jenkins",
          preheader: "Your appointment details and intake steps are enclosed.",
          title: "Your Booking is Confirmed",
          body: "Thank you for trust in CareBridge. We have reserved your physical slot with Dr. Sarah Jenkins. Please arrive 10 minutes early to complete initial telemetry checks, or submit your forms online.",
          doctor: "Dr. Sarah Jenkins (Cardiologist)",
          datetime: "Friday, July 3rd, 2026 at 10:30 AM",
          cta: "Complete Pre-Check Forms",
          footer: "Metro Health Heart Institute, Clinic Wing A"
        };
      case "appt_reminder":
        return {
          subject: "REMINDER: Your telehealth session is in 24 hours",
          preheader: "Join directly from your CareBridge dashboard widget.",
          title: "Appointment Tomorrow",
          body: "This is an automated 24-hour check for your digital teleconsultation with Dr. David Kim. To ensure crystal-clear video communication, please test your camera and microphone in our browser portal prior to joining.",
          doctor: "Dr. David Kim (General Practitioner)",
          datetime: "Tomorrow, 11:50 AM",
          cta: "Join Telehealth Room",
          footer: "CareBridge Virtual Consult Space"
        };
      case "reschedule":
        return {
          subject: "ADVISORY: Your appointment has been rescheduled",
          preheader: "We have adjusted your session to match clinic times.",
          title: "Schedule Revision Notification",
          body: "Your upcoming checkup has been adjusted to Monday, July 6th. We sincerely apologize for any inconvenience caused by this shift in clinical shift assignments. Please confirm if this new block is acceptable.",
          doctor: "Dr. Sarah Jenkins",
          datetime: "Monday, July 6th, 2026 at 02:00 PM",
          cta: "Accept Reschedule Slot",
          footer: "Metro Health Heart Institute"
        };
      case "cancellation":
        return {
          subject: "CANCELLED: Your care appointment has been cancelled",
          preheader: "Canceled checkup status confirmation.",
          title: "Consultation Cancelled",
          body: "As requested, your scheduled appointment with Dr. Marcus Vance has been cancelled. Any pre-authorized copay holds have been released back to your bank account automatically. You can book an alternative date anytime.",
          doctor: "Dr. Marcus Vance",
          datetime: "Cancelled (Originally June 27th)",
          cta: "Rebook Consultation",
          footer: "St. Jude Children's Clinic"
        };
      case "doc_leave":
        return {
          subject: "URGENT: Dr. Elena Rostova on unexpected leave",
          preheader: "Schedule update for active neurological assessments.",
          title: "Temporary Provider Absence",
          body: "We regret to inform you that Dr. Elena Rostova is taking unexpected personal leave from July 10th through July 15th. Your scheduled session is suspended. You may select an alternative date or request automatic transfer to a matching clinician.",
          doctor: "Dr. Elena Rostova (Neurologist)",
          datetime: "Leave window: July 10th - July 15th",
          cta: "Find Similar Clinicians",
          footer: "Neuroscience Alliance Partnership"
        };
      case "med_reminder":
        return {
          subject: "DAILY REMINDER: Take Lisinopril 10mg",
          preheader: "Keep on top of your daily cardiac compliance plan.",
          title: "Medication intake due",
          body: "This is your scheduled CareBridge notification to take Lisinopril 10mg. For optimal absorption and vascular pressure regulation, take one tablet with a full glass of water, preferably after food.",
          doctor: "Prescribed by Dr. Sarah Jenkins",
          datetime: "Daily at 08:30 AM",
          cta: "Log Medication Taken",
          footer: "CareBridge Automated Pharmacy Sync"
        };
      case "followup_reminder":
        return {
          subject: "CARE BRIDGE: 14-Day Sinus Follow-up Due",
          preheader: "Ensure long-term recovery metrics are stabilized.",
          title: "Suggested Follow-up Care",
          body: "A periodic assessment is recommended to review your response to Atorvastatin lipid therapy. Booking this 15-minute follow-up slot ensures we can adapt prescription rates dynamically if throat irritation continues.",
          doctor: "Dr. Sarah Jenkins",
          datetime: "Due within 14 days",
          cta: "Secure Follow-up Now",
          footer: "CareBridge Preventative Health System"
        };
      case "ai_summary":
        return {
          subject: "READY: AI Translated Patient Care Summary",
          preheader: "Your doctor's complex notes made simple & clear.",
          title: "Your Plain-Language Summary",
          body: "Our medical-grade AI engine has completed the translation of your clinical documentation from Dr. Sarah Jenkins. All complex medical terms have been mapped into digestible, friendly action plans with calendar highlights.",
          doctor: "Parsed from Dr. Sarah Jenkins' files",
          datetime: "Available in Portal",
          cta: "Read Patient-Friendly Summary",
          footer: "Secure HIPAA HIPAA-certified NLP Node"
        };
      case "new_rx":
        return {
          subject: "RELEASED: New prescription available at pharmacy",
          preheader: "Ready for pickup or direct home delivery.",
          title: "Electronic Rx Transmitted",
          body: "A new prescription for Amoxicillin 500mg (21 Capsules, 3x daily) has been validated by your physician and transmitted to your neighborhood pharmacy. Present your CareBridge ID card at the counter to claim.",
          doctor: "Authorized by Dr. David Kim",
          datetime: "June 30th prescription release",
          cta: "Locate Designated Pharmacy",
          footer: "CareBridge E-Prescribing Core"
        };
      default:
        return {
          subject: "CareBridge Notification Update",
          preheader: "Stay connected to your care plan.",
          title: "System Update",
          body: "A new notice has been registered in your profile. Please sign in to read it.",
          doctor: "CareBridge Clinical System",
          datetime: "All sessions",
          cta: "Enter Patient Portal",
          footer: "Global Support Network"
        };
    }
  };

  // 8. CHRONOLOGICAL COMMUNICATION HISTORY
  const [commSearch, setCommSearch] = useState("");
  const [commTypeFilter, setCommTypeFilter] = useState<"all" | "email" | "notification" | "calendar" | "sms">("all");
  const [commHistory, setCommHistory] = useState<CommHistoryItem[]>([
    { id: "ch-1", type: "email", title: "Booking Confirmation Email", recipient: "alex.jones@gmail.com", timestamp: "Today, 10:45 AM", status: "delivered" },
    { id: "ch-2", type: "notification", title: "Appt confirmed in-app banner", recipient: "Alex Jones Portal", timestamp: "Today, 10:43 AM", status: "delivered" },
    { id: "ch-3", type: "calendar", title: "Inbuilt Calendar Event Pin", recipient: "CareBridge Inbuilt Calendar", timestamp: "Today, 10:43 AM", status: "delivered" },
    { id: "ch-4", type: "email", title: "Telehealth Reminder (24h)", recipient: "alex.jones@gmail.com", timestamp: "Yesterday, 11:50 AM", status: "delivered" },
    { id: "ch-5", type: "sms", title: "Intake due reminder text (SMS)", recipient: "+1 (555) 019-2831", timestamp: "Yesterday, 08:30 AM", status: "delivered" },
    { id: "ch-6", type: "email", title: "Daily Medication Reminder", recipient: "alex.jones@gmail.com", timestamp: "Yesterday, 08:30 AM", status: "delivered" },
    { id: "ch-7", type: "calendar", title: "Inbuilt Calendar Ledger Update", recipient: "CareBridge Calendar Daemon", timestamp: "2 days ago", status: "failed" },
    { id: "ch-8", type: "sms", title: "Emergency cancellation text", recipient: "+1 (555) 019-2831", timestamp: "3 days ago", status: "delivered" }
  ]);

  const handleRetryComm = (id: string) => {
    setCommHistory(prev => prev.map(ch => ch.id === id ? { ...ch, status: "pending" } : ch));
    triggerToast("Retrying transmission...", "info");
    setTimeout(() => {
      setCommHistory(prev => prev.map(ch => ch.id === id ? { ...ch, status: "delivered" } : ch));
      triggerToast("Transmission succeeded.", "success");
    }, 1200);
  };

  // 9. GRANULAR PREFERENCES MATRIX STATE
  const [prefChannels, setPrefChannels] = useState({
    appointments: { email: true, inapp: true, calendar: true, sms: true, push: false },
    medication: { email: false, inapp: true, calendar: false, sms: true, push: true },
    ai: { email: true, inapp: true, calendar: false, sms: false, push: false },
    system: { email: true, inapp: true, calendar: false, sms: false, push: false },
    promotions: { email: false, inapp: false, calendar: false, sms: false, push: false }
  });

  const handleTogglePref = (category: keyof typeof prefChannels, channel: "email" | "inapp" | "calendar" | "sms" | "push") => {
    setPrefChannels(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category][channel]
      }
    }));
    triggerToast("Preferences successfully updated.", "success");
  };

  // Action dispatcher when click a notification CTA
  const handleNotifCtaAction = (notif: NotificationItem) => {
    if (notif.actionText === "Mark Taken") {
      const targetMed = medications.find(m => m.name.toLowerCase().includes("lisinopril"));
      if (targetMed) {
        handleMedAction(targetMed.id, "taken");
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, unread: false } : n));
      }
    } else if (notif.actionId === "doctor-leave-trigger" || notif.title.includes("Elena Rostova")) {
      // open leave assistant
      setIsDoctorOnLeave(true);
      setActiveSubTab("medications");
      triggerToast("Absence assistance system loaded below.", "info");
      // scroll to bottom
      document.getElementById("doctor-leave-experience-section")?.scrollIntoView({ behavior: "smooth" });
    } else {
      triggerToast(`Redirecting to action: "${notif.actionText}"`, "success");
    }
  };

  // Switch to find similar doctor
  const handleAutoAssignDoctor = () => {
    const assigned = doctorsList[0] || null;
    setSelectedAlternativeDoc(assigned); 
    setShowAltDocDialog(true);
    triggerToast("Alternative general clinicians recommended.", "success");
  };

  const handleConfirmAltDoctor = () => {
    setIsDoctorOnLeave(false);
    setShowAltDocDialog(false);
    triggerCelebration("New care assignment complete!");
    triggerToast(`Appointment successfully reassigned to ${selectedAlternativeDoc?.name}. Calendar synchronized.`, "success");
  };

  // Filter computations for list views
  const filteredNotifications = notifications.filter(n => {
    if (n.archived) return false;
    if (notificationsFilter === "all") return true;
    if (notificationsFilter === "unread") return n.unread;
    return n.category === notificationsFilter;
  });

  const filteredHistory = commHistory.filter(ch => {
    const matchesSearch = ch.title.toLowerCase().includes(commSearch.toLowerCase()) ||
                          ch.recipient.toLowerCase().includes(commSearch.toLowerCase());
    const matchesType = commTypeFilter === "all" ? true : ch.type === commTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 relative" id="communication-reminders-hub">
      
      {/* 1. TOAST NOTIFICATION CONTAINER */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className={`fixed top-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border ${
              toastType === "success" 
                ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                : toastType === "error"
                ? "bg-red-50 border-red-100 text-red-800"
                : "bg-blue-50 border-blue-100 text-blue-800"
            }`}
            id="global-hub-toast"
          >
            {toastType === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {toastType === "error" && <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
            {toastType === "info" && <Info className="w-5 h-5 text-blue-600 shrink-0" />}
            <span className="text-xs font-semibold">{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="p-0.5 hover:bg-gray-200/50 rounded-full">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. CONFETTI CELEBRATION OVERLAY */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center pointer-events-none"
            id="celebration-overlay"
          >
            <motion.div
              initial={{ scale: 0.3, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-white border border-emerald-100 p-8 rounded-[32px] shadow-2xl flex flex-col items-center max-w-sm text-center space-y-4 pointer-events-auto mx-4"
            >
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center relative">
                <Sparkles className="w-8 h-8 text-emerald-600 animate-bounce" />
                <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping" />
              </div>
              <h4 className="text-lg font-black text-gray-900">Compliance Celebration!</h4>
              <p className="text-xs text-gray-500 font-sans leading-relaxed">
                {celebrationText || "Excellent job maintaining your care schedule. Consistency is the foundation of recovery."}
              </p>
              <div className="flex gap-1.5 justify-center py-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: `${s * 200}ms` }} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. DYNAMIC ABSENCE BANNER (DOCTOR LEAVE EXPERIENCE) */}
      <AnimatePresence>
        {isDoctorOnLeave && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-amber-50 border border-amber-100 rounded-3xl p-5 text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
            id="doctor-leave-experience-section"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Temporary Provider Absence</span>
                <h4 className="text-sm font-black text-gray-900 mt-0.5">Dr. Elena Rostova is temporarily unavailable</h4>
                <p className="text-xs text-gray-500 font-sans mt-1 leading-normal max-w-2xl">
                  Your regular Neurologist is taking unexpected leave (July 10th - July 15th). To prevent breaks in your migraine progress plan, we have pre-approved calendar routing for diagnostic reviews.
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
              <button 
                onClick={handleAutoAssignDoctor}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Find Similar Doctor
              </button>
              <button 
                onClick={() => {
                  triggerToast("Contacting customer care line (1-800-BRIDGE).", "info");
                }}
                className="px-4 py-2 bg-white border border-amber-200 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition-all"
              >
                Contact Support
              </button>
              <button 
                onClick={() => {
                  setIsDoctorOnLeave(false);
                  triggerToast("Absence advisory dismissed. Regular calendar state preserved.", "info");
                }}
                className="p-2 text-gray-400 hover:bg-amber-100 rounded-lg"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ALTERNATIVE CLINICIAN DIALOG */}
      {showAltDocDialog && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 w-full max-w-md rounded-3xl p-6 shadow-2xl text-left space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-base font-black text-gray-950">Recommended Alternative Clinicians</h4>
                <p className="text-xs text-gray-500 font-sans">Matching specialty and credentials instantly.</p>
              </div>
              <button onClick={() => setShowAltDocDialog(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {selectedAlternativeDoc ? (
              <div className="p-4 border border-emerald-50 bg-emerald-50/20 rounded-2xl flex items-center gap-3">
                <img 
                  src={selectedAlternativeDoc.image} 
                  alt={selectedAlternativeDoc.name} 
                  className="w-12 h-12 rounded-xl object-cover shrink-0 border-2 border-emerald-500/20"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 text-xs">
                  <h5 className="font-black text-gray-950">{selectedAlternativeDoc.name}</h5>
                  <p className="text-gray-500 font-sans">{selectedAlternativeDoc.specialty}</p>
                  <p className="text-[10px] text-emerald-700 font-bold mt-1">Available today • Rating: {selectedAlternativeDoc.rating} ★</p>
                </div>
                <button 
                  onClick={handleConfirmAltDoctor}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold"
                >
                  Select Doc
                </button>
              </div>
            ) : (
              <div className="p-4 border border-gray-100 bg-gray-50 rounded-2xl text-center">
                <p className="text-xs text-gray-500 font-medium">No registered medical specialists found in the directory.</p>
                <p className="text-[10px] text-gray-400 mt-1">Genuine clinicians can register themselves using the Portal SignUp page.</p>
              </div>
            )}

            <p className="text-[10px] text-gray-400 leading-normal font-sans">
              *All substitute doctors are board-certified, sync with your CareBridge diagnostic logs automatically, and are fully HIPAA-accredited.
            </p>
          </div>
        </div>
      )}

      {/* 4. WORKSPACE TAB STRIP HEADER */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-2 overflow-x-auto gap-3">
        <div className="flex items-center gap-1.5 shrink-0" id="communication-ecosystem-tabs">
          <button
            onClick={() => setActiveSubTab("medications")}
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === "medications"
                ? "bg-[#2E8B57] text-white shadow-md shadow-emerald-900/10"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Pill className="w-4 h-4" />
            <span>Medication Center</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab("notifications")}
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === "notifications"
                ? "bg-[#2E8B57] text-white shadow-md shadow-emerald-900/10"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notification Hub</span>
            {notifications.filter(n => n.unread).length > 0 && (
              <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                {notifications.filter(n => n.unread).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab("followup")}
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === "followup"
                ? "bg-[#2E8B57] text-white shadow-md shadow-emerald-900/10"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <CalendarClock className="w-4 h-4" />
            <span>Follow-up & Calendar</span>
          </button>

          <button
            onClick={() => setActiveSubTab("emails")}
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === "emails"
                ? "bg-[#2E8B57] text-white shadow-md shadow-emerald-900/10"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email & Logs</span>
          </button>

          <button
            onClick={() => setActiveSubTab("preferences")}
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === "preferences"
                ? "bg-[#2E8B57] text-white shadow-md shadow-emerald-900/10"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Alert Preferences</span>
          </button>
        </div>

        <div className="text-[10px] text-gray-400 font-bold shrink-0 md:flex items-center gap-1.5 hidden bg-emerald-50/40 px-3 py-1.5 rounded-xl border border-emerald-100/50">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Active Patient Communication Hub • HIPAA Encrypted</span>
        </div>
      </div>

      {/* 5. TAB VIEW CONTAINER WITH TRANSITIONS */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          
          {/* ========================================================== */}
          {/* TAB: MEDICATIONS CENTER                                    */}
          {/* ========================================================== */}
          {activeSubTab === "medications" && (
            <motion.div
              key="subtab-medications"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Quick Metrics Widgets */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm text-left">
                  <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block">Intake Target</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-gray-950">{takenDosesToday}</span>
                    <span className="text-xs text-gray-400">/ {totalDosesToday} doses</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      style={{ width: `${completionRate}%` }} 
                    />
                  </div>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm text-left">
                  <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block">Upcoming Dose</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h5 className="text-xs font-black text-gray-900 truncate">Atorvastatin</h5>
                      <span className="text-[10px] text-emerald-700 font-bold">09:30 PM tonight</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm text-left">
                  <span className="text-[9px] uppercase font-bold text-red-500 tracking-wider block">Missed Doses</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black text-red-500">{missedDosesToday}</span>
                    <span className="text-[10px] text-gray-400">Requires follow-up</span>
                  </div>
                  <span className="text-[9px] text-red-400 mt-1 block">Vitamin D3 was skipped or missed</span>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-3xl text-left flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-emerald-800 tracking-wider block">Compliance rate</span>
                    <span className="text-2xl font-black text-emerald-600 block mt-1">{completionRate}%</span>
                  </div>
                  <span className="text-[9px] text-emerald-700 font-semibold">Perfect weekly average</span>
                </div>
              </div>

              {/* Time Segments & Active Timelines */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Active Intake Timeline (Morning, Afternoon, Evening, Night) */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-gray-950 text-left">Today's Intake Schedule</h4>
                      <p className="text-[11px] text-gray-400 text-left">Log daily prescription status. Click mark taken to log compliance.</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border">
                      {(["all", "morning", "afternoon", "evening", "night"] as const).map((segment) => (
                        <button
                          key={segment}
                          onClick={() => setSelectedTimeOfDayFilter(segment)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold capitalize transition-all ${
                            selectedTimeOfDayFilter === segment
                              ? "bg-[#2E8B57] text-white shadow-xs"
                              : "text-gray-500 hover:text-gray-800"
                          }`}
                        >
                          {segment}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* TIMELINE RENDERER */}
                  <div className="space-y-3">
                    {medications
                      .filter(m => selectedTimeOfDayFilter === "all" || m.timeOfDay === selectedTimeOfDayFilter)
                      .map((med) => {
                        const isTaken = med.status === "taken";
                        const isSnoozed = med.status === "snoozed";
                        const isSkipped = med.status === "skipped";

                        return (
                          <div
                            key={med.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                              isTaken 
                                ? "bg-emerald-50/30 border-emerald-100 opacity-80" 
                                : med.missed 
                                ? "bg-red-50/20 border-red-100" 
                                : "bg-white border-gray-100 hover:border-emerald-600/30 shadow-xs"
                            }`}
                          >
                            <div className="flex items-start gap-3.5 text-left">
                              <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                                isTaken 
                                  ? "bg-emerald-100 text-emerald-700" 
                                  : med.missed 
                                  ? "bg-red-100 text-red-600" 
                                  : "bg-emerald-50 text-emerald-600"
                              }`}>
                                <Pill className="w-5 h-5" />
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <h5 className={`text-sm font-black ${isTaken ? "line-through text-gray-400" : "text-gray-900"}`}>
                                    {med.name} <span className="text-xs font-medium text-gray-500">({med.dosage})</span>
                                  </h5>
                                  {med.missed && (
                                    <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-black uppercase">
                                      Missed
                                    </span>
                                  )}
                                  {isSnoozed && (
                                    <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black uppercase">
                                      Snoozed
                                    </span>
                                  )}
                                  {isSkipped && (
                                    <span className="text-[8px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-black uppercase">
                                      Skipped
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400 font-semibold font-sans">
                                  <span className="text-emerald-700 bg-emerald-50/50 px-2 py-0.5 rounded">
                                    {med.timeStr}
                                  </span>
                                  <span>•</span>
                                  <span>{med.frequency}</span>
                                  <span>•</span>
                                  <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                                    {med.foodRelation}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0 justify-end">
                              {isTaken ? (
                                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-100/40 px-3 py-1.5 rounded-xl text-xs font-black">
                                  <CheckCircle2 className="w-4 h-4" /> Taken ✓
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleMedAction(med.id, "taken")}
                                    className="px-4 py-2 bg-[#2E8B57] hover:bg-[#2E8B57]/90 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Taken
                                  </button>
                                  <button
                                    onClick={() => handleMedAction(med.id, "snoozed")}
                                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition-all border border-gray-100"
                                  >
                                    Snooze
                                  </button>
                                  <button
                                    onClick={() => handleMedAction(med.id, "skipped")}
                                    className="px-3 py-2 bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-500 rounded-xl text-xs font-bold transition-all border border-gray-100"
                                  >
                                    Skip
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}

                    {medications.filter(m => selectedTimeOfDayFilter === "all" || m.timeOfDay === selectedTimeOfDayFilter).length === 0 && (
                      <div className="border border-dashed p-10 rounded-3xl text-center space-y-2">
                        <Pill className="w-8 h-8 text-gray-300 mx-auto" />
                        <h5 className="text-xs font-black text-gray-700">No scheduled intakes found</h5>
                        <p className="text-[10px] text-gray-400 font-sans">There are no prescription intakes configured for this selected segment filter.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button 
                      onClick={resetMedications}
                      className="text-xs text-[#2E8B57] hover:underline font-bold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reset Intake Schedule
                    </button>
                  </div>
                </div>

                {/* Right: Care Instructions & Pill Box Settings */}
                <div className="lg:col-span-4 space-y-6 text-left">
                  <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm space-y-3">
                    <h5 className="text-xs font-black text-gray-950 uppercase tracking-wide">Physician Instructions</h5>
                    <div className="p-3.5 bg-emerald-50/20 border border-emerald-100/50 rounded-2xl text-xs space-y-2 leading-relaxed">
                      <p className="text-gray-700 font-sans">
                        "Consistently taking your prescribed Atorvastatin at bedtime maximizes liver absorption. Avoid grapefruit juice while on lipid therapies. Lisinopril is stable, but watch for lingering morning throat coughs."
                      </p>
                      <strong className="text-[10px] block text-[#2E8B57]">— Dr. Sarah Jenkins (Cardiology)</strong>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm space-y-3">
                    <h5 className="text-xs font-black text-gray-950 uppercase tracking-wide">Smart Pill Cabinet</h5>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl">
                        <span className="text-gray-500">Refill Sync State</span>
                        <span className="text-emerald-700 font-black">Synced (4/4 Rx)</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl">
                        <span className="text-gray-500">Auto Pharmacy Delivery</span>
                        <span className="text-gray-950 font-bold">Walgreens #4120</span>
                      </div>
                      <button 
                        onClick={() => triggerToast("New prescription refill request submitted to Walgreens.", "success")}
                        className="w-full py-2.5 bg-emerald-50 text-[#2E8B57] hover:bg-emerald-100/50 rounded-xl text-xs font-bold transition-all border border-emerald-100 text-center"
                      >
                        Request Pharmacy Refill
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* ========================================================== */}
          {/* TAB: NOTIFICATION CENTER                                    */}
          {/* ========================================================== */}
          {activeSubTab === "notifications" && (
            <motion.div
              key="subtab-notifications"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Header and Bulk Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left">
                <div>
                  <h3 className="text-base font-black text-gray-950">In-App Notification Center</h3>
                  <p className="text-xs text-gray-500 font-sans">View booking alerts, medication intake window countdowns, and clinical advisories.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleMarkAllRead}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100/50 text-[#2E8B57] rounded-xl text-xs font-bold border border-emerald-100 transition-all"
                  >
                    Mark All as Read
                  </button>
                </div>
              </div>

              {/* Filtering Sub-tabs */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 pb-3" id="notifications-type-tabs">
                {(["all", "unread", "appointments", "medication", "ai", "system"] as const).map((filter) => {
                  const count = filter === "all" 
                    ? notifications.length 
                    : filter === "unread" 
                    ? notifications.filter(n => n.unread).length 
                    : notifications.filter(n => n.category === filter).length;

                  return (
                    <button
                      key={filter}
                      onClick={() => setNotificationsFilter(filter)}
                      className={`px-4.5 py-1.5 rounded-full text-xs font-bold capitalize transition-all flex items-center gap-1.5 ${
                        notificationsFilter === filter
                          ? "bg-gray-900 text-white"
                          : "bg-gray-50 hover:bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span>{filter}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                        notificationsFilter === filter ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-600"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Notification List Layout */}
              <div className="space-y-3">
                {filteredNotifications.map((notif) => {
                  let badgeBg = "bg-blue-50 border-blue-100 text-blue-700";
                  if (notif.category === "appointments") badgeBg = "bg-purple-50 border-purple-100 text-purple-700";
                  if (notif.category === "medication") badgeBg = "bg-emerald-50 border-emerald-100 text-[#2E8B57]";
                  if (notif.category === "ai") badgeBg = "bg-sky-50 border-sky-100 text-sky-700";
                  if (notif.category === "system") badgeBg = "bg-amber-50 border-amber-100 text-amber-700";

                  return (
                    <div
                      key={notif.id}
                      className={`p-5 rounded-3xl border text-left transition-all relative ${
                        notif.unread 
                          ? "bg-white border-emerald-500/25 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/5" 
                          : "bg-white border-gray-100 opacity-95"
                      }`}
                    >
                      {notif.unread && (
                        <div className="absolute top-5 right-5 w-2 h-2 bg-[#2E8B57] rounded-full animate-ping" />
                      )}

                      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                        
                        {/* Notif Meta & Body */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${badgeBg}`}>
                              {notif.category}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold font-sans">{notif.timestamp}</span>
                          </div>

                          <div className="space-y-1 text-left">
                            <h4 className="text-sm font-black text-gray-950 flex items-center gap-1.5">
                              {notif.title}
                            </h4>
                            <p className="text-xs text-gray-500 font-sans leading-relaxed max-w-3xl">
                              {notif.message}
                            </p>
                          </div>

                          {/* Specific Appointment Details if applicable */}
                          {notif.doctor && (
                            <div className="p-3.5 bg-gray-50/50 border rounded-2xl text-[11px] grid grid-cols-1 md:grid-cols-3 gap-2 max-w-xl font-sans mt-2">
                              <div>
                                <span className="text-gray-400 block uppercase text-[8px] font-bold">Clinician</span>
                                <strong className="text-gray-900 font-bold">{notif.doctor}</strong>
                              </div>
                              <div>
                                <span className="text-gray-400 block uppercase text-[8px] font-bold">Scheduled Time</span>
                                <strong className="text-gray-950">{notif.date} at {notif.time}</strong>
                              </div>
                              <div>
                                <span className="text-gray-400 block uppercase text-[8px] font-bold">Session Link</span>
                                <strong className="text-emerald-700 font-black truncate block">{notif.location}</strong>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action buttons (Right sidebar) */}
                        <div className="flex items-center gap-1.5 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-50">
                          {notif.actionText && (
                            <button
                              onClick={() => handleNotifCtaAction(notif)}
                              className="px-4 py-2 bg-[#2E8B57] hover:bg-[#2E8B57]/90 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1"
                            >
                              <span>{notif.actionText}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          {notif.unread && (
                            <button
                              onClick={() => handleMarkNotifRead(notif.id)}
                              className="p-2 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleArchiveNotif(notif.id)}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
                            title="Archive"
                          >
                            <Archive className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteNotif(notif.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}

                {filteredNotifications.length === 0 && (
                  <div className="bg-white border border-gray-100 p-16 rounded-[32px] text-center space-y-4 shadow-xs" id="unread-notifications-empty-state">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                      <BellOff className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-gray-900">All caught up!</h4>
                      <p className="text-xs text-gray-400 font-sans max-w-sm mx-auto">You have no unread items matching the selected filter. Perfect care alignment!</p>
                    </div>
                    <button 
                      onClick={() => setNotificationsFilter("all")}
                      className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border rounded-xl text-xs font-bold transition-all"
                    >
                      Show All Notifications
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ========================================================== */}
          {/* TAB: FOLLOW-UP & CALENDAR SYNC                             */}
          {/* ========================================================== */}
          {activeSubTab === "followup" && (
            <motion.div
              key="subtab-followup"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                
                {/* Left: Follow-up Manager */}
                <div className="lg:col-span-8 space-y-6">
                  <div>
                    <h3 className="text-base font-black text-gray-950">Follow-up Manager</h3>
                    <p className="text-xs text-gray-500 font-sans">Secure suggestions, review post-prescription milestone requirements, and keep recovery tracks aligned.</p>
                  </div>

                  {/* Horizontal Timeline Visualization */}
                  <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm space-y-4">
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-wide">Care Milestones Progression</h4>
                    
                    <div className="relative pt-2 pb-4">
                      {/* Line connector */}
                      <div className="absolute top-1/2 left-3 right-3 h-1 bg-gray-100 -translate-y-1/2 z-0" />
                      
                      <div className="relative z-10 flex justify-between text-center">
                        <div className="space-y-1.5 flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                            1
                          </div>
                          <span className="text-[10px] font-black text-gray-900 block font-sans">Intake Logged</span>
                          <span className="text-[8px] text-gray-400 font-semibold font-sans block">Completed</span>
                        </div>

                        <div className="space-y-1.5 flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                            2
                          </div>
                          <span className="text-[10px] font-black text-gray-900 block font-sans">Symptoms Analysed</span>
                          <span className="text-[8px] text-gray-400 font-semibold font-sans block">Completed</span>
                        </div>

                        <div className="space-y-1.5 flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 border-2 border-emerald-500 flex items-center justify-center text-xs font-bold">
                            3
                          </div>
                          <span className="text-[10px] font-black text-gray-900 block font-sans">Follow-up Due</span>
                          <span className="text-[8px] text-emerald-700 font-bold font-sans block">Pending (14d)</span>
                        </div>

                        <div className="space-y-1.5 flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs font-bold">
                            4
                          </div>
                          <span className="text-[10px] font-black text-gray-400 block font-sans">Maintenance Check</span>
                          <span className="text-[8px] text-gray-400 font-semibold font-sans block">Locked</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Follow-up Cards */}
                  <div className="space-y-3">
                    {followUps.map((fu) => {
                      let typeBadge = "bg-amber-100 text-amber-800 border-amber-200";
                      if (fu.type === "upcoming") typeBadge = "bg-emerald-100 text-emerald-800 border-emerald-200";
                      if (fu.type === "overdue") typeBadge = "bg-red-100 text-red-800 border-red-200 animate-pulse";

                      return (
                        <div
                          key={fu.id}
                          className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${typeBadge}`}>
                                {fu.type === "overdue" ? "Overdue Care" : fu.type}
                              </span>
                              <span className="text-[10px] text-gray-400 font-bold font-sans">{fu.timelinePhase}</span>
                            </div>

                            <div className="space-y-1 text-left">
                              <h4 className="text-sm font-black text-gray-950">{fu.title}</h4>
                              <p className="text-xs text-gray-500 font-sans leading-relaxed">
                                {fu.description}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold pt-1">
                                <CalendarRange className="w-3.5 h-3.5 text-gray-400" />
                                <span>Suggested Clinician: {fu.doctorName} ({fu.doctorSpecialty})</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-50">
                            <button
                              onClick={() => handleBookFollowUp(fu.id)}
                              className="px-4 py-2 bg-[#2E8B57] hover:bg-[#2E8B57]/90 text-white rounded-xl text-xs font-black shadow-xs transition-all"
                            >
                              Book Now
                            </button>
                            <button
                              onClick={() => triggerToast("Contacting clinic coordinators to request rescheduled dates.", "info")}
                              className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition-all border border-gray-100"
                            >
                              Contact Clinic
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {followUps.length === 0 && (
                      <div className="border border-dashed p-12 rounded-[32px] text-center space-y-3">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                        <h4 className="text-sm font-black text-gray-900">All follow-ups booked!</h4>
                        <p className="text-xs text-gray-400 font-sans max-w-sm mx-auto">There are no pending, suggested, or overdue follow-up milestones left. You are perfectly in sync.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Portal Inbuilt Calendar Integration */}
                <div className="lg:col-span-4 space-y-6">
                  <div>
                    <h3 className="text-base font-black text-gray-950">Inbuilt Calendar Sync</h3>
                    <p className="text-xs text-gray-500 font-sans">Manage inbuilt calendar synchronization and real-time appointment syncing.</p>
                  </div>

                  <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm space-y-5">
                    {/* Sync State Indicator */}
                    <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          gcalSyncState === "Connected" 
                            ? "bg-emerald-500 animate-pulse" 
                            : gcalSyncState === "Pending"
                            ? "bg-amber-500 animate-spin"
                            : "bg-red-500"
                        }`} />
                        <div>
                          <h4 className="text-xs font-black text-gray-950">Synchronization State</h4>
                          <span className="text-[10px] text-gray-400 font-sans">CareBridge Portal Engine</span>
                        </div>
                      </div>
                      
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${
                        gcalSyncState === "Connected" 
                          ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                          : gcalSyncState === "Pending"
                          ? "bg-amber-50 border-amber-100 text-amber-800"
                          : "bg-red-50 border-red-100 text-red-800"
                      }`}>
                        {gcalSyncState}
                      </span>
                    </div>

                    {/* Sync logs and actions */}
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-gray-50 rounded-2xl space-y-1">
                        <div className="flex justify-between text-gray-500">
                          <span>Last Calendared Sync:</span>
                          <strong className="text-gray-900">{lastSyncTime}</strong>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Event Schedules:</span>
                          <strong className="text-gray-900">2 active events synced</strong>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Active Scope:</span>
                          <strong className="text-[#2E8B57] font-semibold">carebridge.org/inbuilt-calendar</strong>
                        </div>
                      </div>

                      <button
                        onClick={handleReSyncGcal}
                        disabled={isSyncing}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                        <span>{isSyncing ? "Syncing..." : "Re-Sync Inbuilt Calendar"}</span>
                      </button>
                    </div>

                    {/* Quick Sync Settings toggles */}
                    <div className="space-y-3 border-t border-gray-50 pt-4">
                      <h5 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Reminder Milestones</h5>
                      
                      <div className="space-y-2.5 text-xs">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-gray-600 font-sans">24h Pre-Appointment Alert</span>
                          <input 
                            type="checkbox" 
                            checked={gcalPreferences.remind24h}
                            onChange={() => {
                              setGcalPreferences(prev => ({ ...prev, remind24h: !prev.remind24h }));
                              triggerToast("24h calendar alerts updated.", "success");
                            }}
                            className="w-4 h-4 text-[#2E8B57] rounded border-gray-300 focus:ring-[#2E8B57]"
                          />
                        </label>

                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-gray-600 font-sans">1h Pre-Appointment Alert</span>
                          <input 
                            type="checkbox" 
                            checked={gcalPreferences.remind1h}
                            onChange={() => {
                              setGcalPreferences(prev => ({ ...prev, remind1h: !prev.remind1h }));
                              triggerToast("1h calendar alerts updated.", "success");
                            }}
                            className="w-4 h-4 text-[#2E8B57] rounded border-gray-300 focus:ring-[#2E8B57]"
                          />
                        </label>

                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-gray-600 font-sans">Direct Email reminders</span>
                          <input 
                            type="checkbox" 
                            checked={gcalPreferences.emailRemind}
                            onChange={() => {
                              setGcalPreferences(prev => ({ ...prev, emailRemind: !prev.emailRemind }));
                              triggerToast("Email alerts updated.", "success");
                            }}
                            className="w-4 h-4 text-[#2E8B57] rounded border-gray-300 focus:ring-[#2E8B57]"
                          />
                        </label>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* ========================================================== */}
          {/* TAB: EMAIL CLIENT PREVIEWER & CHRONOLOGICAL HISTORY       */}
          {/* ========================================================== */}
          {activeSubTab === "emails" && (
            <motion.div
              key="subtab-emails"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                
                {/* Left side: Interactive Email Template Previews */}
                <div className="lg:col-span-7 space-y-4">
                  <div>
                    <h3 className="text-base font-black text-gray-950">Email Notifications Previewer</h3>
                    <p className="text-xs text-gray-500 font-sans">Select a CareBridge notification category to preview the live, high-fidelity responsive HTML templates dispatched to your personal inbox.</p>
                  </div>

                  {/* List of Email Templates Selectors */}
                  <div className="flex flex-wrap gap-1.5" id="email-previews-list">
                    {emailTemplates.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => setSelectedEmailTemplate(tpl.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          selectedEmailTemplate === tpl.id
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white border-gray-100 hover:border-gray-300 text-gray-600 shadow-2xs"
                        }`}
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>

                  {/* HTML Client Window Sandbox */}
                  <div className="bg-gray-100 border rounded-3xl overflow-hidden shadow-inner font-sans">
                    {/* Fake Email client header bar */}
                    <div className="bg-white border-b p-4 flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-400 block" />
                        <span className="w-3 h-3 rounded-full bg-amber-400 block" />
                        <span className="w-3 h-3 rounded-full bg-emerald-400 block" />
                      </div>
                      <div className="bg-gray-50 border rounded-lg px-4 py-1 flex-1 text-[11px] text-gray-400 text-center font-mono select-none">
                        mail.carebridge.org/inbox/preview
                      </div>
                    </div>

                    {/* Email Headers */}
                    <div className="bg-white p-4 border-b text-xs space-y-1.5 text-left select-text">
                      <div>
                        <span className="text-gray-400 font-sans mr-2">From:</span>
                        <strong className="text-emerald-700">CareBridge Diagnostics &lt;alerts@carebridge.org&gt;</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 font-sans mr-2">To:</span>
                        <strong className="text-gray-800">Alex Jones &lt;alex.jones@gmail.com&gt;</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 font-sans mr-2">Subject:</span>
                        <strong className="text-gray-950">{getEmailContent().subject}</strong>
                      </div>
                    </div>

                    {/* Email Body Canvas */}
                    <div className="bg-white p-8 max-w-lg mx-auto my-6 border rounded-2xl text-left space-y-6 shadow-md select-text">
                      {/* Logo header */}
                      <div className="flex items-center gap-2 border-b pb-4">
                        <div className="w-8 h-8 bg-[#2E8B57] rounded-lg flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-[#111827] tracking-tight leading-none">CareBridge</h4>
                          <span className="text-[8px] text-[#6B7280] font-black tracking-widest uppercase block mt-0.5">Care That Keeps You Connected</span>
                        </div>
                      </div>

                      {/* Email Body Text */}
                      <div className="space-y-4">
                        <h2 className="text-lg font-black text-gray-900">{getEmailContent().title}</h2>
                        <p className="text-xs text-gray-500 font-sans leading-relaxed">
                          {getEmailContent().body}
                        </p>

                        {/* Meta Container */}
                        <div className="p-4 bg-gray-50 rounded-2xl border text-xs space-y-1 font-sans">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Target Session:</span>
                            <strong className="text-gray-800">{getEmailContent().doctor}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Scheduled:</span>
                            <strong className="text-gray-800">{getEmailContent().datetime}</strong>
                          </div>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <div>
                        <button
                          onClick={() => triggerToast(`Clicked inside mock email preview: "${getEmailContent().cta}"`, "success")}
                          className="w-full py-3 bg-[#2E8B57] hover:bg-[#2E8B57]/95 text-white rounded-xl text-xs font-black shadow-md block text-center"
                        >
                          {getEmailContent().cta}
                        </button>
                      </div>

                      {/* Footer info */}
                      <div className="border-t pt-4 text-center space-y-1">
                        <span className="text-[10px] text-gray-400 block font-semibold">{getEmailContent().footer}</span>
                        <p className="text-[9px] text-gray-400 font-sans leading-normal">
                          This is an encrypted HIPAA-compliant transmission. CareBridge Inc, 100 Medical Center Parkway, San Francisco. If you did not request this, please contact help@carebridge.org
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side: Filterable Chronological History Logs */}
                <div className="lg:col-span-5 space-y-4">
                  <div>
                    <h3 className="text-base font-black text-gray-950">Communication History</h3>
                    <p className="text-xs text-gray-500 font-sans">Full logs of emails, in-app updates, calendar schedules, and SMS dispatches.</p>
                  </div>

                  <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm space-y-4">
                    {/* Search and Filters */}
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          placeholder="Search transmission logs..."
                          value={commSearch}
                          onChange={(e) => setCommSearch(e.target.value)}
                          className="w-full bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-100 rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
                        />
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {(["all", "email", "notification", "calendar", "sms"] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => setCommTypeFilter(type)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold capitalize transition-all ${
                              commTypeFilter === type
                                ? "bg-gray-800 text-white"
                                : "bg-gray-50 hover:bg-gray-100 text-gray-500"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timeline List of Logs */}
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                      {filteredHistory.map((item) => {
                        let iconColor = "text-blue-600 bg-blue-50";
                        if (item.type === "email") iconColor = "text-sky-600 bg-sky-50";
                        if (item.type === "calendar") iconColor = "text-purple-600 bg-purple-50";
                        if (item.type === "sms") iconColor = "text-amber-600 bg-amber-50";

                        const isFailed = item.status === "failed";
                        const isPending = item.status === "pending";

                        return (
                          <div
                            key={item.id}
                            className="p-3 bg-gray-50/50 border rounded-2xl flex items-center justify-between text-left gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
                                {item.type === "email" && <Mail className="w-4 h-4" />}
                                {item.type === "notification" && <Bell className="w-4 h-4" />}
                                {item.type === "calendar" && <Calendar className="w-4 h-4" />}
                                {item.type === "sms" && <Smartphone className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0 text-xs">
                                <h5 className="font-bold text-gray-900 truncate">{item.title}</h5>
                                <p className="text-[10px] text-gray-400 truncate font-sans">to: {item.recipient}</p>
                                <span className="text-[9px] text-gray-400 font-semibold font-sans">{item.timestamp}</span>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-1.5">
                              {isFailed ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-red-600 font-bold bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                                    Failed
                                  </span>
                                  <button
                                    onClick={() => handleRetryComm(item.id)}
                                    className="p-1 hover:bg-red-100 rounded-md text-red-600"
                                    title="Retry Send"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : isPending ? (
                                <span className="text-[9px] text-amber-600 font-bold bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded animate-pulse">
                                  Pending...
                                </span>
                              ) : (
                                <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                                  Sent
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {filteredHistory.length === 0 && (
                        <div className="text-center p-8 border border-dashed rounded-2xl space-y-1">
                          <Clock className="w-6 h-6 text-gray-300 mx-auto" />
                          <p className="text-[10px] text-gray-400 font-sans">No matching communication logs found.</p>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* ========================================================== */}
          {/* TAB: NOTIFICATION ALERTS & PREFERENCES MATRIX             */}
          {/* ========================================================== */}
          {activeSubTab === "preferences" && (
            <motion.div
              key="subtab-preferences"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-left"
            >
              <div>
                <h3 className="text-base font-black text-gray-950">Granular Notification Preferences</h3>
                <p className="text-xs text-gray-500 font-sans">Manage permissions and channels for individual care categories to optimize focus and minimize alarm fatigue.</p>
              </div>

              {/* Preferences Matrix */}
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                
                {/* Desktop View Header */}
                <div className="grid grid-cols-12 bg-gray-50 p-4 border-b text-[10px] uppercase font-black text-gray-400 tracking-wider">
                  <div className="col-span-4 text-left">Alert Category</div>
                  <div className="col-span-1.5 text-center">Email</div>
                  <div className="col-span-1.5 text-center">In-App</div>
                  <div className="col-span-1.5 text-center">Calendar</div>
                  <div className="col-span-1.5 text-center">SMS Text</div>
                  <div className="col-span-2 text-center">Push (App)</div>
                </div>

                <div className="divide-y divide-gray-50 text-xs font-semibold">
                  {/* Category row 1 */}
                  <div className="grid grid-cols-12 p-4 items-center">
                    <div className="col-span-4 text-left">
                      <h4 className="font-black text-gray-950">Appointment Schedules</h4>
                      <p className="text-[10px] text-gray-400 font-sans font-medium">Booking confirmations, reminders, cancel, rescheduled notes.</p>
                    </div>
                    <div className="col-span-1.5 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.appointments.email} 
                        onChange={() => handleTogglePref("appointments", "email")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                    <div className="col-span-1.5 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.appointments.inapp} 
                        onChange={() => handleTogglePref("appointments", "inapp")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                    <div className="col-span-1.5 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.appointments.calendar} 
                        onChange={() => handleTogglePref("appointments", "calendar")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                    <div className="col-span-1.5 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.appointments.sms} 
                        onChange={() => handleTogglePref("appointments", "sms")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.appointments.push} 
                        onChange={() => handleTogglePref("appointments", "push")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                  </div>

                  {/* Category row 2 */}
                  <div className="grid grid-cols-12 p-4 items-center">
                    <div className="col-span-4 text-left">
                      <h4 className="font-black text-gray-950">Medication Reminders</h4>
                      <p className="text-[10px] text-gray-400 font-sans font-medium">Daily countdowns, missed alerts, and auto-refill updates.</p>
                    </div>
                    <div className="col-span-1.5 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.medication.email} 
                        onChange={() => handleTogglePref("medication", "email")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                    <div className="col-span-1.5 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.medication.inapp} 
                        onChange={() => handleTogglePref("medication", "inapp")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                    <div className="col-span-1.5 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.medication.calendar} 
                        onChange={() => handleTogglePref("medication", "calendar")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                    <div className="col-span-1.5 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.medication.sms} 
                        onChange={() => handleTogglePref("medication", "sms")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.medication.push} 
                        onChange={() => handleTogglePref("medication", "push")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                  </div>

                  {/* Category row 3 */}
                  <div className="grid grid-cols-12 p-4 items-center">
                    <div className="col-span-4 text-left">
                      <h4 className="font-black text-gray-950">AI Summaries &amp; Telemetry</h4>
                      <p className="text-[10px] text-gray-400 font-sans font-medium">Patient-friendly translation alerts and medical-grade AI insight releases.</p>
                    </div>
                    <div className="col-span-1.5 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.ai.email} 
                        onChange={() => handleTogglePref("ai", "email")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                    <div className="col-span-1.5 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.ai.inapp} 
                        onChange={() => handleTogglePref("ai", "inapp")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                    <div className="col-span-1.5 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.ai.calendar} 
                        onChange={() => handleTogglePref("ai", "calendar")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                    <div className="col-span-1.5 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.ai.sms} 
                        onChange={() => handleTogglePref("ai", "sms")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.ai.push} 
                        onChange={() => handleTogglePref("ai", "push")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                  </div>

                  {/* Category row 4 */}
                  <div className="grid grid-cols-12 p-4 items-center">
                    <div className="col-span-4 text-left">
                      <h4 className="font-black text-gray-950">System updates</h4>
                      <p className="text-[10px] text-gray-400 font-sans font-medium">HIPAA credential updates, clinic policy revisions, and legal notices.</p>
                    </div>
                    <div className="col-span-1.5 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.system.email} 
                        onChange={() => handleTogglePref("system", "email")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                    <div className="col-span-1.5 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.system.inapp} 
                        onChange={() => handleTogglePref("system", "inapp")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                    <div className="col-span-1.5 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.system.calendar} 
                        onChange={() => handleTogglePref("system", "calendar")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                    <div className="col-span-1.5 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.system.sms} 
                        onChange={() => handleTogglePref("system", "sms")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.system.push} 
                        onChange={() => handleTogglePref("system", "push")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                  </div>

                  {/* Category row 5 */}
                  <div className="grid grid-cols-12 p-4 items-center">
                    <div className="col-span-4 text-left">
                      <h4 className="font-black text-gray-950">Promotions &amp; Health Insights</h4>
                      <p className="text-[10px] text-gray-400 font-sans font-medium">Monthly wellness digests, vaccine clinics notifications, and news.</p>
                    </div>
                    <div className="col-span-1.5 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.promotions.email} 
                        onChange={() => handleTogglePref("promotions", "email")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                    <div className="col-span-1.5 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.promotions.inapp} 
                        onChange={() => handleTogglePref("promotions", "inapp")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                    <div className="col-span-1.5 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.promotions.calendar} 
                        onChange={() => handleTogglePref("promotions", "calendar")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                    <div className="col-span-1.5 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.promotions.sms} 
                        onChange={() => handleTogglePref("promotions", "sms")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={prefChannels.promotions.push} 
                        onChange={() => handleTogglePref("promotions", "push")}
                        className="w-4 h-4 text-[#2E8B57] border-gray-300 rounded focus:ring-[#2E8B57]"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* SMS & Future push alerts advisory */}
              <div className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-2xl flex gap-3 text-xs leading-relaxed max-w-2xl font-sans text-gray-600">
                <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p>
                    <strong>SMS text and Mobile Push triggers (future channels):</strong> These channels will initiate immediate SMS dispatches and device push alerts. They are pre-configured to utilize the phone number specified in your CareBridge profile (ending in *2831). Carrier rates may apply.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
