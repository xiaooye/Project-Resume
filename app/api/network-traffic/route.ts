import { NextRequest } from "next/server";

// Stock market level scale: 50 servers across multiple regions
const SERVER_COUNT = 50;
const UPDATE_INTERVAL = 200; // 200ms updates for real-time feel (5 updates per second)
const REGIONS = ["us-east", "us-west", "eu-west", "eu-central", "ap-southeast", "ap-northeast"];

// State to maintain trends and realistic patterns
const serverStates = new Map<string, {
  baseRequests: number;
  baseLatency: number;
  trend: number; // -1 to 1, affects direction
  volatility: number;
  lastValue: number;
}>();

// Initialize server states with realistic patterns
function initializeServerStates() {
  for (let i = 0; i < SERVER_COUNT; i++) {
    const region = REGIONS[i % REGIONS.length];
    const serverId = `${region}-server-${Math.floor(i / REGIONS.length) + 1}`;
    
    serverStates.set(serverId, {
      baseRequests: Math.floor(Math.random() * 5000) + 1000, // 1000-6000 base
      baseLatency: Math.random() * 100 + 20, // 20-120ms base
      trend: (Math.random() - 0.5) * 0.1, // Small trend
      volatility: Math.random() * 0.3 + 0.1, // 10-40% volatility
      lastValue: Math.random(),
    });
  }
}

// Generate realistic network traffic data with trends and correlations
function generateNetworkData() {
  const now = Date.now();
  const data = [];
  
  for (let i = 0; i < SERVER_COUNT; i++) {
    const region = REGIONS[i % REGIONS.length];
    const serverId = `${region}-server-${Math.floor(i / REGIONS.length) + 1}`;
    const state = serverStates.get(serverId)!;
    
    // Update trend (random walk)
    state.trend += (Math.random() - 0.5) * 0.05;
    state.trend = Math.max(-0.5, Math.min(0.5, state.trend)); // Clamp trend
    
    // Calculate requests with trend and volatility (like stock prices)
    const trendEffect = state.baseRequests * state.trend * 0.1;
    const volatilityEffect = state.baseRequests * state.volatility * (Math.random() - 0.5) * 2;
    const requests = Math.max(100, Math.floor(state.baseRequests + trendEffect + volatilityEffect));
    
    // Latency correlated with load (higher load = higher latency)
    const loadFactor = requests / state.baseRequests;
    const latency = Math.max(10, state.baseLatency * (0.8 + loadFactor * 0.4) + Math.random() * 20);
    
    // Throughput correlated with requests
    const throughput = requests * (0.05 + Math.random() * 0.1);
    
    // Error rate increases with high load
    const errorRate = loadFactor > 1.5 ? Math.random() * 8 + 2 : Math.random() * 2;
    
    data.push({
      timestamp: now,
      serverId,
      region,
      requests,
      latency: Math.round(latency * 100) / 100,
      throughput: Math.round(throughput * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
    });
  }
  
  return data;
}

// Initialize on module load
if (serverStates.size === 0) {
  initializeServerStates();
}

export const runtime = "nodejs"; // Ensure Node.js runtime for Vercel compatibility
export const maxDuration = 300; // 5 minutes max for Vercel

export async function GET(request: NextRequest) {
  // Initialize if needed (for serverless cold starts)
  if (serverStates.size === 0) {
    initializeServerStates();
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendData = () => {
        try {
          const data = generateNetworkData();
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error("Error generating network data:", error);
        }
      };

      // Send initial data immediately
      sendData();

      // High-frequency updates for real-time data stream (200ms = 5 updates/sec)
      const interval = setInterval(() => {
        try {
          sendData();
        } catch (error) {
          console.error("Error in data stream:", error);
          clearInterval(interval);
          controller.close();
        }
      }, UPDATE_INTERVAL);

      // Clean up on client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch (e) {
          // Ignore errors on cleanup
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering for Nginx/Vercel
    },
  });
}

