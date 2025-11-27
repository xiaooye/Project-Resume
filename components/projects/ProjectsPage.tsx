"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Project } from "@/types";
import { projectsData, getProjectIcon, projectCategories } from "@/data/projects";

type SortOption = "name" | "date" | "complexity" | "category";
type SortOrder = "asc" | "desc";

const complexityOrder = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

export default function ProjectsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedComplexity, setSelectedComplexity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const categories = Array.from(new Set(projectsData.map((p) => p.category)));
  const statuses = Array.from(new Set(projectsData.map((p) => p.status)));
  const complexities = Array.from(new Set(projectsData.map((p) => p.complexity)));

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projectsData;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((p) => p.status === selectedStatus);
    }

    // Filter by complexity
    if (selectedComplexity !== "all") {
      filtered = filtered.filter((p) => p.complexity === selectedComplexity);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.technologies.some((tech) => tech.toLowerCase().includes(query))
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.title.localeCompare(b.title);
          break;
        case "date":
          const dateA = a.completionDate ? new Date(a.completionDate).getTime() : 0;
          const dateB = b.completionDate ? new Date(b.completionDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case "complexity":
          comparison = complexityOrder[a.complexity] - complexityOrder[b.complexity];
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [selectedCategory, selectedStatus, selectedComplexity, searchQuery, sortBy, sortOrder]);

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

  // Handle keyboard navigation for modal
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

  const getStatusBadgeClass = (status: Project["status"]) => {
    switch (status) {
      case "completed":
        return "is-success";
      case "in-progress":
        return "is-warning";
      case "planned":
        return "is-info";
      default:
        return "is-light";
    }
  };

  const getComplexityBadgeClass = (complexity: Project["complexity"]) => {
    switch (complexity) {
      case "expert":
        return "is-danger";
      case "advanced":
        return "is-warning";
      case "intermediate":
        return "is-info";
      case "beginner":
        return "is-success";
      default:
        return "is-light";
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

        {/* Search and Sort Controls */}
        <div className="box liquid-glass-card mb-6">
          <div className="columns is-mobile is-vcentered">
            <div className="column">
              <div className="field">
                <div className="control has-icons-left">
                  <input
                    className="input"
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search projects"
                  />
                  <span className="icon is-small is-left">
                    <span aria-hidden="true">🔍</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="column is-narrow">
              <div className="field">
                <div className="control">
                  <div className="select">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      aria-label="Sort by"
                    >
                      <option value="date">By Date</option>
                      <option value="name">By Name</option>
                      <option value="complexity">By Complexity</option>
                      <option value="category">By Category</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="column is-narrow">
              <div className="field">
                <div className="control">
                  <button
                    className="button"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    aria-label={`Sort order: ${sortOrder === "asc" ? "ascending" : "descending"}`}
                  >
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="box liquid-glass-card mb-6">
          <h2 className="title is-5 mb-4 liquid-glass-text">Category Filter</h2>
          <div className="field is-grouped is-grouped-multiline">
            <div className="control">
              <button
                className={`button ${selectedCategory === "all" ? "is-primary" : "is-light"}`}
                onClick={() => setSelectedCategory("all")}
                aria-label="Show all projects"
                aria-pressed={selectedCategory === "all"}
              >
                All ({projectsData.length})
              </button>
            </div>
            {categories.map((category) => {
              const count = projectsData.filter((p) => p.category === category).length;
              return (
                <div key={category} className="control">
                  <button
                    className={`button ${selectedCategory === category ? "is-primary" : "is-light"}`}
                    onClick={() => setSelectedCategory(category)}
                    aria-label={`Filter by ${category}`}
                    aria-pressed={selectedCategory === category}
                  >
                    {category} ({count})
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status and Complexity Filters */}
        <div className="box liquid-glass-card mb-6">
          <div className="columns">
            <div className="column">
              <h2 className="title is-5 mb-4 liquid-glass-text">Status Filter</h2>
              <div className="field is-grouped is-grouped-multiline">
                <div className="control">
                  <button
                    className={`button ${selectedStatus === "all" ? "is-primary" : "is-light"}`}
                    onClick={() => setSelectedStatus("all")}
                    aria-label="Show all statuses"
                    aria-pressed={selectedStatus === "all"}
                  >
                    All
                  </button>
                </div>
                {statuses.map((status) => {
                  const count = projectsData.filter((p) => p.status === status).length;
                  return (
                    <div key={status} className="control">
                      <button
                        className={`button ${selectedStatus === status ? "is-primary" : "is-light"}`}
                        onClick={() => setSelectedStatus(status)}
                        aria-label={`Filter by ${status}`}
                        aria-pressed={selectedStatus === status}
                      >
                        {status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)} ({count})
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="column">
              <h2 className="title is-5 mb-4 liquid-glass-text">Complexity Filter</h2>
              <div className="field is-grouped is-grouped-multiline">
                <div className="control">
                  <button
                    className={`button ${selectedComplexity === "all" ? "is-primary" : "is-light"}`}
                    onClick={() => setSelectedComplexity("all")}
                    aria-label="Show all complexities"
                    aria-pressed={selectedComplexity === "all"}
                  >
                    All
                  </button>
                </div>
                {complexities.map((complexity) => {
                  const count = projectsData.filter((p) => p.complexity === complexity).length;
                  return (
                    <div key={complexity} className="control">
                      <button
                        className={`button ${selectedComplexity === complexity ? "is-primary" : "is-light"}`}
                        onClick={() => setSelectedComplexity(complexity)}
                        aria-label={`Filter by ${complexity}`}
                        aria-pressed={selectedComplexity === complexity}
                      >
                        {complexity.charAt(0).toUpperCase() + complexity.slice(1)} ({count})
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="box liquid-glass-card">
          <h2 className="title is-4 mb-4 liquid-glass-text">
            Project Details ({filteredAndSortedProjects.length})
          </h2>
          {filteredAndSortedProjects.length === 0 ? (
            <div className="notification is-info">
              <p className="liquid-glass-text">No matching projects found. Please try different search criteria.</p>
            </div>
          ) : (
            <div className={`columns is-multiline ${isMobile ? "is-mobile" : ""}`}>
              <AnimatePresence>
                {filteredAndSortedProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    className={`column ${isMobile ? "is-full" : "is-one-third"}`}
                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={prefersReducedMotion ? {} : { duration: 0.3, delay: index * 0.02 }}
                  >
                    <div
                      className="box liquid-glass-card"
                      style={{ cursor: "pointer", height: "100%" }}
                      onClick={() => setSelectedProject(project)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedProject(project);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View details for ${project.title}`}
                    >
                      <div className="is-flex is-justify-content-space-between is-align-items-center mb-3">
                        <div className="is-flex is-align-items-center">
                          <span className="mr-2" style={{ fontSize: "1.5rem" }} aria-hidden="true">
                            {getProjectIcon(project.title)}
                          </span>
                          <h3 className="title is-5 liquid-glass-text">{project.title}</h3>
                        </div>
                        {project.featured && (
                          <span className="tag is-warning">Featured</span>
                        )}
                      </div>
                      <p className="liquid-glass-text mb-3" style={{ fontSize: "0.9rem" }}>
                        {project.description}
                      </p>
                      <div className="mb-3">
                        <span className={`tag ${getStatusBadgeClass(project.status)} mr-2`}>
                          {project.status === "in-progress" ? "In Progress" : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                        <span className={`tag ${getComplexityBadgeClass(project.complexity)} mr-2`}>
                          {project.complexity.charAt(0).toUpperCase() + project.complexity.slice(1)}
                        </span>
                        <span className="tag is-info">{project.category}</span>
                      </div>
                      {project.completionDate && (
                        <div className="mb-2">
                          <span className="liquid-glass-text is-size-7">
                            Completed: {new Date(project.completionDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                          </span>
                        </div>
                      )}
                      <div className="tags">
                        {project.technologies.slice(0, isMobile ? 3 : 4).map((tech) => (
                          <span key={tech} className="tag is-light">
                            {tech}
                          </span>
                        ))}
                        {project.technologies.length > (isMobile ? 3 : 4) && (
                          <span className="tag">+{project.technologies.length - (isMobile ? 3 : 4)}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Project Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <>
            <div
              className="modal is-active"
              role="dialog"
              aria-modal="true"
              aria-labelledby="project-modal-title"
            >
              <div
                className="modal-background"
                onClick={() => setSelectedProject(null)}
                aria-label="Close modal"
              />
              <motion.div
                className="modal-card"
                ref={modalRef}
                initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
                transition={prefersReducedMotion ? {} : { duration: 0.2 }}
              >
                <header className="modal-card-head">
                  <div className="is-flex is-align-items-center">
                    <span className="mr-3" style={{ fontSize: "2rem" }} aria-hidden="true">
                      {getProjectIcon(selectedProject.title)}
                    </span>
                    <p className="modal-card-title liquid-glass-text" id="project-modal-title">
                      {selectedProject.title}
                    </p>
                  </div>
                  <button
                    className="delete"
                    aria-label="Close modal"
                    onClick={() => setSelectedProject(null)}
                  />
                </header>
                <section className="modal-card-body">
                  <div className="content">
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
                    <div className="field">
                      <label className="label liquid-glass-text">Description</label>
                      <div className="control">
                        <p className="liquid-glass-text">
                          {selectedProject.longDescription || selectedProject.description}
                        </p>
                      </div>
                    </div>
                    <div className="field">
                      <label className="label liquid-glass-text">Category</label>
                      <div className="control">
                        <span className="tag is-info is-large">{selectedProject.category}</span>
                      </div>
                    </div>
                    <div className="field">
                      <label className="label liquid-glass-text">Status</label>
                      <div className="control">
                        <span className={`tag ${getStatusBadgeClass(selectedProject.status)} is-large`}>
                          {selectedProject.status === "in-progress" ? "In Progress" : selectedProject.status.charAt(0).toUpperCase() + selectedProject.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="field">
                      <label className="label liquid-glass-text">Complexity</label>
                      <div className="control">
                        <span className={`tag ${getComplexityBadgeClass(selectedProject.complexity)} is-large`}>
                          {selectedProject.complexity.charAt(0).toUpperCase() + selectedProject.complexity.slice(1)}
                        </span>
                      </div>
                    </div>
                    {selectedProject.startDate && (
                      <div className="field">
                        <label className="label liquid-glass-text">Start Date</label>
                        <div className="control">
                          <p className="liquid-glass-text">
                            {new Date(selectedProject.startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedProject.completionDate && (
                      <div className="field">
                        <label className="label liquid-glass-text">Completion Date</label>
                        <div className="control">
                          <p className="liquid-glass-text">
                            {new Date(selectedProject.completionDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="field">
                      <label className="label liquid-glass-text">Technologies</label>
                      <div className="control">
                        <div className="tags">
                          {selectedProject.technologies.map((tech) => (
                            <span key={tech} className="tag is-info is-medium">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {selectedProject.metrics && (
                      <div className="field">
                        <label className="label liquid-glass-text">Key Metrics</label>
                        <div className="control">
                          <div className="content">
                            {selectedProject.metrics.performance && (
                              <p className="liquid-glass-text">
                                <strong>Performance:</strong> {selectedProject.metrics.performance}
                              </p>
                            )}
                            {selectedProject.metrics.scale && (
                              <p className="liquid-glass-text">
                                <strong>Scale:</strong> {selectedProject.metrics.scale}
                              </p>
                            )}
                            {selectedProject.metrics.cost && (
                              <p className="liquid-glass-text">
                                <strong>Cost:</strong> {selectedProject.metrics.cost}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedProject.highlights && selectedProject.highlights.length > 0 && (
                      <div className="field">
                        <label className="label liquid-glass-text">Key Highlights</label>
                        <div className="control">
                          <ul>
                            {selectedProject.highlights.map((highlight, index) => (
                              <li key={index} className="liquid-glass-text">
                                {highlight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
                <footer className="modal-card-foot">
                  {selectedProject.demoUrl && (
                    <a
                      href={selectedProject.demoUrl}
                      className="button is-primary"
                      aria-label={`View demo for ${selectedProject.title}`}
                    >
                      View Demo
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
                  {selectedProject.videoUrl && (
                    <a
                      href={selectedProject.videoUrl}
                      className="button is-info"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View video for ${selectedProject.title}`}
                    >
                      Video
                    </a>
                  )}
                  <button
                    className="button"
                    onClick={() => setSelectedProject(null)}
                    aria-label="Close modal"
                  >
                    Close
                  </button>
                </footer>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
