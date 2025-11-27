"use client";

/**
 * Global AI Agent Component
 * Floating button and chat interface accessible from anywhere in the app
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAgent } from "@/lib/ai-agent/agent-context";
import { AIChatMessage } from "@/types";

export default function GlobalAgent() {
  const {
    messages,
    isOpen,
    isProcessing,
    toggleAgent,
    sendMessage,
    clearMessages,
    currentContext,
  } = useAgent();

  const [input, setInput] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

export default function GlobalAgent() {
  const {
    messages,
    isOpen,
    isProcessing,
    toggleAgent,
    sendMessage,
    clearMessages,
    currentContext,
  } = useAgent();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "end",
      });
    }
  }, [messages, isOpen, prefersReducedMotion]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isProcessing) return;

    const message = input.trim();
    setInput("");
    await sendMessage(message);
  }, [input, isProcessing, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        className="button is-primary is-rounded"
        style={{
          position: "fixed",
          bottom: isMobile ? "16px" : "24px",
          right: isMobile ? "16px" : "24px",
          zIndex: 1000,
          width: isMobile ? "56px" : "64px",
          height: isMobile ? "56px" : "64px",
          borderRadius: "50%",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
        onClick={toggleAgent}
        aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
        aria-expanded={isOpen}
        whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
        initial={false}
        animate={{
          rotate: isOpen ? 45 : 0,
        }}
        transition={{ duration: 0.2 }}
      >
        <span className={`icon ${isMobile ? "" : "is-large"}`}>
          <i className={`fas ${isOpen ? "fa-times" : "fa-robot"}`}></i>
        </span>
      </motion.button>

      {/* Chat Interface */}
      <AnimatePresence>
        {isOpen && (
            <motion.div
              className="box"
              style={{
                position: "fixed",
                bottom: isMobile ? "80px" : "100px",
                right: isMobile ? "16px" : "24px",
                width: isMobile ? "calc(100vw - 32px)" : "400px",
                maxWidth: "calc(100vw - 32px)",
                maxHeight: "calc(100vh - 120px)",
                zIndex: 999,
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
              }}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            ref={chatContainerRef}
            role="dialog"
            aria-label="AI Assistant Chat"
            aria-modal="true"
          >
            {/* Header */}
            <div className="level mb-4">
              <div className="level-left">
                <div className="level-item">
                  <h3 className="title is-5">
                    <span className="icon">
                      <i className="fas fa-robot"></i>
                    </span>
                    <span>AI Assistant</span>
                  </h3>
                </div>
              </div>
              <div className="level-right">
                <div className="level-item">
                  <button
                    className="button is-small is-light"
                    onClick={clearMessages}
                    disabled={messages.length <= 1}
                    aria-label="Clear chat history"
                  >
                    <span className="icon is-small">
                      <i className="fas fa-trash"></i>
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Current Context Info */}
            {currentContext && (
              <div className="notification is-info is-light is-small mb-4">
                <p className="is-size-7">
                  <strong>Current page:</strong> {currentContext.title || currentContext.pathname}
                </p>
              </div>
            )}

            {/* Messages Area */}
            <div
              className="box"
              style={{
                flex: 1,
                overflowY: "auto",
                backgroundColor: "#f5f5f5",
                minHeight: "300px",
                maxHeight: "400px",
              }}
              role="log"
              aria-live="polite"
              aria-label="Chat messages"
            >
              {messages.length === 0 ? (
                <div className="has-text-centered has-text-grey">
                  <p className="mb-4">Start a conversation with your AI assistant</p>
                </div>
              ) : (
                <div className="content">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`mb-4 ${message.role === "user" ? "has-text-right" : ""}`}
                    >
                      <div
                        className={`message ${message.role === "user" ? "is-primary" : "is-info"}`}
                        style={{
                          maxWidth: "85%",
                          marginLeft: message.role === "user" ? "auto" : "0",
                          marginRight: message.role === "user" ? "0" : "auto",
                        }}
                      >
                        <div className="message-header">
                          <span>
                            {message.role === "user" ? "You" : "Assistant"}
                          </span>
                        </div>
                        <div className="message-body">
                          <p
                            className="is-size-6"
                            style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                          >
                            {message.content}
                          </p>
                          <p className="is-size-7 has-text-grey mt-2">
                            <time dateTime={new Date(message.timestamp).toISOString()}>
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </time>
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {isProcessing && (
                    <div className="has-text-centered" role="status" aria-live="polite">
                      <span className="loader"></span>
                      <p className="is-size-7 has-text-grey mt-2">Thinking...</p>
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
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything... (Press Enter to send, Shift+Enter for new line)"
                  disabled={isProcessing}
                  aria-label="Chat input"
                />
              </div>
              <div className="field is-grouped mt-2">
                <div className="control">
                  <button
                    className="button is-primary"
                    onClick={handleSend}
                    disabled={!input.trim() || isProcessing}
                    aria-label="Send message"
                  >
                    <span className="icon">
                      <i className="fas fa-paper-plane"></i>
                    </span>
                    <span>Send</span>
                  </button>
                </div>
              </div>
              <p className="help">
                <span className="icon is-small">
                  <i className="fas fa-info-circle"></i>
                </span>
                I can help you navigate, interact with demos, and answer questions about this app.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

