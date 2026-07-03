/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Pill, 
  Activity, 
  User, 
  X, 
  Check, 
  AlertCircle, 
  FileText,
  CalendarCheck,
  Stethoscope,
  Heart
} from "lucide-react";
import { Doctor } from "../types";

interface Appointment {
  id: string;
  doctor: Doctor;
  date: string; // YYYY-MM-DD
  time: string;
  status: "booked" | "confirmed" | "consultation" | "completed";
  complaint: string;
  painScale: number;
}

interface MedicationReminder {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  taken: boolean;
  status: "taken" | "pending" | "missed";
  date?: string; // YYYY-MM-DD
}

interface CustomMark {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: "dose" | "symptom" | "note";
  description?: string;
}

interface PatientClinicalCalendarProps {
  appointments: Appointment[];
  medications: MedicationReminder[];
  doctorsList: Doctor[];
  onAddAppointment: (date: string, time: string, doctorId: string, doctorName: string, complaint: string, painScale: number) => Promise<any>;
  onCancelAppointment: (id: string) => void;
  onAddMedication: (med: Omit<MedicationReminder, 'id'>) => void;
  onToggleMedication: (id: string) => void;
  triggerToast: (msg: string) => void;
}

export default function PatientClinicalCalendar({
  appointments,
  medications,
  doctorsList,
  onAddAppointment,
  onCancelAppointment,
  onAddMedication,
  onToggleMedication,
  triggerToast
}: PatientClinicalCalendarProps) {
  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 2)); // Default to July 2026 based on mock timelines
  const [selectedDateStr, setSelectedDateStr] = useState<string>("2026-07-02");
  const [showDayDetailModal, setShowDayDetailModal] = useState(false);
  
  // Custom Events / Marks state (persisted locally)
  const [customMarks, setCustomMarks] = useState<CustomMark[]>(() => {
    const saved = localStorage.getItem("carebridge_custom_calendar_marks");
    return saved ? JSON.parse(saved) : [
      { id: "mark-1", date: "2026-07-02", title: "Checked blood pressure (120/80)", type: "note" },
      { id: "mark-2", date: "2026-07-05", title: "Took afternoon Insulin dosage", type: "dose" },
      { id: "mark-3", date: "2026-07-10", title: "Felt minor migraine at 4:00 PM", type: "symptom" }
    ];
  });

  useEffect(() => {
    localStorage.setItem("carebridge_custom_calendar_marks", JSON.stringify(customMarks));
  }, [customMarks]);

  // Tab inside Day Details Modal
  const [modalTab, setModalTab] = useState<"view" | "appt" | "dose" | "note">("view");

  // Scheduling Form States
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("10:00 AM");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [painScale, setPainScale] = useState(5);

  // Dose Form States
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [medFrequency, setMedFrequency] = useState("Once daily");
  const [medTime, setMedTime] = useState("08:00 AM");

  // Custom Mark Form States
  const [noteTitle, setNoteTitle] = useState("");
  const [noteType, setNoteType] = useState<"dose" | "symptom" | "note">("note");
  const [noteDesc, setNoteDesc] = useState("");

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calendar calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const formatDateStr = (dayNum: number) => {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(dayNum).padStart(2, '0');
    return `${year}-${mStr}-${dStr}`;
  };

  // Filter items for a given date
  const getAppointmentsForDate = (dateStr: string) => {
    return appointments.filter(a => a.date === dateStr);
  };

  const getMedicationsForDate = (dateStr: string) => {
    // Both specific date-bound medications and recurring reminders that should apply
    return medications.filter(m => !m.date || m.date === dateStr);
  };

  const getMarksForDate = (dateStr: string) => {
    return customMarks.filter(m => m.date === dateStr);
  };

  const handleDayClick = (dayNum: number) => {
    const dateStr = formatDateStr(dayNum);
    setSelectedDateStr(dateStr);
    setModalTab("view");
    setShowDayDetailModal(true);
    
    // Auto populate doctor if list is available
    if (doctorsList.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctorsList[0].id);
    }
  };

  // Form Submission Handlers
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc = doctorsList.find(d => d.id === selectedDoctorId);
    if (!doc) {
      triggerToast("Please select a medical specialist.");
      return;
    }

    try {
      await onAddAppointment(
        selectedDateStr,
        selectedTimeSlot,
        doc.id,
        doc.name,
        chiefComplaint || "Routine consultation",
        painScale
      );
      
      setChiefComplaint("");
      setModalTab("view");
      triggerToast(`Appointment successfully scheduled with Dr. ${doc.name}!`);
    } catch (err: any) {
      triggerToast(`Scheduling failed: ${err.message}`);
    }
  };

  const handleDoseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName || !medDosage) {
      triggerToast("Medication details cannot be blank.");
      return;
    }

    const newMed: Omit<MedicationReminder, 'id'> = {
      name: medName,
      dosage: medDosage,
      frequency: medFrequency,
      time: medTime,
      taken: false,
      status: "pending",
      date: selectedDateStr // Specifically pin to this date for direct scheduler tracking
    };

    onAddMedication(newMed);
    setMedName("");
    setMedDosage("");
    setModalTab("view");
    triggerToast(`Medication dosage schedule added for ${selectedDateStr}.`);
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle) {
      triggerToast("Please describe the log note / mark.");
      return;
    }

    const newMark: CustomMark = {
      id: `mark-${Date.now()}`,
      date: selectedDateStr,
      title: noteTitle,
      type: noteType,
      description: noteDesc
    };

    setCustomMarks(prev => [newMark, ...prev]);
    setNoteTitle("");
    setNoteDesc("");
    setModalTab("view");
    triggerToast("Personal medical tracker note added!");
  };

  const handleRemoveMark = (id: string) => {
    setCustomMarks(prev => prev.filter(m => m.id !== id));
    triggerToast("Calendar entry removed successfully.");
  };

  return (
    <div className="space-y-6">
      {/* Calendar Grid Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm text-left">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-gray-950 flex items-center gap-2">
            <CalendarCheck className="w-5.5 h-5.5 text-[#2E8B57]" /> Inbuilt Portal Calendar
          </h3>
          <p className="text-xs text-gray-500 font-medium">
            Schedule custom clinical appointments, pin medication dosages, and record local symptom diaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="w-10 h-10 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl flex items-center justify-center transition-all border border-gray-100"
            id="prev-month-btn"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-sm font-black text-gray-900 bg-gray-50 px-5 py-2.5 rounded-2xl border border-gray-100 tracking-wide min-w-[140px] text-center">
            {monthNames[month]} {year}
          </span>

          <button
            onClick={handleNextMonth}
            className="w-10 h-10 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl flex items-center justify-center transition-all border border-gray-100"
            id="next-month-btn"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 overflow-hidden">
        {/* Day Header */}
        <div className="grid grid-cols-7 gap-2 text-center border-b pb-3 mb-3">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
            <div 
              key={idx} 
              className={`text-xs uppercase font-black tracking-wider ${
                idx === 0 || idx === 6 ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-3" id="portal-inbuilt-calendar-grid">
          {/* Empty prefix cells */}
          {Array.from({ length: firstDayIndex }).map((_, idx) => (
            <div key={`empty-${idx}`} className="min-h-[105px] bg-gray-50/40 rounded-2xl border border-gray-50 opacity-40"></div>
          ))}

          {/* Actual days */}
          {Array.from({ length: totalDays }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = formatDateStr(dayNum);
            
            const dayAppts = getAppointmentsForDate(dateStr);
            const dayMeds = getMedicationsForDate(dateStr);
            const dayMarks = getMarksForDate(dateStr);
            
            const isToday = year === 2026 && month === 6 && dayNum === 2; // Fixed project current timeline is July 2026
            const isSelected = selectedDateStr === dateStr;

            const hasItems = dayAppts.length > 0 || dayMeds.length > 0 || dayMarks.length > 0;

            return (
              <div
                key={dayNum}
                onClick={() => handleDayClick(dayNum)}
                className={`min-h-[105px] border p-2.5 rounded-2xl text-left flex flex-col justify-between transition-all cursor-pointer select-none group relative ${
                  isToday 
                    ? "bg-emerald-50/40 border-emerald-500 shadow-sm ring-1 ring-emerald-500/10" 
                    : isSelected
                    ? "bg-gray-50 border-gray-900"
                    : "bg-white border-gray-100 hover:bg-gray-50/60 hover:border-gray-200"
                }`}
              >
                {/* Day label */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black ${
                    isToday ? "text-[#2E8B57]" : "text-gray-900"
                  }`}>
                    {dayNum}
                  </span>
                  
                  {isToday && (
                    <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-full scale-90">
                      Today
                    </span>
                  )}
                </div>

                {/* Day content stack */}
                <div className="space-y-1 mt-1.5 max-h-[70px] overflow-hidden">
                  {/* Appointments indicators */}
                  {dayAppts.slice(0, 2).map((appt) => (
                    <div 
                      key={appt.id}
                      className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 rounded-lg border border-indigo-100 truncate flex items-center gap-1"
                      title={`Appointment with ${appt.doctor.name}`}
                    >
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0"></span>
                      <span className="truncate">{appt.time} Dr. {appt.doctor.name.split(" ").pop()}</span>
                    </div>
                  ))}

                  {/* Medications indicators */}
                  {dayMeds.slice(0, 2).map((med) => (
                    <div
                      key={med.id}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg border truncate flex items-center gap-1 ${
                        med.taken 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}
                      title={`${med.name} (${med.dosage}) - ${med.taken ? 'Taken' : 'Pending'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${med.taken ? "bg-emerald-500" : "bg-amber-400 animate-pulse"}`}></span>
                      <span className="truncate">💊 {med.name}</span>
                    </div>
                  ))}

                  {/* Custom logs indicators */}
                  {dayMarks.slice(0, 1).map((mark) => (
                    <div
                      key={mark.id}
                      className="bg-rose-50 text-rose-700 text-[9px] font-bold px-1.5 py-0.5 rounded-lg border border-rose-100 truncate flex items-center gap-1"
                    >
                      <span className="truncate">📋 {mark.title}</span>
                    </div>
                  ))}

                  {/* Overflow indicator */}
                  {(dayAppts.length + dayMeds.length + dayMarks.length) > 3 && (
                    <div className="text-[8px] text-gray-400 font-bold text-center">
                      +{(dayAppts.length + dayMeds.length + dayMarks.length) - 3} more items
                    </div>
                  )}
                </div>

                {/* Hover Quick-add icon */}
                <div className="absolute right-2 bottom-2 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity scale-90">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details / Action Drawer Modal */}
      <AnimatePresence>
        {showDayDetailModal && (
          <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-left"
              id="calendar-day-detail-modal"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="space-y-0.5">
                  <h4 className="text-base font-black text-gray-950">
                    Day Schedule Coordinator
                  </h4>
                  <p className="text-xs text-[#2E8B57] font-extrabold flex items-center gap-1.5">
                    <CalendarCheck className="w-4 h-4" /> {selectedDateStr}
                  </p>
                </div>
                <button
                  onClick={() => setShowDayDetailModal(false)}
                  className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all focus:outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Tabs Inside Modal */}
              <div className="flex border-b bg-gray-50/30">
                <button
                  onClick={() => setModalTab("view")}
                  className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${
                    modalTab === "view" ? "border-[#2E8B57] text-[#2E8B57] bg-white" : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Overview ({getAppointmentsForDate(selectedDateStr).length + getMedicationsForDate(selectedDateStr).length + getMarksForDate(selectedDateStr).length})
                </button>
                <button
                  onClick={() => setModalTab("appt")}
                  className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${
                    modalTab === "appt" ? "border-indigo-600 text-indigo-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  + Add Appt
                </button>
                <button
                  onClick={() => setModalTab("dose")}
                  className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${
                    modalTab === "dose" ? "border-amber-600 text-amber-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  + Add Dose
                </button>
                <button
                  onClick={() => setModalTab("note")}
                  className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${
                    modalTab === "note" ? "border-rose-600 text-[#2E8B57] bg-white" : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  + Write Log
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className="p-6 overflow-y-auto flex-1 max-h-[50vh] space-y-6">
                
                {/* TAB: VIEW OVERVIEW */}
                {modalTab === "view" && (
                  <div className="space-y-5">
                    {/* Appointments list */}
                    <div className="space-y-2.5">
                      <h5 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-indigo-500" /> Booked Appointments
                      </h5>
                      {getAppointmentsForDate(selectedDateStr).length === 0 ? (
                        <p className="text-xs text-gray-400 italic bg-gray-50/50 p-4 rounded-2xl border border-gray-100 text-center">
                          No clinic appointments scheduled for this date.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {getAppointmentsForDate(selectedDateStr).map((appt) => (
                            <div key={appt.id} className="flex items-start justify-between p-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/30">
                              <div className="flex gap-3">
                                <img src={appt.doctor.image} className="w-9 h-9 rounded-xl object-cover border border-indigo-100" />
                                <div className="text-left space-y-0.5">
                                  <h6 className="text-xs font-black text-gray-900">{appt.doctor.name}</h6>
                                  <p className="text-[10px] text-gray-500 font-bold">{appt.doctor.specialty} • {appt.time}</p>
                                  <p className="text-[11px] text-gray-600 leading-relaxed font-medium">"{appt.complaint}"</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  onCancelAppointment(appt.id);
                                  triggerToast("Appointment canceled.");
                                }}
                                className="text-[10px] font-black text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-xl transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Medications scheduled */}
                    <div className="space-y-2.5">
                      <h5 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-amber-500" /> Medication Dosages & Logs
                      </h5>
                      {getMedicationsForDate(selectedDateStr).length === 0 ? (
                        <p className="text-xs text-gray-400 italic bg-gray-50/50 p-4 rounded-2xl border border-gray-100 text-center">
                          No medication routines associated with this date.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {getMedicationsForDate(selectedDateStr).map((med) => (
                            <div key={med.id} className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 bg-white">
                              <div className="flex items-center gap-3 text-left">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  med.taken ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                }`}>
                                  <Pill className="w-4 h-4" />
                                </div>
                                <div>
                                  <h6 className="text-xs font-black text-gray-900">{med.name}</h6>
                                  <p className="text-[10px] text-gray-400 font-bold">{med.dosage} • {med.frequency} • {med.time}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => onToggleMedication(med.id)}
                                className={`text-[10px] font-black px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 ${
                                  med.taken 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                    : "bg-gray-50 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 border-gray-200"
                                }`}
                              >
                                {med.taken ? (
                                  <>
                                    <Check className="w-3 h-3" /> Marked Taken
                                  </>
                                ) : (
                                  "Mark Dose Taken"
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Custom Logs and Diary entries */}
                    <div className="space-y-2.5">
                      <h5 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-rose-500" /> Patient Daily Symptom Diary
                      </h5>
                      {getMarksForDate(selectedDateStr).length === 0 ? (
                        <p className="text-xs text-gray-400 italic bg-gray-50/50 p-4 rounded-2xl border border-gray-100 text-center">
                          No custom symptoms, dosage notes, or check logs recorded today.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {getMarksForDate(selectedDateStr).map((mark) => (
                            <div key={mark.id} className="flex items-start justify-between p-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 text-left">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${
                                    mark.type === "dose" ? "bg-emerald-500" : mark.type === "symptom" ? "bg-rose-500" : "bg-blue-500"
                                  }`}></span>
                                  <h6 className="text-xs font-black text-gray-900">{mark.title}</h6>
                                </div>
                                {mark.description && (
                                  <p className="text-xs text-gray-500 font-medium leading-relaxed pl-4 mt-1">{mark.description}</p>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveMark(mark.id)}
                                className="text-gray-400 hover:text-rose-500 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB: ADD APPOINTMENT */}
                {modalTab === "appt" && (
                  <form onSubmit={handleScheduleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-500 uppercase">Select Consultant Doctor</label>
                      <select
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        className="w-full text-xs font-bold p-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        required
                      >
                        {doctorsList.map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.name} ({doc.specialty})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-gray-500 uppercase">Preferred Time Slot</label>
                        <select
                          value={selectedTimeSlot}
                          onChange={(e) => setSelectedTimeSlot(e.target.value)}
                          className="w-full text-xs font-bold p-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          {["09:00 AM", "10:00 AM", "11:00 AM", "01:30 PM", "02:30 PM", "03:30 PM"].map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-gray-500 uppercase">Symptom Severity Pain Scale</label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={painScale}
                          onChange={(e) => setPainScale(Number(e.target.value))}
                          className="w-full accent-[#2E8B57]"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-extrabold">
                          <span>Mild ({painScale}/10)</span>
                          <span>Severe</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-500 uppercase">Chief Health Complaint</label>
                      <textarea
                        value={chiefComplaint}
                        onChange={(e) => setChiefComplaint(e.target.value)}
                        placeholder="Describe your current medical discomfort, symptoms, or consultation objectives..."
                        className="w-full text-xs font-semibold p-4 bg-gray-50 rounded-2xl border border-gray-200 h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        required
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-extrabold rounded-2xl shadow-lg transition-all"
                    >
                      Book Secured Consultation
                    </button>
                  </form>
                )}

                {/* TAB: ADD DOSE SCHEDULE */}
                {modalTab === "dose" && (
                  <form onSubmit={handleDoseSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-500 uppercase font-sans">Medication Name</label>
                      <input
                        type="text"
                        value={medName}
                        onChange={(e) => setMedName(e.target.value)}
                        placeholder="e.g. Lipitor, Metformin, Amoxicillin"
                        className="w-full text-xs font-semibold p-3.5 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-gray-500 uppercase">Dosage Volume</label>
                        <input
                          type="text"
                          value={medDosage}
                          onChange={(e) => setMedDosage(e.target.value)}
                          placeholder="e.g. 500mg, 1 tablet"
                          className="w-full text-xs font-semibold p-3.5 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-gray-500 uppercase">Target Routine Hour</label>
                        <select
                          value={medTime}
                          onChange={(e) => setMedTime(e.target.value)}
                          className="w-full text-xs font-bold p-3.5 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                          {["06:00 AM", "08:00 AM", "12:00 PM", "04:00 PM", "08:00 PM", "10:00 PM"].map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-500 uppercase">Frequency / Repetition</label>
                      <select
                        value={medFrequency}
                        onChange={(e) => setMedFrequency(e.target.value)}
                        className="w-full text-xs font-bold p-3.5 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none"
                      >
                        {["Once daily", "Twice daily", "Three times daily", "Every 8 hours", "As needed (PRN)"].map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-2xl shadow-lg transition-all"
                    >
                      Pin Medication Dose routine
                    </button>
                  </form>
                )}

                {/* TAB: WRITE LOG NOTE */}
                {modalTab === "note" && (
                  <form onSubmit={handleNoteSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-500 uppercase">Log Entry Title</label>
                      <input
                        type="text"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        placeholder="e.g. Blood sugar 110 mg/dL, minor nausea, felt dizziness"
                        className="w-full text-xs font-semibold p-3.5 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-500 uppercase">Log Categorization</label>
                      <div className="flex gap-2">
                        {(["note", "dose", "symptom"] as const).map((t) => (
                          <button
                            type="button"
                            key={t}
                            onClick={() => setNoteType(t)}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all uppercase ${
                              noteType === t 
                                ? "bg-emerald-600 text-white border-emerald-600" 
                                : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-500 uppercase">Additional Observations (Optional)</label>
                      <textarea
                        value={noteDesc}
                        onChange={(e) => setNoteDesc(e.target.value)}
                        placeholder="Provide details on triggers, vitals measurements, or symptoms behavior..."
                        className="w-full text-xs font-semibold p-4 bg-gray-50 rounded-2xl border border-gray-200 h-24 focus:outline-none"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 bg-[#2E8B57] hover:bg-[#2E8B57]/95 text-white text-xs font-extrabold rounded-2xl shadow-lg transition-all"
                    >
                      Save Symptom / Log Mark
                    </button>
                  </form>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
