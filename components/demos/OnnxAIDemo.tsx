"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  modelManager,
  ModelType,
  ModelMetadata,
  InferenceResult,
} from "@/lib/onnx/model-manager";
import { CacheManager } from "@/lib/onnx/cache-manager";
import LLMChatInterface from "./onnx-ai/LLMChatInterface";
import ImageClassificationInterface from "./onnx-ai/ImageClassificationInterface";
import TextClassificationInterface from "./onnx-ai/TextClassificationInterface";

type InputSource = "camera" | "upload" | "url" | "text";

export default function OnnxAIDemo() {
  const [isMounted, setIsMounted] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<ModelMetadata[]>([]);
  const [currentModelId, setCurrentModelId] = useState<string>("");
  const [currentModel, setCurrentModel] = useState<ModelMetadata | null>(null);
  const [inputSource, setInputSource] = useState<InputSource>("camera");
  const [inferenceResult, setInferenceResult] = useState<InferenceResult | null>(null);
  const [isRealTimeInference, setIsRealTimeInference] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<string>("");
  const [recommendedModels, setRecommendedModels] = useState<ModelMetadata[]>([]);
  const [currentBackend, setCurrentBackend] = useState<"webgpu" | "webgl" | "wasm" | "cpu" | "unknown">("unknown");
  const [cacheInfo, setCacheInfo] = useState<{ totalSize: number; modelCount: number } | null>(null);
  const [isModelCached, setIsModelCached] = useState(false);
  
  // Performance metrics
  const [inferenceHistory, setInferenceHistory] = useState<Array<{
    timestamp: number;
    inferenceTime: number;
    modelName: string;
  }>>([]);

  // Camera and image handling
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [currentImage, setCurrentImage] = useState<HTMLImageElement | null>(null);
  const [textInput, setTextInput] = useState("");

  // Real-time inference
  const inferenceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Responsive design
  const [isMobile, setIsMobile] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Initialize models list
  useEffect(() => {
    if (!isMounted) return;

    const init = async () => {
      try {
        // Load available models
        const models = await modelManager.getAvailableModels();
        setAvailableModels(models);

        // Set recommended models (all models are available, user can choose)
        // We'll mark models with recommendedFor tag
        setRecommendedModels(models.filter((m) => m.recommendedFor));

        // Set default model
        if (models.length > 0) {
          setCurrentModelId(models[0].id);
          setCurrentModel(models[0]);
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
      }
    };

    init();
  }, [isMounted]);

  // Mount check and responsive design
  useEffect(() => {
    setIsMounted(true);

    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
      stopCamera();
      if (inferenceIntervalRef.current) {
        clearInterval(inferenceIntervalRef.current);
      }
      modelManager.dispose();
    };
  }, []);

  // Load model
  const loadModel = useCallback(async () => {
    if (!currentModelId) return;

    setIsLoading(true);
    
    // Dispose previous model if any
    if (isModelLoaded) {
      modelManager.dispose();
      setIsModelLoaded(false);
      setCurrentBackend("unknown");
    }
    
    // Check if model is cached
    const cached = await CacheManager.isModelCached(currentModelId);
    setIsModelCached(cached);
    
    if (cached) {
      setLoadingProgress("Loading from cache...");
    } else {
      setLoadingProgress("Downloading from Hugging Face CDN...");
    }

    try {
      await modelManager.loadModel(currentModelId);
      const model = modelManager.getCurrentModel();
      const backend = modelManager.getCurrentBackend();
      setCurrentModel(model);
      setCurrentBackend(backend);
      setIsModelLoaded(true);
      setLoadingProgress("");
      
      // Update cache info
      const info = await CacheManager.getCacheInfo();
      setCacheInfo(info);
    } catch (error) {
      console.error("Failed to load model:", error);
      setLoadingProgress("");
      alert(`Failed to load model: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  }, [currentModelId, isModelLoaded]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setInputSource("camera");
      }
    } catch (error) {
      console.error("Failed to access camera:", error);
      alert("Failed to access camera. Please check permissions.");
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Capture frame from video
  const captureFrame = useCallback((): HTMLCanvasElement | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    return canvas;
  }, []);

  // Run inference based on model type (for image/text classification)
  const runInference = useCallback(
    async (input: HTMLImageElement | HTMLCanvasElement | ImageData | string): Promise<InferenceResult> => {
      if (!isModelLoaded || !currentModel) {
        throw new Error("Please load the model first");
      }

      let result: InferenceResult;

      switch (currentModel.type) {
        case "image-classification":
        case "object-detection":
          result = await modelManager.runImageClassification(input as any);
          break;
        case "text-classification":
        case "sentiment-analysis":
          result = await modelManager.runTextClassification(input as string);
          break;
        default:
          throw new Error(`Unsupported model type: ${currentModel.type}`);
      }

        setInferenceResult(result);
        
        // Track inference history for performance metrics
        setInferenceHistory((prev) => [
          ...prev.slice(-49), // Keep last 50 entries
          {
            timestamp: Date.now(),
            inferenceTime: result.inferenceTime,
            modelName: result.modelName,
          },
        ]);
        
        return result;
    },
    [isModelLoaded, currentModel]
  );

  // Run LLM inference with conversation context
  const runLLMInference = useCallback(
    async (
      message: string,
      conversationHistory: Array<{ role: "user" | "assistant"; content: string; id?: string; timestamp?: number }>
    ): Promise<InferenceResult> => {
      if (!isModelLoaded || !currentModel) {
        throw new Error("Please load the model first");
      }

      try {
        // Convert conversation history to the format expected by model manager
        // Extract only role and content, ignore id and timestamp
        const history = conversationHistory.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));
        
        const result = await modelManager.runTextGeneration(message, {
          maxLength: 100, // Reduce max length to prevent long repetitive outputs
          temperature: 0.9, // Increase temperature for more diversity
          topK: 40, // Reduce topK to focus on more likely tokens
          topP: 0.95, // Slightly increase topP for better sampling
          conversationHistory: history,
        });

        return result;
      } catch (error) {
        console.error("LLM inference failed:", error);
        throw error;
      }
    },
    [isModelLoaded, currentModel]
  );

  // Handle file upload
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            setCurrentImage(img);
            setInputSource("upload");
            stopCamera();
            if (currentModel?.type === "image-classification" || currentModel?.type === "object-detection") {
              runInference(img);
            }
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else if (file.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setTextInput(text);
          setInputSource("text");
          if (currentModel?.type === "text-classification" || currentModel?.type === "sentiment-analysis" || currentModel?.type === "text-generation") {
            runInference(text);
          }
        };
        reader.readAsText(file);
      }
    },
    [runInference, stopCamera, currentModel]
  );

  // Handle URL input
  const handleUrlInput = useCallback(
    (url: string) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setCurrentImage(img);
        setInputSource("url");
        stopCamera();
        if (currentModel?.type === "image-classification" || currentModel?.type === "object-detection") {
          runInference(img);
        }
      };
      img.onerror = () => {
        alert("Failed to load image from URL");
      };
      img.src = url;
    },
    [runInference, stopCamera, currentModel]
  );

  // Start real-time inference
  const startRealTimeInference = useCallback(() => {
    if (!isCameraActive || !isModelLoaded || !currentModel) return;
    if (currentModel.type !== "image-classification" && currentModel.type !== "object-detection") return;

    setIsRealTimeInference(true);
    inferenceIntervalRef.current = setInterval(() => {
      const canvas = captureFrame();
      if (canvas) {
        runInference(canvas);
      }
    }, 200); // 5 FPS for real-time inference
  }, [isCameraActive, isModelLoaded, currentModel, captureFrame, runInference]);

  // Stop real-time inference
  const stopRealTimeInference = useCallback(() => {
    setIsRealTimeInference(false);
    if (inferenceIntervalRef.current) {
      clearInterval(inferenceIntervalRef.current);
      inferenceIntervalRef.current = null;
    }
  }, []);

  // Handle model change
  const handleModelChange = useCallback(
    async (modelId: string) => {
      // If a model is already loaded, dispose it first
      if (isModelLoaded) {
        modelManager.dispose();
        setIsModelLoaded(false);
        setCurrentBackend("unknown");
      }

      setCurrentModelId(modelId);
      const model = availableModels.find((m) => m.id === modelId);
      setCurrentModel(model || null);
      setInferenceResult(null);
      setInferenceHistory([]); // Clear inference history when switching models
      stopCamera();
      stopRealTimeInference();
    },
    [availableModels, stopCamera, stopRealTimeInference, isModelLoaded]
  );

  if (!isMounted) {
    return null;
  }

  const isImageModel = currentModel?.type === "image-classification" || currentModel?.type === "object-detection";
  const isTextModel = currentModel?.type === "text-classification" || currentModel?.type === "sentiment-analysis" || currentModel?.type === "text-generation" || currentModel?.type === "llm";

  return (
    <div className="container is-fluid mt-6">
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="title is-2 has-text-centered mb-6">
          AI Model Demo - Transformers.js & ONNX Runtime
        </h1>
        <p className="subtitle is-5 has-text-centered mb-6">
          Run multiple AI models in your browser - Image Classification, Text Generation, Sentiment Analysis, Object Detection
        </p>

        {/* Technology Tags */}
        <div className="has-text-centered mb-6">
          <span className="tag is-info is-medium">Transformers.js</span>
          <span className="tag is-info is-medium">ONNX Runtime Web</span>
          <span className="tag is-info is-medium">Real-time Inference</span>
          <span className="tag is-info is-medium">Multiple Model Types</span>
        </div>

        {/* Backend Status Indicator */}
        {isModelLoaded && (
          <div className="box mb-6 has-background-light">
            <div className="level is-mobile">
              <div className="level-left">
                <div className="level-item">
                  <div>
                    <p className="heading">Current Backend</p>
                    <p className="title is-5">
                      {currentBackend === "webgpu" && (
                        <span className="tag is-success is-large">
                          <span className="icon">
                            <i className="fas fa-microchip"></i>
                          </span>
                          <span>WebGPU + WASM</span>
                        </span>
                      )}
                      {currentBackend === "wasm" && (
                        <span className="tag is-info is-large">
                          <span className="icon">
                            <i className="fas fa-cog"></i>
                          </span>
                          <span>WASM (CPU)</span>
                        </span>
                      )}
                      {currentBackend === "webgl" && (
                        <span className="tag is-warning is-large">
                          <span className="icon">
                            <i className="fas fa-cube"></i>
                          </span>
                          <span>WebGL</span>
                        </span>
                      )}
                      {currentBackend === "unknown" && (
                        <span className="tag is-light is-large">
                          <span className="icon">
                            <i className="fas fa-question"></i>
                          </span>
                          <span>Unknown</span>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="level-right">
                <div className="level-item">
                  <div className="content has-text-right">
                    {currentBackend === "webgpu" && (
                      <p className="is-size-7 has-text-success">
                        <strong>✓ GPU Acceleration Active</strong>
                      </p>
                    )}
                    {currentBackend === "wasm" && (
                      <p className="is-size-7 has-text-info">
                        <strong>CPU Backend</strong>
                      </p>
                    )}
                    {typeof window !== "undefined" && (
                      <p className="is-size-7 has-text-grey mt-1">
                        Cross-Origin Isolation: {window.crossOriginIsolated ? (
                          <span className="has-text-success">✓ Enabled</span>
                        ) : (
                          <span className="has-text-warning">✗ Disabled</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* About This Demo */}
        <div className="box mb-6">
          <div className="content">
            <h3 className="title is-4 mb-4">About This Demo</h3>
            <p className="mb-4">
              This demonstration showcases <strong>AI model inference in the browser</strong> using 
              <strong> Transformers.js</strong> and <strong>ONNX Runtime Web</strong>. The system 
              supports multiple model types including image classification, text generation, sentiment 
              analysis, and object detection, all running directly in your browser without server-side processing.
            </p>
            <div className="columns">
              <div className="column">
                <h4 className="title is-5 mb-3">Key Features:</h4>
                <ul>
                  <li>Multiple AI model types (Image, Text, LLM, Object Detection)</li>
                  <li>WebGPU acceleration for faster inference</li>
                  <li>Real-time camera inference</li>
                  <li>Browser-based model caching</li>
                  <li>Hugging Face CDN integration</li>
                  <li>No server-side processing required</li>
                </ul>
              </div>
              <div className="column">
                <h4 className="title is-5 mb-3">Supported Model Types:</h4>
                <ul>
                  <li><strong>Image Classification:</strong> Identify objects in images</li>
                  <li><strong>Text Generation:</strong> LLM-based text generation</li>
                  <li><strong>Sentiment Analysis:</strong> Analyze text sentiment</li>
                  <li><strong>Object Detection:</strong> Detect and locate objects</li>
                </ul>
              </div>
            </div>
            <p className="mt-4">
              <strong>Note:</strong> Models are loaded from Hugging Face CDN and cached in your browser 
              for faster subsequent loads. WebGPU acceleration is automatically used when available.
            </p>
          </div>
        </div>

        {/* System Architecture Overview */}
        <div className="box mb-6">
          <h3 className="title is-4 mb-4">System Architecture Overview</h3>
          <div className="columns">
            <div className="column">
              <div className="content">
                <h5 className="title is-5">Technology Stack</h5>
                <ul>
                  <li><strong>Frontend:</strong> Next.js 16, React 19, TypeScript</li>
                  <li><strong>AI Runtime:</strong> Transformers.js, ONNX Runtime Web</li>
                  <li><strong>Acceleration:</strong> WebGPU, WASM, SIMD</li>
                  <li><strong>Model Storage:</strong> Hugging Face CDN + Browser Cache</li>
                </ul>
              </div>
            </div>
            <div className="column">
              <div className="content">
                <h5 className="title is-5">Architecture Pattern</h5>
                <ul>
                  <li><strong>Pattern:</strong> Client-side AI inference</li>
                  <li><strong>Scalability:</strong> Browser-based, no server load</li>
                  <li><strong>Privacy:</strong> Data never leaves your device</li>
                  <li><strong>Performance:</strong> GPU acceleration when available</li>
                </ul>
              </div>
            </div>
            <div className="column">
              <div className="content">
                <h5 className="title is-5">Model Management</h5>
                <ul>
                  <li><strong>Loading:</strong> Dynamic from Hugging Face Hub</li>
                  <li><strong>Caching:</strong> Browser IndexedDB/Cache API</li>
                  <li><strong>Backend:</strong> Auto-detected (WebGPU/WASM)</li>
                  <li><strong>Switching:</strong> Hot-swappable models</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Model Selection */}
        <div className="box mb-6">
          <h2 className="title is-4 mb-4">Model Selection</h2>
          <div className="field">
            <label className="label">Select Model</label>
            <div className="control">
              <div className="select is-fullwidth">
                <select
                  value={currentModelId}
                  onChange={(e) => handleModelChange(e.target.value)}
                  disabled={isLoading}
                  aria-label="Select AI model"
                >
                  {availableModels.map((model) => {
                    const isRecommended = recommendedModels.some((m) => m.id === model.id);
                    return (
                      <option key={model.id} value={model.id}>
                        {model.name} ({model.type}) - {model.engine}
                        {isRecommended && " ⭐ Recommended"}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {currentModel && (
            <div className="content mt-4">
              <p>
                <strong>Description:</strong> {currentModel.description || "No description"}
              </p>
              <p>
                <strong>Type:</strong> {currentModel.type}
              </p>
              <p>
                <strong>Engine:</strong> {currentModel.engine}
              </p>
              {currentModel.size && (
                <p>
                  <strong>Size:</strong> {currentModel.size}
                </p>
              )}
              {currentModel.recommendedFor && (
                <p>
                  <strong>Recommended For:</strong>{" "}
                  <span className={`tag is-${currentModel.recommendedFor === "xlarge" ? "danger" : currentModel.recommendedFor === "large" ? "warning" : currentModel.recommendedFor === "medium" ? "info" : "success"}`}>
                    {currentModel.recommendedFor.toUpperCase()}
                  </span>
                </p>
              )}
            </div>
          )}

          <div className="field is-grouped mt-4">
            <div className="control">
              <button
                className={`button is-primary ${isLoading ? "is-loading" : ""}`}
                onClick={loadModel}
                disabled={isLoading || isModelLoaded || !currentModelId}
                aria-label="Load selected model"
              >
                {isModelLoaded ? "Model Loaded" : "Load Model"}
              </button>
            </div>
            {isModelLoaded && (
              <div className="control">
                <span className="tag is-success is-large">
                  <span className="icon">
                    <i className="fas fa-check"></i>
                  </span>
                  <span>Loaded</span>
                </span>
              </div>
            )}
          </div>

          {loadingProgress && (
            <div className="notification is-info is-light mt-4">
              <p>{loadingProgress}</p>
              {isModelCached && (
                <p className="is-size-7 mt-2">
                  <span className="icon">
                    <i className="fas fa-check-circle"></i>
                  </span>
                  Model found in browser cache - loading instantly
                </p>
              )}
              {!isModelCached && currentModel && (
                <p className="is-size-7 mt-2">
                  <span className="icon">
                    <i className="fas fa-download"></i>
                  </span>
                  First-time download from Hugging Face CDN. Model will be cached for future use.
                </p>
              )}
            </div>
          )}

          {/* Cache Information */}
          {cacheInfo && cacheInfo.totalSize > 0 && (
            <div className="notification is-success is-light mt-4">
              <p className="is-size-7">
                <strong>Browser Cache:</strong> {CacheManager.formatBytes(cacheInfo.totalSize)} stored
                <button
                  className="button is-small is-text ml-2"
                  onClick={async () => {
                    if (confirm("Clear all cached models? They will need to be downloaded again.")) {
                      await CacheManager.clearCache();
                      setCacheInfo({ totalSize: 0, modelCount: 0 });
                      setIsModelCached(false);
                    }
                  }}
                  aria-label="Clear cache"
                >
                  Clear Cache
                </button>
              </p>
            </div>
          )}
        </div>

        {/* Dynamic UI based on model type */}
        {isModelLoaded && currentModel && (
          <>
            {/* LLM/Text Generation - Chat Interface */}
            {(currentModel.type === "text-generation" || currentModel.type === "llm") && (
              <LLMChatInterface
                onSendMessage={runLLMInference}
                isModelLoaded={isModelLoaded}
              />
            )}

            {/* Image Classification/Object Detection - Image Interface */}
            {(currentModel.type === "image-classification" || currentModel.type === "object-detection") && (
              <ImageClassificationInterface
                onRunInference={runInference}
                isModelLoaded={isModelLoaded}
                isCameraActive={isCameraActive}
                onStartCamera={startCamera}
                onStopCamera={stopCamera}
                onCaptureFrame={captureFrame}
                videoRef={videoRef}
                canvasRef={canvasRef}
                fileInputRef={fileInputRef}
                onFileUpload={handleFileUpload}
                onUrlInput={handleUrlInput}
                currentImage={currentImage}
                isRealTimeInference={isRealTimeInference}
                onStartRealTime={startRealTimeInference}
                onStopRealTime={stopRealTimeInference}
              />
            )}

            {/* Text Classification/Sentiment Analysis - Text Interface */}
            {(currentModel.type === "text-classification" || currentModel.type === "sentiment-analysis") && (
              <TextClassificationInterface
                onRunInference={runInference}
                isModelLoaded={isModelLoaded}
                modelType={currentModel.type}
              />
            )}
          </>
        )}

        {/* Inference Results - Only show for non-chat models */}
        {inferenceResult && 
         currentModel && 
         currentModel.type !== "text-generation" && 
         currentModel.type !== "llm" && (
          <>
            <div className="box mb-6">
              <h2 className="title is-4 mb-4">Inference Results</h2>
              <div className="content">
                <div className="columns">
                  <div className="column">
                    <p>
                      <strong>Model:</strong> {inferenceResult.modelName}
                    </p>
                    <p>
                      <strong>Type:</strong> {inferenceResult.modelType}
                    </p>
                    <p>
                      <strong>Backend:</strong> {currentBackend.toUpperCase()}
                    </p>
                  </div>
                  <div className="column">
                    <p>
                      <strong>Inference Time:</strong> {inferenceResult.inferenceTime.toFixed(2)} ms
                    </p>
                    <p>
                      <strong>Throughput:</strong> {(1000 / inferenceResult.inferenceTime).toFixed(2)} inferences/sec
                    </p>
                    {currentBackend === "webgpu" && (
                      <p className="has-text-success">
                        <strong>✓ GPU Accelerated</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* Classification Results */}
                {inferenceResult.predictions && inferenceResult.predictions.length > 0 && (
                  <div className="mt-4">
                    <h3 className="title is-5">Top Predictions:</h3>
                    <table className="table is-fullwidth">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Label</th>
                          <th>Confidence</th>
                          <th>Visual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inferenceResult.predictions.slice(0, 10).map((pred, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{pred.label}</td>
                            <td>{(pred.confidence * 100).toFixed(2)}%</td>
                            <td>
                              <progress 
                                className="progress is-primary" 
                                value={pred.confidence * 100} 
                                max="100"
                                aria-label={`Confidence: ${(pred.confidence * 100).toFixed(2)}%`}
                              >
                                {(pred.confidence * 100).toFixed(2)}%
                              </progress>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Metrics */}
            {inferenceHistory.length > 0 && (
              <div className="box mb-6">
                <h3 className="title is-4 mb-4">Performance Metrics</h3>
                <div className="content">
                  <div className="columns">
                    <div className="column">
                      <div className="box has-background-light">
                        <p className="heading">Average Inference Time</p>
                        <p className="title is-4">
                          {(inferenceHistory.reduce((sum, h) => sum + h.inferenceTime, 0) / inferenceHistory.length).toFixed(2)} ms
                        </p>
                      </div>
                    </div>
                    <div className="column">
                      <div className="box has-background-light">
                        <p className="heading">Total Inferences</p>
                        <p className="title is-4">{inferenceHistory.length}</p>
                      </div>
                    </div>
                    <div className="column">
                      <div className="box has-background-light">
                        <p className="heading">Average Throughput</p>
                        <p className="title is-4">
                          {(inferenceHistory.length / ((inferenceHistory[inferenceHistory.length - 1]?.timestamp || Date.now()) - (inferenceHistory[0]?.timestamp || Date.now())) * 1000).toFixed(2)} /sec
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
