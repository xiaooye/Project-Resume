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

  // Update metrics
  const updateMetrics = useCallback(() => {
    setServices(prev => prev.map(service => {
      const baseRequests = service.requests;
      const variation = (Math.random() - 0.5) * 0.2;
      const newRequests = Math.max(0, baseRequests * (1 + variation));
      
      const baseLatency = service.latency;
      const latencyVariation = (Math.random() - 0.5) * 20;
      const newLatency = Math.max(10, baseLatency + latencyVariation);
      
      const newErrorRate = Math.min(5, Math.max(0, service.errorRate + (Math.random() - 0.5) * 0.5));
      
      // Update status based on error rate and latency
      let newStatus: ServiceNode["status"] = "healthy";
      if (newErrorRate > 3 || newLatency > 150) {
        newStatus = "down";
      } else if (newErrorRate > 1 || newLatency > 100) {
        newStatus = "degraded";
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

    // Update circuit breakers
    setCircuitBreakers(prev => {
      const updated = new Map(prev);
      updated.forEach((breaker, serviceId) => {
        const service = services.find(s => s.id === serviceId);
        if (service) {
          if (service.errorRate > 5 && breaker.state === "closed") {
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
          } else if (breaker.state === "half-open" && service.errorRate < 1) {
            updated.set(serviceId, {
              ...breaker,
              state: "closed",
              successCount: breaker.successCount + 1,
              failureCount: 0,
            });
          } else if (service.errorRate < 1) {
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
    setScalingMetrics(prev => {
      const updated = new Map(prev);
      updated.forEach((metric, serviceId) => {
        const service = services.find(s => s.id === serviceId);
        if (service) {
          const targetReplicas = Math.ceil(service.requests / 2000);
          updated.set(serviceId, {
            ...metric,
            currentReplicas: metric.currentReplicas + (targetReplicas > metric.targetReplicas ? 1 : -1),
            targetReplicas: Math.max(2, Math.min(10, targetReplicas)),
            cpuUsage: Math.min(100, metric.cpuUsage + (Math.random() - 0.5) * 10),
            memoryUsage: Math.min(100, metric.memoryUsage + (Math.random() - 0.5) * 5),
            requestRate: service.requests / 60,
          });
        }
      });
      return updated;
    });

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
  }, [services]);

  // Generate trace
  const generateTrace = useCallback(() => {
    const newTrace: TraceSpan[] = [];
    const startTime = Date.now();
    let currentTime = startTime;

    // Gateway -> API -> Services -> Database
    const gatewaySpan: TraceSpan = {
      id: "trace-1",
      serviceId: "service-0",
      operation: "GET /api/orders",
      startTime: currentTime,
      duration: 50 + Math.random() * 30,
      status: "success",
    };
    currentTime += gatewaySpan.duration;
    newTrace.push(gatewaySpan);

    const apiSpan: TraceSpan = {
      id: "trace-2",
      serviceId: "service-1",
      operation: "Process Request",
      startTime: startTime + 10,
      duration: 30 + Math.random() * 20,
      status: "success",
      parentId: gatewaySpan.id,
    };
    newTrace.push(apiSpan);

    const orderSpan: TraceSpan = {
      id: "trace-3",
      serviceId: "service-2",
      operation: "Get Order",
      startTime: startTime + 20,
      duration: 20 + Math.random() * 15,
      status: "success",
      parentId: apiSpan.id,
    };
    newTrace.push(orderSpan);

    const dbSpan: TraceSpan = {
      id: "trace-4",
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

    const width = architectureRef.current.clientWidth || 800;
    const height = isMobile ? 400 : 500;
    svg.attr("width", width).attr("height", height);

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

    // Draw connections
    gateway.forEach(gw => {
      apis.forEach(api => {
        g.append("line")
          .attr("x1", nodePositions.get(gw.id)?.x || 0)
          .attr("y1", nodePositions.get(gw.id)?.y || 0)
          .attr("x2", nodePositions.get(api.id)?.x || 0)
          .attr("y2", nodePositions.get(api.id)?.y || 0)
          .attr("stroke", "#6366f1")
          .attr("stroke-width", 2)
          .attr("opacity", 0.3);
      });
    });

    apis.forEach(api => {
      serviceNodes.forEach(svc => {
        g.append("line")
          .attr("x1", nodePositions.get(api.id)?.x || 0)
          .attr("y1", nodePositions.get(api.id)?.y || 0)
          .attr("x2", nodePositions.get(svc.id)?.x || 0)
          .attr("y2", nodePositions.get(svc.id)?.y || 0)
          .attr("stroke", "#6366f1")
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.2);
      });
    });

    serviceNodes.forEach(svc => {
      databases.forEach(db => {
        g.append("line")
          .attr("x1", nodePositions.get(svc.id)?.x || 0)
          .attr("y1", nodePositions.get(svc.id)?.y || 0)
          .attr("x2", nodePositions.get(db.id)?.x || 0)
          .attr("y2", nodePositions.get(db.id)?.y || 0)
          .attr("stroke", "#10b981")
          .attr("stroke-width", 1)
          .attr("opacity", 0.2);
      });
    });

    // Draw nodes
    services.forEach(service => {
      const pos = nodePositions.get(service.id);
      if (!pos) return;

      const color = service.status === "healthy" ? "#10b981" : 
                   service.status === "degraded" ? "#f59e0b" : "#ef4444";
      
      g.append("circle")
        .attr("cx", pos.x)
        .attr("cy", pos.y)
        .attr("r", isMobile ? 15 : 20)
        .attr("fill", color)
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);

      g.append("text")
        .attr("x", pos.x)
        .attr("y", pos.y + (isMobile ? 25 : 30))
        .attr("text-anchor", "middle")
        .attr("font-size", isMobile ? "10px" : "12px")
        .attr("fill", "currentColor")
        .text(service.name.split(" ")[0]);
    });
  }, [services, isMobile]);

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
    if (!isMounted) return;

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
  }, [isMounted, updateMetrics, generateTrace]);

  useEffect(() => {
    if (activeTab === "architecture" && isMounted) {
      renderArchitecture();
    }
  }, [activeTab, isMounted, renderArchitecture]);

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

      {/* Architecture View */}
      {activeTab === "architecture" && (
        <div>
          <h3 className="title is-5 mb-4 liquid-glass-text">Service Mesh Architecture</h3>
          <div className="box liquid-glass-card">
            <svg
              ref={architectureRef}
              className="is-fullwidth"
              style={{ minHeight: isMobile ? "400px" : "500px" }}
              aria-label="Service mesh architecture diagram"
            />
          </div>
          <div className="columns is-multiline mt-4">
            {services.map(service => (
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
                </div>
              </div>
            ))}
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
          <h3 className="title is-5 mb-4 liquid-glass-text">Distributed Tracing (OpenTelemetry)</h3>
          <div className="box liquid-glass-card">
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
                        <td className="liquid-glass-text">{trace.id}</td>
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
          </div>
        </div>
      )}

      {/* Auto Scaling View */}
      {activeTab === "scaling" && (
        <div>
          <h3 className="title is-5 mb-4 liquid-glass-text">Auto-Scaling Metrics</h3>
          <div className="columns is-multiline">
            {Array.from(scalingMetrics.entries()).map(([serviceId, metric]) => {
              const service = services.find(s => s.id === serviceId);
              if (!service) return null;
              
              return (
                <div key={serviceId} className="column is-one-third-tablet is-half-mobile">
                  <div className="box liquid-glass-card">
                    <h4 className="title is-6 liquid-glass-text">{service.name}</h4>
                    <div className="content liquid-glass-text">
                      <p><strong>Current Replicas:</strong> {metric.currentReplicas}</p>
                      <p><strong>Target Replicas:</strong> {metric.targetReplicas}</p>
                      <p><strong>CPU Usage:</strong> {metric.cpuUsage.toFixed(1)}%</p>
                      <p><strong>Memory Usage:</strong> {metric.memoryUsage.toFixed(1)}%</p>
                      <p><strong>Request Rate:</strong> {metric.requestRate.toFixed(0)}/sec</p>
                      <progress
                        className="progress is-info"
                        value={metric.cpuUsage}
                        max="100"
                        aria-label={`CPU usage: ${metric.cpuUsage.toFixed(1)}%`}
                      >
                        {metric.cpuUsage.toFixed(1)}%
                      </progress>
                    </div>
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
              </div>
            </div>
            <div className="column is-one-quarter-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-success-light">
                <p className="heading liquid-glass-text">P99 Latency</p>
                <p className="title is-4 liquid-glass-text">{p99Latency.toFixed(1)}ms</p>
              </div>
            </div>
            <div className="column is-one-quarter-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-warning-light">
                <p className="heading liquid-glass-text">Total Requests</p>
                <p className="title is-4 liquid-glass-text">{(totalRequests / 1000).toFixed(1)}K/min</p>
              </div>
            </div>
            <div className="column is-one-quarter-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-danger-light">
                <p className="heading liquid-glass-text">Error Rate</p>
                <p className="title is-4 liquid-glass-text">{errorRate.toFixed(2)}%</p>
              </div>
            </div>
            <div className="column is-one-quarter-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-primary-light">
                <p className="heading liquid-glass-text">Uptime</p>
                <p className="title is-4 liquid-glass-text">{uptime.toFixed(2)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

