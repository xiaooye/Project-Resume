"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Projects", href: "/projects" },
  { name: "Skills", href: "/skills" },
  { name: "Demos", href: "#demos" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`navbar is-fixed-top ${
        isScrolled
          ? "has-background-white has-shadow"
          : "is-transparent"
      }`}
      role="navigation"
      aria-label="main navigation"
      style={{
        backdropFilter: isScrolled ? "blur(10px)" : "none",
        backgroundColor: isScrolled
          ? "rgba(255, 255, 255, 0.9)"
          : "transparent",
      }}
    >
      <div className="container">
        <div className="navbar-brand">
          <Link href="/" className="navbar-item">
            <span className="title is-4 has-text-primary">Portfolio</span>
          </Link>

          <button
            className={`navbar-burger ${isMobileMenuOpen ? "is-active" : ""}`}
            aria-label="menu"
            aria-expanded="false"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </button>
        </div>

        <div className={`navbar-menu ${isMobileMenuOpen ? "is-active" : ""}`}>
          <div className="navbar-end">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  handleSmoothScroll(e, item.href);
                  setIsMobileMenuOpen(false);
                }}
                className={`navbar-item ${
                  pathname === item.href ? "has-text-primary" : ""
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

