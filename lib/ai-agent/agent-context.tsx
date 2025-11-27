"use client";

/**
 * AI Agent Context Provider
 * Provides global AI Agent functionality throughout the app
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { agentService, AgentCommand, PageContext } from "./agent-service";
import { AIChatMessage } from "@/types";

interface AgentContextType {
  messages: AIChatMessage[];
  isOpen: boolean;
  isProcessing: boolean;
  openAgent: () => void;
  closeAgent: () => void;
  toggleAgent: () => void;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  currentContext: PageContext | null;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function useAgent() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error("useAgent must be used within AgentProvider");
  }
  return context;
}

interface AgentProviderProps {
  children: React.ReactNode;
}

export function AgentProvider({ children }: AgentProviderProps) {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentContext, setCurrentContext] = useState<PageContext | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update context when pathname changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const context = agentService.getPageContext(pathname);
      setCurrentContext(context);
    }
  }, [pathname]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: AIChatMessage = {
        id: `msg-${Date.now()}-system`,
        role: "assistant",
        content: "Hello! I'm your AI assistant. I can help you navigate and interact with this web application. What would you like to do?",
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const openAgent = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeAgent = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleAgent = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    const welcomeMessage: AIChatMessage = {
      id: `msg-${Date.now()}-system`,
      role: "assistant",
      content: "Hello! I'm your AI assistant. I can help you navigate and interact with this web application. What would you like to do?",
      timestamp: Date.now(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isProcessing) return;

    // Add user message
    const userMessage: AIChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: message.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // First, try to parse intent and execute command
      const intent = agentService.parseIntent(message);
      
      if (intent) {
        // Execute command directly
        try {
          const result = await agentService.executeCommand(intent);
          
          let responseContent = "";
          switch (intent.type) {
            case "navigate":
              responseContent = `Navigating to ${intent.path}...`;
              // Use Next.js router for client-side navigation
              router.push(intent.path);
              break;
            case "toggleTheme":
              responseContent = "Toggling theme...";
              // Trigger theme toggle
              const themeToggle = document.querySelector('[aria-label*="theme" i], [aria-label*="dark" i], [aria-label*="light" i]') as HTMLElement;
              if (themeToggle) {
                themeToggle.click();
              }
              break;
            case "getPageContext":
              responseContent = `Current page: ${currentContext?.title || pathname}\n\nAvailable actions:\n${currentContext?.availableActions.map(a => `- ${a.description}`).join("\n") || "No specific actions available"}`;
              break;
            case "getAvailableActions":
              const actions = agentService.getPageContext(pathname)?.availableActions || [];
              responseContent = `Available actions on this page:\n${actions.map(a => `- ${a.description}`).join("\n")}`;
              break;
            case "help":
              responseContent = agentService.executeCommand({ type: "help" }) as string;
              break;
            default:
              responseContent = `Executed: ${intent.type}`;
          }

          const assistantMessage: AIChatMessage = {
            id: `msg-${Date.now()}-assistant`,
            role: "assistant",
            content: responseContent,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
          const errorMessage: AIChatMessage = {
            id: `msg-${Date.now()}-error`,
            role: "assistant",
            content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}`,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } else {
        // If no direct intent, use AI API for natural language understanding
        const response = await fetch("/api/ai-agent/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            context: {
              pathname,
              pageContext: currentContext,
              availableActions: currentContext?.availableActions || [],
            },
            stream: false,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        const assistantMessage: AIChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          content: data.response || "I'm sorry, I couldn't process that request.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        return; // Request was cancelled
      }
      
      const errorMessage: AIChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, [isProcessing, pathname, currentContext, router]);

  return (
    <AgentContext.Provider
      value={{
        messages,
        isOpen,
        isProcessing,
        openAgent,
        closeAgent,
        toggleAgent,
        sendMessage,
        clearMessages,
        currentContext,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

