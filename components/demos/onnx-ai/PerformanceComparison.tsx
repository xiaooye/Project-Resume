"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface BackendPerformance {
  backend: "webgpu" | "webgl" | "wasm" | "cpu";
  inferenceTime: number;
  throughput: number;
  timestamp: number;
}

interface PerformanceComparisonProps {
  performanceHistory: BackendPerformance[];
  currentBackend: "webgpu" | "webgl" | "wasm" | "cpu" | "unknown";
  onBenchmark?: () => Promise<void>;
  isBenchmarking?: boolean;
}

export default function PerformanceComparison({
  performanceHistory,
  currentBackend,
  onBenchmark,
  isBenchmarking = false,
}: PerformanceComparisonProps) {
  const [isMobile, setIsMobile] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Group performance by backend
  const backendStats = performanceHistory.reduce(
    (acc, perf) => {
      if (!acc[perf.backend]) {
        acc[perf.backend] = {
          times: [],
          throughputs: [],
        };
      }
      acc[perf.backend].times.push(perf.inferenceTime);
      acc[perf.backend].throughputs.push(perf.throughput);
      return acc;
    },
    {} as Record<string, { times: number[]; throughputs: number[] }>
  );

  // Calculate statistics for each backend
  const backendMetrics = Object.entries(backendStats).map(([backend, stats]) => {
    const avgTime = stats.times.reduce((a, b) => a + b, 0) / stats.times.length;
    const minTime = Math.min(...stats.times);
    const maxTime = Math.max(...stats.times);
    const avgThroughput = stats.throughputs.reduce((a, b) => a + b, 0) / stats.throughputs.length;
    const p95Time = stats.times.sort((a, b) => a - b)[Math.floor(stats.times.length * 0.95)] || avgTime;
    const p99Time = stats.times.sort((a, b) => a - b)[Math.floor(stats.times.length * 0.99)] || avgTime;

    return {
      backend: backend as "webgpu" | "webgl" | "wasm" | "cpu",
      avgTime,
      minTime,
      maxTime,
      p95Time,
      p99Time,
      avgThroughput,
      count: stats.times.length,
    };
  });

  // Sort by average time (faster first)
  backendMetrics.sort((a, b) => a.avgTime - b.avgTime);

  const getBackendLabel = (backend: string) => {
    const labels: Record<string, string> = {
      webgpu: "WebGPU",
      webgl: "WebGL",
      wasm: "WASM (CPU)",
      cpu: "CPU",
    };
    return labels[backend] || backend;
  };

  const getBackendColor = (backend: string) => {
    const colors: Record<string, string> = {
      webgpu: "is-success",
      webgl: "is-warning",
      wasm: "is-info",
      cpu: "is-light",
    };
    return colors[backend] || "is-light";
  };

  const getBackendIcon = (backend: string) => {
    const icons: Record<string, string> = {
      webgpu: "fa-microchip",
      webgl: "fa-cube",
      wasm: "fa-cog",
      cpu: "fa-server",
    };
    return icons[backend] || "fa-question";
  };

  if (performanceHistory.length === 0) {
    return (
      <div className="box">
        <h3 className="title is-5 mb-4">Performance Comparison</h3>
        <div className="content">
          <p className="has-text-grey">
            No performance data yet. Run some inferences to see performance metrics.
          </p>
          {onBenchmark && (
            <div className="field mt-4">
              <button
                className={`button is-primary ${isBenchmarking ? "is-loading" : ""}`}
                onClick={onBenchmark}
                disabled={isBenchmarking}
                aria-label="Run performance benchmark"
              >
                <span className="icon">
                  <i className="fas fa-tachometer-alt"></i>
                </span>
                <span>Run Benchmark</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="box">
      <div className="level mb-4">
        <div className="level-left">
          <div className="level-item">
            <h3 className="title is-5">Performance Comparison</h3>
          </div>
        </div>
        <div className="level-right">
          <div className="level-item">
            {onBenchmark && (
              <button
                className={`button is-small is-primary ${isBenchmarking ? "is-loading" : ""}`}
                onClick={onBenchmark}
                disabled={isBenchmarking}
                aria-label="Run performance benchmark"
              >
                <span className="icon is-small">
                  <i className="fas fa-tachometer-alt"></i>
                </span>
                <span>Benchmark</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Current Backend Indicator */}
      {currentBackend !== "unknown" && (
        <div className="notification is-info is-light mb-4">
          <p className="is-size-6">
            <strong>Current Backend:</strong>{" "}
            <span className={`tag ${getBackendColor(currentBackend)} is-medium`}>
              <span className="icon">
                <i className={`fas ${getBackendIcon(currentBackend)}`}></i>
              </span>
              <span>{getBackendLabel(currentBackend)}</span>
            </span>
          </p>
        </div>
      )}

      {/* Performance Metrics Table */}
      <div className="table-container">
        <table className="table is-fullwidth is-striped" role="table" aria-label="Performance comparison table">
          <thead>
            <tr>
              <th>Backend</th>
              <th>Avg Time (ms)</th>
              <th>Min Time (ms)</th>
              <th>P95 Time (ms)</th>
              <th>P99 Time (ms)</th>
              <th>Throughput (inf/sec)</th>
              <th>Samples</th>
            </tr>
          </thead>
          <tbody>
            {backendMetrics.map((metric) => (
              <motion.tr
                key={metric.backend}
                initial={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={currentBackend === metric.backend ? "has-background-info-light" : ""}
              >
                <td>
                  <span className={`tag ${getBackendColor(metric.backend)}`}>
                    <span className="icon">
                      <i className={`fas ${getBackendIcon(metric.backend)}`}></i>
                    </span>
                    <span>{getBackendLabel(metric.backend)}</span>
                    {currentBackend === metric.backend && (
                      <span className="ml-2">
                        <i className="fas fa-check-circle" aria-label="Current backend"></i>
                      </span>
                    )}
                  </span>
                </td>
                <td>
                  <strong>{metric.avgTime.toFixed(2)}</strong>
                </td>
                <td>{metric.minTime.toFixed(2)}</td>
                <td>{metric.p95Time.toFixed(2)}</td>
                <td>{metric.p99Time.toFixed(2)}</td>
                <td>{metric.avgThroughput.toFixed(2)}</td>
                <td>{metric.count}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visual Comparison - Bar Chart */}
      {backendMetrics.length > 0 && (
        <div className="mt-5">
          <h4 className="title is-6 mb-4">Average Inference Time Comparison</h4>
          <div className="content">
            {backendMetrics.map((metric) => {
              const maxTime = Math.max(...backendMetrics.map((m) => m.avgTime));
              const percentage = (metric.avgTime / maxTime) * 100;
              const isFastest = metric.avgTime === Math.min(...backendMetrics.map((m) => m.avgTime));

              return (
                <div key={metric.backend} className="mb-4">
                  <div className="level is-mobile mb-2">
                    <div className="level-left">
                      <div className="level-item">
                        <span className={`tag ${getBackendColor(metric.backend)}`}>
                          <span className="icon">
                            <i className={`fas ${getBackendIcon(metric.backend)}`}></i>
                          </span>
                          <span>{getBackendLabel(metric.backend)}</span>
                        </span>
                      </div>
                    </div>
                    <div className="level-right">
                      <div className="level-item">
                        <span className="has-text-weight-bold">
                          {metric.avgTime.toFixed(2)} ms
                          {isFastest && (
                            <span className="tag is-success is-small ml-2">
                              <span className="icon is-small">
                                <i className="fas fa-trophy"></i>
                              </span>
                              <span>Fastest</span>
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <progress
                    className={`progress ${getBackendColor(metric.backend).replace("is-", "")}`}
                    value={percentage}
                    max="100"
                    aria-label={`${getBackendLabel(metric.backend)}: ${metric.avgTime.toFixed(2)}ms average inference time`}
                  >
                    {percentage.toFixed(1)}%
                  </progress>
                  <p className="is-size-7 has-text-grey mt-1">
                    Throughput: {metric.avgThroughput.toFixed(2)} inferences/sec | P95: {metric.p95Time.toFixed(2)}ms | P99: {metric.p99Time.toFixed(2)}ms
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Performance Insights */}
      {backendMetrics.length > 1 && (
        <div className="notification is-info is-light mt-5">
          <h5 className="title is-6 mb-3">Performance Insights</h5>
          <div className="content">
            <ul>
              <li>
                <strong>Fastest Backend:</strong>{" "}
                {getBackendLabel(backendMetrics[0].backend)} (
                {backendMetrics[0].avgTime.toFixed(2)}ms avg)
              </li>
              {backendMetrics.length > 1 && (
                <li>
                  <strong>Performance Gain:</strong>{" "}
                  {((1 - backendMetrics[0].avgTime / backendMetrics[backendMetrics.length - 1].avgTime) * 100).toFixed(1)}%
                  faster than slowest backend
                </li>
              )}
              <li>
                <strong>Total Samples:</strong> {performanceHistory.length} inferences
              </li>
              {currentBackend !== "unknown" && (
                <li>
                  <strong>Current Backend:</strong> {getBackendLabel(currentBackend)} -{" "}
                  {backendMetrics.find((m) => m.backend === currentBackend)?.avgTime.toFixed(2) || "N/A"}ms
                  average
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="is-hidden" aria-hidden="true" />
    </div>
  );
}

