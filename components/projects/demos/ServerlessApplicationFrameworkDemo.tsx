"use client";

import { useEffect, useState, useRef } from "react";
import { Project } from "@/types";

interface FunctionMetric {
  name: string;
  provider: "aws" | "azure";
  invocations: number;
  duration: number;
  cost: number;
  coldStarts: number;
}

export default function ServerlessApplicationFrameworkDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);
  const [functions, setFunctions] = useState<FunctionMetric[]>([]);
  const [simulationEnabled, setSimulationEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setFunctions([
      { name: "API Handler", provider: "aws", invocations: 0, duration: 120, cost: 0, coldStarts: 0 },
      { name: "Data Processor", provider: "aws", invocations: 0, duration: 500, cost: 0, coldStarts: 0 },
      { name: "Image Resizer", provider: "azure", invocations: 0, duration: 300, cost: 0, coldStarts: 0 },
      { name: "Email Sender", provider: "azure", invocations: 0, duration: 200, cost: 0, coldStarts: 0 },
    ]);
  }, []);

  useEffect(() => {
    if (!isMounted || !simulationEnabled) return;
    
    intervalRef.current = setInterval(() => {
      setFunctions(prev => prev.map(func => {
        const newInvocations = func.invocations + Math.floor(Math.random() * 10);
        const newColdStarts = func.coldStarts + (Math.random() > 0.9 ? 1 : 0);
        const newCost = newInvocations * 0.000001 * func.duration;
        
        return {
          ...func,
          invocations: newInvocations,
          coldStarts: newColdStarts,
          cost: newCost,
        };
      }));
    }, 2000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMounted, simulationEnabled]);

  if (!isMounted) return null;

  const totalCost = functions.reduce((sum, f) => sum + f.cost, 0);
  const totalInvocations = functions.reduce((sum, f) => sum + f.invocations, 0);

  return (
    <div className="box liquid-glass-card">
      <h3 className="title is-5 mb-4 liquid-glass-text">Serverless Application Framework</h3>
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
          <div className="box liquid-glass-card has-background-info-light">
            <p className="heading liquid-glass-text">Total Invocations</p>
            <p className="title is-4 liquid-glass-text">{totalInvocations.toLocaleString()}</p>
          </div>
        </div>
        <div className="column">
          <div className="box liquid-glass-card has-background-success-light">
            <p className="heading liquid-glass-text">Total Cost</p>
            <p className="title is-4 liquid-glass-text">${totalCost.toFixed(4)}</p>
          </div>
        </div>
      </div>
      <div className="table-container">
        <table className="table is-fullwidth">
          <thead>
            <tr>
              <th className="liquid-glass-text">Function</th>
              <th className="liquid-glass-text">Provider</th>
              <th className="liquid-glass-text">Invocations</th>
              <th className="liquid-glass-text">Duration (ms)</th>
              <th className="liquid-glass-text">Cold Starts</th>
              <th className="liquid-glass-text">Cost</th>
            </tr>
          </thead>
          <tbody>
            {functions.map((func, i) => (
              <tr key={i}>
                <td className="liquid-glass-text">{func.name}</td>
                <td className="liquid-glass-text">{func.provider.toUpperCase()}</td>
                <td className="liquid-glass-text">{func.invocations.toLocaleString()}</td>
                <td className="liquid-glass-text">{func.duration}</td>
                <td className="liquid-glass-text">{func.coldStarts}</td>
                <td className="liquid-glass-text">${func.cost.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

