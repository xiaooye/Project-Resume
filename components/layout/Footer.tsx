"use client";

import Link from "next/link";

const quickLinks = [
  { name: "Home", href: "/" },
  { name: "Case Studies", href: "/case-studies" },
  { name: "Demos", href: "/demos" },
  { name: "Contact", href: "/contact" },
];

const socialLinks = [
  { name: "Upwork", href: "https://www.upwork.com/freelancers/weidev" },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/wei-xin-029527158/" },
  { name: "GitHub", href: "https://github.com/xiaooye" },
  { name: "Email", href: "mailto:contact@wei-dev.com" },
];

export default function Footer() {
  return (
    <footer
      className="py-6 mt-6"
      role="contentinfo"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="container" style={{ maxWidth: "780px" }}>
        <div className="columns is-vcentered">
          <div className="column">
            <p className="font-display has-text-weight-bold is-size-5">Wei</p>
            <p className="text-muted">Senior Full Stack Developer</p>
          </div>

          <div className="column has-text-centered">
            <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem" }}>
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-secondary is-size-7">
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="column has-text-right">
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel={link.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                  className="text-secondary is-size-7"
                  aria-label={link.name}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
