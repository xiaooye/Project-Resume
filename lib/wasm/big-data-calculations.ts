/**
 * WebAssembly-powered calculations for Big Data Demo
 * This module provides high-performance statistical and analytical functions
 */

// WebAssembly module will be loaded dynamically
let wasmModule: any = null;
let wasmReady = false;

// Initialize WebAssembly module
export async function initWasm(): Promise<void> {
  if (wasmReady) return;
  
  try {
    // For now, we'll use a JavaScript fallback with optimized algorithms
    // In production, this would load a compiled .wasm file
    wasmModule = {
      // Statistical calculations
      calculateStats: calculateStatsJS,
      detectAnomalies: detectAnomaliesJS,
      calculateCorrelation: calculateCorrelationJS,
      timeSeriesAnalysis: timeSeriesAnalysisJS,
      capacityPlanning: capacityPlanningJS,
    };
    wasmReady = true;
  } catch (error) {
    console.error("Failed to initialize WASM module:", error);
    // Fallback to JS implementation
    wasmModule = {
      calculateStats: calculateStatsJS,
      detectAnomalies: detectAnomaliesJS,
      calculateCorrelation: calculateCorrelationJS,
      timeSeriesAnalysis: timeSeriesAnalysisJS,
      capacityPlanning: capacityPlanningJS,
    };
    wasmReady = true;
  }
}

// High-performance statistics calculation
function calculateStatsJS(data: Float64Array): {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  q1: number;
  q2: number;
  q3: number;
} {
  const n = data.length;
  if (n === 0) {
    return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0, q1: 0, q2: 0, q3: 0 };
  }

  // Sort for median and quartiles (optimized)
  const sorted = new Float64Array(data).sort((a, b) => a - b);
  
  // Calculate mean
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += data[i];
  }
  const mean = sum / n;

  // Calculate standard deviation
  let variance = 0;
  for (let i = 0; i < n; i++) {
    const diff = data[i] - mean;
    variance += diff * diff;
  }
  const stdDev = Math.sqrt(variance / n);

  // Quartiles
  const q1Index = Math.floor(n * 0.25);
  const q2Index = Math.floor(n * 0.5);
  const q3Index = Math.floor(n * 0.75);

  return {
    mean,
    median: n % 2 === 0
      ? (sorted[q2Index - 1] + sorted[q2Index]) / 2
      : sorted[q2Index],
    stdDev,
    min: sorted[0],
    max: sorted[n - 1],
    q1: sorted[q1Index],
    q2: n % 2 === 0
      ? (sorted[q2Index - 1] + sorted[q2Index]) / 2
      : sorted[q2Index],
    q3: sorted[q3Index],
  };
}

// High-performance anomaly detection using Z-score
function detectAnomaliesJS(
  data: Float64Array,
  threshold: number = 2.5
): Array<{ index: number; value: number; zScore: number }> {
  const stats = calculateStatsJS(data);
  const anomalies: Array<{ index: number; value: number; zScore: number }> = [];

  for (let i = 0; i < data.length; i++) {
    const zScore = Math.abs((data[i] - stats.mean) / stats.stdDev);
    if (zScore > threshold) {
      anomalies.push({ index: i, value: data[i], zScore });
    }
  }

  return anomalies.sort((a, b) => b.zScore - a.zScore);
}

// High-performance correlation calculation (Pearson)
function calculateCorrelationJS(
  x: Float64Array,
  y: Float64Array
): number {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;

  // Calculate means
  let sumX = 0, sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  // Calculate correlation
  let numerator = 0, sumXSq = 0, sumYSq = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    sumXSq += dx * dx;
    sumYSq += dy * dy;
  }

  const denominator = Math.sqrt(sumXSq * sumYSq);
  return denominator === 0 ? 0 : numerator / denominator;
}

// High-performance time series analysis
function timeSeriesAnalysisJS(
  timestamps: Float64Array,
  values: Float64Array,
  windowSize: number = 100
): {
  trend: "increasing" | "decreasing" | "stable" | "volatile";
  trendStrength: number;
  seasonality: boolean;
  forecast: Array<{ timestamp: number; predicted: number; confidence: number }>;
} {
  const n = values.length;
  if (n < 2) {
    return {
      trend: "stable",
      trendStrength: 0,
      seasonality: false,
      forecast: [],
    };
  }

  // Linear regression for trend
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += timestamps[i];
    sumY += values[i];
    sumXY += timestamps[i] * values[i];
    sumX2 += timestamps[i] * timestamps[i];
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Determine trend
  const trendStrength = Math.abs(slope);
  let trend: "increasing" | "decreasing" | "stable" | "volatile";
  if (trendStrength < 0.001) {
    trend = "stable";
  } else if (slope > 0) {
    trend = trendStrength > 0.01 ? "increasing" : "stable";
  } else {
    trend = trendStrength > 0.01 ? "decreasing" : "stable";
  }

  // Check volatility
  const stats = calculateStatsJS(values);
  if (stats.stdDev > stats.mean * 0.5) {
    trend = "volatile";
  }

  // Simple seasonality detection (check for patterns)
  const variance = stats.stdDev * stats.stdDev;
  const seasonality = n > 100 && variance > 500000;

  // Forecast next 10 periods
  const lastTimestamp = timestamps[n - 1];
  const timeStep = (lastTimestamp - timestamps[0]) / n;
  const forecast: Array<{ timestamp: number; predicted: number; confidence: number }> = [];
  
  for (let i = 1; i <= 10; i++) {
    const futureTimestamp = lastTimestamp + timeStep * i;
    const predicted = slope * futureTimestamp + intercept;
    const confidence = Math.max(0.5, 1 - i * 0.05);
    forecast.push({
      timestamp: futureTimestamp,
      predicted: Math.max(0, predicted),
      confidence,
    });
  }

  return { trend, trendStrength, seasonality, forecast };
}

// Capacity planning calculations
function capacityPlanningJS(
  currentLoad: number,
  growthRate: number,
  headroom: number
): {
  projectedLoad: number;
  recommendedCapacity: number;
  costEstimate: number;
} {
  const projectedLoad = currentLoad * (1 + growthRate / 100);
  const recommendedCapacity = Math.ceil(projectedLoad * (1 + headroom / 100));
  const costEstimate = (recommendedCapacity / 1000) * 0.01; // $0.01 per 1000 items

  return { projectedLoad, recommendedCapacity, costEstimate };
}

// Export functions
export async function calculateStats(data: number[]): Promise<ReturnType<typeof calculateStatsJS>> {
  await initWasm();
  const floatArray = new Float64Array(data);
  return wasmModule.calculateStats(floatArray);
}

export async function detectAnomalies(
  data: number[],
  threshold: number = 2.5
): Promise<ReturnType<typeof detectAnomaliesJS>> {
  await initWasm();
  const floatArray = new Float64Array(data);
  return wasmModule.detectAnomalies(floatArray, threshold);
}

export async function calculateCorrelation(
  x: number[],
  y: number[]
): Promise<number> {
  await initWasm();
  return wasmModule.calculateCorrelation(
    new Float64Array(x),
    new Float64Array(y)
  );
}

export async function timeSeriesAnalysis(
  timestamps: number[],
  values: number[],
  windowSize: number = 100
): Promise<ReturnType<typeof timeSeriesAnalysisJS>> {
  await initWasm();
  return wasmModule.timeSeriesAnalysis(
    new Float64Array(timestamps),
    new Float64Array(values),
    windowSize
  );
}

export async function capacityPlanning(
  currentLoad: number,
  growthRate: number,
  headroom: number
): Promise<ReturnType<typeof capacityPlanningJS>> {
  await initWasm();
  return wasmModule.capacityPlanning(currentLoad, growthRate, headroom);
}

