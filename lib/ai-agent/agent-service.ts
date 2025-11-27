/**
 * Global AI Agent Service
 * Enables AI Agent to interact with the entire web application
 * like a real user - navigation, actions, context awareness
 */

import { AIChatMessage } from "@/types";

export type AgentCommand = 
  | { type: "navigate"; path: string }
  | { type: "loadModel"; modelId: string }
  | { type: "runInference"; input: string | File }
  | { type: "toggleTheme" }
  | { type: "scrollTo"; elementId: string }
  | { type: "click"; elementId: string }
  | { type: "getPageContext" }
  | { type: "getAvailableActions" }
  | { type: "help" };

export interface AgentAction {
  command: AgentCommand;
  description: string;
  parameters?: Record<string, any>;
}

export interface PageContext {
  pathname: string;
  title: string;
  availableActions: AgentAction[];
  pageContent?: string;
  interactiveElements?: Array<{
    id: string;
    type: string;
    label: string;
    action?: string;
  }>;
}

export class AgentService {
  private static instance: AgentService;
  private contextCallbacks: Map<string, () => PageContext> = new Map();
  private actionCallbacks: Map<string, (params: any) => Promise<any>> = new Map();

  private constructor() {}

  static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService();
    }
    return AgentService.instance;
  }

  /**
   * Register page context provider
   */
  registerPageContext(pathname: string, provider: () => PageContext): void {
    this.contextCallbacks.set(pathname, provider);
  }

  /**
   * Register action handler
   */
  registerAction(actionType: string, handler: (params: any) => Promise<any>): void {
    this.actionCallbacks.set(actionType, handler);
  }

  /**
   * Get current page context
   */
  getPageContext(pathname: string): PageContext | null {
    const provider = this.contextCallbacks.get(pathname);
    if (provider) {
      return provider();
    }

    // Default context
    return {
      pathname,
      title: document.title,
      availableActions: this.getDefaultActions(pathname),
    };
  }

  /**
   * Execute an agent command
   */
  async executeCommand(command: AgentCommand): Promise<any> {
    switch (command.type) {
      case "navigate":
        return this.navigate(command.path);
      case "loadModel":
        return this.executeAction("loadModel", { modelId: command.modelId });
      case "runInference":
        return this.executeAction("runInference", { input: command.input });
      case "toggleTheme":
        return this.executeAction("toggleTheme", {});
      case "scrollTo":
        return this.scrollToElement(command.elementId);
      case "click":
        return this.clickElement(command.elementId);
      case "getPageContext":
        return this.getPageContext(window.location.pathname);
      case "getAvailableActions":
        return this.getAvailableActions();
      case "help":
        return this.getHelp();
      default:
        throw new Error(`Unknown command: ${(command as any).type}`);
    }
  }

  /**
   * Navigate to a path
   */
  private async navigate(path: string): Promise<void> {
    if (typeof window !== "undefined") {
      window.location.href = path;
    }
  }

  /**
   * Scroll to element
   */
  private scrollToElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  /**
   * Click element
   */
  private clickElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.click();
    }
  }

  /**
   * Execute registered action
   */
  private async executeAction(actionType: string, params: any): Promise<any> {
    const handler = this.actionCallbacks.get(actionType);
    if (handler) {
      return await handler(params);
    }
    throw new Error(`No handler registered for action: ${actionType}`);
  }

  /**
   * Get available actions for current page
   */
  private getAvailableActions(): AgentAction[] {
    const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
    const context = this.getPageContext(pathname);
    return context?.availableActions || [];
  }

  /**
   * Get default actions based on pathname
   */
  private getDefaultActions(pathname: string): AgentAction[] {
    const actions: AgentAction[] = [
      {
        command: { type: "navigate", path: "/" },
        description: "Navigate to homepage",
      },
      {
        command: { type: "navigate", path: "/demos/network-traffic" },
        description: "Navigate to network traffic demo",
      },
      {
        command: { type: "navigate", path: "/demos/big-data" },
        description: "Navigate to big data demo",
      },
      {
        command: { type: "navigate", path: "/demos/onnx-ai" },
        description: "Navigate to ONNX AI demo",
      },
      {
        command: { type: "navigate", path: "/demos/ai-agent" },
        description: "Navigate to AI agent demo",
      },
      {
        command: { type: "navigate", path: "/projects" },
        description: "Navigate to projects page",
      },
      {
        command: { type: "navigate", path: "/skills" },
        description: "Navigate to skills page",
      },
      {
        command: { type: "navigate", path: "/contact" },
        description: "Navigate to contact page",
      },
      {
        command: { type: "toggleTheme" },
        description: "Toggle dark/light theme",
      },
    ];

    // Add page-specific actions
    if (pathname.includes("/demos/onnx-ai")) {
      actions.push(
        {
          command: { type: "loadModel", modelId: "" },
          description: "Load an AI model",
          parameters: { modelId: "string" },
        },
        {
          command: { type: "runInference", input: "" },
          description: "Run inference on input",
          parameters: { input: "string | File" },
        }
      );
    }

    return actions;
  }

  /**
   * Get help information
   */
  private getHelp(): string {
    return `I'm your AI assistant! I can help you navigate and interact with this web application.

Available commands:
- Navigate: "go to homepage", "show me the network traffic demo", "open projects page"
- Actions: "load a model", "run inference", "toggle theme"
- Information: "what can I do here?", "what's on this page?", "help"

I can understand natural language and execute actions on your behalf. Just tell me what you'd like to do!`;
  }

  /**
   * Parse user intent from message
   */
  parseIntent(message: string): AgentCommand | null {
    const lowerMessage = message.toLowerCase().trim();

    // Navigation intents
    if (lowerMessage.includes("home") || lowerMessage.includes("homepage")) {
      return { type: "navigate", path: "/" };
    }
    if (lowerMessage.includes("network traffic") || lowerMessage.includes("traffic")) {
      return { type: "navigate", path: "/demos/network-traffic" };
    }
    if (lowerMessage.includes("big data") || lowerMessage.includes("data")) {
      return { type: "navigate", path: "/demos/big-data" };
    }
    if (lowerMessage.includes("onnx") || lowerMessage.includes("ai model") || lowerMessage.includes("model")) {
      return { type: "navigate", path: "/demos/onnx-ai" };
    }
    if (lowerMessage.includes("ai agent") || lowerMessage.includes("agent")) {
      return { type: "navigate", path: "/demos/ai-agent" };
    }
    if (lowerMessage.includes("project")) {
      return { type: "navigate", path: "/projects" };
    }
    if (lowerMessage.includes("skill")) {
      return { type: "navigate", path: "/skills" };
    }
    if (lowerMessage.includes("contact")) {
      return { type: "navigate", path: "/contact" };
    }

    // Action intents
    if (lowerMessage.includes("theme") || lowerMessage.includes("dark") || lowerMessage.includes("light")) {
      return { type: "toggleTheme" };
    }
    if (lowerMessage.includes("load") && (lowerMessage.includes("model") || lowerMessage.includes("ai"))) {
      // Try to extract model ID if mentioned
      const modelMatch = lowerMessage.match(/(?:model|id)[\s:]+([a-z0-9-]+)/i);
      if (modelMatch) {
        return { type: "loadModel", modelId: modelMatch[1] };
      }
      return { type: "loadModel", modelId: "" };
    }
    if (lowerMessage.includes("run") && (lowerMessage.includes("inference") || lowerMessage.includes("predict"))) {
      // Try to extract input if mentioned
      const inputMatch = lowerMessage.match(/(?:on|with|input)[\s:]+(.+)/i);
      if (inputMatch) {
        return { type: "runInference", input: inputMatch[1].trim() };
      }
      return { type: "runInference", input: "" };
    }
    if (lowerMessage.includes("help") || lowerMessage.includes("what can")) {
      return { type: "help" };
    }
    if (lowerMessage.includes("context") || lowerMessage.includes("page") || lowerMessage.includes("what's here") || lowerMessage.includes("where am i")) {
      return { type: "getPageContext" };
    }
    if (lowerMessage.includes("action") || lowerMessage.includes("can i do") || lowerMessage.includes("what can you do")) {
      return { type: "getAvailableActions" };
    }

    return null;
  }
}

export const agentService = AgentService.getInstance();

