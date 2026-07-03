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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
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
        className="fixed top-0 left-0 right-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200/60 py-4 px-6 md:px-8 shadow-sm transition-all duration-300"
        id="carebridge-header"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Left: Brand Logo with ultra premium pulse and shine */}
          <button 
            onClick={() => handleItemClick("hero")}
            className="flex items-center gap-2.5 text-left focus:outline-none rounded-2xl py-1 group cursor-pointer"
            id="logo-button"
          >
            <div className="w-9 h-9 bg-gradient-to-tr from-[#2E8B57] to-[#3CB371] rounded-xl flex items-center justify-center shadow-md shadow-emerald-950/15 relative overflow-hidden">
              <Activity className="w-5 h-5 text-white animate-pulse" />
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-[#111827] tracking-tight leading-none group-hover:text-[#2E8B57] transition-colors">
                CareBridge
              </h1>
              <span className="text-[9px] text-emerald-700/80 font-bold tracking-widest uppercase block mt-0.5">
                Keeps you connected
              </span>
            </div>
          </button>

          {/* Center: Desktop Navigation Links with framer motion sliding pill */}
          <nav className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-[#6B7280]" id="desktop-nav">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleItemClick(item.target)}
                onMouseEnter={() => setHoveredItem(item.target)}
                onMouseLeave={() => setHoveredItem(null)}
                className="relative px-3.5 py-1.5 text-gray-600 hover:text-[#2E8B57] transition-colors duration-300 focus:outline-none cursor-pointer"
                id={`nav-link-${item.target}`}
              >
                <span className="relative z-10">{item.label}</span>
                <AnimatePresence>
                  {hoveredItem === item.target && (
                    <motion.span
                      layoutId="navHover"
                      className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-[#E9F8F1] rounded-full -z-0"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </AnimatePresence>
              </button>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-5" id="desktop-actions">
            {isLoggedIn ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onPortalClick}
                  className="bg-gradient-to-r from-emerald-50 to-[#E9F8F1] text-[#2E8B57] hover:from-[#E9F8F1] hover:to-emerald-100/80 px-4.5 py-2.5 rounded-2xl text-xs font-bold border border-emerald-200/50 flex items-center gap-2.5 transition-all shadow-sm cursor-pointer"
                  id="navbar-portal-btn"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Go to Portal
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  onClick={onLogoutClick}
                  className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors cursor-pointer" 
                  id="navbar-logout-btn"
                >
                  Log Out
                </motion.button>
              </>
            ) : (
              <>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  onClick={onLoginClick}
                  className="text-sm font-bold text-gray-700 hover:text-[#2E8B57] transition-colors cursor-pointer px-3 py-1.5" 
                  id="login-button"
                >
                  Login
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04, y: -1, boxShadow: "0 8px 20px -6px rgba(46, 139, 87, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onSignUpClick}
                  className="bg-gradient-to-r from-[#2E8B57] to-[#1E5E3A] text-white px-5.5 py-2.5 rounded-full text-sm font-bold shadow-md shadow-emerald-900/10 cursor-pointer"
                  id="signup-button"
                >
                  Sign Up
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile Menu Icon */}
          <div className="md:hidden flex items-center gap-2.5">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onBookClick}
              className="bg-gradient-to-r from-[#2E8B57] to-[#1E5E3A] text-white text-[11px] font-extrabold px-3.5 py-2 rounded-xl shadow-sm cursor-pointer"
              id="mobile-nav-cta"
            >
              Book Now
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-gray-600 hover:text-[#2E8B57] focus:outline-none rounded-xl bg-gray-50 border border-gray-100 cursor-pointer"
              id="mobile-menu-trigger"
            >
              <motion.div
                animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.div>
            </motion.button>
          </div>

        </div>
      </header>

      {/* Floating Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed z-40 bg-white/95 backdrop-blur-xl flex flex-col p-6 space-y-6 md:hidden border border-emerald-500/10 rounded-3xl shadow-xl shadow-emerald-950/10 top-[76px] left-[4%] right-[4%] w-[92%]"
            id="mobile-drawer"
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item, idx) => (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={item.label}
                  onClick={() => handleItemClick(item.target)}
                  className="text-sm font-bold text-gray-800 hover:text-[#2E8B57] text-left py-3 border-b border-gray-50 flex items-center justify-between group cursor-pointer"
                  id={`mobile-nav-link-${item.target}`}
                >
                  <span className="group-hover:translate-x-1 transition-transform">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#2E8B57] transition-colors" />
                </motion.button>
              ))}
            </div>

            <div className="pt-2 flex flex-col gap-3">
              {isLoggedIn ? (
                <>
                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onPortalClick?.();
                    }}
                    className="w-full py-3 bg-gradient-to-r from-[#2E8B57] to-[#1E5E3A] text-white rounded-2xl text-xs font-bold shadow-md cursor-pointer text-center"
                  >
                    Go to Patient Portal
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogoutClick?.();
                    }}
                    className="w-full py-3 bg-red-50 text-red-600 hover:bg-red-100/80 rounded-2xl text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Log Out
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLoginClick();
                    }}
                    className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl text-xs font-bold border border-gray-100 cursor-pointer text-center"
                  >
                    Login
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onSignUpClick();
                    }}
                    className="w-full py-3 bg-gradient-to-r from-[#2E8B57] to-[#1E5E3A] text-white rounded-2xl text-xs font-bold shadow-md cursor-pointer text-center"
                  >
                    Get Started / Sign Up
                  </motion.button>
                </>
              )}
            </div>

            <div className="p-4.5 bg-[#E9F8F1]/50 rounded-2xl border border-emerald-100/50 flex items-start gap-2.5">
              <Shield className="w-4.5 h-4.5 text-[#2E8B57] shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-500 leading-normal">
                CareBridge guarantees WCAG AA accessibility, end-to-end encryption, and full HIPAA compliance.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

