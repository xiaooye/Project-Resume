"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import * as d3 from "d3";
import { NetworkTrafficData } from "@/types";

const SERVER_COUNT = 5;
const UPDATE_INTERVAL = 1000; // 1 second

function generateMockData(): NetworkTrafficData[] {
  return Array.from({ length: SERVER_COUNT }, (_, i) => ({
    timestamp: Date.now(),
    serverId: `server-${i + 1}`,
    requests: Math.floor(Math.random() * 1000) + 100,
    latency: Math.random() * 200 + 50,
    throughput: Math.random() * 100 + 10,
    errorRate: Math.random() * 5,
  }));
}

export default function NetworkTrafficDemo() {
  const [data, setData] = useState<NetworkTrafficData[]>(generateMockData());
  const [isConnected, setIsConnected] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Simulate WebSocket connection
    const interval = setInterval(() => {
      if (isConnected) {
        setData(generateMockData());
      }
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

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
      .text("Server ID");
  }, [data]);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    // Line chart for latency over time
    const timeData = data.map((d, i) => ({
      time: i,
      latency: d.latency,
      serverId: d.serverId,
    }));

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

    SERVER_COUNT.forEach((_, serverIndex) => {
      const serverData = timeData.filter((d) => d.serverId === `server-${serverIndex + 1}`);
      if (serverData.length > 0) {
        svg
          .append("path")
          .datum(serverData)
          .attr("fill", "none")
          .attr("stroke", colors[serverIndex % colors.length] as string)
          .attr("stroke-width", 2)
          .attr("d", line as any);
      }
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
  }, [data]);

  const totalRequests = data.reduce((sum, d) => sum + d.requests, 0);
  const avgLatency = data.reduce((sum, d) => sum + d.latency, 0) / data.length;
  const totalErrors = data.reduce((sum, d) => sum + d.errorRate, 0);

  return (
    <div className="container">
      <div className="section">
        <h2 className="title is-2 has-text-centered mb-6">
          Real-time Network Traffic Balance Demo
        </h2>

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
          <h3 className="title is-4 mb-4">Request Distribution</h3>
          <svg ref={svgRef} width="800" height="400"></svg>
        </div>

        <div className="box mt-6">
          <h3 className="title is-4 mb-4">Latency Over Time</h3>
          <svg ref={chartRef} width="800" height="300"></svg>
        </div>

        <div className="box mt-6">
          <h3 className="title is-4 mb-4">Server Details</h3>
          <div className="table-container">
            <table className="table is-fullwidth is-striped">
              <thead>
                <tr>
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
                    <td>{server.serverId}</td>
                    <td>{server.requests}</td>
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

