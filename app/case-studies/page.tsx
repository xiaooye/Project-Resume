import Link from "next/link";

const caseStudies = [
  {
    slug: "legacy-migration",
    title: "Enterprise Legacy Migration",
    subtitle: "ASP inline scripts → Modern bundled architecture",
    role: "Lead Developer",
    duration: "12+ months",
    tags: ["Migration", "Architecture", "Tooling"],
  },
  {
    slug: "batch-processing",
    title: "Excel-to-Database Processing Pipeline",
    subtitle: "Manual Excel workflows → Automated batch processing system",
    role: "Full-Stack Developer",
    duration: "3 months",
    tags: ["Backend", "Data Processing", "Automation"],
  },
  {
    slug: "ai-integration",
    title: "Production AI Agent System",
    subtitle: "Zero AI capability → RAG pipelines, MCP servers, and LLM-driven workflows",
    role: "AI Architect",
    duration: "6+ months",
    tags: ["AI/ML", "RAG", "Claude API", "MCP"],
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "960px" }}>
        <h1 className="title is-2 font-display mb-2">Case Studies</h1>
        <p className="text-secondary mb-6" style={{ lineHeight: 1.7, maxWidth: "640px" }}>
          Detailed accounts of real production work — the problems, the approach, and the results.
        </p>

        {caseStudies.map((cs, i) => (
          <Link key={cs.slug} href={`/case-studies/${cs.slug}`} style={{ display: "block" }}>
            <div style={{ borderBottom: i < caseStudies.length - 1 ? "1px solid var(--border)" : "none", padding: "2rem 0" }}>
              <div className="columns is-vcentered">
                <div className="column is-1">
                  <span className="is-size-4 has-text-accent has-text-weight-bold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="column">
                  <h2 className="title is-4 mb-1">{cs.title}</h2>
                  <p className="text-secondary mb-2">{cs.subtitle}</p>
                  <div className="is-flex" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
                    <span className="text-muted">{cs.role} · {cs.duration}</span>
                    {cs.tags.map(t => <span key={t} className="tag is-light is-small">{t}</span>)}
                  </div>
                </div>
                <div className="column is-narrow">
                  <span className="has-text-accent hover-arrow">Read →</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
