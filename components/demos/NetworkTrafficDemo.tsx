"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import * as d3 from "d3";
import { NetworkTrafficData, SimulationScenario } from "@/types";

const SERVER_COUNT = 50;
const REGIONS = ["us-east", "us-west", "eu-west", "eu-central", "ap-southeast", "ap-northeast"];

// Server state for realistic data generation
type ServerState = {
  baseRequests: number;
  baseLatency: number;
  trend: number;
  volatility: number;
  manualMultiplier?: number; // For manual traffic adjustment
  isDown?: boolean;
};

type LoadBalancingStrategy = "round-robin" | "least-connections" | "weighted-round-robin" | "ip-hash";

export default function NetworkTrafficDemo() {
  const [data, setData] = useState<NetworkTrafficData[]>([]);
  const [dataHistory, setDataHistory] = useState<NetworkTrafficData[][]>([]); // Store last 50 updates
  const [isConnected, setIsConnected] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [lbStrategy, setLbStrategy] = useState<LoadBalancingStrategy>("round-robin");
  const [requestDistribution, setRequestDistribution] = useState<Map<string, number>>(new Map());
  const [currentRequest, setCurrentRequest] = useState<{ id: string; target: string; timestamp: number } | null>(null);
  
  // New control states
  const [updateInterval, setUpdateInterval] = useState(200); // ms
  const [serverStates, setServerStates] = useState<Map<string, ServerState>>(new Map());
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
  const [lbParams, setLbParams] = useState({
    weightedLatencyFactor: 1.0, // For weighted round robin
    ipHashSeed: 0, // For IP hash
  });
  
  const svgRef = useRef<SVGSVGElement>(null);
  const chartRef = useRef<SVGSVGElement>(null);
  const lbVizRef = useRef<SVGSVGElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const requestCounterRef = useRef(0);
  const serverStatesRef = useRef<Map<string, ServerState>>(new Map());
  const sessionIdRef = useRef<string | null>(null);

  // Initialize server states
  const initializeServerStates = useCallback(() => {
    const states = new Map<string, ServerState>();
    for (let i = 0; i < SERVER_COUNT; i++) {
      const region = REGIONS[i % REGIONS.length];
      const serverId = `${region}-server-${Math.floor(i / REGIONS.length) + 1}`;
      states.set(serverId, {
        baseRequests: Math.floor(Math.random() * 5000) + 1000,
        baseLatency: Math.random() * 100 + 20,
        trend: (Math.random() - 0.5) * 0.1,
        volatility: Math.random() * 0.3 + 0.1,
        manualMultiplier: 1.0,
        isDown: false,
      });
    }
    setServerStates(states);
    serverStatesRef.current = states;
  }, []);


  // Initialize only on client side to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    initializeServerStates();
  }, [initializeServerStates]);

  // Simulate load balancing logic
  const simulateLoadBalancing = (servers: NetworkTrafficData[], strategy: LoadBalancingStrategy) => {
    if (servers.length === 0) return;

    // Simulate routing a batch of requests
    const requestsToRoute = Math.floor(Math.random() * 20) + 5; // 5-25 requests per update
    const distribution = new Map<string, number>();
    
    for (let i = 0; i < requestsToRoute; i++) {
      requestCounterRef.current += 1;
      const requestId = `req-${requestCounterRef.current}`;
      let selectedServer: NetworkTrafficData;

      switch (strategy) {
        case "round-robin":
          selectedServer = servers[requestCounterRef.current % servers.length];
          break;
        case "least-connections":
          // Select server with lowest current requests
          selectedServer = servers.reduce((min, server) => 
            server.requests < min.requests ? server : min
          );
          break;
        case "weighted-round-robin":
          // Weight by inverse latency (lower latency = higher weight)
          const totalWeight = servers.reduce((sum, s) => 
            sum + (1 / (s.latency + 1)) * lbParams.weightedLatencyFactor, 0
          );
          let random = Math.random() * totalWeight;
          selectedServer = servers[0];
          for (const server of servers) {
            random -= (1 / (server.latency + 1)) * lbParams.weightedLatencyFactor;
            if (random <= 0) {
              selectedServer = server;
              break;
            }
          }
          break;
        case "ip-hash":
          // Hash-based selection (simulate consistent hashing)
          const hash = (requestCounterRef.current + lbParams.ipHashSeed) % servers.length;
          selectedServer = servers[hash];
          break;
        default:
          selectedServer = servers[0];
      }

      const count = distribution.get(selectedServer.serverId) || 0;
      distribution.set(selectedServer.serverId, count + 1);

      // Show animation for last request
      if (i === requestsToRoute - 1) {
        setCurrentRequest({
          id: requestId,
          target: selectedServer.serverId,
          timestamp: Date.now(),
        });
        setTimeout(() => setCurrentRequest(null), 1000);
      }
    }

    // Update distribution
    setRequestDistribution((prev) => {
      const updated = new Map(prev);
      distribution.forEach((count, serverId) => {
        updated.set(serverId, (updated.get(serverId) || 0) + count);
      });
      // Keep only top 50 servers
      if (updated.size > 50) {
        const sorted = Array.from(updated.entries()).sort((a, b) => b[1] - a[1]);
        return new Map(sorted.slice(0, 50));
      }
      return updated;
    });
  };

  // Update server configuration when settings change
  const updateServerConfig = useCallback(async () => {
    if (!sessionIdRef.current) return;
    
    try {
      const serverMultipliers: Record<string, number> = {};
      const downServers: string[] = [];
      
      serverStates.forEach((state, serverId) => {
        if (state.manualMultiplier !== undefined && state.manualMultiplier !== 1.0) {
          serverMultipliers[serverId] = state.manualMultiplier;
        }
        if (state.isDown) {
          downServers.push(serverId);
        }
      });
      
      await fetch("/api/network-traffic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          config: {
            updateInterval,
            serverMultipliers,
            downServers,
            scenarios: scenarios.map(s => ({
              type: s.type,
              enabled: s.enabled,
              affectedServers: s.affectedServers,
              trafficMultiplier: s.trafficMultiplier,
            })),
          },
        }),
      });
    } catch (error) {
      console.error("Error updating server configuration:", error);
    }
  }, [updateInterval, serverStates, scenarios]);

  // Real-time WebSocket-like connection using Server-Sent Events
  useEffect(() => {
    if (!isMounted) return;

    if (isConnected) {
      // Connect to real-time data stream
      const eventSource = new EventSource("/api/network-traffic");
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const newData = JSON.parse(event.data) as NetworkTrafficData[];
          setData(newData);
          // Maintain history for latency trend chart (last 50 updates)
          setDataHistory((prev) => {
            const updated = [...prev, newData];
            return updated.slice(-50); // Keep only last 50 updates
          });
          
          // Simulate load balancing logic for visualization
          if (isConnected) {
            simulateLoadBalancing(newData, lbStrategy);
          }
        } catch (error) {
          console.error("Error parsing network traffic data:", error);
        }
      };

      // Get session ID from response headers (if available)
      eventSource.onopen = () => {
        // Session ID will be in the URL or we'll generate one
        if (!sessionIdRef.current) {
          sessionIdRef.current = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        // Send initial configuration
        updateServerConfig();
      };

      eventSource.onerror = (error) => {
        console.error("EventSource error:", error);
        eventSource.close();
        setIsConnected(false);
      };

      return () => {
        eventSource.close();
        eventSourceRef.current = null;
      };
    } else {
      // Disconnect
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }
  }, [isConnected, isMounted, updateServerConfig]);

  // Update server config when settings change
  useEffect(() => {
    if (isConnected && sessionIdRef.current) {
      updateServerConfig();
    }
  }, [updateInterval, serverStates, scenarios, isConnected, updateServerConfig]);

  useEffect(() => {
    if (!isMounted || !svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Scale up for 50 servers - use responsive width
    const containerWidth = svgRef.current.clientWidth || 1200;
    const width = Math.max(containerWidth, data.length * 25);
    const height = 500;
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };

    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.serverId))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.requests) || 1000])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Draw bars
    svg
      .selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(d.serverId) || 0)
      .attr("y", (d) => yScale(d.requests))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => height - margin.bottom - yScale(d.requests))
      .attr("fill", (d) => {
        if (d.errorRate > 3) return "#f14668";
        if (d.latency > 150) return "#ffa500";
        return "#48c78e";
      })
      .attr("opacity", 0.8);

    // Add labels
    svg
      .selectAll("text")
      .data(data)
      .enter()
      .append("text")
      .attr("x", (d) => (xScale(d.serverId) || 0) + xScale.bandwidth() / 2)
      .attr("y", (d) => yScale(d.requests) - 5)
      .attr("text-anchor", "middle")
      .attr("fill", "#363636")
      .style("font-size", "12px")
      .text((d) => d.requests);

    // Add axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis);

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis);

    // Add axis labels
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", margin.left - 40)
      .attr("x", -(height / 2))
      .attr("text-anchor", "middle")
      .text("Requests/sec");

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .text("Server ID")
      .style("font-size", "10px");
    
    // Rotate x-axis labels for better readability with many servers
    svg
      .selectAll(".tick text")
      .style("font-size", "9px")
      .attr("transform", "rotate(-45)")
      .attr("text-anchor", "end")
      .attr("dx", "-0.5em")
      .attr("dy", "0.5em");
  }, [data, isMounted]);

  useEffect(() => {
    if (!isMounted || !chartRef.current || !dataHistory.length) return;

    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove();

    const containerWidth = chartRef.current.clientWidth || 1200;
    const width = containerWidth;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };

    // Flatten history data for line chart (show trends over time)
    const timeData: Array<{ time: number; latency: number; serverId: string }> = [];
    dataHistory.forEach((snapshot, timeIndex) => {
      snapshot.forEach((server) => {
        timeData.push({
          time: timeIndex,
          latency: server.latency,
          serverId: server.serverId,
        });
      });
    });

    // Fix: Only show actual data range, not full width
    const maxTime = timeData.length > 0 ? Math.max(...timeData.map(d => d.time)) : 0;
    const minTime = timeData.length > 0 ? Math.min(...timeData.map(d => d.time)) : 0;
    const timeRange = maxTime - minTime || 1;
    
    const xScale = d3
      .scaleLinear()
      .domain([minTime, minTime + Math.max(timeRange, 1)]) // Only show actual data range
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(timeData, (d) => d.latency) || 250])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const line = d3
      .line<{ time: number; latency: number }>()
      .x((d) => xScale(d.time))
      .y((d) => yScale(d.latency))
      .curve(d3.curveMonotoneX);

    const colors = d3.schemeCategory10;
    
    // Group by region and show representative servers from each region
    const regions = Array.from(new Set(data.map(d => d.region || "unknown")));
    const serversPerRegion = Math.ceil(50 / regions.length);
    
    regions.forEach((region, regionIndex) => {
      const regionServers = data.filter(d => (d.region || "unknown") === region).slice(0, serversPerRegion);
      regionServers.forEach((server, serverIndex) => {
        const serverData = timeData.filter((d) => d.serverId === server.serverId);
        if (serverData.length > 0) {
          svg
            .append("path")
            .datum(serverData)
            .attr("fill", "none")
            .attr("stroke", colors[(regionIndex * serversPerRegion + serverIndex) % colors.length] as string)
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.7)
            .attr("d", line as any);
        }
      });
    });

    // Add axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis);

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis);

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", margin.left - 40)
      .attr("x", -(height / 2))
      .attr("text-anchor", "middle")
      .text("Latency (ms)");
  }, [data, isMounted]);

  // Load Balancing Visualization
  useEffect(() => {
    if (!isMounted || !lbVizRef.current || !data.length || requestDistribution.size === 0) return;

    const svg = d3.select(lbVizRef.current);
    svg.selectAll("*").remove();

    const width = lbVizRef.current.clientWidth || 1200;
    const height = 400;
    const margin = { top: 40, right: 40, bottom: 80, left: 80 };

    // Get top servers by request count
    const distributionArray = Array.from(requestDistribution.entries())
      .map(([serverId, count]) => {
        const server = data.find(d => d.serverId === serverId);
        return {
          serverId,
          count,
          server: server || null,
          region: server?.region || "unknown",
        };
      })
      .filter(d => d.server !== null)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Show top 20 servers

    if (distributionArray.length === 0) return;

    const xScale = d3
      .scaleBand()
      .domain(distributionArray.map(d => d.serverId))
      .range([margin.left, width - margin.right])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(distributionArray, d => d.count) || 100])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Draw bars
    svg
      .selectAll("rect")
      .data(distributionArray)
      .enter()
      .append("rect")
      .attr("x", d => xScale(d.serverId) || 0)
      .attr("y", d => yScale(d.count))
      .attr("width", xScale.bandwidth())
      .attr("height", d => height - margin.bottom - yScale(d.count))
      .attr("fill", d => {
        if (!d.server) return "#999";
        if (d.server.errorRate > 3) return "#f14668";
        if (d.server.latency > 150) return "#ffa500";
        return "#48c78e";
      })
      .attr("opacity", 0.8)
      .append("title")
      .text(d => `${d.serverId}: ${d.count} requests\nRegion: ${d.region}\nLatency: ${d.server?.latency.toFixed(2)}ms`);

    // Add labels
    svg
      .selectAll("text.label")
      .data(distributionArray)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d => (xScale(d.serverId) || 0) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.count) - 5)
      .attr("text-anchor", "middle")
      .attr("fill", "#363636")
      .style("font-size", "11px")
      .text(d => d.count);

    // Add axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .selectAll("text")
      .style("font-size", "9px")
      .attr("transform", "rotate(-45)")
      .attr("text-anchor", "end")
      .attr("dx", "-0.5em")
      .attr("dy", "0.5em");

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis);

    // Add axis labels
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", margin.left - 50)
      .attr("x", -(height / 2))
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Request Count");

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 20)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Server ID");

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(`${lbStrategy.replace("-", " ").toUpperCase()} - Request Distribution`);

    // Calculate balance score
    const totalRequests = distributionArray.reduce((sum, d) => sum + d.count, 0);
    const avgRequests = totalRequests / distributionArray.length;
    const variance = distributionArray.reduce((sum, d) => sum + Math.pow(d.count - avgRequests, 2), 0) / distributionArray.length;
    const balanceScore = 100 - Math.min(100, (Math.sqrt(variance) / avgRequests) * 100);

    // Add balance score
    svg
      .append("text")
      .attr("x", width - margin.right)
      .attr("y", margin.top + 20)
      .attr("text-anchor", "end")
      .style("font-size", "14px")
      .style("fill", balanceScore > 80 ? "#48c78e" : balanceScore > 60 ? "#ffa500" : "#f14668")
      .text(`Balance Score: ${balanceScore.toFixed(1)}%`);

  }, [data, requestDistribution, lbStrategy, isMounted]);

  // Calculate comprehensive metrics
  const totalRequests = data.length > 0 ? data.reduce((sum, d) => sum + d.requests, 0) : 0;
  const avgLatency = data.length > 0 ? data.reduce((sum, d) => sum + d.latency, 0) / data.length : 0;
  const totalErrors = data.length > 0 ? data.reduce((sum, d) => sum + d.errorRate, 0) : 0;
  
  // P95 and P99 latency (critical for CTO)
  const latencies = data.map(d => d.latency).sort((a, b) => a - b);
  const p95Latency = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0;
  const p99Latency = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.99)] : 0;
  
  // Anomaly detection
  const anomalies = data.filter(d => 
    d.errorRate > 5 || 
    d.latency > 200 || 
    d.requests > 8000
  );
  
  // Load balancing analysis
  const regionStats = data.reduce((acc, d) => {
    const region = d.region || "unknown";
    if (!acc[region]) {
      acc[region] = { totalRequests: 0, servers: 0, avgLatency: 0, totalLatency: 0 };
    }
    acc[region].totalRequests += d.requests;
    acc[region].servers += 1;
    acc[region].totalLatency += d.latency;
    return acc;
  }, {} as Record<string, { totalRequests: number; servers: number; avgLatency: number; totalLatency: number }>);
  
  Object.keys(regionStats).forEach(region => {
    regionStats[region].avgLatency = regionStats[region].totalLatency / regionStats[region].servers;
  });
  
  // Capacity analysis
  const maxCapacity = 10000; // per server
  const utilization = data.length > 0 
    ? (data.reduce((sum, d) => sum + d.requests, 0) / (data.length * maxCapacity)) * 100 
    : 0;
  const needsScaling = utilization > 80;
  
  // Health check
  const healthyServers = data.filter(d => d.errorRate < 3 && d.latency < 150).length;
  const healthPercentage = data.length > 0 ? (healthyServers / data.length) * 100 : 0;
  
  // SLA Monitoring (CTO cares about this)
  const slaTargets = {
    availability: 99.9, // 99.9% uptime
    latencyP95: 200, // P95 latency < 200ms
    latencyP99: 500, // P99 latency < 500ms
    errorRate: 1, // Error rate < 1%
  };
  
  const slaCompliance = {
    availability: healthPercentage >= slaTargets.availability,
    latencyP95: p95Latency <= slaTargets.latencyP95,
    latencyP99: p99Latency <= slaTargets.latencyP99,
    errorRate: totalErrors <= slaTargets.errorRate,
  };
  
  const slaScore = Object.values(slaCompliance).filter(Boolean).length / Object.keys(slaCompliance).length * 100;
  
  // Traffic prediction (simple linear trend)
  const predictNextMinute = dataHistory.length >= 10 ? (() => {
    const recentTotals = dataHistory.slice(-10).map(snapshot => 
      snapshot.reduce((sum, d) => sum + d.requests, 0)
    );
    const trend = recentTotals[recentTotals.length - 1] - recentTotals[0];
    return Math.max(0, totalRequests + trend);
  })() : totalRequests;
  
  // Performance optimization recommendations
  const optimizations = [];
  if (p99Latency > 200) {
    optimizations.push({
      type: "critical",
      title: "High P99 Latency",
      description: "P99 latency exceeds SLA. Consider database query optimization, caching, or CDN.",
      impact: "High",
    });
  }
  if (utilization > 80) {
    optimizations.push({
      type: "warning",
      title: "High Capacity Utilization",
      description: "Consider horizontal scaling or auto-scaling configuration.",
      impact: "Medium",
    });
  }
  if (anomalies.length > data.length * 0.1) {
    optimizations.push({
      type: "warning",
      title: "Multiple Anomalies Detected",
      description: "Investigate root cause. May indicate infrastructure issues.",
      impact: "High",
    });
  }
  
  // Cost optimization
  const estimatedMonthlyCost = data.length * 50 * 730;
  const costPerRequest = totalRequests > 0 ? (estimatedMonthlyCost / (totalRequests * 2592000)) * 1000 : 0;
  const costOptimizations = [];
  if (utilization < 30) {
    costOptimizations.push({
      title: "Underutilized Resources",
      description: `Current utilization (${utilization.toFixed(1)}%) is low. Consider downsizing to save ~$${Math.floor(estimatedMonthlyCost * 0.3)}/month.`,
    });
  }

  return (
    <div className="container">
      <div className="section">
        <h2 className="title is-2 has-text-centered mb-6">
          Real-time Network Traffic & Load Balancing Monitor
        </h2>
        
        <div className="box mb-6">
          <div className="content">
            <h3 className="title is-4 mb-4">About This Demo</h3>
            <p className="mb-4">
              This demonstration showcases <strong>real-time network traffic monitoring</strong> and 
              <strong> load balancing visualization</strong> at stock market-level scale. The system 
              monitors <strong>50 servers</strong> across 6 global regions, receiving data updates 
              every <strong>200ms</strong> (5 updates per second) via Server-Sent Events (SSE).
            </p>
            <div className="columns">
              <div className="column">
                <h4 className="title is-5 mb-3">Key Features:</h4>
                <ul>
                  <li>Real-time data streaming (SSE/WebSocket-like)</li>
                  <li>50 servers across 6 regions (us-east, us-west, eu-west, eu-central, ap-southeast, ap-northeast)</li>
                  <li>High-frequency updates (200ms intervals)</li>
                  <li>Realistic data patterns with trends and volatility</li>
                  <li>D3.js visualizations for traffic distribution and latency</li>
                  <li>Load balancing insights and anomaly detection</li>
                </ul>
              </div>
              <div className="column">
                <h4 className="title is-5 mb-3">Use Cases:</h4>
                <ul>
                  <li>Production traffic monitoring</li>
                  <li>Load balancer performance analysis</li>
                  <li>Real-time system health dashboards</li>
                  <li>Anomaly detection and alerting</li>
                  <li>Capacity planning and optimization</li>
                </ul>
              </div>
            </div>
            <p className="mt-4">
              <strong>Note:</strong> This demo uses simulated data with realistic patterns (trends, 
              volatility, correlations) to demonstrate real-world scenarios. In production, this would 
              connect to actual monitoring systems like Prometheus, Datadog, or CloudWatch.
            </p>
          </div>
        </div>

        {/* System Architecture Overview */}
        <div className="box mb-6">
          <h3 className="title is-4 mb-4">System Architecture Overview</h3>
          <div className="columns">
            <div className="column">
              <div className="content">
                <h5 className="title is-5">Infrastructure</h5>
                <ul>
                  <li><strong>Total Servers:</strong> {data.length} across {Object.keys(regionStats).length} regions</li>
                  <li><strong>Load Balancer:</strong> Multi-region with {lbStrategy.replace("-", " ")} algorithm</li>
                  <li><strong>Data Stream:</strong> Server-Sent Events (SSE) at 200ms intervals</li>
                  <li><strong>Monitoring:</strong> Real-time metrics with D3.js visualization</li>
                </ul>
              </div>
            </div>
            <div className="column">
              <div className="content">
                <h5 className="title is-5">Architecture Pattern</h5>
                <ul>
                  <li><strong>Pattern:</strong> Distributed microservices with load balancing</li>
                  <li><strong>Scalability:</strong> Horizontal scaling ready</li>
                  <li><strong>Resilience:</strong> Multi-region failover</li>
                  <li><strong>Observability:</strong> Full-stack monitoring and alerting</li>
                </ul>
              </div>
            </div>
            <div className="column">
              <div className="content">
                <h5 className="title is-5">Technology Stack</h5>
                <ul>
                  <li><strong>Frontend:</strong> Next.js 14, React 19, D3.js</li>
                  <li><strong>Backend:</strong> Next.js API Routes, SSE</li>
                  <li><strong>Real-time:</strong> Server-Sent Events</li>
                  <li><strong>Visualization:</strong> D3.js, Framer Motion</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* SLA Monitoring */}
        <div className="box mb-6">
          <h3 className="title is-4 mb-4">SLA Compliance & Service Level Monitoring</h3>
          <div className="columns">
            <div className="column">
              <div className="content">
                <h5 className="title is-5">SLA Targets</h5>
                <table className="table is-narrow">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Target</th>
                      <th>Current</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Availability</td>
                      <td>≥{slaTargets.availability}%</td>
                      <td>{healthPercentage.toFixed(2)}%</td>
                      <td>
                        <span className={`tag ${slaCompliance.availability ? "is-success" : "is-danger"}`}>
                          {slaCompliance.availability ? "✓" : "✗"}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>P95 Latency</td>
                      <td>≤{slaTargets.latencyP95}ms</td>
                      <td>{p95Latency.toFixed(2)}ms</td>
                      <td>
                        <span className={`tag ${slaCompliance.latencyP95 ? "is-success" : "is-danger"}`}>
                          {slaCompliance.latencyP95 ? "✓" : "✗"}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>P99 Latency</td>
                      <td>≤{slaTargets.latencyP99}ms</td>
                      <td>{p99Latency.toFixed(2)}ms</td>
                      <td>
                        <span className={`tag ${slaCompliance.latencyP99 ? "is-success" : "is-danger"}`}>
                          {slaCompliance.latencyP99 ? "✓" : "✗"}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>Error Rate</td>
                      <td>≤{slaTargets.errorRate}%</td>
                      <td>{totalErrors.toFixed(2)}%</td>
                      <td>
                        <span className={`tag ${slaCompliance.errorRate ? "is-success" : "is-danger"}`}>
                          {slaCompliance.errorRate ? "✓" : "✗"}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="column">
              <div className="content">
                <h5 className="title is-5">Overall SLA Score</h5>
                <div className="has-text-centered">
                  <p className={`title is-1 ${slaScore >= 100 ? "has-text-success" : slaScore >= 75 ? "has-text-warning" : "has-text-danger"}`}>
                    {slaScore.toFixed(1)}%
                  </p>
                  <progress 
                    className={`progress ${slaScore >= 100 ? "is-success" : slaScore >= 75 ? "is-warning" : "is-danger"}`}
                    value={slaScore}
                    max={100}
                  >
                    {slaScore.toFixed(1)}%
                  </progress>
                  <p className="mt-3">
                    {slaScore >= 100 ? "✓ All SLA targets met" : 
                     slaScore >= 75 ? "⚠ Some SLA targets at risk" : 
                     "✗ SLA targets not met - Action required"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        {anomalies.length > 0 && (
          <div className="notification is-danger mb-6">
            <button className="delete" onClick={() => {}}></button>
            <strong>⚠️ {anomalies.length} Anomaly{anomalies.length > 1 ? "ies" : ""} Detected</strong>
            <p className="mt-2">
              {anomalies.slice(0, 3).map(a => a.serverId).join(", ")}
              {anomalies.length > 3 && ` and ${anomalies.length - 3} more`}
            </p>
          </div>
        )}

        {/* Key Metrics Dashboard */}
        <div className="box mb-6">
          <div className="level">
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Connection Status</p>
                <p className={`title ${isConnected ? "has-text-success" : "has-text-danger"}`}>
                  {isConnected ? "Connected" : "Disconnected"}
                </p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Total Requests/sec</p>
                <p className="title">{totalRequests.toLocaleString()}</p>
                <p className="heading">Capacity Utilization</p>
                <p className={`subtitle ${needsScaling ? "has-text-danger" : "has-text-success"}`}>
                  {utilization.toFixed(1)}% {needsScaling && "⚠️"}
                </p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Avg Latency</p>
                <p className="title">{avgLatency.toFixed(2)}ms</p>
                <p className="heading">P95: {p95Latency.toFixed(2)}ms | P99: {p99Latency.toFixed(2)}ms</p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">System Health</p>
                <p className={`title ${healthPercentage > 90 ? "has-text-success" : healthPercentage > 70 ? "has-text-warning" : "has-text-danger"}`}>
                  {healthPercentage.toFixed(1)}%
                </p>
                <p className="heading">{healthyServers}/{data.length} Healthy</p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Error Rate</p>
                <p className={`title ${totalErrors < 1 ? "has-text-success" : totalErrors < 3 ? "has-text-warning" : "has-text-danger"}`}>
                  {totalErrors.toFixed(2)}%
                </p>
                <p className="heading">{anomalies.length} Anomalies</p>
              </div>
            </div>
          </div>
        </div>

        {/* Load Balancing Info */}
        {currentRequest && (
          <div className="notification is-info mb-6">
            <strong>Latest Request:</strong> {currentRequest.id} → {currentRequest.target} 
            <span className="ml-2 tag is-light">{(Date.now() - currentRequest.timestamp)}ms ago</span>
          </div>
        )}

        {/* Load Balancing Visualization */}
        <div className="box mb-6">
          <h3 className="title is-4 mb-4">Request Distribution Visualization</h3>
          <p className="subtitle is-6 mb-4">
            Shows how requests are distributed across servers using {lbStrategy.replace("-", " ")} algorithm
          </p>
          <div className="table-container">
            <svg ref={lbVizRef} width="100%" height="400" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid meet"></svg>
          </div>
        </div>

        {/* Load Balancing Analysis */}
        <div className="box mb-6">
          <h3 className="title is-4 mb-4">Load Balancing Analysis by Region</h3>
          <div className="table-container">
            <table className="table is-fullwidth is-striped">
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Servers</th>
                  <th>Total Requests/sec</th>
                  <th>Avg Latency</th>
                  <th>Load Distribution</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(regionStats).map(([region, stats]) => {
                  const loadBalance = stats.totalRequests / stats.servers;
                  const isBalanced = loadBalance > totalRequests / data.length * 0.8 && 
                                   loadBalance < totalRequests / data.length * 1.2;
                  return (
                    <tr key={region}>
                      <td><strong>{region}</strong></td>
                      <td>{stats.servers}</td>
                      <td>{stats.totalRequests.toLocaleString()}</td>
                      <td>{stats.avgLatency.toFixed(2)}ms</td>
                      <td>
                        <progress 
                          className={`progress ${isBalanced ? "is-success" : "is-warning"}`}
                          value={loadBalance}
                          max={totalRequests / data.length * 1.5}
                        >
                          {loadBalance.toFixed(0)}
                        </progress>
                      </td>
                      <td>
                        <span className={`tag ${isBalanced ? "is-success" : "is-warning"}`}>
                          {isBalanced ? "Balanced" : "Unbalanced"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Simulation Control Panel */}
        <div className="box mb-6">
          <h3 className="title is-4 mb-4">Simulation Control Panel</h3>
          
          <div className="columns">
            <div className="column">
              <div className="field">
                <label className="label">Update Interval (ms)</label>
                <div className="control">
                  <input
                    className="input"
                    type="number"
                    min="50"
                    max="5000"
                    step="50"
                    value={updateInterval}
                    onChange={(e) => setUpdateInterval(Math.max(50, parseInt(e.target.value) || 200))}
                    disabled={isConnected}
                  />
                </div>
                <p className="help">Controls how often data updates (50-5000ms)</p>
              </div>
            </div>
            
            <div className="column">
              <div className="field">
                <label className="label">Load Balancing Strategy</label>
                <div className="control">
                  <div className="select is-fullwidth">
                    <select
                      value={lbStrategy}
                      onChange={(e) => {
                        setLbStrategy(e.target.value as LoadBalancingStrategy);
                        setRequestDistribution(new Map());
                      }}
                    >
                      <option value="round-robin">Round Robin</option>
                      <option value="least-connections">Least Connections</option>
                      <option value="weighted-round-robin">Weighted Round Robin</option>
                      <option value="ip-hash">IP Hash</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {lbStrategy === "weighted-round-robin" && (
            <div className="field">
              <label className="label">Latency Weight Factor: {lbParams.weightedLatencyFactor.toFixed(2)}</label>
              <div className="control">
                <input
                  className="slider is-fullwidth"
                  type="range"
                  min="0.1"
                  max="5.0"
                  step="0.1"
                  value={lbParams.weightedLatencyFactor}
                  onChange={(e) => setLbParams({ ...lbParams, weightedLatencyFactor: parseFloat(e.target.value) })}
                />
              </div>
              <p className="help">Higher values prioritize low-latency servers more</p>
            </div>
          )}

          {lbStrategy === "ip-hash" && (
            <div className="field">
              <label className="label">IP Hash Seed: {lbParams.ipHashSeed}</label>
              <div className="control">
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="1000"
                  value={lbParams.ipHashSeed}
                  onChange={(e) => setLbParams({ ...lbParams, ipHashSeed: parseInt(e.target.value) || 0 })}
                />
              </div>
              <p className="help">Seed value for consistent hashing</p>
            </div>
          )}

          <div className="field mt-4">
            <label className="label">Scenario Simulation</label>
            <div className="buttons">
              <button
                className={`button ${scenarios.some(s => s.type === "traffic-spike" && s.enabled) ? "is-warning" : "is-light"}`}
                onClick={() => {
                  const existing = scenarios.find(s => s.type === "traffic-spike");
                  if (existing) {
                    setScenarios(scenarios.map(s => 
                      s.type === "traffic-spike" ? { ...s, enabled: !s.enabled } : s
                    ));
                  } else {
                    setScenarios([...scenarios, {
                      type: "traffic-spike",
                      enabled: true,
                      trafficMultiplier: 3.0,
                    }]);
                  }
                }}
              >
                {scenarios.some(s => s.type === "traffic-spike" && s.enabled) ? "✓ Traffic Spike" : "Traffic Spike"}
              </button>
              
              <button
                className={`button ${scenarios.some(s => s.type === "server-down" && s.enabled) ? "is-danger" : "is-light"}`}
                onClick={() => {
                  const existing = scenarios.find(s => s.type === "server-down");
                  if (existing) {
                    setScenarios(scenarios.map(s => 
                      s.type === "server-down" ? { ...s, enabled: !s.enabled } : s
                    ));
                  } else {
                    // Randomly select 3 servers to go down
                    const randomServers = Array.from({ length: 3 }, () => {
                      const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
                      const serverNum = Math.floor(Math.random() * 10) + 1;
                      return `${region}-server-${serverNum}`;
                    });
                    setScenarios([...scenarios, {
                      type: "server-down",
                      enabled: true,
                      affectedServers: randomServers,
                    }]);
                  }
                }}
              >
                {scenarios.some(s => s.type === "server-down" && s.enabled) ? "✓ Server Down" : "Server Down"}
              </button>
              
              <button
                className={`button ${scenarios.some(s => s.type === "region-outage" && s.enabled) ? "is-danger" : "is-light"}`}
                onClick={() => {
                  const existing = scenarios.find(s => s.type === "region-outage");
                  if (existing) {
                    setScenarios(scenarios.map(s => 
                      s.type === "region-outage" ? { ...s, enabled: !s.enabled } : s
                    ));
                  } else {
                    // Select a random region
                    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
                    const affectedServers = data
                      .filter(d => d.region === region)
                      .map(d => d.serverId);
                    setScenarios([...scenarios, {
                      type: "region-outage",
                      enabled: true,
                      affectedServers,
                    }]);
                  }
                }}
              >
                {scenarios.some(s => s.type === "region-outage" && s.enabled) ? "✓ Region Outage" : "Region Outage"}
              </button>
              
              <button
                className={`button ${scenarios.some(s => s.type === "ddos" && s.enabled) ? "is-danger" : "is-light"}`}
                onClick={() => {
                  const existing = scenarios.find(s => s.type === "ddos");
                  if (existing) {
                    setScenarios(scenarios.map(s => 
                      s.type === "ddos" ? { ...s, enabled: !s.enabled } : s
                    ));
                  } else {
                    setScenarios([...scenarios, {
                      type: "ddos",
                      enabled: true,
                      trafficMultiplier: 10.0,
                    }]);
                  }
                }}
              >
                {scenarios.some(s => s.type === "ddos" && s.enabled) ? "✓ DDoS Attack" : "DDoS Attack"}
              </button>
            </div>
            {scenarios.filter(s => s.enabled).length > 0 && (
              <div className="notification is-info mt-3">
                <strong>Active Scenarios:</strong>
                <ul className="mt-2">
                  {scenarios.filter(s => s.enabled).map((s, idx) => (
                    <li key={idx}>
                      {s.type === "traffic-spike" && `Traffic Spike (${s.trafficMultiplier}x)`}
                      {s.type === "server-down" && `Server Down (${s.affectedServers?.length} servers)`}
                      {s.type === "region-outage" && `Region Outage (${s.affectedServers?.length} servers)`}
                      {s.type === "ddos" && `DDoS Attack (${s.trafficMultiplier}x traffic)`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="field mt-4">
            <label className="label">Manual Server Traffic Adjustment</label>
            <p className="help mb-3">Adjust traffic multiplier for specific servers or regions</p>
            <div className="table-container" style={{ maxHeight: "200px", overflowY: "auto" }}>
              <table className="table is-narrow is-fullwidth">
                <thead>
                  <tr>
                    <th>Server</th>
                    <th>Region</th>
                    <th>Traffic Multiplier</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(serverStates.entries()).slice(0, 10).map(([serverId, state]) => {
                    const region = serverId.split("-")[0] + "-" + serverId.split("-")[1];
                    return (
                      <tr key={serverId}>
                        <td>{serverId}</td>
                        <td><span className="tag is-info">{region}</span></td>
                        <td>
                          <input
                            className="input is-small"
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={state.manualMultiplier || 1.0}
                            onChange={(e) => {
                              const newStates = new Map(serverStates);
                              const current = newStates.get(serverId);
                              if (current) {
                                current.manualMultiplier = parseFloat(e.target.value) || 1.0;
                                newStates.set(serverId, current);
                                setServerStates(newStates);
                                serverStatesRef.current = newStates;
                              }
                            }}
                          />
                        </td>
                        <td>
                          <button
                            className={`button is-small ${state.isDown ? "is-danger" : "is-light"}`}
                            onClick={() => {
                              const newStates = new Map(serverStates);
                              const current = newStates.get(serverId);
                              if (current) {
                                current.isDown = !current.isDown;
                                newStates.set(serverId, current);
                                setServerStates(newStates);
                                serverStatesRef.current = newStates;
                              }
                            }}
                          >
                            {state.isDown ? "Bring Up" : "Take Down"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="help mt-2">Showing first 10 servers. Use multiplier 0-10x. Click "Take Down" to simulate server failure.</p>
          </div>
        </div>

        <div className="buttons is-centered mb-6">
          <button
            className={`button ${isConnected ? "is-danger" : "is-success"} is-large`}
            onClick={() => setIsConnected(!isConnected)}
          >
            {isConnected ? "Disconnect" : "Connect"}
          </button>
        </div>

        <div className="box">
          <h3 className="title is-4 mb-4">Request Distribution Across {data.length} Servers</h3>
          <div className="table-container">
            <svg ref={svgRef} width="100%" height="500" viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid meet"></svg>
          </div>
        </div>

        <div className="box mt-6">
          <h3 className="title is-4 mb-4">Latency Trends Over Time (Last 50 Updates)</h3>
          <div className="table-container">
            <svg ref={chartRef} width="100%" height="400" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid meet"></svg>
          </div>
        </div>

        {/* Performance Optimization Recommendations */}
        {optimizations.length > 0 && (
          <div className="box mt-6">
            <h3 className="title is-4 mb-4">Performance Optimization Recommendations</h3>
            <div className="columns is-multiline">
              {optimizations.map((opt, idx) => (
                <div key={idx} className="column is-half">
                  <div className={`notification ${opt.type === "critical" ? "is-danger" : "is-warning"}`}>
                    <strong>{opt.title}</strong>
                    <p className="mt-2">{opt.description}</p>
                    <p className="mt-2">
                      <span className="tag">Impact: {opt.impact}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Traffic Prediction & Forecasting */}
        <div className="box mt-6">
          <h3 className="title is-4 mb-4">Traffic Prediction & Forecasting</h3>
          <div className="columns">
            <div className="column">
              <div className="content">
                <h5 className="title is-5">Current & Predicted Load</h5>
                <div className="level">
                  <div className="level-item has-text-centered">
                    <div>
                      <p className="heading">Current Requests/sec</p>
                      <p className="title">{totalRequests.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="level-item has-text-centered">
                    <div>
                      <p className="heading">Predicted (1 min)</p>
                      <p className={`title ${predictNextMinute > totalRequests * 1.2 ? "has-text-warning" : "has-text-success"}`}>
                        {predictNextMinute.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="level-item has-text-centered">
                    <div>
                      <p className="heading">Trend</p>
                      <p className={`title ${predictNextMinute > totalRequests ? "has-text-warning" : "has-text-success"}`}>
                        {predictNextMinute > totalRequests ? "↑ Increasing" : "↓ Decreasing"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="column">
              <div className="content">
                <h5 className="title is-5">Capacity Forecast</h5>
                {predictNextMinute > totalRequests * 1.2 && (
                  <div className="notification is-warning">
                    <strong>⚠️ Traffic Spike Predicted</strong>
                    <p className="mt-2">
                      Expected increase of {((predictNextMinute / totalRequests - 1) * 100).toFixed(1)}% in next minute.
                      Consider pre-scaling.
                    </p>
                  </div>
                )}
                {predictNextMinute < totalRequests * 0.8 && (
                  <div className="notification is-info">
                    <strong>ℹ️ Traffic Decreasing</strong>
                    <p className="mt-2">
                      Expected decrease of {((1 - predictNextMinute / totalRequests) * 100).toFixed(1)}%.
                      Monitor for scaling down opportunities.
                    </p>
                  </div>
                )}
                {predictNextMinute >= totalRequests * 0.8 && predictNextMinute <= totalRequests * 1.2 && (
                  <div className="notification is-success">
                    <strong>✓ Stable Traffic</strong>
                    <p className="mt-2">Traffic is expected to remain stable.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cost Optimization */}
        {costOptimizations.length > 0 && (
          <div className="box mt-6">
            <h3 className="title is-4 mb-4">Cost Optimization Opportunities</h3>
            <div className="content">
              {costOptimizations.map((opt, idx) => (
                <div key={idx} className="notification is-info">
                  <strong>💰 {opt.title}</strong>
                  <p className="mt-2">{opt.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Capacity Planning & Recommendations */}
        <div className="box mt-6">
          <h3 className="title is-4 mb-4">Capacity Planning & Recommendations</h3>
          <div className="columns">
            <div className="column">
              <div className="content">
                <h5 className="title is-5">Current State</h5>
                <ul>
                  <li>Total Capacity: {(data.length * maxCapacity).toLocaleString()} req/sec</li>
                  <li>Current Load: {totalRequests.toLocaleString()} req/sec</li>
                  <li>Utilization: <strong className={needsScaling ? "has-text-danger" : "has-text-success"}>{utilization.toFixed(1)}%</strong></li>
                  <li>Headroom: {((data.length * maxCapacity) - totalRequests).toLocaleString()} req/sec</li>
                </ul>
              </div>
            </div>
            <div className="column">
              <div className="content">
                <h5 className="title is-5">Recommendations</h5>
                {needsScaling ? (
                  <div className="notification is-warning">
                    <strong>⚠️ Scaling Recommended</strong>
                    <p className="mt-2">
                      Current utilization ({utilization.toFixed(1)}%) exceeds 80% threshold.
                      Consider adding {Math.ceil((totalRequests / maxCapacity) - data.length)} more servers.
                    </p>
                  </div>
                ) : (
                  <div className="notification is-success">
                    <strong>✓ Capacity Healthy</strong>
                    <p className="mt-2">
                      Current utilization is within acceptable range. No immediate scaling needed.
                    </p>
                  </div>
                )}
                {p99Latency > 200 && (
                  <div className="notification is-danger mt-3">
                    <strong>⚠️ High P99 Latency</strong>
                    <p className="mt-2">
                      P99 latency ({p99Latency.toFixed(2)}ms) exceeds SLA threshold (200ms).
                      Investigate performance bottlenecks.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="column">
              <div className="content">
                <h5 className="title is-5">Cost Analysis</h5>
                <ul>
                  <li>Estimated Cost: ${(data.length * 50).toFixed(2)}/hour</li>
                  <li>Monthly Projection: ${(data.length * 50 * 730).toLocaleString()}</li>
                  <li>Cost per Request: ${((data.length * 50) / totalRequests * 1000).toFixed(4)}/1K</li>
                  {needsScaling && (
                    <li className="has-text-warning">
                      Scaling Cost: +${(Math.ceil((totalRequests / maxCapacity) - data.length) * 50).toFixed(2)}/hour
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="box mt-6">
          <h3 className="title is-4 mb-4">Server Details ({data.length} servers)</h3>
          <div className="table-container">
            <table className="table is-fullwidth is-striped">
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Server ID</th>
                  <th>Requests/sec</th>
                  <th>Latency (ms)</th>
                  <th>Throughput (MB/s)</th>
                  <th>Error Rate (%)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((server) => (
                  <motion.tr
                    key={server.serverId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <td>
                      <span className="tag is-info">{server.region || "unknown"}</span>
                    </td>
                    <td>{server.serverId}</td>
                    <td>{server.requests.toLocaleString()}</td>
                    <td>{server.latency.toFixed(2)}</td>
                    <td>{server.throughput.toFixed(2)}</td>
                    <td>{server.errorRate.toFixed(2)}</td>
                    <td>
                      <span
                        className={`tag ${
                          server.errorRate > 3
                            ? "is-danger"
                            : server.latency > 150
                            ? "is-warning"
                            : "is-success"
                        }`}
                      >
                        {server.errorRate > 3
                          ? "Critical"
                          : server.latency > 150
                          ? "Warning"
                          : "Healthy"}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

