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
  // Use all available CPU cores for WASM backend
  const cores = navigator.hardwareConcurrency || 4;
  env.backends.onnx.wasm.numThreads = cores;
  
  // Enable SIMD for vectorized operations (significant performance boost)
  env.backends.onnx.wasm.simd = true;
  
  // Enable proxy for better memory management
  env.backends.onnx.wasm.proxy = false; // Set to false for direct WASM execution
  
  console.log(`ONNX Runtime WASM configured: ${cores} threads, SIMD enabled`);
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
            if (progress.status === "progress" && progress.progress) {
              const percent = Math.round((progress.progress / progress.file.size) * 100);
              console.log(`Loading model from ${progress.file.src}: ${percent}%`);
            } else if (progress.status === "done") {
              console.log("Model loaded and cached in browser IndexedDB");
            } else {
              console.log("Model loading progress:", progress);
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
      
      if (options?.conversationHistory && options.conversationHistory.length > 0) {
        // Format conversation history for the model
        // Most models expect a specific format, adjust based on model type
        const historyText = options.conversationHistory
          .map((msg) => {
            if (msg.role === "user") {
              return `User: ${msg.content}`;
            } else {
              return `Assistant: ${msg.content}`;
            }
          })
          .join("\n");
        
        fullPrompt = `${historyText}\nUser: ${prompt}\nAssistant:`;
      }

      const result = await this.transformersPipeline(fullPrompt, {
        max_new_tokens: options?.maxLength || 100,
        temperature: options?.temperature || 0.7,
        top_k: options?.topK,
        top_p: options?.topP,
        return_full_text: false, // Only return generated text, not the full prompt
      });

      const inferenceTime = performance.now() - startTime;

      // Extract generated text
      let generatedText = "";
      if (Array.isArray(result)) {
        generatedText = result[0]?.generated_text || "";
      } else if (result?.generated_text) {
        generatedText = result.generated_text;
        // Remove the prompt from generated text if it's included
        if (generatedText.startsWith(fullPrompt)) {
          generatedText = generatedText.slice(fullPrompt.length).trim();
        }
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

