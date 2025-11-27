import { NextRequest, NextResponse } from "next/server";

// Serverless Function - runs on-demand
export const dynamic = "force-dynamic";
export const maxDuration = 10;

// Simulate cold start tracking
let isColdStart = true;
let lastInvocation = 0;
const COLD_START_THRESHOLD = 60000; // 1 minute

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const now = Date.now();

  // Check if this is a cold start (no invocation in last minute)
  const coldStart = now - lastInvocation > COLD_START_THRESHOLD;
  if (coldStart) {
    isColdStart = true;
  }

  // Simulate cold start delay (50-200ms)
  if (isColdStart) {
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 150 + 50));
  }

  // Simulate function execution
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 100 + 50));

  const executionTime = Date.now() - startTime;
  lastInvocation = now;
  isColdStart = false;

  return NextResponse.json(
    {
      success: true,
      message: "Serverless Function executed successfully",
      data: {
        coldStart,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        performance: {
          coldStartDelay: coldStart ? Math.floor(Math.random() * 150 + 50) : 0,
          warmExecutionTime: executionTime - (coldStart ? Math.floor(Math.random() * 150 + 50) : 0),
          memoryUsed: Math.floor(Math.random() * 100 + 50) + "MB",
          cpuTime: Math.floor(executionTime * 0.8) + "ms",
        },
        metrics: {
          invocations: Math.floor(Math.random() * 1000 + 100),
          errors: Math.floor(Math.random() * 5),
          avgDuration: Math.floor(Math.random() * 200 + 100) + "ms",
          cost: (executionTime / 1000) * 0.0000166667, // $0.0000166667 per GB-second
        },
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Cold-Start": coldStart ? "true" : "false",
        "X-Execution-Time": `${executionTime}ms`,
      },
    }
  );
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const body = await request.json().catch(() => ({}));

  // Simulate processing
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 200 + 100));

  const executionTime = Date.now() - startTime;

  return NextResponse.json(
    {
      success: true,
      message: "Serverless Function processed request",
      data: {
        received: body,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

