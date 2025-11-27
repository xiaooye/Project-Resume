"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Project } from "@/types";

interface APIRequest {
  id: string;
  endpoint: string;
  method: string;
  status: number;
  latency: number;
  rateLimited: boolean;
  authenticated: boolean;
  timestamp: number;
}

interface RateLimitRule {
  endpoint: string;
  algorithm: "sliding-window" | "token-bucket" | "fixed-window";
  limit: number;
  window: number;
  current: number;
}

export default function HighPerformanceAPIGatewayDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "rate-limiting" | "routing" | "analytics">("overview");
  
  const [requests, setRequests] = useState<APIRequest[]>([]);
  const [rateLimitRules, setRateLimitRules] = useState<RateLimitRule[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [totalBlocked, setTotalBlocked] = useState(0);
  const [avgLatency, setAvgLatency] = useState(0);
  const [simulationEnabled, setSimulationEnabled] = useState(true);
  const [requestRate, setRequestRate] = useState(1000);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const initializeRateLimits = useCallback(() => {
    const endpoints = ["/api/users", "/api/orders", "/api/products", "/api/payments"];
    const algorithms: RateLimitRule["algorithm"][] = ["sliding-window", "token-bucket", "fixed-window"];
    
    const rules: RateLimitRule[] = endpoints.map((endpoint, i) => ({
      endpoint,
      algorithm: algorithms[i % algorithms.length],
      limit: 1000 + Math.random() * 5000,
      window: 60,
      current: 0,
    }));
    
    setRateLimitRules(rules);
  }, []);

  const generateRequest = useCallback(() => {
    const endpoints = ["/api/users", "/api/orders", "/api/products", "/api/payments"];
    const methods = ["GET", "POST", "PUT", "DELETE"];
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const method = methods[Math.floor(Math.random() * methods.length)];
    
    const rule = rateLimitRules.find(r => r.endpoint === endpoint);
    const isRateLimited = rule && rule.current >= rule.limit;
    
    const latency = isRateLimited ? 0 : Math.random() * 50 + 10;
    const status = isRateLimited ? 429 : Math.random() > 0.05 ? 200 : 500;
    
    const request: APIRequest = {
      id: `req-${Date.now()}-${Math.random()}`,
      endpoint,
      method,
      status,
      latency,
      rateLimited: isRateLimited || false,
      authenticated: Math.random() > 0.1,
      timestamp: Date.now(),
    };
    
    setRequests(prev => [...prev.slice(-100), request]);
    
    if (rule) {
      setRateLimitRules(prev => prev.map(r => 
        r.endpoint === endpoint ? { ...r, current: Math.min(r.limit, r.current + 1) } : r
      ));
    }
    
    setTotalRequests(prev => prev + 1);
    if (isRateLimited) setTotalBlocked(prev => prev + 1);
    
    const latencies = requests.map(r => r.latency).filter(l => l > 0);
    if (latencies.length > 0) {
      setAvgLatency(latencies.reduce((a, b) => a + b, 0) / latencies.length);
    }
  }, [rateLimitRules, requests]);

  const updateRateLimits = useCallback(() => {
    setRateLimitRules(prev => prev.map(rule => ({
      ...rule,
      current: Math.max(0, rule.current - rule.limit / rule.window),
    })));
  }, []);

  useEffect(() => {
    setIsMounted(true);
    initializeRateLimits();
    
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    mediaQuery.addEventListener("change", (e) => setPrefersReducedMotion(e.matches));
    
    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, [initializeRateLimits]);

  useEffect(() => {
    if (!isMounted || !simulationEnabled) return;
    
    const requestsPerSecond = requestRate / 60;
    const interval = 1000 / requestsPerSecond;
    
    intervalRef.current = setInterval(() => {
      generateRequest();
      updateRateLimits();
    }, Math.max(10, interval));
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMounted, simulationEnabled, requestRate, generateRequest, updateRateLimits]);

  if (!isMounted) return null;

  return (
    <div className="box liquid-glass-card">
      <div className="tabs is-boxed mb-4">
        <ul>
          <li className={activeTab === "overview" ? "is-active" : ""}>
            <a onClick={() => setActiveTab("overview")} role="button" tabIndex={0} aria-label="Overview">
              Overview
            </a>
          </li>
          <li className={activeTab === "rate-limiting" ? "is-active" : ""}>
            <a onClick={() => setActiveTab("rate-limiting")} role="button" tabIndex={0} aria-label="Rate limiting">
              Rate Limiting
            </a>
          </li>
          <li className={activeTab === "routing" ? "is-active" : ""}>
            <a onClick={() => setActiveTab("routing")} role="button" tabIndex={0} aria-label="Request routing">
              Routing
            </a>
          </li>
          <li className={activeTab === "analytics" ? "is-active" : ""}>
            <a onClick={() => setActiveTab("analytics")} role="button" tabIndex={0} aria-label="Analytics">
              Analytics
            </a>
          </li>
        </ul>
      </div>

      <div className="box liquid-glass-card mb-4">
        <div className="columns is-multiline">
          <div className="column is-one-third-tablet is-half-mobile">
            <div className="field">
              <label className="label liquid-glass-text">Request Rate (req/min)</label>
              <div className="control">
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="10000"
                  step="100"
                  value={requestRate}
                  onChange={(e) => setRequestRate(Number(e.target.value))}
                  aria-label="Request rate per minute"
                />
              </div>
            </div>
          </div>
          <div className="column is-one-third-tablet is-half-mobile">
            <div className="field">
              <label className="checkbox liquid-glass-text">
                <input
                  type="checkbox"
                  checked={simulationEnabled}
                  onChange={(e) => setSimulationEnabled(e.target.checked)}
                  aria-label="Enable simulation"
                />
                {" "}Enable Simulation
              </label>
            </div>
          </div>
        </div>
      </div>

      {activeTab === "overview" && (
        <div>
          <h3 className="title is-5 mb-4 liquid-glass-text">Gateway Overview</h3>
          <div className="columns">
            <div className="column">
              <div className="box liquid-glass-card has-background-info-light">
                <p className="heading liquid-glass-text">Total Requests</p>
                <p className="title is-4 liquid-glass-text">{(totalRequests / 1000).toFixed(1)}K</p>
              </div>
            </div>
            <div className="column">
              <div className="box liquid-glass-card has-background-danger-light">
                <p className="heading liquid-glass-text">Blocked Requests</p>
                <p className="title is-4 liquid-glass-text">{totalBlocked}</p>
              </div>
            </div>
            <div className="column">
              <div className="box liquid-glass-card has-background-success-light">
                <p className="heading liquid-glass-text">Avg Latency</p>
                <p className="title is-4 liquid-glass-text">{avgLatency.toFixed(1)}ms</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "rate-limiting" && (
        <div>
          <h3 className="title is-5 mb-4 liquid-glass-text">Rate Limiting Rules</h3>
          <div className="columns is-multiline">
            {rateLimitRules.map(rule => (
              <div key={rule.endpoint} className="column is-one-half-tablet is-full-mobile">
                <div className="box liquid-glass-card">
                  <h4 className="title is-6 liquid-glass-text">{rule.endpoint}</h4>
                  <div className="content is-small liquid-glass-text">
                    <p><strong>Algorithm:</strong> {rule.algorithm}</p>
                    <p><strong>Limit:</strong> {rule.limit.toFixed(0)}/min</p>
                    <p><strong>Current:</strong> {rule.current.toFixed(0)}</p>
                    <progress
                      className="progress is-info"
                      value={rule.current}
                      max={rule.limit}
                      aria-label={`Rate limit: ${rule.current.toFixed(0)}/${rule.limit.toFixed(0)}`}
                    >
                      {(rule.current / rule.limit * 100).toFixed(1)}%
                    </progress>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "routing" && (
        <div>
          <h3 className="title is-5 mb-4 liquid-glass-text">Request Routing</h3>
          <div className="table-container">
            <table className="table is-fullwidth">
              <thead>
                <tr>
                  <th className="liquid-glass-text">Endpoint</th>
                  <th className="liquid-glass-text">Method</th>
                  <th className="liquid-glass-text">Status</th>
                  <th className="liquid-glass-text">Latency</th>
                  <th className="liquid-glass-text">Time</th>
                </tr>
              </thead>
              <tbody>
                {requests.slice(-20).reverse().map(req => (
                  <tr key={req.id}>
                    <td className="liquid-glass-text">{req.endpoint}</td>
                    <td className="liquid-glass-text">{req.method}</td>
                    <td>
                      <span className={`tag ${
                        req.status === 200 ? "is-success" :
                        req.status === 429 ? "is-warning" : "is-danger"
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="liquid-glass-text">{req.latency.toFixed(1)}ms</td>
                    <td className="liquid-glass-text">
                      {new Date(req.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div>
          <h3 className="title is-5 mb-4 liquid-glass-text">Analytics</h3>
          <div className="box liquid-glass-card">
            <h4 className="title is-6 liquid-glass-text">Request Statistics</h4>
            <div className="content liquid-glass-text">
              <p><strong>Total Requests:</strong> {totalRequests.toLocaleString()}</p>
              <p><strong>Blocked Requests:</strong> {totalBlocked.toLocaleString()} ({(totalRequests > 0 ? totalBlocked / totalRequests * 100 : 0).toFixed(2)}%)</p>
              <p><strong>Average Latency:</strong> {avgLatency.toFixed(1)}ms</p>
              <p><strong>Success Rate:</strong> {requests.filter(r => r.status === 200).length / Math.max(1, requests.length) * 100}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

