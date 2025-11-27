import { NextRequest, NextResponse } from "next/server";

// In-memory cache simulation (in production, use @vercel/kv)
const cache = new Map<string, { value: any; expires: number; hits: number }>();

export const dynamic = "force-dynamic";

// Simulate Vercel KV operations
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get("key") || "";
  const operation = searchParams.get("operation") || "get";

  if (operation === "get") {
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) {
      cached.hits++;
      return NextResponse.json({
        success: true,
        operation: "get",
        data: {
          key,
          value: cached.value,
          hits: cached.hits,
          ttl: Math.floor((cached.expires - Date.now()) / 1000),
          cached: true,
        },
      });
    }

    return NextResponse.json({
      success: false,
      operation: "get",
      data: {
        key,
        error: "Key not found or expired",
        cached: false,
      },
    });
  }

  if (operation === "list") {
    const keys = Array.from(cache.keys())
      .filter((k) => {
        const item = cache.get(k);
        return item && item.expires > Date.now();
      })
      .map((k) => {
        const item = cache.get(k)!;
        return {
          key: k,
          hits: item.hits,
          ttl: Math.floor((item.expires - Date.now()) / 1000),
        };
      });

    return NextResponse.json({
      success: true,
      operation: "list",
      data: {
        keys,
        count: keys.length,
      },
    });
  }

  if (operation === "stats") {
    const stats = {
      totalKeys: cache.size,
      activeKeys: Array.from(cache.values()).filter((v) => v.expires > Date.now()).length,
      totalHits: Array.from(cache.values()).reduce((sum, v) => sum + v.hits, 0),
      memoryUsage: "~" + Math.floor(cache.size * 0.1) + "KB",
    };

    return NextResponse.json({
      success: true,
      operation: "stats",
      data: stats,
    });
  }

  return NextResponse.json({ success: false, error: "Invalid operation" }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { key, value, ttl = 3600 } = body;

  if (!key || value === undefined) {
    return NextResponse.json({ success: false, error: "Key and value required" }, { status: 400 });
  }

  const expires = Date.now() + ttl * 1000;
  const existing = cache.get(key);

  cache.set(key, {
    value,
    expires,
    hits: existing?.hits || 0,
  });

  return NextResponse.json({
    success: true,
    operation: "set",
    data: {
      key,
      ttl,
      expires: new Date(expires).toISOString(),
    },
  });
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ success: false, error: "Key required" }, { status: 400 });
  }

  const deleted = cache.delete(key);

  return NextResponse.json({
    success: deleted,
    operation: "delete",
    data: {
      key,
      deleted,
    },
  });
}

