"use client";

/**
 * Global AI Agent Component
 * Floating button and chat interface accessible from anywhere in the app
 * Uses ONLY Bulma CSS classes - no inline styles except for dynamic calculations
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
      {/* Floating Action Button - Using Bulma classes with minimal inline styles for positioning */}
      <motion.button
        className={`button is-primary is-rounded ${isMobile ? "" : "is-large"}`}
        style={{
          position: "fixed",
          bottom: isMobile ? "16px" : "24px",
          right: isMobile ? "16px" : "24px",
          zIndex: 1000,
          width: isMobile ? "56px" : "64px",
          height: isMobile ? "56px" : "64px",
          borderRadius: "50%",
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
          <>
            {/* Backdrop */}
            <motion.div
              className="is-overlay"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                zIndex: 998,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleAgent}
              aria-hidden="true"
            />
            
            {/* Chat Dialog */}
            <motion.div
              className={`box ${isMobile ? "is-mobile" : ""} is-flex is-flex-direction-column`}
              style={{
                position: "fixed",
                bottom: isMobile ? "80px" : "100px",
                right: isMobile ? "16px" : "24px",
                width: isMobile ? "calc(100vw - 32px)" : "420px",
                maxWidth: isMobile ? "calc(100vw - 32px)" : "420px",
                maxHeight: "calc(100vh - 120px)",
                zIndex: 999,
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
                    <h3 className="title is-5 mb-0">
                      <span className="icon mr-2">
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
                      {!isMobile && <span className="ml-1">Clear</span>}
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
              className="box has-background-light mb-4"
              style={{
                flex: 1,
                overflowY: "auto",
                minHeight: isMobile ? "250px" : "350px",
                maxHeight: isMobile ? "400px" : "500px",
              }}
              role="log"
              aria-live="polite"
              aria-label="Chat messages"
            >
              {messages.length === 0 ? (
                <div className="has-text-centered has-text-grey py-6">
                  <span className="icon is-large mb-4">
                    <i className="fas fa-comments"></i>
                  </span>
                  <p className="mb-2">Start a conversation with your AI assistant</p>
                  <p className="is-size-7">I can help you navigate and interact with this app</p>
                </div>
              ) : (
                <div className="content">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`mb-3 ${message.role === "user" ? "has-text-right" : ""}`}
                    >
                      <div
                        className={`message ${message.role === "user" ? "is-primary" : "is-info"}`}
                        style={{
                          maxWidth: isMobile ? "90%" : "85%",
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
                            className="is-size-6 mb-2"
                            style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                          >
                            {message.content}
                          </p>
                          <p className="is-size-7 has-text-grey">
                            <time dateTime={new Date(message.timestamp).toISOString()}>
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </time>
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {isProcessing && (
                    <div className="has-text-centered py-4" role="status" aria-live="polite">
                      <span className="loader"></span>
                      <p className="is-size-7 has-text-grey mt-2">Thinking...</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="field">
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
              <div className={`field ${isMobile ? "is-grouped-multiline" : "is-grouped"} mt-2`}>
                <div className="control">
                  <button
                    className={`button is-primary ${isMobile ? "is-fullwidth" : ""}`}
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
          </>
        )}
      </AnimatePresence>
    </>
  );
}

