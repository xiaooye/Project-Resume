import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Simulate Vercel Analytics data
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get("period") || "24h";

  // Generate mock analytics data
  const now = Date.now();
  const periodMs = period === "24h" ? 86400000 : period === "7d" ? 604800000 : 2592000000; // 30d
  const dataPoints = period === "24h" ? 24 : period === "7d" ? 7 : 30;

  const pageViews = Array.from({ length: dataPoints }, (_, i) => ({
    timestamp: new Date(now - (dataPoints - i - 1) * (periodMs / dataPoints)),
    value: Math.floor(Math.random() * 1000 + 500),
  }));

  const uniqueVisitors = Array.from({ length: dataPoints }, (_, i) => ({
    timestamp: new Date(now - (dataPoints - i - 1) * (periodMs / dataPoints)),
    value: Math.floor(Math.random() * 500 + 200),
  }));

  const topPages = [
    { path: "/", views: 1250, unique: 850 },
    { path: "/demos/network-traffic", views: 890, unique: 620 },
    { path: "/demos/big-data", views: 650, unique: 450 },
    { path: "/demos/onnx-ai", views: 520, unique: 380 },
    { path: "/demos/aws", views: 410, unique: 290 },
  ];

  const topReferrers = [
    { source: "Direct", visits: 1200 },
    { source: "Google", visits: 850 },
    { source: "GitHub", visits: 450 },
    { source: "Twitter", visits: 320 },
    { source: "LinkedIn", visits: 280 },
  ];

  const performanceMetrics = {
    lcp: { p50: 1.8, p75: 2.2, p95: 3.1 },
    fid: { p50: 45, p75: 78, p95: 120 },
    cls: { p50: 0.05, p75: 0.08, p95: 0.12 },
    ttfb: { p50: 120, p75: 180, p95: 250 },
  };

  const countries = [
    { country: "US", visits: 1250 },
    { country: "GB", visits: 850 },
    { country: "DE", visits: 620 },
    { country: "JP", visits: 480 },
    { country: "CA", visits: 420 },
  ];

  const devices = [
    { device: "Desktop", visits: 1800, percentage: 52 },
    { device: "Mobile", visits: 1200, percentage: 35 },
    { device: "Tablet", visits: 450, percentage: 13 },
  ];

  return NextResponse.json(
    {
      success: true,
      period,
      data: {
        summary: {
          pageViews: pageViews.reduce((sum, p) => sum + p.value, 0),
          uniqueVisitors: uniqueVisitors.reduce((sum, v) => sum + v.value, 0),
          avgSessionDuration: "3m 24s",
          bounceRate: "42%",
        },
        pageViews,
        uniqueVisitors,
        topPages,
        topReferrers,
        performanceMetrics,
        countries,
        devices,
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

