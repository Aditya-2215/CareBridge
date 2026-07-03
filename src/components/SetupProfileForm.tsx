/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Phone, Mail, Calendar, HelpCircle, 
  ArrowRight, ShieldCheck, Sparkles, CheckCircle2, 
  AlertCircle, Lock
} from "lucide-react";

interface SetupProfileFormProps {
  user: {
    _id: string;
    email: string;
    name: string;
    role: "patient" | "doctor" | "admin";
    phone?: string;
    gender?: string;
    age?: number;
  };
  onComplete: (updatedUser: any) => void;
}

export default function SetupProfileForm({ user, onComplete }: SetupProfileFormProps) {
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [gender, setGender] = useState(user.gender || "");
  const [age, setAge] = useState<string>(user.age ? String(user.age) : "");
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!gender) {
      setErrorMsg("Please select your gender.");
      return;
    }
    if (!age || isNaN(Number(age)) || Number(age) <= 0 || Number(age) > 130) {
      setErrorMsg("Please enter a valid age.");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("Please enter your mobile number.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apifetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          name: name.trim(),
          gender,
          age: Number(age),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          is_profile_setup: true
        }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (!response.ok) {
        setErrorMsg(data.error || "Failed to update profile. Please try again.");
        return;
      }

      setSuccessMsg(`Perfect! Welcome to CareBridge, ${name.trim()}! Your profile is securely synced.`);
      
      // Delay completion slightly so user sees the nice personalized success message
      setTimeout(() => {
        onComplete(data.user);
      }, 3000);

    } catch (err) {
      setIsLoading(false);
      setErrorMsg("Network error. Please check your connection and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* Decorative Aurora background glows */}
      <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#E9F8F1] via-[#D1FAE5] to-[#A7F3D0] opacity-70 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-[#E0F2FE] via-[#BAE6FD] to-[#7DD3FC] opacity-70 blur-[120px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="bg-emerald-100 p-3 rounded-2xl border border-emerald-200 shadow-sm">
            <Sparkles className="h-8 w-8 text-emerald-700 animate-pulse" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black font-display text-gray-900 tracking-tight">
          Let's setup your profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          First-time clinical authorization setup for {user.role === "doctor" ? "Doctors" : "Patients"}.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-white py-8 px-4 shadow-xl border border-gray-100 sm:rounded-[24px] sm:px-10">
          
          <AnimatePresence mode="wait">
            {successMsg ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-8 px-4"
              >
                <div className="flex justify-center mb-4">
                  <div className="bg-emerald-50 p-4 rounded-full border border-emerald-100 text-emerald-600">
                    <CheckCircle2 className="w-12 h-12 animate-bounce" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Setup Completed!</h3>
                <p className="text-emerald-700 font-medium mb-4 text-sm bg-emerald-50 py-3 px-4 rounded-xl border border-emerald-100/50">
                  {successMsg}
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Loading your HIPAA-secured health portal...</span>
                </div>
              </motion.div>
            ) : (
              <motion.form 
                initial={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onSubmit={handleSubmit} 
                className="space-y-6"
              >
                
                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-rose-800">{errorMsg}</span>
                  </div>
                )}

                {/* Registered Email (Disabled) */}
                <div>
                  <label htmlFor="setup-email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Registered Email Address
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="setup-email"
                      type="email"
                      disabled
                      value={email}
                      className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 font-medium cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-gray-400">
                    This email is registered and secured for clinical notifications.
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label htmlFor="setup-name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="setup-name"
                      type="text"
                      required
                      placeholder="e.g. Dr. John Carter or Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Gender */}
                  <div>
                    <label htmlFor="setup-gender" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Gender
                    </label>
                    <select
                      id="setup-gender"
                      required
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  {/* Age */}
                  <div>
                    <label htmlFor="setup-age" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Age
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="setup-age"
                        type="number"
                        required
                        min="1"
                        max="125"
                        placeholder="Age"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label htmlFor="setup-phone" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Mobile Number
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="setup-phone"
                      type="tel"
                      required
                      placeholder="e.g. +1 (555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-[#2E8B57] hover:bg-[#256e44] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving to clinic cluster...
                      </span>
                    ) : (
                      <>
                        <span>Submit & Setup Profile</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 mt-4 text-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Secure 256-bit AES database record storage.</span>
                </div>

              </motion.form>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
