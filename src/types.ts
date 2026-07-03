/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviewsCount: number;
  image: string;
  availability: string[];
  bio: string;
  hospital: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  iconName: string;
  details: string;
}

// Static mock data for Doctors - cleared for production/real-life registration only
export const DOCTORS: Doctor[] = [];

// Static mock data for FAQs (at least 8 as requested)
export const FAQS: FAQItem[] = [
  {
    id: "faq-1",
    question: "What is CareBridge and how does it keep me connected?",
    answer: "CareBridge is a premium healthcare platform designed to bridge the gap between you, your doctor, and your overall wellness plan. We sync your symptoms, schedule appointments seamlessly, provide easy-to-understand AI summaries, and send automated medication and care reminders."
  },
  {
    id: "faq-2",
    question: "How does the AI Symptom Analysis work?",
    answer: "Before your appointment, you can enter your symptoms into our secure analyzer. It safely structures your answers, highlights critical concerns, and drafts patient-friendly questions to ask your doctor. It does not replace medical advice but optimizes your discussion with your clinician."
  },
  {
    id: "faq-3",
    question: "Is my medical data safe and confidential?",
    answer: "Absolutely. Security is our absolute priority. CareBridge utilizes end-to-end encrypted storage that meets WCAG AA and HIPAA-compliant standards. Your records, symptom reports, and messages are only shared with the specific doctors you authorize."
  },
  {
    id: "faq-4",
    question: "Can I sync CareBridge with my personal calendar?",
    answer: "Yes, CareBridge supports two-way calendar sync with most modern device calendars, Outlook, and Apple Calendar. Once you book an appointment, it automatically updates your personal schedule and sends custom pre-appointment forms directly to your email."
  },
  {
    id: "faq-5",
    question: "What are 'Patient-Friendly Summaries'?",
    answer: "Often, doctor notes are filled with dense medical jargon. CareBridge uses medical-grade AI to translate these notes, prescriptions, and follow-up guidelines into plain, clear, actionable steps, showing exactly what you need to do, when, and why."
  },
  {
    id: "faq-6",
    question: "How do medication reminders work?",
    answer: "Reminders are automatically generated from your care summaries. You can receive them via push notifications, SMS, or email, with interactive options to mark them as 'Taken', 'Snoozed', or 'Rescheduled' directly from your lock screen."
  },
  {
    id: "faq-7",
    question: "Can I manage care for my family members?",
    answer: "Yes, CareBridge offers a 'Family Circle' dashboard. It allows you to coordinate pediatrician appointments, check on senior parents' medication reminders, and share reports securely with authorized specialists under a unified account."
  },
  {
    id: "faq-8",
    question: "Are there any setup fees or long-term contracts?",
    answer: "CareBridge is free for patients to schedule and receive summaries. For clinics and independent doctors, we offer flexible month-to-month subscription plans with no setup fees, allowing you to cancel or adjust your license tier at any time."
  }
];

// Static mock data for Testimonials
export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t-1",
    name: "Clara West",
    role: "Chronic Illness Patient",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
    rating: 5,
    text: "CareBridge completely changed how I manage my autoimmune condition. The AI symptom summaries help my doctor understand my flare-ups in seconds, and I never miss my weekly prescription schedules anymore.",
    date: "June 2026"
  },
  {
    id: "t-2",
    name: "Dr. Arthur Pendelton",
    role: "Chief Pediatric Officer",
    avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=150&h=150",
    rating: 5,
    text: "As a clinician, CareBridge has drastically reduced my chart note-taking time. Patients arrive with structured AI symptoms in hand, and our clinic has seen an 85% drop in missed appointments and medication non-compliance.",
    date: "May 2026"
  },
  {
    id: "t-3",
    name: "Liam Chen",
    role: "Busy Professional & Caregiver",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
    rating: 5,
    text: "Managing my senior father's healthcare appointments was a second job. With CareBridge's unified Family Portal and calendar sync, I can track his doctors' summaries, prescriptions, and follow-ups with total peace of mind.",
    date: "April 2026"
  }
];
