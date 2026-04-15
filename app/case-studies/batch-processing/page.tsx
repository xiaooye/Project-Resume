"use client";

import Link from "next/link";

const results = [
  { value: "15 min", label: "Average processing time (was 4-6 hours)" },
  { value: "99.8%", label: "Data accuracy (was ~95%)" },
  { value: "Zero", label: "Manual data entry" },
  { value: "12hrs", label: "Saved per week" },
];

export default function BatchProcessingPage() {
  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "780px" }}>
        <Link
          href="/case-studies"
          className="text-secondary mb-4"
          style={{ display: "inline-block", fontSize: "0.9rem" }}
        >
          &larr; Back to Case Studies
        </Link>

        <h1 className="title is-2 font-display mb-2">
          Excel-to-Database Processing Pipeline
        </h1>
        <p className="text-muted mb-6">Case Study — Batch Data Processing</p>

        {/* Overview box */}
        <div className="liquid-glass-card mb-6" style={{ padding: "1.5rem" }}>
          <div className="columns is-mobile">
            <div className="column">
              <strong>Role:</strong> Full-Stack Developer
            </div>
            <div className="column">
              <strong>Duration:</strong> 3 months
            </div>
            <div className="column">
              <strong>Team:</strong> 2 developers
            </div>
            <div className="column">
              <strong>Status:</strong> In production
            </div>
          </div>
        </div>

        {/* The Challenge */}
        <h2 className="title is-4 font-display mb-3">The Challenge</h2>
        <p className="text-secondary mb-5" style={{ lineHeight: 1.8 }}>
          A company's operations team was manually importing Excel spreadsheets
          into their database — copy-pasting rows, reformatting data, fixing
          inconsistencies, and running validation by hand. This process took 4-6
          hours per import, happened 3-4 times per week, and was error-prone.
          Data inconsistencies from manual entry were causing downstream
          reporting issues.
        </p>

        {/* The Approach */}
        <h2 className="title is-4 font-display mb-3">The Approach</h2>
        <p className="text-secondary mb-3" style={{ lineHeight: 1.8 }}>
          I designed a fully automated batch processing pipeline to replace the
          manual workflow:
        </p>
        <ol
          style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}
          className="text-secondary mb-5"
        >
          <li className="mb-2">
            <strong>Analysis</strong> — Mapped all Excel formats, identified
            validation rules, documented edge cases
          </li>
          <li className="mb-2">
            <strong>Schema Design</strong> — Designed a normalized database
            schema that could handle all import variations with proper
            constraints
          </li>
          <li className="mb-2">
            <strong>Processing Pipeline</strong> — Built a Node.js batch
            processor: file upload, parsing (xlsx), validation,
            transformation, staged insert, confirmation
          </li>
          <li className="mb-2">
            <strong>Error Handling</strong> — Each row validates independently
            so one bad row doesn't block the entire batch. Errors are collected
            and reported with row numbers and specific failure reasons
          </li>
          <li className="mb-2">
            <strong>Admin Dashboard</strong> — Built a simple UI for the ops
            team: drag-and-drop upload, progress tracking, error review, and
            one-click confirmation
          </li>
        </ol>

        {/* Technical Decisions */}
        <h2 className="title is-4 font-display mb-3">Technical Decisions</h2>
        <ul
          style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}
          className="text-secondary mb-5"
        >
          <li className="mb-2">
            Streaming parser for large files (50K+ rows) to avoid memory issues
          </li>
          <li className="mb-2">
            Staged inserts with transaction rollback for data integrity
          </li>
          <li className="mb-2">
            Configurable validation rules so the ops team can adjust without
            code changes
          </li>
          <li className="mb-2">
            Background job queue for processing so the UI stays responsive
          </li>
        </ul>

        {/* Code: Pipeline Architecture */}
        <h2 className="title is-4 font-display mb-3">Code: Pipeline Architecture</h2>
        <p className="text-secondary mb-4" style={{ lineHeight: 1.8 }}>
          The core processing pipeline — each row validates independently so one bad row never blocks the batch:
        </p>

        <pre style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "8px", overflow: "auto", fontSize: "0.8rem", lineHeight: 1.6, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }} className="mb-5"><code>{`// Simplified batch processor pipeline
async function processBatch(file: Buffer, config: ImportConfig) {
  const rows = parseExcel(file, { streaming: true })
  const results: ProcessResult = { success: [], errors: [] }

  for await (const chunk of batch(rows, 500)) {
    const validated = chunk.map((row, i) => {
      const errors = config.rules
        .map(rule => rule.validate(row))
        .filter(Boolean)
      return errors.length
        ? { row, index: i, errors }
        : { row, index: i, data: config.transform(row) }
    })

    const good = validated.filter(r => 'data' in r)
    const bad = validated.filter(r => 'errors' in r)

    if (good.length > 0) {
      await db.transaction(async (tx) => {
        await tx.insert(records).values(
          good.map(r => r.data)
        )
      })
    }

    results.success.push(...good)
    results.errors.push(...bad)
  }

  return results // { success: 49,847 rows, errors: 153 rows with details }
}`}</code></pre>

        {/* Results */}
        <h2 className="title is-4 font-display mb-3">Results</h2>
        <div className="columns is-mobile is-multiline mb-5">
          {results.map((result, index) => (
            <div key={index} className="column is-6-mobile is-3-tablet">
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <div
                  className="title is-3"
                  style={{ color: "var(--accent)", marginBottom: "0.5rem" }}
                >
                  {result.value}
                </div>
                <p className="text-secondary" style={{ fontSize: "0.9rem" }}>
                  {result.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Key Takeaways */}
        <h2 className="title is-4 font-display mb-3">Key Takeaways</h2>
        <ul
          style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}
          className="text-secondary mb-5"
        >
          <li className="mb-2">
            The hardest part wasn't the code — it was understanding all the edge
            cases in the Excel files
          </li>
          <li className="mb-2">
            Streaming processing is essential once files exceed 10K rows
          </li>
          <li className="mb-2">
            Showing row-level errors with context is worth the extra effort — it
            builds trust with the ops team
          </li>
          <li className="mb-2">
            A simple drag-and-drop UI removes all friction from adoption
          </li>
        </ul>

        {/* CTA */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "2rem",
            marginTop: "2rem",
          }}
          className="has-text-centered"
        >
          <p className="text-secondary mb-4">
            Need to automate a manual data workflow?
          </p>
          <a
            href="mailto:contact@wei-dev.com"
            className="button is-primary is-medium"
          >
            Let's Talk
          </a>
        </div>
      </div>
    </div>
  );
}
