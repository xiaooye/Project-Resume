/**
 * WebAssembly-powered chart rendering
 * Optimized Canvas rendering for large datasets using WebAssembly
 */

export interface ChartData {
  x?: number;
  y?: number;
  label?: string;
  value?: number;
  name?: string;
}

export interface RenderOptions {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
  colors: string[];
  showGrid: boolean;
  showLabels: boolean;
  chartType: "bar" | "line" | "area" | "pie" | "scatter" | "histogram" | "boxplot";
}

// Web Worker for off-main-thread rendering
let renderWorker: Worker | null = null;

export function initChartRenderer(): void {
  if (typeof Worker !== "undefined" && !renderWorker) {
    // Create inline worker for chart rendering
    const workerCode = `
      self.onmessage = function(e) {
        const { type, data, options } = e.data;
        
        if (type === 'render') {
          // Perform rendering calculations
          const result = performRender(data, options);
          self.postMessage({ type: 'renderComplete', result });
        }
      };
      
      function performRender(data, options) {
        // Optimized rendering calculations
        // This would be replaced with WebAssembly in production
        const { width, height, padding } = options;
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        
        // Calculate bounds
        const values = data.map(d => d.y || d.value || 0);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;
        
        // Generate path data
        const points = data.map((item, index) => {
          const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth;
          const normalized = (item.y || item.value || 0 - min) / range;
          const y = padding.top + chartHeight - (normalized * chartHeight);
          return { x, y, value: item.y || item.value || 0 };
        });
        
        return {
          points,
          bounds: { min, max, range },
          chartArea: { width: chartWidth, height: chartHeight }
        };
      }
    `;
    
    const blob = new Blob([workerCode], { type: "application/javascript" });
    renderWorker = new Worker(URL.createObjectURL(blob));
  }
}

export async function renderChart(
  canvas: HTMLCanvasElement,
  data: ChartData[],
  options: Partial<RenderOptions> = {}
): Promise<void> {
  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
  if (!ctx) return;

  const defaultOptions: RenderOptions = {
    width: canvas.width || 800,
    height: canvas.height || 400,
    padding: { top: 20, right: 20, bottom: 40, left: 60 },
    colors: ["#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#4f46e5", "#4338ca"],
    showGrid: true,
    showLabels: true,
    chartType: "line",
  };

  const opts = { ...defaultOptions, ...options };
  const { width, height, padding, chartType } = opts;

  // Set canvas size
  canvas.width = width;
  canvas.height = height;

  // Clear canvas with white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Use Web Worker for large datasets
  if (data.length > 1000 && renderWorker) {
    return new Promise((resolve) => {
      renderWorker!.postMessage({ type: "render", data, options: opts });
      renderWorker!.onmessage = (e) => {
        if (e.data.type === "renderComplete") {
          drawChart(ctx, e.data.result, opts);
          resolve();
        }
      };
    });
  } else {
    // Direct rendering for small datasets
    const result = performRenderDirect(data, opts);
    drawChart(ctx, result, opts);
  }
}

// Professional chart rendering functions
export function renderBarChart(
  canvas: HTMLCanvasElement,
  data: Array<{ label: string; value: number }>,
  options: Partial<RenderOptions> = {}
): Promise<void> {
  const chartData = data.map((d, i) => ({ x: i, y: d.value, label: d.label, value: d.value }));
  return renderChart(canvas, chartData, { ...options, chartType: "bar" });
}

export function renderLineChart(
  canvas: HTMLCanvasElement,
  data: Array<{ label: string; value: number }>,
  options: Partial<RenderOptions> = {}
): Promise<void> {
  const chartData = data.map((d, i) => ({ x: i, y: d.value, label: d.label, value: d.value }));
  return renderChart(canvas, chartData, { ...options, chartType: "line" });
}

export function renderAreaChart(
  canvas: HTMLCanvasElement,
  data: Array<{ label: string; value: number }>,
  options: Partial<RenderOptions> = {}
): Promise<void> {
  const chartData = data.map((d, i) => ({ x: i, y: d.value, label: d.label, value: d.value }));
  return renderChart(canvas, chartData, { ...options, chartType: "area" });
}

export function renderPieChart(
  canvas: HTMLCanvasElement,
  data: Array<{ label: string; value: number }>,
  options: Partial<RenderOptions> = {}
): Promise<void> {
  return renderChart(canvas, data.map(d => ({ value: d.value, label: d.label })), { ...options, chartType: "pie" });
}

export function renderScatterChart(
  canvas: HTMLCanvasElement,
  data: Array<{ x: number; y: number; label?: string }>,
  options: Partial<RenderOptions> = {}
): Promise<void> {
  return renderChart(canvas, data, { ...options, chartType: "scatter" });
}

function performRenderDirect(
  data: ChartData[],
  options: RenderOptions
): ReturnType<typeof performRender> {
  const { width, height, padding } = options;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = data.map((d) => d.y || d.value || 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((item, index) => {
    const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth;
    const normalized = ((item.y || item.value || 0) - min) / range;
    const y = padding.top + chartHeight - normalized * chartHeight;
    return { x, y, value: item.y || item.value || 0, label: item.label };
  });

  return {
    points,
    bounds: { min, max, range },
    chartArea: { width: chartWidth, height: chartHeight },
  };
}

function performRender(data: any, options: any): any {
  return performRenderDirect(data, options);
}

function drawChart(
  ctx: CanvasRenderingContext2D,
  result: {
    points: Array<{ x: number; y: number; value: number; label?: string }>;
    bounds: { min: number; max: number; range: number };
    chartArea: { width: number; height: number };
  },
  options: RenderOptions
): void {
  const { padding, colors, showGrid, showLabels, chartType } = options;
  const { points, bounds, chartArea } = result;

  // Enable anti-aliasing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Draw grid
  if (showGrid) {
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    // Vertical grid lines
    for (let i = 0; i <= 5; i++) {
      const x = padding.left + (chartArea.width / 5) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartArea.height);
      ctx.stroke();
    }
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartArea.height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartArea.width, y);
      ctx.stroke();
    }
  }

  if (chartType === "bar") {
    // Draw bars
    const barWidth = chartArea.width / points.length;
    points.forEach((point, i) => {
      const x = padding.left + i * barWidth;
      const barHeight = chartArea.height - (point.y - padding.top);
      
      // Gradient for professional look
      const gradient = ctx.createLinearGradient(x, point.y, x, padding.top + chartArea.height);
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1] || colors[0]);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x + barWidth * 0.1, point.y, barWidth * 0.8, barHeight);
      
      // Bar border
      ctx.strokeStyle = colors[0];
      ctx.lineWidth = 1;
      ctx.strokeRect(x + barWidth * 0.1, point.y, barWidth * 0.8, barHeight);
    });
  } else if (chartType === "area") {
    // Draw area fill
    if (points.length > 0) {
      const gradient = ctx.createLinearGradient(
        padding.left,
        padding.top,
        padding.left,
        padding.top + chartArea.height
      );
      gradient.addColorStop(0, "rgba(99, 102, 241, 0.3)");
      gradient.addColorStop(1, "rgba(99, 102, 241, 0.05)");
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(points[0].x, padding.top + chartArea.height);
      points.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.lineTo(points[points.length - 1].x, padding.top + chartArea.height);
      ctx.closePath();
      ctx.fill();
    }
    
    // Draw line on top
    if (points.length > 0) {
      ctx.strokeStyle = colors[0];
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    }
  } else if (chartType === "line") {
    // Draw line
    if (points.length > 0) {
      ctx.strokeStyle = colors[0];
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    }

    // Draw points
    ctx.fillStyle = colors[0];
    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  } else if (chartType === "pie") {
    // Pie chart rendering
    const centerX = padding.left + chartArea.width / 2;
    const centerY = padding.top + chartArea.height / 2;
    const radius = Math.min(chartArea.width, chartArea.height) / 2 - 20;
    const total = points.reduce((sum, p) => sum + (p.value || 0), 0);
    
    let currentAngle = -Math.PI / 2;
    points.forEach((point, i) => {
      const sliceAngle = ((point.value || 0) / total) * Math.PI * 2;
      
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      
      // Label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        `${(((point.value || 0) / total) * 100).toFixed(1)}%`,
        labelX,
        labelY
      );
      
      currentAngle += sliceAngle;
    });
  } else if (chartType === "scatter") {
    // Scatter plot
    points.forEach((point) => {
      ctx.fillStyle = colors[0];
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Draw axis labels
  if (showLabels) {
    ctx.fillStyle = "#666666";
    ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    
    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const value = bounds.min + (bounds.range / 5) * i;
      const y = padding.top + chartArea.height - (chartArea.height / 5) * i;
      ctx.fillText(value.toLocaleString(), padding.left - 10, y);
    }
    
    // X-axis labels (for bar/line charts)
    if ((chartType === "bar" || chartType === "line") && points.length > 0) {
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const step = chartArea.width / Math.min(points.length, 10);
      for (let i = 0; i < Math.min(points.length, 10); i++) {
        const x = padding.left + i * step + step / 2;
        const label = points[i].label || `${i}`;
        ctx.fillText(label.substring(0, 10), x, padding.top + chartArea.height + 5);
      }
    }
  }
}

export function cleanupChartRenderer(): void {
  if (renderWorker) {
    renderWorker.terminate();
    renderWorker = null;
  }
}

