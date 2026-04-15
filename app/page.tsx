import Link from "next/link";
import ScrollReveal from "@/components/ui/ScrollReveal";

const services = [
  {
    title: "Web App Code Upgrade & Migration",
    description:
      "jQuery to modern frameworks, legacy tables to AG Grid, CSS to Tailwind, Webpack to Vite. Incremental migration on live products.",
  },
  {
    title: "AI Integration & LLM Features",
    description:
      "RAG pipelines, Claude/OpenAI APIs, MCP server configuration, and LLM-driven workflows in production.",
  },
  {
    title: "Full-Stack Web Development",
    description:
      "Vue 3, Nuxt 3, Vite, Tailwind CSS. SQL, REST APIs, Node.js. Clean, maintainable code.",
  },
  {
    title: "Legacy Modernization",
    description:
      "jQuery, ASP, PHP, or aging Angular — pragmatic migration paths that deliver value at every step.",
  },
  {
    title: "Architecture & Technical Leadership",
    description:
      "Tech stack evaluation, codebase reviews, architecture recommendations, and technical specs.",
  },
];

const caseStudies = [
  {
    title: "Enterprise Legacy Migration",
    result: "Zero downtime",
    description:
      "ASP inline scripts → modern bundled architecture for an enterprise SaaS product serving paying clients.",
    href: "/case-studies/legacy-migration",
  },
  {
    title: "Excel-to-Database Pipeline",
    result: "15 min vs 6 hours",
    description:
      "Replaced manual Excel imports with an automated batch processing system — 99.8% data accuracy.",
    href: "/case-studies/batch-processing",
  },
  {
    title: "Production AI Agent System",
    result: "85% auto-resolution",
    description:
      "Built RAG pipelines, MCP servers, and Claude-powered workflows from zero AI capability.",
    href: "/case-studies/ai-integration",
  },
];

const steps = [
  { number: "01", title: "Discovery", description: "We discuss your project, codebase, and goals." },
  { number: "02", title: "Plan", description: "Detailed technical plan with milestones before any code." },
  { number: "03", title: "Execute", description: "Incremental delivery with regular progress updates." },
  { number: "04", title: "Deliver", description: "Clean, documented code with knowledge transfer." },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="section" style={{ paddingTop: "6rem", paddingBottom: "4rem" }}>
        <div className="container" style={{ maxWidth: "780px" }}>
          <div className="status-badge mb-4 page-enter">
            <span className="status-dot" />
            Available for hire — 20+ hrs/week
          </div>
          <h1
            className="font-display mb-4 page-enter page-enter-delay-1"
            style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", lineHeight: 1.15 }}
          >
            I help companies modernize legacy web apps and ship AI-powered features.
          </h1>
          <p className="text-secondary mb-5 page-enter page-enter-delay-2" style={{ fontSize: "1.15rem", lineHeight: 1.7, maxWidth: "600px" }}>
            Senior full-stack developer with 7+ years of experience.
            Architecture decisions tested in production, not just in tutorials.
          </p>
          <div className="page-enter page-enter-delay-3" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <a href="mailto:contact@wei-dev.com" className="button is-primary is-medium">
              Get In Touch
            </a>
            <Link
              href="/case-studies"
              className="button is-light is-medium"
              style={{ border: "1px solid var(--border)" }}
            >
              Read Case Studies
            </Link>
          </div>
        </div>
      </section>

      {/* Proof Bar — hard numbers, not claims */}
      <section className="py-5" style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="container" style={{ maxWidth: "780px" }}>
          <div className="columns is-mobile has-text-centered">
            {[
              { value: "7+", label: "Years in production" },
              { value: "0", label: "Downtime on migrations" },
              { value: "85%", label: "AI auto-resolution rate" },
              { value: "4", label: "Live interactive demos" },
            ].map((stat) => (
              <div key={stat.label} className="column">
                <p className="stat-value">{stat.value}</p>
                <p className="stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="section py-6">
        <ScrollReveal>
        <div className="container" style={{ maxWidth: "780px" }}>
          <h2 className="title is-4 font-display mb-5">What I Do</h2>
          {services.map((s, i) => (
            <div
              key={s.title}
              className="service-row"
              style={{
                borderBottom: i < services.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div style={{ display: "flex", gap: "1rem", alignItems: "baseline" }}>
                <span className="has-text-accent has-text-weight-bold" style={{ minWidth: "28px" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="has-text-weight-bold mb-1">{s.title}</p>
                  <p className="text-secondary" style={{ lineHeight: 1.6 }}>{s.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        </ScrollReveal>
      </section>

      {/* Case Studies */}
      <section className="section py-6" style={{ background: "var(--bg-subtle)" }}>
        <div className="container" style={{ maxWidth: "780px" }}>
          <h2 className="title is-4 font-display mb-5">Recent Work</h2>
          {caseStudies.map((cs, i) => (
            <Link
              key={cs.href}
              href={cs.href}
              className="case-study-row"
              style={{
                borderBottom: i < caseStudies.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <h3 className="title is-5 mb-1">{cs.title}</h3>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
                  <span className="has-text-accent has-text-weight-bold">{cs.result}</span>
                  <span className="hover-arrow has-text-accent">→</span>
                </div>
              </div>
              <p className="text-secondary" style={{ lineHeight: 1.6 }}>{cs.description}</p>
            </Link>
          ))}
          <Link
            href="/case-studies"
            className="has-text-accent has-text-weight-semibold accent-underline mt-4"
            style={{ display: "inline-block" }}
          >
            Read all case studies with code →
          </Link>
        </div>
      </section>

      {/* Process */}
      <section className="section py-6">
        <ScrollReveal>
        <div className="container" style={{ maxWidth: "780px" }}>
          <h2 className="title is-4 font-display mb-5">How I Work</h2>
          <div className="process-grid">
            {steps.map((step) => (
              <div key={step.number}>
                <div className="process-step-num">{step.number}</div>
                <p className="has-text-weight-bold mb-1">{step.title}</p>
                <p className="text-secondary" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* Trust — Verify, Don't Believe */}
      <section className="section py-6" style={{ background: "var(--bg-subtle)" }}>
        <ScrollReveal>
        <div className="container" style={{ maxWidth: "780px" }}>
          <h2 className="title is-4 font-display mb-2">Don&apos;t Take My Word For It</h2>
          <p className="text-secondary mb-5" style={{ lineHeight: 1.7 }}>
            Everything on this site is verifiable. No stock photos, no vague claims, no fake testimonials.
          </p>

          <div className="columns is-multiline">
            {/* Verify: Live Demos */}
            <div className="column is-half">
              <div className="liquid-glass-card" style={{ padding: "1.25rem", height: "100%" }}>
                <p className="has-text-weight-bold mb-2">Try the live demos</p>
                <p className="text-secondary mb-3" style={{ lineHeight: 1.6, fontSize: "0.9rem" }}>
                  The{" "}
                  <Link href="/demos/graphql-explorer" className="has-text-accent">
                    GraphQL Explorer
                  </Link>{" "}
                  hits a real Apollo Server running on this site. The{" "}
                  <Link href="/demos/code-migration" className="has-text-accent">
                    AI Migration tool
                  </Link>{" "}
                  streams real Gemini API responses. Bring your own key and test it.
                </p>
              </div>
            </div>

            {/* Verify: Code in Case Studies */}
            <div className="column is-half">
              <div className="liquid-glass-card" style={{ padding: "1.25rem", height: "100%" }}>
                <p className="has-text-weight-bold mb-2">Read the code</p>
                <p className="text-secondary mb-3" style={{ lineHeight: 1.6, fontSize: "0.9rem" }}>
                  Every case study includes real code snippets — before/after migration diffs,
                  pipeline architecture, RAG implementation. Judge the code quality yourself.
                </p>
              </div>
            </div>

            {/* Verify: This Site */}
            <div className="column is-half">
              <div className="liquid-glass-card" style={{ padding: "1.25rem", height: "100%" }}>
                <p className="has-text-weight-bold mb-2">Inspect this site</p>
                <p className="text-secondary mb-3" style={{ lineHeight: 1.6, fontSize: "0.9rem" }}>
                  Built with Next.js 16, React 19, TypeScript strict mode. 12 production
                  dependencies. Sub-2s build. WCAG 2.2 AAA contrast. View source — this is how I write code.
                </p>
              </div>
            </div>

            {/* Verify: Profiles */}
            <div className="column is-half">
              <div className="liquid-glass-card" style={{ padding: "1.25rem", height: "100%" }}>
                <p className="has-text-weight-bold mb-2">Check my profiles</p>
                <p className="text-secondary mb-3" style={{ lineHeight: 1.6, fontSize: "0.9rem" }}>
                  <a href="https://www.upwork.com/freelancers/weidev" target="_blank" rel="noopener noreferrer" className="has-text-accent">Upwork</a>
                  {" · "}
                  <a href="https://www.linkedin.com/in/wei-xin-029527158/" target="_blank" rel="noopener noreferrer" className="has-text-accent">LinkedIn</a>
                  {" · "}
                  <a href="https://github.com/xiaooye" target="_blank" rel="noopener noreferrer" className="has-text-accent">GitHub</a>
                  {" — Real identity, real history, real work."}
                </p>
              </div>
            </div>
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* What I Don't Do — Honesty builds trust */}
      <section className="section py-6">
        <div className="container" style={{ maxWidth: "780px" }}>
          <h2 className="title is-4 font-display mb-5">What I Don&apos;t Do</h2>
          <p className="text-secondary mb-4" style={{ lineHeight: 1.7 }}>
            Being upfront about scope saves us both time:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              "Mobile app development (iOS/Android native)",
              "UI/UX design from scratch — I implement designs, not create them",
              "DevOps-only roles — I do infrastructure as part of full-stack work, not standalone",
              "Projects without clear requirements — I need to know what success looks like before I start",
            ].map((item) => (
              <div key={item} style={{ display: "flex", gap: "0.75rem", alignItems: "baseline" }}>
                <span className="text-muted">—</span>
                <p className="text-secondary" style={{ lineHeight: 1.6 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section py-6" style={{ background: "var(--bg-subtle)" }}>
        <div className="container" style={{ maxWidth: "780px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1.5rem",
            }}
          >
            <div>
              <h2 className="title is-4 font-display mb-2">Ready to start?</h2>
              <p className="text-secondary">
                contact@wei-dev.com — I respond within 2 hours during business hours (ET).
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <a href="mailto:contact@wei-dev.com" className="button is-primary">
                Get In Touch
              </a>
              <a
                href="https://www.upwork.com/freelancers/weidev"
                target="_blank"
                rel="noopener noreferrer"
                className="button is-light"
                style={{ border: "1px solid var(--border)" }}
              >
                Upwork Profile
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
