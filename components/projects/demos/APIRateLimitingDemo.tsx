"use client";

import { useEffect, useState, useRef } from "react";
import { Project } from "@/types";

interface RateLimit {
  endpoint: string;
  algorithm: "sliding-window" | "token-bucket" | "fixed-window";
  limit: number;
  current: number;
  blocked: number;
}

export default function APIRateLimitingDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);
  const [rateLimits, setRateLimits] = useState<RateLimit[]>([]);
  const [simulationEnabled, setSimulationEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setRateLimits([
      { endpoint: "/api/users", algorithm: "sliding-window", limit: 1000, current: 0, blocked: 0 },
      { endpoint: "/api/orders", algorithm: "token-bucket", limit: 500, current: 0, blocked: 0 },
      { endpoint: "/api/products", algorithm: "fixed-window", limit: 2000, current: 0, blocked: 0 },
    ]);
  }, []);

  useEffect(() => {
    if (!isMounted || !simulationEnabled) return;
    
    intervalRef.current = setInterval(() => {
      setRateLimits(prev => prev.map(limit => {
        const requests = Math.floor(Math.random() * 50);
        const newCurrent = Math.min(limit.limit, limit.current + requests);
        const blocked = limit.current + requests > limit.limit ? limit.current + requests - limit.limit : 0;
        
        // Reset based on algorithm
        let resetCurrent = newCurrent;
        if (limit.algorithm === "fixed-window" && Math.random() > 0.7) {
          resetCurrent = 0;
        } else if (limit.algorithm === "token-bucket") {
          resetCurrent = Math.max(0, resetCurrent - limit.limit / 60);
        } else if (limit.algorithm === "sliding-window") {
          resetCurrent = Math.max(0, resetCurrent - limit.limit / 60);
        }
        
        return {
          ...limit,
          current: resetCurrent,
          blocked: limit.blocked + blocked,
        };
      }));
    }, 1000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMounted, simulationEnabled]);

  if (!isMounted) return null;

  return (
    <div className="box liquid-glass-card">
      <h3 className="title is-5 mb-4 liquid-glass-text">API Rate Limiting & Throttling</h3>
      <div className="field mb-4">
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
      <div className="columns is-multiline">
        {rateLimits.map((limit, i) => (
          <div key={i} className="column is-one-third-tablet is-half-mobile">
            <div className="box liquid-glass-card">
              <h4 className="title is-6 liquid-glass-text">{limit.endpoint}</h4>
              <div className="content is-small liquid-glass-text">
                <p><strong>Algorithm:</strong> {limit.algorithm}</p>
                <p><strong>Limit:</strong> {limit.limit}/min</p>
                <p><strong>Current:</strong> {limit.current.toFixed(0)}</p>
                <p><strong>Blocked:</strong> {limit.blocked}</p>
                <progress
                  className={`progress ${limit.current / limit.limit > 0.9 ? "is-danger" : limit.current / limit.limit > 0.7 ? "is-warning" : "is-info"} mt-2`}
                  value={limit.current}
                  max={limit.limit}
                  aria-label={`Rate limit: ${limit.current.toFixed(0)}/${limit.limit}`}
                >
                  {(limit.current / limit.limit * 100).toFixed(1)}%
                </progress>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

