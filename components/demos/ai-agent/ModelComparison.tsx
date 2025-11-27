"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface ModelMetrics {
  model: "gemini" | "gpt";
  responseTime: number;
  tokenCount?: number;
  cost?: number;
  quality?: number;
  timestamp: number;
}

interface ModelComparisonProps {
  metrics: ModelMetrics[];
}

export default function ModelComparison({ metrics }: ModelComparisonProps) {
  const prefersReducedMotion = useReducedMotion();

  const comparison = useMemo(() => {
    const geminiMetrics = metrics.filter((m) => m.model === "gemini");
    const gptMetrics = metrics.filter((m) => m.model === "gpt");

    const geminiAvgResponseTime =
      geminiMetrics.length > 0
        ? geminiMetrics.reduce((sum, m) => sum + m.responseTime, 0) / geminiMetrics.length
        : 0;

    const gptAvgResponseTime =
      gptMetrics.length > 0
        ? gptMetrics.reduce((sum, m) => sum + m.responseTime, 0) / gptMetrics.length
        : 0;

    const geminiTotalCost =
      geminiMetrics.reduce((sum, m) => sum + (m.cost || 0), 0);

    const gptTotalCost =
      gptMetrics.reduce((sum, m) => sum + (m.cost || 0), 0);

    const geminiTotalTokens =
      gptMetrics.reduce((sum, m) => sum + (m.tokenCount || 0), 0);

    const gptTotalTokens =
      gptMetrics.reduce((sum, m) => sum + (m.tokenCount || 0), 0);

    return {
      gemini: {
        count: geminiMetrics.length,
        avgResponseTime: geminiAvgResponseTime,
        totalCost: geminiTotalCost,
        totalTokens: geminiTotalTokens,
      },
      gpt: {
        count: gptMetrics.length,
        avgResponseTime: gptAvgResponseTime,
        totalCost: gptTotalCost,
        totalTokens: gptTotalTokens,
      },
    };
  }, [metrics]);

  if (metrics.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="box mb-6"
    >
      <h3 className="title is-4 mb-4">Model Performance Comparison</h3>
      <div className="columns">
        <div className="column">
          <div className="box has-background-primary-light">
            <h4 className="title is-5 has-text-primary">Google Gemini</h4>
            <div className="content">
              <p>
                <strong>Responses:</strong> {comparison.gemini.count}
              </p>
              <p>
                <strong>Avg Response Time:</strong>{" "}
                {comparison.gemini.avgResponseTime > 0
                  ? `${comparison.gemini.avgResponseTime.toFixed(0)} ms`
                  : "N/A"}
              </p>
              {comparison.gemini.totalTokens > 0 && (
                <p>
                  <strong>Total Tokens:</strong> {comparison.gemini.totalTokens.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="column">
          <div className="box has-background-success-light">
            <h4 className="title is-5 has-text-success">OpenAI GPT</h4>
            <div className="content">
              <p>
                <strong>Responses:</strong> {comparison.gpt.count}
              </p>
              <p>
                <strong>Avg Response Time:</strong>{" "}
                {comparison.gpt.avgResponseTime > 0
                  ? `${comparison.gpt.avgResponseTime.toFixed(0)} ms`
                  : "N/A"}
              </p>
              {comparison.gpt.totalTokens > 0 && (
                <p>
                  <strong>Total Tokens:</strong> {comparison.gpt.totalTokens.toLocaleString()}
                </p>
              )}
              {comparison.gpt.totalCost > 0 && (
                <p>
                  <strong>Total Cost:</strong> ${comparison.gpt.totalCost.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="column">
          <div className="box has-background-info-light">
            <h4 className="title is-5 has-text-info">Comparison</h4>
            <div className="content">
              {comparison.gemini.avgResponseTime > 0 && comparison.gpt.avgResponseTime > 0 && (
                <p>
                  <strong>Speed Winner:</strong>{" "}
                  {comparison.gemini.avgResponseTime < comparison.gpt.avgResponseTime
                    ? "Gemini"
                    : "GPT"}{" "}
                  (
                  {Math.abs(comparison.gemini.avgResponseTime - comparison.gpt.avgResponseTime).toFixed(0)} ms
                  {" "}faster)
                </p>
              )}
              <p>
                <strong>Total Responses:</strong> {comparison.gemini.count + comparison.gpt.count}
              </p>
              {comparison.gpt.totalCost > 0 && (
                <p>
                  <strong>Total Cost:</strong> ${(comparison.gemini.totalCost + comparison.gpt.totalCost).toFixed(4)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

