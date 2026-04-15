import Link from "next/link";
import { projects } from "@/data/projects";

export const metadata = {
  title: "Projects — Wei",
  description:
    "Production-grade projects showcasing full-stack architecture, e-commerce, and modern web development.",
};

export default function ProjectsPage() {
  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "960px" }}>
        <h1 className="title is-2 font-display mb-2">Projects</h1>
        <p
          className="text-secondary mb-6"
          style={{ lineHeight: 1.7, maxWidth: "640px" }}
        >
          Production-grade applications I&apos;ve designed and built. Each one
          is live, open source, and demonstrates real architecture decisions —
          not tutorial code.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {projects.map((project) => (
            <article key={project.slug}>
              <div
                className="liquid-glass-card"
                style={{ padding: "2rem" }}
              >
                {/* Header row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div>
                    <h2 className="title is-4 font-display mb-1">
                      {project.title}
                    </h2>
                    <p className="text-muted" style={{ fontSize: "0.9rem" }}>
                      {project.tagline}
                    </p>
                  </div>
                  <span
                    className="status-badge"
                    style={{
                      padding: "0.25rem 0.75rem",
                      fontSize: "0.7rem",
                      flexShrink: 0,
                    }}
                  >
                    <span className="status-dot" style={{ width: 5, height: 5 }} />
                    {project.status === "live"
                      ? "Live"
                      : project.status === "in-progress"
                        ? "In Progress"
                        : "Planned"}
                  </span>
                </div>

                {/* Description */}
                <p
                  className="text-secondary mb-4"
                  style={{ lineHeight: 1.7 }}
                >
                  {project.description}
                </p>

                {/* Highlights */}
                <div className="mb-4">
                  <p
                    className="has-text-weight-semibold mb-2"
                    style={{ fontSize: "0.8rem", letterSpacing: "0.05em", textTransform: "uppercase" }}
                  >
                    Key Decisions
                  </p>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {project.highlights.map((h, i) => (
                      <li
                        key={i}
                        className="text-secondary"
                        style={{
                          fontSize: "0.85rem",
                          lineHeight: 1.6,
                          paddingLeft: "1rem",
                          position: "relative",
                          marginBottom: "0.35rem",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            left: 0,
                            color: "var(--accent)",
                            fontWeight: 600,
                          }}
                        >
                          ›
                        </span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tech stack tags */}
                <div
                  className="mb-4"
                  style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}
                >
                  {project.stack.map((tech) => (
                    <span
                      key={tech}
                      className="tag"
                      style={{
                        fontSize: "0.7rem",
                        padding: "0.2rem 0.6rem",
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Action links */}
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="has-text-accent has-text-weight-semibold accent-underline"
                    style={{ fontSize: "0.85rem" }}
                  >
                    View Live Site →
                  </a>
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary"
                      style={{ fontSize: "0.85rem" }}
                    >
                      Source Code
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Empty state hint for future */}
        {projects.length === 1 && (
          <p
            className="text-muted mt-5 has-text-centered"
            style={{ fontSize: "0.85rem" }}
          >
            More projects coming soon. Check back or{" "}
            <Link href="/contact" className="has-text-accent accent-underline">
              get in touch
            </Link>{" "}
            to discuss yours.
          </p>
        )}
      </div>
    </div>
  );
}
