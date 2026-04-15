"use client";

import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Issue {
  row: number;
  col: string;
  severity: "error" | "warning" | "fixed";
  message: string;
}

// ---------------------------------------------------------------------------
// Sample data (intentionally messy)
// ---------------------------------------------------------------------------

const SAMPLE_CSV = `name,email,department,salary,hire_date
John Smith,john@acme.com,Engineering,95000,2021-03-15
Jane Doe,,Marketing,82000,2020-07-01
Bob Johnson,bob@invalid,Engineering,abc,2019-11-30
 Alice Williams ,alice@acme.com,,78000,2022-01-10
,charlie@acme.com,Sales,65000,not-a-date
Eve Davis,eve@acme.com,Engineering,91000,2023-05-20
John Smith,john@acme.com,Engineering,95000,2021-03-15`;

const stages = [
  { id: "ingest", label: "Ingest", detail: "Load raw data" },
  { id: "parse", label: "Parse", detail: "Extract rows & columns" },
  { id: "validate", label: "Validate", detail: "Check data quality" },
  { id: "transform", label: "Transform", detail: "Clean & normalize" },
  { id: "load", label: "Load", detail: "Output results" },
];

// ---------------------------------------------------------------------------
// Processing functions (real logic, not simulated)
// ---------------------------------------------------------------------------

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split("\n").filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => line.split(",").map((c) => c.trim()));
  return { headers, rows };
}

function validateData(
  headers: string[],
  rows: string[][]
): Issue[] {
  const issues: Issue[] = [];
  const emailIdx = headers.indexOf("email");
  const salaryIdx = headers.indexOf("salary");
  const dateIdx = headers.indexOf("hire_date");
  const nameIdx = headers.indexOf("name");
  const deptIdx = headers.indexOf("department");

  rows.forEach((row, ri) => {
    const r = ri + 2; // 1-indexed, skip header
    if (nameIdx >= 0 && !row[nameIdx]?.trim())
      issues.push({ row: r, col: "name", severity: "error", message: "Missing required field" });
    if (emailIdx >= 0) {
      const email = row[emailIdx]?.trim();
      if (!email) issues.push({ row: r, col: "email", severity: "warning", message: "Missing value" });
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        issues.push({ row: r, col: "email", severity: "error", message: `Invalid format: "${email}"` });
    }
    if (salaryIdx >= 0 && row[salaryIdx]?.trim() && isNaN(Number(row[salaryIdx])))
      issues.push({ row: r, col: "salary", severity: "error", message: `Non-numeric: "${row[salaryIdx]}"` });
    if (dateIdx >= 0 && row[dateIdx]?.trim() && isNaN(Date.parse(row[dateIdx])))
      issues.push({ row: r, col: "hire_date", severity: "error", message: `Invalid date: "${row[dateIdx]}"` });
    if (deptIdx >= 0 && !row[deptIdx]?.trim())
      issues.push({ row: r, col: "department", severity: "fixed", message: 'Missing \u2192 "Unassigned"' });
  });

  return issues;
}

function transformData(
  headers: string[],
  rows: string[][]
): { cleaned: string[][]; dupes: number } {
  const deptIdx = headers.indexOf("department");
  // Trim all cells
  let cleaned = rows.map((row) => row.map((c) => c.trim()));
  // Fill missing department
  if (deptIdx >= 0) {
    cleaned = cleaned.map((row) => {
      const r = [...row];
      if (!r[deptIdx]) r[deptIdx] = "Unassigned";
      return r;
    });
  }
  // Deduplicate
  const seen = new Set<string>();
  const deduped: string[][] = [];
  let dupes = 0;
  for (const row of cleaned) {
    const key = row.join("|");
    if (seen.has(key)) { dupes++; continue; }
    seen.add(key);
    deduped.push(row);
  }
  return { cleaned: deduped, dupes };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DataPipelineDemo() {
  const [csv, setCsv] = useState(SAMPLE_CSV);
  const [currentStage, setCurrentStage] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [resultRows, setResultRows] = useState<string[][]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [dupes, setDupes] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [tab, setTab] = useState<"data" | "issues">("data");

  const isComplete = currentStage >= stages.length;

  const run = useCallback(async () => {
    setIsProcessing(true);
    setIssues([]);
    setResultRows([]);
    setHeaders([]);
    setDupes(0);
    setTab("data");
    const t0 = performance.now();

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // Stage 0 - Ingest
    setCurrentStage(0);
    await delay(400);

    // Stage 1 - Parse
    setCurrentStage(1);
    const { headers: h, rows } = parseCSV(csv);
    setHeaders(h);
    await delay(400);

    // Stage 2 - Validate
    setCurrentStage(2);
    const found = validateData(h, rows);
    setIssues(found);
    await delay(500);

    // Stage 3 - Transform
    setCurrentStage(3);
    const { cleaned, dupes: d } = transformData(h, rows);
    setResultRows(cleaned);
    setDupes(d);
    await delay(400);

    // Stage 4 - Load
    setCurrentStage(4);
    await delay(300);

    setCurrentStage(stages.length); // complete
    setElapsed(performance.now() - t0);
    setIsProcessing(false);
  }, [csv]);

  const reset = useCallback(() => {
    setCurrentStage(-1);
    setHeaders([]);
    setResultRows([]);
    setIssues([]);
    setDupes(0);
    setElapsed(0);
  }, []);

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "1100px" }}>
        <h1 className="title is-2 font-display mb-2">Data Pipeline</h1>
        <p className="text-secondary mb-5" style={{ lineHeight: 1.7, maxWidth: "640px" }}>
          A real CSV processing pipeline — not a simulation. Paste data below
          (or use the sample), hit Run, and watch it parse, validate,
          transform, and load. Every issue found is real.
        </p>

        {/* Input */}
        <div className="columns mb-5">
          <div className="column">
            <label className="label" style={{ fontSize: "0.875rem" }}>
              Input CSV <span className="text-muted">(editable)</span>
            </label>
            <textarea
              className="textarea"
              value={csv}
              onChange={(e) => { setCsv(e.target.value); reset(); }}
              rows={10}
              spellCheck={false}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.8rem",
                lineHeight: 1.6,
                resize: "vertical",
              }}
            />
            <p className="text-muted mt-2" style={{ fontSize: "0.75rem" }}>
              Sample has 7 intentional problems: missing fields, invalid
              email, non-numeric salary, bad date, extra whitespace,
              duplicate row.
            </p>
          </div>
        </div>

        {/* Pipeline Stages */}
        <div className="liquid-glass-card mb-5" style={{ padding: "2rem 1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "1.125rem",
                left: "10%",
                right: "10%",
                height: 0,
                borderTop: "1px dashed var(--border-strong)",
                zIndex: 0,
              }}
            />
            {stages.map((stage, i) => {
              let status: "pending" | "active" | "complete" = "pending";
              if (i < currentStage) status = "complete";
              else if (i === currentStage) status = "active";
              return (
                <div key={stage.id} style={{ textAlign: "center", flex: 1, position: "relative", zIndex: 1 }}>
                  <div
                    style={{
                      width: "2.25rem",
                      height: "2.25rem",
                      borderRadius: "50%",
                      border: `2px solid ${status === "pending" ? "var(--border-strong)" : "var(--accent)"}`,
                      background: status === "complete" ? "var(--accent)" : "var(--bg)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: status === "complete" ? "#1a1a1a" : status === "active" ? "var(--accent)" : "var(--text-muted)",
                      transition: "all 0.3s ease",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {status === "complete" ? "\u2713" : String(i + 1).padStart(2, "0")}
                  </div>
                  <p className="has-text-weight-bold" style={{ fontSize: "0.85rem", color: status !== "pending" ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {stage.label}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{stage.detail}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="mb-5" style={{ display: "flex", gap: "0.75rem" }}>
          <button className="button is-primary is-medium" onClick={run} disabled={isProcessing || !csv.trim()}>
            {isProcessing ? "Processing..." : isComplete ? "Run Again" : "Run Pipeline"}
          </button>
          {isComplete && (
            <button className="button is-light is-medium" onClick={reset} style={{ border: "1px solid var(--border)" }}>
              Reset
            </button>
          )}
        </div>

        {/* Results */}
        {isComplete && (
          <>
            {/* Summary */}
            <div className="columns is-mobile mb-5">
              <div className="column">
                <p className="stat-value" style={{ fontSize: "1.5rem" }}>{resultRows.length}</p>
                <p className="stat-label">Clean rows</p>
              </div>
              <div className="column">
                <p className="stat-value" style={{ fontSize: "1.5rem" }}>{headers.length}</p>
                <p className="stat-label">Columns</p>
              </div>
              <div className="column">
                <p className="stat-value" style={{ fontSize: "1.5rem" }}>{issues.length}</p>
                <p className="stat-label">Issues found</p>
              </div>
              <div className="column">
                <p className="stat-value" style={{ fontSize: "1.5rem" }}>{dupes}</p>
                <p className="stat-label">Duplicates removed</p>
              </div>
              <div className="column">
                <p className="stat-value" style={{ fontSize: "1.5rem" }}>{(elapsed / 1000).toFixed(2)}s</p>
                <p className="stat-label">Total time</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs mb-0">
              <ul>
                <li className={tab === "data" ? "is-active" : ""}>
                  <a onClick={() => setTab("data")}>Clean Data</a>
                </li>
                <li className={tab === "issues" ? "is-active" : ""}>
                  <a onClick={() => setTab("issues")}>
                    Issues ({issues.length})
                  </a>
                </li>
              </ul>
            </div>

            {tab === "data" && (
              <div className="liquid-glass-card" style={{ overflow: "auto" }}>
                <table className="table is-fullwidth is-hoverable" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ fontSize: "0.8rem" }}>#</th>
                      {headers.map((h) => (
                        <th key={h} style={{ fontSize: "0.8rem" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resultRows.map((row, i) => (
                      <tr key={i}>
                        <td className="text-muted" style={{ fontSize: "0.8rem" }}>{i + 1}</td>
                        {row.map((cell, j) => (
                          <td key={j} style={{ fontSize: "0.8rem" }}>{cell || <span className="text-muted">\u2014</span>}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "issues" && (
              <div className="liquid-glass-card" style={{ overflow: "auto" }}>
                <table className="table is-fullwidth" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ fontSize: "0.8rem" }}>Row</th>
                      <th style={{ fontSize: "0.8rem" }}>Column</th>
                      <th style={{ fontSize: "0.8rem" }}>Severity</th>
                      <th style={{ fontSize: "0.8rem" }}>Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((issue, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: "0.8rem" }}>{issue.row}</td>
                        <td style={{ fontSize: "0.8rem" }}><code style={{ fontSize: "0.75rem" }}>{issue.col}</code></td>
                        <td style={{ fontSize: "0.8rem" }}>
                          <span
                            className="tag is-small"
                            style={{
                              background:
                                issue.severity === "error"
                                  ? "rgba(220,53,69,0.1)"
                                  : issue.severity === "warning"
                                    ? "rgba(201,162,39,0.1)"
                                    : "rgba(34,197,94,0.1)",
                              color:
                                issue.severity === "error"
                                  ? "#dc3545"
                                  : issue.severity === "warning"
                                    ? "var(--accent)"
                                    : "#22c55e",
                              border: "none",
                            }}
                          >
                            {issue.severity}
                          </span>
                        </td>
                        <td className="text-secondary" style={{ fontSize: "0.8rem" }}>{issue.message}</td>
                      </tr>
                    ))}
                    {dupes > 0 && (
                      <tr>
                        <td style={{ fontSize: "0.8rem" }}>\u2014</td>
                        <td style={{ fontSize: "0.8rem" }}><code style={{ fontSize: "0.75rem" }}>row</code></td>
                        <td style={{ fontSize: "0.8rem" }}>
                          <span className="tag is-small" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "none" }}>fixed</span>
                        </td>
                        <td className="text-secondary" style={{ fontSize: "0.8rem" }}>{dupes} duplicate row{dupes > 1 ? "s" : ""} removed</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
