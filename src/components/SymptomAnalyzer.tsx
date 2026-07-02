/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, Brain, AlertCircle, HelpCircle, Activity, ChevronRight, Check } from "lucide-react";

interface SymptomPreset {
  title: string;
  symptoms: string;
}

const PRESETS: SymptomPreset[] = [
  {
    title: "Left-sided Migraine",
    symptoms: "Severe throbbing headache localized behind left eye, sharp light sensitivity, and mild nausea for 2 days."
  },
  {
    title: "Seasonal Cough & Fatigue",
    symptoms: "Dry cough, mild fatigue, nasal congestion, and body aches. No difficulty breathing, temperature 99.8°F."
  },
  {
    title: "Knee Joint Pain",
    symptoms: "Dull ache in right knee after jogging, minor swelling, stiffness in the mornings. Sharp pain when climbing stairs."
  }
];

interface SymptomAnalyzerProps {
  onSummarySelect?: (summaryText: string) => void;
}

export default function SymptomAnalyzer({ onSummarySelect }: SymptomAnalyzerProps) {
  const [symptomInput, setSymptomInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const handlePresetClick = (symptoms: string) => {
    setSymptomInput(symptoms);
  };

  const runAnalysis = () => {
    if (!symptomInput.trim()) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);

    // Simulate clinical AI thinking
    setTimeout(() => {
      let result = {
        urgency: "Moderate",
        urgencyColor: "text-amber-600 bg-amber-50 border-amber-200",
        specialty: "Neurology / Primary Care",
        chiefComplaint: "Acute, throbbing left-sided hemicrania with photophobia and mild secondary emesis symptoms.",
        suggestedQuestions: [
          "Could my headaches be tension-based, or are they vascular migraine symptoms?",
          "Are there abortive versus preventative medications recommended for these specific episodes?",
          "What lifestyle modifications or diagnostic scans do you suggest to pinpoint triggers?"
        ],
        lifestyleAdvice: "Rest in a darkened, quiet room, apply a cool compress to the forehead, and maintain proper hydration."
      };

      if (symptomInput.toLowerCase().includes("cough") || symptomInput.toLowerCase().includes("fever") || symptomInput.toLowerCase().includes("fatigue")) {
        result = {
          urgency: "Low",
          urgencyColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
          specialty: "Family Medicine / General Practitioner",
          chiefComplaint: "Mild upper respiratory tract syndrome with associated asthenia and moderate hyperpyrexia.",
          suggestedQuestions: [
            "Do these symptoms align more with seasonal allergies or an acute viral upper respiratory infection?",
            "What over-the-counter anti-inflammatories or symptom relievers are safest for me?",
            "At what temperature threshold or progression should I seek emergency clinical evaluations?"
          ],
          lifestyleAdvice: "Increase oral fluids, rest extensively, run a cool-mist humidifier, and monitor body temperature twice daily."
        };
      } else if (symptomInput.toLowerCase().includes("knee") || symptomInput.toLowerCase().includes("pain") || symptomInput.toLowerCase().includes("jogging")) {
        result = {
          urgency: "Mild",
          urgencyColor: "text-blue-600 bg-blue-50 border-blue-200",
          specialty: "Orthopedics / Physical Therapy",
          chiefComplaint: "Post-exertional patellofemoral articulation discomfort with minor localized edema and morning stiffness.",
          suggestedQuestions: [
            "Does this knee discomfort suggest meniscus irritation or early-stage patellar tendonitis?",
            "Should I completely halt running, or are there low-impact training programs I can safely adopt?",
            "Are knee braces or specific dynamic physical therapy exercises beneficial for joint alignment?"
          ],
          lifestyleAdvice: "Practice RICE protocol (Rest, Ice for 15 mins, Compression sleeve, Elevation) and avoid deep weighted squats."
        };
      }

      setAnalysisResult(result);
      setIsAnalyzing(false);
    }, 1800);
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[24px] shadow-sm overflow-hidden" id="symptom-analyzer-card">
      {/* Header bar */}
      <div className="bg-[#E9F8F1]/60 p-5 border-b border-[#E5E7EB] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#2E8B57] text-white rounded-xl">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 font-sans tracking-tight">AI Clinical Pre-Screening</h4>
            <p className="text-xs text-[#6B7280]">Structure your clinic visit in seconds</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2E8B57]/10 text-[#2E8B57]">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Live AI Engine
        </span>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Select a Preset to Demo or Enter Your Own:
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetClick(p.symptoms)}
                className={`text-xs px-3 py-2 rounded-xl transition-all font-medium border ${
                  symptomInput === p.symptoms
                    ? "bg-[#2E8B57] text-white border-[#2E8B57] shadow-sm shadow-[#2E8B57]/20"
                    : "bg-[#FCFFFD] hover:bg-[#E9F8F1]/40 border-[#E5E7EB] text-gray-700"
                }`}
                id={`preset-btn-${idx}`}
              >
                {p.title}
              </button>
            ))}
          </div>

          <div className="relative">
            <textarea
              className="w-full h-28 p-4 text-sm text-gray-900 border border-[#E5E7EB] rounded-2xl bg-[#FCFFFD] focus:outline-none focus:ring-2 focus:ring-[#2E8B57]/50 focus:border-[#2E8B57] transition-all resize-none placeholder-gray-400"
              placeholder="Describe what you are feeling... (e.g. Sharp pain in lower back radiating when standing, dull tension headaches...)"
              value={symptomInput}
              onChange={(e) => setSymptomInput(e.target.value)}
              id="symptom-textarea"
            />
            {symptomInput && (
              <button
                onClick={() => setSymptomInput("")}
                className="absolute right-3 bottom-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                id="clear-symptom-btn"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <button
          onClick={runAnalysis}
          disabled={isAnalyzing || !symptomInput.trim()}
          className={`w-full py-3.5 rounded-xl text-sm font-semibold tracking-tight transition-all flex items-center justify-center gap-2 ${
            isAnalyzing || !symptomInput.trim()
              ? "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-[#2E8B57] hover:bg-[#2E8B57]/90 text-white shadow-md shadow-[#2E8B57]/15 hover:-translate-y-0.5 active:translate-y-0"
          }`}
          id="run-analysis-btn"
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin h-4 w-4 text-gray-400 inline-block mr-1" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Structuring Clinical Data...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Run AI-Powered Analysis <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>

        <AnimatePresence mode="wait">
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="pt-4 border-t border-[#E5E7EB] space-y-4"
              id="analysis-results-box"
            >
              {/* Severity badge & specialty */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${analysisResult.urgencyColor}`}>
                    <AlertCircle className="w-3.5 h-3.5" /> Urgency: {analysisResult.urgency}
                  </span>
                  <span className="text-xs text-gray-500">Recommended Specialty:</span>
                </div>
                <span className="text-xs font-bold text-gray-800">{analysisResult.specialty}</span>
              </div>

              {/* Medical Terminology Translation */}
              <div className="p-4 rounded-2xl bg-[#FCFFFD] border border-[#E5E7EB] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                  <Activity className="w-4 h-4 text-[#2E8B57]" /> AI Clinical Translation (For Doctor)
                </div>
                <p className="text-xs text-gray-800 font-mono leading-relaxed bg-white p-2.5 rounded-lg border border-[#E5E7EB]">
                  {analysisResult.chiefComplaint}
                </p>
              </div>

              {/* Suggested Questions to Ask */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                  <HelpCircle className="w-4 h-4 text-[#2E8B57]" /> Prepared Questions (For Patient)
                </div>
                <ul className="space-y-2">
                  {analysisResult.suggestedQuestions.map((q: string, i: number) => (
                    <li key={i} className="flex gap-2.5 items-start text-xs text-gray-600 leading-relaxed">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#E9F8F1] text-[#2E8B57] flex items-center justify-center font-bold text-[10px]">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Self-care advice */}
              <div className="p-3 bg-[#E9F8F1]/40 border border-[#2E8B57]/10 rounded-xl">
                <p className="text-xs text-[#2E8B57] leading-relaxed">
                  <strong>💡 CareBridge Safe Advice:</strong> {analysisResult.lifestyleAdvice}
                </p>
              </div>

              {/* Actions */}
              {onSummarySelect && (
                <button
                  onClick={() => onSummarySelect(`Preset: ${analysisResult.specialty}. Clinical Summary: ${analysisResult.chiefComplaint}`)}
                  className="w-full py-2.5 bg-[#E9F8F1] hover:bg-[#E9F8F1]/80 text-[#2E8B57] hover:text-[#2E8B57]/90 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-[#2E8B57]/20 transition-all"
                  id="attach-analysis-booking-btn"
                >
                  <Check className="w-4 h-4" /> Attach Clinical Summary to Booking Form <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
