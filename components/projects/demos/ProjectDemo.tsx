"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Project } from "@/types";
import { getProjectIcon } from "@/data/projects";
import Link from "next/link";

interface ProjectDemoProps {
  project: Project;
}

export default function ProjectDemo({ project }: ProjectDemoProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

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

  if (!isMounted) {
    return null;
  }

  // Map project ID to specific demo component
  const getDemoComponent = () => {
    const componentMap: Record<string, () => JSX.Element> = {
      "1": () => <EnterpriseMicroservicesDemo project={project} />,
      "2": () => <DistributedMonitoringDemo project={project} />,
      "3": () => <MultiTenantSaaSDemo project={project} />,
      "4": () => <HighPerformanceAPIGatewayDemo project={project} />,
      "5": () => <RealTimeDataStreamingDemo project={project} />,
      "6": () => <AutoScalingInfrastructureDemo project={project} />,
      "7": () => <EnterpriseTypeScriptFrameworkDemo project={project} />,
      "8": () => <ComponentDesignSystemDemo project={project} />,
      "9": () => <DeveloperProductivityDemo project={project} />,
      "10": () => <CostOptimizationAnalyticsDemo project={project} />,
      "11": () => <PerformanceOptimizationDemo project={project} />,
      "12": () => <ScalableEcommerceDemo project={project} />,
      "13": () => <GraphQLFederationDemo project={project} />,
      "14": () => <ServerlessApplicationFrameworkDemo project={project} />,
      "15": () => <RealTimeCollaborationDemo project={project} />,
      "16": () => <EventDrivenArchitectureDemo project={project} />,
      "17": () => <DistributedCacheDemo project={project} />,
      "18": () => <APIRateLimitingDemo project={project} />,
      "19": () => <SecurityAuditComplianceDemo project={project} />,
      "20": () => <IdentityAccessManagementDemo project={project} />,
      "21": () => <BigDataProcessingEngineDemo project={project} />,
    };

    const Component = componentMap[project.id];
    return Component ? <Component /> : <DefaultProjectDemo project={project} />;
  };

  return (
    <div className="section">
      <div className="container">
        {/* Header */}
        <div className="box liquid-glass-card mb-6">
          <div className="is-flex is-justify-content-space-between is-align-items-center mb-4">
            <div className="is-flex is-align-items-center">
              <span className="is-size-1 mr-3" role="img" aria-label={project.title}>
                {getProjectIcon(project.title)}
              </span>
              <div>
                <h1 className="title is-2 mb-2 liquid-glass-text">{project.title}</h1>
                <p className="subtitle is-5 liquid-glass-text">{project.category}</p>
              </div>
            </div>
            <Link
              href="/projects"
              className="button is-light liquid-glass-button"
              aria-label="Back to projects"
            >
              <span className="icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M10 12L6 8L10 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span>Back to Projects</span>
            </Link>
          </div>

          {project.description && (
            <p className="content is-medium liquid-glass-text">{project.description}</p>
          )}

          {project.longDescription && (
            <div className="content mt-4">
              <p className="liquid-glass-text">{project.longDescription}</p>
            </div>
          )}

          {/* Project Metadata */}
          <div className="tags mt-4">
            <span className="tag is-info">{project.status}</span>
            <span className="tag is-warning">{project.complexity}</span>
            {project.featured && <span className="tag is-success">Featured</span>}
            {project.startDate && (
              <span className="tag is-light">
                Started: {new Date(project.startDate).toLocaleDateString()}
              </span>
            )}
            {project.completionDate && (
              <span className="tag is-light">
                Completed: {new Date(project.completionDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Demo Content */}
        {getDemoComponent()}
      </div>
    </div>
  );
}

// Default demo component for projects without specific demos
function DefaultProjectDemo({ project }: { project: Project }) {
  return (
    <div className="box liquid-glass-card">
      <h2 className="title is-4 mb-4 liquid-glass-text">Project Overview</h2>
      <div className="content">
        <h3 className="title is-5 liquid-glass-text">Technologies</h3>
        <div className="tags">
          {project.technologies.map((tech) => (
            <span key={tech} className="tag is-primary">
              {tech}
            </span>
          ))}
        </div>

        {project.metrics && (
          <>
            <h3 className="title is-5 mt-5 liquid-glass-text">Key Metrics</h3>
            <div className="columns">
              {project.metrics.performance && (
                <div className="column">
                  <div className="box liquid-glass-card has-background-info-light">
                    <p className="heading liquid-glass-text">Performance</p>
                    <p className="title is-5 liquid-glass-text">{project.metrics.performance}</p>
                  </div>
                </div>
              )}
              {project.metrics.scale && (
                <div className="column">
                  <div className="box liquid-glass-card has-background-success-light">
                    <p className="heading liquid-glass-text">Scale</p>
                    <p className="title is-5 liquid-glass-text">{project.metrics.scale}</p>
                  </div>
                </div>
              )}
              {project.metrics.cost && (
                <div className="column">
                  <div className="box liquid-glass-card has-background-warning-light">
                    <p className="heading liquid-glass-text">Cost</p>
                    <p className="title is-5 liquid-glass-text">{project.metrics.cost}</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {project.highlights && project.highlights.length > 0 && (
          <>
            <h3 className="title is-5 mt-5 liquid-glass-text">Key Highlights</h3>
            <ul>
              {project.highlights.map((highlight, index) => (
                <li key={index} className="liquid-glass-text">{highlight}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

// Placeholder components for each project - will be implemented
function EnterpriseMicroservicesDemo({ project }: { project: Project }) {
  return <DefaultProjectDemo project={project} />;
}

function DistributedMonitoringDemo({ project }: { project: Project }) {
  return <DefaultProjectDemo project={project} />;
}

function MultiTenantSaaSDemo({ project }: { project: Project }) {
  return <DefaultProjectDemo project={project} />;
}

function HighPerformanceAPIGatewayDemo({ project }: { project: Project }) {
  return <DefaultProjectDemo project={project} />;
}

function RealTimeDataStreamingDemo({ project }: { project: Project }) {
  return <DefaultProjectDemo project={project} />;
}

function AutoScalingInfrastructureDemo({ project }: { project: Project }) {
  return <DefaultProjectDemo project={project} />;
}

function EnterpriseTypeScriptFrameworkDemo({ project }: { project: Project }) {
  return <DefaultProjectDemo project={project} />;
}

function ComponentDesignSystemDemo({ project }: { project: Project }) {
  return <DefaultProjectDemo project={project} />;
}

function DeveloperProductivityDemo({ project }: { project: Project }) {
  return <DefaultProjectDemo project={project} />;
}

function CostOptimizationAnalyticsDemo({ project }: { project: Project }) {
  return <DefaultProjectDemo project={project} />;
}

function PerformanceOptimizationDemo({ project }: { project: Project }) {
  return <DefaultProjectDemo project={project} />;
}

function ScalableEcommerceDemo({ project }: { project: Project }) {
  return <DefaultProjectDemo project={project} />;
}

function GraphQLFederationDemo({ project }: { project: Project }) {
  return <DefaultProjectDemo project={project} />;
}

function ServerlessApplicationFrameworkDemo({ project }: { project: Project }) {
  return <DefaultProjectDemo project={project} />;
}

function RealTimeCollaborationDemo({ project }: { project: Project }) {
  return <DefaultProjectDemo project={project} />;
}

function EventDrivenArchitectureDemo({ project }: { project: Project }) {
  return <DefaultProjectDemo project={project} />;
}

function DistributedCacheDemo({ project }: { project: Project }) {
  return <DefaultProjectDemo project={project} />;
}

function APIRateLimitingDemo({ project }: { project: Project }) {
  return <DefaultProjectDemo project={project} />;
}

function SecurityAuditComplianceDemo({ project }: { project: Project }) {
  return <DefaultProjectDemo project={project} />;
}

function IdentityAccessManagementDemo({ project }: { project: Project }) {
  return <DefaultProjectDemo project={project} />;
}

function BigDataProcessingEngineDemo({ project }: { project: Project }) {
  return <DefaultProjectDemo project={project} />;
}

