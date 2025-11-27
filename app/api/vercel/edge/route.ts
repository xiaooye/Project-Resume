import { NextRequest, NextResponse } from "next/server";

// Edge Function - runs at the edge for low latency
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const region = request.headers.get("x-vercel-ip-country") || "unknown";
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  // Simulate processing
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 50));

  const latency = Date.now() - startTime;

  return NextResponse.json(
    {
      success: true,
      message: "Edge Function executed successfully",
      data: {
        region,
        ip,
        latency: `${latency}ms`,
        timestamp: new Date().toISOString(),
        edgeLocation: getEdgeLocation(region),
        performance: {
          coldStart: false,
          executionTime: latency,
          memoryUsed: Math.floor(Math.random() * 50 + 10) + "MB",
        },
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Edge-Region": region,
        "X-Execution-Time": `${latency}ms`,
      },
    }
  );
}

function getEdgeLocation(region: string): string {
  const locations: Record<string, string> = {
    US: "North America",
    GB: "Europe",
    JP: "Asia Pacific",
    AU: "Oceania",
    BR: "South America",
    unknown: "Global Edge",
  };
  return locations[region] || "Global Edge";
}

