"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Project } from "@/types";
import { getProjectIcon } from "@/data/projects";
import Link from "next/link";
import EnterpriseMicroservicesDemo from "./EnterpriseMicroservicesDemo";

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
    switch (project.id) {
      case "1":
        return <EnterpriseMicroservicesDemo project={project} />;
      case "2":
        return <DistributedMonitoringDemo project={project} />;
      case "3":
        return <MultiTenantSaaSDemo project={project} />;
      case "4":
        return <HighPerformanceAPIGatewayDemo project={project} />;
      case "5":
        return <RealTimeDataStreamingDemo project={project} />;
      case "6":
        return <AutoScalingInfrastructureDemo project={project} />;
      case "7":
        return <EnterpriseTypeScriptFrameworkDemo project={project} />;
      case "8":
        return <ComponentDesignSystemDemo project={project} />;
      case "9":
        return <DeveloperProductivityDemo project={project} />;
      case "10":
        return <CostOptimizationAnalyticsDemo project={project} />;
      case "11":
        return <PerformanceOptimizationDemo project={project} />;
      case "12":
        return <ScalableEcommerceDemo project={project} />;
      case "13":
        return <GraphQLFederationDemo project={project} />;
      case "14":
        return <ServerlessApplicationFrameworkDemo project={project} />;
      case "15":
        return <RealTimeCollaborationDemo project={project} />;
      case "16":
        return <EventDrivenArchitectureDemo project={project} />;
      case "17":
        return <DistributedCacheDemo project={project} />;
      case "18":
        return <APIRateLimitingDemo project={project} />;
      case "19":
        return <SecurityAuditComplianceDemo project={project} />;
      case "20":
        return <IdentityAccessManagementDemo project={project} />;
      case "21":
        return <BigDataProcessingEngineDemo project={project} />;
      default:
        return <DefaultProjectDemo project={project} />;
    }
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

// Import specific demo components
import EnterpriseMicroservicesDemo from "./EnterpriseMicroservicesDemo";

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

