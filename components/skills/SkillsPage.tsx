"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import * as d3 from "d3";
import { Skill } from "@/types";

// Sample skills data
const skillsData: Skill[] = [
  { name: "TypeScript", level: 95, category: "Languages", yearsOfExperience: 8 },
  { name: "JavaScript", level: 98, category: "Languages", yearsOfExperience: 10 },
  { name: "Python", level: 85, category: "Languages", yearsOfExperience: 6 },
  { name: "React", level: 95, category: "Frontend", yearsOfExperience: 8 },
  { name: "Next.js", level: 90, category: "Frontend", yearsOfExperience: 5 },
  { name: "Node.js", level: 92, category: "Backend", yearsOfExperience: 8 },
  { name: "GraphQL", level: 85, category: "Backend", yearsOfExperience: 4 },
  { name: "AWS", level: 88, category: "Cloud", yearsOfExperience: 6 },
  { name: "Azure", level: 82, category: "Cloud", yearsOfExperience: 4 },
  { name: "Docker", level: 90, category: "DevOps", yearsOfExperience: 5 },
  { name: "Kubernetes", level: 80, category: "DevOps", yearsOfExperience: 3 },
  { name: "WebAssembly", level: 75, category: "Advanced", yearsOfExperience: 2 },
  { name: "WebRTC", level: 78, category: "Advanced", yearsOfExperience: 3 },
  { name: "Machine Learning", level: 70, category: "AI/ML", yearsOfExperience: 3 },
];

export default function SkillsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const radarChartRef = useRef<SVGSVGElement>(null);
  const timelineRef = useRef<SVGSVGElement>(null);

  const categories = Array.from(new Set(skillsData.map((s) => s.category)));
  const filteredSkills = selectedCategory === "all" ? skillsData : skillsData.filter((s) => s.category === selectedCategory);

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

  // Render radar chart
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
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1);

      // Category label
      svg
        .append("text")
        .attr("x", centerX + Math.cos(angle) * (radius + 20))
        .attr("y", centerY + Math.sin(angle) * (radius + 20))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text(item.category)
        .style("font-size", isMobile ? "12px" : "14px")
        .style("fill", "currentColor");
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
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1)
        .attr("opacity", 0.3);
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

    // Add data table for accessibility
    const tableData = categoryLevels.map((item) => ({
      category: item.category,
      level: item.level,
    }));
  }, [isMounted, isMobile, categories]);

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
    const yScale = d3.scaleLinear().domain([0, groups.length * 5]).nice().range([height - margin.bottom, margin.top]);

    // Draw bars
    groups.forEach((group, i) => {
      const x = xScale(group[0]) || 0;
      const barWidth = xScale.bandwidth();
      const barHeight = yScale(group.length);

      svg
        .append("rect")
        .attr("x", x)
        .attr("y", barHeight)
        .attr("width", barWidth)
        .attr("height", height - margin.bottom - barHeight)
        .attr("fill", "#00d4aa")
        .attr("opacity", 0.7);

      svg
        .append("text")
        .attr("x", x + barWidth / 2)
        .attr("y", height - margin.bottom + 20)
        .attr("text-anchor", "middle")
        .text(group[0])
        .style("font-size", isMobile ? "10px" : "12px");

      svg
        .append("text")
        .attr("x", x + barWidth / 2)
        .attr("y", barHeight - 5)
        .attr("text-anchor", "middle")
        .text(`${group.length} skills`)
        .style("font-size", isMobile ? "10px" : "12px");
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

        {/* Category Filter */}
        <div className="box liquid-glass-card mb-6">
          <div className="field is-grouped is-grouped-multiline">
            <div className="control">
              <button
                className={`button ${selectedCategory === "all" ? "is-primary" : "is-light"}`}
                onClick={() => setSelectedCategory("all")}
                aria-label="Show all skills"
                aria-pressed={selectedCategory === "all"}
              >
                全部
              </button>
            </div>
            {categories.map((category) => (
              <div key={category} className="control">
                <button
                  className={`button ${selectedCategory === category ? "is-primary" : "is-light"}`}
                  onClick={() => setSelectedCategory(category)}
                  aria-label={`Filter by ${category}`}
                  aria-pressed={selectedCategory === category}
                >
                  {category}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Radar Chart */}
        <div className="box liquid-glass-card mb-6">
          <h2 className="title is-4 mb-4 liquid-glass-text">Skills Radar Chart</h2>
          <p className="subtitle is-6 mb-4 liquid-glass-text">Proficiency levels across different technology categories</p>
          <svg ref={radarChartRef} width="100%" height={isMobile ? 450 : 550} role="img" aria-label="Skills radar chart" />
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
          <svg ref={timelineRef} width="100%" height={isMobile ? 350 : 450} role="img" aria-label="Experience timeline chart" />
        </div>

        {/* Skills Grid */}
        <div className="box liquid-glass-card">
          <h2 className="title is-4 mb-4 liquid-glass-text">Skills Details ({filteredSkills.length})</h2>
          <div className={`columns is-multiline ${isMobile ? "is-mobile" : ""}`}>
            {filteredSkills.map((skill, index) => (
              <motion.div
                key={skill.name}
                className={`column ${isMobile ? "is-half" : "is-one-third"}`}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? {} : { duration: 0.3, delay: index * 0.05 }}
              >
                <div className="box liquid-glass-card">
                  <div className="is-flex is-justify-content-space-between is-align-items-center mb-3">
                    <h3 className="title is-5 liquid-glass-text">{skill.name}</h3>
                    <span className="tag is-info">{skill.category}</span>
                  </div>
                  <div className="mb-2">
                    <div className="is-flex is-justify-content-space-between mb-1">
                      <span className="liquid-glass-text is-size-7">熟练度</span>
                      <span className="liquid-glass-text is-size-7">{skill.level}%</span>
                    </div>
                    <progress className="progress is-primary" value={skill.level} max="100" aria-label={`${skill.name} proficiency: ${skill.level}%`}>
                      {skill.level}%
                    </progress>
                  </div>
                  <div className="is-flex is-justify-content-space-between">
                    <span className="liquid-glass-text is-size-7">经验年限</span>
                    <span className="liquid-glass-text is-size-7">{skill.yearsOfExperience} 年</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

