"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AIChatMessage } from "@/types";

interface AIAgentChatInterfaceProps {
  messages: AIChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isGenerating: boolean;
  model: "gemini" | "gpt";
  onClearChat: () => void;
  isMobile: boolean;
}

export default function AIAgentChatInterface({
  messages,
  onSendMessage,
  isGenerating,
  model,
  onClearChat,
  isMobile,
}: AIAgentChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "end"
    });
  }, [messages, prefersReducedMotion]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isGenerating) return;

    const message = input.trim();
    setInput("");
    await onSendMessage(message);
  }, [input, isGenerating, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const modelName = model === "gemini" ? "Google Gemini" : "OpenAI GPT";
  const modelColor = model === "gemini" ? "is-primary" : "is-success";

  return (
    <div className="box">
      <div className="level mb-4">
        <div className="level-left">
          <div className="level-item">
            <h3 className={`title is-5 ${modelColor}`}>
              <span className="icon" aria-hidden="true">
                <i className={`fas fa-${model === "gemini" ? "brain" : "robot"}`}></i>
              </span>
              <span>{modelName}</span>
            </h3>
          </div>
        </div>
        <div className="level-right">
          <div className="level-item">
            <button
              className="button is-small is-light"
              onClick={onClearChat}
              disabled={messages.length === 0}
              aria-label={`Clear ${modelName} chat history`}
            >
              <span className="icon is-small" aria-hidden="true">
                <i className="fas fa-trash"></i>
              </span>
              {!isMobile && <span>Clear</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        className="box"
        style={{
          height: isMobile ? "300px" : "500px",
          overflowY: "auto",
          backgroundColor: "#f5f5f5",
        }}
        role="log"
        aria-live="polite"
        aria-label={`${modelName} chat messages`}
      >
        {messages.length === 0 ? (
          <div className="has-text-centered has-text-grey">
            <p className="mb-4">Start a conversation with {modelName}</p>
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
                  className={`message ${message.role === "user" ? modelColor : "is-info"}`}
                  style={{
                    maxWidth: isMobile ? "90%" : "80%",
                    marginLeft: message.role === "user" ? "auto" : "0",
                    marginRight: message.role === "user" ? "0" : "auto",
                  }}
                >
                  <div className="message-header">
                    <span aria-label={`Message from ${message.role === "user" ? "you" : modelName}`}>
                      {message.role === "user" ? "You" : modelName}
                    </span>
                  </div>
                  <div className="message-body">
                    <p 
                      className="is-size-6" 
                      style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                    >
                      {message.content}
                    </p>
                    <p className="is-size-7 has-text-grey mt-2" aria-label={`Message timestamp: ${new Date(message.timestamp).toLocaleString()}`}>
                      <time dateTime={new Date(message.timestamp).toISOString()}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </time>
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            {isGenerating && (
              <div className="has-text-centered" role="status" aria-live="polite">
                <span className="loader" aria-hidden="true"></span>
                <p className="is-size-7 has-text-grey mt-2">Generating response...</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="field mt-4">
        <label className="label is-sr-only" htmlFor={`chat-input-${model}`}>
          Chat input for {modelName}
        </label>
        <div className="control">
          <textarea
            id={`chat-input-${model}`}
            ref={textareaRef}
            className="textarea"
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Type your message to ${modelName}... (Press Enter to send, Shift+Enter for new line)`}
            disabled={isGenerating}
            aria-label={`Chat input for ${modelName}`}
            aria-describedby={`chat-help-${model}`}
          />
        </div>
        <div className="field is-grouped mt-2">
          <div className="control">
            <button
              className={`button ${modelColor}`}
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              aria-label={`Send message to ${modelName}`}
              aria-describedby={isGenerating ? `generating-status-${model}` : undefined}
            >
              <span className="icon" aria-hidden="true">
                <i className="fas fa-paper-plane"></i>
              </span>
              <span>Send</span>
            </button>
            {isGenerating && (
              <span id={`generating-status-${model}`} className="is-sr-only">
                Generating response, please wait
              </span>
            )}
          </div>
          <div className="control">
            <button
              className="button is-light"
              onClick={onClearChat}
              disabled={messages.length === 0}
              aria-label={`Clear ${modelName} chat`}
            >
              Clear Chat
            </button>
          </div>
        </div>
        <p className="help" id={`chat-help-${model}`}>
          {messages.length > 0 && (
            <>
              <span className="icon is-small" aria-hidden="true">
                <i className="fas fa-info-circle"></i>
              </span>
              Conversation context: {messages.length} messages
            </>
          )}
          {messages.length === 0 && (
            <>
              <span className="icon is-small" aria-hidden="true">
                <i className="fas fa-keyboard"></i>
              </span>
              Press Enter to send, Shift+Enter for new line
            </>
          )}
        </p>
      </div>
    </div>
  );
}

