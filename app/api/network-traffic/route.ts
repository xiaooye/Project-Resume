import { NextRequest } from "next/server";

// Stock market level scale: 50 servers across multiple regions
const SERVER_COUNT = 50;
const DEFAULT_UPDATE_INTERVAL = 200; // 200ms updates for real-time feel (5 updates per second)
const REGIONS = ["us-east", "us-west", "eu-west", "eu-central", "ap-southeast", "ap-northeast"];

// Configuration storage per session (using connection ID)
interface SimulationConfig {
  updateInterval: number;
  serverMultipliers: Map<string, number>; // serverId -> multiplier
  downServers: Set<string>;
  scenarios: Array<{
    type: "traffic-spike" | "server-down" | "region-outage" | "ddos";
    enabled: boolean;
    affectedServers?: string[];
    trafficMultiplier?: number;
  }>;
}

const configs = new Map<string, SimulationConfig>();

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

// Get or create config for a session
function getConfig(sessionId: string): SimulationConfig {
  if (!configs.has(sessionId)) {
    configs.set(sessionId, {
      updateInterval: DEFAULT_UPDATE_INTERVAL,
      serverMultipliers: new Map(),
      downServers: new Set(),
      scenarios: [],
    });
  }
  return configs.get(sessionId)!;
}

// Generate realistic network traffic data with trends and correlations
function generateNetworkData(sessionId: string) {
  const config = getConfig(sessionId);
  const now = Date.now();
  const data = [];
  
  // Apply scenarios
  const activeScenarios = config.scenarios.filter(s => s.enabled);
  const downServers = new Set(config.downServers);
  let globalTrafficMultiplier = 1.0;
  
  activeScenarios.forEach(scenario => {
    if (scenario.type === "traffic-spike") {
      globalTrafficMultiplier *= (scenario.trafficMultiplier || 3.0);
    } else if (scenario.type === "server-down" && scenario.affectedServers) {
      scenario.affectedServers.forEach(id => downServers.add(id));
    } else if (scenario.type === "region-outage" && scenario.affectedServers) {
      scenario.affectedServers.forEach(id => downServers.add(id));
    }
  });
  
  for (let i = 0; i < SERVER_COUNT; i++) {
    const region = REGIONS[i % REGIONS.length];
    const serverId = `${region}-server-${Math.floor(i / REGIONS.length) + 1}`;
    const state = serverStates.get(serverId)!;
    
    const isDown = downServers.has(serverId);
    
    if (isDown) {
      data.push({
        timestamp: now,
        serverId,
        region,
        requests: 0,
        latency: 0,
        throughput: 0,
        errorRate: 100,
        isDown: true,
      });
      continue;
    }
    
    // Update trend (random walk)
    state.trend += (Math.random() - 0.5) * 0.05;
    state.trend = Math.max(-0.5, Math.min(0.5, state.trend)); // Clamp trend
    
    // Calculate requests with trend, volatility, manual multiplier, and scenarios
    const trendEffect = state.baseRequests * state.trend * 0.1;
    const volatilityEffect = state.baseRequests * state.volatility * (Math.random() - 0.5) * 2;
    const manualMultiplier = config.serverMultipliers.get(serverId) || 1.0;
    const requests = Math.max(100, Math.floor(
      (state.baseRequests + trendEffect + volatilityEffect) * 
      manualMultiplier * 
      globalTrafficMultiplier
    ));
    
    // Latency correlated with load (higher load = higher latency)
    const loadFactor = requests / state.baseRequests;
    const latency = Math.max(10, state.baseLatency * (0.8 + loadFactor * 0.4) + Math.random() * 20);
    
    // Throughput correlated with requests
    const throughput = requests * (0.05 + Math.random() * 0.1);
    
    // Error rate increases with high load or scenarios
    let errorRate = loadFactor > 1.5 ? Math.random() * 8 + 2 : Math.random() * 2;
    if (activeScenarios.some(s => s.type === "ddos")) {
      errorRate += Math.random() * 10;
    }
    
    data.push({
      timestamp: now,
      serverId,
      region,
      requests: Math.round(requests),
      latency: Math.round(latency * 100) / 100,
      throughput: Math.round(throughput * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      isDown: false,
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

  // Get session ID from query params or generate one
  const sessionId = request.nextUrl.searchParams.get("sessionId") || 
    `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const config = getConfig(sessionId);
  const updateInterval = config.updateInterval || DEFAULT_UPDATE_INTERVAL;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendData = () => {
        try {
          const data = generateNetworkData(sessionId);
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error("Error generating network data:", error);
        }
      };

      // Send initial data immediately
      sendData();

      // High-frequency updates for real-time data stream
      const interval = setInterval(() => {
        try {
          // Re-read config in case it was updated
          const currentConfig = getConfig(sessionId);
          const currentInterval = currentConfig.updateInterval || DEFAULT_UPDATE_INTERVAL;
          
          // Update interval if changed (restart with new interval)
          if (currentInterval !== updateInterval) {
            clearInterval(interval);
            const newInterval = setInterval(() => {
              try {
                sendData();
              } catch (error) {
                console.error("Error in data stream:", error);
                clearInterval(newInterval);
                controller.close();
              }
            }, currentInterval);
            
            // Clean up on disconnect
            request.signal.addEventListener("abort", () => {
              clearInterval(newInterval);
              try {
                controller.close();
              } catch (e) {
                // Ignore errors on cleanup
              }
            });
            return;
          }
          
          sendData();
        } catch (error) {
          console.error("Error in data stream:", error);
          clearInterval(interval);
          controller.close();
        }
      }, updateInterval);

      // Clean up on client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        // Clean up config after 5 minutes of inactivity
        setTimeout(() => {
          configs.delete(sessionId);
        }, 5 * 60 * 1000);
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
      "X-Session-Id": sessionId, // Send session ID to client
    },
  });
}

// POST endpoint to update configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, config: configUpdate } = body;
    
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "sessionId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const config = getConfig(sessionId);
    
    // Update configuration
    if (configUpdate.updateInterval !== undefined) {
      config.updateInterval = Math.max(50, Math.min(5000, configUpdate.updateInterval));
    }
    
    if (configUpdate.serverMultipliers) {
      Object.entries(configUpdate.serverMultipliers).forEach(([serverId, multiplier]) => {
        config.serverMultipliers.set(serverId, multiplier as number);
      });
    }
    
    if (configUpdate.downServers) {
      config.downServers = new Set(configUpdate.downServers);
    }
    
    if (configUpdate.scenarios) {
      config.scenarios = configUpdate.scenarios;
    }
    
    return new Response(JSON.stringify({ success: true, sessionId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating configuration:", error);
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}

