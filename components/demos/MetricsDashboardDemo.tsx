"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Snapshot {
  latency: number;
  throughput: number;
  errorRate: number;
  cpu: number;
  memory: number;
}

const HISTORY_LENGTH = 30;

function nextSnapshot(prev: Snapshot): Snapshot {
  return {
    latency: Math.max(20, Math.min(300, prev.latency + (Math.random() - 0.5) * 40)),
    throughput: Math.max(200, Math.min(3000, prev.throughput + (Math.random() - 0.48) * 200)),
    errorRate: Math.max(0, Math.min(5, prev.errorRate + (Math.random() - 0.5) * 0.4)),
    cpu: Math.max(8, Math.min(95, prev.cpu + (Math.random() - 0.5) * 12)),
    memory: Math.max(30, Math.min(90, prev.memory + (Math.random() - 0.5) * 4)),
  };
}

function Sparkline({
  data,
  color = "var(--accent)",
  height = 48,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  if (data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height }}>
      {data.map((val, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${Math.max(4, ((val - min) / range) * 100)}%`,
            background: color,
            borderRadius: "1px",
            opacity: 0.4 + (i / data.length) * 0.6,
            transition: "height 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

export default function MetricsDashboardDemo() {
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [isLive, setIsLive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startStreaming = useCallback(() => {
    const seed: Snapshot = {
      latency: 120,
      throughput: 1200,
      errorRate: 0.3,
      cpu: 45,
      memory: 62,
    };
    setHistory([seed]);
    setIsLive(true);

    intervalRef.current = setInterval(() => {
      setHistory((prev) => {
        const next = nextSnapshot(prev[prev.length - 1]);
        const updated = [...prev, next];
        return updated.length > HISTORY_LENGTH
          ? updated.slice(-HISTORY_LENGTH)
          : updated;
      });
    }, 1000);
  }, []);

  const stopStreaming = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsLive(false);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const current = history[history.length - 1];
  const prev = history.length > 1 ? history[history.length - 2] : undefined;

  const trend = (curr: number, prevVal: number | undefined) => {
    if (prevVal === undefined) return null;
    const pct = ((curr - prevVal) / prevVal) * 100;
    if (Math.abs(pct) < 0.5) return null;
    return { dir: pct > 0 ? ("up" as const) : ("down" as const), value: Math.abs(pct).toFixed(1) };
  };

  const metrics = current
    ? [
        {
          label: "Response Time",
          value: `${Math.round(current.latency)}ms`,
          trend: trend(current.latency, prev?.latency),
          goodDir: "down" as const,
        },
        {
          label: "Throughput",
          value: `${(current.throughput / 1000).toFixed(1)}k/s`,
          trend: trend(current.throughput, prev?.throughput),
          goodDir: "up" as const,
        },
        {
          label: "Error Rate",
          value: `${current.errorRate.toFixed(2)}%`,
          trend: trend(current.errorRate, prev?.errorRate),
          goodDir: "down" as const,
        },
        {
          label: "CPU Usage",
          value: `${Math.round(current.cpu)}%`,
          trend: trend(current.cpu, prev?.cpu),
          goodDir: "down" as const,
        },
      ]
    : [];

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "960px" }}>
        <h1 className="title is-2 font-display mb-2">System Monitor</h1>
        <p
          className="text-secondary mb-5"
          style={{ lineHeight: 1.7, maxWidth: "640px" }}
        >
          Real-time metrics dashboard with streaming data, sparkline charts, and
          trend indicators. The kind of observability UI I build for production
          systems.
        </p>

        {/* Controls */}
        <div
          className="mb-5"
          style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
        >
          <button
            className={`button is-medium ${isLive ? "is-light" : "is-primary"}`}
            onClick={isLive ? stopStreaming : startStreaming}
            style={isLive ? { border: "1px solid var(--border)" } : undefined}
          >
            {isLive ? "Stop" : "Start Monitoring"}
          </button>
          {isLive && (
            <span className="status-badge">
              <span className="status-dot" />
              Streaming
            </span>
          )}
        </div>

        {current ? (
          <>
            {/* Metric Cards */}
            <div className="columns is-mobile is-multiline mb-5">
              {metrics.map((m) => {
                const good = m.trend
                  ? m.trend.dir === m.goodDir
                  : null;
                return (
                  <div
                    key={m.label}
                    className="column is-3-tablet is-6-mobile"
                  >
                    <div
                      className="liquid-glass-card"
                      style={{ padding: "1.25rem", textAlign: "center" }}
                    >
                      <p
                        className="text-muted"
                        style={{ fontSize: "0.75rem", marginBottom: "0.5rem" }}
                      >
                        {m.label}
                      </p>
                      <p className="stat-value" style={{ fontSize: "1.5rem" }}>
                        {m.value}
                      </p>
                      {m.trend && (
                        <p
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            marginTop: "0.25rem",
                            color: good ? "#22c55e" : "#ef4444",
                          }}
                        >
                          {m.trend.dir === "up" ? "\u2191" : "\u2193"}{" "}
                          {m.trend.value}%
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Charts */}
            <div className="columns mb-5">
              <div className="column is-half">
                <div
                  className="liquid-glass-card"
                  style={{ padding: "1.25rem" }}
                >
                  <p
                    className="has-text-weight-bold mb-3"
                    style={{ fontSize: "0.85rem" }}
                  >
                    Response Time{" "}
                    <span className="text-muted">
                      (last {history.length}s)
                    </span>
                  </p>
                  <Sparkline data={history.map((h) => h.latency)} height={60} />
                </div>
              </div>
              <div className="column is-half">
                <div
                  className="liquid-glass-card"
                  style={{ padding: "1.25rem" }}
                >
                  <p
                    className="has-text-weight-bold mb-3"
                    style={{ fontSize: "0.85rem" }}
                  >
                    Throughput{" "}
                    <span className="text-muted">
                      (last {history.length}s)
                    </span>
                  </p>
                  <Sparkline
                    data={history.map((h) => h.throughput)}
                    height={60}
                  />
                </div>
              </div>
            </div>

            {/* Service Status */}
            <div className="liquid-glass-card" style={{ padding: "1.25rem" }}>
              <p
                className="has-text-weight-bold mb-3"
                style={{ fontSize: "0.85rem" }}
              >
                Service Status
              </p>
              <div
                style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}
              >
                {[
                  { name: "API Gateway", healthy: current.errorRate < 2 },
                  { name: "Database", healthy: current.latency < 200 },
                  { name: "Cache", healthy: true },
                  { name: "Queue", healthy: current.cpu < 85 },
                ].map((svc) => (
                  <div
                    key={svc.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: svc.healthy ? "#22c55e" : "#ef4444",
                        boxShadow: svc.healthy
                          ? "0 0 6px rgba(34,197,94,0.4)"
                          : "0 0 6px rgba(239,68,68,0.4)",
                      }}
                    />
                    <span
                      className="text-secondary"
                      style={{ fontSize: "0.85rem" }}
                    >
                      {svc.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div
            className="liquid-glass-card"
            style={{ padding: "3rem", textAlign: "center" }}
          >
            <p className="text-muted">
              Click &ldquo;Start Monitoring&rdquo; to begin streaming metrics
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
