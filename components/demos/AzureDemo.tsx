"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import * as d3 from "d3";

// Types
type BlobFile = {
  name: string;
  size: number;
  lastModified: Date;
  contentType: string;
  url?: string;
};

type AzureFunction = {
  name: string;
  runtime: string;
  trigger: string;
  status: "running" | "stopped";
  invocationCount: number;
  errorCount: number;
  avgDuration: number;
  cost: number;
  lastExecuted?: Date;
};

type CognitiveServiceResult = {
  service: string;
  input: string;
  result: any;
  confidence?: number;
  timestamp: Date;
};

type CostData = {
  service: string;
  usage: number;
  cost: number;
  unit: string;
  trend: "up" | "down" | "stable";
};

type TabType = "blob" | "functions" | "cognitive" | "ai-services" | "cost";

export default function AzureDemo() {
  const [activeTab, setActiveTab] = useState<TabType>("blob");
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Blob Storage States
  const [blobFiles, setBlobFiles] = useState<BlobFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cdnEnabled, setCdnEnabled] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Azure Functions States
  const [azureFunctions, setAzureFunctions] = useState<AzureFunction[]>([]);
  const [invocationResults, setInvocationResults] = useState<Map<string, any>>(new Map());
  const [invokingFunctions, setInvokingFunctions] = useState<Set<string>>(new Set());

  // Cognitive Services States
  const [cognitiveResults, setCognitiveResults] = useState<CognitiveServiceResult[]>([]);
  const [processingService, setProcessingService] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [inputImage, setInputImage] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // AI Services States
  const [aiServiceResults, setAiServiceResults] = useState<Map<string, any>>(new Map());
  const [processingAiService, setProcessingAiService] = useState<string | null>(null);

  // Cost Analysis States
  const [costData, setCostData] = useState<CostData[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const costChartRef = useRef<SVGSVGElement>(null);

  // Initialize demo data
  useEffect(() => {
    setIsMounted(true);

    // Detect screen size
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleReducedMotion = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    mediaQuery.addEventListener("change", handleReducedMotion);

    // Initialize demo data
    initializeDemoData();

    return () => {
      window.removeEventListener("resize", checkScreenSize);
      mediaQuery.removeEventListener("change", handleReducedMotion);
    };
  }, []);

  // Update cost chart
  useEffect(() => {
    if (costChartRef.current && costData.length > 0) {
      updateCostChart();
    }
  }, [costData]);

  const initializeDemoData = () => {
    // Initialize Blob Storage files
    setBlobFiles([
      {
        name: "documents/contract.pdf",
        size: 1536000,
        lastModified: new Date(Date.now() - 86400000),
        contentType: "application/pdf",
        url: "https://cdn.example.com/documents/contract.pdf",
      },
      {
        name: "images/logo.png",
        size: 512000,
        lastModified: new Date(Date.now() - 172800000),
        contentType: "image/png",
        url: "https://cdn.example.com/images/logo.png",
      },
      {
        name: "videos/presentation.mp4",
        size: 47185920,
        lastModified: new Date(Date.now() - 3600000),
        contentType: "video/mp4",
        url: "https://cdn.example.com/videos/presentation.mp4",
      },
    ]);

    // Initialize Azure Functions
    setAzureFunctions([
      {
        name: "process-document",
        runtime: "node",
        trigger: "http",
        status: "running",
        invocationCount: 850,
        errorCount: 3,
        avgDuration: 1200,
        cost: 0.15,
        lastExecuted: new Date(Date.now() - 300000),
      },
      {
        name: "send-notification",
        runtime: "python",
        trigger: "queue",
        status: "running",
        invocationCount: 3200,
        errorCount: 0,
        avgDuration: 380,
        cost: 0.12,
        lastExecuted: new Date(Date.now() - 60000),
      },
      {
        name: "data-transformer",
        runtime: "dotnet",
        trigger: "blob",
        status: "running",
        invocationCount: 450,
        errorCount: 1,
        avgDuration: 2800,
        cost: 0.22,
        lastExecuted: new Date(Date.now() - 180000),
      },
    ]);

    // Initialize Cost Data
    setCostData([
      { service: "Blob Storage", usage: 50, cost: 0.75, unit: "GB", trend: "stable" },
      { service: "Functions", usage: 4500, cost: 0.49, unit: "executions", trend: "up" },
      { service: "Cognitive Services", usage: 1200, cost: 1.20, unit: "transactions", trend: "up" },
      { service: "AI Services", usage: 800, cost: 2.50, unit: "tokens", trend: "down" },
      { service: "CDN", usage: 200, cost: 0.30, unit: "GB", trend: "stable" },
    ]);
    setTotalCost(5.24);
  };

  const updateCostChart = () => {
    if (!costChartRef.current) return;

    const svg = d3.select(costChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const width = costChartRef.current.clientWidth - margin.left - margin.right;
    const height = costChartRef.current.clientHeight - margin.top - margin.bottom;

    const x = d3
      .scaleBand()
      .domain(costData.map((d) => d.service))
      .range([0, width])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(costData, (d) => d.cost) || 3] as [number, number])
      .nice()
      .range([height, 0]);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("fill", "currentColor")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .style("fill", "currentColor");

    g.selectAll(".bar")
      .data(costData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.service) || 0)
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d.cost))
      .attr("height", (d) => height - y(d.cost))
      .attr("fill", "currentColor")
      .attr("opacity", 0.7);
  };

  // Blob Storage Functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleBlobUpload = async () => {
    if (!selectedFile) return;

    const fileName = `uploads/${Date.now()}-${selectedFile.name}`;
    setUploadingFiles((prev) => new Set(prev).add(fileName));
    setUploadProgress((prev) => new Map(prev).set(fileName, 0));

    // Simulate chunked upload
    const chunkSize = selectedFile.size / 10;
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setUploadProgress((prev) => {
        const updated = new Map(prev);
        updated.set(fileName, ((i + 1) / 10) * 100);
        return updated;
      });
    }

    // Add file to list
    const cdnUrl = cdnEnabled ? `https://cdn.example.com/${fileName}` : undefined;
    setBlobFiles((prev) => [
      ...prev,
      {
        name: fileName,
        size: selectedFile.size,
        lastModified: new Date(),
        contentType: selectedFile.type || "application/octet-stream",
        url: cdnUrl,
      },
    ]);

    setUploadingFiles((prev) => {
      const updated = new Set(prev);
      updated.delete(fileName);
      return updated;
    });
    setUploadProgress((prev) => {
      const updated = new Map(prev);
      updated.delete(fileName);
      return updated;
    });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Update cost
    const newCost = (selectedFile.size / 1024 / 1024 / 1024) * 0.015; // $0.015 per GB
    setCostData((prev) => {
      const updated = [...prev];
      const blobIndex = updated.findIndex((d) => d.service === "Blob Storage");
      if (blobIndex >= 0) {
        updated[blobIndex] = {
          ...updated[blobIndex],
          usage: updated[blobIndex].usage + selectedFile.size / 1024 / 1024 / 1024,
          cost: updated[blobIndex].cost + newCost,
        };
      }
      return updated;
    });
    setTotalCost((prev) => prev + newCost);
  };

  const handleBlobDownload = async (fileName: string) => {
    const file = blobFiles.find((f) => f.name === fileName);
    if (file) {
      alert(`Downloading: ${fileName}\nSize: ${formatBytes(file.size)}\n${cdnEnabled && file.url ? `CDN URL: ${file.url}` : ""}`);
    }
  };

  const handleBlobDelete = async (fileName: string) => {
    if (confirm(`Are you sure you want to delete ${fileName}?`)) {
      const file = blobFiles.find((f) => f.name === fileName);
      if (file) {
        // Update cost
        const savedCost = (file.size / 1024 / 1024 / 1024) * 0.015;
        setCostData((prev) => {
          const updated = [...prev];
          const blobIndex = updated.findIndex((d) => d.service === "Blob Storage");
          if (blobIndex >= 0) {
            updated[blobIndex] = {
              ...updated[blobIndex],
              usage: Math.max(0, updated[blobIndex].usage - file.size / 1024 / 1024 / 1024),
              cost: Math.max(0, updated[blobIndex].cost - savedCost),
            };
          }
          return updated;
        });
        setTotalCost((prev) => Math.max(0, prev - savedCost));
      }
      setBlobFiles((prev) => prev.filter((f) => f.name !== fileName));
    }
  };

  // Azure Functions
  const handleFunctionInvoke = async (functionName: string) => {
    setInvokingFunctions((prev) => new Set(prev).add(functionName));

    try {
      // Simulate async invocation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const result = {
        statusCode: 200,
        body: JSON.stringify({ message: `Function ${functionName} executed successfully`, timestamp: new Date().toISOString() }),
        duration: Math.random() * 1000 + 500,
      };

      setInvocationResults((prev) => {
        const updated = new Map(prev);
        updated.set(functionName, result);
        return updated;
      });

      // Update function stats
      setAzureFunctions((prev) =>
        prev.map((fn) =>
          fn.name === functionName
            ? {
                ...fn,
                invocationCount: fn.invocationCount + 1,
                avgDuration: (fn.avgDuration * fn.invocationCount + result.duration) / (fn.invocationCount + 1),
                cost: fn.cost + 0.0001,
                lastExecuted: new Date(),
              }
            : fn
        )
      );

      // Update cost
      setCostData((prev) => {
        const updated = [...prev];
        const funcIndex = updated.findIndex((d) => d.service === "Functions");
        if (funcIndex >= 0) {
          updated[funcIndex] = {
            ...updated[funcIndex],
            usage: updated[funcIndex].usage + 1,
            cost: updated[funcIndex].cost + 0.0001,
          };
        }
        return updated;
      });
      setTotalCost((prev) => prev + 0.0001);
    } catch (error) {
      setInvocationResults((prev) => {
        const updated = new Map(prev);
        updated.set(functionName, { error: "Invocation failed" });
        return updated;
      });
    } finally {
      setInvokingFunctions((prev) => {
        const updated = new Set(prev);
        updated.delete(functionName);
        return updated;
      });
    }
  };

  // Cognitive Services
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInputImage(file);
    }
  };

  const handleCognitiveService = async (service: string) => {
    if (service === "text-analytics" && !inputText.trim()) {
      alert("Please enter text to analyze");
      return;
    }
    if (service === "computer-vision" && !inputImage) {
      alert("Please select an image");
      return;
    }

    setProcessingService(service);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      let result: any;
      let confidence = 0;

      if (service === "text-analytics") {
        const sentiment = Math.random() > 0.5 ? "positive" : "negative";
        confidence = Math.random() * 0.3 + 0.7;
        result = {
          sentiment,
          confidence: confidence.toFixed(2),
          keyPhrases: ["technology", "cloud", "azure", "services"],
          entities: [{ type: "Organization", text: "Microsoft" }],
        };
      } else if (service === "computer-vision") {
        confidence = Math.random() * 0.2 + 0.8;
        result = {
          description: "A modern office building with glass windows",
          tags: ["building", "architecture", "modern", "office"],
          objects: [{ object: "building", confidence: confidence.toFixed(2) }],
        };
      } else if (service === "speech") {
        confidence = Math.random() * 0.15 + 0.85;
        result = {
          transcript: inputText || "Hello, this is a speech recognition demo.",
          confidence: confidence.toFixed(2),
          language: "en-US",
        };
      }

      const cognitiveResult: CognitiveServiceResult = {
        service,
        input: service === "computer-vision" ? inputImage?.name || "" : inputText,
        result,
        confidence,
        timestamp: new Date(),
      };

      setCognitiveResults((prev) => [cognitiveResult, ...prev.slice(0, 9)]);

      // Update cost
      setCostData((prev) => {
        const updated = [...prev];
        const cogIndex = updated.findIndex((d) => d.service === "Cognitive Services");
        if (cogIndex >= 0) {
          updated[cogIndex] = {
            ...updated[cogIndex],
            usage: updated[cogIndex].usage + 1,
            cost: updated[cogIndex].cost + 0.001,
          };
        }
        return updated;
      });
      setTotalCost((prev) => prev + 0.001);
    } catch (error) {
      alert(`Cognitive service error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setProcessingService(null);
    }
  };

  // AI Services
  const handleAiService = async (service: string) => {
    setProcessingAiService(service);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2500));

      let result: any;

      if (service === "openai-gpt4") {
        result = {
          model: "gpt-4",
          response: "This is a simulated response from Azure OpenAI GPT-4 service.",
          tokens: 150,
          cost: 0.03,
        };
      } else if (service === "openai-embedding") {
        result = {
          model: "text-embedding-ada-002",
          embedding: Array(1536).fill(0).map(() => Math.random()),
          tokens: 50,
          cost: 0.0001,
        };
      } else if (service === "azure-ai-search") {
        result = {
          results: [
            { title: "Document 1", score: 0.95, content: "Relevant content..." },
            { title: "Document 2", score: 0.87, content: "More relevant content..." },
          ],
          cost: 0.002,
        };
      }

      setAiServiceResults((prev) => {
        const updated = new Map(prev);
        updated.set(service, result);
        return updated;
      });

      // Update cost
      setCostData((prev) => {
        const updated = [...prev];
        const aiIndex = updated.findIndex((d) => d.service === "AI Services");
        if (aiIndex >= 0) {
          updated[aiIndex] = {
            ...updated[aiIndex],
            usage: updated[aiIndex].usage + (result.tokens || 1),
            cost: updated[aiIndex].cost + (result.cost || 0.001),
          };
        }
        return updated;
      });
      setTotalCost((prev) => prev + (result.cost || 0.001));
    } catch (error) {
      alert(`AI service error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setProcessingAiService(null);
    }
  };

  // Utility functions
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="container is-fluid mt-6">
      <div className="box liquid-glass-card">
        <h1 className="title is-2 mb-6 liquid-glass-text">Azure Services Integration Demo</h1>
        <p className="subtitle is-5 mb-6 liquid-glass-text">
          Multi-cloud strategy demonstration with Blob Storage, Functions, Cognitive Services, and AI Services
        </p>

        {/* Tabs */}
        <div className="tabs is-boxed">
          <ul>
            <li className={activeTab === "blob" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("blob")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("blob");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Blob Storage tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">📦</span>
                </span>
                <span>Blob Storage</span>
              </a>
            </li>
            <li className={activeTab === "functions" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("functions")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("functions");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Azure Functions tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">⚡</span>
                </span>
                <span>Functions</span>
              </a>
            </li>
            <li className={activeTab === "cognitive" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("cognitive")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("cognitive");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Cognitive Services tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">🧠</span>
                </span>
                <span>Cognitive</span>
              </a>
            </li>
            <li className={activeTab === "ai-services" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("ai-services")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("ai-services");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="AI Services tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">🤖</span>
                </span>
                <span>AI Services</span>
              </a>
            </li>
            <li className={activeTab === "cost" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("cost")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("cost");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Cost Analysis tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">💰</span>
                </span>
                <span>Cost Analysis</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Blob Storage Tab */}
          {activeTab === "blob" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">Azure Blob Storage</h2>
              <div className="box liquid-glass-card mb-4">
                <h3 className="title is-5 mb-4 liquid-glass-text">Upload File</h3>
                <div className="field">
                  <div className="file has-name">
                    <label className="file-label">
                      <input
                        ref={fileInputRef}
                        className="file-input"
                        type="file"
                        onChange={handleFileSelect}
                        aria-label="Select file to upload"
                      />
                      <span className="file-cta">
                        <span className="file-icon">
                          <span aria-hidden="true">📁</span>
                        </span>
                        <span className="file-label">Choose a file…</span>
                      </span>
                      {selectedFile && (
                        <span className="file-name">
                          {selectedFile.name} ({formatBytes(selectedFile.size)})
                        </span>
                      )}
                    </label>
                  </div>
                </div>
                <div className="field">
                  <div className="control">
                    <label className="checkbox liquid-glass-text">
                      <input
                        type="checkbox"
                        checked={cdnEnabled}
                        onChange={(e) => setCdnEnabled(e.target.checked)}
                        aria-label="Enable CDN"
                      />
                      {" "}Enable CDN Integration
                    </label>
                  </div>
                </div>
                <button
                  className="button is-primary"
                  onClick={handleBlobUpload}
                  disabled={!selectedFile || uploadingFiles.size > 0}
                  aria-label="Upload selected file"
                >
                  Upload
                </button>
                {uploadingFiles.size > 0 && (
                  <div className="mt-4">
                    {Array.from(uploadingFiles).map((fileName) => (
                      <div key={fileName} className="mb-2">
                        <p className="liquid-glass-text">{fileName}</p>
                        <progress
                          className="progress is-primary"
                          value={uploadProgress.get(fileName) || 0}
                          max="100"
                          aria-label={`Upload progress for ${fileName}`}
                        >
                          {uploadProgress.get(fileName) || 0}%
                        </progress>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="box liquid-glass-card">
                <h3 className="title is-5 mb-4 liquid-glass-text">Files ({blobFiles.length})</h3>
                <div className="table-container">
                  <table className="table is-fullwidth is-striped">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Size</th>
                        <th>Type</th>
                        <th>Last Modified</th>
                        <th>CDN URL</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blobFiles.map((file) => (
                        <motion.tr
                          key={file.name}
                          initial={prefersReducedMotion ? {} : { opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={prefersReducedMotion ? {} : { duration: 0.3 }}
                        >
                          <td>{file.name}</td>
                          <td>{formatBytes(file.size)}</td>
                          <td>{file.contentType}</td>
                          <td>{formatDate(file.lastModified)}</td>
                          <td>
                            {file.url ? (
                              <a href={file.url} target="_blank" rel="noopener noreferrer" className="liquid-glass-text">
                                View CDN
                              </a>
                            ) : (
                              <span className="liquid-glass-text">-</span>
                            )}
                          </td>
                          <td>
                            <div className="buttons">
                              <button
                                className="button is-small is-info"
                                onClick={() => handleBlobDownload(file.name)}
                                aria-label={`Download ${file.name}`}
                              >
                                Download
                              </button>
                              <button
                                className="button is-small is-danger"
                                onClick={() => handleBlobDelete(file.name)}
                                aria-label={`Delete ${file.name}`}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Azure Functions Tab */}
          {activeTab === "functions" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">Azure Functions</h2>
              <div className="columns">
                {azureFunctions.map((fn) => (
                  <div key={fn.name} className="column">
                    <div className="box liquid-glass-card">
                      <h4 className="title is-5 liquid-glass-text">{fn.name}</h4>
                      <div className="content">
                        <ul className="liquid-glass-text">
                          <li>
                            <strong>Runtime:</strong> {fn.runtime}
                          </li>
                          <li>
                            <strong>Trigger:</strong> {fn.trigger}
                          </li>
                          <li>
                            <strong>Status:</strong>{" "}
                            <span className={`tag ${fn.status === "running" ? "is-success" : "is-danger"}`}>
                              {fn.status}
                            </span>
                          </li>
                          <li>
                            <strong>Invocations:</strong> {fn.invocationCount.toLocaleString()}
                          </li>
                          <li>
                            <strong>Errors:</strong> {fn.errorCount}
                          </li>
                          <li>
                            <strong>Avg Duration:</strong> {fn.avgDuration.toFixed(0)}ms
                          </li>
                          <li>
                            <strong>Cost:</strong> ${fn.cost.toFixed(4)}
                          </li>
                          {fn.lastExecuted && (
                            <li>
                              <strong>Last Executed:</strong> {formatDate(fn.lastExecuted)}
                            </li>
                          )}
                        </ul>
                        <button
                          className="button is-primary is-fullwidth mt-4"
                          onClick={() => handleFunctionInvoke(fn.name)}
                          disabled={invokingFunctions.has(fn.name)}
                          aria-label={`Invoke ${fn.name} function`}
                        >
                          {invokingFunctions.has(fn.name) ? "Invoking..." : "Invoke Function"}
                        </button>
                        {invocationResults.has(fn.name) && (
                          <div className="notification is-info mt-4 liquid-glass">
                            <pre className="liquid-glass-text" style={{ fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
                              {JSON.stringify(invocationResults.get(fn.name), null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cognitive Services Tab */}
          {activeTab === "cognitive" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">Azure Cognitive Services</h2>
              <div className="box liquid-glass-card mb-4">
                <h3 className="title is-5 mb-4 liquid-glass-text">Text Analytics</h3>
                <div className="field">
                  <label className="label liquid-glass-text">Input Text</label>
                  <div className="control">
                    <textarea
                      className="textarea"
                      placeholder="Enter text to analyze..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      aria-label="Text input for analysis"
                    />
                  </div>
                </div>
                <button
                  className="button is-primary"
                  onClick={() => handleCognitiveService("text-analytics")}
                  disabled={processingService === "text-analytics"}
                  aria-label="Analyze text"
                >
                  {processingService === "text-analytics" ? "Processing..." : "Analyze Text"}
                </button>
              </div>

              <div className="box liquid-glass-card mb-4">
                <h3 className="title is-5 mb-4 liquid-glass-text">Computer Vision</h3>
                <div className="field">
                  <div className="file has-name">
                    <label className="file-label">
                      <input
                        ref={imageInputRef}
                        className="file-input"
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        aria-label="Select image for analysis"
                      />
                      <span className="file-cta">
                        <span className="file-icon">
                          <span aria-hidden="true">🖼️</span>
                        </span>
                        <span className="file-label">Choose an image…</span>
                      </span>
                      {inputImage && <span className="file-name">{inputImage.name}</span>}
                    </label>
                  </div>
                </div>
                <button
                  className="button is-primary"
                  onClick={() => handleCognitiveService("computer-vision")}
                  disabled={processingService === "computer-vision" || !inputImage}
                  aria-label="Analyze image"
                >
                  {processingService === "computer-vision" ? "Processing..." : "Analyze Image"}
                </button>
              </div>

              <div className="box liquid-glass-card mb-4">
                <h3 className="title is-5 mb-4 liquid-glass-text">Speech Services</h3>
                <div className="field">
                  <label className="label liquid-glass-text">Input Text</label>
                  <div className="control">
                    <input
                      className="input"
                      type="text"
                      placeholder="Enter text for speech recognition..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      aria-label="Text input for speech recognition"
                    />
                  </div>
                </div>
                <button
                  className="button is-primary"
                  onClick={() => handleCognitiveService("speech")}
                  disabled={processingService === "speech"}
                  aria-label="Process speech"
                >
                  {processingService === "speech" ? "Processing..." : "Process Speech"}
                </button>
              </div>

              {cognitiveResults.length > 0 && (
                <div className="box liquid-glass-card">
                  <h3 className="title is-5 mb-4 liquid-glass-text">Recent Results</h3>
                  <div className="content">
                    {cognitiveResults.map((result, idx) => (
                      <div key={idx} className="notification is-info liquid-glass mb-4">
                        <h5 className="title is-6 liquid-glass-text">{result.service}</h5>
                        <p className="liquid-glass-text">
                          <strong>Input:</strong> {result.input}
                        </p>
                        <p className="liquid-glass-text">
                          <strong>Confidence:</strong> {result.confidence ? (result.confidence * 100).toFixed(1) : "N/A"}%
                        </p>
                        <pre className="liquid-glass-text" style={{ fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
                          {JSON.stringify(result.result, null, 2)}
                        </pre>
                        <p className="liquid-glass-text">
                          <small>{formatDate(result.timestamp)}</small>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Services Tab */}
          {activeTab === "ai-services" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">Azure AI Services</h2>
              <div className="columns">
                <div className="column">
                  <div className="box liquid-glass-card">
                    <h4 className="title is-5 liquid-glass-text">OpenAI GPT-4</h4>
                    <p className="liquid-glass-text mb-4">Azure-hosted GPT-4 for advanced language tasks</p>
                    <button
                      className="button is-primary is-fullwidth"
                      onClick={() => handleAiService("openai-gpt4")}
                      disabled={processingAiService === "openai-gpt4"}
                      aria-label="Invoke GPT-4 service"
                    >
                      {processingAiService === "openai-gpt4" ? "Processing..." : "Invoke GPT-4"}
                    </button>
                    {aiServiceResults.has("openai-gpt4") && (
                      <div className="notification is-info mt-4 liquid-glass">
                        <pre className="liquid-glass-text" style={{ fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
                          {JSON.stringify(aiServiceResults.get("openai-gpt4"), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
                <div className="column">
                  <div className="box liquid-glass-card">
                    <h4 className="title is-5 liquid-glass-text">OpenAI Embeddings</h4>
                    <p className="liquid-glass-text mb-4">Text embeddings for semantic search</p>
                    <button
                      className="button is-primary is-fullwidth"
                      onClick={() => handleAiService("openai-embedding")}
                      disabled={processingAiService === "openai-embedding"}
                      aria-label="Generate embeddings"
                    >
                      {processingAiService === "openai-embedding" ? "Processing..." : "Generate Embeddings"}
                    </button>
                    {aiServiceResults.has("openai-embedding") && (
                      <div className="notification is-info mt-4 liquid-glass">
                        <pre className="liquid-glass-text" style={{ fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
                          {JSON.stringify(aiServiceResults.get("openai-embedding"), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
                <div className="column">
                  <div className="box liquid-glass-card">
                    <h4 className="title is-5 liquid-glass-text">Azure AI Search</h4>
                    <p className="liquid-glass-text mb-4">Intelligent search with semantic understanding</p>
                    <button
                      className="button is-primary is-fullwidth"
                      onClick={() => handleAiService("azure-ai-search")}
                      disabled={processingAiService === "azure-ai-search"}
                      aria-label="Perform AI search"
                    >
                      {processingAiService === "azure-ai-search" ? "Processing..." : "Perform Search"}
                    </button>
                    {aiServiceResults.has("azure-ai-search") && (
                      <div className="notification is-info mt-4 liquid-glass">
                        <pre className="liquid-glass-text" style={{ fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
                          {JSON.stringify(aiServiceResults.get("azure-ai-search"), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cost Analysis Tab */}
          {activeTab === "cost" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">Cost Analysis & Optimization</h2>
              <div className="box liquid-glass-card mb-4">
                <h3 className="title is-5 mb-4 liquid-glass-text">Total Cost: ${totalCost.toFixed(2)}/month</h3>
                {!isMobile && (
                  <div style={{ height: "300px" }}>
                    <svg
                      ref={costChartRef}
                      width="100%"
                      height="100%"
                      style={{ minHeight: "300px" }}
                      aria-label="Cost analysis chart"
                      role="img"
                    >
                      <title>Azure Services Cost Chart</title>
                    </svg>
                  </div>
                )}
              </div>

              <div className="box liquid-glass-card">
                <h3 className="title is-5 mb-4 liquid-glass-text">Service Breakdown</h3>
                <div className="table-container">
                  <table className="table is-fullwidth is-striped">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Usage</th>
                        <th>Unit</th>
                        <th>Cost</th>
                        <th>Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costData.map((data) => (
                        <tr key={data.service}>
                          <td>{data.service}</td>
                          <td>{data.usage.toFixed(2)}</td>
                          <td>{data.unit}</td>
                          <td>${data.cost.toFixed(2)}</td>
                          <td>
                            <span
                              className={`tag ${
                                data.trend === "up" ? "is-warning" : data.trend === "down" ? "is-success" : "is-info"
                              }`}
                            >
                              {data.trend === "up" ? "↑" : data.trend === "down" ? "↓" : "→"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="box liquid-glass-card mt-4">
                <h3 className="title is-5 mb-4 liquid-glass-text">Cost Optimization Recommendations</h3>
                <div className="content">
                  <ul className="liquid-glass-text">
                    <li>
                      <strong>Blob Storage:</strong> Consider lifecycle management policies to move old data to cool/archive
                      tiers
                    </li>
                    <li>
                      <strong>Functions:</strong> Optimize function execution time to reduce compute costs
                    </li>
                    <li>
                      <strong>Cognitive Services:</strong> Batch requests when possible to reduce transaction costs
                    </li>
                    <li>
                      <strong>AI Services:</strong> Use caching for frequently accessed embeddings and search results
                    </li>
                    <li>
                      <strong>CDN:</strong> Enable compression and optimize asset sizes to reduce bandwidth costs
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

