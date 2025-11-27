"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Project } from "@/types";
import * as d3 from "d3";

interface PipelineStage {
  id: string;
  name: string;
  type: "build" | "test" | "deploy" | "review";
  status: "pending" | "running" | "success" | "failed" | "skipped";
  duration: number;
  startTime: number;
  endTime?: number;
  logs?: string[];
}

interface Pipeline {
  id: string;
  branch: string;
  commit: string;
  author: string;
  status: "running" | "success" | "failed";
  stages: PipelineStage[];
  createdAt: number;
  duration: number;
}

interface CodeReview {
  id: string;
  prNumber: number;
  title: string;
  author: string;
  reviewer: string;
  status: "pending" | "approved" | "changes-requested" | "merged";
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  issues: ReviewIssue[];
  aiSuggestions: number;
  createdAt: number;
}

interface ReviewIssue {
  id: string;
  type: "bug" | "security" | "performance" | "style" | "best-practice";
  severity: "low" | "medium" | "high" | "critical";
  file: string;
  line: number;
  message: string;
  suggestion?: string;
  autoFixable: boolean;
}

interface DeveloperMetric {
  developer: string;
  commits: number;
  deployments: number;
  codeReviewTime: number; // hours
  testCoverage: number;
  codeQuality: number;
  productivity: number;
}

export default function DeveloperProductivityDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [activeTab, setActiveTab] = useState<"cicd" | "review" | "analytics" | "metrics">("cicd");
  
  // User controls
  const [simulationEnabled, setSimulationEnabled] = useState(true);
  const [autoDeployEnabled, setAutoDeployEnabled] = useState(true);
  const [aiReviewEnabled, setAiReviewEnabled] = useState(true);
  const [reviewStrictness, setReviewStrictness] = useState(7); // 1-10
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  
  // State
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [reviews, setReviews] = useState<CodeReview[]>([]);
  const [developerMetrics, setDeveloperMetrics] = useState<DeveloperMetric[]>([]);
  
  // Overall metrics
  const [metrics, setMetrics] = useState({
    deploymentSpeed: 50, // % improvement
    testAutomation: 100,
    avgDeploymentTime: 0,
    totalDeployments: 0,
    avgReviewTime: 0,
    codeQuality: 0,
  });
  
  const svgRef = useRef<SVGSVGElement>(null);
  const pipelineSvgRef = useRef<SVGSVGElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pipelineIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize pipelines
  const initializePipelines = useCallback(() => {
    const stages: PipelineStage["type"][] = ["build", "test", "review", "deploy"];
    const newPipelines: Pipeline[] = Array.from({ length: 5 }, (_, i) => {
      const pipelineStages: PipelineStage[] = stages.map((stageType, idx) => ({
        id: `stage-${i}-${idx}`,
        name: stageType.charAt(0).toUpperCase() + stageType.slice(1),
        type: stageType,
        status: idx === 0 ? "running" : "pending",
        duration: 0,
        startTime: Date.now() - (idx * 10000),
      }));
      
      return {
        id: `pipeline-${i}`,
        branch: ["main", "develop", "feature/new-feature", "hotfix/bug-fix"][i % 4],
        commit: `abc${i}def${i}123`,
        author: ["alice", "bob", "charlie", "diana"][i % 4],
        status: i === 0 ? "running" : i === 1 ? "success" : "failed",
        stages: pipelineStages,
        createdAt: Date.now() - (i * 60000),
        duration: 0,
      };
    });
    setPipelines(newPipelines);
  }, []);

  // Initialize code reviews
  const initializeReviews = useCallback(() => {
    const newReviews: CodeReview[] = Array.from({ length: 8 }, (_, i) => {
      const issues: ReviewIssue[] = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, j) => {
        const types: ReviewIssue["type"][] = ["bug", "security", "performance", "style", "best-practice"];
        const severities: ReviewIssue["severity"][] = ["low", "medium", "high", "critical"];
        return {
          id: `issue-${i}-${j}`,
          type: types[Math.floor(Math.random() * types.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          file: `src/components/Component${j}.tsx`,
          line: Math.floor(Math.random() * 100) + 1,
          message: `Issue found: ${types[Math.floor(Math.random() * types.length)]} concern`,
          suggestion: "Consider refactoring this section",
          autoFixable: Math.random() > 0.5,
        };
      });
      
      const statuses: CodeReview["status"][] = ["pending", "approved", "changes-requested", "merged"];
      return {
        id: `review-${i}`,
        prNumber: 1000 + i,
        title: `Feature: Add new component ${i}`,
        author: ["alice", "bob", "charlie", "diana"][i % 4],
        reviewer: ["alice", "bob", "charlie", "diana"][(i + 1) % 4],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        filesChanged: Math.floor(Math.random() * 20) + 5,
        linesAdded: Math.floor(Math.random() * 500) + 100,
        linesRemoved: Math.floor(Math.random() * 200) + 50,
        issues,
        aiSuggestions: Math.floor(Math.random() * 10) + 5,
        createdAt: Date.now() - (i * 3600000),
      };
    });
    setReviews(newReviews);
  }, []);

  // Initialize developer metrics
  const initializeDeveloperMetrics = useCallback(() => {
    const developers = ["alice", "bob", "charlie", "diana", "eve"];
    const metrics: DeveloperMetric[] = developers.map(dev => ({
      developer: dev,
      commits: Math.floor(Math.random() * 50) + 20,
      deployments: Math.floor(Math.random() * 20) + 10,
      codeReviewTime: Math.random() * 10 + 2,
      testCoverage: Math.floor(Math.random() * 20) + 75,
      codeQuality: Math.floor(Math.random() * 15) + 80,
      productivity: Math.floor(Math.random() * 20) + 75,
    }));
    setDeveloperMetrics(metrics);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    const checkReducedMotion = () => setPrefersReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    
    checkMobile();
    checkReducedMotion();
    window.addEventListener("resize", checkMobile);
    window.addEventListener("change", checkReducedMotion);
    
    initializePipelines();
    initializeReviews();
    initializeDeveloperMetrics();
    
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("change", checkReducedMotion);
    };
  }, [initializePipelines, initializeReviews, initializeDeveloperMetrics]);

  // Simulate pipeline execution
  useEffect(() => {
    if (!isMounted || !simulationEnabled) return;
    
    pipelineIntervalRef.current = setInterval(() => {
      setPipelines(prev => prev.map(pipeline => {
        if (pipeline.status !== "running") return pipeline;
        
        const updatedStages: PipelineStage[] = pipeline.stages.map((stage, idx) => {
          if (stage.status === "success" || stage.status === "failed") return stage;
          
          const elapsed = Date.now() - stage.startTime;
          const expectedDuration = stage.type === "build" ? 30000 :
                                  stage.type === "test" ? 60000 :
                                  stage.type === "review" ? 45000 : 20000;
          
          if (elapsed > expectedDuration) {
            // Move to next stage
            const nextStage = pipeline.stages[idx + 1];
            if (nextStage && nextStage.status === "pending") {
              return { ...nextStage, status: "running" as const, startTime: Date.now() };
            }
            
            // Check if all stages complete
            const allComplete = pipeline.stages.every(s => s.status === "success" || s.status === "failed");
            if (allComplete && idx === pipeline.stages.length - 1) {
              return { ...stage, status: "success" as const, endTime: Date.now(), duration: elapsed };
            }
            
            return { ...stage, status: "success" as const, endTime: Date.now(), duration: elapsed };
          }
          
          return { ...stage, duration: elapsed };
        });
        
        const allComplete = updatedStages.every(s => s.status === "success" || s.status === "failed");
        const hasFailed = updatedStages.some(s => s.status === "failed");
        
        return {
          ...pipeline,
          stages: updatedStages,
          status: allComplete ? (hasFailed ? "failed" : "success") : "running",
          duration: allComplete ? Date.now() - pipeline.createdAt : Date.now() - pipeline.createdAt,
        };
      }));
      
      // Add new pipeline occasionally
      if (Math.random() > 0.95 && pipelines.length < 10) {
        const newPipeline: Pipeline = {
          id: `pipeline-${Date.now()}`,
          branch: ["main", "develop", "feature/new-feature"][Math.floor(Math.random() * 3)],
          commit: `abc${Date.now().toString().slice(-6)}`,
          author: ["alice", "bob", "charlie", "diana"][Math.floor(Math.random() * 4)],
          status: "running",
          stages: [
            { id: `stage-new-0`, name: "Build", type: "build", status: "running", duration: 0, startTime: Date.now() },
            { id: `stage-new-1`, name: "Test", type: "test", status: "pending", duration: 0, startTime: 0 },
            { id: `stage-new-2`, name: "Review", type: "review", status: "pending", duration: 0, startTime: 0 },
            { id: `stage-new-3`, name: "Deploy", type: "deploy", status: "pending", duration: 0, startTime: 0 },
          ],
          createdAt: Date.now(),
          duration: 0,
        };
        setPipelines(prev => [newPipeline, ...prev].slice(0, 10));
      }
    }, 1000);
    
    return () => {
      if (pipelineIntervalRef.current) clearInterval(pipelineIntervalRef.current);
    };
  }, [isMounted, simulationEnabled, pipelines.length]);

  // Update metrics
  useEffect(() => {
    if (!isMounted) return;
    
    intervalRef.current = setInterval(() => {
      const completedPipelines = pipelines.filter(p => p.status === "success" || p.status === "failed");
      const avgTime = completedPipelines.length > 0
        ? completedPipelines.reduce((sum, p) => sum + p.duration, 0) / completedPipelines.length / 1000
        : 0;
      
      const completedReviews = reviews.filter(r => r.status === "merged" || r.status === "approved");
      const avgReviewTime = completedReviews.length > 0
        ? completedReviews.reduce((sum, r) => sum + (Date.now() - r.createdAt), 0) / completedReviews.length / 3600000
        : 0;
      
      const avgCodeQuality = developerMetrics.length > 0
        ? developerMetrics.reduce((sum, d) => sum + d.codeQuality, 0) / developerMetrics.length
        : 0;
      
      setMetrics({
        deploymentSpeed: 50 + (Math.random() - 0.5) * 5,
        testAutomation: 100,
        avgDeploymentTime: avgTime,
        totalDeployments: completedPipelines.filter(p => p.status === "success").length,
        avgReviewTime,
        codeQuality: avgCodeQuality,
      });
    }, 2000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMounted, pipelines, reviews, developerMetrics]);

  // Draw pipeline visualization
  useEffect(() => {
    if (!isMounted || activeTab !== "cicd" || !pipelineSvgRef.current || !selectedPipeline) return;
    
    const pipeline = pipelines.find(p => p.id === selectedPipeline);
    if (!pipeline) return;
    
    const svg = d3.select(pipelineSvgRef.current);
    svg.selectAll("*").remove();
    
    const width = pipelineSvgRef.current.clientWidth || 800;
    const height = isMobile ? 200 : 150;
    svg.attr("width", width).attr("height", height);
    
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
    const stageWidth = chartWidth / pipeline.stages.length;
    const stageColors: Record<string, string> = {
      pending: "#999",
      running: "#3273dc",
      success: "#48c774",
      failed: "#ff3860",
      skipped: "#ffdd57",
    };
    
    pipeline.stages.forEach((stage, idx) => {
      const x = idx * stageWidth;
      const y = chartHeight / 2;
      
      // Stage box
      g.append("rect")
        .attr("x", x + 10)
        .attr("y", y - 30)
        .attr("width", stageWidth - 20)
        .attr("height", 60)
        .attr("fill", stageColors[stage.status])
        .attr("opacity", 0.8)
        .attr("rx", 4);
      
      // Stage name
      g.append("text")
        .attr("x", x + stageWidth / 2)
        .attr("y", y - 5)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(stage.name);
      
      // Duration
      if (stage.duration > 0) {
        g.append("text")
          .attr("x", x + stageWidth / 2)
          .attr("y", y + 15)
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .attr("font-size", "10px")
          .text(`${(stage.duration / 1000).toFixed(1)}s`);
      }
      
      // Arrow to next stage
      if (idx < pipeline.stages.length - 1) {
        g.append("line")
          .attr("x1", x + stageWidth - 10)
          .attr("y1", y)
          .attr("x2", x + stageWidth + 10)
          .attr("y2", y)
          .attr("stroke", "#999")
          .attr("stroke-width", 2)
          .attr("marker-end", "url(#arrowhead)");
      }
    });
    
    // Arrow marker
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 9)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 z")
      .attr("fill", "#999");
  }, [isMounted, activeTab, pipelines, selectedPipeline, isMobile]);

  if (!isMounted) return null;

  const selectedPipelineData = selectedPipeline ? pipelines.find(p => p.id === selectedPipeline) : null;
  const selectedReviewData = selectedReview ? reviews.find(r => r.id === selectedReview) : null;
  const runningPipelines = pipelines.filter(p => p.status === "running");
  const pendingReviews = reviews.filter(r => r.status === "pending");

  return (
    <div className="box liquid-glass-card">
      <h3 className="title is-5 mb-4 liquid-glass-text">Developer Productivity Platform</h3>
      
      {/* Tabs */}
      <div className="tabs is-boxed mb-4">
        <ul>
          <li className={activeTab === "cicd" ? "is-active" : ""}>
            <a
              onClick={() => setActiveTab("cicd")}
              onKeyDown={(e) => e.key === "Enter" && setActiveTab("cicd")}
              role="button"
              tabIndex={0}
              aria-label="CI/CD tab"
            >
              <span className="icon is-small mr-2">🚀</span>
              <span>CI/CD</span>
            </a>
          </li>
          <li className={activeTab === "review" ? "is-active" : ""}>
            <a
              onClick={() => setActiveTab("review")}
              onKeyDown={(e) => e.key === "Enter" && setActiveTab("review")}
              role="button"
              tabIndex={0}
              aria-label="Code Review tab"
            >
              <span className="icon is-small mr-2">👁️</span>
              <span>Code Review</span>
            </a>
          </li>
          <li className={activeTab === "analytics" ? "is-active" : ""}>
            <a
              onClick={() => setActiveTab("analytics")}
              onKeyDown={(e) => e.key === "Enter" && setActiveTab("analytics")}
              role="button"
              tabIndex={0}
              aria-label="Analytics tab"
            >
              <span className="icon is-small mr-2">📊</span>
              <span>Analytics</span>
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
              <span className="icon is-small mr-2">📈</span>
              <span>Metrics</span>
            </a>
          </li>
        </ul>
      </div>

      {/* User Controls */}
      <div className="box liquid-glass-card mb-4">
        <h4 className="title is-6 mb-3 liquid-glass-text">Controls</h4>
        <div className="columns is-multiline">
          <div className="column is-one-third-tablet is-half-mobile">
            <label className="checkbox liquid-glass-text">
              <input
                type="checkbox"
                checked={simulationEnabled}
                onChange={(e) => setSimulationEnabled(e.target.checked)}
                aria-label="Enable simulation"
              />
              {" "}Enable Simulation
            </label>
          </div>
          <div className="column is-one-third-tablet is-half-mobile">
            <label className="checkbox liquid-glass-text">
              <input
                type="checkbox"
                checked={autoDeployEnabled}
                onChange={(e) => setAutoDeployEnabled(e.target.checked)}
                aria-label="Enable auto deploy"
              />
              {" "}Auto Deploy
            </label>
          </div>
          <div className="column is-one-third-tablet is-half-mobile">
            <label className="checkbox liquid-glass-text">
              <input
                type="checkbox"
                checked={aiReviewEnabled}
                onChange={(e) => setAiReviewEnabled(e.target.checked)}
                aria-label="Enable AI review"
              />
              {" "}AI Code Review
            </label>
          </div>
          <div className="column is-full">
            <label className="label liquid-glass-text">
              Review Strictness: {reviewStrictness}/10
            </label>
            <input
              className="slider is-fullwidth"
              type="range"
              min="1"
              max="10"
              value={reviewStrictness}
              onChange={(e) => setReviewStrictness(Number(e.target.value))}
              aria-label="Review strictness"
            />
          </div>
        </div>
      </div>

      {/* CI/CD Tab */}
      {activeTab === "cicd" && (
        <div>
          <h4 className="title is-6 mb-3 liquid-glass-text">
            CI/CD Pipelines ({runningPipelines.length} running, {pipelines.length} total)
          </h4>
          
          {selectedPipelineData && (
            <div className="box liquid-glass-card mb-4">
              <div className="level mb-3">
                <div className="level-left">
                  <div className="level-item">
                    <div>
                      <p className="heading liquid-glass-text">Branch</p>
                      <p className="title is-6 liquid-glass-text">{selectedPipelineData.branch}</p>
                    </div>
                  </div>
                  <div className="level-item">
                    <div>
                      <p className="heading liquid-glass-text">Commit</p>
                      <p className="title is-6 liquid-glass-text">{selectedPipelineData.commit}</p>
                    </div>
                  </div>
                  <div className="level-item">
                    <div>
                      <p className="heading liquid-glass-text">Author</p>
                      <p className="title is-6 liquid-glass-text">{selectedPipelineData.author}</p>
                    </div>
                  </div>
                </div>
                <div className="level-right">
                  <div className="level-item">
                    <span className={`tag ${
                      selectedPipelineData.status === "success" ? "is-success" :
                      selectedPipelineData.status === "failed" ? "is-danger" : "is-info"
                    }`}>
                      {selectedPipelineData.status}
                    </span>
                  </div>
                </div>
              </div>
              <svg ref={pipelineSvgRef} className="is-fullwidth" style={{ height: isMobile ? "200px" : "150px" }} />
              <div className="content mt-3 liquid-glass-text">
                <p><strong>Duration:</strong> {(selectedPipelineData.duration / 1000).toFixed(1)}s</p>
                <p><strong>Stages:</strong></p>
                <ul>
                  {selectedPipelineData.stages.map(stage => (
                    <li key={stage.id}>
                      {stage.name}: <span className={`tag ${
                        stage.status === "success" ? "is-success" :
                        stage.status === "failed" ? "is-danger" :
                        stage.status === "running" ? "is-info" : "is-light"
                      }`}>
                        {stage.status}
                      </span> ({stage.duration > 0 ? `${(stage.duration / 1000).toFixed(1)}s` : "pending"})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          <div className="columns is-multiline">
            {pipelines.map(pipeline => (
              <div key={pipeline.id} className="column is-half-tablet is-full-mobile">
                <div
                  className={`box liquid-glass-card ${selectedPipeline === pipeline.id ? "has-background-info-light" : ""}`}
                  onClick={() => setSelectedPipeline(selectedPipeline === pipeline.id ? null : pipeline.id)}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedPipeline(selectedPipeline === pipeline.id ? null : pipeline.id)}
                  role="button"
                  tabIndex={0}
                  style={{ cursor: "pointer" }}
                >
                  <div className="level mb-2">
                    <div className="level-left">
                      <div className="level-item">
                        <p className="title is-6 liquid-glass-text">{pipeline.branch}</p>
                      </div>
                    </div>
                    <div className="level-right">
                      <div className="level-item">
                        <span className={`tag ${
                          pipeline.status === "success" ? "is-success" :
                          pipeline.status === "failed" ? "is-danger" : "is-info"
                        }`}>
                          {pipeline.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="heading liquid-glass-text">{pipeline.commit} by {pipeline.author}</p>
                  <div className="content is-small liquid-glass-text">
                    <p><strong>Stages:</strong> {pipeline.stages.filter(s => s.status === "success").length}/{pipeline.stages.length}</p>
                    <p><strong>Duration:</strong> {pipeline.duration > 0 ? `${(pipeline.duration / 1000).toFixed(1)}s` : "running..."}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Code Review Tab */}
      {activeTab === "review" && (
        <div>
          <h4 className="title is-6 mb-3 liquid-glass-text">
            Code Reviews ({pendingReviews.length} pending, {reviews.length} total)
          </h4>
          
          {selectedReviewData && (
            <div className="box liquid-glass-card mb-4">
              <h5 className="title is-6 liquid-glass-text">PR #{selectedReviewData.prNumber}: {selectedReviewData.title}</h5>
              <div className="content liquid-glass-text">
                <p><strong>Author:</strong> {selectedReviewData.author}</p>
                <p><strong>Reviewer:</strong> {selectedReviewData.reviewer}</p>
                <p><strong>Files Changed:</strong> {selectedReviewData.filesChanged}</p>
                <p><strong>Lines:</strong> +{selectedReviewData.linesAdded} / -{selectedReviewData.linesRemoved}</p>
                <p><strong>AI Suggestions:</strong> {selectedReviewData.aiSuggestions}</p>
                <p><strong>Issues Found:</strong> {selectedReviewData.issues.length}</p>
                
                <div className="table-container mt-3">
                  <table className="table is-fullwidth">
                    <thead>
                      <tr>
                        <th className="liquid-glass-text">Type</th>
                        <th className="liquid-glass-text">Severity</th>
                        <th className="liquid-glass-text">File</th>
                        <th className="liquid-glass-text">Message</th>
                        <th className="liquid-glass-text">Auto-fix</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReviewData.issues.map(issue => (
                        <tr key={issue.id}>
                          <td className="liquid-glass-text">{issue.type}</td>
                          <td>
                            <span className={`tag ${
                              issue.severity === "critical" ? "is-danger" :
                              issue.severity === "high" ? "is-warning" :
                              issue.severity === "medium" ? "is-info" : "is-light"
                            }`}>
                              {issue.severity}
                            </span>
                          </td>
                          <td className="liquid-glass-text">{issue.file}:{issue.line}</td>
                          <td className="liquid-glass-text">{issue.message}</td>
                          <td>
                            {issue.autoFixable ? (
                              <span className="tag is-success">Yes</span>
                            ) : (
                              <span className="tag is-light">No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          <div className="columns is-multiline">
            {reviews.map(review => (
              <div key={review.id} className="column is-half-tablet is-full-mobile">
                <div
                  className={`box liquid-glass-card ${selectedReview === review.id ? "has-background-info-light" : ""}`}
                  onClick={() => setSelectedReview(selectedReview === review.id ? null : review.id)}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedReview(selectedReview === review.id ? null : review.id)}
                  role="button"
                  tabIndex={0}
                  style={{ cursor: "pointer" }}
                >
                  <div className="level mb-2">
                    <div className="level-left">
                      <div className="level-item">
                        <p className="title is-6 liquid-glass-text">PR #{review.prNumber}</p>
                      </div>
                    </div>
                    <div className="level-right">
                      <div className="level-item">
                        <span className={`tag ${
                          review.status === "merged" ? "is-success" :
                          review.status === "approved" ? "is-info" :
                          review.status === "changes-requested" ? "is-warning" : "is-light"
                        }`}>
                          {review.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="heading liquid-glass-text">{review.title}</p>
                  <div className="content is-small liquid-glass-text">
                    <p><strong>Author:</strong> {review.author} | <strong>Reviewer:</strong> {review.reviewer}</p>
                    <p><strong>Issues:</strong> {review.issues.length} | <strong>AI Suggestions:</strong> {review.aiSuggestions}</p>
                    <p><strong>Changes:</strong> +{review.linesAdded} / -{review.linesRemoved}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div>
          <h4 className="title is-6 mb-3 liquid-glass-text">Developer Analytics</h4>
          <div className="table-container">
            <table className="table is-fullwidth">
              <thead>
                <tr>
                  <th className="liquid-glass-text">Developer</th>
                  <th className="liquid-glass-text">Commits</th>
                  <th className="liquid-glass-text">Deployments</th>
                  <th className="liquid-glass-text">Review Time</th>
                  <th className="liquid-glass-text">Test Coverage</th>
                  <th className="liquid-glass-text">Code Quality</th>
                  <th className="liquid-glass-text">Productivity</th>
                </tr>
              </thead>
              <tbody>
                {developerMetrics.map(metric => (
                  <tr key={metric.developer}>
                    <td className="liquid-glass-text">{metric.developer}</td>
                    <td className="liquid-glass-text">{metric.commits}</td>
                    <td className="liquid-glass-text">{metric.deployments}</td>
                    <td className="liquid-glass-text">{metric.codeReviewTime.toFixed(1)}h</td>
                    <td className="liquid-glass-text">
                      <progress
                        className="progress is-info"
                        value={metric.testCoverage}
                        max={100}
                        aria-label={`Test coverage: ${metric.testCoverage}%`}
                      >
                        {metric.testCoverage}%
                      </progress>
                    </td>
                    <td className="liquid-glass-text">
                      <progress
                        className="progress is-success"
                        value={metric.codeQuality}
                        max={100}
                        aria-label={`Code quality: ${metric.codeQuality}%`}
                      >
                        {metric.codeQuality}%
                      </progress>
                    </td>
                    <td className="liquid-glass-text">
                      <progress
                        className="progress is-warning"
                        value={metric.productivity}
                        max={100}
                        aria-label={`Productivity: ${metric.productivity}%`}
                      >
                        {metric.productivity}%
                      </progress>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === "metrics" && (
        <div>
          <h4 className="title is-6 mb-3 liquid-glass-text">Platform Metrics</h4>
          <div className="columns is-multiline">
            <div className="column is-one-third-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-success-light">
                <p className="heading liquid-glass-text">Deployment Speed</p>
                <p className="title is-4 liquid-glass-text">{metrics.deploymentSpeed.toFixed(1)}% Faster</p>
              </div>
            </div>
            <div className="column is-one-third-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-info-light">
                <p className="heading liquid-glass-text">Test Automation</p>
                <p className="title is-4 liquid-glass-text">{metrics.testAutomation}%</p>
              </div>
            </div>
            <div className="column is-one-third-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-warning-light">
                <p className="heading liquid-glass-text">Avg Deployment Time</p>
                <p className="title is-4 liquid-glass-text">{metrics.avgDeploymentTime.toFixed(1)}s</p>
              </div>
            </div>
            <div className="column is-one-third-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-info-light">
                <p className="heading liquid-glass-text">Total Deployments</p>
                <p className="title is-4 liquid-glass-text">{metrics.totalDeployments}</p>
              </div>
            </div>
            <div className="column is-one-third-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-success-light">
                <p className="heading liquid-glass-text">Avg Review Time</p>
                <p className="title is-4 liquid-glass-text">{metrics.avgReviewTime.toFixed(1)}h</p>
              </div>
            </div>
            <div className="column is-one-third-tablet is-half-mobile">
              <div className="box liquid-glass-card has-background-warning-light">
                <p className="heading liquid-glass-text">Code Quality</p>
                <p className="title is-4 liquid-glass-text">{metrics.codeQuality.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          <div className="content mt-4 liquid-glass-text">
            <h5 className="title is-6 mb-3">Features</h5>
            <ul>
              <li>Automated testing frameworks with comprehensive coverage</li>
              <li>Intelligent code review systems with AI assistance</li>
              <li>CI/CD pipeline automation with deployment tracking</li>
              <li>Developer analytics and productivity metrics</li>
              <li>Code quality metrics and trend analysis</li>
              <li>Automated code fixes and suggestions</li>
              <li>Real-time pipeline monitoring and alerting</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
