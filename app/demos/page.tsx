import Link from "next/link";

const demos = [
  {
    title: "Code Migration Viewer",
    description:
      "Interactive before/after comparison of real-world code migrations: jQuery to Vue, CSS to Tailwind, Webpack to Vite, legacy tables to AG Grid.",
    href: "/demos/code-migration",
    proves: "Migration Expertise",
  },
  {
    title: "GraphQL API Explorer",
    description:
      "A real Apollo Server endpoint. Write queries, execute them, see live responses. Full CRUD with Users, Posts, Comments.",
    href: "/demos/graphql-explorer",
    proves: "Backend Architecture",
  },
  {
    title: "Data Pipeline",
    description:
      "Real CSV processor — paste data and watch it parsed, validated, transformed, and loaded. Catches missing fields, bad formats, duplicates. Not simulated.",
    href: "/demos/data-pipeline",
    proves: "Data Engineering",
  },
  {
    title: "Site Performance Monitor",
    description:
      "Real metrics from your browser via Navigation Timing API. Pings this site's GraphQL endpoint and charts latency, p95, and uptime — actual data, not random numbers.",
    href: "/demos/system-monitor",
    proves: "Observability",
  },
  {
    title: "Markdown Editor",
    description:
      "Live split-pane editor with a hand-rolled parser — zero dependencies. Headings, bold, italic, code blocks, lists, links, blockquotes, all from scratch.",
    href: "/demos/markdown-editor",
    proves: "Frontend Craft",
  },
];

export default function DemosPage() {
  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "960px" }}>
        <h1 className="title is-2 font-display mb-2">Live Demos</h1>
        <p className="text-secondary mb-6" style={{ lineHeight: 1.7, maxWidth: "640px" }}>
          Interactive demonstrations that run directly in your browser.
          Each demo maps to a service I offer.
        </p>

        <div className="columns is-multiline">
          {demos.map((demo) => (
            <div key={demo.href} className="column is-half">
              <Link href={demo.href} style={{ display: "block", height: "100%" }}>
                <div
                  className="liquid-glass-card"
                  style={{ padding: "1.5rem", height: "100%", display: "flex", flexDirection: "column" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <h2 className="title is-5 mb-0">{demo.title}</h2>
                    <span className="status-badge" style={{ padding: "0.2rem 0.6rem", fontSize: "0.7rem" }}>
                      <span className="status-dot" style={{ width: 5, height: 5 }} />
                      Live
                    </span>
                  </div>
                  <p className="text-secondary mb-3" style={{ lineHeight: 1.6, flex: 1 }}>
                    {demo.description}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="text-muted">Demonstrates: {demo.proves}</span>
                    <span className="hover-arrow has-text-accent has-text-weight-semibold" style={{ fontSize: "0.85rem" }}>Try it →</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
