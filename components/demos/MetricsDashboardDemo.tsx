"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageMetrics {
  ttfb: number;
  domReady: number;
  pageLoad: number;
  resources: number;
  transferKB: number;
}

interface PingEntry {
  ts: number;
  latency: number;
  ok: boolean;
}

const HISTORY = 40;

// ---------------------------------------------------------------------------
// Sparkline
// ---------------------------------------------------------------------------

function Sparkline({ data, height = 48 }: { data: number[]; height?: number }) {
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
            height: `${Math.max(6, ((val - min) / range) * 100)}%`,
            background: "var(--accent)",
            borderRadius: "1px",
            opacity: 0.35 + (i / data.length) * 0.65,
            transition: "height 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function collectPageMetrics(): PageMetrics | null {
  const entries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  if (entries.length === 0) return null;
  const nav = entries[0];
  const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  const totalBytes = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
  return {
    ttfb: Math.round(nav.responseStart - nav.requestStart),
    domReady: Math.round(nav.domInteractive - nav.startTime),
    pageLoad: Math.round(nav.loadEventEnd - nav.startTime),
    resources: resources.length,
    transferKB: Math.round(totalBytes / 1024),
  };
}

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MetricsDashboardDemo() {
  const [pageMetrics, setPageMetrics] = useState<PageMetrics | null>(null);
  const [pings, setPings] = useState<PingEntry[]>([]);
  const [isLive, setIsLive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Collect page metrics once on mount
  useEffect(() => {
    const id = setTimeout(() => setPageMetrics(collectPageMetrics()), 100);
    return () => clearTimeout(id);
  }, []);

  const doPing = useCallback(async () => {
    const t0 = performance.now();
    let ok = true;
    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "{ __typename }" }),
      });
      if (!res.ok) ok = false;
    } catch {
      ok = false;
    }
    const latency = Math.round(performance.now() - t0);
    setPings((prev) => {
      const next = [...prev, { ts: Date.now(), latency, ok }];
      return next.length > HISTORY ? next.slice(-HISTORY) : next;
    });
  }, []);

  const startMonitoring = useCallback(() => {
    setPings([]);
    setIsLive(true);
    doPing(); // first ping immediately
    intervalRef.current = setInterval(doPing, 3000);
  }, [doPing]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsLive(false);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const latencies = pings.filter((p) => p.ok).map((p) => p.latency);
  const avg = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
  const min = latencies.length ? Math.min(...latencies) : 0;
  const max = latencies.length ? Math.max(...latencies) : 0;
  const p95 = latencies.length >= 2 ? percentile(latencies, 95) : max;
  const uptime = pings.length ? ((pings.filter((p) => p.ok).length / pings.length) * 100).toFixed(1) : "0";

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "960px" }}>
        <h1 className="title is-2 font-display mb-2">Site Performance Monitor</h1>
        <p className="text-secondary mb-5" style={{ lineHeight: 1.7, maxWidth: "640px" }}>
          Real metrics from your browser — not simulated data. Page load
          timing comes from the Navigation Timing API. API health is measured
          by pinging this site&apos;s GraphQL endpoint every 3 seconds.
        </p>

        {/* Page Load Metrics */}
        {pageMetrics && (
          <div className="mb-6">
            <h2 className="title is-5 mb-3">Page Load</h2>
            <div className="columns is-mobile is-multiline">
              {[
                { label: "TTFB", value: `${pageMetrics.ttfb}ms`, sub: "Time to first byte" },
                { label: "DOM Ready", value: `${pageMetrics.domReady}ms`, sub: "Interactive" },
                { label: "Page Load", value: `${pageMetrics.pageLoad}ms`, sub: "Full load" },
                { label: "Resources", value: String(pageMetrics.resources), sub: `${pageMetrics.transferKB} KB transferred` },
              ].map((m) => (
                <div key={m.label} className="column is-3-tablet is-6-mobile">
                  <div className="liquid-glass-card" style={{ padding: "1.25rem", textAlign: "center" }}>
                    <p className="text-muted" style={{ fontSize: "0.7rem", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>{m.label}</p>
                    <p className="stat-value" style={{ fontSize: "1.5rem" }}>{m.value}</p>
                    <p className="text-muted" style={{ fontSize: "0.7rem", marginTop: "0.25rem" }}>{m.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Health */}
        <h2 className="title is-5 mb-3">API Health</h2>
        <p className="text-muted mb-4" style={{ fontSize: "0.85rem" }}>
          Endpoint: <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>/api/graphql</code>
        </p>

        <div className="mb-5" style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            className={`button is-medium ${isLive ? "is-light" : "is-primary"}`}
            onClick={isLive ? stopMonitoring : startMonitoring}
            style={isLive ? { border: "1px solid var(--border)" } : undefined}
          >
            {isLive ? "Stop" : "Start Monitoring"}
          </button>
          {isLive && (
            <span className="status-badge">
              <span className="status-dot" />
              Pinging every 3s
            </span>
          )}
          {!isLive && pings.length > 0 && (
            <span className="text-muted" style={{ fontSize: "0.8rem" }}>{pings.length} pings collected</span>
          )}
        </div>

        {pings.length > 0 && (
          <>
            {/* Sparkline */}
            <div className="liquid-glass-card mb-5" style={{ padding: "1.25rem" }}>
              <p className="has-text-weight-bold mb-3" style={{ fontSize: "0.85rem" }}>
                Latency <span className="text-muted">(last {pings.length} pings)</span>
              </p>
              <Sparkline data={pings.map((p) => p.latency)} height={64} />
            </div>

            {/* Stats */}
            <div className="columns is-mobile is-multiline mb-5">
              {[
                { label: "Average", value: `${avg}ms` },
                { label: "Min", value: `${min}ms` },
                { label: "p95", value: `${p95}ms` },
                { label: "Max", value: `${max}ms` },
                { label: "Uptime", value: `${uptime}%` },
              ].map((s) => (
                <div key={s.label} className="column">
                  <p className="stat-value" style={{ fontSize: "1.35rem" }}>{s.value}</p>
                  <p className="stat-label">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Ping Log */}
            <details>
              <summary className="text-secondary" style={{ cursor: "pointer", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                Ping log ({pings.length} entries)
              </summary>
              <div className="liquid-glass-card" style={{ overflow: "auto", maxHeight: "240px" }}>
                <table className="table is-fullwidth" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ fontSize: "0.75rem" }}>#</th>
                      <th style={{ fontSize: "0.75rem" }}>Time</th>
                      <th style={{ fontSize: "0.75rem" }}>Latency</th>
                      <th style={{ fontSize: "0.75rem" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...pings].reverse().map((p, i) => (
                      <tr key={p.ts}>
                        <td className="text-muted" style={{ fontSize: "0.75rem" }}>{pings.length - i}</td>
                        <td style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
                          {new Date(p.ts).toLocaleTimeString()}
                        </td>
                        <td style={{ fontSize: "0.75rem" }}>{p.latency}ms</td>
                        <td>
                          <span style={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: p.ok ? "#22c55e" : "#ef4444",
                          }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </div>
    </div>
  );
}
