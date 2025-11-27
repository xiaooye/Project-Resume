"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BigDataItem } from "@/types";
import * as wasmCalculations from "@/lib/wasm/big-data-calculations";
import {
  initChartRenderer,
  cleanupChartRenderer,
  renderBarChart,
  renderLineChart,
  renderAreaChart,
  renderPieChart,
  renderScatterChart,
} from "@/lib/wasm/chart-renderer";

const TOTAL_ITEMS = 1000000; // 1 million items
const ITEMS_PER_PAGE = 50;
const VIRTUAL_ITEM_HEIGHT = 60;
const MOBILE_VIRTUAL_ITEM_HEIGHT = 80; // Larger for touch targets
const STREAM_BATCH_SIZE = 10000; // Process 10k items at a time
const STREAM_UPDATE_INTERVAL = 50; // Update UI every 50ms

type ViewMode = "table" | "chart" | "analysis" | "stream";
type ChartType = "bar" | "line" | "pie" | "heatmap" | "scatter" | "area" | "boxplot" | "histogram";
type SortField = "name" | "value" | "category" | "timestamp";
type SortOrder = "asc" | "desc";
type StreamSource = "websocket" | "sse" | "simulated";
type AnalysisType = "descriptive" | "time-series" | "correlation" | "anomaly" | "forecast" | "capacity";

interface StreamConfig {
  enabled: boolean;
  source: StreamSource;
  windowSize: number; // Sliding window size
  updateInterval: number; // Update interval in ms
  maxItems: number; // Maximum items to keep in memory
}

// Stream data generator - yields data in batches
function* generateDataStream(count: number): Generator<BigDataItem[], void, unknown> {
  let current = 0;
  while (current < count) {
    const batchSize = Math.min(STREAM_BATCH_SIZE, count - current);
    const batch = Array.from({ length: batchSize }, (_, i) => ({
      id: `item-${current + i}`,
      name: `Data Item ${current + i + 1}`,
      value: Math.floor(Math.random() * 10000),
      category: `Category ${((current + i) % 10) + 1}`,
      timestamp: Date.now() - Math.random() * 86400000,
    }));
    current += batchSize;
    yield batch;
  }
}

// Stream processing for statistics - processes data incrementally
function* processStatisticsStream(
  dataStream: Generator<BigDataItem[], void, unknown>
): Generator<{
  count: number;
  totalValue: number;
  minValue: number;
  maxValue: number;
  categoryCounts: Record<string, number>;
  values: number[];
}, void, unknown> {
  let count = 0;
  let totalValue = 0;
  let minValue = Infinity;
  let maxValue = -Infinity;
  const categoryCounts: Record<string, number> = {};
  const values: number[] = [];

  for (const batch of dataStream) {
    for (const item of batch) {
      count++;
      totalValue += item.value;
      minValue = Math.min(minValue, item.value);
      maxValue = Math.max(maxValue, item.value);
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      values.push(item.value);
    }
    yield {
      count,
      totalValue,
      minValue: minValue === Infinity ? 0 : minValue,
      maxValue: maxValue === -Infinity ? 0 : maxValue,
      categoryCounts: { ...categoryCounts },
      values: [...values],
    };
  }
}

// Data Processing Functions
function processData(
  data: BigDataItem[],
  sortField?: SortField,
  sortOrder?: SortOrder,
  groupBy?: "category" | "date"
) {
  let processed = [...data];
  
  // Sorting
  if (sortField && sortOrder) {
    processed.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      
      if (sortField === "timestamp") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }
  
  // Grouping
  if (groupBy === "category") {
    const grouped: Record<string, BigDataItem[]> = {};
    processed.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  }
  
  if (groupBy === "date") {
    const grouped: Record<string, BigDataItem[]> = {};
    processed.forEach(item => {
      const date = new Date(item.timestamp).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    return grouped;
  }
  
  return processed;
}

// Chart Colors - Professional palette
const CHART_COLORS = [
  "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe",
  "#4f46e5", "#4338ca", "#3730a3", "#312e81",
  "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"
];

// Chart Canvas Component - WebAssembly powered
function ChartCanvas({
  chartType,
  data,
  width,
  height,
}: {
  chartType: "bar" | "line" | "area" | "pie" | "scatter";
  data: Array<{ label?: string; value?: number; x?: number; y?: number }>;
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = async () => {
      if (chartType === "bar" || chartType === "line" || chartType === "area") {
        const chartData = data.map((d, i) => ({
          label: d.label || `${i}`,
          value: d.value || 0,
        }));
        if (chartType === "bar") {
          await renderBarChart(canvas, chartData, { width, height });
        } else if (chartType === "area") {
          await renderAreaChart(canvas, chartData, { width, height });
        } else {
          await renderLineChart(canvas, chartData, { width, height });
        }
      } else if (chartType === "pie") {
        const chartData = data.map(d => ({
          label: d.label || "",
          value: d.value || 0,
        }));
        await renderPieChart(canvas, chartData, { width, height });
      } else if (chartType === "scatter") {
        const chartData = data.map(d => ({
          x: d.x || 0,
          y: d.y || 0,
          label: d.label,
        }));
        await renderScatterChart(canvas, chartData, { width, height });
      }
    };

    render();
  }, [chartType, data, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="is-fullwidth"
      style={{ maxWidth: "100%", height: "auto" }}
      aria-label={`${chartType} chart visualization`}
      role="img"
    />
  );
}

// Analysis Configuration Interface
interface AnalysisConfig {
  // Anomaly Detection
  anomalyThreshold: number; // Z-score threshold
  anomalyMethod: "zscore" | "iqr" | "isolation";
  
  // Time Series
  trendWindow: number; // Window size for trend calculation
  forecastPeriods: number; // Number of periods to forecast
  seasonalityDetection: boolean;
  
  // Correlation
  minCorrelation: number; // Minimum correlation to show
  correlationMethod: "pearson" | "spearman";
  
  // Capacity Planning
  growthRate: number; // Expected growth rate (percentage)
  headroom: number; // Capacity headroom (percentage)
  costPerUnit: number; // Cost per 1000 items
  
  // Filtering
  outlierRemoval: boolean;
  outlierMethod: "iqr" | "zscore";
  outlierThreshold: number;
}

export default function BigDataDemo() {
  const [allData, setAllData] = useState<BigDataItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [useVirtualization, setUseVirtualization] = useState(true);
  const [renderMethod, setRenderMethod] = useState<"virtual" | "traditional">("virtual");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [analysisType, setAnalysisType] = useState<AnalysisType>("descriptive");
  const [sortField, setSortField] = useState<SortField | undefined>();
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [groupBy, setGroupBy] = useState<"category" | "date" | undefined>();
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d" | "all">("all");
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(["value", "category"]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [fps, setFps] = useState(0);
  const [searchPerformance, setSearchPerformance] = useState(0);
  const reducedMotion = useReducedMotion();
  const streamControllerRef = useRef<AbortController | null>(null);
  
  // Real-time data stream state
  const [streamConfig, setStreamConfig] = useState<StreamConfig>({
    enabled: false,
    source: "simulated",
    windowSize: 10000, // Keep last 10k items
    updateInterval: 100, // Update every 100ms
    maxItems: 100000, // Max 100k items in memory
  });
  const [streamData, setStreamData] = useState<BigDataItem[]>([]);
  const [streamStats, setStreamStats] = useState({
    itemsReceived: 0,
    itemsPerSecond: 0,
    connectionStatus: "disconnected" as "connected" | "disconnected" | "connecting" | "error",
  });
  const wsRef = useRef<WebSocket | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const streamStatsRef = useRef({ itemsReceived: 0, lastUpdate: Date.now() });
  
  // Statistics
  const [stats, setStats] = useState({
    totalValue: 0,
    averageValue: 0,
    minValue: 0,
    maxValue: 0,
    categoryCounts: {} as Record<string, number>,
    median: 0,
    standardDeviation: 0,
    quartiles: { q1: 0, q2: 0, q3: 0 },
  });

  // Advanced Analysis State
  const [timeSeriesAnalysis, setTimeSeriesAnalysis] = useState<{
    trend: "increasing" | "decreasing" | "stable" | "volatile";
    trendStrength: number;
    seasonality: boolean;
    forecast: Array<{ date: string; predicted: number; confidence: number }>;
  } | null>(null);
  
  const [correlationAnalysis, setCorrelationAnalysis] = useState<{
    correlations: Array<{ field1: string; field2: string; value: number }>;
    strongest: { field1: string; field2: string; value: number } | null;
  } | null>(null);
  
  const [anomalyDetection, setAnomalyDetection] = useState<{
    anomalies: Array<{ item: BigDataItem; score: number; reason: string }>;
    threshold: number;
    anomalyRate: number;
  } | null>(null);
  
  const [capacityPlanning, setCapacityPlanning] = useState<{
    currentLoad: number;
    projectedLoad: number;
    recommendedCapacity: number;
    costEstimate: number;
    recommendations: string[];
  } | null>(null);

  // Analysis Configuration - User adjustable parameters
  const [analysisConfig, setAnalysisConfig] = useState({
    // Anomaly Detection
    anomalyThreshold: 2.5,
    anomalyMethod: "zscore" as "zscore" | "iqr" | "isolation",
    
    // Time Series
    trendWindow: 100,
    forecastPeriods: 10,
    seasonalityDetection: true,
    
    // Correlation
    minCorrelation: 0.2,
    correlationMethod: "pearson" as "pearson" | "spearman",
    
    // Capacity Planning
    growthRate: 20,
    headroom: 30,
    costPerUnit: 0.01,
    
    // Filtering
    outlierRemoval: false,
    outlierMethod: "iqr" as "iqr" | "zscore",
    outlierThreshold: 2.5,
  });

  // Create a config hash to force recalculation when config changes
  // Use individual values instead of stringify to ensure proper reactivity
  const configHash = useMemo(() => {
    const hash = `${analysisConfig.anomalyThreshold}-${analysisConfig.anomalyMethod}-${analysisConfig.trendWindow}-${analysisConfig.forecastPeriods}-${analysisConfig.seasonalityDetection}-${analysisConfig.minCorrelation}-${analysisConfig.correlationMethod}-${analysisConfig.growthRate}-${analysisConfig.headroom}-${analysisConfig.costPerUnit}-${analysisConfig.outlierRemoval}-${analysisConfig.outlierMethod}-${analysisConfig.outlierThreshold}`;
    console.log("[Config Hash] Updated:", hash.substring(0, 100));
    return hash;
  }, [
    analysisConfig.anomalyThreshold,
    analysisConfig.anomalyMethod,
    analysisConfig.trendWindow,
    analysisConfig.forecastPeriods,
    analysisConfig.seasonalityDetection,
    analysisConfig.minCorrelation,
    analysisConfig.correlationMethod,
    analysisConfig.growthRate,
    analysisConfig.headroom,
    analysisConfig.costPerUnit,
    analysisConfig.outlierRemoval,
    analysisConfig.outlierMethod,
    analysisConfig.outlierThreshold,
  ]);

  // Debug: Log config changes
  useEffect(() => {
    console.log("[Config Change] Analysis config updated:", {
      anomalyThreshold: analysisConfig.anomalyThreshold,
      anomalyMethod: analysisConfig.anomalyMethod,
      trendWindow: analysisConfig.trendWindow,
      forecastPeriods: analysisConfig.forecastPeriods,
      minCorrelation: analysisConfig.minCorrelation,
      growthRate: analysisConfig.growthRate,
      headroom: analysisConfig.headroom,
    });
  }, [analysisConfig]);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // FPS monitoring
  useEffect(() => {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFPS = () => {
      frameCount++;
      const now = performance.now();
      const elapsed = now - lastTime;
      
      if (elapsed >= 1000) {
        setFps(Math.round((frameCount * 1000) / elapsed));
        frameCount = 0;
        lastTime = now;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    const fpsId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(fpsId);
  }, []);

  // Stream data loading - processes data in batches
  const loadDataStream = async () => {
    setIsStreaming(true);
    setStreamProgress(0);
    const controller = new AbortController();
    streamControllerRef.current = controller;
    
    const dataStream = generateDataStream(TOTAL_ITEMS);
    const statsStream = processStatisticsStream(dataStream);
    
    const loadedData: BigDataItem[] = [];
    let lastUpdate = performance.now();
    
    try {
      for (const batch of dataStream) {
        if (controller.signal.aborted) break;
        
        loadedData.push(...batch);
        setAllData([...loadedData]);
        setStreamProgress((loadedData.length / TOTAL_ITEMS) * 100);
        
        // Update statistics incrementally
        const statsResult = statsStream.next();
        if (!statsResult.done && statsResult.value) {
          const { count, totalValue, minValue, maxValue, categoryCounts, values } = statsResult.value;
          const averageValue = totalValue / count;
          
          // Calculate advanced stats incrementally (only when we have enough data)
          if (values.length > 100) {
            const sortedValues = [...values].sort((a, b) => a - b);
            const median = sortedValues.length % 2 === 0
              ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
              : sortedValues[Math.floor(sortedValues.length / 2)];
            
            const variance = values.reduce((sum, val) => sum + Math.pow(val - averageValue, 2), 0) / values.length;
            const standardDeviation = Math.sqrt(variance);
            
            const q1Index = Math.floor(sortedValues.length * 0.25);
            const q2Index = Math.floor(sortedValues.length * 0.5);
            const q3Index = Math.floor(sortedValues.length * 0.75);
            
            setStats({
              totalValue,
              averageValue,
              minValue,
              maxValue,
              categoryCounts,
              median,
              standardDeviation,
              quartiles: {
                q1: sortedValues[q1Index],
                q2: sortedValues[q2Index],
                q3: sortedValues[q3Index],
              },
            });
          } else {
            setStats({
              totalValue,
              averageValue,
              minValue,
              maxValue,
              categoryCounts,
              median: 0,
              standardDeviation: 0,
              quartiles: { q1: 0, q2: 0, q3: 0 },
            });
          }
        }
        
        // Throttle UI updates
        const now = performance.now();
        if (now - lastUpdate < STREAM_UPDATE_INTERVAL) {
          await new Promise(resolve => setTimeout(resolve, STREAM_UPDATE_INTERVAL - (now - lastUpdate)));
        }
        lastUpdate = performance.now();
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error("Stream loading error:", error);
      }
    } finally {
      setIsStreaming(false);
      setStreamProgress(100);
    }
  };

  // Real-time data stream handling
  useEffect(() => {
    if (!streamConfig.enabled) {
      // Cleanup connections
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setStreamStats(prev => ({ ...prev, connectionStatus: "disconnected" }));
      return;
    }

    setStreamStats(prev => ({ ...prev, connectionStatus: "connecting" }));

    if (streamConfig.source === "websocket") {
      // WebSocket connection
      const ws = new WebSocket("ws://localhost:3001/api/big-data-stream");
      wsRef.current = ws;

      ws.onopen = () => {
        setStreamStats(prev => ({ ...prev, connectionStatus: "connected" }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.items && Array.isArray(data.items)) {
            handleStreamData(data.items);
          } else if (Array.isArray(data)) {
            handleStreamData(data);
          } else if (data.item) {
            handleStreamData([data.item]);
          }
        } catch (error) {
          console.error("Error parsing stream data:", error);
        }
      };

      ws.onerror = () => {
        setStreamStats(prev => ({ ...prev, connectionStatus: "error" }));
      };

      ws.onclose = () => {
        setStreamStats(prev => ({ ...prev, connectionStatus: "disconnected" }));
      };
    } else if (streamConfig.source === "sse") {
      // Server-Sent Events connection
      const eventSource = new EventSource("/api/big-data-stream");
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setStreamStats(prev => ({ ...prev, connectionStatus: "connected" }));
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.items && Array.isArray(data.items)) {
            handleStreamData(data.items);
          } else if (Array.isArray(data)) {
            handleStreamData(data);
          } else if (data.item) {
            handleStreamData([data.item]);
          }
        } catch (error) {
          console.error("Error parsing stream data:", error);
        }
      };

      eventSource.onerror = () => {
        setStreamStats(prev => ({ ...prev, connectionStatus: "error" }));
      };
    } else if (streamConfig.source === "simulated") {
      // Simulated stream - generate data periodically
      setStreamStats(prev => ({ ...prev, connectionStatus: "connected" }));
      const interval = setInterval(() => {
        const batch: BigDataItem[] = Array.from({ length: 10 }, (_, i) => ({
          id: `stream-${Date.now()}-${i}`,
          name: `Stream Item ${Date.now()}-${i}`,
          value: Math.floor(Math.random() * 10000),
          category: `Category ${(Math.floor(Math.random() * 10) + 1)}`,
          timestamp: Date.now(),
        }));
        handleStreamData(batch);
      }, streamConfig.updateInterval);

      return () => clearInterval(interval);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [streamConfig.enabled, streamConfig.source, streamConfig.updateInterval]);

  // Handle incoming stream data
  const handleStreamData = (newItems: BigDataItem[]) => {
    setStreamData(prev => {
      const updated = [...prev, ...newItems];
      // Apply sliding window - keep only last N items
      const windowed = updated.slice(-streamConfig.windowSize);
      // Limit total memory usage
      return windowed.slice(-streamConfig.maxItems);
    });

    // Update stream statistics
    streamStatsRef.current.itemsReceived += newItems.length;
    const now = Date.now();
    const elapsed = (now - streamStatsRef.current.lastUpdate) / 1000;
    if (elapsed >= 1) {
      const itemsPerSecond = streamStatsRef.current.itemsReceived / elapsed;
      setStreamStats(prev => ({
        ...prev,
        itemsReceived: streamStatsRef.current.itemsReceived,
        itemsPerSecond: Math.round(itemsPerSecond),
      }));
      streamStatsRef.current = { itemsReceived: 0, lastUpdate: now };
    }
  };

  // Initialize data only on client side to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    // Use streaming for large datasets (only if stream mode is not enabled)
    if (!streamConfig.enabled) {
      loadDataStream();
    }
    
    return () => {
      if (streamControllerRef.current) {
        streamControllerRef.current.abort();
      }
    };
  }, [streamConfig.enabled]);

  // Use stream data if stream mode is enabled, otherwise use allData
  const dataSource = streamConfig.enabled ? streamData : allData;

  const filteredData = useMemo(() => {
    const startTime = performance.now();
    let result;
    
    if (!searchTerm) {
      result = dataSource;
    } else {
      const term = searchTerm.toLowerCase();
      result = dataSource.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.category.toLowerCase().includes(term) ||
          item.value.toString().includes(term)
      );
    }
    
    const endTime = performance.now();
    setSearchPerformance(endTime - startTime);
    
    return result;
  }, [dataSource, searchTerm]);

  // Calculate advanced statistics - optimized for streaming
  useEffect(() => {
    if (filteredData.length === 0) return;
    
    // Use requestIdleCallback for non-blocking calculation
    const calculateStats = () => {
      const values = filteredData.map(item => item.value).sort((a, b) => a - b);
      const totalValue = values.reduce((sum, val) => sum + val, 0);
      const averageValue = totalValue / values.length;
      const minValue = values[0];
      const maxValue = values[values.length - 1];
      
      // Median
      const median = values.length % 2 === 0
        ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
        : values[Math.floor(values.length / 2)];
      
      // Quartiles
      const q1Index = Math.floor(values.length * 0.25);
      const q2Index = Math.floor(values.length * 0.5);
      const q3Index = Math.floor(values.length * 0.75);
      const q1 = values[q1Index];
      const q2 = values[q2Index];
      const q3 = values[q3Index];
      
      // Standard Deviation
      const variance = values.reduce((sum, val) => sum + Math.pow(val - averageValue, 2), 0) / values.length;
      const standardDeviation = Math.sqrt(variance);
      
      const categoryCounts: Record<string, number> = {};
      filteredData.forEach(item => {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      });
      
      setStats({
        totalValue,
        averageValue,
        minValue,
        maxValue,
        categoryCounts,
        median,
        standardDeviation,
        quartiles: { q1, q2, q3 },
      });
    };
    
    // Use setTimeout to avoid blocking UI during streaming
    const timeoutId = setTimeout(calculateStats, isStreaming ? 100 : 0);
    return () => clearTimeout(timeoutId);
  }, [filteredData, isStreaming]);

  // Advanced Analysis: Time Series Analysis using WebAssembly
  useEffect(() => {
    console.log("[Time Series] Effect triggered", {
      analysisType,
      dataLength: filteredData.length,
      trendWindow: analysisConfig.trendWindow,
      forecastPeriods: analysisConfig.forecastPeriods,
      seasonality: analysisConfig.seasonalityDetection,
      configHash: configHash.substring(0, 50),
    });
    
    if (analysisType !== "time-series" || filteredData.length < 50) {
      // Clear results when switching away or not enough data
      if (analysisType !== "time-series") {
        console.log("[Time Series] Clearing - wrong analysis type");
        setTimeSeriesAnalysis(null);
      } else {
        console.log("[Time Series] Clearing - not enough data");
      }
      return;
    }
    
    const calculateTimeSeries = async () => {
      console.log("[Time Series] Starting calculation", {
        trendWindow: analysisConfig.trendWindow,
        forecastPeriods: analysisConfig.forecastPeriods,
        seasonality: analysisConfig.seasonalityDetection,
      });
      // Sort by timestamp
      const sorted = [...filteredData].sort((a, b) => a.timestamp - b.timestamp);
      const timestamps = sorted.map(item => item.timestamp);
      const values = sorted.map(item => item.value);
      
      try {
        // Use WebAssembly for high-performance time series analysis
        const result = await wasmCalculations.timeSeriesAnalysis(
          timestamps,
          values,
          analysisConfig.trendWindow
        );
        
        // Generate forecast with user-configured periods
        const forecast = result.forecast.slice(0, analysisConfig.forecastPeriods).map(f => ({
          date: new Date(f.timestamp).toLocaleDateString(),
          predicted: f.predicted,
          confidence: f.confidence,
        }));
        
        const analysisResult = {
          trend: result.trend,
          trendStrength: result.trendStrength,
          seasonality: analysisConfig.seasonalityDetection ? result.seasonality : false,
          forecast,
        };
        console.log("[Time Series] WASM result:", {
          trend: analysisResult.trend,
          trendStrength: analysisResult.trendStrength,
          seasonality: analysisResult.seasonality,
          forecastCount: forecast.length,
        });
        setTimeSeriesAnalysis(analysisResult);
      } catch (error) {
        console.error("WASM time series error:", error);
        // Fallback to JS (same as before but using config)
        const n = sorted.length;
        const sumX = timestamps.reduce((sum, t) => sum + t, 0);
        const sumY = values.reduce((sum, v) => sum + v, 0);
        const sumXY = timestamps.reduce((sum, t, i) => sum + t * values[i], 0);
        const sumX2 = timestamps.reduce((sum, t) => sum + t * t, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        let trend: "increasing" | "decreasing" | "stable" | "volatile";
        const trendStrength = Math.abs(slope);
        if (trendStrength < 0.001) {
          trend = "stable";
        } else if (slope > 0) {
          trend = trendStrength > 0.01 ? "increasing" : "stable";
        } else {
          trend = trendStrength > 0.01 ? "decreasing" : "stable";
        }
        
        const variance = values.reduce((sum, v, i) => {
          const predicted = slope * timestamps[i] + intercept;
          return sum + Math.pow(v - predicted, 2);
        }, 0) / n;
        if (variance > 1000000) {
          trend = "volatile";
        }
        
        const lastTime = timestamps[n - 1];
        const timeStep = (lastTime - timestamps[0]) / n;
        const forecast = Array.from({ length: analysisConfig.forecastPeriods }, (_, i) => {
          const futureTime = lastTime + timeStep * (i + 1);
          const predicted = slope * futureTime + intercept;
          const confidence = Math.max(0.5, 1 - (i + 1) * 0.05);
          return {
            date: new Date(futureTime).toLocaleDateString(),
            predicted: Math.max(0, predicted),
            confidence,
          };
        });
        
        const analysisResult = {
          trend,
          trendStrength,
          seasonality: analysisConfig.seasonalityDetection && variance > 500000 && n > 100,
          forecast,
        };
        console.log("[Time Series] JS fallback result:", {
          trend: analysisResult.trend,
          trendStrength: analysisResult.trendStrength,
          seasonality: analysisResult.seasonality,
          forecastCount: forecast.length,
        });
        setTimeSeriesAnalysis(analysisResult);
      }
    };
    
    const timeoutId = setTimeout(calculateTimeSeries, 200);
    return () => clearTimeout(timeoutId);
  }, [filteredData, analysisType, configHash, analysisConfig.trendWindow, analysisConfig.forecastPeriods, analysisConfig.seasonalityDetection]);

  // Advanced Analysis: Correlation Analysis using WebAssembly
  useEffect(() => {
    console.log("[Correlation] Effect triggered", {
      analysisType,
      dataLength: filteredData.length,
      minCorrelation: analysisConfig.minCorrelation,
      method: analysisConfig.correlationMethod,
      configHash: configHash.substring(0, 50),
    });
    
    if (analysisType !== "correlation" || filteredData.length < 100) {
      // Clear results when switching away or not enough data
      if (analysisType !== "correlation") {
        console.log("[Correlation] Clearing - wrong analysis type");
        setCorrelationAnalysis(null);
      } else {
        console.log("[Correlation] Clearing - not enough data");
      }
      return;
    }
    
    const calculateCorrelation = async () => {
      console.log("[Correlation] Starting calculation", {
        minCorrelation: analysisConfig.minCorrelation,
        method: analysisConfig.correlationMethod,
      });
      const values = filteredData.map(item => item.value);
      const timestamps = filteredData.map(item => item.timestamp);
      const categories = filteredData.map(item => 
        parseInt(item.category.replace("Category ", ""))
      );
      
      try {
        // Use WebAssembly for high-performance correlation calculation
        const corrValueTime = await wasmCalculations.calculateCorrelation(values, timestamps);
        const corrValueCat = await wasmCalculations.calculateCorrelation(values, categories);
        const corrTimeCat = await wasmCalculations.calculateCorrelation(timestamps, categories);
        
        const correlations = [
          { field1: "Value", field2: "Timestamp", value: corrValueTime },
          { field1: "Value", field2: "Category", value: corrValueCat },
          { field1: "Timestamp", field2: "Category", value: corrTimeCat },
        ].filter(corr => Math.abs(corr.value) >= analysisConfig.minCorrelation);
        
        const strongest = correlations.length > 0
          ? correlations.reduce((max, curr) => 
              Math.abs(curr.value) > Math.abs(max.value) ? curr : max
            )
          : null;
        
        const result = { correlations, strongest };
        console.log("[Correlation] WASM result:", {
          correlationCount: correlations.length,
          strongest: strongest ? `${strongest.field1}-${strongest.field2}: ${strongest.value.toFixed(4)}` : "none",
        });
        setCorrelationAnalysis(result);
      } catch (error) {
        console.error("WASM correlation error:", error);
        // Fallback to JS
        const meanValue = values.reduce((a, b) => a + b, 0) / values.length;
        const meanTime = timestamps.reduce((a, b) => a + b, 0) / timestamps.length;
        const meanCat = categories.reduce((a, b) => a + b, 0) / categories.length;
        
        const calcCorrelation = (x: number[], y: number[], meanX: number, meanY: number) => {
          const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
          const denomX = Math.sqrt(x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0));
          const denomY = Math.sqrt(y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0));
          return denomX * denomY === 0 ? 0 : numerator / (denomX * denomY);
        };
        
        const corrValueTime = calcCorrelation(values, timestamps, meanValue, meanTime);
        const corrValueCat = calcCorrelation(values, categories, meanValue, meanCat);
        const corrTimeCat = calcCorrelation(timestamps, categories, meanTime, meanCat);
        
        const correlations = [
          { field1: "Value", field2: "Timestamp", value: corrValueTime },
          { field1: "Value", field2: "Category", value: corrValueCat },
          { field1: "Timestamp", field2: "Category", value: corrTimeCat },
        ].filter(corr => Math.abs(corr.value) >= analysisConfig.minCorrelation);
        
        const strongest = correlations.length > 0
          ? correlations.reduce((max, curr) => 
              Math.abs(curr.value) > Math.abs(max.value) ? curr : max
            )
          : null;
        
        const result = { correlations, strongest };
        console.log("[Correlation] JS fallback result:", {
          correlationCount: correlations.length,
          strongest: strongest ? `${strongest.field1}-${strongest.field2}: ${strongest.value.toFixed(4)}` : "none",
        });
        setCorrelationAnalysis(result);
      }
    };
    
    const timeoutId = setTimeout(calculateCorrelation, 200);
    return () => clearTimeout(timeoutId);
  }, [filteredData, analysisType, configHash, analysisConfig.minCorrelation, analysisConfig.correlationMethod]);

  // Advanced Analysis: Anomaly Detection using WebAssembly
  useEffect(() => {
    console.log("[Anomaly Detection] Effect triggered", {
      analysisType,
      dataLength: filteredData.length,
      threshold: analysisConfig.anomalyThreshold,
      method: analysisConfig.anomalyMethod,
      configHash: configHash.substring(0, 50),
    });
    
    if (analysisType !== "anomaly" || filteredData.length < 50) {
      // Clear results when switching away or not enough data
      if (analysisType !== "anomaly") {
        console.log("[Anomaly Detection] Clearing - wrong analysis type");
        setAnomalyDetection(null);
      } else {
        console.log("[Anomaly Detection] Clearing - not enough data");
      }
      return;
    }
    
    const detectAnomalies = async () => {
      console.log("[Anomaly Detection] Starting calculation", {
        threshold: analysisConfig.anomalyThreshold,
        method: analysisConfig.anomalyMethod,
        dataCount: filteredData.length,
      });
      const values = filteredData.map(item => item.value);
      const threshold = analysisConfig.anomalyThreshold;
      
      try {
        // Use WebAssembly for high-performance anomaly detection
        // Note: Currently only Z-score is implemented in WASM, other methods would need additional implementation
        const wasmAnomalies = await wasmCalculations.detectAnomalies(values, threshold);
        
        const anomalies: Array<{ item: BigDataItem; score: number; reason: string }> = wasmAnomalies
          .slice(0, 20)
          .map(anomaly => ({
            item: filteredData[anomaly.index],
            score: anomaly.zScore,
            reason: anomaly.zScore > 3 ? "Extreme outlier" : "Statistical anomaly",
          }));
        
        const result = {
          anomalies,
          threshold,
          anomalyRate: (wasmAnomalies.length / filteredData.length) * 100,
        };
        console.log("[Anomaly Detection] WASM result:", {
          anomalyCount: anomalies.length,
          anomalyRate: result.anomalyRate,
          threshold,
        });
        setAnomalyDetection(result);
      } catch (error) {
        console.error("WASM anomaly detection error:", error);
        // Fallback to JS with method selection
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(
          values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
        );
        const anomalies: Array<{ item: BigDataItem; score: number; reason: string }> = [];
        
        if (analysisConfig.anomalyMethod === "zscore") {
          filteredData.forEach(item => {
            const zScore = Math.abs((item.value - mean) / stdDev);
            if (zScore > threshold) {
              anomalies.push({
                item,
                score: zScore,
                reason: zScore > 3 ? "Extreme outlier" : "Statistical anomaly",
              });
            }
          });
        } else if (analysisConfig.anomalyMethod === "iqr") {
          const sorted = [...values].sort((a, b) => a - b);
          const q1Index = Math.floor(sorted.length * 0.25);
          const q3Index = Math.floor(sorted.length * 0.75);
          const q1 = sorted[q1Index];
          const q3 = sorted[q3Index];
          const iqr = q3 - q1;
          const lowerBound = q1 - threshold * iqr;
          const upperBound = q3 + threshold * iqr;
          
          filteredData.forEach(item => {
            if (item.value < lowerBound || item.value > upperBound) {
              const score = item.value < lowerBound 
                ? (lowerBound - item.value) / iqr 
                : (item.value - upperBound) / iqr;
              anomalies.push({
                item,
                score: score + threshold,
                reason: "IQR outlier",
              });
            }
          });
        }
        
        const result = {
          anomalies: anomalies.sort((a, b) => b.score - a.score).slice(0, 20),
          threshold,
          anomalyRate: (anomalies.length / filteredData.length) * 100,
        };
        console.log("[Anomaly Detection] JS fallback result:", {
          anomalyCount: result.anomalies.length,
          anomalyRate: result.anomalyRate,
          threshold,
          method: analysisConfig.anomalyMethod,
        });
        setAnomalyDetection(result);
      }
    };
    
    const timeoutId = setTimeout(detectAnomalies, 200);
    return () => clearTimeout(timeoutId);
  }, [filteredData, analysisType, configHash, analysisConfig.anomalyThreshold, analysisConfig.anomalyMethod]);

  // Advanced Analysis: Capacity Planning using WebAssembly
  useEffect(() => {
    console.log("[Capacity Planning] Effect triggered", {
      analysisType,
      dataLength: filteredData.length,
      growthRate: analysisConfig.growthRate,
      headroom: analysisConfig.headroom,
      costPerUnit: analysisConfig.costPerUnit,
      configHash: configHash.substring(0, 50),
    });
    
    if (analysisType !== "capacity" || filteredData.length < 100) {
      // Clear results when switching away or not enough data
      if (analysisType !== "capacity") {
        console.log("[Capacity Planning] Clearing - wrong analysis type");
        setCapacityPlanning(null);
      } else {
        console.log("[Capacity Planning] Clearing - not enough data");
      }
      return;
    }
    
    const calculateCapacity = async () => {
      console.log("[Capacity Planning] Starting calculation", {
        growthRate: analysisConfig.growthRate,
        headroom: analysisConfig.headroom,
        costPerUnit: analysisConfig.costPerUnit,
      });
      const currentLoad = filteredData.length;
      
      try {
        // Use WebAssembly for capacity planning
        const result = await wasmCalculations.capacityPlanning(
          currentLoad,
          analysisConfig.growthRate,
          analysisConfig.headroom
        );
        
        const recommendations: string[] = [];
        if (currentLoad > 500000) {
          recommendations.push("Consider horizontal scaling with distributed storage");
        }
        if (stats.maxValue > stats.averageValue * 2) {
          recommendations.push("Implement caching layer for high-value items");
        }
        if (stats.standardDeviation > stats.averageValue * 0.5) {
          recommendations.push("Data shows high variance - consider load balancing");
        }
        if (result.recommendedCapacity > 1000000) {
          recommendations.push("Scale to multi-region deployment for better performance");
        }
        
        const planningResult = {
          currentLoad,
          projectedLoad: result.projectedLoad,
          recommendedCapacity: result.recommendedCapacity,
          costEstimate: result.costEstimate * analysisConfig.costPerUnit / 0.01, // Scale by user config
          recommendations,
        };
        console.log("[Capacity Planning] WASM result:", {
          currentLoad: planningResult.currentLoad,
          projectedLoad: planningResult.projectedLoad,
          recommendedCapacity: planningResult.recommendedCapacity,
          costEstimate: planningResult.costEstimate,
        });
        setCapacityPlanning(planningResult);
      } catch (error) {
        console.error("WASM capacity planning error:", error);
        // Fallback to JS
        const projectedLoad = currentLoad * (1 + analysisConfig.growthRate / 100);
        const recommendedCapacity = Math.ceil(projectedLoad * (1 + analysisConfig.headroom / 100));
        const costEstimate = (recommendedCapacity / 1000) * analysisConfig.costPerUnit;
        
        const recommendations: string[] = [];
        if (currentLoad > 500000) {
          recommendations.push("Consider horizontal scaling with distributed storage");
        }
        if (stats.maxValue > stats.averageValue * 2) {
          recommendations.push("Implement caching layer for high-value items");
        }
        if (stats.standardDeviation > stats.averageValue * 0.5) {
          recommendations.push("Data shows high variance - consider load balancing");
        }
        if (recommendedCapacity > 1000000) {
          recommendations.push("Scale to multi-region deployment for better performance");
        }
        
        const planningResult = {
          currentLoad,
          projectedLoad,
          recommendedCapacity,
          costEstimate,
          recommendations,
        };
        console.log("[Capacity Planning] JS fallback result:", {
          currentLoad: planningResult.currentLoad,
          projectedLoad: planningResult.projectedLoad,
          recommendedCapacity: planningResult.recommendedCapacity,
          costEstimate: planningResult.costEstimate,
        });
        setCapacityPlanning(planningResult);
      }
    };
    
    const timeoutId = setTimeout(calculateCapacity, 200);
    return () => clearTimeout(timeoutId);
  }, [filteredData, analysisType, stats, configHash, analysisConfig.growthRate, analysisConfig.headroom, analysisConfig.costPerUnit]);
  
  // Process data with sorting and grouping
  const processedData = useMemo(() => {
    return processData(filteredData, sortField, sortOrder, groupBy);
  }, [filteredData, sortField, sortOrder, groupBy]);
  
  // Chart data preparation - supports real-time stream updates and advanced visualizations
  const chartData = useMemo(() => {
    if (chartType === "pie" || chartType === "bar") {
      const categoryData = Object.entries(stats.categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([label, value]) => ({ label, value }));
      return categoryData;
    }
    
    if (chartType === "line" || chartType === "area") {
      // Time series data - for stream mode, use recent data points
      const dataToUse = streamConfig.enabled 
        ? streamData.slice(-100) // Last 100 items for real-time view
        : filteredData.slice(0, 50);
      
      const timeGroups: Record<string, number> = {};
      dataToUse.forEach(item => {
        // For real-time, use seconds precision
        const timeKey = streamConfig.enabled
          ? new Date(item.timestamp).toLocaleTimeString()
          : new Date(item.timestamp).toLocaleDateString();
        timeGroups[timeKey] = (timeGroups[timeKey] || 0) + item.value;
      });
      return Object.entries(timeGroups)
        .sort((a, b) => {
          if (streamConfig.enabled) {
            return a[0].localeCompare(b[0]);
          }
          return new Date(a[0]).getTime() - new Date(b[0]).getTime();
        })
        .slice(-20) // Keep last 20 data points for performance
        .map(([label, value]) => ({ label, value }));
    }
    
    if (chartType === "scatter") {
      // Scatter plot: value vs timestamp
      const sampleData = filteredData.slice(0, 500); // Sample for performance
      return sampleData.map(item => ({
        x: item.timestamp,
        y: item.value,
        label: item.name,
      }));
    }
    
    if (chartType === "histogram") {
      // Histogram: distribution of values
      return filteredData.map(item => item.value);
    }
    
    if (chartType === "boxplot") {
      // Box plot: distribution by category
      const categoryGroups: Record<string, number[]> = {};
      filteredData.forEach(item => {
        if (!categoryGroups[item.category]) {
          categoryGroups[item.category] = [];
        }
        categoryGroups[item.category].push(item.value);
      });
      return Object.entries(categoryGroups)
        .slice(0, 10)
        .map(([label, values]) => ({ label, values }));
    }
    
    return [];
  }, [chartType, stats.categoryCounts, filteredData, streamConfig.enabled, streamData]);
  
  // Export data function
  const exportData = (format: "json" | "csv") => {
    const dataToExport = filteredData.slice(0, 10000); // Limit export size
    
    if (format === "json") {
      const json = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `big-data-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = ["ID", "Name", "Value", "Category", "Timestamp"];
      const csv = [
        headers.join(","),
        ...dataToExport.map(item =>
          [item.id, item.name, item.value, item.category, item.timestamp].join(",")
        ),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `big-data-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage]);

  // Virtual scrolling - simplified to work with only Bulma classes
  const visibleRange = useMemo(() => {
    if (!useVirtualization || !isMounted) return { start: 0, end: paginatedData.length };
    const itemHeight = isMobile ? MOBILE_VIRTUAL_ITEM_HEIGHT : VIRTUAL_ITEM_HEIGHT;
    const visibleCount = isMobile ? 10 : 30; // Fewer items on mobile for better performance
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - (isMobile ? 2 : 5));
    const end = Math.min(start + visibleCount, filteredData.length);
    return { start, end };
  }, [scrollTop, filteredData.length, useVirtualization, paginatedData.length, isMounted, isMobile]);

  const virtualItems = useMemo(() => {
    if (!useVirtualization || !isMounted) return paginatedData;
    const dataToUse = Array.isArray(processedData) ? processedData : filteredData;
    return dataToUse.slice(visibleRange.start, visibleRange.end);
  }, [filteredData, processedData, visibleRange, useVirtualization, paginatedData, isMounted]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Touch-friendly scroll handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    // Enable smooth scrolling on touch devices
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.scrollBehavior = "smooth";
    }
  };

  const [memoryUsage, setMemoryUsage] = useState(0);
  const [renderTime, setRenderTime] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    const timer = setTimeout(() => {
      const endTime = performance.now();
      setRenderTime(endTime - startTime);
      // @ts-ignore - performance.memory is Chrome-specific
      if (performance.memory) {
        // @ts-ignore
        setMemoryUsage(performance.memory.usedJSHeapSize / 1048576); // MB
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [virtualItems.length, renderMethod]);

  return (
    <div className="container">
      <div className="section">
        <h2 className="title is-2 has-text-centered mb-6" id="big-data-demo">
          Big Data Demo: Handling, Representation & Analysis
        </h2>
        
        {/* Streaming Progress Indicator */}
        {isStreaming && (
          <div className="box mb-6">
            <div className="level">
              <div className="level-left">
                <div className="level-item">
                  <p className="subtitle is-5">Streaming Data...</p>
                </div>
              </div>
              <div className="level-right">
                <div className="level-item">
                  <p className="subtitle is-5">{streamProgress.toFixed(1)}%</p>
                </div>
              </div>
            </div>
            <progress
              className="progress is-primary"
              value={streamProgress}
              max={100}
              aria-label="Data loading progress"
            >
              {streamProgress}%
            </progress>
            <p className="help mt-2">
              Processing {allData.length.toLocaleString()} of {TOTAL_ITEMS.toLocaleString()} items
            </p>
          </div>
        )}
        
        {/* View Mode Tabs */}
        <div className="tabs is-centered mb-6">
          <ul role="tablist">
            <li className={viewMode === "table" ? "is-active" : ""}>
              <button
                className="button is-light"
                onClick={() => setViewMode("table")}
                aria-selected={viewMode === "table"}
                role="tab"
                aria-controls="table-panel"
              >
                Data Handling
              </button>
            </li>
            <li className={viewMode === "chart" ? "is-active" : ""}>
              <button
                className="button is-light"
                onClick={() => setViewMode("chart")}
                aria-selected={viewMode === "chart"}
                role="tab"
                aria-controls="chart-panel"
              >
                Data Representation
              </button>
            </li>
            <li className={viewMode === "analysis" ? "is-active" : ""}>
              <button
                className="button is-light"
                onClick={() => setViewMode("analysis")}
                aria-selected={viewMode === "analysis"}
                role="tab"
                aria-controls="analysis-panel"
              >
                Data Analysis
              </button>
            </li>
            <li className={viewMode === "stream" ? "is-active" : ""}>
              <button
                className="button is-light"
                onClick={() => setViewMode("stream")}
                aria-selected={viewMode === "stream"}
                role="tab"
                aria-controls="stream-panel"
              >
                Real-time Stream
              </button>
            </li>
          </ul>
        </div>

        {/* Stream Configuration */}
        {viewMode === "stream" && (
          <div className="box mb-6">
            <h3 className="title is-4 mb-4">Real-time Data Stream Configuration</h3>
            <div className="field">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={streamConfig.enabled}
                  onChange={(e) =>
                    setStreamConfig((prev) => ({ ...prev, enabled: e.target.checked }))
                  }
                />
                Enable Real-time Data Stream
              </label>
            </div>
            {streamConfig.enabled && (
              <>
                <div className="field mt-4">
                  <label className="label">Stream Source</label>
                  <div className="control">
                    <div className="select is-fullwidth">
                      <select
                        value={streamConfig.source}
                        onChange={(e) =>
                          setStreamConfig((prev) => ({
                            ...prev,
                            source: e.target.value as StreamSource,
                          }))
                        }
                        aria-label="Stream source"
                      >
                        <option value="simulated">Simulated (Local)</option>
                        <option value="websocket">WebSocket</option>
                        <option value="sse">Server-Sent Events (SSE)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="field">
                  <label className="label">Sliding Window Size</label>
                  <div className="control">
                    <input
                      className="input"
                      type="number"
                      min="100"
                      max="1000000"
                      step="1000"
                      value={streamConfig.windowSize}
                      onChange={(e) =>
                        setStreamConfig((prev) => ({
                          ...prev,
                          windowSize: parseInt(e.target.value) || 10000,
                        }))
                      }
                      aria-label="Sliding window size"
                    />
                  </div>
                  <p className="help">Keep last N items in memory for analysis</p>
                </div>
                <div className="field">
                  <label className="label">Update Interval (ms)</label>
                  <div className="control">
                    <input
                      className="input"
                      type="number"
                      min="10"
                      max="1000"
                      step="10"
                      value={streamConfig.updateInterval}
                      onChange={(e) =>
                        setStreamConfig((prev) => ({
                          ...prev,
                          updateInterval: parseInt(e.target.value) || 100,
                        }))
                      }
                      aria-label="Update interval"
                    />
                  </div>
                </div>
                <div className="box mt-4">
                  <div className="level">
                    <div className="level-item has-text-centered">
                      <div>
                        <p className="heading">Connection Status</p>
                        <p className={`title is-5 ${
                          streamStats.connectionStatus === "connected"
                            ? "has-text-success"
                            : streamStats.connectionStatus === "error"
                            ? "has-text-danger"
                            : "has-text-warning"
                        }`}>
                          {streamStats.connectionStatus}
                        </p>
                      </div>
                    </div>
                    <div className="level-item has-text-centered">
                      <div>
                        <p className="heading">Items Received</p>
                        <p className="title is-5">{streamStats.itemsReceived.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="level-item has-text-centered">
                      <div>
                        <p className="heading">Items/Second</p>
                        <p className="title is-5">{streamStats.itemsPerSecond.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="level-item has-text-centered">
                      <div>
                        <p className="heading">Current Items</p>
                        <p className="title is-5">{streamData.length.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Data Handling View */}
        {viewMode === "table" && (
          <>
            <div className="box mb-6">
              <div className="level">
                <div className="level-left">
                  <div className="level-item">
                    <div className="field is-grouped">
                      <div className="control">
                        <div className="select">
                          <select
                            value={sortField || ""}
                            onChange={(e) => setSortField(e.target.value as SortField || undefined)}
                            aria-label="Sort by field"
                          >
                            <option value="">No Sort</option>
                            <option value="name">Sort by Name</option>
                            <option value="value">Sort by Value</option>
                            <option value="category">Sort by Category</option>
                            <option value="timestamp">Sort by Date</option>
                          </select>
                        </div>
                      </div>
                      {sortField && (
                        <div className="control">
                          <div className="select">
                            <select
                              value={sortOrder}
                              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                              aria-label="Sort order"
                            >
                              <option value="asc">Ascending</option>
                              <option value="desc">Descending</option>
                            </select>
                          </div>
                        </div>
                      )}
                      <div className="control">
                        <div className="select">
                          <select
                            value={groupBy || ""}
                            onChange={(e) => setGroupBy(e.target.value as "category" | "date" || undefined)}
                            aria-label="Group by"
                          >
                            <option value="">No Grouping</option>
                            <option value="category">Group by Category</option>
                            <option value="date">Group by Date</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="level-right">
                  <div className="level-item">
                    <div className="buttons">
                      <button
                        className="button is-light"
                        onClick={() => exportData("json")}
                        aria-label="Export as JSON"
                      >
                        Export JSON
                      </button>
                      <button
                        className="button is-light"
                        onClick={() => exportData("csv")}
                        aria-label="Export as CSV"
                      >
                        Export CSV
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Data Representation View - CTO Level: Enterprise Visualization */}
        {viewMode === "chart" && (
          <>
            <div className="box mb-6">
              <div className="level">
                <div className="level-left">
                  <div className="level-item">
                    <div className="field is-grouped">
                      <div className="control">
                        <div className="select">
                          <select
                            value={chartType}
                            onChange={(e) => setChartType(e.target.value as ChartType)}
                            aria-label="Chart type"
                          >
                            <option value="bar">Bar Chart</option>
                            <option value="line">Line Chart (Time Series)</option>
                            <option value="area">Area Chart</option>
                            <option value="pie">Pie Chart</option>
                            <option value="scatter">Scatter Plot</option>
                            <option value="histogram">Histogram (Distribution)</option>
                            <option value="boxplot">Box Plot (Statistical)</option>
                          </select>
                        </div>
                      </div>
                      <div className="control">
                        <div className="select">
                          <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
                            aria-label="Time range filter"
                          >
                            <option value="all">All Time</option>
                            <option value="1h">Last Hour</option>
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="level-right">
                  <div className="level-item">
                    <p className="help">
                      {chartData.length > 0 && typeof chartData[0] === "object" && "value" in chartData[0]
                        ? `${chartData.length} data points`
                        : chartType === "histogram"
                        ? `${chartData.length} values`
                        : `${chartData.length} series`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="box mb-6">
              <div className="has-background-white p-4" style={{ minHeight: "400px" }}>
                {chartType === "bar" && Array.isArray(chartData) && chartData.length > 0 && typeof chartData[0] === "object" && chartData[0] !== null && "value" in chartData[0] && (
                  <ChartCanvas
                    chartType="bar"
                    data={chartData as Array<{ label: string; value: number }>}
                    width={isMobile ? 350 : 800}
                    height={400}
                  />
                )}
                {chartType === "line" && Array.isArray(chartData) && chartData.length > 0 && typeof chartData[0] === "object" && chartData[0] !== null && "value" in chartData[0] && (
                  <ChartCanvas
                    chartType="line"
                    data={chartData as Array<{ label: string; value: number }>}
                    width={isMobile ? 350 : 800}
                    height={400}
                  />
                )}
                {chartType === "area" && Array.isArray(chartData) && chartData.length > 0 && typeof chartData[0] === "object" && chartData[0] !== null && "value" in chartData[0] && (
                  <ChartCanvas
                    chartType="area"
                    data={chartData as Array<{ label: string; value: number }>}
                    width={isMobile ? 350 : 800}
                    height={400}
                  />
                )}
                {chartType === "pie" && Array.isArray(chartData) && chartData.length > 0 && typeof chartData[0] === "object" && chartData[0] !== null && "value" in chartData[0] && (
                  <ChartCanvas
                    chartType="pie"
                    data={chartData as Array<{ label: string; value: number }>}
                    width={isMobile ? 350 : 400}
                    height={400}
                  />
                )}
                {chartType === "scatter" && Array.isArray(chartData) && chartData.length > 0 && typeof chartData[0] === "object" && chartData[0] !== null && "x" in chartData[0] && (
                  <ChartCanvas
                    chartType="scatter"
                    data={chartData as Array<{ x: number; y: number; label?: string }>}
                    width={isMobile ? 350 : 800}
                    height={400}
                  />
                )}
                {(!Array.isArray(chartData) || chartData.length === 0) && (
                  <div className="has-text-centered py-6">
                    <p className="subtitle">No data available for visualization</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Chart Insights - CTO Level Analysis */}
            {chartData.length > 0 && (
              <div className="box">
                <h4 className="title is-5 mb-4">Visualization Insights</h4>
                <div className="content">
                  {chartType === "line" && timeSeriesAnalysis && (
                    <div>
                      <p><strong>Trend Analysis:</strong> {timeSeriesAnalysis.trend} (strength: {timeSeriesAnalysis.trendStrength.toFixed(3)})</p>
                      {timeSeriesAnalysis.seasonality && <p><strong>Seasonality Detected:</strong> Data shows periodic patterns</p>}
                      {timeSeriesAnalysis.forecast.length > 0 && (
                        <div className="mt-3">
                          <p><strong>Forecast (Next Periods):</strong></p>
                          <div className="tags">
                            {timeSeriesAnalysis.forecast.slice(0, 5).map((f, i) => (
                              <span key={i} className="tag">
                                {f.date}: {f.predicted.toFixed(0)} (confidence: {(f.confidence * 100).toFixed(0)}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {chartType === "histogram" && (
                    <div>
                      <p><strong>Distribution Analysis:</strong></p>
                      <p>Mean: {stats.averageValue.toFixed(2)}, Median: {stats.median.toFixed(2)}, Std Dev: {stats.standardDeviation.toFixed(2)}</p>
                      <p>Skewness: {stats.averageValue > stats.median ? "Right-skewed" : stats.averageValue < stats.median ? "Left-skewed" : "Normal"}</p>
                    </div>
                  )}
                  {chartType === "boxplot" && (
                    <div>
                      <p><strong>Statistical Summary by Category:</strong></p>
                      <p>Q1: {stats.quartiles.q1.toFixed(2)}, Median: {stats.quartiles.q2.toFixed(2)}, Q3: {stats.quartiles.q3.toFixed(2)}</p>
                      <p>IQR: {(stats.quartiles.q3 - stats.quartiles.q1).toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Real-time Stream View */}
        {viewMode === "stream" && streamConfig.enabled && (
          <div className="box mb-6">
            <h3 className="title is-4 mb-4">Real-time Stream Data</h3>
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="has-background-white"
              style={{
                maxHeight: isMobile ? "400px" : "600px",
                overflowY: "auto",
                overflowX: "hidden",
              }}
              role="region"
              aria-label="Real-time stream data"
              aria-live="polite"
            >
              <table className="table is-fullwidth is-hoverable" role="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {streamData.slice(-100).reverse().map((item) => (
                    <motion.tr
                      key={item.id}
                      initial={reducedMotion ? false : { opacity: 0, y: -10 }}
                      animate={reducedMotion ? false : { opacity: 1, y: 0 }}
                      transition={reducedMotion ? {} : { duration: 0.2 }}
                    >
                      <td>
                        <small>{new Date(item.timestamp).toLocaleTimeString()}</small>
                      </td>
                      <td>{item.name}</td>
                      <td>
                        <span className="tag">{item.category}</span>
                      </td>
                      <td className="has-text-right">
                        <strong>{item.value.toLocaleString()}</strong>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {streamData.length === 0 && (
                <div className="has-text-centered py-6">
                  <p className="subtitle">Waiting for stream data...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data Analysis View - CTO Level: Enterprise Analytics */}
        {viewMode === "analysis" && (
          <>
            <div className="box mb-6">
              <div className="level">
                <div className="level-left">
                  <div className="level-item">
                    <div className="field">
                      <label className="label">Analysis Type</label>
                      <div className="control">
                        <div className="select">
                          <select
                            value={analysisType}
                            onChange={(e) => setAnalysisType(e.target.value as AnalysisType)}
                            aria-label="Analysis type"
                          >
                            <option value="descriptive">Descriptive Statistics</option>
                            <option value="time-series">Time Series Analysis</option>
                            <option value="correlation">Correlation Analysis</option>
                            <option value="anomaly">Anomaly Detection</option>
                            <option value="forecast">Forecast & Prediction</option>
                            <option value="capacity">Capacity Planning</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="level-right">
                  <div className="level-item">
                    <button
                      className="button is-light"
                      onClick={() => {
                        const configPanel = document.getElementById("analysis-config-panel");
                        if (configPanel) {
                          const isHidden = configPanel.classList.contains("is-hidden");
                          configPanel.classList.toggle("is-hidden");
                          const button = document.querySelector('[aria-controls="analysis-config-panel"]') as HTMLButtonElement;
                          if (button) {
                            button.setAttribute("aria-expanded", String(!isHidden));
                          }
                        }
                      }}
                      aria-expanded="false"
                      aria-controls="analysis-config-panel"
                    >
                      <span>⚙️ Configure Analysis</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Configuration Panel - User Adjustable Parameters */}
            <div id="analysis-config-panel" className="box mb-6 is-hidden">
              <h3 className="title is-5 mb-4">Analysis Configuration</h3>
              <div className="columns">
                {/* Anomaly Detection Configuration */}
                <div className="column">
                  <h4 className="title is-6 mb-3">Anomaly Detection</h4>
                  <div className="field">
                    <label className="label">Detection Threshold (Z-score)</label>
                    <div className="control">
                      <input
                        className="input"
                        type="number"
                        min="1"
                        max="5"
                        step="0.1"
                        value={analysisConfig.anomalyThreshold}
                        onChange={(e) =>
                          setAnalysisConfig((prev) => ({
                            ...prev,
                            anomalyThreshold: parseFloat(e.target.value) || 2.5,
                          }))
                        }
                        aria-label="Anomaly detection threshold"
                      />
                    </div>
                    <p className="help">Higher values detect fewer but more extreme anomalies</p>
                  </div>
                  <div className="field">
                    <label className="label">Detection Method</label>
                    <div className="control">
                      <div className="select is-fullwidth">
                        <select
                          value={analysisConfig.anomalyMethod}
                          onChange={(e) =>
                            setAnalysisConfig((prev) => ({
                              ...prev,
                              anomalyMethod: e.target.value as "zscore" | "iqr" | "isolation",
                            }))
                          }
                          aria-label="Anomaly detection method"
                        >
                          <option value="zscore">Z-Score (Standard Deviation)</option>
                          <option value="iqr">IQR (Interquartile Range)</option>
                          <option value="isolation">Isolation Forest</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time Series Configuration */}
                <div className="column">
                  <h4 className="title is-6 mb-3">Time Series Analysis</h4>
                  <div className="field">
                    <label className="label">Trend Window Size</label>
                    <div className="control">
                      <input
                        className="input"
                        type="number"
                        min="10"
                        max="1000"
                        step="10"
                        value={analysisConfig.trendWindow}
                        onChange={(e) =>
                          setAnalysisConfig((prev) => ({
                            ...prev,
                            trendWindow: parseInt(e.target.value) || 100,
                          }))
                        }
                        aria-label="Trend window size"
                      />
                    </div>
                    <p className="help">Number of data points for trend calculation</p>
                  </div>
                  <div className="field">
                    <label className="label">Forecast Periods</label>
                    <div className="control">
                      <input
                        className="input"
                        type="number"
                        min="1"
                        max="50"
                        step="1"
                        value={analysisConfig.forecastPeriods}
                        onChange={(e) =>
                          setAnalysisConfig((prev) => ({
                            ...prev,
                            forecastPeriods: parseInt(e.target.value) || 10,
                          }))
                        }
                        aria-label="Forecast periods"
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={analysisConfig.seasonalityDetection}
                        onChange={(e) =>
                          setAnalysisConfig((prev) => ({
                            ...prev,
                            seasonalityDetection: e.target.checked,
                          }))
                        }
                      />
                      Enable Seasonality Detection
                    </label>
                  </div>
                </div>

                {/* Correlation Configuration */}
                <div className="column">
                  <h4 className="title is-6 mb-3">Correlation Analysis</h4>
                  <div className="field">
                    <label className="label">Minimum Correlation</label>
                    <div className="control">
                      <input
                        className="input"
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={analysisConfig.minCorrelation}
                        onChange={(e) =>
                          setAnalysisConfig((prev) => ({
                            ...prev,
                            minCorrelation: parseFloat(e.target.value) || 0.2,
                          }))
                        }
                        aria-label="Minimum correlation threshold"
                      />
                    </div>
                    <p className="help">Filter correlations below this threshold</p>
                  </div>
                  <div className="field">
                    <label className="label">Correlation Method</label>
                    <div className="control">
                      <div className="select is-fullwidth">
                        <select
                          value={analysisConfig.correlationMethod}
                          onChange={(e) =>
                            setAnalysisConfig((prev) => ({
                              ...prev,
                              correlationMethod: e.target.value as "pearson" | "spearman",
                            }))
                          }
                          aria-label="Correlation method"
                        >
                          <option value="pearson">Pearson (Linear)</option>
                          <option value="spearman">Spearman (Rank-based)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Capacity Planning Configuration */}
                <div className="column">
                  <h4 className="title is-6 mb-3">Capacity Planning</h4>
                  <div className="field">
                    <label className="label">Expected Growth Rate (%)</label>
                    <div className="control">
                      <input
                        className="input"
                        type="number"
                        min="0"
                        max="100"
                        step="5"
                        value={analysisConfig.growthRate}
                        onChange={(e) =>
                          setAnalysisConfig((prev) => ({
                            ...prev,
                            growthRate: parseFloat(e.target.value) || 20,
                          }))
                        }
                        aria-label="Expected growth rate"
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Capacity Headroom (%)</label>
                    <div className="control">
                      <input
                        className="input"
                        type="number"
                        min="0"
                        max="100"
                        step="5"
                        value={analysisConfig.headroom}
                        onChange={(e) =>
                          setAnalysisConfig((prev) => ({
                            ...prev,
                            headroom: parseFloat(e.target.value) || 30,
                          }))
                        }
                        aria-label="Capacity headroom"
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Cost per 1000 Items ($)</label>
                    <div className="control">
                      <input
                        className="input"
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        value={analysisConfig.costPerUnit}
                        onChange={(e) =>
                          setAnalysisConfig((prev) => ({
                            ...prev,
                            costPerUnit: parseFloat(e.target.value) || 0.01,
                          }))
                        }
                        aria-label="Cost per unit"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Filtering Configuration */}
              <div className="box mt-4">
                <h4 className="title is-6 mb-3">Data Filtering</h4>
                <div className="columns">
                  <div className="column">
                    <div className="field">
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={analysisConfig.outlierRemoval}
                          onChange={(e) =>
                            setAnalysisConfig((prev) => ({
                              ...prev,
                              outlierRemoval: e.target.checked,
                            }))
                          }
                        />
                        Remove Outliers Before Analysis
                      </label>
                    </div>
                  </div>
                  {analysisConfig.outlierRemoval && (
                    <>
                      <div className="column">
                        <div className="field">
                          <label className="label">Outlier Detection Method</label>
                          <div className="control">
                            <div className="select is-fullwidth">
                              <select
                                value={analysisConfig.outlierMethod}
                                onChange={(e) =>
                                  setAnalysisConfig((prev) => ({
                                    ...prev,
                                    outlierMethod: e.target.value as "iqr" | "zscore",
                                  }))
                                }
                                aria-label="Outlier detection method"
                              >
                                <option value="zscore">Z-Score</option>
                                <option value="iqr">IQR (Interquartile Range)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="column">
                        <div className="field">
                          <label className="label">Outlier Threshold</label>
                          <div className="control">
                            <input
                              className="input"
                              type="number"
                              min="1"
                              max="5"
                              step="0.1"
                              value={analysisConfig.outlierThreshold}
                              onChange={(e) =>
                                setAnalysisConfig((prev) => ({
                                  ...prev,
                                  outlierThreshold: parseFloat(e.target.value) || 2.5,
                                }))
                              }
                              aria-label="Outlier threshold"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Reset to Defaults Button */}
              <div className="field is-grouped mt-4">
                <div className="control">
                  <button
                    className="button is-light"
                    onClick={() =>
                      setAnalysisConfig({
                        anomalyThreshold: 2.5,
                        anomalyMethod: "zscore",
                        trendWindow: 100,
                        forecastPeriods: 10,
                        seasonalityDetection: true,
                        minCorrelation: 0.2,
                        correlationMethod: "pearson",
                        growthRate: 20,
                        headroom: 30,
                        costPerUnit: 0.01,
                        outlierRemoval: false,
                        outlierMethod: "iqr",
                        outlierThreshold: 2.5,
                      })
                    }
                  >
                    Reset to Defaults
                  </button>
                </div>
              </div>
            </div>

            {/* Descriptive Statistics */}
            {analysisType === "descriptive" && (
              <div className="box mb-6">
                <h3 className="title is-4 mb-4">Descriptive Statistics</h3>
                <div className={`level ${isMobile ? "is-mobile" : ""}`}>
                  <div className="level-item has-text-centered">
                    <div>
                      <p className="heading">Total Value</p>
                      <p className="title is-5">{stats.totalValue.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="level-item has-text-centered">
                    <div>
                      <p className="heading">Average (Mean)</p>
                      <p className="title is-5">{stats.averageValue.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="level-item has-text-centered">
                    <div>
                      <p className="heading">Median</p>
                      <p className="title is-5">{stats.median.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="level-item has-text-centered">
                    <div>
                      <p className="heading">Std Deviation</p>
                      <p className="title is-5">{stats.standardDeviation.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className={`level ${isMobile ? "is-mobile" : ""} mt-4`}>
                  <div className="level-item has-text-centered">
                    <div>
                      <p className="heading">Min Value</p>
                      <p className="title is-5">{stats.minValue.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="level-item has-text-centered">
                    <div>
                      <p className="heading">Q1 (25th percentile)</p>
                      <p className="title is-5">{stats.quartiles.q1.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="level-item has-text-centered">
                    <div>
                      <p className="heading">Q2 (Median)</p>
                      <p className="title is-5">{stats.quartiles.q2.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="level-item has-text-centered">
                    <div>
                      <p className="heading">Q3 (75th percentile)</p>
                      <p className="title is-5">{stats.quartiles.q3.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="level-item has-text-centered">
                    <div>
                      <p className="heading">Max Value</p>
                      <p className="title is-5">{stats.maxValue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="heading mb-2">Distribution Metrics</p>
                  <div className="content">
                    <p><strong>Coefficient of Variation:</strong> {((stats.standardDeviation / stats.averageValue) * 100).toFixed(2)}%</p>
                    <p><strong>Range:</strong> {stats.maxValue - stats.minValue}</p>
                    <p><strong>IQR (Interquartile Range):</strong> {stats.quartiles.q3 - stats.quartiles.q1}</p>
                    <p><strong>Skewness Indicator:</strong> {stats.averageValue > stats.median ? "Right-skewed (positive)" : stats.averageValue < stats.median ? "Left-skewed (negative)" : "Symmetric"}</p>
                  </div>
                </div>
                {Object.keys(stats.categoryCounts).length > 0 && (
                  <div className="mt-4">
                    <p className="heading mb-2">Category Distribution</p>
                    <div className="tags">
                      {Object.entries(stats.categoryCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, isMobile ? 5 : 10)
                        .map(([category, count]) => (
                          <span key={category} className="tag is-primary">
                            {category}: {count.toLocaleString()} ({(count / filteredData.length * 100).toFixed(1)}%)
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Time Series Analysis */}
            {analysisType === "time-series" && (
              <div className="box mb-6">
                <h3 className="title is-4 mb-4">Time Series Analysis</h3>
                {timeSeriesAnalysis ? (
                  <div>
                    <div className="level">
                      <div className="level-item has-text-centered">
                        <div>
                          <p className="heading">Trend</p>
                          <p className={`title is-5 ${
                            timeSeriesAnalysis.trend === "increasing" ? "has-text-success" :
                            timeSeriesAnalysis.trend === "decreasing" ? "has-text-danger" :
                            timeSeriesAnalysis.trend === "volatile" ? "has-text-warning" :
                            "has-text-info"
                          }`}>
                            {timeSeriesAnalysis.trend.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="level-item has-text-centered">
                        <div>
                          <p className="heading">Trend Strength</p>
                          <p className="title is-5">{timeSeriesAnalysis.trendStrength.toFixed(4)}</p>
                        </div>
                      </div>
                      <div className="level-item has-text-centered">
                        <div>
                          <p className="heading">Seasonality</p>
                          <p className="title is-5">{timeSeriesAnalysis.seasonality ? "Yes" : "No"}</p>
                        </div>
                      </div>
                    </div>
                    {timeSeriesAnalysis.forecast.length > 0 && (
                      <div className="mt-4">
                        <h4 className="title is-5 mb-3">Forecast (Next 10 Periods)</h4>
                        <div className="table-container">
                          <table className="table is-fullwidth is-hoverable">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Predicted Value</th>
                                <th>Confidence</th>
                              </tr>
                            </thead>
                            <tbody>
                              {timeSeriesAnalysis.forecast.map((f, i) => (
                                <tr key={i}>
                                  <td>{f.date}</td>
                                  <td>{f.predicted.toFixed(2)}</td>
                                  <td>
                                    <progress
                                      className="progress is-primary"
                                      value={f.confidence * 100}
                                      max={100}
                                    >
                                      {(f.confidence * 100).toFixed(0)}%
                                    </progress>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="has-text-centered py-6">
                    <p className="subtitle">Calculating time series analysis...</p>
                  </div>
                )}
              </div>
            )}

            {/* Correlation Analysis */}
            {analysisType === "correlation" && (
              <div className="box mb-6">
                <h3 className="title is-4 mb-4">Correlation Analysis</h3>
                {correlationAnalysis ? (
                  <div>
                    <div className="table-container">
                      <table className="table is-fullwidth is-hoverable">
                        <thead>
                          <tr>
                            <th>Field 1</th>
                            <th>Field 2</th>
                            <th>Correlation Coefficient</th>
                            <th>Strength</th>
                          </tr>
                        </thead>
                        <tbody>
                          {correlationAnalysis.correlations.map((corr, i) => {
                            const strength = Math.abs(corr.value);
                            const strengthLabel = strength > 0.7 ? "Strong" : strength > 0.4 ? "Moderate" : strength > 0.2 ? "Weak" : "Very Weak";
                            return (
                              <tr key={i}>
                                <td>{corr.field1}</td>
                                <td>{corr.field2}</td>
                                <td>{corr.value.toFixed(4)}</td>
                                <td>
                                  <span className={`tag ${
                                    strength > 0.7 ? "is-success" :
                                    strength > 0.4 ? "is-warning" :
                                    "is-light"
                                  }`}>
                                    {strengthLabel}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {correlationAnalysis.strongest && (
                      <div className="box mt-4">
                        <p className="title is-5">Strongest Correlation</p>
                        <p>
                          <strong>{correlationAnalysis.strongest.field1}</strong> and{" "}
                          <strong>{correlationAnalysis.strongest.field2}</strong>:{" "}
                          {correlationAnalysis.strongest.value.toFixed(4)}
                        </p>
                        <p className="help mt-2">
                          {Math.abs(correlationAnalysis.strongest.value) > 0.7
                            ? "Strong correlation suggests these metrics may be related."
                            : "Moderate correlation - further investigation recommended."}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="has-text-centered py-6">
                    <p className="subtitle">Calculating correlations...</p>
                  </div>
                )}
              </div>
            )}

            {/* Anomaly Detection */}
            {analysisType === "anomaly" && (
              <div className="box mb-6">
                <h3 className="title is-4 mb-4">Anomaly Detection</h3>
                {anomalyDetection ? (
                  <div>
                    <div className="level mb-4">
                      <div className="level-item has-text-centered">
                        <div>
                          <p className="heading">Anomalies Detected</p>
                          <p className="title is-5">{anomalyDetection.anomalies.length}</p>
                        </div>
                      </div>
                      <div className="level-item has-text-centered">
                        <div>
                          <p className="heading">Anomaly Rate</p>
                          <p className="title is-5">{anomalyDetection.anomalyRate.toFixed(2)}%</p>
                        </div>
                      </div>
                      <div className="level-item has-text-centered">
                        <div>
                          <p className="heading">Detection Threshold</p>
                          <p className="title is-5">{anomalyDetection.threshold}σ</p>
                        </div>
                      </div>
                    </div>
                    {anomalyDetection.anomalies.length > 0 && (
                      <div className="table-container">
                        <table className="table is-fullwidth is-hoverable">
                          <thead>
                            <tr>
                              <th>Item Name</th>
                              <th>Value</th>
                              <th>Category</th>
                              <th>Z-Score</th>
                              <th>Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {anomalyDetection.anomalies.map((anomaly, i) => (
                              <tr key={i} className={anomaly.score > 3 ? "has-background-danger-light" : "has-background-warning-light"}>
                                <td>{anomaly.item.name}</td>
                                <td><strong>{anomaly.item.value.toLocaleString()}</strong></td>
                                <td>{anomaly.item.category}</td>
                                <td>{anomaly.score.toFixed(2)}</td>
                                <td>{anomaly.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="has-text-centered py-6">
                    <p className="subtitle">Detecting anomalies...</p>
                  </div>
                )}
              </div>
            )}

            {/* Forecast & Prediction */}
            {analysisType === "forecast" && timeSeriesAnalysis && (
              <div className="box mb-6">
                <h3 className="title is-4 mb-4">Forecast & Prediction</h3>
                <div className="content">
                  <p><strong>Current Trend:</strong> {timeSeriesAnalysis.trend}</p>
                  <p><strong>Trend Strength:</strong> {timeSeriesAnalysis.trendStrength.toFixed(4)}</p>
                  {timeSeriesAnalysis.forecast.length > 0 && (
                    <div className="mt-4">
                      <h4 className="title is-5 mb-3">Predicted Values</h4>
                      <div className="table-container">
                        <table className="table is-fullwidth is-hoverable">
                          <thead>
                            <tr>
                              <th>Period</th>
                              <th>Predicted Value</th>
                              <th>Confidence Interval</th>
                              <th>Risk Level</th>
                            </tr>
                          </thead>
                          <tbody>
                            {timeSeriesAnalysis.forecast.map((f, i) => {
                              const riskLevel = f.confidence > 0.8 ? "Low" : f.confidence > 0.6 ? "Medium" : "High";
                              return (
                                <tr key={i}>
                                  <td>{f.date}</td>
                                  <td><strong>{f.predicted.toFixed(2)}</strong></td>
                                  <td>±{((1 - f.confidence) * f.predicted).toFixed(2)}</td>
                                  <td>
                                    <span className={`tag ${
                                      riskLevel === "Low" ? "is-success" :
                                      riskLevel === "Medium" ? "is-warning" :
                                      "is-danger"
                                    }`}>
                                      {riskLevel}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Capacity Planning */}
            {analysisType === "capacity" && (
              <div className="box mb-6">
                <h3 className="title is-4 mb-4">Capacity Planning & Recommendations</h3>
                {capacityPlanning ? (
                  <div>
                    <div className="level mb-4">
                      <div className="level-item has-text-centered">
                        <div>
                          <p className="heading">Current Load</p>
                          <p className="title is-5">{capacityPlanning.currentLoad.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="level-item has-text-centered">
                        <div>
                          <p className="heading">Projected Load</p>
                          <p className="title is-5">{capacityPlanning.projectedLoad.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="level-item has-text-centered">
                        <div>
                          <p className="heading">Recommended Capacity</p>
                          <p className="title is-5 has-text-primary">{capacityPlanning.recommendedCapacity.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="level-item has-text-centered">
                        <div>
                          <p className="heading">Estimated Cost</p>
                          <p className="title is-5">${capacityPlanning.costEstimate.toFixed(2)}/month</p>
                        </div>
                      </div>
                    </div>
                    <div className="box">
                      <h4 className="title is-5 mb-3">Architecture Recommendations</h4>
                      <div className="content">
                        <ul>
                          {capacityPlanning.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                        {capacityPlanning.recommendations.length === 0 && (
                          <p>Current capacity is sufficient for projected load.</p>
                        )}
                      </div>
                    </div>
                    <div className="box mt-4">
                      <h4 className="title is-5 mb-3">Scaling Strategy</h4>
                      <div className="content">
                        <p><strong>Growth Rate:</strong> 20% (projected)</p>
                        <p><strong>Headroom:</strong> 30% (recommended)</p>
                        <p><strong>Scaling Approach:</strong> {
                          capacityPlanning.recommendedCapacity > 1000000
                            ? "Multi-region distributed architecture"
                            : capacityPlanning.recommendedCapacity > 500000
                            ? "Horizontal scaling with load balancing"
                            : "Vertical scaling or single-region deployment"
                        }</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="has-text-centered py-6">
                    <p className="subtitle">Calculating capacity recommendations...</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Performance Metrics */}
        <div className="box mb-6">
          <h3 className="title is-4 mb-4">Performance Metrics</h3>
          <div className={`level ${isMobile ? "is-mobile" : ""}`}>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Total Items</p>
                <p className="title is-5">{TOTAL_ITEMS.toLocaleString()}</p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Filtered Items</p>
                <p className="title is-5">{filteredData.length.toLocaleString()}</p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Render Time</p>
                <p className="title is-5">{renderTime.toFixed(2)}ms</p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Memory Usage</p>
                <p className="title is-5">
                  {memoryUsage > 0 ? `${memoryUsage.toFixed(2)} MB` : "N/A"}
                </p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">FPS</p>
                <p className="title is-5">{fps}</p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Search Time</p>
                <p className="title is-5">{searchPerformance.toFixed(2)}ms</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter - Only show in table view */}
        {viewMode === "table" && (
          <div className="box mb-6">
            <div className={`field ${isMobile ? "" : "is-grouped"}`}>
              <div className="control is-expanded">
                <label htmlFor="search-input" className="label is-sr-only">
                  Search items
                </label>
                <input
                  id="search-input"
                  className="input"
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSearchTerm("");
                      setCurrentPage(1);
                    }
                  }}
                  aria-label="Search items by name, category, or value"
                  aria-describedby="search-help"
                />
                <p id="search-help" className="help is-sr-only">
                  Search through {TOTAL_ITEMS.toLocaleString()} items. Press Escape to clear.
                </p>
              </div>
              <div className={`control ${isMobile ? "mt-2" : ""}`}>
                <label htmlFor="render-method-select" className="label is-sr-only">
                  Rendering method
                </label>
                <div className="select is-fullwidth">
                  <select
                    id="render-method-select"
                    value={renderMethod}
                    onChange={(e) =>
                      setRenderMethod(e.target.value as "virtual" | "traditional")
                    }
                    aria-label="Select rendering method"
                  >
                    <option value="virtual">Virtual Scrolling</option>
                    <option value="traditional">Traditional Rendering</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Table - Only show in table view */}
        {viewMode === "table" && (
          <div className="box">
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              onTouchStart={handleTouchStart}
              className="has-background-white"
              style={{
                maxHeight: isMobile ? "400px" : "600px",
                overflowY: "auto",
                overflowX: "hidden",
              }}
              role="region"
              aria-label="Data items list"
              aria-live="polite"
              tabIndex={0}
            >
              {!isMounted ? (
                <div className="has-text-centered py-6" role="status" aria-live="polite">
                  <p className="subtitle">Loading...</p>
                </div>
              ) : Array.isArray(processedData) ? (
                renderMethod === "virtual" ? (
                <div className="is-relative">
                  {/* Simplified virtual scrolling - render visible items only */}
                  <table className="table is-fullwidth is-hoverable" role="table" aria-label="Data items">
                    <thead className="is-sr-only">
                      <tr>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Value</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {virtualItems.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={reducedMotion ? false : { opacity: 0, x: -20 }}
                        animate={reducedMotion ? false : { opacity: 1, x: 0 }}
                        transition={reducedMotion ? {} : { duration: 0.2 }}
                        className={isMobile ? "py-4" : ""}
                        role="row"
                        aria-rowindex={visibleRange.start + index + 1}
                      >
                        <td>
                          <div className={isMobile ? "is-flex is-flex-direction-column" : ""}>
                            <strong>{item.name}</strong>
                            <br />
                            <small className="has-text-grey">{item.category}</small>
                          </div>
                        </td>
                        <td className="is-hidden-mobile">
                          <span className="tag">{item.category}</span>
                        </td>
                        <td className="has-text-right">
                          <div className={isMobile ? "is-flex is-flex-direction-column is-align-items-flex-end" : ""}>
                            <div className="title is-5">{item.value.toLocaleString()}</div>
                            <small className="has-text-grey">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </small>
                          </div>
                        </td>
                        <td className="is-hidden-mobile has-text-right">
                          <small className="has-text-grey">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </small>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                {virtualItems.length < filteredData.length && (
                  <div className="has-text-centered py-6" role="status">
                    <p className="subtitle">
                      Showing {virtualItems.length} of {filteredData.length.toLocaleString()} items
                    </p>
                    <p className="help">Scroll to load more items</p>
                  </div>
                  )}
                </div>
              ) : (
                <div>
                  <table className="table is-fullwidth is-hoverable" role="table" aria-label="Data items">
                    <thead className="is-sr-only">
                      <tr>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Value</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((item, index) => (
                        <motion.tr
                          key={item.id}
                          initial={reducedMotion ? false : { opacity: 0 }}
                          animate={reducedMotion ? false : { opacity: 1 }}
                          role="row"
                          aria-rowindex={index + 1}
                        >
                          <td>
                            <div className={isMobile ? "is-flex is-flex-direction-column" : ""}>
                              <strong>{item.name}</strong>
                              <br />
                              <small className="has-text-grey">{item.category}</small>
                            </div>
                          </td>
                          <td className="is-hidden-mobile">
                            <span className="tag">{item.category}</span>
                          </td>
                          <td className="has-text-right">
                            <div className={isMobile ? "is-flex is-flex-direction-column is-align-items-flex-end" : ""}>
                              <div className="title is-5">{item.value.toLocaleString()}</div>
                              <small className="has-text-grey">
                                {new Date(item.timestamp).toLocaleDateString()}
                              </small>
                            </div>
                          </td>
                          <td className="is-hidden-mobile has-text-right">
                            <small className="has-text-grey">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </small>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
              ) : (
                <div>
                  <h4 className="title is-5 mb-4">Grouped Data</h4>
                  {Object.entries(processedData as Record<string, BigDataItem[]>).map(([key, items]) => (
                    <div key={key} className="mb-4">
                      <h5 className="title is-6 mb-2">{key} ({items.length} items)</h5>
                      <table className="table is-fullwidth is-hoverable">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Value</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.slice(0, 10).map((item) => (
                            <tr key={item.id}>
                              <td>{item.name}</td>
                              <td>{item.value.toLocaleString()}</td>
                              <td>{new Date(item.timestamp).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {items.length > 10 && (
                        <p className="help">Showing first 10 of {items.length} items</p>
                      )}
                    </div>
                  ))}
                </div>
              )
              }
            </div>
          </div>
        )}

        {viewMode === "table" && renderMethod === "traditional" && (
          <div className="box">
            <nav className="pagination is-centered" role="navigation" aria-label="Pagination">
              <button
                className="pagination-previous"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Go to previous page"
                aria-disabled={currentPage === 1}
              >
                Previous
              </button>
              <button
                className="pagination-next"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Go to next page"
                aria-disabled={currentPage >= totalPages}
              >
                Next
              </button>
              <ul className="pagination-list" role="list">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <li key={pageNum} role="listitem">
                      <button
                        className={`pagination-link ${
                          currentPage === pageNum ? "is-current" : ""
                        }`}
                        onClick={() => setCurrentPage(pageNum)}
                        aria-label={`Go to page ${pageNum}`}
                        aria-current={currentPage === pageNum ? "page" : undefined}
                      >
                        {pageNum}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <p className="has-text-centered mt-4" role="status" aria-live="polite">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        )}

        <div className="box mt-6">
          <h3 className="title is-4 mb-4">Performance Comparison</h3>
          <div className="content">
            <p>
              <strong>Virtual Scrolling:</strong> Only renders visible items, dramatically
              reducing DOM nodes and memory usage. Perfect for large datasets.
            </p>
            <p>
              <strong>Traditional Rendering:</strong> Renders all items in the current page,
              simpler but less efficient for very large datasets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

