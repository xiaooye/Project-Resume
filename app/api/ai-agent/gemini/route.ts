import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory, stream = true } = await request.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required and must be a string" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Convert conversation history to Gemini format
    const history = conversationHistory?.map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    })) || [];

    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (stream) {
          // Stream response
          const chat = model.startChat({ history });
          const result = await chat.sendMessageStream(message);

          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of result.stream) {
                  const chunkText = chunk.text();
                  const data = JSON.stringify({
                    type: "chunk",
                    content: chunkText,
                  });
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                }

                // Send final metadata
                const metadata = JSON.stringify({
                  type: "done",
                  model: "gemini-pro",
                  timestamp: Date.now(),
                });
                controller.enqueue(encoder.encode(`data: ${metadata}\n\n`));
                controller.close();
              } catch (error) {
                controller.error(error);
              }
            },
          });

          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
        } else {
          // Non-streaming response
          const chat = model.startChat({ history });
          const result = await chat.sendMessage(message);
          const response = await result.response;
          const text = response.text();

          return new Response(
            JSON.stringify({
              text,
              model: "gemini-pro",
              timestamp: Date.now(),
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      } catch (error) {
        lastError = error as Error;
        console.error(`Gemini API attempt ${attempt + 1} failed:`, error);

        // Don't retry on certain errors
        if (error instanceof Error) {
          if (error.message.includes("API key") || error.message.includes("quota")) {
            throw error;
          }
        }

        // Wait before retrying (exponential backoff)
        if (attempt < MAX_RETRIES - 1) {
          await delay(RETRY_DELAY * Math.pow(2, attempt));
        }
      }
    }

    // All retries failed
    throw lastError || new Error("Failed to get response from Gemini API");
  } catch (error) {
    console.error("Gemini API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

