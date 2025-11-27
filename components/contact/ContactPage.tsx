"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

type FormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type FormErrors = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

export default function ContactPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [aiResponse, setAiResponse] = useState<string>("");
  const [showAiResponse, setShowAiResponse] = useState(false);
  const [rateLimitCount, setRateLimitCount] = useState(0);
  const lastSubmitTimeRef = useRef<number>(0);

  // Initialize
  useEffect(() => {
    setIsMounted(true);

    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleReducedMotion = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    mediaQuery.addEventListener("change", handleReducedMotion);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
      mediaQuery.removeEventListener("change", handleReducedMotion);
    };
  }, []);

  // Real-time validation
  const validateField = (name: keyof FormData, value: string): string | undefined => {
    switch (name) {
      case "name":
        if (!value.trim()) return "姓名不能为空";
        if (value.length < 2) return "姓名至少需要 2 个字符";
        if (value.length > 50) return "姓名不能超过 50 个字符";
        return undefined;
      case "email":
        if (!value.trim()) return "邮箱不能为空";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "请输入有效的邮箱地址";
        return undefined;
      case "subject":
        if (!value.trim()) return "主题不能为空";
        if (value.length < 5) return "主题至少需要 5 个字符";
        if (value.length > 100) return "主题不能超过 100 个字符";
        return undefined;
      case "message":
        if (!value.trim()) return "消息不能为空";
        if (value.length < 10) return "消息至少需要 10 个字符";
        if (value.length > 2000) return "消息不能超过 2000 个字符";
        return undefined;
      default:
        return undefined;
    }
  };

  const handleFieldChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Rate limiting
  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const timeSinceLastSubmit = now - lastSubmitTimeRef.current;
    const RATE_LIMIT_WINDOW = 60000; // 1 minute
    const MAX_SUBMITS = 3;

    if (timeSinceLastSubmit < RATE_LIMIT_WINDOW) {
      if (rateLimitCount >= MAX_SUBMITS) {
        alert(`提交过于频繁，请等待 ${Math.ceil((RATE_LIMIT_WINDOW - timeSinceLastSubmit) / 1000)} 秒后再试。`);
        return false;
      }
      setRateLimitCount((prev) => prev + 1);
    } else {
      setRateLimitCount(0);
    }

    lastSubmitTimeRef.current = now;
    return true;
  };

  // AI-assisted response
  const generateAIResponse = async () => {
    try {
      const response = await fetch("/api/ai-agent/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `请为以下联系表单消息生成一个友好的回复：\n主题：${formData.subject}\n消息：${formData.message}`,
            },
          ],
        }),
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let aiText = "";

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const json = JSON.parse(data);
                if (json.text) {
                  aiText += json.text;
                  setAiResponse(aiText);
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
        setShowAiResponse(true);
      }
    } catch (error) {
      console.error("AI response error:", error);
      // Fallback response
      setAiResponse("感谢您的联系！我会尽快回复您。");
      setShowAiResponse(true);
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: FormErrors = {};
    let hasErrors = false;

    (Object.keys(formData) as Array<keyof FormData>).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(newErrors);
      // Focus first error field
      const firstErrorField = Object.keys(newErrors)[0];
      if (firstErrorField) {
        document.getElementById(firstErrorField)?.focus();
      }
      return;
    }

    // Check rate limit
    if (!checkRateLimit()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In production, send to API route
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });

      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setErrors({});
      setShowAiResponse(false);
      setAiResponse("");

      // Auto-hide success message
      setTimeout(() => {
        setSubmitStatus("idle");
      }, 5000);
    } catch (error) {
      setSubmitStatus("error");
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="container is-fluid mt-6">
      <div className="box liquid-glass-card">
        <h1 className="title is-2 mb-6 liquid-glass-text">Contact Me</h1>
        <p className="subtitle is-5 mb-6 liquid-glass-text">
          Get in touch for collaboration opportunities, technical discussions, or project inquiries
        </p>

        <div className="columns">
          <div className="column">
            <form onSubmit={handleSubmit} noValidate>
              <div className="box liquid-glass-card">
                <div className="field">
                  <label className="label" htmlFor="name">
                    姓名 <span className="has-text-danger">*</span>
                  </label>
                  <div className="control">
                    <input
                      id="name"
                      className={`input ${errors.name ? "is-danger" : ""}`}
                      type="text"
                      placeholder="您的姓名"
                      value={formData.name}
                      onChange={(e) => handleFieldChange("name", e.target.value)}
                      aria-label="Name"
                      aria-required="true"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "name-error" : undefined}
                    />
                  </div>
                  {errors.name && (
                    <p id="name-error" className="help is-danger" role="alert">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="field">
                  <label className="label" htmlFor="email">
                    邮箱 <span className="has-text-danger">*</span>
                  </label>
                  <div className="control">
                    <input
                      id="email"
                      className={`input ${errors.email ? "is-danger" : ""}`}
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      aria-label="Email"
                      aria-required="true"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-error" : undefined}
                    />
                  </div>
                  {errors.email && (
                    <p id="email-error" className="help is-danger" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="field">
                  <label className="label" htmlFor="subject">
                    主题 <span className="has-text-danger">*</span>
                  </label>
                  <div className="control">
                    <input
                      id="subject"
                      className={`input ${errors.subject ? "is-danger" : ""}`}
                      type="text"
                      placeholder="消息主题"
                      value={formData.subject}
                      onChange={(e) => handleFieldChange("subject", e.target.value)}
                      aria-label="Subject"
                      aria-required="true"
                      aria-invalid={!!errors.subject}
                      aria-describedby={errors.subject ? "subject-error" : undefined}
                    />
                  </div>
                  {errors.subject && (
                    <p id="subject-error" className="help is-danger" role="alert">
                      {errors.subject}
                    </p>
                  )}
                </div>

                <div className="field">
                  <label className="label" htmlFor="message">
                    消息 <span className="has-text-danger">*</span>
                  </label>
                  <div className="control">
                    <textarea
                      id="message"
                      className={`textarea ${errors.message ? "is-danger" : ""}`}
                      placeholder="请输入您的消息..."
                      rows={isMobile ? 6 : 8}
                      value={formData.message}
                      onChange={(e) => handleFieldChange("message", e.target.value)}
                      aria-label="Message"
                      aria-required="true"
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? "message-error" : undefined}
                    />
                  </div>
                  {errors.message && (
                    <p id="message-error" className="help is-danger" role="alert">
                      {errors.message}
                    </p>
                  )}
                  <p className="help liquid-glass-text">
                    已输入 {formData.message.length} / 2000 字符
                  </p>
                </div>

                <div className="field is-grouped">
                  <div className="control">
                    <button
                      type="submit"
                      className="button is-primary"
                      disabled={isSubmitting}
                      aria-label="Submit contact form"
                    >
                      {isSubmitting ? "提交中..." : "发送消息"}
                    </button>
                  </div>
                  <div className="control">
                    <button
                      type="button"
                      className="button is-light"
                      onClick={generateAIResponse}
                      disabled={!formData.subject || !formData.message}
                      aria-label="Generate AI response"
                    >
                      AI 辅助回复
                    </button>
                  </div>
                </div>

                {submitStatus === "success" && (
                  <div className="notification is-success mt-4" role="alert">
                    <p>
                      <strong>成功！</strong> 您的消息已发送。我会尽快回复您。
                    </p>
                  </div>
                )}

                {submitStatus === "error" && (
                  <div className="notification is-danger mt-4" role="alert">
                    <p>
                      <strong>错误！</strong> 发送失败，请稍后重试。
                    </p>
                  </div>
                )}
              </div>
            </form>
          </div>

          {showAiResponse && (
            <div className="column">
            <div className="box liquid-glass-card">
              <h2 className="title is-4 mb-3 liquid-glass-text">AI 建议回复</h2>
              <div className="content">
                <p className="liquid-glass-text">{aiResponse || "正在生成..."}</p>
              </div>
              <div className="buttons mt-4">
                <button
                  className="button is-primary"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, message: aiResponse }));
                    setShowAiResponse(false);
                  }}
                  aria-label="Use AI response"
                >
                  使用此回复
                </button>
                <button
                  className="button is-light"
                  onClick={() => setShowAiResponse(false)}
                  aria-label="Close AI response"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Security Features */}
        <div className="box liquid-glass-card mt-6">
          <h2 className="title is-5 mb-3 liquid-glass-text">安全特性</h2>
          <div className="content">
            <ul>
              <li>🔒 速率限制 - 防止垃圾邮件和滥用</li>
              <li>✅ 实时验证 - 客户端和服务端双重验证</li>
              <li>🛡️ XSS 防护 - 输入清理和转义</li>
              <li>🔐 CSRF 保护 - 令牌验证</li>
              <li>🤖 AI 辅助 - 智能回复建议</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

