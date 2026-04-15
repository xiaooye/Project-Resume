"use client";

import { useState } from "react";

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

function validate(data: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!data.name.trim()) errors.name = "Name is required";
  if (!data.email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Enter a valid email";
  if (!data.subject.trim()) errors.subject = "Subject is required";
  if (!data.message.trim()) errors.message = "Message is required";
  else if (data.message.length < 10) errors.message = "At least 10 characters";
  return errors;
}

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [sent, setSent] = useState(false);

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const subject = encodeURIComponent(form.subject);
    const body = encodeURIComponent(`From: ${form.name} (${form.email})\n\n${form.message}`);
    window.location.href = `mailto:contact@wei-dev.com?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "780px" }}>
        <h1 className="font-display mb-2" style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", lineHeight: 1.2 }}>
          Let&apos;s work together.
        </h1>
        <p className="text-secondary mb-6" style={{ lineHeight: 1.7, maxWidth: "520px" }}>
          Have a project in mind? Tell me about it and I&apos;ll get back to you
          within one business day.
        </p>

        <div className="columns">
          {/* Form */}
          <div className="column is-7">
            {sent ? (
              <div className="liquid-glass-card" style={{ padding: "2.5rem", textAlign: "center" }}>
                <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>&#10003;</p>
                <p className="title is-5 mb-3">Email client opened</p>
                <p className="text-secondary" style={{ lineHeight: 1.7 }}>
                  If it didn&apos;t open, email me directly at{" "}
                  <a href="mailto:contact@wei-dev.com" className="has-text-accent has-text-weight-semibold">
                    contact@wei-dev.com
                  </a>
                </p>
                <button className="button is-light mt-4" style={{ border: "1px solid var(--border)" }} onClick={() => setSent(false)}>
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Name */}
                  <div>
                    <label className="label" htmlFor="c-name" style={{ fontSize: "0.875rem" }}>
                      Name
                    </label>
                    <input
                      id="c-name"
                      className={`input ${errors.name ? "is-danger" : ""}`}
                      type="text"
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "err-name" : undefined}
                    />
                    {errors.name && <p id="err-name" className="help is-danger" role="alert">{errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="label" htmlFor="c-email" style={{ fontSize: "0.875rem" }}>
                      Email
                    </label>
                    <input
                      id="c-email"
                      className={`input ${errors.email ? "is-danger" : ""}`}
                      type="email"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "err-email" : undefined}
                    />
                    {errors.email && <p id="err-email" className="help is-danger" role="alert">{errors.email}</p>}
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="label" htmlFor="c-subject" style={{ fontSize: "0.875rem" }}>
                      Subject
                    </label>
                    <input
                      id="c-subject"
                      className={`input ${errors.subject ? "is-danger" : ""}`}
                      type="text"
                      placeholder="Project inquiry, migration help, AI integration..."
                      value={form.subject}
                      onChange={(e) => update("subject", e.target.value)}
                      aria-invalid={!!errors.subject}
                      aria-describedby={errors.subject ? "err-subject" : undefined}
                    />
                    {errors.subject && <p id="err-subject" className="help is-danger" role="alert">{errors.subject}</p>}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="label" htmlFor="c-message" style={{ fontSize: "0.875rem" }}>
                      Message
                    </label>
                    <textarea
                      id="c-message"
                      className={`textarea ${errors.message ? "is-danger" : ""}`}
                      placeholder="Tell me about your project — what problem are you solving, what's the timeline, and what does success look like?"
                      rows={6}
                      value={form.message}
                      onChange={(e) => update("message", e.target.value)}
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? "err-message" : undefined}
                    />
                    {errors.message && <p id="err-message" className="help is-danger" role="alert">{errors.message}</p>}
                  </div>

                  <button type="submit" className="button is-primary is-medium" style={{ alignSelf: "flex-start" }}>
                    Send Message
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <div className="column is-5">
            <div style={{ paddingLeft: "1.5rem", borderLeft: "2px solid var(--border)" }}>
              <div className="mb-5">
                <p className="has-text-weight-bold mb-1">Email</p>
                <a href="mailto:contact@wei-dev.com" className="has-text-accent">contact@wei-dev.com</a>
              </div>

              <div className="mb-5">
                <p className="has-text-weight-bold mb-1">Availability</p>
                <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                  20+ hours/week, evenings &amp; weekends.
                  I respond within 2 hours during business hours (Eastern Time).
                </p>
              </div>

              <div className="mb-5">
                <p className="has-text-weight-bold mb-1">Profiles</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <a href="https://www.upwork.com/freelancers/weidev" target="_blank" rel="noopener noreferrer" className="has-text-accent">
                    Upwork
                  </a>
                  <a href="https://www.linkedin.com/in/wei-xin-029527158/" target="_blank" rel="noopener noreferrer" className="has-text-accent">
                    LinkedIn
                  </a>
                  <a href="https://github.com/xiaooye" target="_blank" rel="noopener noreferrer" className="has-text-accent">
                    GitHub
                  </a>
                </div>
              </div>

              <div>
                <p className="has-text-weight-bold mb-1">What to include</p>
                <ul className="text-secondary" style={{ lineHeight: 1.7, paddingLeft: "1.25rem" }}>
                  <li>Brief project description</li>
                  <li>Timeline and budget range</li>
                  <li>Current tech stack (if any)</li>
                  <li>What success looks like</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
