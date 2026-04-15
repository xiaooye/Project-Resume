"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const stages = [
  { id: "ingest", label: "Ingest", detail: "Read from source" },
  { id: "parse", label: "Parse", detail: "Extract records" },
  { id: "validate", label: "Validate", detail: "Check constraints" },
  { id: "transform", label: "Transform", detail: "Normalize data" },
  { id: "load", label: "Load", detail: "Write to database" },
];

const TOTAL_RECORDS = 6000;
const RECORDS_PER_TICK = 42;
const TICK_MS = 50;

export default function DataPipelineDemo() {
  const [currentStage, setCurrentStage] = useState(-1);
  const [recordsProcessed, setRecordsProcessed] = useState(0);
  const [errors, setErrors] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef({ records: 0, errors: 0, stage: 0 });
  const startTimeRef = useRef(0);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    stateRef.current = { records: 0, errors: 0, stage: 0 };
    setCurrentStage(-1);
    setRecordsProcessed(0);
    setErrors(0);
    setElapsed(0);
    setIsRunning(false);
    setIsComplete(false);
  }, []);

  const start = useCallback(() => {
    reset();
    setIsRunning(true);
    setCurrentStage(0);
    startTimeRef.current = performance.now();
    stateRef.current = { records: 0, errors: 0, stage: 0 };

    const recordsPerStage = TOTAL_RECORDS / stages.length;

    intervalRef.current = setInterval(() => {
      const s = stateRef.current;
      setElapsed(performance.now() - startTimeRef.current);

      s.records += RECORDS_PER_TICK + Math.floor(Math.random() * 10 - 5);
      s.records = Math.min(s.records, TOTAL_RECORDS);
      setRecordsProcessed(s.records);

      if (Math.random() < 0.015) {
        s.errors++;
        setErrors(s.errors);
      }

      const newStage = Math.min(Math.floor(s.records / recordsPerStage), stages.length - 1);
      if (newStage !== s.stage) {
        s.stage = newStage;
        setCurrentStage(newStage);
      }

      if (s.records >= TOTAL_RECORDS) {
        clearInterval(intervalRef.current!);
        setIsRunning(false);
        setIsComplete(true);
        setRecordsProcessed(TOTAL_RECORDS);
      }
    }, TICK_MS);
  }, [reset]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const progress = (recordsProcessed / TOTAL_RECORDS) * 100;
  const accuracy =
    recordsProcessed > 0
      ? (((recordsProcessed - errors) / recordsProcessed) * 100).toFixed(1)
      : "\u2014";

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "960px" }}>
        <h1 className="title is-2 font-display mb-2">Data Pipeline</h1>
        <p
          className="text-secondary mb-5"
          style={{ lineHeight: 1.7, maxWidth: "640px" }}
        >
          Animated simulation of a batch processing pipeline — the kind I built
          for the{" "}
          <a href="/case-studies/batch-processing" className="has-text-accent">
            Excel-to-Database case study
          </a>
          . Watch records flow through ingestion, parsing, validation,
          transformation, and loading.
        </p>

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
            {/* Connecting line */}
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
                <div
                  key={stage.id}
                  style={{
                    textAlign: "center",
                    flex: 1,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      width: "2.25rem",
                      height: "2.25rem",
                      borderRadius: "50%",
                      border: `2px solid ${status === "pending" ? "var(--border-strong)" : "var(--accent)"}`,
                      background:
                        status === "complete" ? "var(--accent)" : "var(--bg)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color:
                        status === "complete"
                          ? "#1a1a1a"
                          : status === "active"
                            ? "var(--accent)"
                            : "var(--text-muted)",
                      transition: "all 0.3s ease",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {status === "complete"
                      ? "\u2713"
                      : String(i + 1).padStart(2, "0")}
                  </div>
                  <p
                    className="has-text-weight-bold"
                    style={{
                      fontSize: "0.85rem",
                      color:
                        status !== "pending"
                          ? "var(--text-primary)"
                          : "var(--text-muted)",
                    }}
                  >
                    {stage.label}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {stage.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Bar */}
        {(isRunning || isComplete) && (
          <div className="mb-5">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                Progress
              </span>
              <span
                className="has-text-accent has-text-weight-bold"
                style={{ fontSize: "0.8rem" }}
              >
                {Math.round(progress)}%
              </span>
            </div>
            <div
              style={{
                height: "6px",
                background: "var(--bg-subtle)",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: "var(--accent)",
                  borderRadius: "3px",
                  transition: "width 0.1s linear",
                }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        {(isRunning || isComplete) && (
          <div className="columns is-mobile mb-5">
            <div className="column">
              <p className="stat-value" style={{ fontSize: "1.5rem" }}>
                {recordsProcessed.toLocaleString()}
              </p>
              <p className="stat-label">Records processed</p>
            </div>
            <div className="column">
              <p className="stat-value" style={{ fontSize: "1.5rem" }}>
                {(elapsed / 1000).toFixed(1)}s
              </p>
              <p className="stat-label">Elapsed time</p>
            </div>
            <div className="column">
              <p className="stat-value" style={{ fontSize: "1.5rem" }}>
                {errors}
              </p>
              <p className="stat-label">Errors caught</p>
            </div>
            <div className="column">
              <p className="stat-value" style={{ fontSize: "1.5rem" }}>
                {accuracy}%
              </p>
              <p className="stat-label">Accuracy</p>
            </div>
          </div>
        )}

        {/* Completion */}
        {isComplete && (
          <div
            className="notification is-success mb-5"
            style={{ textAlign: "center" }}
          >
            <p className="has-text-weight-bold mb-1">Pipeline complete</p>
            <p style={{ color: "var(--text-secondary)" }}>
              Processed {TOTAL_RECORDS.toLocaleString()} records in{" "}
              {(elapsed / 1000).toFixed(1)}s — {accuracy}% accuracy
            </p>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            className="button is-primary is-medium"
            onClick={start}
            disabled={isRunning}
          >
            {isRunning
              ? "Processing..."
              : isComplete
                ? "Run Again"
                : "Start Pipeline"}
          </button>
          {(isRunning || isComplete) && (
            <button
              className="button is-light is-medium"
              onClick={reset}
              style={{ border: "1px solid var(--border)" }}
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
