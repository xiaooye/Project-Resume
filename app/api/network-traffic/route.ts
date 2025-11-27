import { NextRequest } from "next/server";

const SERVER_COUNT = 5;

function generateNetworkData() {
  return Array.from({ length: SERVER_COUNT }, (_, i) => ({
    timestamp: Date.now(),
    serverId: `server-${i + 1}`,
    requests: Math.floor(Math.random() * 1000) + 100,
    latency: Math.random() * 200 + 50,
    throughput: Math.random() * 100 + 10,
    errorRate: Math.random() * 5,
  }));
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendData = () => {
        const data = generateNetworkData();
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Send initial data
      sendData();

      // Send data every second
      const interval = setInterval(() => {
        try {
          sendData();
        } catch (error) {
          clearInterval(interval);
          controller.close();
        }
      }, 1000);

      // Clean up on client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

