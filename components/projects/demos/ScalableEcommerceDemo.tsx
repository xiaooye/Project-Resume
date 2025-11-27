"use client";

import { useEffect, useState, useRef } from "react";
import { Project } from "@/types";

interface EcommerceMetric {
  name: string;
  value: number;
  unit: string;
}

export default function ScalableEcommerceDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);
  const [metrics, setMetrics] = useState<EcommerceMetric[]>([]);
  const [simulationEnabled, setSimulationEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setMetrics([
      { name: "Page Load Time", value: 1.8, unit: "s" },
      { name: "Concurrent Users", value: 50000, unit: "" },
      { name: "Orders/min", value: 1200, unit: "" },
      { name: "Uptime", value: 99.9, unit: "%" },
    ]);
  }, []);

  useEffect(() => {
    if (!isMounted || !simulationEnabled) return;
    
    intervalRef.current = setInterval(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.value + (Math.random() - 0.5) * metric.value * 0.05,
      })));
    }, 2000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMounted, simulationEnabled]);

  if (!isMounted) return null;

  return (
    <div className="box liquid-glass-card">
      <h3 className="title is-5 mb-4 liquid-glass-text">Scalable E-commerce Platform</h3>
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
        {metrics.map(metric => (
          <div key={metric.name} className="column is-one-quarter-tablet is-half-mobile">
            <div className="box liquid-glass-card has-background-info-light">
              <p className="heading liquid-glass-text">{metric.name}</p>
              <p className="title is-4 liquid-glass-text">
                {metric.value.toFixed(metric.unit === "%" ? 1 : 0)}{metric.unit}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="content mt-4 liquid-glass-text">
        <h4 className="title is-6 mb-3">Key Features</h4>
        <ul>
          <li>Server-side rendering with Next.js for optimal performance</li>
          <li>Edge caching with CDN integration for global reach</li>
          <li>Secure payment processing with Stripe integration</li>
          <li>Comprehensive inventory management system</li>
          <li>Handles Black Friday traffic spikes with auto-scaling</li>
        </ul>
      </div>
    </div>
  );
}

