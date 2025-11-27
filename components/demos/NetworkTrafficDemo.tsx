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

export default function NetworkTrafficDemo() {
  const [data, setData] = useState<NetworkTrafficData[]>([]);
  const [dataHistory, setDataHistory] = useState<NetworkTrafficData[][]>([]); // Store last 50 updates
  const [isConnected, setIsConnected] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const chartRef = useRef<SVGSVGElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Initialize only on client side to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    // Set initial empty data
    setData(generateMockData());
  }, []);

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

  const totalRequests = data.length > 0 ? data.reduce((sum, d) => sum + d.requests, 0) : 0;
  const avgLatency = data.length > 0 ? data.reduce((sum, d) => sum + d.latency, 0) / data.length : 0;
  const totalErrors = data.length > 0 ? data.reduce((sum, d) => sum + d.errorRate, 0) : 0;

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

        <div className="box mb-6">
          <div className="level">
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Status</p>
                <p className={`title ${isConnected ? "has-text-success" : "has-text-danger"}`}>
                  {isConnected ? "Connected" : "Disconnected"}
                </p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Total Requests/sec</p>
                <p className="title">{totalRequests.toLocaleString()}</p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Avg Latency</p>
                <p className="title">{avgLatency.toFixed(2)}ms</p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Error Rate</p>
                <p className="title">{totalErrors.toFixed(2)}%</p>
              </div>
            </div>
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

