/**
 * Hardware Detection and Model Recommendation
 * Detects GPU, memory, and recommends appropriate models
 */

export interface HardwareInfo {
  gpu: {
    available: boolean;
    name?: string;
    vendor?: string;
    memory?: number; // in MB
    type: "webgpu" | "webgl" | "none";
  };
  memory: {
    total: number; // in GB
    available: number; // in GB
  };
  cpu: {
    cores: number;
  };
  recommendedModelSize: "small" | "medium" | "large" | "xlarge";
}

export class HardwareDetector {
  /**
   * Detect hardware capabilities
   */
  async detectHardware(): Promise<HardwareInfo> {
    const gpu = await this.detectGPU();
    const memory = this.detectMemory();
    const cpu = this.detectCPU();

    // Determine recommended model size based on hardware
    const recommendedModelSize = this.getRecommendedModelSize(gpu, memory);

    return {
      gpu,
      memory,
      cpu,
      recommendedModelSize,
    };
  }

  /**
   * Detect GPU capabilities
   */
  private async detectGPU(): Promise<HardwareInfo["gpu"]> {
    // Check WebGPU support
    if (navigator.gpu) {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) {
          // requestAdapterInfo is experimental and may not be available
          let info: GPUAdapterInfo | null = null;
          try {
            info = await (adapter as any).requestAdapterInfo?.();
          } catch (e) {
            // requestAdapterInfo not available
          }

          const memory = adapter.limits?.maxBufferSize
            ? Math.round(adapter.limits.maxBufferSize / (1024 * 1024))
            : undefined;

          return {
            available: true,
            name: info?.description || "Unknown GPU",
            vendor: info?.vendor || "Unknown",
            memory,
            type: "webgpu",
          };
        }
      } catch (error) {
        console.warn("WebGPU detection failed:", error);
      }
    }

    // Check WebGL support as fallback
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : "Unknown";
      const vendor = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        : "Unknown";

      return {
        available: true,
        name: renderer,
        vendor: vendor,
        type: "webgl",
      };
    }

    return {
      available: false,
      type: "none",
    };
  }

  /**
   * Detect memory capabilities
   */
  private detectMemory(): HardwareInfo["memory"] {
    // @ts-ignore - navigator.deviceMemory is experimental
    const deviceMemory = navigator.deviceMemory || 4; // Default to 4GB if not available

    // @ts-ignore - performance.memory is Chrome-specific
    const jsHeapSizeLimit = (performance as any).memory?.jsHeapSizeLimit
      ? Math.round((performance as any).memory.jsHeapSizeLimit / (1024 * 1024 * 1024))
      : deviceMemory;

    return {
      total: deviceMemory,
      available: jsHeapSizeLimit,
    };
  }

  /**
   * Detect CPU capabilities
   */
  private detectCPU(): HardwareInfo["cpu"] {
    return {
      cores: navigator.hardwareConcurrency || 4,
    };
  }

  /**
   * Get recommended model size based on hardware
   */
  private getRecommendedModelSize(
    gpu: HardwareInfo["gpu"],
    memory: HardwareInfo["memory"]
  ): "small" | "medium" | "large" | "xlarge" {
    // High-end GPU (RTX 5090, 32GB RAM)
    if (gpu.available && gpu.type === "webgpu" && memory.total >= 16) {
      // Check if it's a high-end GPU
      const gpuName = gpu.name?.toLowerCase() || "";
      if (
        gpuName.includes("rtx 5090") ||
        gpuName.includes("rtx 4090") ||
        gpuName.includes("rtx 3090") ||
        gpuName.includes("a100") ||
        gpuName.includes("h100") ||
        memory.total >= 32
      ) {
        return "xlarge"; // Can handle 7B+ models
      }
      return "large"; // Can handle 3B-7B models
    }

    // Medium GPU with decent memory
    if (gpu.available && memory.total >= 8) {
      return "medium"; // Can handle 1B-3B models
    }

    // Low-end or no GPU
    return "small"; // Can handle <1B models
  }

  /**
   * Get model size category from model metadata
   */
  getModelSizeCategory(modelSize: string): "small" | "medium" | "large" | "xlarge" {
    const sizeStr = modelSize.toLowerCase();
    if (sizeStr.includes("gb")) {
      const size = parseFloat(sizeStr);
      if (size >= 7) return "xlarge";
      if (size >= 3) return "large";
      if (size >= 1) return "medium";
      return "small";
    }
    if (sizeStr.includes("mb")) {
      const size = parseFloat(sizeStr);
      if (size >= 3000) return "large";
      if (size >= 1000) return "medium";
      return "small";
    }
    return "small";
  }
}

export const hardwareDetector = new HardwareDetector();

