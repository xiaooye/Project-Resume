"use client";

/**
 * Global AI Agent Component
 * Eye-friendly Apple Liquid Glass Style
 * Standalone attachment - no backdrop, click outside won't close
 * Uses ONLY Bulma CSS classes with liquid-glass styles
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
      const newHeight = Math.min(textareaRef.current.scrollHeight, 100);
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
      {/* Floating Action Button - Liquid Glass Style */}
      <motion.button
        className="button is-primary is-rounded liquid-glass-button"
        style={{
          position: "fixed",
          bottom: isMobile ? "16px" : "20px",
          right: isMobile ? "16px" : "20px",
          zIndex: 1000,
          width: isMobile ? "48px" : "52px",
          height: isMobile ? "48px" : "52px",
          borderRadius: "50%",
        }}
        onClick={toggleAgent}
        aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
        aria-expanded={isOpen}
        whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
        initial={false}
        animate={{
          rotate: isOpen ? 45 : 0,
        }}
        transition={{ duration: 0.2 }}
      >
        <span className="icon">
          <i className={`fas ${isOpen ? "fa-times" : "fa-robot"}`}></i>
        </span>
      </motion.button>

      {/* Chat Interface - Liquid Glass Style, No Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="liquid-glass-card is-flex is-flex-direction-column"
            style={{
              position: "fixed",
              bottom: isMobile ? "70px" : "80px",
              right: isMobile ? "12px" : "20px",
              width: isMobile ? "calc(100vw - 24px)" : "360px",
              maxWidth: isMobile ? "calc(100vw - 24px)" : "360px",
              maxHeight: "calc(100vh - 100px)",
              zIndex: 999,
              padding: isMobile ? "0.75rem" : "1rem",
            }}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            ref={chatContainerRef}
            role="dialog"
            aria-label="AI Assistant Chat"
            aria-modal="false"
          >
            {/* Header - Compact, Liquid Glass Text */}
            <div className="level mb-2">
              <div className="level-left">
                <div className="level-item">
                  <h4 className="title is-6 mb-0 liquid-glass-text">
                    <span className="icon mr-1">
                      <i className="fas fa-robot"></i>
                    </span>
                    <span>AI Assistant</span>
                  </h4>
                </div>
              </div>
              <div className="level-right">
                <div className="level-item">
                  <button
                    className="button is-small is-text"
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

            {/* Current Context Info - Liquid Glass Style */}
            {currentContext && (
              <div className="notification is-info is-small mb-2 py-2 px-3 liquid-glass">
                <p className="is-size-7 mb-0 liquid-glass-text">
                  <strong>Page:</strong> {currentContext.title || currentContext.pathname}
                </p>
              </div>
            )}

            {/* Messages Area - Clean Liquid Glass Background */}
            <div
              className="mb-2"
              style={{
                flex: 1,
                overflowY: "auto",
                minHeight: isMobile ? "200px" : "280px",
                maxHeight: isMobile ? "320px" : "400px",
                padding: "0.5rem",
              }}
              role="log"
              aria-live="polite"
              aria-label="Chat messages"
            >
              {messages.length === 0 ? (
                <div className="has-text-centered py-4">
                  <span className="icon mb-2 liquid-glass-text">
                    <i className="fas fa-comments"></i>
                  </span>
                  <p className="is-size-7 mb-1 liquid-glass-text">Start a conversation</p>
                  <p className="is-size-7 liquid-glass-text">I can help you navigate and interact</p>
                </div>
              ) : (
                <div className="content is-small">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={prefersReducedMotion ? {} : { opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`mb-3 ${message.role === "user" ? "has-text-right" : ""}`}
                    >
                      <div
                        className="liquid-glass"
                        style={{
                          maxWidth: isMobile ? "92%" : "88%",
                          marginLeft: message.role === "user" ? "auto" : "0",
                          marginRight: message.role === "user" ? "0" : "auto",
                          padding: "0.75rem 1rem",
                          borderRadius: "16px",
                          background: message.role === "user" 
                            ? "rgba(99, 102, 241, 0.15)" 
                            : "rgba(59, 130, 246, 0.15)",
                          border: message.role === "user"
                            ? "1px solid rgba(99, 102, 241, 0.25)"
                            : "1px solid rgba(59, 130, 246, 0.25)",
                        }}
                      >
                        <div className="level is-mobile mb-1">
                          <div className="level-left">
                            <div className="level-item">
                              <span className={`is-size-7 has-text-weight-semibold ${message.role === "user" ? "has-text-primary" : "has-text-info"}`}>
                                {message.role === "user" ? "You" : "Assistant"}
                              </span>
                            </div>
                          </div>
                          <div className="level-right">
                            <div className="level-item">
                              <time 
                                className="is-size-7 has-text-grey"
                                dateTime={new Date(message.timestamp).toISOString()}
                              >
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </time>
                            </div>
                          </div>
                        </div>
                        <p
                          className="is-size-7 mb-0 liquid-glass-text"
                          style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                        >
                          {message.content}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {isProcessing && (
                    <div className="has-text-centered py-2" role="status" aria-live="polite">
                      <span className="loader is-small"></span>
                      <p className="is-size-7 has-text-grey mt-1">Thinking...</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area - Liquid Glass Style */}
            <div className="field mb-0">
              <div className="control">
                <textarea
                  ref={textareaRef}
                  className="textarea is-small liquid-glass"
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  disabled={isProcessing}
                  aria-label="Chat input"
                />
              </div>
              <div className={`field ${isMobile ? "is-grouped-multiline" : "is-grouped"} mt-1 mb-0`}>
                <div className="control">
                  <button
                    className={`button is-primary is-small liquid-glass-button ${isMobile ? "is-fullwidth" : ""}`}
                    onClick={handleSend}
                    disabled={!input.trim() || isProcessing}
                    aria-label="Send message"
                  >
                    <span className="icon is-small">
                      <i className="fas fa-paper-plane"></i>
                    </span>
                    <span>Send</span>
                  </button>
                </div>
              </div>
              <p className="help is-size-7 mt-1 mb-0 liquid-glass-text">
                <span className="icon is-small">
                  <i className="fas fa-info-circle"></i>
                </span>
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
