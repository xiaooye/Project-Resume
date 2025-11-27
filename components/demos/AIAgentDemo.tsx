"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import AIAgentChatInterface from "./ai-agent/AIAgentChatInterface";
import ModelComparison from "./ai-agent/ModelComparison";
import { AIChatMessage } from "@/types";

type ModelType = "gemini" | "gpt" | "both";

interface ModelMetrics {
  model: "gemini" | "gpt";
  responseTime: number;
  tokenCount?: number;
  cost?: number;
  quality?: number;
  timestamp: number;
}

export default function AIAgentDemo() {
  const [selectedModel, setSelectedModel] = useState<ModelType>("both");
  const [geminiMessages, setGeminiMessages] = useState<AIChatMessage[]>([]);
  const [gptMessages, setGptMessages] = useState<AIChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [metrics, setMetrics] = useState<ModelMetrics[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Responsive design
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  const handleSendMessage = useCallback(
    async (message: string, model: "gemini" | "gpt" | "both") => {
      if (!message.trim() || isGenerating) return;

      const userMessage: AIChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: "user",
        content: message,
        timestamp: Date.now(),
      };

      // Add user message to appropriate chat(s)
      if (model === "gemini" || model === "both") {
        setGeminiMessages((prev) => [...prev, userMessage]);
      }
      if (model === "gpt" || model === "both") {
        setGptMessages((prev) => [...prev, userMessage]);
      }

      setIsGenerating(true);
      const startTime = Date.now();

      try {
        const promises: Promise<void>[] = [];

        // Send to Gemini
        if (model === "gemini" || model === "both") {
          const geminiPromise = (async () => {
            try {
              const geminiHistory = geminiMessages.map((msg) => ({
                role: msg.role,
                content: msg.content,
              }));

              const response = await fetch("/api/ai-agent/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  message,
                  conversationHistory: geminiHistory,
                  stream: true,
                }),
              });

              if (!response.ok) {
                throw new Error(`Gemini API error: ${response.statusText}`);
              }

              const reader = response.body?.getReader();
              const decoder = new TextDecoder();
              let fullResponse = "";
              let buffer = "";
              let assistantMessageId = `msg-${Date.now()}-gemini`;

              // Create initial empty assistant message
              setGeminiMessages((prev) => [
                ...prev,
                {
                  id: assistantMessageId,
                  role: "assistant",
                  content: "",
                  timestamp: Date.now(),
                  model: "gemini",
                },
              ]);

              if (reader) {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split("\n");
                  buffer = lines.pop() || ""; // Keep incomplete line in buffer

                  for (const line of lines) {
                    if (line.trim() && line.startsWith("data: ")) {
                      try {
                        const data = JSON.parse(line.slice(6));
                        if (data.type === "chunk") {
                          fullResponse += data.content;
                          // Update message in real-time
                          setGeminiMessages((prev) => {
                            const index = prev.findIndex((msg) => msg.id === assistantMessageId);
                            if (index !== -1) {
                              const updated = [...prev];
                              updated[index] = {
                                ...updated[index],
                                content: fullResponse,
                              };
                              return updated;
                            }
                            return prev;
                          });
                        } else if (data.type === "done") {
                          const responseTime = Date.now() - startTime;
                          setMetrics((prev) => [
                            ...prev,
                            {
                              model: "gemini",
                              responseTime,
                              timestamp: Date.now(),
                            },
                          ]);
                        }
                      } catch (e) {
                        // Ignore JSON parse errors
                        console.warn("Failed to parse SSE data:", e, line);
                      }
                    }
                  }
                }
              }
            } catch (error) {
              console.error("Gemini error:", error);
              const errorMessage: AIChatMessage = {
                id: `msg-${Date.now()}-gemini-error`,
                role: "assistant",
                content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
                timestamp: Date.now(),
                model: "gemini",
              };
              setGeminiMessages((prev) => [...prev, errorMessage]);
            }
          })();
          promises.push(geminiPromise);
        }

        // Send to GPT
        if (model === "gpt" || model === "both") {
          const gptPromise = (async () => {
            try {
              const gptHistory = gptMessages.map((msg) => ({
                role: msg.role,
                content: msg.content,
              }));

              const response = await fetch("/api/ai-agent/openai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  message,
                  conversationHistory: gptHistory,
                  stream: true,
                  model: "gpt-3.5-turbo",
                }),
              });

              if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.statusText}`);
              }

              const reader = response.body?.getReader();
              const decoder = new TextDecoder();
              let fullResponse = "";
              let buffer = "";
              let tokenInfo: { total?: number; prompt?: number; completion?: number; cost?: number } = {};
              let assistantMessageId = `msg-${Date.now()}-gpt`;

              // Create initial empty assistant message
              setGptMessages((prev) => [
                ...prev,
                {
                  id: assistantMessageId,
                  role: "assistant",
                  content: "",
                  timestamp: Date.now(),
                  model: "gpt",
                },
              ]);

              if (reader) {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split("\n");
                  buffer = lines.pop() || ""; // Keep incomplete line in buffer

                  for (const line of lines) {
                    if (line.trim() && line.startsWith("data: ")) {
                      try {
                        const data = JSON.parse(line.slice(6));
                        if (data.type === "chunk") {
                          fullResponse += data.content;
                          // Update message in real-time
                          setGptMessages((prev) => {
                            const index = prev.findIndex((msg) => msg.id === assistantMessageId);
                            if (index !== -1) {
                              const updated = [...prev];
                              updated[index] = {
                                ...updated[index],
                                content: fullResponse,
                              };
                              return updated;
                            }
                            return prev;
                          });
                        } else if (data.type === "done") {
                          tokenInfo = {
                            total: data.tokens?.total,
                            prompt: data.tokens?.prompt,
                            completion: data.tokens?.completion,
                            cost: data.cost,
                          };
                          const responseTime = Date.now() - startTime;
                          setMetrics((prev) => [
                            ...prev,
                            {
                              model: "gpt",
                              responseTime,
                              tokenCount: tokenInfo.total,
                              cost: tokenInfo.cost,
                              timestamp: Date.now(),
                            },
                          ]);
                        }
                      } catch (e) {
                        // Ignore JSON parse errors
                        console.warn("Failed to parse SSE data:", e, line);
                      }
                    }
                  }
                }
              }
            } catch (error) {
              console.error("GPT error:", error);
              const errorMessage: AIChatMessage = {
                id: `msg-${Date.now()}-gpt-error`,
                role: "assistant",
                content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
                timestamp: Date.now(),
                model: "gpt",
              };
              setGptMessages((prev) => [...prev, errorMessage]);
            }
          })();
          promises.push(gptPromise);
        }

        await Promise.all(promises);
      } catch (error) {
        console.error("Failed to send message:", error);
      } finally {
        setIsGenerating(false);
      }
    },
    [geminiMessages, gptMessages, isGenerating]
  );

  const clearChat = useCallback((model: "gemini" | "gpt" | "both") => {
    if (model === "gemini" || model === "both") {
      setGeminiMessages([]);
    }
    if (model === "gpt" || model === "both") {
      setGptMessages([]);
    }
    setMetrics([]);
  }, []);

  return (
    <div className="container is-fluid mt-6">
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="title is-2 has-text-centered mb-6">
          AI Agent Demo - Gemini & OpenAI
        </h1>
        <p className="subtitle is-5 has-text-centered mb-6">
          Compare Google Gemini and OpenAI GPT models with real-time streaming responses
        </p>

        {/* Technology Tags */}
        <div className="has-text-centered mb-6">
          <span className="tag is-info is-medium">Google Gemini</span>
          <span className="tag is-info is-medium">OpenAI GPT</span>
          <span className="tag is-info is-medium">Streaming Responses</span>
          <span className="tag is-info is-medium">Real-time Comparison</span>
        </div>

        {/* About This Demo */}
        <div className="box mb-6">
          <div className="content">
            <h3 className="title is-4 mb-4">About This Demo</h3>
            <p className="mb-4">
              This demonstration showcases <strong>production-ready AI agent integration</strong> with 
              <strong> Google Gemini</strong> and <strong>OpenAI GPT</strong> APIs. The system supports 
              real-time streaming responses, error handling with retry mechanisms, token management, 
              cost tracking, and multi-model comparison.
            </p>
            <div className="columns">
              <div className="column">
                <h4 className="title is-5 mb-3">Key Features:</h4>
                <ul>
                  <li>Streaming responses for real-time display</li>
                  <li>Automatic retry with exponential backoff</li>
                  <li>Token usage and cost tracking</li>
                  <li>Multi-model side-by-side comparison</li>
                  <li>Context management and conversation history</li>
                  <li>Error handling and graceful degradation</li>
                </ul>
              </div>
              <div className="column">
                <h4 className="title is-5 mb-3">Supported Models:</h4>
                <ul>
                  <li><strong>Google Gemini Pro:</strong> Advanced AI with streaming support</li>
                  <li><strong>OpenAI GPT-3.5 Turbo:</strong> Fast and cost-effective</li>
                  <li><strong>OpenAI GPT-4:</strong> Most capable model (configurable)</li>
                </ul>
              </div>
            </div>
            <p className="mt-4">
              <strong>Note:</strong> API keys must be configured in environment variables. 
              Responses are streamed in real-time for better user experience.
            </p>
          </div>
        </div>

        {/* Model Selection */}
        <div className="box mb-6">
          <h2 className="title is-4 mb-4">Model Selection</h2>
          <div className="field">
            <label className="label">Select Model(s)</label>
            <div className="control">
              <div className="select is-fullwidth">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as ModelType)}
                  disabled={isGenerating}
                  aria-label="Select AI model"
                >
                  <option value="both">Both Models (Compare)</option>
                  <option value="gemini">Google Gemini Only</option>
                  <option value="gpt">OpenAI GPT Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Model Comparison Metrics */}
        {metrics.length > 0 && (
          <ModelComparison metrics={metrics} />
        )}

        {/* Chat Interfaces */}
        {selectedModel === "both" ? (
          <div className="columns">
            <div className="column">
              <AIAgentChatInterface
                messages={geminiMessages}
                onSendMessage={(msg) => handleSendMessage(msg, "gemini")}
                isGenerating={isGenerating}
                model="gemini"
                onClearChat={() => clearChat("gemini")}
                isMobile={isMobile}
              />
            </div>
            <div className="column">
              <AIAgentChatInterface
                messages={gptMessages}
                onSendMessage={(msg) => handleSendMessage(msg, "gpt")}
                isGenerating={isGenerating}
                model="gpt"
                onClearChat={() => clearChat("gpt")}
                isMobile={isMobile}
              />
            </div>
          </div>
        ) : (
          <AIAgentChatInterface
            messages={selectedModel === "gemini" ? geminiMessages : gptMessages}
            onSendMessage={(msg) => handleSendMessage(msg, selectedModel)}
            isGenerating={isGenerating}
            model={selectedModel}
            onClearChat={() => clearChat(selectedModel)}
            isMobile={isMobile}
          />
        )}
      </motion.div>
    </div>
  );
}

