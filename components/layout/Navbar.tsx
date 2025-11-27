"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { name: "Home", href: "/", ariaLabel: "Navigate to home page" },
  { name: "Projects", href: "/projects", ariaLabel: "Navigate to projects page" },
  { name: "Skills", href: "/skills", ariaLabel: "Navigate to skills page" },
  { name: "Demos", href: "#demos", ariaLabel: "Navigate to demos section" },
  { name: "Contact", href: "/contact", ariaLabel: "Navigate to contact page" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const firstMenuItemRef = useRef<HTMLAnchorElement>(null);
  const burgerButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard navigation for mobile menu
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
        burgerButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // Focus first menu item when menu opens
    setTimeout(() => {
      firstMenuItemRef.current?.focus();
    }, 100);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  // Trap focus in mobile menu
  useEffect(() => {
    if (!isMobileMenuOpen || !menuRef.current) return;

    const menuItems = menuRef.current.querySelectorAll<HTMLElement>(
      'a[href], button, [tabindex]:not([tabindex="-1"])'
    );
    const firstItem = menuItems[0];
    const lastItem = menuItems[menuItems.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstItem) {
          e.preventDefault();
          lastItem?.focus();
        }
      } else {
        if (document.activeElement === lastItem) {
          e.preventDefault();
          firstItem?.focus();
        }
      }
    };

    menuRef.current.addEventListener("keydown", handleTabKey);
    return () => {
      menuRef.current?.removeEventListener("keydown", handleTabKey);
    };
  }, [isMobileMenuOpen]);

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement> | React.KeyboardEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      // If we're not on the home page, navigate first
      if (pathname !== "/") {
        window.location.href = `/${href}`;
        return;
      }
      // Wait a bit for any navigation to complete
      setTimeout(() => {
        const element = document.querySelector(href);
        if (element) {
          const offset = 80; // Account for fixed navbar
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
          // Focus the target element for accessibility
          (element as HTMLElement).focus();
        }
      }, 100);
    }
  };

  const handleBurgerClick = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleBurgerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleBurgerClick();
    }
  };

  const handleMenuItemKeyDown = (
    e: React.KeyboardEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSmoothScroll(e, href);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`navbar is-fixed-top liquid-glass-nav ${
        isScrolled ? "" : ""
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container">
        <div className="navbar-brand">
          <Link 
            href="/" 
            className="navbar-item"
            aria-label="Portfolio home page"
          >
            <span className="title is-4 has-text-primary">Portfolio</span>
          </Link>

          <button
            ref={burgerButtonRef}
            className={`navbar-burger ${isMobileMenuOpen ? "is-active" : ""}`}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="navbar-menu"
            onClick={handleBurgerClick}
            onKeyDown={handleBurgerKeyDown}
            type="button"
          >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </button>
        </div>

        <div
          ref={menuRef}
          id="navbar-menu"
          className={`navbar-menu ${isMobileMenuOpen ? "is-active" : ""}`}
          aria-hidden={!isMobileMenuOpen}
        >
          <div className="navbar-end">
            {navItems.map((item, index) => (
              <Link
                key={item.href}
                ref={index === 0 ? firstMenuItemRef : null}
                href={item.href}
                onClick={(e) => {
                  handleSmoothScroll(e, item.href);
                  setIsMobileMenuOpen(false);
                }}
                onKeyDown={(e) => handleMenuItemKeyDown(e, item.href)}
                className={`navbar-item ${
                  pathname === item.href ? "has-text-primary" : ""
                }`}
                aria-label={item.ariaLabel}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.name}
              </Link>
            ))}
            <div className="navbar-item">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

