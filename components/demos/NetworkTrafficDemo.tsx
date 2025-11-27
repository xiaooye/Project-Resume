"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
  // Track request routing history for animation
  const [routingHistory, setRoutingHistory] = useState<Array<{
    id: string;
    from: string;
    to: string;
    timestamp: number;
    strategy: LoadBalancingStrategy;
  }>>([]);

  const simulateLoadBalancing = (servers: NetworkTrafficData[], strategy: LoadBalancingStrategy) => {
    if (servers.length === 0) return;

    // Filter out down servers
    const availableServers = servers.filter(s => !s.isDown && s.errorRate < 50);
    if (availableServers.length === 0) return;

    // Simulate routing a batch of requests
    const requestsToRoute = Math.floor(Math.random() * 20) + 5; // 5-25 requests per update
    const distribution = new Map<string, number>();
    const newRoutingHistory: typeof routingHistory = [];
    
    for (let i = 0; i < requestsToRoute; i++) {
      requestCounterRef.current += 1;
      const requestId = `req-${requestCounterRef.current}`;
      let selectedServer: NetworkTrafficData;

      switch (strategy) {
        case "round-robin":
          // Round robin with available servers only
          selectedServer = availableServers[requestCounterRef.current % availableServers.length];
          break;
        case "least-connections":
          // Select server with lowest current requests (excluding down servers)
          selectedServer = availableServers.reduce((min, server) => 
            server.requests < min.requests ? server : min
          );
          break;
        case "weighted-round-robin":
          // Weight by inverse latency (lower latency = higher weight)
          // Exclude down servers and high error rate servers
          const healthyServers = availableServers.filter(s => s.errorRate < 5);
          if (healthyServers.length === 0) {
            selectedServer = availableServers[0];
            break;
          }
          const totalWeight = healthyServers.reduce((sum, s) => 
            sum + (1 / (s.latency + 1)) * lbParams.weightedLatencyFactor, 0
          );
          let random = Math.random() * totalWeight;
          selectedServer = healthyServers[0];
          for (const server of healthyServers) {
            random -= (1 / (server.latency + 1)) * lbParams.weightedLatencyFactor;
            if (random <= 0) {
              selectedServer = server;
              break;
            }
          }
          break;
        case "ip-hash":
          // Hash-based selection (simulate consistent hashing)
          // Only hash to available servers
          const hash = (requestCounterRef.current + lbParams.ipHashSeed) % availableServers.length;
          selectedServer = availableServers[hash];
          break;
        default:
          selectedServer = availableServers[0];
      }

      const count = distribution.get(selectedServer.serverId) || 0;
      distribution.set(selectedServer.serverId, count + 1);

      // Track routing for visualization
      newRoutingHistory.push({
        id: requestId,
        from: "load-balancer",
        to: selectedServer.serverId,
        timestamp: Date.now(),
        strategy,
      });

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

    // Update routing history (keep last 100)
    setRoutingHistory((prev) => {
      const updated = [...prev, ...newRoutingHistory];
      return updated.slice(-100);
    });

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

  // Auto-reconnect state for Vercel optimization
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 2000; // 2 seconds

  // Throttle state to prevent UI flashing on fast updates
  const dataBufferRef = useRef<NetworkTrafficData[] | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const throttleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const UI_UPDATE_THROTTLE = 100; // Update UI at most every 100ms (10fps minimum)

  // Real-time WebSocket-like connection using Server-Sent Events
  // Optimized for Vercel: handles reconnection, timeouts, and errors
  useEffect(() => {
    if (!isMounted) return;

    if (isConnected) {
      // Generate or reuse session ID
      if (!sessionIdRef.current) {
        sessionIdRef.current = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Throttled update function to prevent UI flashing (defined outside connect for cleanup access)
      const updateUI = () => {
        if (dataBufferRef.current) {
          const bufferedData = dataBufferRef.current;
          dataBufferRef.current = null; // Clear buffer
          
          setData(bufferedData);
          // Maintain history for latency trend chart (last 50 updates)
          setDataHistory((prev) => {
            const updated = [...prev, bufferedData];
            return updated.slice(-50); // Keep only last 50 updates
          });
          
          // Simulate load balancing logic for visualization
          if (isConnected) {
            simulateLoadBalancing(bufferedData, lbStrategy);
          }
        }
      };

      const connect = () => {
        // Connect to real-time data stream with session ID
        const url = `/api/network-traffic?sessionId=${encodeURIComponent(sessionIdRef.current!)}`;
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
          try {
            // Ignore keepalive messages
            if (event.data.trim() === "" || event.data.startsWith(":")) {
              return;
            }
            
            const newData = JSON.parse(event.data) as NetworkTrafficData[];
            
            // Buffer the data instead of immediately updating
            dataBufferRef.current = newData;
            
            const now = Date.now();
            const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
            
            // Throttle UI updates to prevent flashing
            if (timeSinceLastUpdate >= UI_UPDATE_THROTTLE) {
              // Update immediately if enough time has passed
              lastUpdateTimeRef.current = now;
              updateUI();
              
              // Clear any pending throttle timeout
              if (throttleIntervalRef.current) {
                clearTimeout(throttleIntervalRef.current);
                throttleIntervalRef.current = null;
              }
            } else {
              // Schedule update if not already scheduled
              if (!throttleIntervalRef.current) {
                const delay = UI_UPDATE_THROTTLE - timeSinceLastUpdate;
                throttleIntervalRef.current = setTimeout(() => {
                  lastUpdateTimeRef.current = Date.now();
                  updateUI();
                  throttleIntervalRef.current = null;
                }, delay);
              }
            }
            
            // Reset reconnect attempts on successful message
            setReconnectAttempts(0);
          } catch (error) {
            console.error("Error parsing network traffic data:", error);
          }
        };

        // Send initial configuration when connection opens
        eventSource.onopen = () => {
          updateServerConfig();
          setReconnectAttempts(0); // Reset on successful connection
        };

        eventSource.onerror = (error) => {
          console.error("EventSource error:", error);
          
          // Close current connection
          eventSource.close();
          eventSourceRef.current = null;
          
          // Vercel optimization: Auto-reconnect on timeout/error
          // Vercel serverless functions have time limits, so we need to reconnect
          if (isConnected && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const attempts = reconnectAttempts + 1;
            setReconnectAttempts(attempts);
            
            // Exponential backoff: 2s, 4s, 8s, 16s, 32s
            const delay = Math.min(RECONNECT_DELAY * Math.pow(2, attempts - 1), 30000);
            
            console.log(`Reconnecting in ${delay}ms (attempt ${attempts}/${MAX_RECONNECT_ATTEMPTS})...`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isConnected) {
                connect(); // Reconnect
              }
            }, delay);
          } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error("Max reconnection attempts reached. Please manually reconnect.");
            setIsConnected(false);
          }
        };
      };

      // Initial connection
      connect();

      return () => {
        // Cleanup
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        if (throttleIntervalRef.current) {
          clearTimeout(throttleIntervalRef.current);
          throttleIntervalRef.current = null;
        }
        // Process any remaining buffered data before cleanup
        if (dataBufferRef.current) {
          updateUI();
        }
      };
    } else {
      // Disconnect
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setReconnectAttempts(0);
    }
  }, [isConnected, isMounted, updateServerConfig, reconnectAttempts]);

  // Update server config when settings change
  useEffect(() => {
    if (isConnected && sessionIdRef.current) {
      updateServerConfig();
    }
  }, [updateInterval, serverStates, scenarios, isConnected, updateServerConfig]);

  useEffect(() => {
    if (!isMounted || !svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    // Don't remove all elements - use transitions instead to prevent flashing
    // Only remove if this is the first render
    const isFirstRender = svg.selectAll("rect").empty();
    if (isFirstRender) {
      svg.selectAll("*").remove();
    }

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

    // Optimize Y-axis: use better tick formatting and ensure readable scale
    const maxRequests = d3.max(data, (d) => d.requests) || 1000;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxRequests])
      .nice()
      .range([height - margin.bottom, margin.top]);
    
    // Format Y-axis ticks for better readability
    const yAxisFormatter = d3.axisLeft(yScale)
      .tickFormat((d) => {
        const value = Number(d);
        if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}k`;
        }
        return value.toString();
      })
      .ticks(8); // Limit to 8 ticks for better readability

    // Update bars with smooth transitions to prevent flashing
    const bars = svg.selectAll<SVGRectElement, NetworkTrafficData>("rect").data(data, (d) => d.serverId);
    
    // Remove old bars
    bars.exit()
      .transition()
      .duration(150)
      .attr("opacity", 0)
      .remove();
    
    // Add new bars
    const barsEnter = bars.enter()
      .append("rect")
      .attr("x", (d) => xScale(d.serverId) || 0)
      .attr("y", height - margin.bottom)
      .attr("width", xScale.bandwidth())
      .attr("height", 0)
      .attr("fill", (d) => {
        if (d.errorRate > 3) return "#f14668";
        if (d.latency > 150) return "#ffa500";
        return "#48c78e";
      })
      .attr("opacity", 0);
    
    // Update existing bars with smooth transition
    barsEnter.merge(bars as any)
      .transition()
      .duration(150)
      .ease(d3.easeCubicOut)
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

    // Update labels with smooth transitions
    const labels = svg.selectAll<SVGTextElement, NetworkTrafficData>("text.label").data(data, (d) => d.serverId);
    
    labels.exit().remove();
    
    const labelsEnter = labels.enter()
      .append("text")
      .attr("class", "label")
      .attr("x", (d) => (xScale(d.serverId) || 0) + xScale.bandwidth() / 2)
      .attr("y", height - margin.bottom)
      .attr("text-anchor", "middle")
      .attr("fill", "#363636")
      .style("font-size", "12px")
      .text((d) => d.requests);
    
    labelsEnter.merge(labels as any)
      .transition()
      .duration(150)
      .attr("x", (d) => (xScale(d.serverId) || 0) + xScale.bandwidth() / 2)
      .attr("y", (d) => yScale(d.requests) - 5)
      .text((d) => d.requests);

    // Add axes - use formatted Y-axis for better readability
    const xAxis = d3.axisBottom(xScale);

    // Remove existing axes if they exist (for updates)
    svg.selectAll("g.x-axis").remove();
    svg.selectAll("g.y-axis").remove();

    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis);

    svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxisFormatter); // Use formatted Y-axis with k notation

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

    // Calculate balance score and strategy performance metrics
    const totalRequests = distributionArray.reduce((sum, d) => sum + d.count, 0);
    const avgRequests = totalRequests / distributionArray.length;
    const variance = distributionArray.reduce((sum, d) => sum + Math.pow(d.count - avgRequests, 2), 0) / distributionArray.length;
    const balanceScore = 100 - Math.min(100, (Math.sqrt(variance) / avgRequests) * 100);
    
    // Calculate strategy performance metrics
    const strategyMetrics = {
      balanceScore,
      avgLatency: distributionArray.reduce((sum, d) => sum + (d.server?.latency || 0), 0) / distributionArray.length,
      maxLoad: Math.max(...distributionArray.map(d => d.count)),
      minLoad: Math.min(...distributionArray.map(d => d.count)),
      loadVariance: variance,
    };

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

  // Calculate comprehensive metrics first
  const totalRequests = data.length > 0 ? data.reduce((sum, d) => sum + d.requests, 0) : 0;
  const avgLatency = data.length > 0 ? data.reduce((sum, d) => sum + d.latency, 0) / data.length : 0;
  const totalErrors = data.length > 0 ? data.reduce((sum, d) => sum + d.errorRate, 0) : 0;
  
  // P95 and P99 latency (critical for CTO)
  const latencies = data.map(d => d.latency).sort((a, b) => a - b);
  const p95Latency = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0;
  const p99Latency = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.99)] : 0;
  
  // Capacity analysis
  const maxCapacity = 10000; // per server
  const utilization = data.length > 0 
    ? (data.reduce((sum, d) => sum + d.requests, 0) / (data.length * maxCapacity)) * 100 
    : 0;

  // Strategy recommendation system
  const getRecommendedStrategy = useCallback((): {
    strategy: LoadBalancingStrategy;
    reason: string;
    score: number;
  } => {
    const activeScenarios = scenarios.filter(s => s.enabled);
    const downServers = data.filter(d => d.isDown).length;
    const highLatencyServers = data.filter(d => d.latency > 150).length;
    const highErrorServers = data.filter(d => d.errorRate > 5).length;
    const trafficSpike = activeScenarios.some(s => s.type === "traffic-spike" || s.type === "ddos");
    const regionOutage = activeScenarios.some(s => s.type === "region-outage");
    const serverDown = activeScenarios.some(s => s.type === "server-down") || downServers > 0;
    
    const strategies: Array<{
      strategy: LoadBalancingStrategy;
      score: number;
      reasons: string[];
    }> = [
      {
        strategy: "least-connections",
        score: 0,
        reasons: [],
      },
      {
        strategy: "weighted-round-robin",
        score: 0,
        reasons: [],
      },
      {
        strategy: "round-robin",
        score: 0,
        reasons: [],
      },
      {
        strategy: "ip-hash",
        score: 0,
        reasons: [],
      },
    ];

    // Score each strategy based on current conditions
    
    // Least Connections: Best for uneven load, server failures, traffic spikes
    if (serverDown || trafficSpike) {
      strategies[0].score += 30;
      strategies[0].reasons.push("Handles server failures and traffic spikes well");
    }
    if (highLatencyServers > data.length * 0.2) {
      strategies[0].score += 20;
      strategies[0].reasons.push("Automatically avoids overloaded servers");
    }
    if (utilization > 70) {
      strategies[0].score += 15;
      strategies[0].reasons.push("Optimal for high utilization scenarios");
    }

    // Weighted Round Robin: Best for performance optimization, latency-sensitive apps
    if (highLatencyServers > 0 && highLatencyServers < data.length * 0.3) {
      strategies[1].score += 25;
      strategies[1].reasons.push("Optimizes for low latency");
    }
    if (p95Latency > 150) {
      strategies[1].score += 20;
      strategies[1].reasons.push("Reduces latency by routing to faster servers");
    }
    if (!trafficSpike && !serverDown) {
      strategies[1].score += 15;
      strategies[1].reasons.push("Best for stable, performance-critical workloads");
    }

    // Round Robin: Best for simple, predictable load, uniform servers
    if (downServers === 0 && highLatencyServers === 0 && !trafficSpike) {
      strategies[2].score += 25;
      strategies[2].reasons.push("Simple and predictable for uniform workloads");
    }
    if (utilization < 50) {
      strategies[2].score += 15;
      strategies[2].reasons.push("Efficient for low to medium load");
    }
    if (data.length <= 10) {
      strategies[2].score += 10;
      strategies[2].reasons.push("Good for small server pools");
    }

    // IP Hash: Best for session affinity, caching, stateful applications
    if (regionOutage) {
      strategies[3].score += 20;
      strategies[3].reasons.push("Maintains session affinity during outages");
    }
    if (!trafficSpike && !serverDown) {
      strategies[3].score += 15;
      strategies[3].reasons.push("Ensures consistent routing for caching");
    }
    if (utilization < 60) {
      strategies[3].score += 10;
      strategies[3].reasons.push("Good for stateful applications");
    }

    // Find best strategy
    const best = strategies.reduce((max, s) => s.score > max.score ? s : max);
    
    return {
      strategy: best.strategy,
      reason: best.reasons.join(". ") || "No specific recommendation",
      score: best.score,
    };
  }, [data, scenarios, utilization, p95Latency]);

  // Memoize recommendation to prevent unnecessary re-renders
  const recommendation = useMemo(() => getRecommendedStrategy(), [data, scenarios, utilization, p95Latency, lbStrategy]);

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
            {reconnectAttempts > 0 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS && (
              <div className="notification is-warning">
                <strong>⚠️ Reconnecting...</strong> Attempt {reconnectAttempts}/{MAX_RECONNECT_ATTEMPTS}
                <p className="mt-2">
                  Vercel serverless functions have execution time limits. The connection will automatically reconnect.
                </p>
              </div>
            )}
            {reconnectAttempts >= MAX_RECONNECT_ATTEMPTS && (
              <div className="notification is-danger">
                <strong>❌ Connection Failed</strong>
                <p className="mt-2">
                  Max reconnection attempts reached. Please click "Connect" to retry.
                </p>
              </div>
            )}
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

        {/* Load Balancing Info - Fixed height to prevent layout shift */}
        <div className="mb-6" style={{ minHeight: "60px" }}>
          {currentRequest ? (
            <div className="notification is-info">
              <strong>Latest Request:</strong> {currentRequest.id} → {currentRequest.target} 
              <span className="ml-2 tag is-light">{(() => {
                const age = Date.now() - currentRequest.timestamp;
                return age < 1000 ? `${age}ms ago` : `${(age / 1000).toFixed(1)}s ago`;
              })()}</span>
            </div>
          ) : (
            <div className="notification is-light">
              <strong>Latest Request:</strong> <span className="has-text-grey">Waiting for requests...</span>
            </div>
          )}
        </div>

        {/* Load Balancing Visualization */}
        <div className="box mb-6">
          <h3 className="title is-4 mb-4">Request Distribution Visualization</h3>
          <p className="subtitle is-6 mb-4">
            Shows how requests are distributed across servers using {lbStrategy.replace("-", " ")} algorithm
          </p>
          
          {/* Real-time Request Flow Animation - Fixed container to prevent layout shift */}
          <div className="box mb-4" style={{ minHeight: "200px" }}>
            <h4 className="title is-5 mb-3">Real-time Request Routing (Last 20 Requests)</h4>
            {routingHistory.length > 0 ? (
              <div className="columns is-multiline">
                {(() => {
                  // Use stable slice to prevent re-rendering all items
                  const displayRoutes = routingHistory.slice(-20).reverse();
                  return displayRoutes.map((route) => {
                    const server = data.find(d => d.serverId === route.to);
                    const age = Date.now() - route.timestamp;
                    const isRecent = age < 2000; // Show animation for requests < 2 seconds old
                    
                    return (
                      <motion.div
                        key={route.id}
                        className="column is-2"
                        initial={false}
                        animate={{ opacity: isRecent ? 1 : 0.5 }}
                        transition={{ duration: 0.2 }}
                        layout
                      >
                        <div className={`box ${isRecent ? "has-background-info-light" : ""}`}>
                          <div className="content">
                            <p className="is-size-7">
                              <strong>{route.id}</strong>
                            </p>
                            <p className="is-size-7">
                              <span className="tag is-small">LB</span> →{" "}
                              <span className={`tag is-small ${
                                server?.isDown ? "is-danger" :
                                (server?.errorRate ?? 0) > 3 ? "is-warning" :
                                "is-success"
                              }`}>
                                {route.to.split("-")[0]}
                              </span>
                            </p>
                            <p className="is-size-7 has-text-grey">
                              {age < 1000 ? `${age}ms ago` : `${(age / 1000).toFixed(1)}s ago`}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  });
                })()}
              </div>
            ) : (
              <div className="has-text-grey">
                <p>Waiting for request routing data...</p>
              </div>
            )}
          </div>
          
          <div className="table-container">
            <svg ref={lbVizRef} width="100%" height="400" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid meet"></svg>
          </div>
          
          {/* Strategy Effectiveness Metrics */}
          {requestDistribution.size > 0 && (
            <div className="box mt-4">
              <h4 className="title is-5 mb-3">Current Strategy Performance</h4>
              <div className="columns">
                <div className="column">
                  <div className="content">
                    <p><strong>Balance Score:</strong> {(() => {
                      const distArray = Array.from(requestDistribution.values());
                      const avg = distArray.reduce((a, b) => a + b, 0) / distArray.length;
                      const variance = distArray.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / distArray.length;
                      const score = 100 - Math.min(100, (Math.sqrt(variance) / avg) * 100);
                      return score.toFixed(1) + "%";
                    })()}</p>
                    <p><strong>Total Requests Routed:</strong> {Array.from(requestDistribution.values()).reduce((a, b) => a + b, 0).toLocaleString()}</p>
                    <p><strong>Servers Receiving Traffic:</strong> {requestDistribution.size}</p>
                  </div>
                </div>
                <div className="column">
                  <div className="content">
                    <p><strong>Strategy:</strong> {lbStrategy.replace("-", " ").toUpperCase()}</p>
                    <p><strong>Load Distribution:</strong> {
                      (() => {
                        const distArray = Array.from(requestDistribution.values());
                        const max = Math.max(...distArray);
                        const min = Math.min(...distArray);
                        return max > 0 ? ((max - min) / max * 100).toFixed(1) + "% variance" : "N/A";
                      })()
                    }</p>
                    <p><strong>Health Check:</strong> {
                      data.filter(d => !d.isDown && d.errorRate < 5).length > 0 ? (
                        <span className="tag is-success">✓ Healthy</span>
                      ) : (
                        <span className="tag is-danger">✗ Issues Detected</span>
                      )
                    }</p>
                  </div>
                </div>
              </div>
            </div>
          )}
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
                {/* Fixed height recommendation section to prevent layout shift */}
                <div className="mt-2" style={{ minHeight: recommendation.strategy !== lbStrategy ? "120px" : "0px" }}>
                  {recommendation.strategy !== lbStrategy && (
                    <div className="notification is-info">
                      <button className="delete" onClick={() => {}}></button>
                      <strong>💡 Recommended: {recommendation.strategy.replace("-", " ").toUpperCase()}</strong>
                      <p className="mt-2">{recommendation.reason}</p>
                      <button
                        className="button is-small is-primary mt-2"
                        onClick={() => {
                          setLbStrategy(recommendation.strategy);
                          setRequestDistribution(new Map());
                        }}
                      >
                        Switch to Recommended Strategy
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Strategy Comparison & Performance Analysis */}
          <div className="box mt-4">
            <h4 className="title is-5 mb-4">Strategy Performance Analysis</h4>
            <div className="table-container">
              <table className="table is-fullwidth is-striped">
                <thead>
                  <tr>
                    <th>Strategy</th>
                    <th>Best For</th>
                    <th>Current Scenario Match</th>
                    <th>Recommendation Score</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={lbStrategy === "round-robin" ? "has-background-info-light" : ""}>
                    <td><strong>Round Robin</strong></td>
                    <td>Simple, uniform workloads, predictable load</td>
                    <td>
                      {recommendation.strategy === "round-robin" ? (
                        <span className="tag is-success">✓ Best Match</span>
                      ) : (
                        <span className="tag is-light">Consider</span>
                      )}
                    </td>
                    <td>
                      <progress
                        className={`progress ${recommendation.strategy === "round-robin" ? "is-success" : "is-light"}`}
                        value={recommendation.strategy === "round-robin" ? recommendation.score : 0}
                        max={100}
                      >
                        {recommendation.strategy === "round-robin" ? recommendation.score : 0}%
                      </progress>
                    </td>
                  </tr>
                  <tr className={lbStrategy === "least-connections" ? "has-background-info-light" : ""}>
                    <td><strong>Least Connections</strong></td>
                    <td>Uneven load, server failures, traffic spikes, high utilization</td>
                    <td>
                      {recommendation.strategy === "least-connections" ? (
                        <span className="tag is-success">✓ Best Match</span>
                      ) : (
                        <span className="tag is-light">Consider</span>
                      )}
                    </td>
                    <td>
                      <progress
                        className={`progress ${recommendation.strategy === "least-connections" ? "is-success" : "is-light"}`}
                        value={recommendation.strategy === "least-connections" ? recommendation.score : 0}
                        max={100}
                      >
                        {recommendation.strategy === "least-connections" ? recommendation.score : 0}%
                      </progress>
                    </td>
                  </tr>
                  <tr className={lbStrategy === "weighted-round-robin" ? "has-background-info-light" : ""}>
                    <td><strong>Weighted Round Robin</strong></td>
                    <td>Performance optimization, latency-sensitive apps, stable workloads</td>
                    <td>
                      {recommendation.strategy === "weighted-round-robin" ? (
                        <span className="tag is-success">✓ Best Match</span>
                      ) : (
                        <span className="tag is-light">Consider</span>
                      )}
                    </td>
                    <td>
                      <progress
                        className={`progress ${recommendation.strategy === "weighted-round-robin" ? "is-success" : "is-light"}`}
                        value={recommendation.strategy === "weighted-round-robin" ? recommendation.score : 0}
                        max={100}
                      >
                        {recommendation.strategy === "weighted-round-robin" ? recommendation.score : 0}%
                      </progress>
                    </td>
                  </tr>
                  <tr className={lbStrategy === "ip-hash" ? "has-background-info-light" : ""}>
                    <td><strong>IP Hash</strong></td>
                    <td>Session affinity, caching, stateful applications, consistent routing</td>
                    <td>
                      {recommendation.strategy === "ip-hash" ? (
                        <span className="tag is-success">✓ Best Match</span>
                      ) : (
                        <span className="tag is-light">Consider</span>
                      )}
                    </td>
                    <td>
                      <progress
                        className={`progress ${recommendation.strategy === "ip-hash" ? "is-success" : "is-light"}`}
                        value={recommendation.strategy === "ip-hash" ? recommendation.score : 0}
                        max={100}
                      >
                        {recommendation.strategy === "ip-hash" ? recommendation.score : 0}%
                      </progress>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Scenario-Specific Recommendations */}
          {scenarios.filter(s => s.enabled).length > 0 && (
            <div className="box mt-4">
              <h4 className="title is-5 mb-4">Scenario-Specific Solutions</h4>
              <div className="content">
                {scenarios.filter(s => s.enabled).map((scenario, idx) => {
                  let solution = "";
                  let recommendedStrategy: LoadBalancingStrategy = "least-connections";
                  
                  switch (scenario.type) {
                    case "traffic-spike":
                      solution = "During traffic spikes, use Least Connections to automatically route traffic away from overloaded servers. Consider enabling auto-scaling and rate limiting.";
                      recommendedStrategy = "least-connections";
                      break;
                    case "server-down":
                      solution = "When servers are down, Least Connections automatically excludes failed servers. Ensure health checks are configured and consider implementing circuit breakers.";
                      recommendedStrategy = "least-connections";
                      break;
                    case "region-outage":
                      solution = "For region outages, IP Hash maintains session affinity while routing to available regions. Consider implementing geo-routing and failover policies.";
                      recommendedStrategy = "ip-hash";
                      break;
                    case "ddos":
                      solution = "During DDoS attacks, use Least Connections combined with rate limiting and WAF. Consider implementing traffic filtering and auto-scaling to absorb the attack.";
                      recommendedStrategy = "least-connections";
                      break;
                  }
                  
                  return (
                    <div key={idx} className="notification is-warning">
                      <strong>Scenario: {scenario.type.replace("-", " ").toUpperCase()}</strong>
                      <p className="mt-2">{solution}</p>
                      <p className="mt-2">
                        <strong>Recommended Strategy:</strong>{" "}
                        <span className="tag is-primary">{recommendedStrategy.replace("-", " ").toUpperCase()}</span>
                        {recommendedStrategy !== lbStrategy && (
                          <button
                            className="button is-small is-primary ml-2"
                            onClick={() => {
                              setLbStrategy(recommendedStrategy);
                              setRequestDistribution(new Map());
                            }}
                          >
                            Apply
                          </button>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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

