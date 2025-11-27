"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { InferenceResult } from "@/lib/onnx/model-manager";

interface TextClassificationInterfaceProps {
  onRunInference: (text: string) => Promise<InferenceResult>;
  isModelLoaded: boolean;
  modelType: "text-classification" | "sentiment-analysis";
}

export default function TextClassificationInterface({
  onRunInference,
  isModelLoaded,
  modelType,
}: TextClassificationInterfaceProps) {
  const [textInput, setTextInput] = useState("");
  const [history, setHistory] = useState<Array<{ text: string; result: InferenceResult }>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [textInput]);

  const handleRun = useCallback(async () => {
    if (!textInput.trim() || !isModelLoaded) return;

    try {
      const result = await onRunInference(textInput.trim());
      setHistory((prev) => [...prev, { text: textInput.trim(), result }]);
      setTextInput("");
    } catch (error) {
      console.error("Inference failed:", error);
      alert(`Inference failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [textInput, isModelLoaded, onRunInference]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleRun();
    }
  };

  const clearHistory = () => {
    if (confirm("Clear analysis history?")) {
      setHistory([]);
    }
  };

  return (
    <div className="box">
      <div className="level mb-4">
        <div className="level-left">
          <div className="level-item">
            <h3 className="title is-5">
              {modelType === "sentiment-analysis" ? "Sentiment Analysis" : "Text Classification"}
            </h3>
          </div>
        </div>
        <div className="level-right">
          <div className="level-item">
            <button
              className="button is-small is-light"
              onClick={clearHistory}
              disabled={history.length === 0}
              aria-label="Clear history"
            >
              <span className="icon is-small">
                <i className="fas fa-trash"></i>
              </span>
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      <div className="field">
        <label className="label">Input Text</label>
        <div className="control">
          <textarea
            ref={textareaRef}
            className="textarea"
            rows={4}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Enter text to ${modelType === "sentiment-analysis" ? "analyze sentiment" : "classify"}... (Ctrl+Enter to run)`}
            aria-label="Text input for classification"
          />
        </div>
        <p className="help">Press Ctrl+Enter to run analysis</p>
      </div>

      <div className="field">
        <button
          className="button is-primary"
          onClick={handleRun}
          disabled={!textInput.trim() || !isModelLoaded}
          aria-label="Run text classification"
        >
          <span className="icon">
            <i className="fas fa-play"></i>
          </span>
          <span>Analyze</span>
        </button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-5">
          <h4 className="title is-6">Analysis History</h4>
          <div className="content">
            {history.slice().reverse().map((item, index) => (
              <div key={index} className="box mb-3">
                <p className="has-text-weight-bold mb-2">Text:</p>
                <p className="mb-3">{item.text}</p>
                {item.result.predictions && item.result.predictions.length > 0 && (
                  <>
                    <p className="has-text-weight-bold mb-2">Results:</p>
                    <table className="table is-fullwidth is-striped">
                      <thead>
                        <tr>
                          <th>Label</th>
                          <th>Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.result.predictions.map((pred, predIndex) => (
                          <tr key={predIndex}>
                            <td>{pred.label}</td>
                            <td>{(pred.confidence * 100).toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

