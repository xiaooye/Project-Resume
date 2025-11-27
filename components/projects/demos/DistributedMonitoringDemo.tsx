"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import * as d3 from "d3";
import { Project } from "@/types";

interface ServiceMetric {
  serviceId: string;
  serviceName: string;
  timestamp: number;
  requests: number;
  latency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  throughput: number;
  cpuUsage: number;
  memoryUsage: number;
  status: "healthy" | "degraded" | "down";
}

interface Anomaly {
  id: string;
  serviceId: string;
  type: "latency-spike" | "error-rate-increase" | "throughput-drop" | "resource-exhaustion";
  severity: "low" | "medium" | "high" | "critical";
  timestamp: number;
  value: number;
  threshold: number;
  description: string;
}

interface SLAMetric {
  serviceId: string;
  serviceName: string;
  targetSLA: number; // e.g., 99.9
  currentSLA: number;
  uptime: number;
  availability: number;
  compliance: boolean;
}

export default function DistributedMonitoringDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "metrics" | "anomalies" | "sla">("overview");
  
  // Services state
  const [services, setServices] = useState<ServiceMetric[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [slaMetrics, setSlaMetrics] = useState<SLAMetric[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  
  // Time series data for charts
  const [timeSeriesData, setTimeSeriesData] = useState<Map<string, Array<{ timestamp: number; value: number }>>>(new Map());
  
  // Controls
  const [simulationEnabled, setSimulationEnabled] = useState(true);
  const [anomalyDetectionEnabled, setAnomalyDetectionEnabled] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(5); // error rate %
  
  const svgRef = useRef<SVGSVGElement>(null);
  const metricsChartRef = useRef<SVGSVGElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize services
  const initializeServices = useCallback(() => {
    const serviceNames = [
      "User Service", "Order Service", "Payment Service", "Inventory Service",
      "Notification Service", "Analytics Service", "API Gateway", "Database"
    ];
    
    const newServices: ServiceMetric[] = serviceNames.map((name, index) => ({
      serviceId: `service-${index}`,
      serviceName: name,
      timestamp: Date.now(),
      requests: Math.floor(Math.random() * 5000) + 1000,
      latency: Math.random() * 50 + 20,
      p95Latency: Math.random() * 80 + 40,
      p99Latency: Math.random() * 120 + 60,
      errorRate: Math.random() * 1,
      throughput: Math.random() * 1000 + 500,
      cpuUsage: Math.random() * 60 + 20,
      memoryUsage: Math.random() * 70 + 30,
      status: Math.random() > 0.1 ? "healthy" : Math.random() > 0.5 ? "degraded" : "down",
    }));
    
    setServices(newServices);
    
    // Initialize SLA metrics
    const sla: SLAMetric[] = newServices.map(service => ({
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      targetSLA: 99.9,
      currentSLA: 99.5 + Math.random() * 0.4,
      uptime: 99.5 + Math.random() * 0.4,
      availability: 99.5 + Math.random() * 0.4,
      compliance: Math.random() > 0.2,
    }));
    setSlaMetrics(sla);
  }, []);

  // Detect anomalies
  const detectAnomalies = useCallback(() => {
    if (!anomalyDetectionEnabled) return;
    
    const newAnomalies: Anomaly[] = [];
    
    services.forEach(service => {
      // Latency spike detection
      if (service.p95Latency > 200) {
        newAnomalies.push({
          id: `anomaly-${Date.now()}-${Math.random()}`,
          serviceId: service.serviceId,
          type: "latency-spike",
          severity: service.p95Latency > 500 ? "critical" : service.p95Latency > 300 ? "high" : "medium",
          timestamp: Date.now(),
          value: service.p95Latency,
          threshold: 200,
          description: `P95 latency spike detected: ${service.p95Latency.toFixed(1)}ms`,
        });
      }
      
      // Error rate increase
      if (service.errorRate > alertThreshold) {
        newAnomalies.push({
          id: `anomaly-${Date.now()}-${Math.random()}`,
          serviceId: service.serviceId,
          type: "error-rate-increase",
          severity: service.errorRate > alertThreshold * 2 ? "critical" : "high",
          timestamp: Date.now(),
          value: service.errorRate,
          threshold: alertThreshold,
          description: `Error rate increased: ${service.errorRate.toFixed(2)}%`,
        });
      }
      
      // Throughput drop
      if (service.throughput < 200) {
        newAnomalies.push({
          id: `anomaly-${Date.now()}-${Math.random()}`,
          serviceId: service.serviceId,
          type: "throughput-drop",
          severity: service.throughput < 100 ? "critical" : "medium",
          timestamp: Date.now(),
          value: service.throughput,
          threshold: 200,
          description: `Throughput dropped: ${service.throughput.toFixed(0)} req/s`,
        });
      }
      
      // Resource exhaustion
      if (service.cpuUsage > 90 || service.memoryUsage > 90) {
        newAnomalies.push({
          id: `anomaly-${Date.now()}-${Math.random()}`,
          serviceId: service.serviceId,
          type: "resource-exhaustion",
          severity: "high",
          timestamp: Date.now(),
          value: Math.max(service.cpuUsage, service.memoryUsage),
          threshold: 90,
          description: `Resource exhaustion: CPU ${service.cpuUsage.toFixed(1)}%, Memory ${service.memoryUsage.toFixed(1)}%`,
        });
      }
    });
    
    if (newAnomalies.length > 0) {
      setAnomalies(prev => [...prev.slice(-50), ...newAnomalies]);
    }
  }, [services, anomalyDetectionEnabled, alertThreshold]);

  // Update metrics
  const updateMetrics = useCallback(() => {
    if (!simulationEnabled) return;
    
    setServices(prev => prev.map(service => {
      const variation = (Math.random() - 0.5) * 0.2;
      const newRequests = Math.max(0, service.requests * (1 + variation));
      const newLatency = Math.max(10, service.latency + (Math.random() - 0.5) * 10);
      const newP95 = Math.max(newLatency, service.p95Latency + (Math.random() - 0.5) * 15);
      const newP99 = Math.max(newP95, service.p99Latency + (Math.random() - 0.5) * 20);
      const newErrorRate = Math.min(5, Math.max(0, service.errorRate + (Math.random() - 0.5) * 0.3));
      const newThroughput = Math.max(0, service.throughput + (Math.random() - 0.5) * 100);
      const newCpu = Math.min(100, Math.max(0, service.cpuUsage + (Math.random() - 0.5) * 5));
      const newMemory = Math.min(100, Math.max(0, service.memoryUsage + (Math.random() - 0.5) * 3));
      
      let newStatus: ServiceMetric["status"] = "healthy";
      if (newErrorRate > alertThreshold || newP95 > 300 || newCpu > 90) {
        newStatus = "down";
      } else if (newErrorRate > alertThreshold / 2 || newP95 > 200 || newCpu > 70) {
        newStatus = "degraded";
      }
      
      // Update time series data
      const serviceKey = service.serviceId;
      setTimeSeriesData(prev => {
        const updated = new Map(prev);
        const existing = updated.get(serviceKey) || [];
        const newData = [...existing.slice(-29), { timestamp: Date.now(), value: newLatency }];
        updated.set(serviceKey, newData);
        return updated;
      });
      
      return {
        ...service,
        timestamp: Date.now(),
        requests: newRequests,
        latency: newLatency,
        p95Latency: newP95,
        p99Latency: newP99,
        errorRate: newErrorRate,
        throughput: newThroughput,
        cpuUsage: newCpu,
        memoryUsage: newMemory,
        status: newStatus,
      };
    }));
    
    // Update SLA metrics
    setSlaMetrics(prev => prev.map(sla => {
      const service = services.find(s => s.serviceId === sla.serviceId);
      if (!service) return sla;
      
      const availability = service.status === "down" ? 95 + Math.random() * 2 : 99.5 + Math.random() * 0.4;
      const currentSLA = availability;
      const compliance = currentSLA >= sla.targetSLA;
      
      return {
        ...sla,
        currentSLA,
        uptime: availability,
        availability,
        compliance,
      };
    }));
  }, [simulationEnabled, services, alertThreshold]);

  // Render metrics chart
  const renderMetricsChart = useCallback(() => {
    if (!metricsChartRef.current || !selectedService) return;
    
    const data = timeSeriesData.get(selectedService) || [];
    if (data.length === 0) return;
    
    const svg = d3.select(metricsChartRef.current);
    svg.selectAll("*").remove();
    
    const container = metricsChartRef.current.parentElement;
    const width = container?.clientWidth || 800;
    const height = isMobile ? 200 : 300;
    svg.attr("width", width).attr("height", height);
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.timestamp) as [number, number])
      .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 100] as [number, number])
      .nice()
      .range([innerHeight, 0]);
    
    const line = d3.line<{ timestamp: number; value: number }>()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);
    
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#6366f1")
      .attr("stroke-width", 2)
      .attr("d", line);
    
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%H:%M:%S") as any));
    
    g.append("g")
      .call(d3.axisLeft(yScale));
    
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .text("Latency (ms)");
  }, [selectedService, timeSeriesData, isMobile]);

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
      detectAnomalies();
    }, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMounted, simulationEnabled, updateMetrics, detectAnomalies]);

  useEffect(() => {
    if (activeTab === "metrics" && selectedService) {
      renderMetricsChart();
    }
  }, [activeTab, selectedService, renderMetricsChart, timeSeriesData]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="box liquid-glass-card">
      {/* Tabs */}
      <div className="tabs is-boxed mb-4">
        <ul>
          <li className={activeTab === "overview" ? "is-active" : ""}>
            <a
              onClick={() => setActiveTab("overview")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveTab("overview");
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Overview view"
            >
              Overview
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
              aria-label="Metrics view"
            >
              Metrics
            </a>
          </li>
          <li className={activeTab === "anomalies" ? "is-active" : ""}>
            <a
              onClick={() => setActiveTab("anomalies")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveTab("anomalies");
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Anomaly detection view"
            >
              Anomalies ({anomalies.length})
            </a>
          </li>
          <li className={activeTab === "sla" ? "is-active" : ""}>
            <a
              onClick={() => setActiveTab("sla")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveTab("sla");
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="SLA monitoring view"
            >
              SLA Monitoring
            </a>
          </li>
        </ul>
      </div>

      {/* Controls */}
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
                  checked={anomalyDetectionEnabled}
                  onChange={(e) => setAnomalyDetectionEnabled(e.target.checked)}
                  aria-label="Enable anomaly detection"
                />
                {" "}Anomaly Detection
              </label>
            </div>
          </div>
          <div className="column is-one-third-tablet is-half-mobile">
            <div className="field">
              <label className="label liquid-glass-text">Alert Threshold (%)</label>
              <div className="control">
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(Number(e.target.value))}
                  aria-label="Alert threshold percentage"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div>
          <h3 className="title is-5 mb-4 liquid-glass-text">Service Overview</h3>
          <div className="columns is-multiline">
            {services.map(service => (
              <div key={service.serviceId} className="column is-one-third-tablet is-half-mobile">
                <div className="box liquid-glass-card">
                  <div className="is-flex is-justify-content-space-between is-align-items-center mb-2">
                    <h4 className="title is-6 liquid-glass-text">{service.serviceName}</h4>
                    <span className={`tag ${
                      service.status === "healthy" ? "is-success" :
                      service.status === "degraded" ? "is-warning" : "is-danger"
                    }`}>
                      {service.status}
                    </span>
                  </div>
                  <div className="content is-small liquid-glass-text">
                    <p><strong>Requests:</strong> {Math.floor(service.requests).toLocaleString()}/min</p>
                    <p><strong>Latency:</strong> {service.latency.toFixed(1)}ms</p>
                    <p><strong>P95:</strong> {service.p95Latency.toFixed(1)}ms</p>
                    <p><strong>P99:</strong> {service.p99Latency.toFixed(1)}ms</p>
                    <p><strong>Error Rate:</strong> {service.errorRate.toFixed(2)}%</p>
                    <p><strong>Throughput:</strong> {service.throughput.toFixed(0)} req/s</p>
                    <p><strong>CPU:</strong> {service.cpuUsage.toFixed(1)}%</p>
                    <p><strong>Memory:</strong> {service.memoryUsage.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === "metrics" && (
        <div>
          <h3 className="title is-5 mb-4 liquid-glass-text">Performance Metrics</h3>
          <div className="field mb-4">
            <label className="label liquid-glass-text">Select Service</label>
            <div className="control">
              <div className="select is-fullwidth">
                <select
                  value={selectedService || ""}
                  onChange={(e) => setSelectedService(e.target.value || null)}
                  aria-label="Select service to view metrics"
                >
                  <option value="">Select a service...</option>
                  {services.map(service => (
                    <option key={service.serviceId} value={service.serviceId}>
                      {service.serviceName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {selectedService && (
            <div className="box liquid-glass-card">
              <svg
                ref={metricsChartRef}
                className="is-fullwidth"
                style={{ minHeight: isMobile ? "200px" : "300px", display: "block" }}
                aria-label="Latency time series chart"
              />
            </div>
          )}
        </div>
      )}

      {/* Anomalies Tab */}
      {activeTab === "anomalies" && (
        <div>
          <h3 className="title is-5 mb-4 liquid-glass-text">Anomaly Detection</h3>
          {anomalies.length === 0 ? (
            <div className="box liquid-glass-card">
              <p className="liquid-glass-text has-text-centered">No anomalies detected.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table is-fullwidth liquid-glass-card">
                <thead>
                  <tr>
                    <th className="liquid-glass-text">Time</th>
                    <th className="liquid-glass-text">Service</th>
                    <th className="liquid-glass-text">Type</th>
                    <th className="liquid-glass-text">Severity</th>
                    <th className="liquid-glass-text">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {anomalies.slice(-20).reverse().map(anomaly => {
                    const service = services.find(s => s.serviceId === anomaly.serviceId);
                    const severityColor = 
                      anomaly.severity === "critical" ? "is-danger" :
                      anomaly.severity === "high" ? "is-warning" :
                      anomaly.severity === "medium" ? "is-info" : "is-light";
                    
                    return (
                      <tr key={anomaly.id}>
                        <td className="liquid-glass-text">
                          {new Date(anomaly.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="liquid-glass-text">{service?.serviceName || "Unknown"}</td>
                        <td className="liquid-glass-text">{anomaly.type}</td>
                        <td>
                          <span className={`tag ${severityColor}`}>
                            {anomaly.severity}
                          </span>
                        </td>
                        <td className="liquid-glass-text">{anomaly.description}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SLA Tab */}
      {activeTab === "sla" && (
        <div>
          <h3 className="title is-5 mb-4 liquid-glass-text">SLA Monitoring</h3>
          <div className="columns is-multiline">
            {slaMetrics.map(sla => (
              <div key={sla.serviceId} className="column is-one-third-tablet is-half-mobile">
                <div className="box liquid-glass-card">
                  <h4 className="title is-6 liquid-glass-text">{sla.serviceName}</h4>
                  <div className="content liquid-glass-text">
                    <p><strong>Target SLA:</strong> {sla.targetSLA}%</p>
                    <p><strong>Current SLA:</strong> {sla.currentSLA.toFixed(2)}%</p>
                    <p><strong>Uptime:</strong> {sla.uptime.toFixed(2)}%</p>
                    <p><strong>Availability:</strong> {sla.availability.toFixed(2)}%</p>
                    <p className="mt-3">
                      <span className={`tag ${sla.compliance ? "is-success" : "is-danger"}`}>
                        {sla.compliance ? "Compliant" : "Non-Compliant"}
                      </span>
                    </p>
                    <progress
                      className="progress is-info mt-3"
                      value={sla.currentSLA}
                      max="100"
                      aria-label={`SLA: ${sla.currentSLA.toFixed(2)}%`}
                    >
                      {sla.currentSLA.toFixed(2)}%
                    </progress>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

