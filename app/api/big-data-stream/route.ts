import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Set up SSE headers
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let itemCount = 0;
      const sendData = () => {
        try {
          // Generate batch of data items
          const batch = Array.from({ length: 10 }, (_, i) => ({
            id: `stream-${Date.now()}-${itemCount + i}`,
            name: `Stream Item ${itemCount + i + 1}`,
            value: Math.floor(Math.random() * 10000),
            category: `Category ${(Math.floor(Math.random() * 10) + 1)}`,
            timestamp: Date.now(),
          }));

          const data = JSON.stringify({ items: batch });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          itemCount += batch.length;

          // Continue streaming
          setTimeout(sendData, 100);
        } catch (error) {
          controller.error(error);
        }
      };

      // Start streaming
      sendData();

      // Cleanup on client disconnect
      request.signal.addEventListener("abort", () => {
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering in nginx
    },
  });
}

