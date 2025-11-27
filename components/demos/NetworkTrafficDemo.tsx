"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import * as d3 from "d3";
import { NetworkTrafficData } from "@/types";

function generateMockData(): NetworkTrafficData[] {
  // Generate initial data for 50 servers (matches API)
  return Array.from({ length: 50 }, (_, i) => ({
    timestamp: Date.now(),
    serverId: `server-${i + 1}`,
    requests: Math.floor(Math.random() * 1000) + 100,
    latency: Math.random() * 200 + 50,
    throughput: Math.random() * 100 + 10,
    errorRate: Math.random() * 5,
  }));
}

type LoadBalancingStrategy = "round-robin" | "least-connections" | "weighted-round-robin" | "ip-hash";

export default function NetworkTrafficDemo() {
  const [data, setData] = useState<NetworkTrafficData[]>([]);
  const [dataHistory, setDataHistory] = useState<NetworkTrafficData[][]>([]); // Store last 50 updates
  const [isConnected, setIsConnected] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [lbStrategy, setLbStrategy] = useState<LoadBalancingStrategy>("round-robin");
  const [requestDistribution, setRequestDistribution] = useState<Map<string, number>>(new Map());
  const [currentRequest, setCurrentRequest] = useState<{ id: string; target: string; timestamp: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const chartRef = useRef<SVGSVGElement>(null);
  const lbVizRef = useRef<SVGSVGElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const requestCounterRef = useRef(0);

  // Initialize only on client side to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    // Set initial empty data
    setData(generateMockData());
  }, []);

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
          const totalWeight = servers.reduce((sum, s) => sum + (1 / (s.latency + 1)), 0);
          let random = Math.random() * totalWeight;
          selectedServer = servers[0];
          for (const server of servers) {
            random -= (1 / (server.latency + 1));
            if (random <= 0) {
              selectedServer = server;
              break;
            }
          }
          break;
        case "ip-hash":
          // Hash-based selection (simulate consistent hashing)
          const hash = requestCounterRef.current % servers.length;
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
  }, [isConnected, isMounted]);

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

    const xScale = d3
      .scaleLinear()
      .domain([0, timeData.length - 1])
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

        {/* Load Balancing Strategy Selection */}
        <div className="box mb-6">
          <h3 className="title is-4 mb-4">Load Balancing Strategy</h3>
          <div className="field is-grouped">
            <div className="control">
              <div className="select is-medium">
                <select
                  value={lbStrategy}
                  onChange={(e) => {
                    setLbStrategy(e.target.value as LoadBalancingStrategy);
                    setRequestDistribution(new Map()); // Reset distribution
                  }}
                >
                  <option value="round-robin">Round Robin</option>
                  <option value="least-connections">Least Connections</option>
                  <option value="weighted-round-robin">Weighted Round Robin</option>
                  <option value="ip-hash">IP Hash (Consistent Hashing)</option>
                </select>
              </div>
            </div>
            <div className="control">
              <p className="help">
                {lbStrategy === "round-robin" && "Distributes requests sequentially across all servers"}
                {lbStrategy === "least-connections" && "Routes to server with fewest active connections"}
                {lbStrategy === "weighted-round-robin" && "Routes based on server performance (lower latency = higher weight)"}
                {lbStrategy === "ip-hash" && "Uses hash of request to ensure consistent routing"}
              </p>
            </div>
          </div>
          {currentRequest && (
            <div className="notification is-info mt-4">
              <strong>Latest Request:</strong> {currentRequest.id} → {currentRequest.target} 
              <span className="ml-2 tag is-light">{(Date.now() - currentRequest.timestamp)}ms ago</span>
            </div>
          )}
        </div>

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

