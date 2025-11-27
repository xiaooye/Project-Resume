"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as d3 from "d3";
import { Skill } from "@/types";
import { skillsData, getSkillIcon, skillCategories } from "@/data/skills";

type SortOption = "name" | "level" | "years" | "category";
type SortOrder = "asc" | "desc";

export default function SkillsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("level");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const radarChartRef = useRef<SVGSVGElement>(null);
  const timelineRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const categories = Array.from(new Set(skillsData.map((s) => s.category)));

  // Filter and sort skills
  const filteredAndSortedSkills = useMemo(() => {
    let filtered = skillsData;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((s) => s.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "level":
          comparison = a.level - b.level;
          break;
        case "years":
          comparison = a.yearsOfExperience - b.yearsOfExperience;
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [selectedCategory, searchQuery, sortBy, sortOrder]);

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
    if (!selectedSkill) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedSkill(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedSkill]);

  // Render radar chart with interactivity
  useEffect(() => {
    if (!radarChartRef.current || !isMounted) return;

    const svg = d3.select(radarChartRef.current);
    svg.selectAll("*").remove();

    const width = radarChartRef.current.parentElement?.clientWidth || 600;
    const height = isMobile ? 400 : 500;
    const radius = Math.min(width, height) / 2 - 40;
    const centerX = width / 2;
    const centerY = height / 2;

    // Group skills by category for radar chart
    const categoryLevels = categories.map((category) => {
      const categorySkills = skillsData.filter((s) => s.category === category);
      const avgLevel = categorySkills.reduce((sum, s) => sum + s.level, 0) / categorySkills.length;
      return { category, level: avgLevel };
    });

    const angleSlice = (Math.PI * 2) / categoryLevels.length;
    const rScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);

    // Draw axes
    categoryLevels.forEach((item, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Axis line
      svg
        .append("line")
        .attr("x1", centerX)
        .attr("y1", centerY)
        .attr("x2", x)
        .attr("y2", y)
        .attr("stroke", "currentColor")
        .attr("stroke-width", 1)
        .attr("opacity", hoveredCategory === item.category ? 0.8 : 0.3);

      // Category label
      const labelX = centerX + Math.cos(angle) * (radius + 20);
      const labelY = centerY + Math.sin(angle) * (radius + 20);
      
      svg
        .append("text")
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text(item.category)
        .style("font-size", isMobile ? "12px" : "14px")
        .style("fill", "currentColor")
        .style("cursor", "pointer")
        .style("font-weight", hoveredCategory === item.category ? "bold" : "normal")
        .on("mouseenter", () => setHoveredCategory(item.category))
        .on("mouseleave", () => setHoveredCategory(null))
        .on("click", () => {
          setSelectedCategory(item.category === selectedCategory ? "all" : item.category);
        });

      // Level value
      svg
        .append("text")
        .attr("x", centerX + Math.cos(angle) * (radius / 2))
        .attr("y", centerY + Math.sin(angle) * (radius / 2))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text(`${item.level.toFixed(0)}%`)
        .style("font-size", isMobile ? "10px" : "12px")
        .style("fill", "currentColor")
        .style("opacity", 0.7);
    });

    // Draw concentric circles
    for (let i = 1; i <= 5; i++) {
      const r = (radius * i) / 5;
      svg
        .append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", r)
        .attr("fill", "none")
        .attr("stroke", "currentColor")
        .attr("stroke-width", 1)
        .attr("opacity", 0.2);
    }

    // Draw data polygon
    const points = categoryLevels.map((item, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      const r = rScale(item.level);
      return [centerX + Math.cos(angle) * r, centerY + Math.sin(angle) * r];
    });

    svg
      .append("polygon")
      .attr("points", points.map((p) => p.join(",")).join(" "))
      .attr("fill", "#00d4aa")
      .attr("fill-opacity", 0.3)
      .attr("stroke", "#00d4aa")
      .attr("stroke-width", 2);
  }, [isMounted, isMobile, categories, hoveredCategory, selectedCategory]);

  // Render timeline
  useEffect(() => {
    if (!timelineRef.current || !isMounted) return;

    const svg = d3.select(timelineRef.current);
    svg.selectAll("*").remove();

    const width = timelineRef.current.parentElement?.clientWidth || 800;
    const height = isMobile ? 300 : 400;
    const margin = { top: 20, right: 20, bottom: 60, left: 80 };

    // Group by years of experience
    const experienceGroups = skillsData.reduce((acc, skill) => {
      const key = `${skill.yearsOfExperience} years`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(skill);
      return acc;
    }, {} as Record<string, Skill[]>);

    const groups = Object.entries(experienceGroups).sort((a, b) => {
      const yearsA = parseInt(a[0]);
      const yearsB = parseInt(b[0]);
      return yearsB - yearsA;
    });

    const xScale = d3.scaleBand().domain(groups.map((g) => g[0])).range([margin.left, width - margin.right]).padding(0.2);
    const yScale = d3.scaleLinear().domain([0, Math.max(...groups.map((g) => g[1].length)) + 1]).nice().range([height - margin.bottom, margin.top]);

    // Draw bars
    groups.forEach((group, i) => {
      const x = xScale(group[0]) || 0;
      const barWidth = xScale.bandwidth();
      const barHeight = yScale(group[1].length);
      const barActualHeight = height - margin.bottom - barHeight;

      svg
        .append("rect")
        .attr("x", x)
        .attr("y", barHeight)
        .attr("width", barWidth)
        .attr("height", barActualHeight)
        .attr("fill", "#00d4aa")
        .attr("opacity", 0.7)
        .style("cursor", "pointer")
        .on("mouseenter", function () {
          d3.select(this).attr("opacity", 1);
        })
        .on("mouseleave", function () {
          d3.select(this).attr("opacity", 0.7);
        });

      svg
        .append("text")
        .attr("x", x + barWidth / 2)
        .attr("y", height - margin.bottom + 20)
        .attr("text-anchor", "middle")
        .text(group[0])
        .style("font-size", isMobile ? "10px" : "12px")
        .style("fill", "currentColor");

      svg
        .append("text")
        .attr("x", x + barWidth / 2)
        .attr("y", barHeight - 5)
        .attr("text-anchor", "middle")
        .text(`${group[1].length} ${group[1].length === 1 ? "skill" : "skills"}`)
        .style("font-size", isMobile ? "10px" : "12px")
        .style("fill", "currentColor");
    });
  }, [isMounted, isMobile]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="container is-fluid mt-6">
      <div className="box liquid-glass-card">
        <h1 className="title is-2 mb-6 liquid-glass-text">Skills & Expertise</h1>
        <p className="subtitle is-5 mb-6 liquid-glass-text">
          Technical competencies and years of experience across full-stack development, cloud services, and advanced technologies
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
                    placeholder="Search skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search skills"
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
                      <option value="level">By Proficiency</option>
                      <option value="name">By Name</option>
                      <option value="years">By Experience</option>
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
                aria-label="Show all skills"
                aria-pressed={selectedCategory === "all"}
              >
                All ({skillsData.length})
              </button>
            </div>
            {categories.map((category) => {
              const count = skillsData.filter((s) => s.category === category).length;
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

        {/* Radar Chart */}
        <div className="box liquid-glass-card mb-6">
          <h2 className="title is-4 mb-4 liquid-glass-text">Skills Radar Chart</h2>
          <p className="subtitle is-6 mb-4 liquid-glass-text">Proficiency levels across different technology categories</p>
          <svg
            ref={radarChartRef}
            width="100%"
            height={isMobile ? 450 : 550}
            role="img"
            aria-label="Skills radar chart"
          />
          <div className="is-sr-only" role="region" aria-label="Skills radar chart data table">
            <table>
              <caption>Skills by Category</caption>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Average Level</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => {
                  const categorySkills = skillsData.filter((s) => s.category === category);
                  const avgLevel = categorySkills.reduce((sum, s) => sum + s.level, 0) / categorySkills.length;
                  return (
                    <tr key={category}>
                      <td>{category}</td>
                      <td>{avgLevel.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Experience Timeline */}
        <div className="box liquid-glass-card mb-6">
          <h2 className="title is-4 mb-4 liquid-glass-text">Experience Timeline</h2>
          <p className="subtitle is-6 mb-4 liquid-glass-text">Skills distribution by years of experience</p>
          <svg
            ref={timelineRef}
            width="100%"
            height={isMobile ? 350 : 450}
            role="img"
            aria-label="Experience timeline chart"
          />
        </div>

        {/* Skills Grid */}
        <div className="box liquid-glass-card">
          <h2 className="title is-4 mb-4 liquid-glass-text">
            Skill Details ({filteredAndSortedSkills.length})
          </h2>
          {filteredAndSortedSkills.length === 0 ? (
            <div className="notification is-info">
              <p className="liquid-glass-text">No matching skills found. Please try different search criteria.</p>
            </div>
          ) : (
            <div className={`columns is-multiline ${isMobile ? "is-mobile" : ""}`}>
              <AnimatePresence>
                {filteredAndSortedSkills.map((skill, index) => (
                  <motion.div
                    key={skill.name}
                    className={`column ${isMobile ? "is-half" : "is-one-third"}`}
                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={prefersReducedMotion ? {} : { duration: 0.3, delay: index * 0.02 }}
                  >
                    <div
                      className="box liquid-glass-card"
                      style={{ cursor: "pointer", height: "100%" }}
                      onClick={() => setSelectedSkill(skill)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedSkill(skill);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View details for ${skill.name}`}
                    >
                      <div className="is-flex is-justify-content-space-between is-align-items-center mb-3">
                        <div className="is-flex is-align-items-center">
                          <span className="mr-2" style={{ fontSize: "1.5rem" }} aria-hidden="true">
                            {getSkillIcon(skill.name)}
                          </span>
                          <h3 className="title is-5 liquid-glass-text">{skill.name}</h3>
                        </div>
                        <span className="tag is-info">{skill.category}</span>
                      </div>
                      <div className="mb-2">
                        <div className="is-flex is-justify-content-space-between mb-1">
                          <span className="liquid-glass-text is-size-7">Proficiency</span>
                          <span className="liquid-glass-text is-size-7">{skill.level}%</span>
                        </div>
                        <progress
                          className="progress is-primary"
                          value={skill.level}
                          max="100"
                          aria-label={`${skill.name} proficiency: ${skill.level}%`}
                        >
                          {skill.level}%
                        </progress>
                      </div>
                      <div className="is-flex is-justify-content-space-between">
                        <span className="liquid-glass-text is-size-7">Years of Experience</span>
                        <span className="liquid-glass-text is-size-7">{skill.yearsOfExperience} years</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Skill Detail Modal */}
      <AnimatePresence>
        {selectedSkill && (
          <>
            <div
              className="modal is-active"
              role="dialog"
              aria-modal="true"
              aria-labelledby="skill-modal-title"
            >
              <div
                className="modal-background"
                onClick={() => setSelectedSkill(null)}
                aria-label="Close modal"
              />
              <motion.div
                className="modal-card"
                initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={prefersReducedMotion ? {} : { duration: 0.2 }}
              >
                <header className="modal-card-head">
                  <div className="is-flex is-align-items-center">
                    <span className="mr-3" style={{ fontSize: "2rem" }} aria-hidden="true">
                      {getSkillIcon(selectedSkill.name)}
                    </span>
                    <p className="modal-card-title liquid-glass-text" id="skill-modal-title">
                      {selectedSkill.name}
                    </p>
                  </div>
                  <button
                    className="delete"
                    aria-label="Close modal"
                    onClick={() => setSelectedSkill(null)}
                  />
                </header>
                <section className="modal-card-body">
                  <div className="content">
                    <div className="field">
                      <label className="label liquid-glass-text">Category</label>
                      <div className="control">
                        <span className="tag is-info is-large">{selectedSkill.category}</span>
                      </div>
                    </div>
                    <div className="field">
                      <label className="label liquid-glass-text">Proficiency</label>
                      <div className="control">
                        <progress
                          className="progress is-primary is-large"
                          value={selectedSkill.level}
                          max="100"
                          aria-label={`Proficiency: ${selectedSkill.level}%`}
                        >
                          {selectedSkill.level}%
                        </progress>
                        <p className="help liquid-glass-text">{selectedSkill.level}%</p>
                      </div>
                    </div>
                    <div className="field">
                      <label className="label liquid-glass-text">Years of Experience</label>
                      <div className="control">
                        <p className="is-size-5 liquid-glass-text">{selectedSkill.yearsOfExperience} years</p>
                      </div>
                    </div>
                    <div className="field">
                      <label className="label liquid-glass-text">Skill Level</label>
                      <div className="control">
                        <span className="tag is-success is-large">
                          {selectedSkill.level >= 90
                            ? "Expert"
                            : selectedSkill.level >= 75
                            ? "Advanced"
                            : selectedSkill.level >= 60
                            ? "Intermediate"
                            : "Beginner"}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
                <footer className="modal-card-foot">
                  <button
                    className="button is-primary"
                    onClick={() => setSelectedSkill(null)}
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
