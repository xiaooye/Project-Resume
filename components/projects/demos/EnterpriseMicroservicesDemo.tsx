"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import * as d3 from "d3";
import { Project } from "@/types";

interface ServiceNode {
  id: string;
  name: string;
  type: "api" | "service" | "database" | "cache" | "gateway";
  region: string;
  status: "healthy" | "degraded" | "down";
  requests: number;
  latency: number;
  errorRate: number;
  connections: number;
}

interface CircuitBreakerState {
  serviceId: string;
  state: "closed" | "open" | "half-open";
  failureCount: number;
  lastFailureTime: number;
  successCount: number;
}

interface TraceSpan {
  id: string;
  serviceId: string;
  operation: string;
  startTime: number;
  duration: number;
  status: "success" | "error";
  parentId?: string;
}

interface AutoScalingMetric {
  serviceId: string;
  currentReplicas: number;
  targetReplicas: number;
  cpuUsage: number;
  memoryUsage: number;
  requestRate: number;
}

export default function EnterpriseMicroservicesDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [activeTab, setActiveTab] = useState<"architecture" | "circuit-breaker" | "tracing" | "scaling" | "metrics">("architecture");
  
  // User controls
  const [requestRate, setRequestRate] = useState(1000); // requests per minute
  const [simulationEnabled, setSimulationEnabled] = useState(true);
  const [circuitBreakerThreshold, setCircuitBreakerThreshold] = useState(5); // error rate %
  const [autoScalingEnabled, setAutoScalingEnabled] = useState(true);
  const [targetLatency, setTargetLatency] = useState(100); // ms
  const [manualServiceControl, setManualServiceControl] = useState<Map<string, { multiplier: number; forceStatus?: ServiceNode["status"] }>>(new Map());
  
  // Services state
  const [services, setServices] = useState<ServiceNode[]>([]);
  const [circuitBreakers, setCircuitBreakers] = useState<Map<string, CircuitBreakerState>>(new Map());
  const [traces, setTraces] = useState<TraceSpan[]>([]);
  const [scalingMetrics, setScalingMetrics] = useState<Map<string, AutoScalingMetric>>(new Map());
  
  // Performance metrics
  const [p95Latency, setP95Latency] = useState(0);
  const [p99Latency, setP99Latency] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [errorRate, setErrorRate] = useState(0);
  const [uptime, setUptime] = useState(99.9);
  
  // Request simulation
  const [requestQueue, setRequestQueue] = useState<Array<{ id: string; serviceId: string; timestamp: number }>>([]);
  const [recentRequests, setRecentRequests] = useState<Array<{ id: string; serviceId: string; timestamp: number; latency: number; status: "success" | "error" }>>([]);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const architectureRef = useRef<SVGSVGElement>(null);
  const traceRef = useRef<SVGSVGElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize services
  const initializeServices = useCallback(() => {
    const serviceTypes: ServiceNode["type"][] = ["gateway", "api", "service", "service", "service", "database", "cache"];
    const regions = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"];
    const serviceNames = [
      "API Gateway", "User Service", "Order Service", "Payment Service",
      "Inventory Service", "PostgreSQL", "Redis Cache"
    ];

    const newServices: ServiceNode[] = serviceNames.map((name, index) => ({
      id: `service-${index}`,
      name,
      type: serviceTypes[index],
      region: regions[index % regions.length],
      status: Math.random() > 0.1 ? "healthy" : Math.random() > 0.5 ? "degraded" : "down",
      requests: Math.floor(Math.random() * 10000) + 1000,
      latency: Math.random() * 100 + 20,
      errorRate: Math.random() * 2,
      connections: Math.floor(Math.random() * 500) + 50,
    }));

    setServices(newServices);

    // Initialize circuit breakers
    const breakers = new Map<string, CircuitBreakerState>();
    newServices.forEach(service => {
      if (service.type === "service") {
        breakers.set(service.id, {
          serviceId: service.id,
          state: "closed",
          failureCount: 0,
          lastFailureTime: 0,
          successCount: 0,
        });
      }
    });
    setCircuitBreakers(breakers);

    // Initialize scaling metrics
    const scaling = new Map<string, AutoScalingMetric>();
    newServices.forEach(service => {
      if (service.type === "service") {
        scaling.set(service.id, {
          serviceId: service.id,
          currentReplicas: Math.floor(Math.random() * 5) + 2,
          targetReplicas: Math.floor(Math.random() * 5) + 2,
          cpuUsage: Math.random() * 80 + 10,
          memoryUsage: Math.random() * 70 + 20,
          requestRate: service.requests / 60,
        });
      }
    });
    setScalingMetrics(scaling);
  }, []);

  // Simulate request
  const simulateRequest = useCallback((targetServiceId: string) => {
    const service = services.find(s => s.id === targetServiceId);
    if (!service) return;

    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    // Check circuit breaker
    const breaker = circuitBreakers.get(targetServiceId);
    if (breaker && breaker.state === "open") {
      // Request blocked by circuit breaker
      setRecentRequests(prev => [...prev.slice(-50), {
        id: requestId,
        serviceId: targetServiceId,
        timestamp: startTime,
        latency: 0,
        status: "error",
      }]);
      return;
    }

    // Simulate latency based on service state
    const baseLatency = service.latency;
    const simulatedLatency = baseLatency + (Math.random() - 0.5) * baseLatency * 0.3;
    const willError = service.errorRate > Math.random() * 10;

    setTimeout(() => {
      const result = {
        id: requestId,
        serviceId: targetServiceId,
        timestamp: startTime,
        latency: simulatedLatency,
        status: willError ? "error" as const : "success" as const,
      };
      
      setRecentRequests(prev => [...prev.slice(-50), result]);
      
      // Update circuit breaker
      if (breaker) {
        setCircuitBreakers(prev => {
          const updated = new Map(prev);
          const current = updated.get(targetServiceId);
          if (current) {
            if (willError) {
              updated.set(targetServiceId, {
                ...current,
                failureCount: current.failureCount + 1,
                lastFailureTime: Date.now(),
                state: current.failureCount + 1 >= 5 ? "open" : current.state,
              });
            } else {
              updated.set(targetServiceId, {
                ...current,
                successCount: current.successCount + 1,
                state: current.state === "half-open" ? "closed" : current.state,
              });
            }
          }
          return updated;
        });
      }
    }, simulatedLatency);
  }, [services, circuitBreakers]);

  // Update metrics
  const updateMetrics = useCallback(() => {
    if (!simulationEnabled) return;

    setServices(prev => prev.map(service => {
      const manual = manualServiceControl.get(service.id);
      const baseMultiplier = manual?.multiplier || 1.0;
      const forcedStatus = manual?.forceStatus;
      
      // Calculate base requests based on user input
      const baseRequests = (requestRate / services.length) * baseMultiplier;
      const variation = (Math.random() - 0.5) * 0.2;
      const newRequests = Math.max(0, baseRequests * (1 + variation));
      
      const baseLatency = service.latency;
      const latencyVariation = (Math.random() - 0.5) * 20;
      const newLatency = Math.max(10, baseLatency + latencyVariation);
      
      const newErrorRate = Math.min(5, Math.max(0, service.errorRate + (Math.random() - 0.5) * 0.5));
      
      // Update status based on error rate and latency, or forced status
      let newStatus: ServiceNode["status"] = forcedStatus || "healthy";
      if (!forcedStatus) {
        if (newErrorRate > circuitBreakerThreshold || newLatency > targetLatency * 1.5) {
          newStatus = "down";
        } else if (newErrorRate > circuitBreakerThreshold / 2 || newLatency > targetLatency) {
          newStatus = "degraded";
        }
      }

      return {
        ...service,
        requests: newRequests,
        latency: newLatency,
        errorRate: newErrorRate,
        status: newStatus,
        connections: Math.floor(newRequests / 20),
      };
    }));

    // Generate new requests based on request rate (only if simulation is enabled)
    if (requestRate > 0 && simulationEnabled) {
      const requestsPerSecond = requestRate / 60;
      const requestsToGenerate = Math.floor(requestsPerSecond);
      for (let i = 0; i < requestsToGenerate; i++) {
        const randomService = services[Math.floor(Math.random() * services.length)];
        if (randomService && randomService.type !== "database" && randomService.type !== "cache") {
          simulateRequest(randomService.id);
        }
      }
    }

    // Update circuit breakers based on error rate and threshold
    setCircuitBreakers(prev => {
      const updated = new Map(prev);
      updated.forEach((breaker, serviceId) => {
        const service = services.find(s => s.id === serviceId);
        if (service) {
          if (service.errorRate > circuitBreakerThreshold && breaker.state === "closed") {
            updated.set(serviceId, {
              ...breaker,
              state: "open",
              failureCount: breaker.failureCount + 1,
              lastFailureTime: Date.now(),
            });
          } else if (breaker.state === "open" && Date.now() - breaker.lastFailureTime > 30000) {
            updated.set(serviceId, {
              ...breaker,
              state: "half-open",
            });
          } else if (breaker.state === "half-open" && service.errorRate < circuitBreakerThreshold / 2) {
            updated.set(serviceId, {
              ...breaker,
              state: "closed",
              successCount: breaker.successCount + 1,
              failureCount: 0,
            });
          } else if (service.errorRate < circuitBreakerThreshold / 2 && breaker.state === "closed") {
            updated.set(serviceId, {
              ...breaker,
              successCount: breaker.successCount + 1,
            });
          }
        }
      });
      return updated;
    });

    // Update scaling metrics
    if (autoScalingEnabled) {
      setScalingMetrics(prev => {
        const updated = new Map(prev);
        updated.forEach((metric, serviceId) => {
          const service = services.find(s => s.id === serviceId);
          if (service) {
            // Calculate target replicas based on latency and request rate
            const requestsPerReplica = 2000; // Each replica can handle ~2000 req/min
            const latencyBasedReplicas = service.latency > targetLatency ? 
              Math.ceil(service.requests / requestsPerReplica) + 1 : 
              Math.ceil(service.requests / requestsPerReplica);
            
            const targetReplicas = Math.max(2, Math.min(10, latencyBasedReplicas));
            
            // Gradually adjust current replicas towards target
            let newCurrentReplicas = metric.currentReplicas;
            if (targetReplicas > metric.currentReplicas) {
              newCurrentReplicas = Math.min(targetReplicas, metric.currentReplicas + 1);
            } else if (targetReplicas < metric.currentReplicas) {
              newCurrentReplicas = Math.max(targetReplicas, metric.currentReplicas - 1);
            }
            
            // Calculate CPU and memory based on load
            const loadPerReplica = service.requests / newCurrentReplicas;
            const cpuUsage = Math.min(100, (loadPerReplica / requestsPerReplica) * 100);
            const memoryUsage = Math.min(100, cpuUsage * 0.8);
            
            updated.set(serviceId, {
              ...metric,
              currentReplicas: newCurrentReplicas,
              targetReplicas: targetReplicas,
              cpuUsage: cpuUsage,
              memoryUsage: memoryUsage,
              requestRate: service.requests / 60,
            });
          }
        });
        return updated;
      });
    } else {
      // Manual scaling mode - only update metrics, not replicas
      setScalingMetrics(prev => {
        const updated = new Map(prev);
        updated.forEach((metric, serviceId) => {
          const service = services.find(s => s.id === serviceId);
          if (service) {
            const loadPerReplica = service.requests / metric.currentReplicas;
            const requestsPerReplica = 2000;
            const cpuUsage = Math.min(100, (loadPerReplica / requestsPerReplica) * 100);
            const memoryUsage = Math.min(100, cpuUsage * 0.8);
            
            updated.set(serviceId, {
              ...metric,
              cpuUsage: cpuUsage,
              memoryUsage: memoryUsage,
              requestRate: service.requests / 60,
            });
          }
        });
        return updated;
      });
    }

    // Calculate aggregate metrics
    const allLatencies = services.map(s => s.latency).sort((a, b) => a - b);
    if (allLatencies.length > 0) {
      const p95Index = Math.floor(allLatencies.length * 0.95);
      const p99Index = Math.floor(allLatencies.length * 0.99);
      setP95Latency(allLatencies[p95Index] || 0);
      setP99Latency(allLatencies[p99Index] || 0);
    }
    
    const total = services.reduce((sum, s) => sum + s.requests, 0);
    setTotalRequests(total);
    
    const avgErrorRate = services.reduce((sum, s) => sum + s.errorRate, 0) / services.length;
    setErrorRate(avgErrorRate);
  }, [services, simulationEnabled, requestRate, manualServiceControl, circuitBreakerThreshold, targetLatency, simulateRequest, autoScalingEnabled]);

  // Generate trace
  const generateTrace = useCallback(() => {
    const newTrace: TraceSpan[] = [];
    const startTime = Date.now();
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let currentTime = startTime;

    // Gateway -> API -> Services -> Database
    const gatewaySpan: TraceSpan = {
      id: `${traceId}-1`,
      serviceId: "service-0",
      operation: "GET /api/orders",
      startTime: currentTime,
      duration: 50 + Math.random() * 30,
      status: "success",
    };
    currentTime += gatewaySpan.duration;
    newTrace.push(gatewaySpan);

    const apiSpan: TraceSpan = {
      id: `${traceId}-2`,
      serviceId: "service-1",
      operation: "Process Request",
      startTime: startTime + 10,
      duration: 30 + Math.random() * 20,
      status: "success",
      parentId: gatewaySpan.id,
    };
    newTrace.push(apiSpan);

    const orderSpan: TraceSpan = {
      id: `${traceId}-3`,
      serviceId: "service-2",
      operation: "Get Order",
      startTime: startTime + 20,
      duration: 20 + Math.random() * 15,
      status: "success",
      parentId: apiSpan.id,
    };
    newTrace.push(orderSpan);

    const dbSpan: TraceSpan = {
      id: `${traceId}-4`,
      serviceId: "service-5",
      operation: "SELECT orders",
      startTime: startTime + 25,
      duration: 5 + Math.random() * 10,
      status: "success",
      parentId: orderSpan.id,
    };
    newTrace.push(dbSpan);

    setTraces(prev => [...prev.slice(-20), ...newTrace]);
  }, []);

  // Render architecture diagram
  const renderArchitecture = useCallback(() => {
    if (!architectureRef.current || services.length === 0) return;

    const svg = d3.select(architectureRef.current);
    svg.selectAll("*").remove();

    // Use parent container width or default
    const container = architectureRef.current.parentElement;
    const width = container?.clientWidth || architectureRef.current.clientWidth || 800;
    const height = isMobile ? 400 : 500;
    svg.attr("width", width).attr("height", height);
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    svg.attr("preserveAspectRatio", "xMidYMid meet");

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Group services by type
    const gateway = services.filter(s => s.type === "gateway");
    const apis = services.filter(s => s.type === "api");
    const serviceNodes = services.filter(s => s.type === "service");
    const databases = services.filter(s => s.type === "database");
    const caches = services.filter(s => s.type === "cache");

    // Position nodes
    const nodePositions = new Map<string, { x: number; y: number }>();
    
    // Gateway at top
    gateway.forEach((node, i) => {
      nodePositions.set(node.id, { x: innerWidth / 2, y: 50 });
    });

    // APIs in middle
    apis.forEach((node, i) => {
      nodePositions.set(node.id, { x: innerWidth / 2, y: 150 });
    });

    // Services distributed
    serviceNodes.forEach((node, i) => {
      const cols = 3;
      const row = Math.floor(i / cols);
      const col = i % cols;
      nodePositions.set(node.id, {
        x: (innerWidth / (cols + 1)) * (col + 1),
        y: 250 + row * 80,
      });
    });

    // Databases and caches at bottom
    [...databases, ...caches].forEach((node, i) => {
      nodePositions.set(node.id, {
        x: (innerWidth / (databases.length + caches.length + 1)) * (i + 1),
        y: innerHeight - 50,
      });
    });

    // Draw connections with animation
    const drawConnection = (from: string, to: string, color: string, width: number, opacity: number) => {
      const fromPos = nodePositions.get(from);
      const toPos = nodePositions.get(to);
      if (!fromPos || !toPos) return;

      const line = g.append("line")
        .attr("x1", fromPos.x)
        .attr("y1", fromPos.y)
        .attr("x2", fromPos.x)
        .attr("y2", fromPos.y)
        .attr("stroke", color)
        .attr("stroke-width", width)
        .attr("opacity", opacity);

      if (!prefersReducedMotion) {
        line.transition()
          .duration(500)
          .attr("x2", toPos.x)
          .attr("y2", toPos.y);
      } else {
        line.attr("x2", toPos.x).attr("y2", toPos.y);
      }
    };

    // Gateway to APIs
    gateway.forEach(gw => {
      apis.forEach(api => {
        drawConnection(gw.id, api.id, "#6366f1", 2, 0.4);
      });
    });

    // APIs to Services
    apis.forEach(api => {
      serviceNodes.forEach(svc => {
        drawConnection(api.id, svc.id, "#6366f1", 1.5, 0.3);
      });
    });

    // Services to Databases
    serviceNodes.forEach(svc => {
      databases.forEach(db => {
        drawConnection(svc.id, db.id, "#10b981", 1, 0.3);
      });
    });

    // Services to Cache
    serviceNodes.forEach(svc => {
      caches.forEach(cache => {
        drawConnection(svc.id, cache.id, "#f59e0b", 1, 0.2);
      });
    });

    // Draw nodes with animation
    services.forEach(service => {
      const pos = nodePositions.get(service.id);
      if (!pos) return;

      const color = service.status === "healthy" ? "#10b981" : 
                   service.status === "degraded" ? "#f59e0b" : "#ef4444";
      
      const nodeGroup = g.append("g")
        .attr("transform", `translate(${pos.x}, ${pos.y})`)
        .style("cursor", "pointer");

      const circle = nodeGroup.append("circle")
        .attr("r", 0)
        .attr("fill", color)
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);

      if (!prefersReducedMotion) {
        circle.transition()
          .duration(300)
          .delay(services.indexOf(service) * 50)
          .attr("r", isMobile ? 15 : 20);
      } else {
        circle.attr("r", isMobile ? 15 : 20);
      }

      // Add pulsing animation for active services
      if (service.status === "healthy" && !prefersReducedMotion) {
        nodeGroup.append("circle")
          .attr("r", isMobile ? 15 : 20)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 1)
          .attr("opacity", 0.5)
          .transition()
          .duration(2000)
          .ease(d3.easeLinear)
          .attr("r", (isMobile ? 15 : 20) * 1.5)
          .attr("opacity", 0)
          .on("end", function repeat() {
            d3.select(this)
              .attr("r", isMobile ? 15 : 20)
              .attr("opacity", 0.5)
              .transition()
              .duration(2000)
              .ease(d3.easeLinear)
              .attr("r", (isMobile ? 15 : 20) * 1.5)
              .attr("opacity", 0)
              .on("end", repeat);
          });
      }

      nodeGroup.append("text")
        .attr("y", isMobile ? 25 : 30)
        .attr("text-anchor", "middle")
        .attr("font-size", isMobile ? "10px" : "12px")
        .attr("fill", "currentColor")
        .attr("font-weight", "500")
        .text(service.name.split(" ")[0]);

      // Add tooltip on hover
      nodeGroup.append("title")
        .text(`${service.name}\nStatus: ${service.status}\nLatency: ${service.latency.toFixed(1)}ms\nRequests: ${Math.floor(service.requests)}/min`);
    });
  }, [services, isMobile, prefersReducedMotion]);

  useEffect(() => {
    setIsMounted(true);
    initializeServices();

    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleReducedMotion = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    mediaQuery.addEventListener("change", handleReducedMotion);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
      mediaQuery.removeEventListener("change", handleReducedMotion);
    };
  }, [initializeServices]);

  useEffect(() => {
    if (!isMounted || !simulationEnabled) return;

    intervalRef.current = setInterval(() => {
      updateMetrics();
      if (Math.random() > 0.7) {
        generateTrace();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMounted, simulationEnabled, updateMetrics, generateTrace]);

  useEffect(() => {
    if (activeTab === "architecture" && isMounted && services.length > 0) {
      // Delay to ensure DOM is ready
      const timer = setTimeout(() => {
        renderArchitecture();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, isMounted, services, renderArchitecture]);

  // Re-render architecture on window resize
  useEffect(() => {
    if (activeTab === "architecture" && isMounted) {
      const handleResize = () => {
        if (services.length > 0) {
          renderArchitecture();
        }
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [activeTab, isMounted, services, renderArchitecture]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="box liquid-glass-card">
      {/* Tabs */}
      <div className="tabs is-boxed mb-4">
        <ul>
          <li className={activeTab === "architecture" ? "is-active" : ""}>
            <a
              onClick={() => setActiveTab("architecture")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveTab("architecture");
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Architecture view"
            >
              Architecture
            </a>
          </li>
          <li className={activeTab === "circuit-breaker" ? "is-active" : ""}>
            <a
              onClick={() => setActiveTab("circuit-breaker")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveTab("circuit-breaker");
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Circuit breaker view"
            >
              Circuit Breaker
            </a>
          </li>
          <li className={activeTab === "tracing" ? "is-active" : ""}>
            <a
              onClick={() => setActiveTab("tracing")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveTab("tracing");
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Distributed tracing view"
            >
              Tracing
            </a>
          </li>
          <li className={activeTab === "scaling" ? "is-active" : ""}>
            <a
              onClick={() => setActiveTab("scaling")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveTab("scaling");
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Auto scaling view"
            >
              Auto Scaling
            </a>
          </li>
          <li className={activeTab === "metrics" ? "is-active" : ""}>
            <a
              onClick={() => setActiveTab("metrics")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveTab("metrics");
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Performance metrics view"
            >
              Metrics
            </a>
          </li>
        </ul>
      </div>

      {/* Control Panel */}
      <div className="box liquid-glass-card mb-4">
        <h4 className="title is-6 mb-4 liquid-glass-text">Simulation Controls</h4>
        <div className="columns is-multiline">
          <div className="column is-one-third-tablet is-half-mobile">
            <div className="field">
              <label className="label liquid-glass-text">Request Rate (req/min)</label>
              <div className="control">
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="10000"
                  step="100"
                  value={requestRate}
                  onChange={(e) => setRequestRate(Number(e.target.value))}
                  aria-label="Request rate per minute"
                />
              </div>
              <p className="help liquid-glass-text">Current: {requestRate} requests/minute</p>
            </div>
          </div>
          <div className="column is-one-third-tablet is-half-mobile">
            <div className="field">
              <label className="label liquid-glass-text">Circuit Breaker Threshold (%)</label>
              <div className="control">
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={circuitBreakerThreshold}
                  onChange={(e) => setCircuitBreakerThreshold(Number(e.target.value))}
                  aria-label="Circuit breaker error rate threshold"
                />
              </div>
              <p className="help liquid-glass-text">Opens at {circuitBreakerThreshold}% error rate</p>
            </div>
          </div>
          <div className="column is-one-third-tablet is-half-mobile">
            <div className="field">
              <label className="label liquid-glass-text">Target Latency (ms)</label>
              <div className="control">
                <input
                  className="input"
                  type="number"
                  min="10"
                  max="500"
                  step="10"
                  value={targetLatency}
                  onChange={(e) => setTargetLatency(Number(e.target.value))}
                  aria-label="Target latency in milliseconds"
                />
              </div>
              <p className="help liquid-glass-text">Auto-scaling target: {targetLatency}ms</p>
            </div>
          </div>
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
                  checked={autoScalingEnabled}
                  onChange={(e) => setAutoScalingEnabled(e.target.checked)}
                  aria-label="Enable auto scaling"
                />
                {" "}Auto Scaling
              </label>
            </div>
          </div>
          <div className="column is-one-third-tablet is-half-mobile">
            <div className="field">
              <div className="control">
                <button
                  className="button is-primary"
                  onClick={() => {
                    // Trigger a test request to each service
                    services.forEach(service => {
                      if (service.type !== "database" && service.type !== "cache") {
                        simulateRequest(service.id);
                      }
                    });
                  }}
                  aria-label="Send test requests to all services"
                >
                  Send Test Requests
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture View */}
      {activeTab === "architecture" && (
        <div>
          <div className="is-flex is-justify-content-space-between is-align-items-center mb-4">
            <h3 className="title is-5 liquid-glass-text">Service Mesh Architecture</h3>
            <div className="tags">
              <span className="tag is-info">Istio Service Mesh</span>
              <span className="tag is-success">{services.filter(s => s.status === "healthy").length} Healthy</span>
              <span className="tag is-warning">{services.filter(s => s.status === "degraded").length} Degraded</span>
              <span className="tag is-danger">{services.filter(s => s.status === "down").length} Down</span>
            </div>
          </div>
          <div className="box liquid-glass-card">
            <svg
              ref={architectureRef}
              className="is-fullwidth"
              style={{ minHeight: isMobile ? "400px" : "500px", display: "block" }}
              aria-label="Service mesh architecture diagram"
            />
            {services.length === 0 && (
              <div className="has-text-centered py-6">
                <p className="liquid-glass-text">Loading architecture diagram...</p>
              </div>
            )}
          </div>
          <div className="columns is-multiline mt-4">
            {services.map(service => {
              const manual = manualServiceControl.get(service.id);
              return (
                <div key={service.id} className="column is-one-third-tablet is-half-mobile">
                  <div className="box liquid-glass-card">
                    <div className="is-flex is-justify-content-space-between is-align-items-center mb-2">
                      <h4 className="title is-6 liquid-glass-text">{service.name}</h4>
                      <span className={`tag ${
                        service.status === "healthy" ? "is-success" :
                        service.status === "degraded" ? "is-warning" : "is-danger"
                      }`}>
                        {service.status}
                      </span>
                    </div>
                    <div className="content is-small liquid-glass-text">
                      <p><strong>Region:</strong> {service.region}</p>
                      <p><strong>Requests:</strong> {Math.floor(service.requests).toLocaleString()}/min</p>
                      <p><strong>Latency:</strong> {service.latency.toFixed(1)}ms</p>
                      <p><strong>Error Rate:</strong> {service.errorRate.toFixed(2)}%</p>
                      <p><strong>Connections:</strong> {service.connections}</p>
                    </div>
                    <div className="field is-grouped mt-3">
                      <div className="control">
                        <button
                          className="button is-small is-primary"
                          onClick={() => simulateRequest(service.id)}
                          aria-label={`Send test request to ${service.name}`}
                        >
                          Test Request
                        </button>
                      </div>
                      <div className="control">
                        <div className="select is-small">
                          <select
                            value={manual?.forceStatus || "auto"}
                            onChange={(e) => {
                              const newControl = new Map(manualServiceControl);
                              if (e.target.value === "auto") {
                                newControl.delete(service.id);
                              } else {
                                newControl.set(service.id, {
                                  multiplier: manual?.multiplier || 1.0,
                                  forceStatus: e.target.value as ServiceNode["status"],
                                });
                              }
                              setManualServiceControl(newControl);
                            }}
                            aria-label={`Set status for ${service.name}`}
                          >
                            <option value="auto">Auto</option>
                            <option value="healthy">Force Healthy</option>
                            <option value="degraded">Force Degraded</option>
                            <option value="down">Force Down</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="field mt-2">
                      <label className="label is-small liquid-glass-text">Traffic Multiplier</label>
                      <div className="control">
                        <input
                          className="input is-small"
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          value={manual?.multiplier || 1.0}
                          onChange={(e) => {
                            const newControl = new Map(manualServiceControl);
                            newControl.set(service.id, {
                              multiplier: Number(e.target.value),
                              forceStatus: manual?.forceStatus,
                            });
                            setManualServiceControl(newControl);
                          }}
                          aria-label={`Traffic multiplier for ${service.name}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Circuit Breaker View */}
      {activeTab === "circuit-breaker" && (
        <div>
          <h3 className="title is-5 mb-4 liquid-glass-text">Circuit Breaker States</h3>
          <div className="columns is-multiline">
            {Array.from(circuitBreakers.entries()).map(([serviceId, breaker]) => {
              const service = services.find(s => s.id === serviceId);
              if (!service) return null;
              
              const stateColor = breaker.state === "closed" ? "is-success" :
                                breaker.state === "open" ? "is-danger" : "is-warning";
              
              return (
                <div key={serviceId} className="column is-one-third-tablet is-half-mobile">
                  <div className="box liquid-glass-card">
                    <h4 className="title is-6 liquid-glass-text">{service.name}</h4>
                    <div className="mb-3">
                      <span className={`tag ${stateColor} is-medium`}>
                        {breaker.state.toUpperCase()}
                      </span>
                    </div>
                    <div className="content is-small liquid-glass-text">
                      <p><strong>Failures:</strong> {breaker.failureCount}</p>
                      <p><strong>Successes:</strong> {breaker.successCount}</p>
                      <p><strong>Service Status:</strong> {service.status}</p>
                      <p><strong>Error Rate:</strong> {service.errorRate.toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tracing View */}
      {activeTab === "tracing" && (
        <div>
          <div className="is-flex is-justify-content-space-between is-align-items-center mb-4">
            <h3 className="title is-5 liquid-glass-text">Distributed Tracing (OpenTelemetry)</h3>
            <div className="tags">
              <span className="tag is-info">{traces.length} Total Traces</span>
              <span className="tag is-success">
                {traces.filter(t => t.status === "success").length} Success
              </span>
              <span className="tag is-danger">
                {traces.filter(t => t.status === "error").length} Errors
              </span>
            </div>
          </div>
          <div className="box liquid-glass-card">
            {traces.length === 0 ? (
              <div className="has-text-centered py-6">
                <p className="liquid-glass-text">No traces yet. Traces will appear as requests are processed.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table is-fullwidth">
                  <thead>
                    <tr>
                      <th className="liquid-glass-text">Trace ID</th>
                      <th className="liquid-glass-text">Service</th>
                      <th className="liquid-glass-text">Operation</th>
                      <th className="liquid-glass-text">Duration (ms)</th>
                      <th className="liquid-glass-text">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {traces.slice(-10).reverse().map(trace => {
                      const service = services.find(s => s.id === trace.serviceId);
                      return (
                        <tr key={trace.id}>
                          <td className="liquid-glass-text">
                            <code className="is-size-7">{trace.id.substring(0, 20)}...</code>
                          </td>
                          <td className="liquid-glass-text">{service?.name || "Unknown"}</td>
                          <td className="liquid-glass-text">{trace.operation}</td>
                          <td className="liquid-glass-text">{trace.duration.toFixed(2)}</td>
                          <td>
                            <span className={`tag ${trace.status === "success" ? "is-success" : "is-danger"}`}>
                              {trace.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auto Scaling View */}
      {activeTab === "scaling" && (
        <div>
          <div className="is-flex is-justify-content-space-between is-align-items-center mb-4">
            <h3 className="title is-5 liquid-glass-text">Auto-Scaling Metrics</h3>
            <div className="tags">
              <span className="tag is-info">
                {Array.from(scalingMetrics.values()).reduce((sum, m) => sum + m.currentReplicas, 0)} Total Replicas
              </span>
              <span className={`tag ${autoScalingEnabled ? "is-success" : "is-light"}`}>
                {autoScalingEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
          <div className="columns is-multiline">
            {Array.from(scalingMetrics.entries()).map(([serviceId, metric]) => {
              const service = services.find(s => s.id === serviceId);
              if (!service) return null;
              
              const needsScaling = metric.currentReplicas !== metric.targetReplicas;
              const scalingDirection = metric.targetReplicas > metric.currentReplicas ? "up" : "down";
              
              return (
                <div key={serviceId} className="column is-one-third-tablet is-half-mobile">
                  <div className="box liquid-glass-card">
                    <div className="is-flex is-justify-content-space-between is-align-items-center mb-2">
                      <h4 className="title is-6 liquid-glass-text">{service.name}</h4>
                      {needsScaling && autoScalingEnabled && (
                        <span className={`tag ${scalingDirection === "up" ? "is-success" : "is-warning"}`}>
                          Scaling {scalingDirection}
                        </span>
                      )}
                    </div>
                    <div className="content liquid-glass-text">
                      <p><strong>Current Replicas:</strong> {metric.currentReplicas}</p>
                      <p><strong>Target Replicas:</strong> {metric.targetReplicas}</p>
                      <p><strong>CPU Usage:</strong> {metric.cpuUsage.toFixed(1)}%</p>
                      <p><strong>Memory Usage:</strong> {metric.memoryUsage.toFixed(1)}%</p>
                      <p><strong>Request Rate:</strong> {metric.requestRate.toFixed(0)}/sec</p>
                      <p><strong>Target Latency:</strong> {targetLatency}ms</p>
                      <p><strong>Current Latency:</strong> {service.latency.toFixed(1)}ms</p>
                      <progress
                        className="progress is-info"
                        value={metric.cpuUsage}
                        max="100"
                        aria-label={`CPU usage: ${metric.cpuUsage.toFixed(1)}%`}
                      >
                        {metric.cpuUsage.toFixed(1)}%
                      </progress>
                      <progress
                        className="progress is-success mt-2"
                        value={metric.memoryUsage}
                        max="100"
                        aria-label={`Memory usage: ${metric.memoryUsage.toFixed(1)}%`}
                      >
                        {metric.memoryUsage.toFixed(1)}%
                      </progress>
                    </div>
                    {!autoScalingEnabled && (
                      <div className="field mt-3">
                        <div className="control">
                          <button
                            className="button is-small"
                            onClick={() => {
                              setScalingMetrics(prev => {
                                const updated = new Map(prev);
                                const current = updated.get(serviceId);
                                if (current) {
                                  updated.set(serviceId, {
                                    ...current,
                                    targetReplicas: current.targetReplicas + 1,
                                  });
                                }
                                return updated;
                              });
                            }}
                            aria-label={`Scale up ${service.name}`}
                          >
                            Scale Up
                          </button>
                          <button
                            className="button is-small ml-2"
                            onClick={() => {
                              setScalingMetrics(prev => {
                                const updated = new Map(prev);
                                const current = updated.get(serviceId);
                                if (current && current.targetReplicas > 1) {
                                  updated.set(serviceId, {
                                    ...current,
                                    targetReplicas: current.targetReplicas - 1,
                                  });
                                }
                                return updated;
                              });
                            }}
                            aria-label={`Scale down ${service.name}`}
                          >
                            Scale Down
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Metrics View */}
      {activeTab === "metrics" && (
        <div>
          <h3 className="title is-5 mb-4 liquid-glass-text">Performance Metrics</h3>
          <div className="columns is-multiline">
            <div className="column is-one-quarter-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-info-light">
                <p className="heading liquid-glass-text">P95 Latency</p>
                <p className="title is-4 liquid-glass-text">{p95Latency.toFixed(1)}ms</p>
                <p className="is-size-7 liquid-glass-text">Target: &lt;100ms</p>
              </div>
            </div>
            <div className="column is-one-quarter-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-success-light">
                <p className="heading liquid-glass-text">P99 Latency</p>
                <p className="title is-4 liquid-glass-text">{p99Latency.toFixed(1)}ms</p>
                <p className="is-size-7 liquid-glass-text">Target: &lt;200ms</p>
              </div>
            </div>
            <div className="column is-one-quarter-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-warning-light">
                <p className="heading liquid-glass-text">Total Requests</p>
                <p className="title is-4 liquid-glass-text">{(totalRequests / 1000).toFixed(1)}K/min</p>
                <p className="is-size-7 liquid-glass-text">10M+ requests/day</p>
              </div>
            </div>
            <div className="column is-one-quarter-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-danger-light">
                <p className="heading liquid-glass-text">Error Rate</p>
                <p className="title is-4 liquid-glass-text">{errorRate.toFixed(2)}%</p>
                <p className="is-size-7 liquid-glass-text">Target: &lt;0.1%</p>
              </div>
            </div>
            <div className="column is-one-quarter-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-primary-light">
                <p className="heading liquid-glass-text">Uptime</p>
                <p className="title is-4 liquid-glass-text">{uptime.toFixed(2)}%</p>
                <p className="is-size-7 liquid-glass-text">SLA: 99.9%</p>
              </div>
            </div>
          </div>
          
          {/* Recent Requests */}
          <div className="box liquid-glass-card mt-4">
            <h4 className="title is-6 mb-4 liquid-glass-text">Recent Requests</h4>
            {recentRequests.length === 0 ? (
              <p className="liquid-glass-text">No requests yet. Use controls above to send requests.</p>
            ) : (
              <div className="table-container">
                <table className="table is-fullwidth is-striped">
                  <thead>
                    <tr>
                      <th className="liquid-glass-text">Request ID</th>
                      <th className="liquid-glass-text">Service</th>
                      <th className="liquid-glass-text">Latency (ms)</th>
                      <th className="liquid-glass-text">Status</th>
                      <th className="liquid-glass-text">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.slice(-20).reverse().map(req => {
                      const service = services.find(s => s.id === req.serviceId);
                      return (
                        <tr key={req.id}>
                          <td className="liquid-glass-text">
                            <code className="is-size-7">{req.id.substring(0, 15)}...</code>
                          </td>
                          <td className="liquid-glass-text">{service?.name || "Unknown"}</td>
                          <td className="liquid-glass-text">{req.latency.toFixed(1)}</td>
                          <td>
                            <span className={`tag ${req.status === "success" ? "is-success" : "is-danger"}`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="liquid-glass-text">
                            {new Date(req.timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Service Health Summary */}
          <div className="box liquid-glass-card mt-4">
            <h4 className="title is-6 mb-4 liquid-glass-text">Service Health Summary</h4>
            <div className="columns is-multiline">
              {services.map(service => (
                <div key={service.id} className="column is-one-third-tablet is-half-mobile">
                  <div className="box liquid-glass-card">
                    <div className="is-flex is-justify-content-space-between is-align-items-center mb-2">
                      <h5 className="title is-6 liquid-glass-text">{service.name}</h5>
                      <span className={`tag ${
                        service.status === "healthy" ? "is-success" :
                        service.status === "degraded" ? "is-warning" : "is-danger"
                      }`}>
                        {service.status}
                      </span>
                    </div>
                    <div className="content is-small liquid-glass-text">
                      <p><strong>Latency:</strong> {service.latency.toFixed(1)}ms</p>
                      <p><strong>Requests:</strong> {Math.floor(service.requests).toLocaleString()}/min</p>
                      <p><strong>Error Rate:</strong> {service.errorRate.toFixed(2)}%</p>
                      <progress
                        className="progress is-info"
                        value={100 - service.errorRate * 10}
                        max="100"
                        aria-label={`Health: ${100 - service.errorRate * 10}%`}
                      >
                        {(100 - service.errorRate * 10).toFixed(0)}%
                      </progress>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

