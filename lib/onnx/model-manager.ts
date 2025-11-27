/**
 * 统一模型管理器
 * 支持多种模型类型：图像分类、文本分类、LLM、目标检测等
 * 使用 Transformers.js 作为主要引擎，ONNX Runtime Web 作为备选
 */

import { pipeline, Pipeline, env } from "@huggingface/transformers";
import { onnxRuntimeManager, ExecutionProvider } from "./onnx-runtime";

export type ModelType = "image-classification" | "text-classification" | "llm" | "object-detection" | "text-generation" | "sentiment-analysis" | "translation";

export interface ModelMetadata {
  id: string;
  name: string;
  type: ModelType;
  engine: "transformers" | "onnx";
  modelId?: string; // For Transformers.js (Hugging Face model ID)
  path?: string; // For ONNX models
  labelsPath?: string; // Path to labels JSON file
  inputShape?: number[];
  outputShape?: number[];
  mean?: number[];
  std?: number[];
  description?: string;
  size?: string;
  tokenizer?: string;
  recommendedFor?: "small" | "medium" | "large" | "xlarge";
}

export interface InferenceResult {
  predictions?: Array<{
    label: string;
    confidence: number;
    index?: number;
  }>;
  text?: string; // For LLM/text generation
  tokens?: number[]; // For LLM
  inferenceTime: number;
  modelName: string;
  modelType: ModelType;
}

export interface ModelConfig {
  models: ModelMetadata[];
}

// ✅ RECOMMENDED STRATEGY: Hugging Face CDN + Browser Cache
// https://huggingface.co/docs/transformers.js/custom_usage
//
// This configuration provides:
// - Zero storage costs (no Vercel Blob needed)
// - Automatic browser caching (IndexedDB)
// - Fast subsequent loads (cached models load instantly)
// - No maintenance required
// - Models automatically cached after first download

// Allow loading models from Hugging Face Hub CDN
env.allowRemoteModels = true;

// IMPORTANT: Do NOT set env.localModelPath
// This ensures models are loaded from Hugging Face CDN, not local files
// Models will be automatically cached in browser's IndexedDB after first download
//
// Caching behavior:
// - First load: Downloads from Hugging Face CDN (~5-45s depending on model size)
// - Subsequent loads: Instant from IndexedDB cache
// - Cache persists across browser sessions
// - Cache is keyed by model ID, version, and quantization level

// Configure ONNX Runtime for optimal performance
// The warnings indicate some nodes aren't assigned to preferred execution providers
// We'll optimize the configuration to minimize this

// Configure WASM backend for optimal performance
if (typeof navigator !== "undefined" && env.backends?.onnx?.wasm) {
  // Check if cross-origin isolation is enabled (required for multi-threading)
  const isCrossOriginIsolated = typeof window !== "undefined" && 
    (window.crossOriginIsolated || 
     (window as any).crossOriginIsolated !== undefined);
  
  // Use all available CPU cores for WASM backend, but only if cross-origin isolated
  const cores = navigator.hardwareConcurrency || 4;
  
  if (isCrossOriginIsolated) {
    env.backends.onnx.wasm.numThreads = cores;
    console.log(`ONNX Runtime WASM configured: ${cores} threads, SIMD enabled (cross-origin isolated)`);
  } else {
    // Single-threaded mode (no cross-origin isolation)
    env.backends.onnx.wasm.numThreads = 1;
    console.log(`ONNX Runtime WASM configured: single-threaded mode (cross-origin isolation not enabled). For multi-threading, see: https://web.dev/cross-origin-isolation-guide/`);
  }
  
  // Enable SIMD for vectorized operations (significant performance boost)
  env.backends.onnx.wasm.simd = true;
  
  // Enable proxy for better memory management
  env.backends.onnx.wasm.proxy = false; // Set to false for direct WASM execution
}

// Note: WebGPU backend is automatically used when available via device: 'webgpu'
// Transformers.js 3.8.0 will automatically use WebGPU if the device parameter is set

export class ModelManager {
  private transformersPipeline: any = null; // Using any to support different pipeline types
  private currentModel: ModelMetadata | null = null;
  private labels: string[] | null = null;
  private modelConfig: ModelConfig | null = null;
  private currentBackend: "webgpu" | "webgl" | "wasm" | "cpu" | "unknown" = "unknown";

  /**
   * 加载模型配置
   */
  async loadModelConfig(): Promise<ModelConfig> {
    if (this.modelConfig) {
      return this.modelConfig;
    }

    try {
      const response = await fetch("/onnx-models/models-config.json");
      const config = await response.json();
      this.modelConfig = config as ModelConfig;
      return this.modelConfig;
    } catch (error) {
      console.error("Failed to load model config:", error);
      throw error;
    }
  }

  /**
   * 加载标签文件
   */
  async loadLabels(labelsPath: string): Promise<string[]> {
    if (this.labels) {
      return this.labels;
    }

    try {
      const response = await fetch(labelsPath);
      const labels = await response.json();
      this.labels = labels as string[];
      return this.labels;
    } catch (error) {
      console.error("Failed to load labels:", error);
      return [];
    }
  }

  /**
   * 加载模型
   */
  async loadModel(modelId: string): Promise<void> {
    const config = await this.loadModelConfig();
    const model = config.models.find((m) => m.id === modelId);

    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    this.currentModel = model;

    if (model.engine === "transformers") {
      // Use Transformers.js with latest API
      const task = this.getTransformersTask(model.type);
      
      // Check if WebGPU is available and use it
      let device: "webgpu" | "wasm" = "wasm";
      if (typeof navigator !== "undefined" && navigator.gpu) {
        try {
          const adapter = await navigator.gpu.requestAdapter();
          if (adapter) {
            device = "webgpu";
          }
        } catch (e) {
          // WebGPU not available, use WASM
        }
      }

      // Configure pipeline with Hugging Face CDN + automatic browser caching
      // Transformers.js automatically handles:
      // - Downloading from Hugging Face CDN on first load
      // - Caching in browser IndexedDB
      // - Loading from cache on subsequent requests
      this.transformersPipeline = await pipeline(
        task,
        model.modelId || modelId, // Model ID from Hugging Face Hub
        {
          device: device, // Explicitly set device to use WebGPU if available
          progress_callback: (progress: any) => {
            // Show detailed loading progress
            if (progress.status === "progress" && progress.progress && progress.file) {
              const fileSize = progress.file.size || 0;
              const loaded = progress.progress || 0;
              const percent = fileSize > 0 ? Math.round((loaded / fileSize) * 100) : 0;
              const fileName = progress.file.name || progress.file.src || "unknown file";
              console.log(`Loading ${fileName}: ${percent}% (${(loaded / 1024 / 1024).toFixed(2)}MB / ${(fileSize / 1024 / 1024).toFixed(2)}MB)`);
            } else if (progress.status === "done") {
              console.log("Model loaded and cached in browser IndexedDB");
            } else if (progress.status === "ready") {
              console.log(`Model ready: ${progress.model || progress.name || "unknown"}`);
            } else {
              // Only log important status updates, not every single progress event
              if (progress.status === "initiate" || progress.status === "download") {
                const fileName = progress.file?.name || progress.file?.src || progress.file || "unknown";
                console.log(`Model loading: ${progress.status} - ${fileName}`);
              }
            }
          },
        } as any
      );

      // Detect actual backend being used
      await this.detectBackend();

      // 加载标签（如果需要）
      if (model.labelsPath) {
        await this.loadLabels(model.labelsPath);
      }
    } else if (model.engine === "onnx") {
      // 使用 ONNX Runtime Web
      if (!model.path) {
        throw new Error(`ONNX model path not specified for ${modelId}`);
      }

      const labels = model.labelsPath ? await this.loadLabels(model.labelsPath) : [];

      await onnxRuntimeManager.loadModel({
        name: model.name,
        path: model.path,
        inputShape: model.inputShape || [1, 3, 224, 224],
        outputShape: model.outputShape || [1, 1000],
        mean: model.mean,
        std: model.std,
        labels: labels,
      });
    }
  }

  /**
   * 获取 Transformers.js 任务类型
   */
  private getTransformersTask(modelType: ModelType): any {
    const taskMap: Record<ModelType, any> = {
      "image-classification": "image-classification",
      "text-classification": "text-classification",
      "sentiment-analysis": "sentiment-analysis",
      "llm": "text-generation",
      "text-generation": "text-generation",
      "object-detection": "object-detection",
      "translation": "translation",
    };

    return taskMap[modelType] || "image-classification";
  }

  /**
   * 执行推理 - 图像分类
   */
  async runImageClassification(
    input: HTMLImageElement | HTMLCanvasElement | ImageData | File
  ): Promise<InferenceResult> {
    if (!this.currentModel) {
      throw new Error("No model loaded");
    }

    const startTime = performance.now();

    if (this.currentModel.engine === "transformers" && this.transformersPipeline) {
      // 使用 Transformers.js
      const result = await this.transformersPipeline(input);
      const inferenceTime = performance.now() - startTime;

      // 转换结果格式
      const predictions = Array.isArray(result)
        ? result.map((item: any, index: number) => ({
            label: item.label || `Class ${index}`,
            confidence: item.score || 0,
            index: index,
          }))
        : [
            {
              label: result.label || "Unknown",
              confidence: result.score || 0,
              index: 0,
            },
          ];

      return {
        predictions,
        inferenceTime,
        modelName: this.currentModel.name,
        modelType: this.currentModel.type,
      };
    } else {
      // 使用 ONNX Runtime Web
      const result = await onnxRuntimeManager.runInference(input as any, 5);
      return {
        predictions: result.predictions,
        inferenceTime: result.inferenceTime,
        modelName: this.currentModel.name,
        modelType: this.currentModel.type,
      };
    }
  }

  /**
   * 执行推理 - 文本分类/情感分析
   */
  async runTextClassification(text: string): Promise<InferenceResult> {
    if (!this.currentModel) {
      throw new Error("No model loaded");
    }

    const startTime = performance.now();

    if (this.currentModel.engine === "transformers" && this.transformersPipeline) {
      const result = await this.transformersPipeline(text);
      const inferenceTime = performance.now() - startTime;

      const predictions = Array.isArray(result)
        ? result.map((item: any, index: number) => ({
            label: item.label || `Class ${index}`,
            confidence: item.score || 0,
            index: index,
          }))
        : [
            {
              label: result.label || "Unknown",
              confidence: result.score || 0,
              index: 0,
            },
          ];

      return {
        predictions,
        inferenceTime,
        modelName: this.currentModel.name,
        modelType: this.currentModel.type,
      };
    } else {
      throw new Error("Text classification requires Transformers.js engine");
    }
  }

  /**
   * 执行推理 - LLM/文本生成
   * Supports conversation context for better responses
   */
  async runTextGeneration(
    prompt: string,
    options?: {
      maxLength?: number;
      temperature?: number;
      topK?: number;
      topP?: number;
      conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
    }
  ): Promise<InferenceResult> {
    if (!this.currentModel) {
      throw new Error("No model loaded");
    }

    const startTime = performance.now();

    if (this.currentModel.engine === "transformers" && this.transformersPipeline) {
      // Build context from conversation history
      let fullPrompt = prompt;
      
      // Build prompt - don't include the current message in history
      // The conversationHistory should NOT include the current message
      if (options?.conversationHistory && options.conversationHistory.length > 0) {
        // Filter out the last message if it's the same as the current prompt (avoid duplication)
        // Limit history to last 8 messages to avoid context overflow (leave room for current message)
        const historyWithoutCurrent = options.conversationHistory
          .filter((msg, index, arr) => {
            // Remove the last message if it matches the current prompt (it's the user's current message)
            if (index === arr.length - 1 && msg.role === "user" && msg.content === prompt) {
              return false;
            }
            return true;
          })
          .slice(-8);
        
        // Format conversation history - use a cleaner format for GPT-2
        const historyText = historyWithoutCurrent
          .map((msg) => {
            if (msg.role === "user") {
              return `User: ${msg.content}`;
            } else {
              return `Assistant: ${msg.content}`;
            }
          })
          .join("\n");
        
        // Build prompt with history - add current message
        if (historyText) {
          fullPrompt = `${historyText}\nUser: ${prompt}\nAssistant:`;
        } else {
          fullPrompt = `User: ${prompt}\nAssistant:`;
        }
      } else {
        // No history, just use the prompt with assistant prefix
        fullPrompt = `User: ${prompt}\nAssistant:`;
      }

      // Debug: Log the prompt being sent
      console.log("[LLM Debug] Full prompt:", fullPrompt);
      console.log("[LLM Debug] Prompt length:", fullPrompt.length);
      
      const result = await this.transformersPipeline(fullPrompt, {
        max_new_tokens: options?.maxLength || 100,
        temperature: options?.temperature || 0.7,
        top_k: options?.topK,
        top_p: options?.topP,
        return_full_text: false, // Only return generated text, not the full prompt
      });

      const inferenceTime = performance.now() - startTime;

      // Debug: Log the raw result
      console.log("[LLM Debug] Raw result type:", typeof result);
      console.log("[LLM Debug] Raw result:", result);
      console.log("[LLM Debug] Is array?", Array.isArray(result));
      if (Array.isArray(result)) {
        console.log("[LLM Debug] Array length:", result.length);
        console.log("[LLM Debug] First item:", result[0]);
      }

      // Extract generated text
      // Transformers.js text-generation pipeline returns different formats:
      // - For single input: { generated_text: "full text including prompt" }
      // - For array input: [{ generated_text: "..." }, ...]
      let generatedText = "";
      
      try {
        // Handle array result
        if (Array.isArray(result)) {
          const firstResult = result[0];
          if (firstResult?.generated_text) {
            generatedText = firstResult.generated_text;
            console.log("[LLM Debug] Extracted from array[0].generated_text:", generatedText);
          } else if (typeof firstResult === "string") {
            generatedText = firstResult;
            console.log("[LLM Debug] Extracted from array[0] (string):", generatedText);
          } else {
            console.warn("[LLM Debug] Array[0] is not in expected format:", firstResult);
          }
        } 
        // Handle object result
        else if (result && typeof result === "object") {
          if (result.generated_text) {
            generatedText = result.generated_text;
            console.log("[LLM Debug] Extracted from result.generated_text:", generatedText);
          } else {
            // Try other possible fields
            const textFields = ["text", "output", "response", "content"];
            for (const field of textFields) {
              if (result[field]) {
                generatedText = String(result[field]);
                console.log(`[LLM Debug] Extracted from result.${field}:`, generatedText);
                break;
              }
            }
          }
        } 
        // Handle string result
        else if (typeof result === "string") {
          generatedText = result;
          console.log("[LLM Debug] Result is string:", generatedText);
        }
        
        // Remove the prompt from generated text if it's included
        // The generated_text might include the full prompt, we only want the new part
        if (generatedText && fullPrompt) {
          const originalText = generatedText;
          
          // Strategy 1: Check if the full prompt is at the start
          if (generatedText.startsWith(fullPrompt)) {
            generatedText = generatedText.slice(fullPrompt.length).trim();
            console.log("[LLM Debug] Removed full prompt from start");
          } 
          // Strategy 2: Try to find where the prompt ends and extract only after "Assistant:"
          else {
            // Find the last occurrence of "Assistant:" in the prompt
            const assistantMarker = "Assistant:";
            const lastAssistantIndex = fullPrompt.lastIndexOf(assistantMarker);
            
            if (lastAssistantIndex !== -1) {
              // Everything after "Assistant:" in the prompt should be removed
              const promptAfterAssistant = fullPrompt.slice(lastAssistantIndex + assistantMarker.length).trim();
              
              // Find where this appears in the generated text
              const promptEndIndex = generatedText.indexOf(promptAfterAssistant, lastAssistantIndex);
              
              if (promptEndIndex !== -1) {
                // Extract everything after the prompt
                generatedText = generatedText.slice(promptEndIndex + promptAfterAssistant.length).trim();
                console.log("[LLM Debug] Removed prompt after Assistant marker");
              } else {
                // Fallback: just remove everything up to and including the last "Assistant:" in the prompt
                const promptUpToAssistant = fullPrompt.slice(0, lastAssistantIndex + assistantMarker.length);
                if (generatedText.startsWith(promptUpToAssistant)) {
                  generatedText = generatedText.slice(promptUpToAssistant.length).trim();
                  console.log("[LLM Debug] Removed prompt up to Assistant marker");
                }
              }
            }
            
            // Strategy 3: If still contains the prompt, try to find the first "Assistant:" after the prompt
            if (generatedText.includes(fullPrompt)) {
              const promptIndex = generatedText.indexOf(fullPrompt);
              const afterPrompt = generatedText.slice(promptIndex + fullPrompt.length);
              // Find the next "Assistant:" after the prompt
              const nextAssistantIndex = afterPrompt.indexOf("Assistant:");
              if (nextAssistantIndex !== -1) {
                generatedText = afterPrompt.slice(nextAssistantIndex + "Assistant:".length).trim();
                console.log("[LLM Debug] Extracted text after next Assistant marker");
              } else {
                generatedText = afterPrompt.trim();
                console.log("[LLM Debug] Extracted text after prompt");
              }
            }
            
            // Strategy 4: Clean up any remaining "Assistant:" prefixes at the start
            while (generatedText.startsWith("Assistant:")) {
              generatedText = generatedText.slice("Assistant:".length).trim();
            }
            
            // Strategy 5: Remove repetitive patterns (model got stuck in a loop)
            // Split by lines and remove duplicate consecutive lines
            const lines = generatedText.split("\n");
            if (lines.length > 2) {
              const cleanedLines: string[] = [];
              let lastLine = "";
              let duplicateCount = 0;
              
              for (const line of lines) {
                const trimmedLine = line.trim();
                // Skip empty lines and duplicates
                if (trimmedLine.length === 0) continue;
                
                if (trimmedLine === lastLine) {
                  duplicateCount++;
                  // Only keep first occurrence, skip all duplicates
                  if (duplicateCount > 1) {
                    continue;
                  }
                } else {
                  duplicateCount = 0;
                }
                
                cleanedLines.push(line);
                lastLine = trimmedLine;
              }
              
              if (cleanedLines.length < lines.length) {
                generatedText = cleanedLines.join("\n").trim();
                console.log("[LLM Debug] Removed", lines.length - cleanedLines.length, "duplicate/repetitive lines");
              }
            }
            
            // Strategy 6: If text still contains "Assistant:" multiple times, extract only the first meaningful response
            const assistantMatches = generatedText.match(/Assistant:\s*(.+?)(?=\n|$)/g);
            if (assistantMatches && assistantMatches.length > 1) {
              // Take only the first assistant response
              const firstResponse = assistantMatches[0].replace(/^Assistant:\s*/, "").trim();
              if (firstResponse.length > 0) {
                generatedText = firstResponse;
                console.log("[LLM Debug] Extracted first assistant response from multiple matches");
              }
            }
          }
        }
        
        // Fallback: if we still don't have text, log the result for debugging
        if (!generatedText || generatedText.trim().length === 0) {
          console.error("[LLM Debug] Could not extract generated text from result:", result);
          console.error("[LLM Debug] Full prompt was:", fullPrompt);
          generatedText = "No response generated. Please check the console for details.";
        } else {
          console.log("[LLM Debug] Final generated text:", generatedText);
        }
      } catch (error) {
        console.error("[LLM Debug] Error extracting generated text:", error);
        console.error("[LLM Debug] Result was:", result);
        generatedText = "Error generating response. Please check the console.";
      }

      return {
        text: generatedText,
        inferenceTime,
        modelName: this.currentModel.name,
        modelType: this.currentModel.type,
      };
    } else {
      throw new Error("Text generation requires Transformers.js engine");
    }
  }

  /**
   * 执行推理 - 目标检测
   */
  async runObjectDetection(
    input: HTMLImageElement | HTMLCanvasElement | ImageData | File
  ): Promise<InferenceResult> {
    if (!this.currentModel) {
      throw new Error("No model loaded");
    }

    const startTime = performance.now();

    if (this.currentModel.engine === "transformers" && this.transformersPipeline) {
      const result = await this.transformersPipeline(input);
      const inferenceTime = performance.now() - startTime;

      const predictions = Array.isArray(result)
        ? result.map((item: any, index: number) => ({
            label: item.label || `Object ${index}`,
            confidence: item.score || 0,
            index: index,
          }))
        : [];

      return {
        predictions,
        inferenceTime,
        modelName: this.currentModel.name,
        modelType: this.currentModel.type,
      };
    } else {
      throw new Error("Object detection requires Transformers.js engine");
    }
  }

  /**
   * 获取所有可用模型
   */
  async getAvailableModels(): Promise<ModelMetadata[]> {
    const config = await this.loadModelConfig();
    return config.models;
  }

  /**
   * 获取当前加载的模型
   */
  getCurrentModel(): ModelMetadata | null {
    return this.currentModel;
  }

  /**
   * Detect the actual backend being used
   * Check the pipeline's device property to see what backend is actually being used
   */
  private async detectBackend(): Promise<void> {
    if (!this.transformersPipeline) {
      this.currentBackend = "unknown";
      return;
    }

    // Try to get the device from the pipeline
    try {
      // Check if pipeline has device property
      const device = (this.transformersPipeline as any).model?.device || 
                     (this.transformersPipeline as any).device;
      
      if (device === "webgpu" || device === "gpu") {
        this.currentBackend = "webgpu";
        console.log("WebGPU backend is active");
        return;
      } else if (device === "wasm" || device === "cpu") {
        this.currentBackend = "wasm";
        console.log("WASM backend is active");
        return;
      }
    } catch (e) {
      console.warn("Could not detect backend from pipeline:", e);
    }

    // Fallback: Check if WebGPU is available
    if (typeof navigator !== "undefined" && navigator.gpu) {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) {
          // If WebGPU adapter is available, assume it's being used
          // (since we set device: 'webgpu' in pipeline creation)
          this.currentBackend = "webgpu";
          return;
        }
      } catch (e) {
        // WebGPU not available
      }
    }

    // Default to WASM if we can't determine
    this.currentBackend = "wasm";
  }

  /**
   * Get current backend being used
   */
  getCurrentBackend(): "webgpu" | "webgl" | "wasm" | "cpu" | "unknown" {
    return this.currentBackend;
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.transformersPipeline = null;
    this.currentModel = null;
    this.labels = null;
    onnxRuntimeManager.dispose();
  }
}

// 导出单例实例
export const modelManager = new ModelManager();

