/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  X, 
  Check, 
  Cookie, 
  Settings, 
  BarChart3, 
  SlidersHorizontal, 
  HelpCircle,
  FileText
} from "lucide-react";

interface CookieConsentPreferences {
  essential: boolean;
  analytics: boolean;
  preferences: boolean;
  marketing: boolean;
  timestamp: string;
}

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [prefs, setPrefs] = useState<Omit<CookieConsentPreferences, 'timestamp'>>({
    essential: true,
    analytics: false,
    preferences: false,
    marketing: false
  });

  // Load preferences on mount
  useEffect(() => {
    const savedConsent = localStorage.getItem("carebridge_cookie_consent_prefs");
    if (!savedConsent) {
      // Show consent banner after 1.5 seconds if no preference exists
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(savedConsent) as CookieConsentPreferences;
        setPrefs({
          essential: true,
          analytics: !!parsed.analytics,
          preferences: !!parsed.preferences,
          marketing: !!parsed.marketing
        });
      } catch (err) {
        console.error("Failed to parse cookie preferences", err);
      }
    }
  }, []);

  // Update real browser cookies based on state
  const saveConsentState = (newPrefs: Omit<CookieConsentPreferences, 'timestamp'>, consentType: "all" | "rejected" | "custom") => {
    const consentObject: CookieConsentPreferences = {
      ...newPrefs,
      essential: true, // Always true
      timestamp: new Date().toISOString()
    };

    // Save to localStorage
    localStorage.setItem("carebridge_cookie_consent_prefs", JSON.stringify(consentObject));
    localStorage.setItem("carebridge_cookie_consent", consentType);

    // Set cookies with a 1-year expiration (31,536,000 seconds)
    const maxAge = 31536000;
    const cookieBase = `; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;

    document.cookie = `carebridge_cookie_consent=${consentType}${cookieBase}`;
    document.cookie = `carebridge_consent_essential=true${cookieBase}`;
    document.cookie = `carebridge_consent_analytics=${newPrefs.analytics}${cookieBase}`;
    document.cookie = `carebridge_consent_preferences=${newPrefs.preferences}${cookieBase}`;
    document.cookie = `carebridge_consent_marketing=${newPrefs.marketing}${cookieBase}`;

    // Dispatch custom event so other components can react to cookie changes if necessary
    window.dispatchEvent(new CustomEvent("carebridge_cookies_updated", { detail: consentObject }));
  };

  const handleAcceptAll = () => {
    const allEnabled = {
      essential: true,
      analytics: true,
      preferences: true,
      marketing: true
    };
    setPrefs(allEnabled);
    saveConsentState(allEnabled, "all");
    setShowBanner(false);
    setShowPreferencesModal(false);
  };

  const handleRejectAll = () => {
    const allDisabled = {
      essential: true,
      analytics: false,
      preferences: false,
      marketing: false
    };
    setPrefs(allDisabled);
    saveConsentState(allDisabled, "rejected");
    setShowBanner(false);
    setShowPreferencesModal(false);
  };

  const handleSaveSelection = () => {
    saveConsentState(prefs, "custom");
    setShowBanner(false);
    setShowPreferencesModal(false);
  };

  const handleToggle = (key: keyof typeof prefs) => {
    if (key === "essential") return; // Cannot disable essential cookies
    setPrefs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <>
      {/* 1. Subtle Persistent Trigger Button (so users can manage their choices anytime) */}
      <AnimatePresence>
        {!showBanner && !showPreferencesModal && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setShowPreferencesModal(true)}
            className="fixed bottom-6 left-6 z-[9990] w-12 h-12 bg-white hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded-full shadow-lg border border-gray-100 flex items-center justify-center transition-all hover:scale-105 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            title="Privacy & Cookie Preferences"
            id="cookie-preference-trigger-btn"
          >
            <Cookie className="w-5 h-5" />
            
            {/* Tooltip on Hover */}
            <span className="absolute left-14 bg-gray-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md">
              Manage Cookies & GDPR
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* 2. Main Consent Banner */}
      <AnimatePresence>
        {showBanner && !showPreferencesModal && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed bottom-6 right-6 left-6 md:left-auto md:max-w-md bg-white border border-gray-100 shadow-2xl rounded-3xl p-6 z-[9995] flex flex-col gap-4 text-left font-sans text-gray-900"
            id="cookie-consent-banner"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100/50">
                <Cookie className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-gray-950 flex items-center gap-1.5">
                  Your Privacy & Consent
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                  CareBridge uses secure cookies to maintain HIPAA-compliant sessions, remember clinical preferences, and analyze anonymized patient portal metrics for a seamless care experience.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRejectAll}
                  className="flex-1 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 active:scale-95 text-gray-600 text-xs font-bold rounded-2xl transition-all border border-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  id="cookie-reject-btn"
                >
                  Reject Optional
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 py-2.5 px-4 bg-[#2E8B57] hover:bg-[#2E8B57]/95 active:scale-95 text-white text-xs font-bold rounded-2xl shadow-md shadow-emerald-600/10 transition-all flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  id="cookie-accept-btn"
                >
                  <Check className="w-4 h-4" /> Accept All
                </button>
              </div>
              
              <button
                onClick={() => setShowPreferencesModal(true)}
                className="w-full py-2.5 text-center text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/50 active:scale-99 text-xs font-extrabold rounded-2xl transition-all border border-transparent flex items-center justify-center gap-1.5 focus:outline-none"
                id="cookie-customize-btn"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> Customize Consent Settings
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Granular Cookie Preferences Modal (Fully Accessible & HIPAA/GDPR Compliant) */}
      <AnimatePresence>
        {showPreferencesModal && (
          <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white border border-gray-100 shadow-2xl rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col font-sans overflow-hidden"
              id="cookie-preferences-modal"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-950">Cookie Preferences</h3>
                    <p className="text-[11px] text-gray-400 font-medium">GDPR & HIPAA Compliant Portal</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreferencesModal(false)}
                  className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 max-h-[50vh]">
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                  We value your privacy. Under General Data Protection Regulation (GDPR) standards, we require your explicit consent before enabling non-essential tracking cookies. Necessary cookies are automatically saved to guarantee secure connections.
                </p>

                <div className="space-y-4">
                  {/* Category 1: Strictly Necessary (Always Active) */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <h5 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                          Strictly Necessary
                          <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-md">
                            Always Active
                          </span>
                        </h5>
                        <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                          Crucial for portal navigation, login verification, patient security tokens, and preserving other privacy states. No patient clinical data is leaked.
                        </p>
                      </div>
                    </div>
                    <div className="relative shrink-0 flex items-center">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled={true}
                        className="sr-only"
                      />
                      <div className="w-9 h-5 bg-emerald-500 rounded-full cursor-not-allowed opacity-50 relative">
                        <div className="absolute top-0.5 left-4.5 w-4 h-4 bg-white rounded-full transition-transform"></div>
                      </div>
                    </div>
                  </div>

                  {/* Category 2: Performance & Analytics */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:bg-gray-50/30 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <h5 className="text-xs font-black text-gray-900">
                          Performance & Analytics
                        </h5>
                        <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                          Helps us analyze web traffic, optimize loading speeds, identify browser anomalies, and measure performance metrics anonymously.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle("analytics")}
                      className="relative shrink-0 flex items-center focus:outline-none"
                    >
                      <div className={`w-9 h-5 rounded-full transition-colors duration-200 relative ${prefs.analytics ? "bg-emerald-600" : "bg-gray-200"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${prefs.analytics ? "left-4.5" : "left-0.5"}`}></div>
                      </div>
                    </button>
                  </div>

                  {/* Category 3: Functional Preferences */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:bg-gray-50/30 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <h5 className="text-xs font-black text-gray-900">
                          Functional & Preferences
                        </h5>
                        <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                          Used to remember portal states, doctor filters, dashboard layouts, and communication preferences so you don't have to reconfigure them.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle("preferences")}
                      className="relative shrink-0 flex items-center focus:outline-none"
                    >
                      <div className={`w-9 h-5 rounded-full transition-colors duration-200 relative ${prefs.preferences ? "bg-emerald-600" : "bg-gray-200"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${prefs.preferences ? "left-4.5" : "left-0.5"}`}></div>
                      </div>
                    </button>
                  </div>

                  {/* Category 4: Marketing & Personalization */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:bg-gray-50/30 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <h5 className="text-xs font-black text-gray-900">
                          Marketing & Targeted Support
                        </h5>
                        <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                          Delivers tailored wellness bulletins, support communications, and clinical surveys customized based on user navigation behaviors.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle("marketing")}
                      className="relative shrink-0 flex items-center focus:outline-none"
                    >
                      <div className={`w-9 h-5 rounded-full transition-colors duration-200 relative ${prefs.marketing ? "bg-emerald-600" : "bg-gray-200"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${prefs.marketing ? "left-4.5" : "left-0.5"}`}></div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-1.5 text-emerald-600 font-extrabold text-[11px] hover:underline cursor-pointer">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Review CareBridge HIPAA & GDPR Data Policy</span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={handleRejectAll}
                  className="sm:mr-auto py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-600 text-xs font-extrabold rounded-2xl border border-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-gray-300 active:scale-98"
                >
                  Reject All Optional
                </button>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleSaveSelection}
                    className="flex-1 sm:flex-initial py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white text-xs font-extrabold rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-gray-800 active:scale-98"
                  >
                    Save Selection
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="flex-1 sm:flex-initial py-2.5 px-5 bg-[#2E8B57] hover:bg-[#2E8B57]/95 text-white text-xs font-extrabold rounded-2xl shadow-md shadow-emerald-700/10 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-600 active:scale-98"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
