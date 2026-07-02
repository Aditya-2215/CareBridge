/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Shield, Activity, ChevronRight } from "lucide-react";

interface NavbarProps {
  onNavClick: (sectionId: string) => void;
  onBookClick: () => void;
  onLoginClick: () => void;
  onSignUpClick: () => void;
  isLoggedIn?: boolean;
  onPortalClick?: () => void;
  onLogoutClick?: () => void;
}

export default function Navbar({ 
  onNavClick, 
  onBookClick, 
  onLoginClick, 
  onSignUpClick,
  isLoggedIn = false,
  onPortalClick,
  onLogoutClick
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Home", target: "hero" },
    { label: "Find Doctors", target: "scheduler-section" },
    { label: "Features", target: "features-section" },
    { label: "How It Works", target: "how-it-works-section" },
    { label: "About", target: "why-carebridge-section" },
    { label: "Contact", target: "faq-section" }
  ];

  const handleItemClick = (target: string) => {
    setMobileMenuOpen(false);
    onNavClick(target);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-white/80 backdrop-blur-md border-b border-[#E5E7EB] shadow-lg shadow-gray-100/10 py-4" 
            : "bg-white/40 backdrop-blur-sm border-b border-transparent py-5"
        }`}
        id="carebridge-header"
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          
          {/* Left: Brand Logo */}
          <button 
            onClick={() => handleItemClick("hero")}
            className="flex items-center gap-2 text-left focus:outline-none focus:ring-2 focus:ring-[#2E8B57]/30 rounded-xl px-1.5 py-1"
            id="logo-button"
          >
            <div className="w-8 h-8 bg-[#2E8B57] rounded-lg flex items-center justify-center shadow-sm shadow-emerald-900/10">
              <div className="w-4 h-4 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#111827] tracking-tight leading-none">
                CareBridge
              </h1>
              <span className="text-[9px] text-[#6B7280] font-semibold tracking-widest uppercase block mt-0.5">
                Keeps you connected
              </span>
            </div>
          </button>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6B7280]" id="desktop-nav">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleItemClick(item.target)}
                className="hover:text-[#111827] transition-colors focus:outline-none"
                id={`nav-link-${item.target}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-6" id="desktop-actions">
            {isLoggedIn ? (
              <>
                <button
                  onClick={onPortalClick}
                  className="bg-emerald-50 text-[#2E8B57] hover:bg-emerald-100/80 px-4.5 py-2.5 rounded-[20px] text-xs font-bold border border-emerald-200/50 flex items-center gap-2 transition-all shadow-sm"
                  id="navbar-portal-btn"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Go to Portal
                </button>
                <button 
                  onClick={onLogoutClick}
                  className="text-xs font-semibold text-[#111827] hover:text-red-600 transition-colors" 
                  id="navbar-logout-btn"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={onLoginClick}
                  className="text-sm font-semibold text-[#111827] hover:text-[#2E8B57] transition-colors" 
                  id="login-button"
                >
                  Login
                </button>
                <button
                  onClick={onSignUpClick}
                  className="bg-[#2E8B57] text-white px-6 py-2.5 rounded-[24px] text-sm font-semibold shadow-lg shadow-emerald-900/10 active:scale-95 hover:bg-[#2E8B57]/90 transition-all"
                  id="signup-button"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Icon */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={onBookClick}
              className="bg-[#2E8B57] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm"
              id="mobile-nav-cta"
            >
              Book Now
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-gray-600 hover:text-gray-900 focus:outline-none"
              id="mobile-menu-trigger"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-[70px] z-40 bg-white/95 backdrop-blur-lg flex flex-col p-6 space-y-6 md:hidden border-t border-gray-100"
            id="mobile-drawer"
          >
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleItemClick(item.target)}
                  className="text-sm font-bold text-gray-800 hover:text-[#2E8B57] text-left py-2.5 border-b border-gray-100 flex items-center justify-between"
                  id={`mobile-nav-link-${item.target}`}
                >
                  {item.label}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>

            <div className="pt-4 flex flex-col gap-3">
              {isLoggedIn ? (
                <>
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onPortalClick?.();
                    }}
                    className="w-full py-3 bg-[#2E8B57] text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Go to Patient Portal
                  </button>
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogoutClick?.();
                    }}
                    className="w-full py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition-all"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLoginClick();
                    }}
                    className="w-full py-3 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-bold transition-all"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onSignUpClick();
                    }}
                    className="w-full py-3 bg-[#2E8B57] text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Get Started / Sign Up
                  </button>
                </>
              )}
            </div>

            <div className="mt-auto p-4 bg-[#E9F8F1]/40 rounded-2xl border border-emerald-100 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#2E8B57]" />
              <p className="text-[10px] text-gray-500 leading-normal">
                CareBridge guarantees WCAG AA accessibility, encrypted data processing, and full HIPAA compliance.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
