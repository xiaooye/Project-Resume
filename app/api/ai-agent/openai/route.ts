import OpenAI from "openai";
import { NextRequest } from "next/server";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory, stream = true, model = "gpt-3.5-turbo" } = await request.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required and must be a string" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const openai = new OpenAI({ apiKey });

    // Convert conversation history to OpenAI format
    const messages = conversationHistory?.map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    })) || [];

    // Add current message
    messages.push({ role: "user", content: message });

    let lastError: Error | null = null;
    let totalTokens = 0;
    let promptTokens = 0;
    let completionTokens = 0;

    // Retry logic
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (stream) {
          // Stream response
          const completion = await openai.chat.completions.create({
            model,
            messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
            stream: true,
          });

          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of completion) {
                  const content = chunk.choices[0]?.delta?.content || "";
                  if (content) {
                    const data = JSON.stringify({
                      type: "chunk",
                      content,
                    });
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                  }

                  // Track token usage if available
                  if (chunk.usage) {
                    totalTokens = chunk.usage.total_tokens || 0;
                    promptTokens = chunk.usage.prompt_tokens || 0;
                    completionTokens = chunk.usage.completion_tokens || 0;
                  }
                }

                // Send final metadata
                const metadata = JSON.stringify({
                  type: "done",
                  model,
                  timestamp: Date.now(),
                  tokens: {
                    total: totalTokens,
                    prompt: promptTokens,
                    completion: completionTokens,
                  },
                  // Cost estimation (approximate, varies by model)
                  cost: estimateCost(model, promptTokens, completionTokens),
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
          const completion = await openai.chat.completions.create({
            model,
            messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
            stream: false,
          });

          const response = completion.choices[0]?.message?.content || "";
          const usage = completion.usage;

          return new Response(
            JSON.stringify({
              text: response,
              model,
              timestamp: Date.now(),
              tokens: {
                total: usage?.total_tokens || 0,
                prompt: usage?.prompt_tokens || 0,
                completion: usage?.completion_tokens || 0,
              },
              cost: estimateCost(
                model,
                usage?.prompt_tokens || 0,
                usage?.completion_tokens || 0
              ),
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      } catch (error) {
        lastError = error as Error;
        console.error(`OpenAI API attempt ${attempt + 1} failed:`, error);

        // Don't retry on certain errors
        if (error instanceof Error) {
          if (error.message.includes("API key") || error.message.includes("quota") || error.message.includes("rate limit")) {
            // Wait longer for rate limits
            if (error.message.includes("rate limit") && attempt < MAX_RETRIES - 1) {
              await delay(RETRY_DELAY * Math.pow(2, attempt + 1));
              continue;
            }
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
    throw lastError || new Error("Failed to get response from OpenAI API");
  } catch (error) {
    console.error("OpenAI API error:", error);
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

// Cost estimation function (approximate, based on OpenAI pricing as of 2024)
function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing: Record<string, { prompt: number; completion: number }> = {
    "gpt-4": { prompt: 0.03 / 1000, completion: 0.06 / 1000 },
    "gpt-4-turbo": { prompt: 0.01 / 1000, completion: 0.03 / 1000 },
    "gpt-3.5-turbo": { prompt: 0.0015 / 1000, completion: 0.002 / 1000 },
  };

  const modelPricing = pricing[model] || pricing["gpt-3.5-turbo"];
  const cost = promptTokens * modelPricing.prompt + completionTokens * modelPricing.completion;

  return Math.round(cost * 10000) / 10000; // Round to 4 decimal places
}

