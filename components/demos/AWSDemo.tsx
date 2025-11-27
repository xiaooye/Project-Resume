"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import * as d3 from "d3";

// Types
type S3File = {
  key: string;
  size: number;
  lastModified: Date;
  contentType: string;
};

type LambdaFunction = {
  name: string;
  runtime: string;
  memorySize: number;
  timeout: number;
  lastModified: Date;
  invocationCount: number;
  errorCount: number;
  avgDuration: number;
  cost: number;
};

type CloudWatchMetric = {
  timestamp: Date;
  value: number;
  unit: string;
};

type DynamoDBItem = {
  id: string;
  [key: string]: any;
};

type TabType = "s3" | "lambda" | "apigateway" | "cloudwatch" | "dynamodb";

export default function AWSDemo() {
  const [activeTab, setActiveTab] = useState<TabType>("s3");
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // S3 States
  const [s3Files, setS3Files] = useState<S3File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lambda States
  const [lambdaFunctions, setLambdaFunctions] = useState<LambdaFunction[]>([]);
  const [invocationResults, setInvocationResults] = useState<Map<string, any>>(new Map());
  const [invokingFunctions, setInvokingFunctions] = useState<Set<string>>(new Set());
  const [costData, setCostData] = useState<{ total: number; byFunction: Map<string, number> }>({
    total: 0,
    byFunction: new Map(),
  });

  // API Gateway States
  const [apiEndpoints, setApiEndpoints] = useState<any[]>([]);
  const [apiRequests, setApiRequests] = useState<any[]>([]);
  const [apiAuthStatus, setApiAuthStatus] = useState<"authenticated" | "unauthenticated">("unauthenticated");

  // CloudWatch States
  const [cloudWatchMetrics, setCloudWatchMetrics] = useState<Map<string, CloudWatchMetric[]>>(new Map());
  const [alerts, setAlerts] = useState<any[]>([]);
  const cloudWatchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // DynamoDB States
  const [dynamoDBTables, setDynamoDBTables] = useState<string[]>([]);
  const [dynamoDBItems, setDynamoDBItems] = useState<Map<string, DynamoDBItem[]>>(new Map());
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [queryResults, setQueryResults] = useState<DynamoDBItem[]>([]);
  const [queryCost, setQueryCost] = useState(0);

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
      if (cloudWatchIntervalRef.current) {
        clearInterval(cloudWatchIntervalRef.current);
      }
    };
  }, []);

  const initializeDemoData = () => {
    // Initialize S3 files
    setS3Files([
      {
        key: "documents/report.pdf",
        size: 2048576,
        lastModified: new Date(Date.now() - 86400000),
        contentType: "application/pdf",
      },
      {
        key: "images/photo.jpg",
        size: 1024000,
        lastModified: new Date(Date.now() - 172800000),
        contentType: "image/jpeg",
      },
      {
        key: "videos/demo.mp4",
        size: 52428800,
        lastModified: new Date(Date.now() - 3600000),
        contentType: "video/mp4",
      },
    ]);

    // Initialize Lambda functions
    setLambdaFunctions([
      {
        name: "process-image",
        runtime: "nodejs20.x",
        memorySize: 512,
        timeout: 30,
        lastModified: new Date(Date.now() - 604800000),
        invocationCount: 1250,
        errorCount: 5,
        avgDuration: 1250,
        cost: 0.12,
      },
      {
        name: "send-email",
        runtime: "python3.11",
        memorySize: 256,
        timeout: 10,
        lastModified: new Date(Date.now() - 2592000000),
        invocationCount: 5000,
        errorCount: 0,
        avgDuration: 450,
        cost: 0.08,
      },
      {
        name: "data-processor",
        runtime: "nodejs20.x",
        memorySize: 1024,
        timeout: 60,
        lastModified: new Date(Date.now() - 86400000),
        invocationCount: 300,
        errorCount: 2,
        avgDuration: 3500,
        cost: 0.25,
      },
    ]);

    // Initialize API Gateway endpoints
    setApiEndpoints([
      { path: "/api/users", method: "GET", auth: true },
      { path: "/api/users", method: "POST", auth: true },
      { path: "/api/products", method: "GET", auth: false },
      { path: "/api/products/{id}", method: "GET", auth: false },
      { path: "/api/orders", method: "POST", auth: true },
    ]);

    // Initialize DynamoDB tables
    setDynamoDBTables(["users", "products", "orders"]);
    setSelectedTable("users");
    setDynamoDBItems(
      new Map([
        [
          "users",
          [
            { id: "user-1", name: "John Doe", email: "john@example.com", createdAt: "2024-01-15" },
            { id: "user-2", name: "Jane Smith", email: "jane@example.com", createdAt: "2024-01-20" },
            { id: "user-3", name: "Bob Johnson", email: "bob@example.com", createdAt: "2024-02-01" },
          ],
        ],
        [
          "products",
          [
            { id: "prod-1", name: "Laptop", price: 999.99, stock: 50 },
            { id: "prod-2", name: "Mouse", price: 29.99, stock: 200 },
            { id: "prod-3", name: "Keyboard", price: 79.99, stock: 100 },
          ],
        ],
        [
          "orders",
          [
            { id: "order-1", userId: "user-1", total: 1029.98, status: "completed", date: "2024-02-15" },
            { id: "order-2", userId: "user-2", total: 79.99, status: "pending", date: "2024-02-16" },
          ],
        ],
      ])
    );

    // Start CloudWatch metrics simulation
    startCloudWatchSimulation();
  };

  const startCloudWatchSimulation = () => {
    const metrics = ["CPUUtilization", "MemoryUtilization", "RequestCount", "ErrorRate"];
    const initialData = new Map<string, CloudWatchMetric[]>();

    metrics.forEach((metric) => {
      const data: CloudWatchMetric[] = [];
      for (let i = 0; i < 20; i++) {
        data.push({
          timestamp: new Date(Date.now() - (20 - i) * 60000),
          value: Math.random() * 100,
          unit: metric.includes("Rate") || metric.includes("Count") ? "Count" : "Percent",
        });
      }
      initialData.set(metric, data);
    });

    setCloudWatchMetrics(initialData);

    // Update metrics every 5 seconds
    cloudWatchIntervalRef.current = setInterval(() => {
      setCloudWatchMetrics((prev) => {
        const updated = new Map(prev);
        metrics.forEach((metric) => {
          const current = updated.get(metric) || [];
          const newValue: CloudWatchMetric = {
            timestamp: new Date(),
            value: Math.random() * 100,
            unit: metric.includes("Rate") || metric.includes("Count") ? "Count" : "Percent",
          };
          const updatedData = [...current.slice(-19), newValue];
          updated.set(metric, updatedData);
        });
        return updated;
      });
    }, 5000);
  };

  // S3 Functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleS3Upload = async () => {
    if (!selectedFile) return;

    const fileKey = `uploads/${Date.now()}-${selectedFile.name}`;
    setUploadingFiles((prev) => new Set(prev).add(fileKey));
    setUploadProgress((prev) => new Map(prev).set(fileKey, 0));

    // Simulate chunked upload
    const chunkSize = selectedFile.size / 10;
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setUploadProgress((prev) => {
        const updated = new Map(prev);
        updated.set(fileKey, ((i + 1) / 10) * 100);
        return updated;
      });
    }

    // Add file to list
    setS3Files((prev) => [
      ...prev,
      {
        key: fileKey,
        size: selectedFile.size,
        lastModified: new Date(),
        contentType: selectedFile.type || "application/octet-stream",
      },
    ]);

    setUploadingFiles((prev) => {
      const updated = new Set(prev);
      updated.delete(fileKey);
      return updated;
    });
    setUploadProgress((prev) => {
      const updated = new Map(prev);
      updated.delete(fileKey);
      return updated;
    });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleS3Download = async (fileKey: string) => {
    // Simulate download
    const file = s3Files.find((f) => f.key === fileKey);
    if (file) {
      // In real implementation, this would download from S3
      alert(`Downloading: ${fileKey}\nSize: ${formatBytes(file.size)}`);
    }
  };

  const handleS3Delete = async (fileKey: string) => {
    if (confirm(`Are you sure you want to delete ${fileKey}?`)) {
      setS3Files((prev) => prev.filter((f) => f.key !== fileKey));
    }
  };

  // Lambda Functions
  const handleLambdaInvoke = async (functionName: string) => {
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
      setLambdaFunctions((prev) =>
        prev.map((fn) =>
          fn.name === functionName
            ? {
                ...fn,
                invocationCount: fn.invocationCount + 1,
                avgDuration: (fn.avgDuration * fn.invocationCount + result.duration) / (fn.invocationCount + 1),
                cost: fn.cost + 0.0001,
              }
            : fn
        )
      );

      // Update cost
      setCostData((prev) => {
        const updated = new Map(prev.byFunction);
        updated.set(functionName, (updated.get(functionName) || 0) + 0.0001);
        return {
          total: prev.total + 0.0001,
          byFunction: updated,
        };
      });
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

  // API Gateway Functions
  const handleApiRequest = async (endpoint: any) => {
    if (endpoint.auth && apiAuthStatus === "unauthenticated") {
      alert("This endpoint requires authentication. Please authenticate first.");
      return;
    }

    const request = {
      id: `req-${Date.now()}`,
      endpoint: endpoint.path,
      method: endpoint.method,
      timestamp: new Date(),
      status: Math.random() > 0.1 ? 200 : 500,
      latency: Math.random() * 100 + 50,
    };

    setApiRequests((prev) => [request, ...prev.slice(0, 49)]);
  };

  const handleApiAuth = () => {
    setApiAuthStatus((prev) => (prev === "authenticated" ? "unauthenticated" : "authenticated"));
  };

  // DynamoDB Functions
  const handleDynamoDBQuery = async (tableName: string, query: string) => {
    const items = dynamoDBItems.get(tableName) || [];
    let results: DynamoDBItem[] = [];

    if (query.trim()) {
      // Simple search simulation
      results = items.filter((item) =>
        Object.values(item).some((value) => String(value).toLowerCase().includes(query.toLowerCase()))
      );
    } else {
      results = items;
    }

    setQueryResults(results);
    // Calculate query cost (simplified: $0.25 per million read units)
    setQueryCost((results.length / 1000000) * 0.25);
  };

  const handleDynamoDBCreate = async (tableName: string, item: DynamoDBItem) => {
    setDynamoDBItems((prev) => {
      const updated = new Map(prev);
      const tableItems = updated.get(tableName) || [];
      updated.set(tableName, [...tableItems, item]);
      return updated;
    });
  };

  const handleDynamoDBDelete = async (tableName: string, itemId: string) => {
    setDynamoDBItems((prev) => {
      const updated = new Map(prev);
      const tableItems = updated.get(tableName) || [];
      updated.set(tableName, tableItems.filter((item) => item.id !== itemId));
      return updated;
    });
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
        <h1 className="title is-2 mb-6 liquid-glass-text">AWS Services Integration Demo</h1>
        <p className="subtitle is-5 mb-6 liquid-glass-text">
          Enterprise-grade cloud services demonstration with S3, Lambda, API Gateway, CloudWatch, and DynamoDB
        </p>

        {/* Tabs */}
        <div className="tabs is-boxed">
          <ul>
            <li className={activeTab === "s3" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("s3")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("s3");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="S3 Storage tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">📦</span>
                </span>
                <span>S3 Storage</span>
              </a>
            </li>
            <li className={activeTab === "lambda" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("lambda")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("lambda");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Lambda Functions tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">⚡</span>
                </span>
                <span>Lambda</span>
              </a>
            </li>
            <li className={activeTab === "apigateway" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("apigateway")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("apigateway");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="API Gateway tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">🌐</span>
                </span>
                <span>API Gateway</span>
              </a>
            </li>
            <li className={activeTab === "cloudwatch" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("cloudwatch")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("cloudwatch");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="CloudWatch Monitoring tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">📊</span>
                </span>
                <span>CloudWatch</span>
              </a>
            </li>
            <li className={activeTab === "dynamodb" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("dynamodb")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("dynamodb");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="DynamoDB Database tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">🗄️</span>
                </span>
                <span>DynamoDB</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* S3 Tab */}
          {activeTab === "s3" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">S3 File Storage</h2>
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
                        <span className="file-name">{selectedFile.name} ({formatBytes(selectedFile.size)})</span>
                      )}
                    </label>
                  </div>
                </div>
                <button
                  className="button is-primary"
                  onClick={handleS3Upload}
                  disabled={!selectedFile || uploadingFiles.size > 0}
                  aria-label="Upload selected file"
                >
                  Upload
                </button>
                {uploadingFiles.size > 0 && (
                  <div className="mt-4">
                    {Array.from(uploadingFiles).map((fileKey) => (
                      <div key={fileKey} className="mb-2">
                        <p className="liquid-glass-text">{fileKey}</p>
                        <progress
                          className="progress is-primary"
                          value={uploadProgress.get(fileKey) || 0}
                          max="100"
                          aria-label={`Upload progress for ${fileKey}`}
                        >
                          {uploadProgress.get(fileKey) || 0}%
                        </progress>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="box liquid-glass-card">
                <h3 className="title is-5 mb-4 liquid-glass-text">Files ({s3Files.length})</h3>
                <div className="table-container">
                  <table className="table is-fullwidth is-striped">
                    <thead>
                      <tr>
                        <th>Key</th>
                        <th>Size</th>
                        <th>Type</th>
                        <th>Last Modified</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s3Files.map((file) => (
                        <motion.tr
                          key={file.key}
                          initial={prefersReducedMotion ? {} : { opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={prefersReducedMotion ? {} : { duration: 0.3 }}
                        >
                          <td>{file.key}</td>
                          <td>{formatBytes(file.size)}</td>
                          <td>{file.contentType}</td>
                          <td>{formatDate(file.lastModified)}</td>
                          <td>
                            <div className="buttons">
                              <button
                                className="button is-small is-info"
                                onClick={() => handleS3Download(file.key)}
                                aria-label={`Download ${file.key}`}
                              >
                                Download
                              </button>
                              <button
                                className="button is-small is-danger"
                                onClick={() => handleS3Delete(file.key)}
                                aria-label={`Delete ${file.key}`}
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

          {/* Lambda Tab */}
          {activeTab === "lambda" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">Lambda Functions</h2>
              <div className="box liquid-glass-card mb-4">
                <h3 className="title is-5 mb-4 liquid-glass-text">Cost Summary</h3>
                <div className="content">
                  <p className="liquid-glass-text">
                    <strong>Total Cost:</strong> ${costData.total.toFixed(4)}
                  </p>
                  <p className="liquid-glass-text">
                    <strong>Total Invocations:</strong>{" "}
                    {lambdaFunctions.reduce((sum, fn) => sum + fn.invocationCount, 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="columns">
                {lambdaFunctions.map((fn) => (
                  <div key={fn.name} className="column">
                    <div className="box liquid-glass-card">
                      <h4 className="title is-5 liquid-glass-text">{fn.name}</h4>
                      <div className="content">
                        <ul className="liquid-glass-text">
                          <li>
                            <strong>Runtime:</strong> {fn.runtime}
                          </li>
                          <li>
                            <strong>Memory:</strong> {fn.memorySize} MB
                          </li>
                          <li>
                            <strong>Timeout:</strong> {fn.timeout}s
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
                        </ul>
                        <button
                          className="button is-primary is-fullwidth mt-4"
                          onClick={() => handleLambdaInvoke(fn.name)}
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

          {/* API Gateway Tab */}
          {activeTab === "apigateway" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">API Gateway</h2>
              <div className="box liquid-glass-card mb-4">
                <div className="field is-grouped">
                  <div className="control">
                    <button
                      className={`button ${apiAuthStatus === "authenticated" ? "is-success" : "is-warning"}`}
                      onClick={handleApiAuth}
                      aria-label={apiAuthStatus === "authenticated" ? "Sign out" : "Sign in"}
                    >
                      {apiAuthStatus === "authenticated" ? "✓ Authenticated" : "Sign In"}
                    </button>
                  </div>
                  <div className="control">
                    <p className="liquid-glass-text">
                      Status: <strong>{apiAuthStatus === "authenticated" ? "Authenticated" : "Unauthenticated"}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="box liquid-glass-card mb-4">
                <h3 className="title is-5 mb-4 liquid-glass-text">API Endpoints</h3>
                <div className="table-container">
                  <table className="table is-fullwidth is-striped">
                    <thead>
                      <tr>
                        <th>Path</th>
                        <th>Method</th>
                        <th>Auth Required</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiEndpoints.map((endpoint, idx) => (
                        <tr key={idx}>
                          <td>
                            <code>{endpoint.path}</code>
                          </td>
                          <td>
                            <span className={`tag ${endpoint.method === "GET" ? "is-info" : "is-success"}`}>
                              {endpoint.method}
                            </span>
                          </td>
                          <td>{endpoint.auth ? <span className="tag is-warning">Yes</span> : <span className="tag">No</span>}</td>
                          <td>
                            <button
                              className="button is-small is-primary"
                              onClick={() => handleApiRequest(endpoint)}
                              aria-label={`Send ${endpoint.method} request to ${endpoint.path}`}
                            >
                              Send Request
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {apiRequests.length > 0 && (
                <div className="box liquid-glass-card">
                  <h3 className="title is-5 mb-4 liquid-glass-text">Recent Requests</h3>
                  <div className="table-container">
                    <table className="table is-fullwidth is-striped">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Endpoint</th>
                          <th>Method</th>
                          <th>Status</th>
                          <th>Latency (ms)</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apiRequests.slice(0, 10).map((req) => (
                          <tr key={req.id}>
                            <td>{req.id}</td>
                            <td>
                              <code>{req.endpoint}</code>
                            </td>
                            <td>
                              <span className={`tag ${req.method === "GET" ? "is-info" : "is-success"}`}>{req.method}</span>
                            </td>
                            <td>
                              <span className={`tag ${req.status === 200 ? "is-success" : "is-danger"}`}>{req.status}</span>
                            </td>
                            <td>{req.latency.toFixed(2)}</td>
                            <td>{formatDate(req.timestamp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CloudWatch Tab */}
          {activeTab === "cloudwatch" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">CloudWatch Monitoring</h2>
              <div className="columns">
                {Array.from(cloudWatchMetrics.entries()).map(([metricName, data]) => (
                  <div key={metricName} className="column">
                    <div className="box liquid-glass-card">
                      <h4 className="title is-5 liquid-glass-text">{metricName}</h4>
                      <div className="content">
                        <p className="liquid-glass-text">
                          <strong>Current Value:</strong> {data[data.length - 1]?.value.toFixed(2)} {data[data.length - 1]?.unit}
                        </p>
                        <p className="liquid-glass-text">
                          <strong>Average:</strong>{" "}
                          {(data.reduce((sum, d) => sum + d.value, 0) / data.length).toFixed(2)} {data[0]?.unit}
                        </p>
                      </div>
                      {!isMobile && (
                        <div style={{ height: "200px" }}>
                          <CloudWatchChart data={data} metricName={metricName} prefersReducedMotion={prefersReducedMotion} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DynamoDB Tab */}
          {activeTab === "dynamodb" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">DynamoDB Database</h2>
              <div className="box liquid-glass-card mb-4">
                <div className="field">
                  <label className="label liquid-glass-text">Select Table</label>
                  <div className="control">
                    <div className="select is-fullwidth">
                      <select
                        value={selectedTable}
                        onChange={(e) => {
                          setSelectedTable(e.target.value);
                          setQueryResults([]);
                        }}
                        aria-label="Select DynamoDB table"
                      >
                        {dynamoDBTables.map((table) => (
                          <option key={table} value={table}>
                            {table}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="field">
                  <label className="label liquid-glass-text">Query</label>
                  <div className="control">
                    <input
                      className="input"
                      type="text"
                      placeholder="Enter search query..."
                      onChange={(e) => handleDynamoDBQuery(selectedTable, e.target.value)}
                      aria-label="DynamoDB query input"
                    />
                  </div>
                </div>
                {queryCost > 0 && (
                  <div className="notification is-info liquid-glass mt-4">
                    <p className="liquid-glass-text">
                      <strong>Query Cost:</strong> ${queryCost.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

              <div className="box liquid-glass-card">
                <h3 className="title is-5 mb-4 liquid-glass-text">
                  Items in {selectedTable} ({queryResults.length > 0 ? queryResults.length : dynamoDBItems.get(selectedTable)?.length || 0})
                </h3>
                <div className="table-container">
                  <table className="table is-fullwidth is-striped">
                    <thead>
                      <tr>
                        {queryResults.length > 0
                          ? Object.keys(queryResults[0]).map((key) => <th key={key}>{key}</th>)
                          : dynamoDBItems.get(selectedTable)?.[0]
                          ? Object.keys(dynamoDBItems.get(selectedTable)![0]).map((key) => <th key={key}>{key}</th>)
                          : null}
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(queryResults.length > 0 ? queryResults : dynamoDBItems.get(selectedTable) || []).map((item) => (
                        <tr key={item.id}>
                          {Object.entries(item).map(([key, value]) => (
                            <td key={key}>{String(value)}</td>
                          ))}
                          <td>
                            <button
                              className="button is-small is-danger"
                              onClick={() => handleDynamoDBDelete(selectedTable, item.id)}
                              aria-label={`Delete item ${item.id}`}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// CloudWatch Chart Component
function CloudWatchChart({ data, metricName, prefersReducedMotion }: { data: CloudWatchMetric[]; metricName: string; prefersReducedMotion: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = svgRef.current.clientHeight - margin.top - margin.bottom;

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.timestamp) as [Date, Date])
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) || 100] as [number, number])
      .nice()
      .range([height, 0]);

    const line = d3
      .line<CloudWatchMetric>()
      .x((d) => x(d.timestamp))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll("text")
      .style("fill", "currentColor");

    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .style("fill", "currentColor");

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "currentColor")
      .attr("stroke-width", 2)
      .attr("d", line);
  }, [data, metricName]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      style={{ minHeight: "200px" }}
      aria-label={`Chart showing ${metricName} over time`}
      role="img"
    >
      <title>{metricName} Chart</title>
    </svg>
  );
}

