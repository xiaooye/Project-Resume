export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  demoUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface Skill {
  name: string;
  level: number; // 0-100
  category: string;
  yearsOfExperience: number;
}

export interface NetworkTrafficData {
  timestamp: number;
  serverId: string;
  region?: string;
  requests: number;
  latency: number;
  throughput: number;
  errorRate: number;
  connections?: number;
  isDown?: boolean; // For server down simulation
}

export interface SimulationScenario {
  type: "normal" | "traffic-spike" | "server-down" | "region-outage" | "ddos";
  enabled: boolean;
  affectedServers?: string[]; // Server IDs affected
  trafficMultiplier?: number; // For traffic spike
  duration?: number; // Duration in seconds
}

export interface BigDataItem {
  id: string;
  name: string;
  value: number;
  category: string;
  timestamp: number;
}

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  model?: "gemini" | "gpt";
}

export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

