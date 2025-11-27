/**
 * ONNX Runtime Web 工具库
 * 提供模型加载、推理管道、WebGPU/WebNN 加速等功能
 */

import * as ort from "onnxruntime-web";

export type ExecutionProvider = "cpu" | "webgl" | "wasm" | "webgpu" | "webnn";

export interface ModelConfig {
  name: string;
  path: string;
  inputShape: number[];
  outputShape: number[];
  mean?: number[];
  std?: number[];
  labels?: string[];
}

export interface InferenceResult {
  predictions: Array<{
    label: string;
    confidence: number;
    index: number;
  }>;
  inferenceTime: number;
  provider: ExecutionProvider;
  modelName: string;
}

export interface PerformanceMetrics {
  provider: ExecutionProvider;
  avgInferenceTime: number;
  minInferenceTime: number;
  maxInferenceTime: number;
  throughput: number; // inferences per second
  memoryUsage?: number;
}

export class ONNXRuntimeManager {
  private session: ort.InferenceSession | null = null;
  private currentProvider: ExecutionProvider = "wasm";
  private modelConfig: ModelConfig | null = null;
  private performanceHistory: PerformanceMetrics[] = [];
  private inferenceCount: number = 0;
  private totalInferenceTime: number = 0;

  /**
   * 初始化 ONNX Runtime
   */
  async initialize(): Promise<void> {
    try {
      // 设置 WebAssembly 线程数
      ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4;
      
      // 启用 WebGPU 如果可用
      if (await this.isWebGPUSupported()) {
        this.currentProvider = "webgpu";
      } else if (await this.isWebGLSupported()) {
        this.currentProvider = "webgl";
      } else {
        this.currentProvider = "wasm";
      }
    } catch (error) {
      console.warn("Failed to initialize ONNX Runtime:", error);
      this.currentProvider = "wasm"; // Fallback to WASM
    }
  }

  /**
   * 检查 WebGPU 支持
   */
  async isWebGPUSupported(): Promise<boolean> {
    if (!navigator.gpu) return false;
    try {
      const adapter = await navigator.gpu.requestAdapter();
      return adapter !== null;
    } catch {
      return false;
    }
  }

  /**
   * 检查 WebGL 支持
   */
  async isWebGLSupported(): Promise<boolean> {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      return gl !== null;
    } catch {
      return false;
    }
  }

  /**
   * 检查 WebNN 支持
   */
  async isWebNNSupported(): Promise<boolean> {
    // WebNN is still experimental, check if available
    return typeof (navigator as any).ml !== "undefined";
  }

  /**
   * 加载模型
   */
  async loadModel(config: ModelConfig, provider?: ExecutionProvider): Promise<void> {
    try {
      this.modelConfig = config;

      // 确定执行提供者
      let executionProvider: ExecutionProvider = provider || this.currentProvider;

      // 验证提供者支持
      if (executionProvider === "webgpu" && !(await this.isWebGPUSupported())) {
        console.warn("WebGPU not supported, falling back to WebGL");
        executionProvider = "webgl";
      }

      if (executionProvider === "webgl" && !(await this.isWebGLSupported())) {
        console.warn("WebGL not supported, falling back to WASM");
        executionProvider = "wasm";
      }

      // 配置执行提供者选项
      const sessionOptions: ort.InferenceSession.SessionOptions = {
        executionProviders: this.getExecutionProviders(executionProvider),
        graphOptimizationLevel: "all",
      };

      // 加载模型
      this.session = await ort.InferenceSession.create(config.path, sessionOptions);
      this.currentProvider = executionProvider;

      console.log(`Model loaded successfully with provider: ${executionProvider}`);
    } catch (error) {
      console.error("Failed to load model:", error);
      throw error;
    }
  }

  /**
   * 获取执行提供者配置
   */
  private getExecutionProviders(provider: ExecutionProvider): string[] {
    switch (provider) {
      case "webgpu":
        return ["webgpu"];
      case "webgl":
        return ["webgl"];
      case "webnn":
        return ["webnn"];
      case "wasm":
        return ["wasm"];
      case "cpu":
        return ["cpu"];
      default:
        return ["wasm"];
    }
  }

  /**
   * 预处理图像数据
   */
  preprocessImage(
    image: HTMLImageElement | HTMLCanvasElement | ImageData,
    targetSize: [number, number] = [224, 224],
    mean: number[] = [0.485, 0.456, 0.406],
    std: number[] = [0.229, 0.224, 0.225]
  ): Float32Array {
    const canvas = document.createElement("canvas");
    canvas.width = targetSize[0];
    canvas.height = targetSize[1];
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    // 绘制并调整大小
    ctx.drawImage(image as HTMLImageElement, 0, 0, targetSize[0], targetSize[1]);

    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, targetSize[0], targetSize[1]);
    const data = imageData.data;

    // 转换为 Float32Array 并归一化
    const inputData = new Float32Array(3 * targetSize[0] * targetSize[1]);

    // MobileNet 期望的格式: [1, 3, 224, 224] (NCHW)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // 归一化到 [0, 1]
      const normalizedR = r / 255.0;
      const normalizedG = g / 255.0;
      const normalizedB = b / 255.0;

      // 应用均值和标准差
      const pixelIndex = Math.floor(i / 4);
      inputData[pixelIndex] = (normalizedR - mean[0]) / std[0]; // R
      inputData[targetSize[0] * targetSize[1] + pixelIndex] = (normalizedG - mean[1]) / std[1]; // G
      inputData[2 * targetSize[0] * targetSize[1] + pixelIndex] = (normalizedB - mean[2]) / std[2]; // B
    }

    return inputData;
  }

  /**
   * 执行推理
   */
  async runInference(
    input: Float32Array | HTMLImageElement | HTMLCanvasElement | ImageData,
    topK: number = 5
  ): Promise<InferenceResult> {
    if (!this.session || !this.modelConfig) {
      throw new Error("Model not loaded");
    }

    const startTime = performance.now();

    // 预处理输入
    let inputData: Float32Array;
    if (input instanceof Float32Array) {
      inputData = input;
    } else {
      inputData = this.preprocessImage(
        input,
        [this.modelConfig.inputShape[2], this.modelConfig.inputShape[3]],
        this.modelConfig.mean,
        this.modelConfig.std
      );
    }

    // 创建张量
    const inputShape = this.modelConfig.inputShape;
    const inputTensor = new ort.Tensor("float32", inputData, inputShape);

    // 执行推理
    const feeds: Record<string, ort.Tensor> = {};
    const inputName = this.session.inputNames[0];
    feeds[inputName] = inputTensor;

    const results = await this.session.run(feeds);
    const inferenceTime = performance.now() - startTime;

    // 更新性能统计
    this.inferenceCount++;
    this.totalInferenceTime += inferenceTime;

    // 处理输出
    const outputName = this.session.outputNames[0];
    const output = results[outputName];
    const outputData = output.data as Float32Array;

    // 获取 top-K 预测
    const predictions = this.getTopKPredictions(outputData, topK);

    return {
      predictions,
      inferenceTime,
      provider: this.currentProvider,
      modelName: this.modelConfig.name,
    };
  }

  /**
   * 获取 Top-K 预测结果
   */
  private getTopKPredictions(outputData: Float32Array, topK: number): Array<{
    label: string;
    confidence: number;
    index: number;
  }> {
    // 创建索引数组并排序
    const indexed = Array.from(outputData)
      .map((value, index) => ({ value, index }))
      .sort((a, b) => b.value - a.value)
      .slice(0, topK);

    // 转换为预测结果
    return indexed.map(({ value, index }) => ({
      label: this.modelConfig?.labels?.[index] || `Class ${index}`,
      confidence: this.applySoftmax(value, outputData),
      index,
    }));
  }

  /**
   * 应用 Softmax 归一化
   */
  private applySoftmax(value: number, allValues: Float32Array): number {
    // 计算 softmax
    const max = Math.max(...Array.from(allValues));
    const expValues = Array.from(allValues).map((v) => Math.exp(v - max));
    const sum = expValues.reduce((a, b) => a + b, 0);
    return expValues[value] / sum;
  }

  /**
   * 批量推理
   */
  async runBatchInference(
    inputs: Array<Float32Array | HTMLImageElement | HTMLCanvasElement | ImageData>,
    topK: number = 5
  ): Promise<InferenceResult[]> {
    const results: InferenceResult[] = [];
    for (const input of inputs) {
      const result = await this.runInference(input, topK);
      results.push(result);
    }
    return results;
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const avgInferenceTime = this.inferenceCount > 0 
      ? this.totalInferenceTime / this.inferenceCount 
      : 0;
    
    return {
      provider: this.currentProvider,
      avgInferenceTime,
      minInferenceTime: 0, // 需要单独跟踪
      maxInferenceTime: 0, // 需要单独跟踪
      throughput: avgInferenceTime > 0 ? 1000 / avgInferenceTime : 0,
    };
  }

  /**
   * 切换执行提供者
   */
  async switchProvider(provider: ExecutionProvider): Promise<boolean> {
    if (!this.modelConfig) {
      throw new Error("No model loaded");
    }

    try {
      // 验证提供者支持
      if (provider === "webgpu" && !(await this.isWebGPUSupported())) {
        return false;
      }
      if (provider === "webgl" && !(await this.isWebGLSupported())) {
        return false;
      }
      if (provider === "webnn" && !(await this.isWebNNSupported())) {
        return false;
      }

      // 重新加载模型
      await this.loadModel(this.modelConfig, provider);
      return true;
    } catch (error) {
      console.error(`Failed to switch to provider ${provider}:`, error);
      return false;
    }
  }

  /**
   * 获取可用的执行提供者
   */
  async getAvailableProviders(): Promise<ExecutionProvider[]> {
    const providers: ExecutionProvider[] = ["wasm", "cpu"];

    if (await this.isWebGLSupported()) {
      providers.push("webgl");
    }
    if (await this.isWebGPUSupported()) {
      providers.push("webgpu");
    }
    if (await this.isWebNNSupported()) {
      providers.push("webnn");
    }

    return providers;
  }

  /**
   * 清理资源
   */
  dispose(): void {
    if (this.session) {
      this.session.release();
      this.session = null;
    }
    this.modelConfig = null;
    this.performanceHistory = [];
    this.inferenceCount = 0;
    this.totalInferenceTime = 0;
  }
}

// 导出单例实例
export const onnxRuntimeManager = new ONNXRuntimeManager();

