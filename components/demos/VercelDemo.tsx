"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import * as d3 from "d3";

// Types
type EdgeFunctionResult = {
  region: string;
  ip: string;
  latency: string;
  timestamp: string;
  edgeLocation: string;
  performance: {
    coldStart: boolean;
    executionTime: number;
    memoryUsed: string;
  };
};

type ServerlessFunctionResult = {
  coldStart: boolean;
  executionTime: string;
  timestamp: string;
  performance: {
    coldStartDelay: number;
    warmExecutionTime: number;
    memoryUsed: string;
    cpuTime: string;
  };
  metrics: {
    invocations: number;
    errors: number;
    avgDuration: string;
    cost: number;
  };
};

type KVOperation = {
  key: string;
  value?: any;
  ttl?: number;
  hits?: number;
  cached?: boolean;
};

type AnalyticsData = {
  summary: {
    pageViews: number;
    uniqueVisitors: number;
    avgSessionDuration: string;
    bounceRate: string;
  };
  pageViews: Array<{ timestamp: Date; value: number }>;
  uniqueVisitors: Array<{ timestamp: Date; value: number }>;
  topPages: Array<{ path: string; views: number; unique: number }>;
  topReferrers: Array<{ source: string; visits: number }>;
  performanceMetrics: {
    lcp: { p50: number; p75: number; p95: number };
    fid: { p50: number; p75: number; p95: number };
    cls: { p50: number; p75: number; p95: number };
    ttfb: { p50: number; p75: number; p95: number };
  };
  countries: Array<{ country: string; visits: number }>;
  devices: Array<{ device: string; visits: number; percentage: number }>;
};

type TabType = "edge" | "serverless" | "kv" | "analytics";

export default function VercelDemo() {
  const [activeTab, setActiveTab] = useState<TabType>("edge");
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Edge Functions States
  const [edgeResults, setEdgeResults] = useState<EdgeFunctionResult[]>([]);
  const [invokingEdge, setInvokingEdge] = useState(false);
  const edgeChartRef = useRef<SVGSVGElement>(null);

  // Serverless Functions States
  const [serverlessResults, setServerlessResults] = useState<ServerlessFunctionResult[]>([]);
  const [invokingServerless, setInvokingServerless] = useState(false);
  const [coldStartCount, setColdStartCount] = useState(0);
  const serverlessChartRef = useRef<SVGSVGElement>(null);

  // KV States
  const [kvOperations, setKvOperations] = useState<KVOperation[]>([]);
  const [kvKey, setKvKey] = useState("");
  const [kvValue, setKvValue] = useState("");
  const [kvTtl, setKvTtl] = useState(3600);
  const [kvStats, setKvStats] = useState({ totalKeys: 0, activeKeys: 0, totalHits: 0, memoryUsage: "0KB" });

  // Analytics States
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<"24h" | "7d" | "30d">("24h");
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const analyticsChartRef = useRef<SVGSVGElement>(null);
  const analyticsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize
  useEffect(() => {
    setIsMounted(true);

    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleReducedMotion = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    mediaQuery.addEventListener("change", handleReducedMotion);

    // Load initial analytics data
    loadAnalyticsData();

    return () => {
      window.removeEventListener("resize", checkScreenSize);
      mediaQuery.removeEventListener("change", handleReducedMotion);
      if (analyticsIntervalRef.current) {
        clearInterval(analyticsIntervalRef.current);
      }
    };
  }, []);

  // Render charts when data changes
  useEffect(() => {
    if (activeTab === "edge" && edgeResults.length > 0 && edgeChartRef.current) {
      renderEdgeChart();
    }
  }, [edgeResults, activeTab, isMobile]);

  useEffect(() => {
    if (activeTab === "serverless" && serverlessResults.length > 0 && serverlessChartRef.current) {
      renderServerlessChart();
    }
  }, [serverlessResults, activeTab, isMobile]);

  useEffect(() => {
    if (activeTab === "analytics" && analyticsData && analyticsChartRef.current) {
      renderAnalyticsChart();
    }
  }, [analyticsData, analyticsPeriod, activeTab, isMobile]);

  // Edge Functions
  const handleInvokeEdge = async () => {
    setInvokingEdge(true);
    try {
      const response = await fetch("/api/vercel/edge");
      const result = await response.json();
      if (result.success) {
        setEdgeResults((prev) => [result.data, ...prev.slice(0, 19)]);
      }
    } catch (error) {
      console.error("Edge function error:", error);
    } finally {
      setInvokingEdge(false);
    }
  };

  const renderEdgeChart = () => {
    if (!edgeChartRef.current || edgeResults.length === 0) return;

    const svg = d3.select(edgeChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const width = (edgeChartRef.current.parentElement?.clientWidth || 800) - margin.left - margin.right;
    const height = isMobile ? 200 : 300 - margin.top - margin.bottom;

    const data = edgeResults.slice(0, 10).reverse();
    const xScale = d3
      .scaleBand()
      .domain(data.map((_, i) => i.toString()))
      .range([0, width])
      .padding(0.2);

    const latencies = data.map((d) => parseInt(d.latency.replace("ms", "")));
    const yScale = d3.scaleLinear().domain([0, d3.max(latencies) || 100]).nice().range([height, 0]);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat((_, i) => `#${data.length - i}`));

    g.append("g").call(d3.axisLeft(yScale).tickFormat((d) => `${d}ms`));

    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (_, i) => xScale(i.toString()) || 0)
      .attr("y", (d) => yScale(parseInt(d.latency.replace("ms", ""))))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => height - yScale(parseInt(d.latency.replace("ms", ""))))
      .attr("fill", "#00d4aa");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Latency (ms)");
  };

  // Serverless Functions
  const handleInvokeServerless = async () => {
    setInvokingServerless(true);
    try {
      const response = await fetch("/api/vercel/serverless");
      const result = await response.json();
      if (result.success) {
        setServerlessResults((prev) => [result.data, ...prev.slice(0, 19)]);
        if (result.data.coldStart) {
          setColdStartCount((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error("Serverless function error:", error);
    } finally {
      setInvokingServerless(false);
    }
  };

  const renderServerlessChart = () => {
    if (!serverlessChartRef.current || serverlessResults.length === 0) return;

    const svg = d3.select(serverlessChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const width = (serverlessChartRef.current.parentElement?.clientWidth || 800) - margin.left - margin.right;
    const height = isMobile ? 200 : 300 - margin.top - margin.bottom;

    const data = serverlessResults.slice(0, 10).reverse();
    const xScale = d3
      .scaleBand()
      .domain(data.map((_, i) => i.toString()))
      .range([0, width])
      .padding(0.2);

    const executionTimes = data.map((d) => parseInt(d.executionTime.replace("ms", "")));
    const yScale = d3.scaleLinear().domain([0, d3.max(executionTimes) || 300]).nice().range([height, 0]);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat((_, i) => `#${data.length - i}`));

    g.append("g").call(d3.axisLeft(yScale).tickFormat((d) => `${d}ms`));

    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (_, i) => xScale(i.toString()) || 0)
      .attr("y", (d) => yScale(parseInt(d.executionTime.replace("ms", ""))))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => height - yScale(parseInt(d.executionTime.replace("ms", ""))))
      .attr("fill", (d) => (d.coldStart ? "#ff6b6b" : "#4ecdc4"));

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Execution Time (ms)");
  };

  // KV Operations
  const handleKVSet = async () => {
    if (!kvKey || !kvValue) return;

    try {
      const response = await fetch("/api/vercel/kv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: kvKey, value: kvValue, ttl: kvTtl }),
      });
      const result = await response.json();
      if (result.success) {
        setKvOperations((prev) => [{ key: kvKey, value: kvValue, ttl: kvTtl, hits: 0 }, ...prev]);
        setKvKey("");
        setKvValue("");
        loadKVStats();
      }
    } catch (error) {
      console.error("KV set error:", error);
    }
  };

  const handleKVGet = async (key: string) => {
    try {
      const response = await fetch(`/api/vercel/kv?key=${encodeURIComponent(key)}&operation=get`);
      const result = await response.json();
      if (result.success && result.data.cached) {
        setKvOperations((prev) =>
          prev.map((op) => (op.key === key ? { ...op, hits: result.data.hits, cached: true } : op))
        );
      }
    } catch (error) {
      console.error("KV get error:", error);
    }
  };

  const handleKVDelete = async (key: string) => {
    try {
      const response = await fetch(`/api/vercel/kv?key=${encodeURIComponent(key)}`, { method: "DELETE" });
      const result = await response.json();
      if (result.success) {
        setKvOperations((prev) => prev.filter((op) => op.key !== key));
        loadKVStats();
      }
    } catch (error) {
      console.error("KV delete error:", error);
    }
  };

  const loadKVStats = async () => {
    try {
      const response = await fetch("/api/vercel/kv?operation=stats");
      const result = await response.json();
      if (result.success) {
        setKvStats(result.data);
      }
    } catch (error) {
      console.error("KV stats error:", error);
    }
  };

  const loadKVList = async () => {
    try {
      const response = await fetch("/api/vercel/kv?operation=list");
      const result = await response.json();
      if (result.success) {
        setKvOperations(result.data.keys.map((k: any) => ({ key: k.key, ttl: k.ttl, hits: k.hits })));
      }
    } catch (error) {
      console.error("KV list error:", error);
    }
  };

  // Analytics
  const loadAnalyticsData = async () => {
    setLoadingAnalytics(true);
    try {
      const response = await fetch(`/api/vercel/analytics?period=${analyticsPeriod}`);
      const result = await response.json();
      if (result.success) {
        const data = result.data;
        setAnalyticsData({
          ...data,
          pageViews: data.pageViews.map((p: any) => ({ ...p, timestamp: new Date(p.timestamp) })),
          uniqueVisitors: data.uniqueVisitors.map((v: any) => ({ ...v, timestamp: new Date(v.timestamp) })),
        });
      }
    } catch (error) {
      console.error("Analytics error:", error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [analyticsPeriod]);

  const renderAnalyticsChart = () => {
    if (!analyticsChartRef.current || !analyticsData) return;

    const svg = d3.select(analyticsChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const width = (analyticsChartRef.current.parentElement?.clientWidth || 800) - margin.left - margin.right;
    const height = isMobile ? 200 : 300 - margin.top - margin.bottom;

    const data = analyticsData.pageViews;
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.timestamp) as [Date, Date])
      .range([0, width]);

    const yScale = d3.scaleLinear().domain([0, d3.max(data, (d) => d.value) || 1000]).nice().range([height, 0]);

    const line = d3
      .line<{ timestamp: Date; value: number }>()
      .x((d) => xScale(d.timestamp))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(isMobile ? 5 : 10).tickFormat(d3.timeFormat("%H:%M") as any));

    g.append("g").call(d3.axisLeft(yScale));

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#00d4aa")
      .attr("stroke-width", 2)
      .attr("d", line);

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Page Views");
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="container is-fluid mt-6">
      <div className="box liquid-glass-card">
        <h1 className="title is-2 mb-6 liquid-glass-text">Vercel Platform Integration Demo</h1>
        <p className="subtitle is-5 mb-6 liquid-glass-text">
          Modern deployment platform demonstration with Edge Functions, Serverless Functions, KV Cache, and Analytics
        </p>

        {/* Tabs */}
        <div className="tabs is-boxed">
          <ul>
            <li className={activeTab === "edge" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("edge")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("edge");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Edge Functions tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">⚡</span>
                </span>
                <span>Edge Functions</span>
              </a>
            </li>
            <li className={activeTab === "serverless" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("serverless")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("serverless");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Serverless Functions tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">🚀</span>
                </span>
                <span>Serverless</span>
              </a>
            </li>
            <li className={activeTab === "kv" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("kv")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("kv");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Vercel KV Cache tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">💾</span>
                </span>
                <span>KV Cache</span>
              </a>
            </li>
            <li className={activeTab === "analytics" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("analytics")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("analytics");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Analytics tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">📊</span>
                </span>
                <span>Analytics</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Edge Functions Tab */}
          {activeTab === "edge" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">Edge Functions</h2>
              <p className="subtitle is-6 mb-4 liquid-glass-text">
                Global edge deployment for ultra-low latency. Functions run at the edge closest to your users.
              </p>

              <div className="box liquid-glass-card mb-4">
                <div className="field is-grouped">
                  <div className="control">
                    <button
                      className="button is-primary"
                      onClick={handleInvokeEdge}
                      disabled={invokingEdge}
                      aria-label="Invoke edge function"
                    >
                      {invokingEdge ? "Invoking..." : "Invoke Edge Function"}
                    </button>
                  </div>
                </div>

                {edgeResults.length > 0 && (
                  <div className="mt-4">
                    <h3 className="title is-5 mb-3 liquid-glass-text">Recent Invocations</h3>
                    <div className="table-container">
                      <table className="table is-fullwidth is-striped">
                        <thead>
                          <tr>
                            <th>Region</th>
                            <th>Edge Location</th>
                            <th>Latency</th>
                            <th>Memory</th>
                            <th>Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {edgeResults.slice(0, 5).map((result, idx) => (
                            <motion.tr
                              key={idx}
                              initial={prefersReducedMotion ? {} : { opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={prefersReducedMotion ? {} : { duration: 0.3 }}
                            >
                              <td>{result.region}</td>
                              <td>{result.edgeLocation}</td>
                              <td>
                                <span className="tag is-success">{result.latency}</span>
                              </td>
                              <td>{result.performance.memoryUsed}</td>
                              <td>{new Date(result.timestamp).toLocaleTimeString()}</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {edgeResults.length > 0 && (
                  <div className="mt-4">
                    <h3 className="title is-5 mb-3 liquid-glass-text">Latency Chart</h3>
                    <div className="box liquid-glass-card">
                      <svg ref={edgeChartRef} width="100%" height={isMobile ? 250 : 350} role="img" aria-label="Edge function latency chart" />
                      <div className="is-sr-only" role="region" aria-label="Edge function latency data table">
                        <table>
                          <caption>Edge Function Latency Data</caption>
                          <thead>
                            <tr>
                              <th>Invocation</th>
                              <th>Latency (ms)</th>
                              <th>Region</th>
                            </tr>
                          </thead>
                          <tbody>
                            {edgeResults.slice(0, 10).map((result, idx) => (
                              <tr key={idx}>
                                <td>#{edgeResults.length - idx}</td>
                                <td>{result.latency}</td>
                                <td>{result.region}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="box liquid-glass-card">
                <h3 className="title is-5 mb-3 liquid-glass-text">Edge Function Benefits</h3>
                <div className="content">
                  <ul>
                    <li>⚡ Ultra-low latency - runs at the edge closest to users</li>
                    <li>🌍 Global distribution - automatic edge location selection</li>
                    <li>💰 Cost-effective - pay only for what you use</li>
                    <li>🔒 Secure - built-in security and DDoS protection</li>
                    <li>📈 Scalable - handles traffic spikes automatically</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Serverless Functions Tab */}
          {activeTab === "serverless" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">Serverless Functions</h2>
              <p className="subtitle is-6 mb-4 liquid-glass-text">
                On-demand function execution with automatic scaling and cold start optimization.
              </p>

              <div className="box liquid-glass-card mb-4">
                <div className="field is-grouped">
                  <div className="control">
                    <button
                      className="button is-primary"
                      onClick={handleInvokeServerless}
                      disabled={invokingServerless}
                      aria-label="Invoke serverless function"
                    >
                      {invokingServerless ? "Invoking..." : "Invoke Serverless Function"}
                    </button>
                  </div>
                </div>

                {coldStartCount > 0 && (
                  <div className="notification is-info mt-4">
                    <p>
                      <strong>Cold Starts Detected:</strong> {coldStartCount} (functions were idle for &gt;1 minute)
                    </p>
                  </div>
                )}

                {serverlessResults.length > 0 && (
                  <div className="mt-4">
                    <h3 className="title is-5 mb-3 liquid-glass-text">Recent Invocations</h3>
                    <div className="table-container">
                      <table className="table is-fullwidth is-striped">
                        <thead>
                          <tr>
                            <th>Cold Start</th>
                            <th>Execution Time</th>
                            <th>Warm Time</th>
                            <th>Memory</th>
                            <th>Cost</th>
                            <th>Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {serverlessResults.slice(0, 5).map((result, idx) => (
                            <motion.tr
                              key={idx}
                              initial={prefersReducedMotion ? {} : { opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={prefersReducedMotion ? {} : { duration: 0.3 }}
                            >
                              <td>
                                {result.coldStart ? (
                                  <span className="tag is-warning">Cold Start</span>
                                ) : (
                                  <span className="tag is-success">Warm</span>
                                )}
                              </td>
                              <td>{result.executionTime}</td>
                              <td>{result.performance.warmExecutionTime}ms</td>
                              <td>{result.performance.memoryUsed}</td>
                              <td>${result.metrics.cost.toFixed(6)}</td>
                              <td>{new Date(result.timestamp).toLocaleTimeString()}</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {serverlessResults.length > 0 && (
                  <div className="mt-4">
                    <h3 className="title is-5 mb-3 liquid-glass-text">Execution Time Chart</h3>
                    <div className="box liquid-glass-card">
                      <svg ref={serverlessChartRef} width="100%" height={isMobile ? 250 : 350} role="img" aria-label="Serverless function execution time chart" />
                      <div className="mt-2">
                        <span className="tag is-warning mr-2">Red = Cold Start</span>
                        <span className="tag is-info">Cyan = Warm Execution</span>
                      </div>
                      <div className="is-sr-only" role="region" aria-label="Serverless function execution time data table">
                        <table>
                          <caption>Serverless Function Execution Time Data</caption>
                          <thead>
                            <tr>
                              <th>Invocation</th>
                              <th>Execution Time (ms)</th>
                              <th>Cold Start</th>
                            </tr>
                          </thead>
                          <tbody>
                            {serverlessResults.slice(0, 10).map((result, idx) => (
                              <tr key={idx}>
                                <td>#{serverlessResults.length - idx}</td>
                                <td>{result.executionTime}</td>
                                <td>{result.coldStart ? "Yes" : "No"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="box liquid-glass-card">
                <h3 className="title is-5 mb-3 liquid-glass-text">Serverless Function Features</h3>
                <div className="content">
                  <ul>
                    <li>⚡ Automatic scaling - handles traffic spikes seamlessly</li>
                    <li>💰 Pay-per-use - only pay for execution time</li>
                    <li>🔧 Cold start optimization - keep functions warm for better performance</li>
                    <li>📊 Built-in monitoring - track invocations, errors, and costs</li>
                    <li>🔒 Secure by default - isolated execution environment</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* KV Cache Tab */}
          {activeTab === "kv" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">Vercel KV Cache</h2>
              <p className="subtitle is-6 mb-4 liquid-glass-text">
                High-performance key-value store for caching and session management.
              </p>

              <div className="box liquid-glass-card mb-4">
                <h3 className="title is-5 mb-3 liquid-glass-text">Cache Statistics</h3>
                <div className="columns is-mobile">
                  <div className="column">
                    <div className="box has-text-centered">
                      <p className="heading">Total Keys</p>
                      <p className="title is-4">{kvStats.totalKeys}</p>
                    </div>
                  </div>
                  <div className="column">
                    <div className="box has-text-centered">
                      <p className="heading">Active Keys</p>
                      <p className="title is-4">{kvStats.activeKeys}</p>
                    </div>
                  </div>
                  <div className="column">
                    <div className="box has-text-centered">
                      <p className="heading">Total Hits</p>
                      <p className="title is-4">{kvStats.totalHits}</p>
                    </div>
                  </div>
                  <div className="column">
                    <div className="box has-text-centered">
                      <p className="heading">Memory</p>
                      <p className="title is-4">{kvStats.memoryUsage}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="box liquid-glass-card mb-4">
                <h3 className="title is-5 mb-3 liquid-glass-text">Set Cache Value</h3>
                <div className="field">
                  <label className="label" htmlFor="kv-key">
                    Key
                  </label>
                  <div className="control">
                    <input
                      id="kv-key"
                      className="input"
                      type="text"
                      placeholder="cache-key"
                      value={kvKey}
                      onChange={(e) => setKvKey(e.target.value)}
                      aria-label="Cache key"
                    />
                  </div>
                </div>
                <div className="field">
                  <label className="label" htmlFor="kv-value">
                    Value
                  </label>
                  <div className="control">
                    <input
                      id="kv-value"
                      className="input"
                      type="text"
                      placeholder="cache-value"
                      value={kvValue}
                      onChange={(e) => setKvValue(e.target.value)}
                      aria-label="Cache value"
                    />
                  </div>
                </div>
                <div className="field">
                  <label className="label" htmlFor="kv-ttl">
                    TTL (seconds)
                  </label>
                  <div className="control">
                    <input
                      id="kv-ttl"
                      className="input"
                      type="number"
                      value={kvTtl}
                      onChange={(e) => setKvTtl(parseInt(e.target.value) || 3600)}
                      aria-label="Time to live in seconds"
                    />
                  </div>
                </div>
                <div className="field">
                  <div className="control">
                    <button className="button is-primary" onClick={handleKVSet} disabled={!kvKey || !kvValue} aria-label="Set cache value">
                      Set Value
                    </button>
                    <button className="button is-light ml-2" onClick={loadKVList} aria-label="Refresh cache list">
                      Refresh List
                    </button>
                  </div>
                </div>
              </div>

              <div className="box liquid-glass-card">
                <h3 className="title is-5 mb-3 liquid-glass-text">Cached Keys</h3>
                {kvOperations.length === 0 ? (
                  <p className="liquid-glass-text">No cached keys. Set a value to get started.</p>
                ) : (
                  <div className="table-container">
                    <table className="table is-fullwidth is-striped">
                      <thead>
                        <tr>
                          <th>Key</th>
                          <th>TTL</th>
                          <th>Hits</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kvOperations.map((op, idx) => (
                          <motion.tr
                            key={idx}
                            initial={prefersReducedMotion ? {} : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={prefersReducedMotion ? {} : { duration: 0.3 }}
                          >
                            <td>{op.key}</td>
                            <td>{op.ttl ? `${op.ttl}s` : "N/A"}</td>
                            <td>{op.hits || 0}</td>
                            <td>
                              <div className="buttons">
                                <button
                                  className="button is-small is-info"
                                  onClick={() => handleKVGet(op.key)}
                                  aria-label={`Get value for ${op.key}`}
                                >
                                  Get
                                </button>
                                <button
                                  className="button is-small is-danger"
                                  onClick={() => handleKVDelete(op.key)}
                                  aria-label={`Delete ${op.key}`}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">Vercel Analytics</h2>
              <p className="subtitle is-6 mb-4 liquid-glass-text">
                Real-time analytics and performance metrics for your application.
              </p>

              <div className="box liquid-glass-card mb-4">
                <div className="field is-grouped">
                  <div className="control">
                    <div className="select">
                      <select
                        value={analyticsPeriod}
                        onChange={(e) => setAnalyticsPeriod(e.target.value as "24h" | "7d" | "30d")}
                        aria-label="Analytics period"
                      >
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                      </select>
                    </div>
                  </div>
                  <div className="control">
                    <button
                      className="button is-light"
                      onClick={loadAnalyticsData}
                      disabled={loadingAnalytics}
                      aria-label="Refresh analytics data"
                    >
                      {loadingAnalytics ? "Loading..." : "Refresh"}
                    </button>
                  </div>
                </div>
              </div>

              {analyticsData && (
                <>
                  <div className="box liquid-glass-card mb-4">
                    <h3 className="title is-5 mb-3 liquid-glass-text">Summary</h3>
                    <div className="columns is-mobile">
                      <div className="column">
                        <div className="box has-text-centered">
                          <p className="heading">Page Views</p>
                          <p className="title is-4">{analyticsData.summary.pageViews.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="column">
                        <div className="box has-text-centered">
                          <p className="heading">Unique Visitors</p>
                          <p className="title is-4">{analyticsData.summary.uniqueVisitors.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="column">
                        <div className="box has-text-centered">
                          <p className="heading">Avg Session</p>
                          <p className="title is-4">{analyticsData.summary.avgSessionDuration}</p>
                        </div>
                      </div>
                      <div className="column">
                        <div className="box has-text-centered">
                          <p className="heading">Bounce Rate</p>
                          <p className="title is-4">{analyticsData.summary.bounceRate}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="box liquid-glass-card mb-4">
                    <h3 className="title is-5 mb-3 liquid-glass-text">Page Views Over Time</h3>
                    <svg ref={analyticsChartRef} width="100%" height={isMobile ? 250 : 350} role="img" aria-label="Page views over time chart" />
                    <div className="is-sr-only" role="region" aria-label="Page views data table">
                      <table>
                        <caption>Page Views Over Time</caption>
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Page Views</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.pageViews.map((pv, idx) => (
                            <tr key={idx}>
                              <td>{pv.timestamp.toLocaleTimeString()}</td>
                              <td>{pv.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="columns">
                    <div className="column">
                      <div className="box liquid-glass-card">
                        <h3 className="title is-5 mb-3 liquid-glass-text">Top Pages</h3>
                        <div className="table-container">
                          <table className="table is-fullwidth is-striped">
                            <thead>
                              <tr>
                                <th>Path</th>
                                <th>Views</th>
                                <th>Unique</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analyticsData.topPages.map((page, idx) => (
                                <tr key={idx}>
                                  <td>{page.path}</td>
                                  <td>{page.views}</td>
                                  <td>{page.unique}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                    <div className="column">
                      <div className="box liquid-glass-card">
                        <h3 className="title is-5 mb-3 liquid-glass-text">Performance Metrics</h3>
                        <div className="content">
                          <p>
                            <strong>LCP (P95):</strong> {analyticsData.performanceMetrics.lcp.p95}s
                          </p>
                          <p>
                            <strong>FID (P95):</strong> {analyticsData.performanceMetrics.fid.p95}ms
                          </p>
                          <p>
                            <strong>CLS (P95):</strong> {analyticsData.performanceMetrics.cls.p95}
                          </p>
                          <p>
                            <strong>TTFB (P95):</strong> {analyticsData.performanceMetrics.ttfb.p95}ms
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

