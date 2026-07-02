/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Shield, Heart, Activity, Brain, AlertTriangle, 
  HelpCircle, Clock, Pill, Send, Upload, FileText, Trash2, 
  ArrowRight, RefreshCw, Printer, CheckCircle2, ChevronRight, 
  Info, ShieldAlert, Star, Bell, AlertCircle, TrendingUp, Check
} from "lucide-react";

// Types for AI Health Hub
interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  notes: string;
  warnings: string[];
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export default function AiClinicalHub() {
  // Offline / Error Simulation State
  const [isAiOffline, setIsAiOffline] = useState(false);
  const [showNotificationCount, setShowNotificationCount] = useState(3);

  // Active sub-tab inside AI Hub: "insights" | "symptoms" | "medications" | "reports" | "chat"
  const [aiSubTab, setAiSubTab] = useState<"insights" | "symptoms" | "medications" | "reports" | "chat">("insights");

  // Notifications List
  const [notifications, setNotifications] = useState([
    { id: "1", title: "New AI Summary Ready", desc: "Your pre-consultation report has been generated for review.", time: "Just now", unread: true },
    { id: "2", title: "Medication Advice Updated", desc: "AI suggested a hydration sync for your daily allergen intake.", time: "2 hours ago", unread: true },
    { id: "3", title: "Follow-up Recommendation", desc: "Annual cardiology screening recommendation compiled.", time: "1 day ago", unread: false }
  ]);

  // Toast Alerts
  const [toastMessage, setToastMessage] = useState("");
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // 1. AI Health Score Metrics
  const healthScore = 92;
  const adherenceScore = 96;
  const followUpConsistency = 90;
  const appointmentConsistency = 92;

  // 2. Interactive Symptom Analyzer Form State
  const [symptomText, setSymptomText] = useState("");
  const [painLevel, setPainLevel] = useState(4);
  const [durationText, setDurationText] = useState("3 days");
  const [medicalHistory, setMedicalHistory] = useState("None known");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStepText, setAnalysisStepText] = useState("");
  const [symptomOutput, setSymptomOutput] = useState<any | null>(null);

  // 3. Report Analyzer State
  const [selectedReportFile, setSelectedReportFile] = useState<string | null>(null);
  const [isAnalyzingReport, setIsAnalyzingReport] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const [reportOutput, setReportOutput] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 4. Interactive Chat Assistant State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "1", sender: "ai", text: "Hello! I am your CareBridge AI Medical Assistant. I can help translate your prescriptions, explain report terms, answer scheduling questions, or guide you through the patient portal. How can I support your care journey today?", timestamp: "10:40 AM" }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isAiTyping]);

  // Medications list
  const MEDICATIONS: Medication[] = [
    {
      id: "rx-1",
      name: "Atorvastatin",
      dose: "20mg",
      frequency: "Once daily",
      duration: "Chronic (Ongoing)",
      notes: "High-efficacy lipid management control.",
      warnings: ["Take after dinner / before bedtime", "Avoid grapefruit juice", "Report severe muscle pain immediately"],
      timeOfDay: "night"
    },
    {
      id: "rx-2",
      name: "Amoxicillin",
      dose: "500mg",
      frequency: "Three times daily",
      duration: "Finish 7-day coarse",
      notes: "Targeting seasonal allergy-triggered sinus infection.",
      warnings: ["Take with a full glass of water", "Can take with or without food", "Do not skip doses"],
      timeOfDay: "morning"
    },
    {
      id: "rx-3",
      name: "Lisinopril",
      dose: "10mg",
      frequency: "Once daily",
      duration: "Ongoing",
      notes: "Systolic pressure stabilizing therapeutic agent.",
      warnings: ["Take in the morning", "Avoid excessive potassium supplements", "Stand up slowly from sitting positions"],
      timeOfDay: "morning"
    }
  ];

  // Helper trigger to simulate symptom analysis
  const handleAnalyzeSymptoms = () => {
    if (!symptomText.trim()) {
      triggerToast("Please describe your current symptoms first.");
      return;
    }

    if (isAiOffline) {
      // Offline fallback triggers immediately
      triggerToast("Simulated AI service interruption encountered.");
      return;
    }

    setIsAnalyzing(true);
    setSymptomOutput(null);
    setAnalysisProgress(5);
    setAnalysisStepText("Parsing physical description...");

    const steps = [
      { p: 30, text: "Consulting safe clinical symptom matrices..." },
      { p: 65, text: "Generating patient-friendly risk classification guidelines..." },
      { p: 90, text: "Formulating suggested clinician consultation queries..." },
      { p: 100, text: "Complete" }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setAnalysisProgress(step.p);
        setAnalysisStepText(step.text);
        if (step.p === 100) {
          setIsAnalyzing(false);
          // Set simulated outputs based on keywords
          let rating = "Low";
          let badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
          let conditions = ["Muscle Tension", "Mild Physical Strain"];
          let questions = [
            "Are there stretches or active physical therapies suited to relieve this muscle fatigue?",
            "Should I completely avoid training, or are low-impact cycles beneficial?",
            "What baseline pain relievers match my ongoing medication list safely?"
          ];
          let redFlags = "Seek prompt emergency clinical care if you experience sharp chest pain, shortness of breath, severe radiating back distress, or sudden loss of motor balance.";

          const lower = symptomText.toLowerCase();
          if (lower.includes("chest") || lower.includes("breath") || lower.includes("pressure") || painLevel >= 8) {
            rating = "High";
            badgeColor = "bg-red-50 text-red-800 border-red-200 ring-2 ring-red-500 ring-offset-2 animate-pulse";
            conditions = ["Acute Myocardial Tension Risk", "Cardiovascular Exertion Syndrome"];
            questions = [
              "Could these localized chest patterns indicate cardiac fatigue?",
              "What diagnostic metrics (such as a 12-lead ECG) should be run immediately?",
              "Should I restrict active exertion until my vascular biomarkers return normal?"
            ];
            redFlags = "🚨 IMMEDIATE MEDICAL DANGER ALERT: Sharp chest pressure radiating to the neck, jaw, or left arm, severe shortness of breath, sudden sweating, or extreme dizziness requires calling emergency services (911) immediately.";
          } else if (lower.includes("head") || lower.includes("migraine") || lower.includes("vision") || painLevel >= 5) {
            rating = "Medium";
            badgeColor = "bg-amber-50 text-amber-800 border-amber-200";
            conditions = ["Acute Vascular Migraine", "Tension-type Cephalea"];
            questions = [
              "Is this focal headache tension-based, or are vascular triggers highly likely?",
              "Are abortive migraine treatments recommended alongside my lipid prescription?",
              "What physical stressors or dietary allergens should I track over the next 14 days?"
            ];
            redFlags = "Seek immediate clinical aid if you experience 'thunderclap' headaches (sudden worst-ever pain), neck stiffness paired with high fever, facial droop, or sudden speaking difficulties.";
          }

          setSymptomOutput({
            urgency: rating,
            urgencyColor: badgeColor,
            chiefComplaint: `Clinical classification: ${symptomText.slice(0, 80)}${symptomText.length > 80 ? '...' : ''} with documented Pain Index ${painLevel}/10 for a duration of ${durationText}.`,
            possibleConditions: conditions,
            suggestedQuestions: questions,
            importantWarnings: redFlags,
            confidenceScore: painLevel > 7 ? "Medium (78%)" : "High (94%)",
            reviewPending: true
          });
          triggerToast("AI Symptom Analysis generated successfully!");
        }
      }, (idx + 1) * 800);
    });
  };

  // Helper trigger to simulate report analyzer
  const handleAnalyzeReport = (filename: string) => {
    setSelectedReportFile(filename);
    setIsAnalyzingReport(true);
    setReportOutput(null);
    setReportProgress(10);

    const steps = [35, 70, 95, 100];
    steps.forEach((p, idx) => {
      setTimeout(() => {
        setReportProgress(p);
        if (p === 100) {
          setIsAnalyzingReport(false);
          // Set custom mock output based on file name
          if (filename.toLowerCase().includes("blood") || filename.toLowerCase().includes("lipid")) {
            setReportOutput({
              type: "Comprehensive Metabolic & Lipid Diagnostic Panel",
              date: "June 16, 2026",
              highlights: [
                { parameter: "LDL Cholesterol", value: "112 mg/dL", evaluation: "Mildly Elevated", range: "Optimal: <100 mg/dL", friendly: "Your LDL is slightly elevated, but safely aligned with your nightly Atorvastatin dose." },
                { parameter: "Hemoglobin A1c", value: "5.4%", evaluation: "Healthy / Optimal", range: "Normal: 4.0% - 5.6%", friendly: "Your average blood sugar over the last 3 months is excellent." },
                { parameter: "Serum Potassium", value: "4.1 mEq/L", evaluation: "Normal / Healthy", range: "Normal: 3.5 - 5.0 mEq/L", friendly: "Your potassium levels are stable, which is great for cardiac rhythm." }
              ],
              summary: "The panel demonstrates outstanding therapeutic adherence. Metabolic sugar markers are fully normal. Lipid profiles show minor elevation but remain safe within the therapeutic corridor of your prescribed statin. Continue standard diet protocols."
            });
          } else {
            setReportOutput({
              type: "Diagnostic Imaging / Clinical Report Extract",
              date: "June 29, 2026",
              highlights: [
                { parameter: "Pulmonary Inflation", value: "Clear", evaluation: "Optimal", range: "Healthy inflation", friendly: "Your lungs are expanding fully and are completely clear." },
                { parameter: "Sinus Cavity Density", value: "Mild Congestion", evaluation: "Moderate Irritation", range: "No fluid levels", friendly: "Subtle congestion is noted, matching seasonal allergies." }
              ],
              summary: "No acute cardiopulmonary pathology. Lungs are clear of active infiltrates. Mild upper sinus mucosal irritation is consistent with documented allergy reports."
            });
          }
          triggerToast("Diagnostic report parsed and translated!");
        }
      }, (idx + 1) * 600);
    });
  };

  // Simulating the Chat Bot Assistant replies
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: "user",
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    const query = chatInput.toLowerCase();
    setChatInput("");
    setIsAiTyping(true);

    setTimeout(() => {
      let aiText = "I understand you have questions. Remember, as your CareBridge AI Assistant, my goal is to simplify portal operations. For any clinical adjustments, please consult your doctor directly.";
      
      if (query.includes("atorvastatin") || query.includes("statin") || query.includes("cholesterol")) {
        aiText = "Atorvastatin (20mg) is prescribed to manage lipid profiles and support vascular strength. It should ideally be taken in the evening or before bedtime, as cholesterol synthesis peaking occurs at night. Please avoid drinking grape fruit juice as it can increase the concentration of Atorvastatin in your bloodstream.";
      } else if (query.includes("amoxicillin") || query.includes("antibiotic")) {
        aiText = "Amoxicillin (500mg) is a broad-spectrum antibiotic prescribed to clear the sinus inflammation. It is vital to complete the entire 7-day course even if you start feeling perfectly healthy. This prevents bacterial resistance recurrence.";
      } else if (query.includes("side effect") || query.includes("muscle")) {
        aiText = "For Atorvastatin, rare side effects include muscle aches or joint pain. If you experience severe unexplained muscle pain, tenderness, or weakness, please alert your doctor immediately. For Amoxicillin, mild digestive discomfort is possible; taking it with food helps soothe the stomach.";
      } else if (query.includes("report") || query.includes("blood") || query.includes("lab")) {
        aiText = "You can upload files in the 'Report Analyzer' tab above. The AI will extract complex clinical terminology and translate the lab highlights into a patient-friendly summary. Try uploading your 'Blood Lipid Diagnostic Panel' there!";
      } else if (query.includes("schedule") || query.includes("appointment") || query.includes("book")) {
        aiText = "To book a face-to-face or virtual consultation, you can navigate to the 'Book Consultation' tab in the main sidebar. You can review available clinician schedules, secure slots, and complete booking forms there.";
      }

      setChatMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: "ai",
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsAiTyping(false);
    }, 1200);
  };

  const handleQuickPromptClick = (text: string) => {
    setChatInput(text);
    setTimeout(() => {
      // Trigger message send
      triggerToast(`Selected: "${text}"`);
    }, 100);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    setShowNotificationCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="space-y-6 text-left" id="ai-clinical-hub-wrapper">
      
      {/* GLOBAL TOAST OVERLAY */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-6 left-1/2 z-[100] bg-emerald-900 border border-emerald-500 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold"
            id="hub-toast"
          >
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <div className="bg-white border border-[#E5E7EB] p-6 rounded-3xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1.5 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" /> CareBridge Clinical Intelligence
            </span>
            <button
              onClick={() => {
                setIsAiOffline(!isAiOffline);
                triggerToast(isAiOffline ? "AI clinical servers are live." : "Offline failure scenario simulated.");
              }}
              className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-all ${
                isAiOffline 
                  ? "bg-red-50 text-red-700 border-red-200" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent"
              }`}
            >
              {isAiOffline ? "🔴 Simulate Live Mode" : "⚠️ Simulate Server Offline"}
            </button>
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight font-sans">
            AI Healthcare Intelligence Center
          </h2>
          <p className="text-xs text-gray-500 max-w-xl font-medium">
            Review synthetic diagnostic assessments, explain complex lab reports, explore medication schedules, or chat with our HIPAA-compliant assistant.
          </p>
        </div>

        {/* AI Privacy & Encryption Message */}
        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl max-w-xs text-left text-[10px] space-y-1.5 shrink-0 z-10">
          <p className="font-extrabold text-emerald-800 uppercase tracking-widest flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-600" /> Fully Secured Environment
          </p>
          <ul className="space-y-1 text-gray-500 font-semibold list-disc list-inside">
            <li>End-to-end clinical encryption active</li>
            <li>AI outputs are auxiliary & reviewed by MDs</li>
            <li>You control data sharing permissions</li>
          </ul>
        </div>
      </div>

      {/* SUB TABS NAVIGATION */}
      <div className="flex bg-gray-100/80 p-1 rounded-2xl w-full overflow-x-auto divide-x divide-gray-200/50 shadow-inner scrollbar-none" id="ai-hub-subtabs">
        {[
          { id: "insights", label: "Dashboard & Insights", icon: Activity },
          { id: "symptoms", label: "Symptom Pre-Screen", icon: Brain },
          { id: "medications", label: "Medicine Intelligence", icon: Pill },
          { id: "reports", label: "Lab Report Analyzer", icon: FileText },
          { id: "chat", label: "Empathetic Assistant Chat", icon: Sparkles }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSel = aiSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAiSubTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold transition-all whitespace-nowrap border-0 ${
                isSel 
                  ? "bg-emerald-700 text-white shadow-sm rounded-xl" 
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isSel ? "text-emerald-300" : "text-gray-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CORE DISPLAY VIEWS */}
      <div className="min-h-[500px]">

        {/* ========================================================= */}
        {/* TAB 1: AI HEALTH INSIGHTS DASHBOARD & OPTIONAL SCORE     */}
        {/* ========================================================= */}
        {aiSubTab === "insights" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            id="ai-insights-view"
          >
            {/* Left Col: Bento Health widgets & Trends (col-span-8) */}
            <div className="lg:col-span-8 space-y-6 text-left">
              
              {/* Daily AI Suggestion Message */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 rounded-3xl relative overflow-hidden shadow-lg border border-gray-700">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex justify-between items-center pb-2">
                  <span className="text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-md flex items-center gap-1 tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-emerald-300" /> Active AI Summary Recommendation
                  </span>
                  <span className="text-[9px] font-mono text-gray-400 font-bold">10:04 AM • America/Los_Angeles</span>
                </div>
                <div className="space-y-2 mt-2">
                  <h3 className="text-base font-black text-white">Daily Personalized Health Insight</h3>
                  <p className="text-xs text-gray-300 leading-relaxed font-medium">
                    "Alex, based on your cardiovascular evaluation and medication adherence of 96% over the last 30 days, your systolic levels are highly stable. Pollen metrics in your locality are classified high today. If you experience minor nasal or sinus discomfort, your prescribed morning Amoxicillin will continue therapeutic protection. Please ensure you consume Amoxicillin with water and maintain your bedtime Atorvastatin schedule. Reach out to Dr. Sarah Jenkins if dry cough worsens."
                  </p>
                </div>
                <div className="border-t border-gray-700/80 pt-3 mt-4 flex items-center justify-between text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-emerald-500" /> Fully Encrypted Patient Logs</span>
                  <button 
                    onClick={() => triggerToast("Summary successfully downloaded as text format.")}
                    className="text-emerald-400 hover:underline font-bold"
                  >
                    Download Summary Log
                  </button>
                </div>
              </div>

              {/* Bento Grid: Upcoming, Trends, Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Upcoming Follow-up & Plan */}
                <div className="bg-white border border-[#E5E7EB] p-5 rounded-3xl shadow-sm space-y-3">
                  <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Upcoming Plan</span>
                  <h4 className="text-sm font-black text-gray-900">Cardiology Clearance Follow-up</h4>
                  <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                    Scheduled on July 2, 2026, with Dr. Sarah Jenkins at CareBridge Center.
                  </p>
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-2 text-[11px] text-emerald-800 font-bold">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Countdown: 2 days remaining</span>
                  </div>
                </div>

                {/* AI Safety Suggestions */}
                <div className="bg-white border border-[#E5E7EB] p-5 rounded-3xl shadow-sm space-y-3">
                  <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">AI Guardrail Suggestions</span>
                  <ul className="space-y-2">
                    {[
                      { icon: Pill, text: "Consume Lisinopril precisely in mornings." },
                      { icon: Activity, text: "Track weight and log morning pulse rate." },
                      { icon: Shield, text: "Avoid grapefruit juice with Atorvastatin." }
                    ].map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <li key={idx} className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          <Icon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{item.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

              </div>

              {/* Health Trends Section */}
              <div className="bg-white border border-[#E5E7EB] p-6 rounded-3xl shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" /> Longitudinal Biomarker Trends
                  </h3>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-black px-2.5 py-0.5 rounded">
                    Clinical Lab Derived
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "Blood Pressure", val: "118/76 mmHg", trend: "Stable (Healthy)", desc: "Controlled by daily Lisinopril." },
                    { label: "LDL Cholesterol", val: "112 mg/dL", trend: "-12% improvement", desc: "Successfully responsive to Atorvastatin." },
                    { label: "Fasting Glucose", val: "92 mg/dL", trend: "Excellent range", desc: "No cardiovascular metabolic risk." }
                  ].map((tr, idx) => (
                    <div key={idx} className="p-4 bg-[#FCFFFD] border rounded-2xl space-y-1.5">
                      <span className="text-[9px] uppercase font-bold text-gray-400">{tr.label}</span>
                      <p className="text-lg font-black text-gray-900">{tr.val}</p>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded block w-max">
                        {tr.trend}
                      </span>
                      <p className="text-[10px] text-gray-400 font-medium pt-1">{tr.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Documents & Diagnostics */}
              <div className="bg-white border border-[#E5E7EB] p-5 rounded-3xl shadow-sm space-y-3">
                <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Filed Lab Diagnostics</span>
                <div className="space-y-2.5">
                  {[
                    { name: "Metabolic & Blood Lipid Panel", date: "June 16, 2026", size: "1.4 MB" },
                    { name: "Sinus Inflammatory Mucosal Swab", date: "June 29, 2026", size: "450 KB" }
                  ].map((doc, idx) => (
                    <div key={idx} className="p-3 border rounded-2xl flex items-center justify-between text-xs hover:border-emerald-500/50 transition-all">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="font-bold text-gray-800">{doc.name}</p>
                          <span className="text-[9px] text-gray-400">{doc.date} • {doc.size}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setAiSubTab("reports");
                          handleAnalyzeReport(doc.name);
                        }}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-[10px] font-bold flex items-center gap-1 border border-emerald-100"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" /> AI Extract
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Col: AI Health Score & Notifications (col-span-4) */}
            <div className="lg:col-span-4 space-y-6 text-left">
              
              {/* Optional AI Health Score Widget */}
              <div className="bg-[#FCFFFD] border border-[#E5E7EB] p-6 rounded-3xl shadow-sm space-y-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/20 rounded-full blur-xl" />
                <div className="text-left">
                  <h4 className="text-sm font-black text-gray-900 flex items-center gap-1">
                    <Activity className="w-4.5 h-4.5 text-emerald-600" /> Overall Wellness Core
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Calculated Longitudinal Index</p>
                </div>

                {/* Score Circle Progress */}
                <div className="flex items-center justify-center py-4">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle 
                        cx="56" cy="56" r="50" 
                        stroke="#F3F4F6" strokeWidth="8" fill="transparent" 
                      />
                      <circle 
                        cx="56" cy="56" r="50" 
                        stroke="#0F766E" strokeWidth="8" fill="transparent" 
                        strokeDasharray={2 * Math.PI * 50}
                        strokeDashoffset={2 * Math.PI * 50 * (1 - healthScore / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-black text-teal-900 tracking-tight">{healthScore}%</span>
                      <span className="text-[9px] uppercase font-extrabold text-teal-700">Adherent</span>
                    </div>
                  </div>
                </div>

                {/* Sub-Metrics lists */}
                <div className="space-y-2.5 pt-2 border-t">
                  {[
                    { label: "Medication Adherence Rate", val: adherenceScore },
                    { label: "Follow-up Appointment Consistency", val: followUpConsistency },
                    { label: "Check-up Schedule Attendance", val: appointmentConsistency }
                  ].map((met, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-gray-500">
                        <span>{met.label}</span>
                        <span className="text-teal-900">{met.val}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-teal-700 h-full rounded-full" 
                          style={{ width: `${met.val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Essential Medical Disclaimer Label */}
                <div className="bg-amber-50/60 border border-amber-100 p-2.5 rounded-xl flex items-start gap-1.5 text-[9px] text-amber-800 leading-relaxed font-semibold">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Informational only.</strong> This score is an auxiliary AI metrics algorithm evaluating therapeutic consistency logs. Consult licensed medical specialists for clinical diagnoses.
                  </span>
                </div>
              </div>

              {/* AI Notifications Panel */}
              <div className="bg-white border border-[#E5E7EB] p-5 rounded-3xl shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-emerald-600" /> AI Alerts Feed
                  </h4>
                  {showNotificationCount > 0 && (
                    <span className="text-[9px] bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded-full">
                      {showNotificationCount} new
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {notifications.map((not) => (
                    <div 
                      key={not.id} 
                      onClick={() => markNotificationRead(not.id)}
                      className={`p-3 rounded-2xl text-xs space-y-1 cursor-pointer transition-all border ${
                        not.unread 
                          ? "bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50" 
                          : "bg-[#FCFFFD] border-transparent hover:bg-gray-50 text-gray-500"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <strong className={`font-bold ${not.unread ? "text-gray-900" : "text-gray-700"}`}>
                          {not.title}
                        </strong>
                        <span className="text-[8px] text-gray-400 font-mono">{not.time}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed font-medium">{not.desc}</p>
                      {not.unread && (
                        <span className="inline-block text-[8px] text-[#2E8B57] font-bold">
                          ✓ Mark as read
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PREMIUM AI SYMPTOM ANALYSIS & FLOW                  */}
        {/* ========================================================= */}
        {aiSubTab === "symptoms" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E5E7EB] p-6 lg:p-8 rounded-[24px] shadow-sm max-w-4xl mx-auto text-left space-y-6"
            id="ai-symptom-view"
          >
            {/* Header banner */}
            <div className="border-b pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-1.5">
                  <Brain className="w-5 h-5 text-emerald-600 animate-pulse" /> Advanced Symptom Pre-screening Tool
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  HIPAA-compliant syntactic modeling that simplifies physical symptoms into structured clinical categories.
                </p>
              </div>
              <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                Auxiliary Model V4.2
              </span>
            </div>

            {/* Simulated Offline Alert Block */}
            {isAiOffline && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-2.5 items-start">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="text-xs font-black text-red-900 uppercase">AI Diagnosis Engine Interrupted</h5>
                    <p className="text-[11px] text-red-700 leading-relaxed font-medium">
                      Your symptoms will be saved successfully. AI insights are temporarily offline. Your primary doctor will still receive your fully submitted questionnaire prior to meeting.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 self-stretch sm:self-auto">
                  <button 
                    onClick={() => {
                      setIsAiOffline(false);
                      triggerToast("Restored clinical link!");
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white hover:bg-red-700 text-xs font-bold rounded-xl"
                  >
                    Retry Connection
                  </button>
                  <button 
                    onClick={() => triggerToast("Proceeding to manual questionnaire logs.")}
                    className="flex-1 sm:flex-none px-4 py-2 border border-red-200 text-red-700 hover:bg-red-100 text-xs font-bold rounded-xl"
                  >
                    Continue Offline
                  </button>
                </div>
              </div>
            )}

            {!isAnalyzing && !symptomOutput ? (
              /* INPUT SECTION */
              <div className="space-y-6" id="symptom-input-form">
                
                {/* Symptom Preset Grid Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    Quick Preset Symptoms Demos:
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { title: "Chest Pressure Exertion", text: "Heavy localized pressure in mid-chest radiating down left elbow during high-exertion aerobic jog, onset 20 minutes ago.", pain: 8 },
                      { title: "Migraine Cephalea", text: "Throbbing unilateral left-sided headache localized behind optic eye, severe light irritation with secondary waves of nausea.", pain: 6 },
                      { title: "Mild Sinus Allergies", text: "Persistent sneezing, tickly scratchy throat, heavy morning congestion with moderate dry cough and general fatigue.", pain: 3 }
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSymptomText(preset.text);
                          setPainLevel(preset.pain);
                          triggerToast(`Selected: "${preset.title}"`);
                        }}
                        className="p-3 border rounded-2xl hover:border-emerald-500 bg-[#FCFFFD] text-left text-xs space-y-1 transition-all hover:bg-emerald-50/20"
                      >
                        <strong className="text-gray-800 text-xs flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" /> {preset.title}
                        </strong>
                        <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{preset.text}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Symptoms Textarea */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    1. Describe Symptoms In Your Own Words
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe anatomical feelings, discomfort thresholds, trigger contexts... (e.g., Unilateral pressure when climbing stairs, localized joint swelling...)"
                    className="w-full p-4 border rounded-2xl text-xs bg-[#FCFFFD] focus:ring-2 focus:ring-emerald-500/30"
                    value={symptomText}
                    onChange={(e) => setSymptomText(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Pain Index Slider */}
                  <div className="space-y-1.5 p-4 bg-gray-50 rounded-2xl border">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex justify-between">
                      <span>2. Pain Scale Index</span>
                      <span className="text-red-600 font-extrabold">{painLevel} / 10</span>
                    </label>
                    <input 
                      type="range"
                      min="1"
                      max="10"
                      className="w-full accent-red-600 cursor-pointer h-2 bg-gray-200 rounded-lg appearance-none mt-2"
                      value={painLevel}
                      onChange={(e) => setPainLevel(parseInt(e.target.value))}
                    />
                    <div className="flex justify-between text-[9px] text-gray-400 font-bold pt-1">
                      <span>1: Minimal</span>
                      <span>5: Discomforting</span>
                      <span>10: Emergency</span>
                    </div>
                  </div>

                  {/* Duration Input */}
                  <div className="space-y-1.5 p-4 bg-gray-50 rounded-2xl border flex flex-col justify-between">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                      3. Symptoms Duration
                    </label>
                    <select
                      className="w-full p-2 border rounded-xl bg-white text-xs font-bold"
                      value={durationText}
                      onChange={(e) => setDurationText(e.target.value)}
                    >
                      <option value="1 day">Onset less than 24 hours</option>
                      <option value="3 days">3 days (Standard transient)</option>
                      <option value="7 days">1 week (Persistent)</option>
                      <option value="14 days">2 weeks+ (Chronic alert)</option>
                    </select>
                    <span className="text-[8px] text-gray-400 leading-relaxed font-semibold">Allows models to gauge acute vs. chronic pathology profiles.</span>
                  </div>

                  {/* Medical History Brief */}
                  <div className="space-y-1.5 p-4 bg-gray-50 rounded-2xl border flex flex-col justify-between">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                      4. Associated Clinical History
                    </label>
                    <input 
                      type="text"
                      className="w-full p-2 border rounded-xl bg-white text-xs"
                      placeholder="e.g. Atorvastatin lipid regimen..."
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                    />
                    <span className="text-[8px] text-gray-400 leading-relaxed font-semibold">Include active pre-diagnoses or medication overrides.</span>
                  </div>

                </div>

                {/* Interactive Drag & Drop Reports area */}
                <div 
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      triggerToast(`Clinical attachment accepted: ${e.dataTransfer.files[0].name}`);
                    }
                  }}
                  className="p-6 border-2 border-dashed border-gray-200 rounded-3xl hover:border-emerald-500/50 bg-[#FCFFFD] text-center space-y-2 cursor-pointer transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="text-xs font-bold text-gray-700">Attach clinical reports, lipid blood works, or prescription photos</h4>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Drag & drop or Click to browse</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        triggerToast(`Report attached: ${e.target.files[0].name}`);
                      }
                    }}
                  />
                </div>

                {/* Submit Action */}
                <button
                  onClick={handleAnalyzeSymptoms}
                  disabled={!symptomText.trim()}
                  className={`w-full py-4 text-xs font-bold uppercase tracking-wider rounded-2xl text-center shadow-lg transition-all flex items-center justify-center gap-1.5 ${
                    symptomText.trim()
                      ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/10 hover:-translate-y-0.5"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" /> Execute HIPAA-Secure Analysis
                </button>

              </div>
            ) : isAnalyzing ? (
              /* PROGRESS STATE ANIMATION */
              <div className="py-16 text-center space-y-6" id="symptom-analysis-progress">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-50 animate-ping" />
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-700/30 border-t-emerald-700 animate-spin" />
                  <Brain className="w-8 h-8 text-emerald-700 animate-pulse" />
                </div>
                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h4 className="text-xs font-extrabold uppercase text-emerald-800 tracking-wider">Processing clinical telemetry...</h4>
                  <p className="text-xs font-bold text-gray-700">{analysisStepText}</p>
                  
                  {/* Visual Progress Bar */}
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-4">
                    <div 
                      className="bg-emerald-700 h-full rounded-full transition-all duration-300"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* OUTPUT RESULTS CONTAINER */
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
                id="symptom-analysis-output"
              >
                {/* Confidence & Urgency Header */}
                <div className="p-4 bg-gray-50 border rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs font-semibold">
                  <div className="flex flex-wrap gap-2.5 items-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${symptomOutput.urgencyColor}`}>
                      <AlertCircle className="w-3.5 h-3.5" /> Urgency Level: {symptomOutput.urgency}
                    </span>
                    
                    {/* Confidence Score Tooltip Trigger */}
                    <div className="group relative cursor-help inline-flex items-center gap-1 bg-white border px-2.5 py-1 rounded-full text-gray-500 text-[10px] font-bold">
                      <Star className="w-3 h-3 text-amber-500 fill-current" />
                      <span>AI Confidence: {symptomOutput.confidenceScore}</span>
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-gray-900 text-white text-[9px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center shadow-lg leading-relaxed z-10">
                        Confidence reflects AI certainty based on the specification and detailed density of symptoms provided.
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Human Review Required
                  </span>
                </div>

                {/* Translated chief complaint (Explainable AI) */}
                <div className="p-5 bg-[#FCFFFD] border border-gray-100 rounded-3xl space-y-2">
                  <span className="text-[9px] uppercase font-black text-[#2E8B57] tracking-wider flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" /> Explainable Pre-Triage Classification (Translated for Doctor)
                  </span>
                  <p className="text-xs text-gray-800 leading-relaxed font-mono p-3 bg-white border rounded-xl shadow-sm">
                    {symptomOutput.chiefComplaint}
                  </p>
                </div>

                {/* Possible Conditions & Suggested Doctor Queries */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Possible Non-Diagnostic Associations */}
                  <div className="p-5 bg-white border rounded-3xl space-y-3">
                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Potential Clinical Associations</span>
                    <ul className="space-y-2">
                      {symptomOutput.possibleConditions.map((cond: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{cond}</span>
                          <span className="text-[9px] font-mono text-gray-400 ml-auto">(Auxiliary reference only)</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[9px] text-gray-400 font-semibold leading-normal border-t pt-2.5">
                      Disclaimer: These are diagnostic guidelines only. The system does not diagnose. Consult your physician.
                    </p>
                  </div>

                  {/* Prepared Patient Questions to ask */}
                  <div className="p-5 bg-white border rounded-3xl space-y-3">
                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Prepared Questions for Your Doctor</span>
                    <ul className="space-y-2">
                      {symptomOutput.suggestedQuestions.map((q: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-gray-600 leading-relaxed">
                          <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Important Warnings Red Flag Block */}
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-left">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="text-xs font-black text-red-900 uppercase">Emergency Clinical Indicators</h5>
                    <p className="text-xs text-red-700 leading-relaxed font-semibold">
                      {symptomOutput.importantWarnings}
                    </p>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setSymptomOutput(null);
                      setSymptomText("");
                    }}
                    className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600"
                  >
                    Edit Symptom Questionnaire
                  </button>
                  <button
                    onClick={() => triggerToast("Clinical summary report saved & synchronized to physician ledger.")}
                    className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
                  >
                    Transmit to My Doctor Summary
                  </button>
                </div>
              </motion.div>
            )}

            {/* Interactive Journey Timeline display */}
            <div className="pt-8 border-t space-y-4">
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest text-center">Interactive Care Progress Journey</h4>
              
              <div className="relative flex flex-col md:flex-row justify-between items-center gap-4 max-w-2xl mx-auto pt-2" id="care-journey-timeline">
                {[
                  { step: "Symptoms Entered", active: true },
                  { step: "AI Analysis Complete", active: symptomOutput ? true : false },
                  { step: "Clinician Assessment", active: false },
                  { step: "Prescriptions Active", active: false },
                  { step: "Recovery Logs Healthy", active: false }
                ].map((st, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs font-black transition-all ${
                      st.active 
                        ? "bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/15" 
                        : "bg-white text-gray-300 border-gray-200"
                    }`}>
                      {i + 1}
                    </div>
                    <span className={`text-[10px] font-bold mt-2 text-center ${st.active ? "text-gray-900" : "text-gray-400"}`}>
                      {st.step}
                    </span>
                  </div>
                ))}
                {/* Horizontal Connector Line for Desktop */}
                <div className="hidden md:block absolute top-[18px] left-6 right-6 h-[2px] bg-gray-100 z-0" />
              </div>
            </div>

          </motion.div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: PRESCRIPTION INTELLIGENCE & SHIFTS TIMELINE       */}
        {/* ========================================================= */}
        {aiSubTab === "medications" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left"
            id="ai-prescription-view"
          >
            {/* Left Col: Medication Intake Timeline (col-span-8) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Timeline layout: Morning, Afternoon, Evening, Night */}
              <div className="bg-white border border-[#E5E7EB] p-6 rounded-3xl shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase">Visual Medication Schedule</h3>
                    <p className="text-xs text-gray-500">Your daily prescriptions mapped sequentially according to intake properties.</p>
                  </div>
                  <span className="text-[10px] font-bold text-[#2E8B57] bg-emerald-50 px-2 py-0.5 rounded border">
                    HIPAA Verified
                  </span>
                </div>

                <div className="relative border-l-2 border-dashed border-emerald-100 pl-6 space-y-6">
                  
                  {/* MORNING BLOCK */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white" />
                    <span className="text-[10px] uppercase font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded tracking-widest">
                      Morning (08:00 AM)
                    </span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      {MEDICATIONS.filter(m => m.timeOfDay === "morning").map((med) => (
                        <div key={med.id} className="p-4 bg-[#FCFFFD] border rounded-2xl space-y-2">
                          <div className="flex justify-between items-start">
                            <strong className="text-sm font-black text-gray-900">{med.name}</strong>
                            <span className="text-[10px] font-bold text-gray-500 font-mono bg-white border px-2 py-0.2 rounded">
                              {med.dose}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 font-semibold">{med.notes}</p>
                          
                          {/* Warnings box */}
                          <div className="flex flex-wrap gap-1 pt-1.5 border-t">
                            {med.warnings.map((w, idx) => (
                              <span key={idx} className="text-[8px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-extrabold uppercase">
                                {w}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AFTERNOON BLOCK */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-gray-300 border-2 border-white" />
                    <span className="text-[10px] uppercase font-black text-gray-500 bg-gray-50 px-2 py-0.5 rounded tracking-widest">
                      Afternoon (01:00 PM)
                    </span>
                    <p className="text-[10px] text-gray-400 italic mt-2">No active prescriptions mapped during afternoon shifts.</p>
                  </div>

                  {/* EVENING BLOCK */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-gray-300 border-2 border-white" />
                    <span className="text-[10px] uppercase font-black text-gray-500 bg-gray-50 px-2 py-0.5 rounded tracking-widest">
                      Evening (06:00 PM)
                    </span>
                    <p className="text-[10px] text-gray-400 italic mt-2">No active prescriptions mapped during evening shifts.</p>
                  </div>

                  {/* NIGHT BLOCK */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white" />
                    <span className="text-[10px] uppercase font-black text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded tracking-widest">
                      Bedtime / Night (09:30 PM)
                    </span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      {MEDICATIONS.filter(m => m.timeOfDay === "night").map((med) => (
                        <div key={med.id} className="p-4 bg-[#FCFFFD] border rounded-2xl space-y-2">
                          <div className="flex justify-between items-start">
                            <strong className="text-sm font-black text-gray-900">{med.name}</strong>
                            <span className="text-[10px] font-bold text-gray-500 font-mono bg-white border px-2 py-0.2 rounded">
                              {med.dose}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 font-semibold">{med.notes}</p>
                          
                          {/* Warnings box */}
                          <div className="flex flex-wrap gap-1 pt-1.5 border-t">
                            {med.warnings.map((w, idx) => (
                              <span key={idx} className="text-[8px] bg-red-50 text-red-800 px-1.5 py-0.5 rounded font-extrabold uppercase">
                                {w}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Right Col: Missed Dose Guidance & Interaction Alerts (col-span-4) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Missed Dose Guidance Widget */}
              <div className="bg-amber-50/40 border border-amber-100 p-6 rounded-3xl shadow-sm space-y-3">
                <span className="text-[9px] uppercase font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  ⚠️ Missed Dose Assistant Guidance
                </span>
                <h4 className="text-sm font-black text-gray-900 pt-1">Forgot your daily bedtime Atorvastatin?</h4>
                <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                  If the delay is within 12 hours of scheduled evening intake, consume the missed dose immediately. If the elapsed delay exceeds 12 hours, skip the missed dose and resume your regular bedtime cycle tomorrow morning.
                </p>
                <p className="text-[10px] text-red-800 font-bold leading-normal bg-white p-2.5 rounded-xl border">
                  ⛔ NEVER double-dose medications to catch up. This triggers dangerous blood toxic concentrations.
                </p>
              </div>

              {/* Medication Interaction Alerts */}
              <div className="bg-white border border-[#E5E7EB] p-5 rounded-3xl shadow-sm space-y-3">
                <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Drug-Drug Compatibility Matrix</span>
                
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs flex gap-2.5 items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-900 block font-bold">Atorvastatin + Lisinopril</strong>
                    <span className="text-[10px] text-emerald-700 font-medium">Safe Synergy verified. No pharmacological interaction warnings recorded.</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs flex gap-2.5 items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-900 block font-bold">Amoxicillin + Lisinopril</strong>
                    <span className="text-[10px] text-emerald-700 font-medium">Safe Synergy verified. Can be taken simultaneously safely.</span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: DIAGNOSTIC REPORT ANALYZER                         */}
        {/* ========================================================= */}
        {aiSubTab === "reports" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E5E7EB] p-6 lg:p-8 rounded-[24px] shadow-sm max-w-3xl mx-auto text-left space-y-6"
            id="ai-report-analyzer-view"
          >
            {/* Title */}
            <div className="border-b pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-1.5">
                  <FileText className="w-5 h-5 text-emerald-600" /> Lab Diagnostic Report Analyzer
                </h3>
                <p className="text-xs text-gray-500 font-medium">Extract dense medical values and jargon from blood sheets, scans, and PDFs into clear prose.</p>
              </div>
              <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                OCR Scanner Active
              </span>
            </div>

            {/* Simulated Drag and Drop region */}
            {!isAnalyzingReport && !reportOutput ? (
              <div className="space-y-6">
                <div 
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleAnalyzeReport(e.dataTransfer.files[0].name);
                    }
                  }}
                  className="p-10 border-2 border-dashed border-gray-200 rounded-3xl hover:border-emerald-500/50 bg-[#FCFFFD] text-center space-y-3 cursor-pointer transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-10 h-10 text-emerald-700 mx-auto" />
                  <h4 className="text-xs font-bold text-gray-700">Select any blood report panel or laboratory diagnostic sheet to scan</h4>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Drag & drop blood_lipid_panel.pdf, chest_xray.jpg or Browse Files</p>
                </div>

                {/* Demo Files Shortcuts */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Or demo with preset clinical uploads:</span>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleAnalyzeReport("Blood_Lipid_Panel_Report.pdf")}
                      className="flex-1 p-3.5 border rounded-2xl bg-[#FCFFFD] hover:bg-emerald-50/25 text-left text-xs space-y-1 hover:border-emerald-500/50 transition-all"
                    >
                      <strong className="text-gray-900 flex items-center gap-1">
                        <FileText className="w-4 h-4 text-emerald-600" /> Blood_Lipid_Panel_Report.pdf
                      </strong>
                      <span className="text-[9px] text-gray-400 font-semibold">Comprehensive lipid and cholesterol biochemical results.</span>
                    </button>

                    <button
                      onClick={() => handleAnalyzeReport("Chest_Sinus_Mucosal_Scan.pdf")}
                      className="flex-1 p-3.5 border rounded-2xl bg-[#FCFFFD] hover:bg-emerald-50/25 text-left text-xs space-y-1 hover:border-emerald-500/50 transition-all"
                    >
                      <strong className="text-gray-900 flex items-center gap-1">
                        <FileText className="w-4 h-4 text-emerald-600" /> Chest_Sinus_Mucosal_Scan.pdf
                      </strong>
                      <span className="text-[9px] text-gray-400 font-semibold">Inflammatory scan of sinuses and bronchial clearance.</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : isAnalyzingReport ? (
              /* PROGRESS LOADER */
              <div className="py-16 text-center space-y-4">
                <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin mx-auto" />
                <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Executing AI Laboratory Diagnostics extraction...</h4>
                <p className="text-xs text-gray-600 font-bold">Scanning parameters at {reportProgress}%...</p>
                
                <div className="w-48 bg-gray-100 h-1.5 rounded-full mx-auto overflow-hidden">
                  <div className="bg-emerald-700 h-full rounded-full transition-all duration-300" style={{ width: `${reportProgress}%` }} />
                </div>
              </div>
            ) : (
              /* OUTPUT SUMMARY */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
                id="report-analysis-results"
              >
                {/* Meta details */}
                <div className="p-4 bg-gray-50 border rounded-2xl flex justify-between items-center text-xs font-semibold">
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider block">Scanned File Category</span>
                    <strong className="text-gray-900 text-sm">{selectedReportFile}</strong>
                  </div>
                  <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded font-bold">
                    Scanned {reportOutput.date}
                  </span>
                </div>

                {/* Highlights Table/List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Extracted Key Biomarkers & Insights</h4>
                  
                  <div className="space-y-3">
                    {reportOutput.highlights.map((hl: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#FCFFFD] border rounded-2xl flex flex-col sm:flex-row justify-between gap-3 text-xs leading-relaxed">
                        <div className="space-y-1">
                          <strong className="text-gray-900 text-sm font-black">{hl.parameter}</strong>
                          <p className="text-[10px] text-gray-500 font-bold">{hl.range}</p>
                          <p className="text-xs text-gray-700 mt-1 font-semibold">{hl.friendly}</p>
                        </div>
                        <div className="text-right sm:self-center shrink-0">
                          <span className="text-base font-black text-gray-900 font-mono">{hl.value}</span>
                          <span className={`block text-[9px] font-extrabold uppercase mt-0.5 px-2 py-0.5 rounded ${
                            hl.evaluation.includes("Elevated") || hl.evaluation.includes("Irritation")
                              ? "bg-amber-50 text-amber-800 border"
                              : "bg-emerald-50 text-emerald-800"
                          }`}>
                            {hl.evaluation}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Friendly explanation summary block */}
                <div className="p-5 bg-emerald-950 text-white rounded-3xl space-y-2">
                  <span className="text-[9px] uppercase font-black text-emerald-300 tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> AI Translated Clinical Summary
                  </span>
                  <p className="text-xs text-emerald-10 font-medium leading-relaxed font-sans">
                    {reportOutput.summary}
                  </p>
                </div>

                {/* Reset button */}
                <button
                  onClick={() => {
                    setReportOutput(null);
                    setSelectedReportFile(null);
                  }}
                  className="w-full py-3 border border-gray-200 hover:bg-gray-50 text-xs font-bold rounded-xl text-gray-600"
                >
                  Analyze Alternative Laboratory File
                </button>
              </motion.div>
            )}

          </motion.div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: AI CHAT ASSISTANT & COMPREHENSIVE MEDICAL ANSWERS */}
        {/* ========================================================= */}
        {aiSubTab === "chat" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E5E7EB] rounded-3xl shadow-sm max-w-3xl mx-auto flex flex-col h-[550px] overflow-hidden"
            id="ai-chat-assistant-view"
          >
            {/* Header info */}
            <div className="bg-emerald-950 text-white p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-600 rounded-full flex items-center justify-center font-black">
                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-black tracking-tight uppercase">CareBridge Empathetic CareBot</h4>
                  <p className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider">HIPAA Diagnostic Assistant • Online</p>
                </div>
              </div>
              <span className="text-[9px] text-gray-400 bg-emerald-900 border border-emerald-800 px-2 py-0.5 rounded">
                Server Link: Healthy
              </span>
            </div>

            {/* Conversation list */}
            <div className="flex-grow p-5 overflow-y-auto bg-gray-50/50 space-y-4">
              
              {/* Emergency Banner at top of chat */}
              <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex gap-2.5 items-start text-left text-[10px] text-red-800 font-semibold leading-relaxed">
                <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0" />
                <span>
                  <strong>DISCLAIMER ALERT:</strong> For medical emergencies or acute worsening of respiratory, vascular, or neurological states, please dial 911 or contact emergency services immediately. CareBot serves auxiliary informational objectives only.
                </span>
              </div>

              {chatMessages.map((msg) => {
                const isAi = msg.sender === "ai";
                return (
                  <div key={msg.id} className={`flex ${isAi ? 'justify-start' : 'justify-end'} gap-2.5 items-end text-xs`}>
                    {isAi && (
                      <div className="w-7 h-7 bg-emerald-700 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0">
                        CB
                      </div>
                    )}
                    <div className={`max-w-md p-4 rounded-3xl text-left space-y-1 ${
                      isAi 
                        ? 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-bl-sm' 
                        : 'bg-emerald-700 text-white rounded-br-sm'
                    }`}>
                      <p className="leading-relaxed font-semibold">{msg.text}</p>
                      <span className={`block text-[8px] font-mono text-right ${isAi ? 'text-gray-400' : 'text-emerald-200'}`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isAiTyping && (
                <div className="flex justify-start gap-2.5 items-center">
                  <div className="w-7 h-7 bg-emerald-700 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0">
                    CB
                  </div>
                  <div className="p-3 bg-white border rounded-full flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestions replies shortcuts */}
            <div className="p-3 border-t bg-white flex gap-2 overflow-x-auto shrink-0 scrollbar-none" id="chat-shortcuts">
              {[
                { title: "Bedtime Statin rules", q: "What are the rules for taking Atorvastatin at bedtime?" },
                { title: "Amoxicillin food guide", q: "Should I take Amoxicillin with food?" },
                { title: "Lipid blood panel scan", q: "Can you explain how to analyze lipid panel?" },
                { title: "Atorvastatin muscle pain", q: "Is severe muscle pain common with Atorvastatin?" }
              ].map((sh, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPromptClick(sh.q)}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#2E8B57] text-[10px] font-bold rounded-2xl whitespace-nowrap border border-emerald-100/50"
                >
                  {sh.title}
                </button>
              ))}
            </div>

            {/* Chat inputs footer */}
            <div className="p-4 border-t bg-white flex gap-2 shrink-0">
              <input 
                type="text"
                placeholder="Ask CareBot about drug safety, reports, or symptom definitions..."
                className="flex-grow px-4 py-3 border border-gray-200 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500/30"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
              />
              <button
                onClick={handleSendMessage}
                className="p-3 bg-emerald-700 text-white rounded-2xl hover:bg-emerald-800 transition-all shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </motion.div>
        )}

      </div>

    </div>
  );
}
