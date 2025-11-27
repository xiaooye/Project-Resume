"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Project } from "@/types";
import * as d3 from "d3";

interface TypeSystemFeature {
  id: string;
  name: string;
  category: "utility" | "conditional" | "mapped" | "template";
  description: string;
  example: string;
  usage: number;
}

interface CodeGenerationTask {
  id: string;
  type: "schema" | "api" | "types" | "validators";
  input: string;
  output: string;
  status: "pending" | "generating" | "completed" | "error";
  progress: number;
}

interface ToolChainMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: "up" | "down" | "stable";
}

export default function EnterpriseTypeScriptFrameworkDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [activeTab, setActiveTab] = useState<"types" | "codegen" | "toolchain" | "adoption">("types");
  
  // User controls
  const [codeGenEnabled, setCodeGenEnabled] = useState(true);
  const [typeSystemComplexity, setTypeSystemComplexity] = useState(5); // 1-10
  const [toolChainSpeed, setToolChainSpeed] = useState(7); // 1-10
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  
  // Type system state
  const [typeFeatures, setTypeFeatures] = useState<TypeSystemFeature[]>([]);
  const [typeUsageStats, setTypeUsageStats] = useState<Map<string, number>>(new Map());
  
  // Code generation state
  const [codeGenTasks, setCodeGenTasks] = useState<CodeGenerationTask[]>([]);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  
  // Tool chain metrics
  const [toolChainMetrics, setToolChainMetrics] = useState<ToolChainMetric[]>([]);
  const [adoptionStats, setAdoptionStats] = useState({
    teams: 50,
    projects: 250,
    codeQuality: 40,
    productivity: 30,
  });
  
  const svgRef = useRef<SVGSVGElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const codeGenIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize type system features
  const initializeTypeFeatures = useCallback(() => {
    const features: TypeSystemFeature[] = [
      {
        id: "utility-types",
        name: "Utility Types",
        category: "utility",
        description: "Built-in utility types: Partial, Required, Pick, Omit, Record, etc.",
        example: "type UserPartial = Partial<User>;",
        usage: 95,
      },
      {
        id: "conditional-types",
        name: "Conditional Types",
        category: "conditional",
        description: "Type-level conditionals: T extends U ? X : Y",
        example: "type NonNullable<T> = T extends null | undefined ? never : T;",
        usage: 78,
      },
      {
        id: "mapped-types",
        name: "Mapped Types",
        category: "mapped",
        description: "Transform types: { [K in keyof T]: T[K] }",
        example: "type Readonly<T> = { readonly [P in keyof T]: T[P] };",
        usage: 82,
      },
      {
        id: "template-literals",
        name: "Template Literal Types",
        category: "template",
        description: "String manipulation at type level",
        example: "type EventName = `on${Capitalize<string>}`;",
        usage: 65,
      },
      {
        id: "recursive-types",
        name: "Recursive Types",
        category: "conditional",
        description: "Self-referential types for complex structures",
        example: "type TreeNode<T> = { value: T; children: TreeNode<T>[]; };",
        usage: 58,
      },
      {
        id: "branded-types",
        name: "Branded Types",
        category: "utility",
        description: "Type-safe primitives with branding",
        example: "type UserId = string & { __brand: 'UserId' };",
        usage: 72,
      },
    ];
    setTypeFeatures(features);
    const stats = new Map<string, number>();
    features.forEach(f => stats.set(f.id, f.usage));
    setTypeUsageStats(stats);
  }, []);

  // Initialize code generation tasks
  const initializeCodeGenTasks = useCallback(() => {
    const tasks: CodeGenerationTask[] = [
      {
        id: "task-1",
        type: "schema",
        input: "user.schema.json",
        output: "user.types.ts",
        status: "pending",
        progress: 0,
      },
      {
        id: "task-2",
        type: "api",
        input: "api.yaml",
        output: "api-client.ts",
        status: "pending",
        progress: 0,
      },
      {
        id: "task-3",
        type: "validators",
        input: "validation.rules.ts",
        output: "validators.ts",
        status: "pending",
        progress: 0,
      },
    ];
    setCodeGenTasks(tasks);
  }, []);

  // Initialize tool chain metrics
  const initializeToolChainMetrics = useCallback(() => {
    const metrics: ToolChainMetric[] = [
      { name: "Type Check Speed", value: 2.3, target: 3.0, unit: "s", trend: "down" },
      { name: "Code Generation", value: 0.8, target: 1.0, unit: "s", trend: "stable" },
      { name: "Linting Speed", value: 1.5, target: 2.0, unit: "s", trend: "down" },
      { name: "Build Time", value: 12.5, target: 15.0, unit: "s", trend: "down" },
      { name: "Test Coverage", value: 85, target: 80, unit: "%", trend: "up" },
      { name: "Code Quality", value: 92, target: 90, unit: "%", trend: "up" },
    ];
    setToolChainMetrics(metrics);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    const checkReducedMotion = () => setPrefersReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    
    checkMobile();
    checkReducedMotion();
    window.addEventListener("resize", checkMobile);
    window.addEventListener("change", checkReducedMotion);
    
    initializeTypeFeatures();
    initializeCodeGenTasks();
    initializeToolChainMetrics();
    
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("change", checkReducedMotion);
    };
  }, [initializeTypeFeatures, initializeCodeGenTasks, initializeToolChainMetrics]);

  // Simulate code generation
  useEffect(() => {
    if (!isMounted || !codeGenEnabled) return;
    
    codeGenIntervalRef.current = setInterval(() => {
      setCodeGenTasks(prev => prev.map(task => {
        if (task.status === "pending" && Math.random() > 0.7) {
          return { ...task, status: "generating", progress: 0 };
        }
        
        if (task.status === "generating") {
          const newProgress = Math.min(100, task.progress + (toolChainSpeed * 10));
          if (newProgress >= 100) {
            // Generate code based on task type
            let generated = "";
            switch (task.type) {
              case "schema":
                generated = `// Generated from ${task.input}\n\nexport interface User {\n  id: string;\n  name: string;\n  email: string;\n  createdAt: Date;\n}\n\nexport type UserPartial = Partial<User>;\nexport type UserRequired = Required<User>;`;
                break;
              case "api":
                generated = `// Generated from ${task.input}\n\nimport { User } from './user.types';\n\nexport class ApiClient {\n  async getUser(id: string): Promise<User> {\n    // Implementation\n  }\n  async createUser(user: Partial<User>): Promise<User> {\n    // Implementation\n  }\n}`;
                break;
              case "validators":
                generated = `// Generated from ${task.input}\n\nimport { User } from './user.types';\n\nexport function validateUser(user: unknown): user is User {\n  return (\n    typeof user === 'object' &&\n    user !== null &&\n    'id' in user &&\n    'name' in user &&\n    'email' in user\n  );\n}`;
                break;
            }
            setGeneratedCode(generated);
            return { ...task, status: "completed", progress: 100, output: generated };
          }
          return { ...task, progress: newProgress };
        }
        
        if (task.status === "completed" && Math.random() > 0.9) {
          return { ...task, status: "pending", progress: 0 };
        }
        
        return task;
      }));
    }, 500);
    
    return () => {
      if (codeGenIntervalRef.current) clearInterval(codeGenIntervalRef.current);
    };
  }, [isMounted, codeGenEnabled, toolChainSpeed]);

  // Update tool chain metrics
  useEffect(() => {
    if (!isMounted) return;
    
    intervalRef.current = setInterval(() => {
      setToolChainMetrics(prev => prev.map(metric => {
        const variation = (Math.random() - 0.5) * metric.value * 0.05;
        const newValue = Math.max(0, metric.value + variation);
        const trend = newValue > metric.value ? "up" : newValue < metric.value ? "down" : "stable";
        return { ...metric, value: newValue, trend };
      }));
      
      setAdoptionStats(prev => ({
        teams: prev.teams + (Math.random() > 0.95 ? 1 : 0),
        projects: prev.projects + (Math.random() > 0.9 ? 1 : 0),
        codeQuality: Math.min(100, prev.codeQuality + (Math.random() - 0.5) * 0.5),
        productivity: Math.min(100, prev.productivity + (Math.random() - 0.5) * 0.5),
      }));
    }, 2000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMounted]);

  // Draw type system visualization
  useEffect(() => {
    if (!isMounted || activeTab !== "types" || !svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    const width = svgRef.current.clientWidth || 800;
    const height = isMobile ? 300 : 400;
    svg.attr("width", width).attr("height", height);
    
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Group features by category
    const categories = Array.from(new Set(typeFeatures.map(f => f.category)));
    const categoryColors: Record<string, string> = {
      utility: "#3273dc",
      conditional: "#48c774",
      mapped: "#ffdd57",
      template: "#ff3860",
    };
    
    // Create bar chart
    const xScale = d3.scaleBand()
      .domain(typeFeatures.map(f => f.name))
      .range([0, chartWidth])
      .padding(0.2);
    
    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([chartHeight, 0]);
    
    // Bars
    g.selectAll(".bar")
      .data(typeFeatures)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.name) || 0)
      .attr("y", d => yScale(d.usage))
      .attr("width", xScale.bandwidth())
      .attr("height", d => chartHeight - yScale(d.usage))
      .attr("fill", d => categoryColors[d.category])
      .attr("opacity", 0.8)
      .on("mouseenter", function(event, d) {
        d3.select(this).attr("opacity", 1);
        setSelectedFeature(d.id);
      })
      .on("mouseleave", function() {
        d3.select(this).attr("opacity", 0.8);
        setSelectedFeature(null);
      });
    
    // X axis
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");
    
    // Y axis
    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5))
      .append("text")
      .attr("fill", "currentColor")
      .attr("transform", "rotate(-90)")
      .attr("y", -30)
      .attr("x", -chartHeight / 2)
      .attr("text-anchor", "middle")
      .text("Usage %");
  }, [isMounted, activeTab, typeFeatures, isMobile]);

  if (!isMounted) return null;

  const selectedFeatureData = selectedFeature ? typeFeatures.find(f => f.id === selectedFeature) : null;
  const activeTasks = codeGenTasks.filter(t => t.status === "generating" || t.status === "completed");
  const completedTasks = codeGenTasks.filter(t => t.status === "completed").length;

  return (
    <div className="box liquid-glass-card">
      <h3 className="title is-5 mb-4 liquid-glass-text">Enterprise TypeScript Framework</h3>
      
      {/* Tabs */}
      <div className="tabs is-boxed mb-4">
        <ul>
          <li className={activeTab === "types" ? "is-active" : ""}>
            <a
              onClick={() => setActiveTab("types")}
              onKeyDown={(e) => e.key === "Enter" && setActiveTab("types")}
              role="button"
              tabIndex={0}
              aria-label="Type System tab"
            >
              <span className="icon is-small mr-2">📘</span>
              <span>Type System</span>
            </a>
          </li>
          <li className={activeTab === "codegen" ? "is-active" : ""}>
            <a
              onClick={() => setActiveTab("codegen")}
              onKeyDown={(e) => e.key === "Enter" && setActiveTab("codegen")}
              role="button"
              tabIndex={0}
              aria-label="Code Generation tab"
            >
              <span className="icon is-small mr-2">⚙️</span>
              <span>Code Generation</span>
            </a>
          </li>
          <li className={activeTab === "toolchain" ? "is-active" : ""}>
            <a
              onClick={() => setActiveTab("toolchain")}
              onKeyDown={(e) => e.key === "Enter" && setActiveTab("toolchain")}
              role="button"
              tabIndex={0}
              aria-label="Tool Chain tab"
            >
              <span className="icon is-small mr-2">🔧</span>
              <span>Tool Chain</span>
            </a>
          </li>
          <li className={activeTab === "adoption" ? "is-active" : ""}>
            <a
              onClick={() => setActiveTab("adoption")}
              onKeyDown={(e) => e.key === "Enter" && setActiveTab("adoption")}
              role="button"
              tabIndex={0}
              aria-label="Adoption Metrics tab"
            >
              <span className="icon is-small mr-2">📈</span>
              <span>Adoption</span>
            </a>
          </li>
        </ul>
      </div>

      {/* User Controls */}
      <div className="box liquid-glass-card mb-4">
        <h4 className="title is-6 mb-3 liquid-glass-text">Controls</h4>
        <div className="columns is-multiline">
          <div className="column is-half-tablet is-full-mobile">
            <label className="label liquid-glass-text">
              Code Generation Speed: {toolChainSpeed}/10
            </label>
            <input
              className="slider is-fullwidth"
              type="range"
              min="1"
              max="10"
              value={toolChainSpeed}
              onChange={(e) => setToolChainSpeed(Number(e.target.value))}
              aria-label="Code generation speed"
            />
          </div>
          <div className="column is-half-tablet is-full-mobile">
            <label className="checkbox liquid-glass-text">
              <input
                type="checkbox"
                checked={codeGenEnabled}
                onChange={(e) => setCodeGenEnabled(e.target.checked)}
                aria-label="Enable code generation"
              />
              {" "}Enable Code Generation
            </label>
          </div>
        </div>
      </div>

      {/* Type System Tab */}
      {activeTab === "types" && (
        <div>
          <h4 className="title is-6 mb-3 liquid-glass-text">Type System Features</h4>
          <div className="box liquid-glass-card mb-4">
            <svg ref={svgRef} className="is-fullwidth" style={{ height: isMobile ? "300px" : "400px" }} />
          </div>
          
          {selectedFeatureData && (
            <div className="box liquid-glass-card has-background-info-light">
              <h5 className="title is-6 liquid-glass-text">{selectedFeatureData.name}</h5>
              <p className="liquid-glass-text mb-2">{selectedFeatureData.description}</p>
              <div className="content">
                <pre className="has-background-dark has-text-light p-3" style={{ borderRadius: "4px" }}>
                  <code>{selectedFeatureData.example}</code>
                </pre>
              </div>
            </div>
          )}
          
          <div className="columns is-multiline mt-4">
            {typeFeatures.map(feature => (
              <div key={feature.id} className="column is-one-third-tablet is-half-mobile">
                <div className={`box liquid-glass-card ${selectedFeature === feature.id ? "has-background-info-light" : ""}`}>
                  <p className="heading liquid-glass-text">{feature.category}</p>
                  <p className="title is-6 liquid-glass-text">{feature.name}</p>
                  <progress
                    className="progress is-info"
                    value={feature.usage}
                    max={100}
                    aria-label={`${feature.name} usage: ${feature.usage}%`}
                  >
                    {feature.usage}%
                  </progress>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Code Generation Tab */}
      {activeTab === "codegen" && (
        <div>
          <h4 className="title is-6 mb-3 liquid-glass-text">Code Generation Tasks</h4>
          <div className="columns mb-4">
            <div className="column">
              <div className="box liquid-glass-card has-background-info-light">
                <p className="heading liquid-glass-text">Active Tasks</p>
                <p className="title is-4 liquid-glass-text">{activeTasks.length}</p>
              </div>
            </div>
            <div className="column">
              <div className="box liquid-glass-card has-background-success-light">
                <p className="heading liquid-glass-text">Completed</p>
                <p className="title is-4 liquid-glass-text">{completedTasks}</p>
              </div>
            </div>
          </div>
          
          <div className="columns is-multiline">
            {codeGenTasks.map(task => (
              <div key={task.id} className="column is-full">
                <div className="box liquid-glass-card">
                  <div className="level">
                    <div className="level-left">
                      <div className="level-item">
                        <div>
                          <p className="heading liquid-glass-text">Type</p>
                          <p className="title is-6 liquid-glass-text">{task.type}</p>
                        </div>
                      </div>
                      <div className="level-item">
                        <div>
                          <p className="heading liquid-glass-text">Input</p>
                          <p className="title is-6 liquid-glass-text">{task.input}</p>
                        </div>
                      </div>
                      <div className="level-item">
                        <div>
                          <p className="heading liquid-glass-text">Output</p>
                          <p className="title is-6 liquid-glass-text">{task.output}</p>
                        </div>
                      </div>
                    </div>
                    <div className="level-right">
                      <div className="level-item">
                        <span className={`tag ${
                          task.status === "completed" ? "is-success" :
                          task.status === "generating" ? "is-info" :
                          task.status === "error" ? "is-danger" : "is-light"
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  {task.status === "generating" && (
                    <progress
                      className="progress is-info mt-2"
                      value={task.progress}
                      max={100}
                      aria-label={`Progress: ${task.progress}%`}
                    >
                      {task.progress}%
                    </progress>
                  )}
                  {task.status === "completed" && task.output && (
                    <div className="content mt-3">
                      <pre className="has-background-dark has-text-light p-3" style={{ borderRadius: "4px", maxHeight: "200px", overflow: "auto" }}>
                        <code>{task.output}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tool Chain Tab */}
      {activeTab === "toolchain" && (
        <div>
          <h4 className="title is-6 mb-3 liquid-glass-text">Tool Chain Performance</h4>
          <div className="columns is-multiline">
            {toolChainMetrics.map(metric => {
              const isGood = metric.trend === "down" || (metric.unit === "%" && metric.value >= metric.target);
              return (
                <div key={metric.name} className="column is-one-third-tablet is-half-mobile">
                  <div className={`box liquid-glass-card ${isGood ? "has-background-success-light" : "has-background-warning-light"}`}>
                    <p className="heading liquid-glass-text">{metric.name}</p>
                    <p className="title is-4 liquid-glass-text">
                      {metric.value.toFixed(1)}{metric.unit}
                    </p>
                    <p className="is-size-7 liquid-glass-text">Target: {metric.target}{metric.unit}</p>
                    <span className={`tag is-small mt-2 ${
                      metric.trend === "up" ? "is-success" :
                      metric.trend === "down" ? "is-info" : "is-light"
                    }`}>
                      {metric.trend === "up" ? "↑" : metric.trend === "down" ? "↓" : "→"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Adoption Tab */}
      {activeTab === "adoption" && (
        <div>
          <h4 className="title is-6 mb-3 liquid-glass-text">Adoption Metrics</h4>
          <div className="columns is-multiline">
            <div className="column is-one-quarter-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-info-light">
                <p className="heading liquid-glass-text">Teams Using</p>
                <p className="title is-4 liquid-glass-text">{adoptionStats.teams}+</p>
              </div>
            </div>
            <div className="column is-one-quarter-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-success-light">
                <p className="heading liquid-glass-text">Projects</p>
                <p className="title is-4 liquid-glass-text">{adoptionStats.projects}+</p>
              </div>
            </div>
            <div className="column is-one-quarter-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-warning-light">
                <p className="heading liquid-glass-text">Code Quality</p>
                <p className="title is-4 liquid-glass-text">+{adoptionStats.codeQuality.toFixed(1)}%</p>
              </div>
            </div>
            <div className="column is-one-quarter-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-info-light">
                <p className="heading liquid-glass-text">Productivity</p>
                <p className="title is-4 liquid-glass-text">+{adoptionStats.productivity.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          <div className="content mt-4 liquid-glass-text">
            <h5 className="title is-6 mb-3">Framework Features</h5>
            <ul>
              <li><strong>Advanced Type System:</strong> Utility types, conditional types, mapped types, template literal types</li>
              <li><strong>Code Generation:</strong> Automated code generation from schemas, APIs, and type definitions</li>
              <li><strong>Developer Tooling:</strong> Custom ESLint rules, Babel plugins, AST manipulation tools</li>
              <li><strong>Best Practices:</strong> Enforced coding standards and architectural patterns</li>
              <li><strong>Performance:</strong> Optimized type checking and build times</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
