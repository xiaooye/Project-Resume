"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Project } from "@/types";

interface CloudCost {
  provider: "aws" | "azure" | "gcp";
  service: string;
  cost: number;
  usage: number;
  optimization: number;
}

export default function CostOptimizationAnalyticsDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);
  const [costs, setCosts] = useState<CloudCost[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [simulationEnabled, setSimulationEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const initializeCosts = useCallback(() => {
    const services = [
      { provider: "aws" as const, service: "EC2", cost: 5000, usage: 1000 },
      { provider: "aws" as const, service: "S3", cost: 2000, usage: 500 },
      { provider: "azure" as const, service: "Virtual Machines", cost: 3000, usage: 800 },
      { provider: "azure" as const, service: "Blob Storage", cost: 1500, usage: 400 },
      { provider: "gcp" as const, service: "Compute Engine", cost: 2500, usage: 600 },
    ];
    
    const newCosts: CloudCost[] = services.map(s => ({
      ...s,
      optimization: s.cost * 0.3, // 30% potential savings
    }));
    
    setCosts(newCosts);
    setTotalCost(newCosts.reduce((sum, c) => sum + c.cost, 0));
    setTotalSavings(newCosts.reduce((sum, c) => sum + c.optimization, 0));
  }, []);

  useEffect(() => {
    setIsMounted(true);
    initializeCosts();
  }, [initializeCosts]);

  if (!isMounted) return null;

  return (
    <div className="box liquid-glass-card">
      <h3 className="title is-5 mb-4 liquid-glass-text">Multi-Cloud Cost Optimization</h3>
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
      <div className="columns mb-4">
        <div className="column">
          <div className="box liquid-glass-card has-background-warning-light">
            <p className="heading liquid-glass-text">Total Cost</p>
            <p className="title is-4 liquid-glass-text">${totalCost.toLocaleString()}/mo</p>
          </div>
        </div>
        <div className="column">
          <div className="box liquid-glass-card has-background-success-light">
            <p className="heading liquid-glass-text">Potential Savings</p>
            <p className="title is-4 liquid-glass-text">${totalSavings.toLocaleString()}/mo</p>
          </div>
        </div>
        <div className="column">
          <div className="box liquid-glass-card has-background-info-light">
            <p className="heading liquid-glass-text">Savings %</p>
            <p className="title is-4 liquid-glass-text">
              {totalCost > 0 ? (totalSavings / totalCost * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </div>
      <div className="table-container">
        <table className="table is-fullwidth">
          <thead>
            <tr>
              <th className="liquid-glass-text">Provider</th>
              <th className="liquid-glass-text">Service</th>
              <th className="liquid-glass-text">Current Cost</th>
              <th className="liquid-glass-text">Optimization</th>
              <th className="liquid-glass-text">Savings</th>
            </tr>
          </thead>
          <tbody>
            {costs.map((cost, i) => (
              <tr key={i}>
                <td className="liquid-glass-text">{cost.provider.toUpperCase()}</td>
                <td className="liquid-glass-text">{cost.service}</td>
                <td className="liquid-glass-text">${cost.cost.toLocaleString()}</td>
                <td className="liquid-glass-text">
                  <progress className="progress is-info" value={cost.optimization} max={cost.cost}>
                    {(cost.optimization / cost.cost * 100).toFixed(1)}%
                  </progress>
                </td>
                <td className="liquid-glass-text">${cost.optimization.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

