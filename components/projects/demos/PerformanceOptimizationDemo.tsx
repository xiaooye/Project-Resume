"use client";

import { useEffect, useState, useRef } from "react";
import { Project } from "@/types";

interface PerformanceMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
}

export default function PerformanceOptimizationDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [simulationEnabled, setSimulationEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setMetrics([
      { name: "LCP", value: 2.1, target: 2.5, unit: "s" },
      { name: "FID", value: 45, target: 100, unit: "ms" },
      { name: "CLS", value: 0.05, target: 0.1, unit: "" },
      { name: "FCP", value: 1.2, target: 1.8, unit: "s" },
      { name: "TTFB", value: 180, target: 800, unit: "ms" },
    ]);
  }, []);

  useEffect(() => {
    if (!isMounted || !simulationEnabled) return;
    
    intervalRef.current = setInterval(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.value + (Math.random() - 0.5) * metric.value * 0.1,
      })));
    }, 2000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMounted, simulationEnabled]);

  if (!isMounted) return null;

  return (
    <div className="box liquid-glass-card">
      <h3 className="title is-5 mb-4 liquid-glass-text">Performance Optimization Platform</h3>
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
        {metrics.map(metric => {
          const isGood = metric.value <= metric.target;
          return (
            <div key={metric.name} className="column is-one-third-tablet is-half-mobile">
              <div className={`box liquid-glass-card ${isGood ? "has-background-success-light" : "has-background-warning-light"}`}>
                <p className="heading liquid-glass-text">{metric.name}</p>
                <p className="title is-4 liquid-glass-text">
                  {metric.value.toFixed(2)}{metric.unit}
                </p>
                <p className="is-size-7 liquid-glass-text">Target: {metric.target}{metric.unit}</p>
                <progress
                  className={`progress ${isGood ? "is-success" : "is-warning"} mt-2`}
                  value={metric.value}
                  max={metric.target * 1.5}
                  aria-label={`${metric.name}: ${metric.value.toFixed(2)}${metric.unit}`}
                >
                  {(metric.value / metric.target * 100).toFixed(0)}%
                </progress>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

