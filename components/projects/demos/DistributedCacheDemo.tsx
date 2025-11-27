"use client";

import { useEffect, useState, useRef } from "react";
import { Project } from "@/types";

interface CacheNode {
  id: string;
  region: string;
  hitRate: number;
  requests: number;
  latency: number;
  memoryUsage: number;
}

export default function DistributedCacheDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);
  const [nodes, setNodes] = useState<CacheNode[]>([]);
  const [simulationEnabled, setSimulationEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setNodes([
      { id: "node-1", region: "us-east-1", hitRate: 0, requests: 0, latency: 0, memoryUsage: 0 },
      { id: "node-2", region: "us-west-2", hitRate: 0, requests: 0, latency: 0, memoryUsage: 0 },
      { id: "node-3", region: "eu-west-1", hitRate: 0, requests: 0, latency: 0, memoryUsage: 0 },
      { id: "node-4", region: "ap-southeast-1", hitRate: 0, requests: 0, latency: 0, memoryUsage: 0 },
    ]);
  }, []);

  useEffect(() => {
    if (!isMounted || !simulationEnabled) return;
    
    intervalRef.current = setInterval(() => {
      setNodes(prev => prev.map(node => ({
        ...node,
        requests: node.requests + Math.floor(Math.random() * 100),
        hitRate: 95 + Math.random() * 4, // 95-99% hit rate
        latency: 5 + Math.random() * 5, // 5-10ms latency
        memoryUsage: 60 + Math.random() * 20, // 60-80% memory usage
      })));
    }, 2000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMounted, simulationEnabled]);

  if (!isMounted) return null;

  const totalRequests = nodes.reduce((sum, n) => sum + n.requests, 0);
  const avgHitRate = nodes.reduce((sum, n) => sum + n.hitRate, 0) / nodes.length;
  const avgLatency = nodes.reduce((sum, n) => sum + n.latency, 0) / nodes.length;

  return (
    <div className="box liquid-glass-card">
      <h3 className="title is-5 mb-4 liquid-glass-text">Distributed Cache System</h3>
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
            <p className="heading liquid-glass-text">Total Requests</p>
            <p className="title is-4 liquid-glass-text">{totalRequests.toLocaleString()}</p>
          </div>
        </div>
        <div className="column">
          <div className="box liquid-glass-card has-background-success-light">
            <p className="heading liquid-glass-text">Avg Hit Rate</p>
            <p className="title is-4 liquid-glass-text">{avgHitRate.toFixed(1)}%</p>
          </div>
        </div>
        <div className="column">
          <div className="box liquid-glass-card has-background-warning-light">
            <p className="heading liquid-glass-text">Avg Latency</p>
            <p className="title is-4 liquid-glass-text">{avgLatency.toFixed(1)}ms</p>
          </div>
        </div>
      </div>
      <div className="columns is-multiline">
        {nodes.map(node => (
          <div key={node.id} className="column is-one-quarter-tablet is-half-mobile">
            <div className="box liquid-glass-card">
              <h4 className="title is-6 liquid-glass-text">{node.region}</h4>
              <div className="content is-small liquid-glass-text">
                <p><strong>Hit Rate:</strong> {node.hitRate.toFixed(1)}%</p>
                <p><strong>Requests:</strong> {node.requests.toLocaleString()}</p>
                <p><strong>Latency:</strong> {node.latency.toFixed(1)}ms</p>
                <p><strong>Memory:</strong> {node.memoryUsage.toFixed(1)}%</p>
                <progress
                  className="progress is-success mt-2"
                  value={node.hitRate}
                  max="100"
                  aria-label={`Hit rate: ${node.hitRate.toFixed(1)}%`}
                >
                  {node.hitRate.toFixed(1)}%
                </progress>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

