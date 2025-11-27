"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { InferenceResult } from "@/lib/onnx/model-manager";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface LLMChatInterfaceProps {
  onSendMessage: (message: string, conversationHistory: Message[]) => Promise<InferenceResult>;
  isModelLoaded: boolean;
}

export default function LLMChatInterface({
  onSendMessage,
  isModelLoaded,
}: LLMChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
  }, [messages, prefersReducedMotion]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !isModelLoaded || isGenerating) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsGenerating(true);

    try {
      // Convert messages to the format expected by the model manager
      // The onSendMessage expects Message[] but model manager only needs role and content
      const result = await onSendMessage(userMessage.content, updatedMessages);
      
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: result.text || "No response generated",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to generate response:", error);
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to generate response"}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  }, [input, isModelLoaded, isGenerating, messages, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    if (confirm("Clear chat history?")) {
      setMessages([]);
    }
  };

  return (
    <div className="box">
      <div className="level mb-4">
        <div className="level-left">
          <div className="level-item">
            <h3 className="title is-5">Chat Interface</h3>
          </div>
        </div>
        <div className="level-right">
          <div className="level-item">
            <button
              className="button is-small is-light"
              onClick={clearChat}
              disabled={messages.length === 0}
              aria-label="Clear chat history"
            >
              <span className="icon is-small">
                <i className="fas fa-trash"></i>
              </span>
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        className="box"
        style={{
          height: "400px",
          overflowY: "auto",
          backgroundColor: "#f5f5f5",
        }}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div className="has-text-centered has-text-grey">
            <p className="mb-4">Start a conversation with the AI model</p>
            <p className="is-size-7">
              The model will remember the conversation context
            </p>
          </div>
        ) : (
          <div className="content">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`mb-4 ${message.role === "user" ? "has-text-right" : ""}`}
              >
                <div
                  className={`message ${message.role === "user" ? "is-primary" : "is-info"}`}
                  style={{
                    maxWidth: "80%",
                    marginLeft: message.role === "user" ? "auto" : "0",
                    marginRight: message.role === "user" ? "0" : "auto",
                  }}
                >
                  <div className="message-header">
                    <span>{message.role === "user" ? "You" : "Assistant"}</span>
                  </div>
                  <div className="message-body">
                    <p className="is-size-6" style={{ whiteSpace: "pre-wrap" }}>
                      {message.content}
                    </p>
                    <p className="is-size-7 has-text-grey mt-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            {isGenerating && (
              <div className="has-text-centered">
                <span className="loader"></span>
                <p className="is-size-7 has-text-grey mt-2">Generating response...</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="field mt-4">
        <div className="control">
          <textarea
            ref={textareaRef}
            className="textarea"
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            disabled={!isModelLoaded || isGenerating}
            aria-label="Chat input"
          />
        </div>
        <div className="field is-grouped mt-2">
          <div className="control">
            <button
              className="button is-primary"
              onClick={handleSend}
              disabled={!input.trim() || !isModelLoaded || isGenerating}
              aria-label="Send message"
            >
              <span className="icon">
                <i className="fas fa-paper-plane"></i>
              </span>
              <span>Send</span>
            </button>
          </div>
          <div className="control">
            <button
              className="button is-light"
              onClick={clearChat}
              disabled={messages.length === 0}
              aria-label="Clear chat"
            >
              Clear Chat
            </button>
          </div>
        </div>
        <p className="help">
          {messages.length > 0 && (
            <>
              <span className="icon is-small">
                <i className="fas fa-info-circle"></i>
              </span>
              Conversation context: {messages.length} messages
            </>
          )}
        </p>
      </div>
    </div>
  );
}

