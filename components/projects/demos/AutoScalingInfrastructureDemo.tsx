"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Project } from "@/types";

interface ScalingMetric {
  serviceId: string;
  serviceName: string;
  currentReplicas: number;
  targetReplicas: number;
  cpuUsage: number;
  memoryUsage: number;
  requestRate: number;
  predictedLoad: number;
}

export default function AutoScalingInfrastructureDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);
  const [metrics, setMetrics] = useState<ScalingMetric[]>([]);
  const [simulationEnabled, setSimulationEnabled] = useState(true);
  const [predictionEnabled, setPredictionEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const initializeMetrics = useCallback(() => {
    const services = [
      { id: "api-service", name: "API Service" },
      { id: "worker-service", name: "Worker Service" },
      { id: "cache-service", name: "Cache Service" },
      { id: "db-service", name: "Database Service" },
    ];
    
    const newMetrics: ScalingMetric[] = services.map(service => ({
      serviceId: service.id,
      serviceName: service.name,
      currentReplicas: Math.floor(Math.random() * 5) + 2,
      targetReplicas: Math.floor(Math.random() * 5) + 2,
      cpuUsage: Math.random() * 80 + 10,
      memoryUsage: Math.random() * 70 + 20,
      requestRate: Math.random() * 1000 + 500,
      predictedLoad: Math.random() * 1000 + 500,
    }));
    
    setMetrics(newMetrics);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    initializeMetrics();
  }, [initializeMetrics]);

  useEffect(() => {
    if (!isMounted || !simulationEnabled) return;
    
    intervalRef.current = setInterval(() => {
      setMetrics(prev => prev.map(metric => {
        const cpuVariation = (Math.random() - 0.5) * 10;
        const newCpu = Math.max(0, Math.min(100, metric.cpuUsage + cpuVariation));
        const newMemory = Math.max(0, Math.min(100, metric.memoryUsage + cpuVariation * 0.8));
        const newRequestRate = Math.max(0, metric.requestRate + (Math.random() - 0.5) * 100);
        
        // Predictive scaling
        let newTargetReplicas = metric.targetReplicas;
        if (predictionEnabled) {
          const predictedLoad = newRequestRate * (1 + Math.random() * 0.2);
          newTargetReplicas = Math.max(2, Math.min(10, Math.ceil(predictedLoad / 500)));
        } else {
          // Reactive scaling based on current CPU
          if (newCpu > 70) {
            newTargetReplicas = Math.min(10, metric.targetReplicas + 1);
          } else if (newCpu < 30 && metric.targetReplicas > 2) {
            newTargetReplicas = Math.max(2, metric.targetReplicas - 1);
          }
        }
        
        // Gradually adjust current replicas
        let newCurrentReplicas = metric.currentReplicas;
        if (newTargetReplicas > metric.currentReplicas) {
          newCurrentReplicas = Math.min(newTargetReplicas, metric.currentReplicas + 1);
        } else if (newTargetReplicas < metric.currentReplicas) {
          newCurrentReplicas = Math.max(newTargetReplicas, metric.currentReplicas - 1);
        }
        
        return {
          ...metric,
          currentReplicas: newCurrentReplicas,
          targetReplicas: newTargetReplicas,
          cpuUsage: newCpu,
          memoryUsage: newMemory,
          requestRate: newRequestRate,
          predictedLoad: predictionEnabled ? newRequestRate * (1 + Math.random() * 0.2) : metric.predictedLoad,
        };
      }));
    }, 2000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMounted, simulationEnabled, predictionEnabled]);

  if (!isMounted) return null;

  return (
    <div className="box liquid-glass-card">
      <h3 className="title is-5 mb-4 liquid-glass-text">Auto-Scaling Infrastructure</h3>
      <div className="box liquid-glass-card mb-4">
        <div className="columns is-multiline">
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
          <div className="column is-one-third-tablet is-half-mobile">
            <div className="field">
              <label className="checkbox liquid-glass-text">
                <input
                  type="checkbox"
                  checked={predictionEnabled}
                  onChange={(e) => setPredictionEnabled(e.target.checked)}
                  aria-label="Enable predictive scaling"
                />
                {" "}Predictive Scaling
              </label>
            </div>
          </div>
        </div>
      </div>
      <div className="columns is-multiline">
        {metrics.map(metric => (
          <div key={metric.serviceId} className="column is-one-half-tablet is-full-mobile">
            <div className="box liquid-glass-card">
              <h4 className="title is-6 liquid-glass-text">{metric.serviceName}</h4>
              <div className="content is-small liquid-glass-text">
                <p><strong>Current Replicas:</strong> {metric.currentReplicas}</p>
                <p><strong>Target Replicas:</strong> {metric.targetReplicas}</p>
                <p><strong>CPU Usage:</strong> {metric.cpuUsage.toFixed(1)}%</p>
                <p><strong>Memory Usage:</strong> {metric.memoryUsage.toFixed(1)}%</p>
                <p><strong>Request Rate:</strong> {metric.requestRate.toFixed(0)}/sec</p>
                {predictionEnabled && (
                  <p><strong>Predicted Load:</strong> {metric.predictedLoad.toFixed(0)}/sec</p>
                )}
                <progress
                  className="progress is-info mt-2"
                  value={metric.cpuUsage}
                  max="100"
                  aria-label={`CPU usage: ${metric.cpuUsage.toFixed(1)}%`}
                >
                  {metric.cpuUsage.toFixed(1)}%
                </progress>
                {metric.currentReplicas !== metric.targetReplicas && (
                  <p className="mt-2">
                    <span className="tag is-warning">
                      Scaling {metric.targetReplicas > metric.currentReplicas ? "up" : "down"}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

