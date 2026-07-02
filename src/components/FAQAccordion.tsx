/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FAQS } from "../types";
import { Plus, Minus, HelpCircle } from "lucide-react";

export default function FAQAccordion() {
  const [openId, setOpenId] = useState<string | null>("faq-1");

  const toggleFaq = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-3.5 max-w-3xl mx-auto" id="faq-accordion-container">
      {FAQS.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div
            key={faq.id}
            className="bg-[#FCFFFD] border border-[#E5E7EB] rounded-[20px] overflow-hidden transition-all duration-200"
            id={`faq-item-${faq.id}`}
          >
            <button
              onClick={() => toggleFaq(faq.id)}
              className="w-full text-left p-5 flex items-center justify-between gap-4 font-sans focus:outline-none focus:ring-1 focus:ring-[#2E8B57]/30"
              id={`faq-trigger-${faq.id}`}
            >
              <div className="flex gap-3 items-center">
                <HelpCircle className={`w-4 h-4 transition-colors ${isOpen ? "text-[#2E8B57]" : "text-gray-400"}`} />
                <span className="text-sm font-bold text-gray-950 leading-snug">{faq.question}</span>
              </div>
              <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isOpen ? "bg-[#2E8B57] text-white rotate-90" : "bg-gray-100 text-gray-500"
              }`}>
                {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  <div className="px-5 pb-5 pt-1 text-xs text-[#6B7280] leading-relaxed border-t border-[#E5E7EB]/50">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
