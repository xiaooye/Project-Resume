"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Project } from "@/types";

// Sample project data
const projectsData: Project[] = [
  {
    id: "1",
    title: "Real-time Network Traffic Monitor",
    description:
      "Enterprise-grade network monitoring system with WebSocket-based real-time data streaming, load balancing visualization, and capacity planning analytics.",
    technologies: ["Next.js", "TypeScript", "WebSocket", "D3.js", "Node.js"],
    githubUrl: "https://github.com/example/network-monitor",
    demoUrl: "/demos/network-traffic",
    imageUrl: "/api/placeholder/800/600",
  },
  {
    id: "2",
    title: "Big Data Processing Platform",
    description:
      "High-performance data processing system with virtual scrolling for millions of records, real-time streaming, and advanced analytics.",
    technologies: ["React", "TypeScript", "WebAssembly", "D3.js", "IndexedDB"],
    githubUrl: "https://github.com/example/big-data",
    demoUrl: "/demos/big-data",
    imageUrl: "/api/placeholder/800/600",
  },
  {
    id: "3",
    title: "WebAssembly 3D Engine",
    description:
      "High-performance 3D rendering engine using WebAssembly for physics calculations, with Three.js integration and 60fps performance.",
    technologies: ["WebAssembly", "Three.js", "React Three Fiber", "TypeScript"],
    githubUrl: "https://github.com/example/wasm-3d",
    demoUrl: "/demos/webassembly-3d",
    imageUrl: "/api/placeholder/800/600",
  },
  {
    id: "4",
    title: "AI-Powered Portfolio Assistant",
    description:
      "Intelligent portfolio assistant with Gemini and GPT integration, real-time streaming responses, and context-aware interactions.",
    technologies: ["Next.js", "TypeScript", "Gemini API", "OpenAI API", "React"],
    githubUrl: "https://github.com/example/ai-assistant",
    demoUrl: "/demos/ai-agent",
    imageUrl: "/api/placeholder/800/600",
  },
  {
    id: "5",
    title: "Multi-Cloud Integration Platform",
    description:
      "Comprehensive cloud services integration platform supporting AWS, Azure, and Vercel with unified API and cost optimization.",
    technologies: ["Next.js", "AWS SDK", "Azure SDK", "Vercel", "TypeScript"],
    githubUrl: "https://github.com/example/cloud-platform",
    demoUrl: "/demos/aws",
    imageUrl: "/api/placeholder/800/600",
  },
  {
    id: "6",
    title: "WebRTC Collaboration Suite",
    description:
      "Real-time collaboration platform with video calls, shared whiteboard, and collaborative code editing using WebRTC and CRDT.",
    technologies: ["WebRTC", "Yjs", "Monaco Editor", "React", "TypeScript"],
    githubUrl: "https://github.com/example/webrtc-collab",
    demoUrl: "/demos/webrtc",
    imageUrl: "/api/placeholder/800/600",
  },
];

export default function ProjectsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Get unique technologies for filter
  const allTechnologies = Array.from(new Set(projectsData.flatMap((p) => p.technologies)));
  const filteredProjects = projectsData.filter((project) => {
    const matchesFilter = filter === "all" || project.technologies.includes(filter);
    const matchesSearch =
      searchQuery === "" ||
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.technologies.some((tech) => tech.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

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

  // Handle modal keyboard navigation
  useEffect(() => {
    if (!selectedProject) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedProject(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedProject]);

  // Trap focus in modal
  useEffect(() => {
    if (!selectedProject || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTab);
    firstElement?.focus();

    return () => document.removeEventListener("keydown", handleTab);
  }, [selectedProject]);

  // AI generation
  const generateAIDescription = async (project: Project) => {
    setAiGenerating(true);
    try {
      // Simulate AI generation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert("AI 描述生成功能需要配置 AI API。当前为演示模式。");
    } catch (error) {
      console.error("AI generation error:", error);
    } finally {
      setAiGenerating(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="container is-fluid mt-6">
      <div className="box liquid-glass-card">
        <h1 className="title is-2 mb-6 liquid-glass-text">Project Portfolio</h1>
        <p className="subtitle is-5 mb-6 liquid-glass-text">
          Showcase of advanced full-stack projects demonstrating enterprise-level system architecture and modern web technologies
        </p>

        {/* Filters and Search */}
        <div className="box liquid-glass-card mb-6">
          <div className="field is-grouped mb-4">
            <div className="control is-expanded">
              <input
                className="input"
                type="text"
                placeholder="搜索项目..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search projects"
              />
            </div>
          </div>
          <div className="field is-grouped is-grouped-multiline">
            <div className="control">
              <button
                className={`button ${filter === "all" ? "is-primary" : "is-light"}`}
                onClick={() => setFilter("all")}
                aria-label="Show all projects"
                aria-pressed={filter === "all"}
              >
                全部
              </button>
            </div>
            {allTechnologies.slice(0, isMobile ? 5 : 10).map((tech) => (
              <div key={tech} className="control">
                <button
                  className={`button ${filter === tech ? "is-primary" : "is-light"}`}
                  onClick={() => setFilter(tech)}
                  aria-label={`Filter by ${tech}`}
                  aria-pressed={filter === tech}
                >
                  {tech}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className={`columns is-multiline ${isMobile ? "is-mobile" : ""}`}>
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              className={`column ${isMobile ? "is-full" : "is-one-third"}`}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? {} : { duration: 0.3, delay: index * 0.1 }}
            >
              <div
                className="box liquid-glass-card"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedProject(project)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedProject(project);
                  }
                }}
                aria-label={`View details for ${project.title}`}
              >
                {project.imageUrl && (
                  <figure className="image is-16by9 mb-4">
                    <Image
                      src={project.imageUrl}
                      alt={project.title}
                      width={800}
                      height={600}
                      className="has-object-fit-cover"
                      loading="lazy"
                    />
                  </figure>
                )}
                <h2 className="title is-4 liquid-glass-text mb-3">{project.title}</h2>
                <p className="liquid-glass-text mb-4">{project.description}</p>
                <div className="tags mb-4">
                  {project.technologies.slice(0, isMobile ? 3 : 5).map((tech) => (
                    <span key={tech} className="tag is-info">
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > (isMobile ? 3 : 5) && (
                    <span className="tag">+{project.technologies.length - (isMobile ? 3 : 5)}</span>
                  )}
                </div>
                <div className="buttons">
                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      className="button is-primary"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`View demo for ${project.title}`}
                    >
                      查看演示
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      className="button is-light"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`View GitHub repository for ${project.title}`}
                    >
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="box liquid-glass-card has-text-centered">
            <p className="liquid-glass-text">没有找到匹配的项目。</p>
          </div>
        )}
      </div>

      {/* Project Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div className="modal is-active" role="dialog" aria-modal="true" aria-labelledby="project-modal-title">
            <div
              className="modal-background"
              onClick={() => setSelectedProject(null)}
              aria-label="Close project details"
            ></div>
            <motion.div
              ref={modalRef}
              className="modal-content box liquid-glass-card"
              initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
              transition={prefersReducedMotion ? {} : { duration: 0.3 }}
            >
              <button
                className="delete is-large"
                onClick={() => setSelectedProject(null)}
                aria-label="Close project details"
              ></button>
              <h2 id="project-modal-title" className="title is-3 liquid-glass-text mb-4">
                {selectedProject.title}
              </h2>
              {selectedProject.imageUrl && (
                <figure className="image is-16by9 mb-4">
                  <Image
                    src={selectedProject.imageUrl}
                    alt={selectedProject.title}
                    width={1200}
                    height={675}
                    className="has-object-fit-cover"
                  />
                </figure>
              )}
              <div className="content">
                <p className="liquid-glass-text mb-4">{selectedProject.description}</p>
                <h3 className="title is-5 liquid-glass-text mb-3">技术栈</h3>
                <div className="tags mb-4">
                  {selectedProject.technologies.map((tech) => (
                    <span key={tech} className="tag is-info is-medium">
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="buttons">
                  {selectedProject.demoUrl && (
                    <a
                      href={selectedProject.demoUrl}
                      className="button is-primary"
                      aria-label={`View demo for ${selectedProject.title}`}
                    >
                      查看演示
                    </a>
                  )}
                  {selectedProject.githubUrl && (
                    <a
                      href={selectedProject.githubUrl}
                      className="button is-light"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View GitHub repository for ${selectedProject.title}`}
                    >
                      GitHub
                    </a>
                  )}
                  <button
                    className="button is-info"
                    onClick={() => generateAIDescription(selectedProject)}
                    disabled={aiGenerating}
                    aria-label="Generate AI description"
                  >
                    {aiGenerating ? "生成中..." : "AI 生成描述"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

