"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Project } from "@/types";
import * as d3 from "d3";

interface Component {
  id: string;
  name: string;
  category: "form" | "layout" | "navigation" | "feedback" | "data-display" | "overlay";
  status: "stable" | "beta" | "deprecated";
  testCoverage: number;
  accessibilityScore: number;
  usage: number;
  props: number;
  examples: number;
}

interface AccessibilityTest {
  id: string;
  componentId: string;
  test: string;
  status: "pass" | "fail" | "warning";
  details: string;
}

interface StorybookStory {
  id: string;
  componentId: string;
  name: string;
  category: string;
  status: "published" | "draft";
}

export default function ComponentDesignSystemDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [activeTab, setActiveTab] = useState<"components" | "storybook" | "accessibility" | "metrics">("components");
  
  // User controls
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyStable, setShowOnlyStable] = useState(false);
  
  // Components state
  const [components, setComponents] = useState<Component[]>([]);
  const [accessibilityTests, setAccessibilityTests] = useState<AccessibilityTest[]>([]);
  const [storybookStories, setStorybookStories] = useState<StorybookStory[]>([]);
  
  // Metrics
  const [metrics, setMetrics] = useState({
    totalComponents: 0,
    stableComponents: 0,
    averageTestCoverage: 0,
    averageAccessibilityScore: 0,
    totalStories: 0,
  });
  
  const svgRef = useRef<SVGSVGElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize components
  const initializeComponents = useCallback(() => {
    const categories: Component["category"][] = ["form", "layout", "navigation", "feedback", "data-display", "overlay"];
    const componentNames = [
      // Form components
      { name: "Button", category: "form" as const },
      { name: "Input", category: "form" as const },
      { name: "Select", category: "form" as const },
      { name: "Checkbox", category: "form" as const },
      { name: "Radio", category: "form" as const },
      { name: "Textarea", category: "form" as const },
      { name: "Switch", category: "form" as const },
      { name: "Slider", category: "form" as const },
      // Layout components
      { name: "Container", category: "layout" as const },
      { name: "Grid", category: "layout" as const },
      { name: "Flex", category: "layout" as const },
      { name: "Stack", category: "layout" as const },
      { name: "Card", category: "layout" as const },
      { name: "Box", category: "layout" as const },
      // Navigation components
      { name: "Navbar", category: "navigation" as const },
      { name: "Menu", category: "navigation" as const },
      { name: "Tabs", category: "navigation" as const },
      { name: "Breadcrumb", category: "navigation" as const },
      { name: "Pagination", category: "navigation" as const },
      // Feedback components
      { name: "Alert", category: "feedback" as const },
      { name: "Toast", category: "feedback" as const },
      { name: "Spinner", category: "feedback" as const },
      { name: "Progress", category: "feedback" as const },
      { name: "Badge", category: "feedback" as const },
      // Data display
      { name: "Table", category: "data-display" as const },
      { name: "List", category: "data-display" as const },
      { name: "Chart", category: "data-display" as const },
      { name: "Avatar", category: "data-display" as const },
      // Overlay components
      { name: "Modal", category: "overlay" as const },
      { name: "Drawer", category: "overlay" as const },
      { name: "Popover", category: "overlay" as const },
      { name: "Tooltip", category: "overlay" as const },
    ];
    
    const comps: Component[] = componentNames.map((comp, index) => ({
      id: `comp-${index}`,
      name: comp.name,
      category: comp.category,
      status: Math.random() > 0.2 ? "stable" : Math.random() > 0.5 ? "beta" : "deprecated",
      testCoverage: Math.floor(Math.random() * 30) + 70,
      accessibilityScore: Math.floor(Math.random() * 20) + 80,
      usage: Math.floor(Math.random() * 1000) + 100,
      props: Math.floor(Math.random() * 20) + 5,
      examples: Math.floor(Math.random() * 10) + 2,
    }));
    
    setComponents(comps);
    
    // Initialize accessibility tests
    const tests: AccessibilityTest[] = comps.flatMap(comp => [
      {
        id: `test-${comp.id}-1`,
        componentId: comp.id,
        test: "Keyboard Navigation",
        status: comp.accessibilityScore > 85 ? "pass" : comp.accessibilityScore > 75 ? "warning" : "fail",
        details: comp.accessibilityScore > 85 ? "All interactive elements are keyboard accessible" : "Some elements may need keyboard focus improvements",
      },
      {
        id: `test-${comp.id}-2`,
        componentId: comp.id,
        test: "Screen Reader Support",
        status: comp.accessibilityScore > 90 ? "pass" : comp.accessibilityScore > 80 ? "warning" : "fail",
        details: comp.accessibilityScore > 90 ? "Proper ARIA labels and roles" : "ARIA labels may need improvement",
      },
      {
        id: `test-${comp.id}-3`,
        componentId: comp.id,
        test: "Color Contrast",
        status: comp.accessibilityScore > 88 ? "pass" : "warning",
        details: comp.accessibilityScore > 88 ? "WCAG 2.2 AAA compliant" : "May need contrast adjustments",
      },
    ]);
    setAccessibilityTests(tests);
    
    // Initialize Storybook stories
    const stories: StorybookStory[] = comps.flatMap(comp => 
      Array.from({ length: comp.examples }, (_, i) => ({
        id: `story-${comp.id}-${i}`,
        componentId: comp.id,
        name: `${comp.name} - Example ${i + 1}`,
        category: comp.category,
        status: Math.random() > 0.1 ? "published" : "draft",
      }))
    );
    setStorybookStories(stories);
    
    // Calculate metrics
    const stableCount = comps.filter(c => c.status === "stable").length;
    const avgTestCoverage = comps.reduce((sum, c) => sum + c.testCoverage, 0) / comps.length;
    const avgAccessibility = comps.reduce((sum, c) => sum + c.accessibilityScore, 0) / comps.length;
    
    setMetrics({
      totalComponents: comps.length,
      stableComponents: stableCount,
      averageTestCoverage: avgTestCoverage,
      averageAccessibilityScore: avgAccessibility,
      totalStories: stories.length,
    });
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    const checkReducedMotion = () => setPrefersReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    
    checkMobile();
    checkReducedMotion();
    window.addEventListener("resize", checkMobile);
    window.addEventListener("change", checkReducedMotion);
    
    initializeComponents();
    
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("change", checkReducedMotion);
    };
  }, [initializeComponents]);

  // Update metrics periodically
  useEffect(() => {
    if (!isMounted) return;
    
    intervalRef.current = setInterval(() => {
      setComponents(prev => prev.map(comp => ({
        ...comp,
        usage: comp.usage + (Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0),
        testCoverage: Math.min(100, comp.testCoverage + (Math.random() > 0.95 ? 1 : 0)),
        accessibilityScore: Math.min(100, comp.accessibilityScore + (Math.random() > 0.98 ? 1 : 0)),
      })));
    }, 3000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMounted]);

  // Draw component distribution chart
  useEffect(() => {
    if (!isMounted || activeTab !== "components" || !svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    const width = svgRef.current.clientWidth || 800;
    const height = isMobile ? 250 : 300;
    svg.attr("width", width).attr("height", height);
    
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Group by category
    const categoryCounts = Array.from(
      d3.group(components, d => d.category),
      ([key, values]) => ({ category: key, count: values.length })
    );
    
    const categoryColors: Record<string, string> = {
      form: "#3273dc",
      layout: "#48c774",
      navigation: "#ffdd57",
      feedback: "#ff3860",
      "data-display": "#b86bff",
      overlay: "#00d1b2",
    };
    
    const xScale = d3.scaleBand()
      .domain(categoryCounts.map(d => d.category))
      .range([0, chartWidth])
      .padding(0.2);
    
    const maxCount = d3.max(categoryCounts, d => d.count) || 1;
    const yScale = d3.scaleLinear()
      .domain([0, maxCount])
      .range([chartHeight, 0]);
    
    // Bars
    g.selectAll(".bar")
      .data(categoryCounts)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.category) || 0)
      .attr("y", d => yScale(d.count))
      .attr("width", xScale.bandwidth())
      .attr("height", d => chartHeight - yScale(d.count))
      .attr("fill", d => categoryColors[d.category] || "#999")
      .attr("opacity", 0.8);
    
    // X axis
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");
    
    // Y axis
    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5));
  }, [isMounted, activeTab, components, isMobile]);

  if (!isMounted) return null;

  const filteredComponents = components.filter(comp => {
    if (selectedCategory !== "all" && comp.category !== selectedCategory) return false;
    if (showOnlyStable && comp.status !== "stable") return false;
    if (searchQuery && !comp.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const selectedComponentData = selectedComponent ? components.find(c => c.id === selectedComponent) : null;
  const componentTests = selectedComponent ? accessibilityTests.filter(t => t.componentId === selectedComponent) : [];
  const componentStories = selectedComponent ? storybookStories.filter(s => s.componentId === selectedComponent) : [];

  return (
    <div className="box liquid-glass-card">
      <h3 className="title is-5 mb-4 liquid-glass-text">Component Design System</h3>
      
      {/* Tabs */}
      <div className="tabs is-boxed mb-4">
        <ul>
          <li className={activeTab === "components" ? "is-active" : ""}>
            <a
              onClick={() => setActiveTab("components")}
              onKeyDown={(e) => e.key === "Enter" && setActiveTab("components")}
              role="button"
              tabIndex={0}
              aria-label="Components tab"
            >
              <span className="icon is-small mr-2">🎨</span>
              <span>Components</span>
            </a>
          </li>
          <li className={activeTab === "storybook" ? "is-active" : ""}>
            <a
              onClick={() => setActiveTab("storybook")}
              onKeyDown={(e) => e.key === "Enter" && setActiveTab("storybook")}
              role="button"
              tabIndex={0}
              aria-label="Storybook tab"
            >
              <span className="icon is-small mr-2">📚</span>
              <span>Storybook</span>
            </a>
          </li>
          <li className={activeTab === "accessibility" ? "is-active" : ""}>
            <a
              onClick={() => setActiveTab("accessibility")}
              onKeyDown={(e) => e.key === "Enter" && setActiveTab("accessibility")}
              role="button"
              tabIndex={0}
              aria-label="Accessibility tab"
            >
              <span className="icon is-small mr-2">♿</span>
              <span>Accessibility</span>
            </a>
          </li>
          <li className={activeTab === "metrics" ? "is-active" : ""}>
            <a
              onClick={() => setActiveTab("metrics")}
              onKeyDown={(e) => e.key === "Enter" && setActiveTab("metrics")}
              role="button"
              tabIndex={0}
              aria-label="Metrics tab"
            >
              <span className="icon is-small mr-2">📊</span>
              <span>Metrics</span>
            </a>
          </li>
        </ul>
      </div>

      {/* User Controls */}
      <div className="box liquid-glass-card mb-4">
        <div className="columns is-multiline">
          <div className="column is-half-tablet is-full-mobile">
            <div className="field">
              <label className="label liquid-glass-text">Search Components</label>
              <input
                className="input"
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search components"
              />
            </div>
          </div>
          <div className="column is-half-tablet is-full-mobile">
            <div className="field">
              <label className="label liquid-glass-text">Category</label>
              <div className="select is-fullwidth">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  aria-label="Filter by category"
                >
                  <option value="all">All Categories</option>
                  <option value="form">Form</option>
                  <option value="layout">Layout</option>
                  <option value="navigation">Navigation</option>
                  <option value="feedback">Feedback</option>
                  <option value="data-display">Data Display</option>
                  <option value="overlay">Overlay</option>
                </select>
              </div>
            </div>
          </div>
          <div className="column is-full">
            <label className="checkbox liquid-glass-text">
              <input
                type="checkbox"
                checked={showOnlyStable}
                onChange={(e) => setShowOnlyStable(e.target.checked)}
                aria-label="Show only stable components"
              />
              {" "}Show Only Stable Components
            </label>
          </div>
        </div>
      </div>

      {/* Components Tab */}
      {activeTab === "components" && (
        <div>
          <h4 className="title is-6 mb-3 liquid-glass-text">Component Library ({filteredComponents.length} components)</h4>
          <div className="box liquid-glass-card mb-4">
            <svg ref={svgRef} className="is-fullwidth" style={{ height: isMobile ? "250px" : "300px" }} />
          </div>
          
          <div className="columns is-multiline">
            {filteredComponents.map(comp => (
              <div key={comp.id} className="column is-one-third-tablet is-half-mobile">
                <div
                  className={`box liquid-glass-card ${selectedComponent === comp.id ? "has-background-info-light" : ""}`}
                  onClick={() => setSelectedComponent(selectedComponent === comp.id ? null : comp.id)}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedComponent(selectedComponent === comp.id ? null : comp.id)}
                  role="button"
                  tabIndex={0}
                  style={{ cursor: "pointer" }}
                >
                  <div className="level mb-2">
                    <div className="level-left">
                      <div className="level-item">
                        <p className="title is-6 liquid-glass-text">{comp.name}</p>
                      </div>
                    </div>
                    <div className="level-right">
                      <div className="level-item">
                        <span className={`tag ${
                          comp.status === "stable" ? "is-success" :
                          comp.status === "beta" ? "is-warning" : "is-danger"
                        }`}>
                          {comp.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="heading liquid-glass-text">{comp.category}</p>
                  <div className="content is-small liquid-glass-text">
                    <p><strong>Test Coverage:</strong> {comp.testCoverage}%</p>
                    <p><strong>Accessibility:</strong> {comp.accessibilityScore}%</p>
                    <p><strong>Usage:</strong> {comp.usage.toLocaleString()}</p>
                    <p><strong>Props:</strong> {comp.props}</p>
                    <p><strong>Examples:</strong> {comp.examples}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {selectedComponentData && (
            <div className="box liquid-glass-card has-background-info-light mt-4">
              <h5 className="title is-6 liquid-glass-text">{selectedComponentData.name} Details</h5>
              <div className="content liquid-glass-text">
                <p><strong>Category:</strong> {selectedComponentData.category}</p>
                <p><strong>Status:</strong> {selectedComponentData.status}</p>
                <p><strong>Test Coverage:</strong> {selectedComponentData.testCoverage}%</p>
                <p><strong>Accessibility Score:</strong> {selectedComponentData.accessibilityScore}%</p>
                <p><strong>Total Usage:</strong> {selectedComponentData.usage.toLocaleString()}</p>
                <p><strong>Number of Props:</strong> {selectedComponentData.props}</p>
                <p><strong>Storybook Examples:</strong> {selectedComponentData.examples}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Storybook Tab */}
      {activeTab === "storybook" && (
        <div>
          <h4 className="title is-6 mb-3 liquid-glass-text">Storybook Stories ({storybookStories.length} stories)</h4>
          {selectedComponent ? (
            <div>
              <div className="box liquid-glass-card mb-4">
                <h5 className="title is-6 liquid-glass-text">Stories for {selectedComponentData?.name}</h5>
                <div className="columns is-multiline">
                  {componentStories.map(story => (
                    <div key={story.id} className="column is-one-third-tablet is-half-mobile">
                      <div className="box liquid-glass-card">
                        <p className="title is-6 liquid-glass-text">{story.name}</p>
                        <p className="heading liquid-glass-text">{story.category}</p>
                        <span className={`tag ${story.status === "published" ? "is-success" : "is-warning"}`}>
                          {story.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                className="button is-info"
                onClick={() => setSelectedComponent(null)}
                aria-label="Clear selection"
              >
                Show All Stories
              </button>
            </div>
          ) : (
            <div className="columns is-multiline">
              {storybookStories.slice(0, 20).map(story => {
                const comp = components.find(c => c.id === story.componentId);
                return (
                  <div key={story.id} className="column is-one-quarter-tablet is-half-mobile">
                    <div
                      className="box liquid-glass-card"
                      onClick={() => setSelectedComponent(story.componentId)}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedComponent(story.componentId)}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: "pointer" }}
                    >
                      <p className="title is-6 liquid-glass-text">{story.name}</p>
                      <p className="heading liquid-glass-text">{comp?.name || story.category}</p>
                      <span className={`tag ${story.status === "published" ? "is-success" : "is-warning"}`}>
                        {story.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Accessibility Tab */}
      {activeTab === "accessibility" && (
        <div>
          <h4 className="title is-6 mb-3 liquid-glass-text">Accessibility Tests</h4>
          {selectedComponent ? (
            <div>
              <div className="box liquid-glass-card mb-4">
                <h5 className="title is-6 liquid-glass-text">Tests for {selectedComponentData?.name}</h5>
                <div className="table-container">
                  <table className="table is-fullwidth">
                    <thead>
                      <tr>
                        <th className="liquid-glass-text">Test</th>
                        <th className="liquid-glass-text">Status</th>
                        <th className="liquid-glass-text">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {componentTests.map(test => (
                        <tr key={test.id}>
                          <td className="liquid-glass-text">{test.test}</td>
                          <td>
                            <span className={`tag ${
                              test.status === "pass" ? "is-success" :
                              test.status === "warning" ? "is-warning" : "is-danger"
                            }`}>
                              {test.status}
                            </span>
                          </td>
                          <td className="liquid-glass-text">{test.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <button
                className="button is-info"
                onClick={() => setSelectedComponent(null)}
                aria-label="Clear selection"
              >
                Show All Tests
              </button>
            </div>
          ) : (
            <div className="box liquid-glass-card">
              <p className="liquid-glass-text mb-4">Select a component to view its accessibility tests</p>
              <div className="columns is-multiline">
                {components.slice(0, 12).map(comp => (
                  <div key={comp.id} className="column is-one-quarter-tablet is-half-mobile">
                    <div
                      className="box liquid-glass-card"
                      onClick={() => setSelectedComponent(comp.id)}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedComponent(comp.id)}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: "pointer" }}
                    >
                      <p className="title is-6 liquid-glass-text">{comp.name}</p>
                      <p className="heading liquid-glass-text">Accessibility: {comp.accessibilityScore}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === "metrics" && (
        <div>
          <h4 className="title is-6 mb-3 liquid-glass-text">System Metrics</h4>
          <div className="columns is-multiline">
            <div className="column is-one-quarter-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-info-light">
                <p className="heading liquid-glass-text">Total Components</p>
                <p className="title is-4 liquid-glass-text">{metrics.totalComponents}</p>
              </div>
            </div>
            <div className="column is-one-quarter-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-success-light">
                <p className="heading liquid-glass-text">Stable Components</p>
                <p className="title is-4 liquid-glass-text">{metrics.stableComponents}</p>
              </div>
            </div>
            <div className="column is-one-quarter-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-warning-light">
                <p className="heading liquid-glass-text">Avg Test Coverage</p>
                <p className="title is-4 liquid-glass-text">{metrics.averageTestCoverage.toFixed(1)}%</p>
              </div>
            </div>
            <div className="column is-one-quarter-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-info-light">
                <p className="heading liquid-glass-text">Avg Accessibility</p>
                <p className="title is-4 liquid-glass-text">{metrics.averageAccessibilityScore.toFixed(1)}%</p>
              </div>
            </div>
            <div className="column is-one-quarter-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-success-light">
                <p className="heading liquid-glass-text">Storybook Stories</p>
                <p className="title is-4 liquid-glass-text">{metrics.totalStories}</p>
              </div>
            </div>
          </div>
          
          <div className="content mt-4 liquid-glass-text">
            <h5 className="title is-6 mb-3">Features</h5>
            <ul>
              <li>Comprehensive component library with 100+ reusable components</li>
              <li>Full Storybook integration for component documentation and examples</li>
              <li>WCAG 2.2 AAA accessibility compliance with automated testing</li>
              <li>Extensive test coverage with React Testing Library (80%+ average)</li>
              <li>Theming and internationalization support</li>
              <li>TypeScript-first with comprehensive type definitions</li>
              <li>Responsive design patterns for all screen sizes</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
