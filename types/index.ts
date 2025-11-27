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
  value: number; // Primary metric (follows normal distribution)
  category: string; // Legacy field for backward compatibility
  timestamp: number;
  // Multi-level category identifiers
  mainCategory: string; // Level 1: Main category (e.g., "Technology", "Finance", "Healthcare")
  subCategory: string; // Level 2: Sub category (e.g., "Software", "Banking", "Pharmaceuticals")
  categoryLevel3?: string; // Level 3: Detailed category (e.g., "Cloud Services", "Investment", "Research")
  categoryLevel4?: string; // Level 4: Specific category (e.g., "AWS", "Stocks", "Clinical Trials")
  // Additional realistic fields
  region: string; // Geographic region
  status: "active" | "pending" | "completed" | "failed";
  priority: number; // 1-5 priority level
  quality: number; // 0-100 quality score (normal distribution)
  cost: number; // Cost in currency (correlated with value)
  revenue: number; // Revenue in currency (correlated with value and quality)
  duration: number; // Duration in seconds (normal distribution)
  errorRate: number; // Error rate percentage (0-100, normal distribution)
  throughput: number; // Throughput metric (correlated with value)
  efficiency: number; // Efficiency score 0-100 (normal distribution)
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

