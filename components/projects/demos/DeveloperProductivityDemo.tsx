"use client";

import { useEffect, useState } from "react";
import { Project } from "@/types";

export default function DeveloperProductivityDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="box liquid-glass-card">
      <h3 className="title is-5 mb-4 liquid-glass-text">Developer Productivity Platform</h3>
      <div className="content liquid-glass-text">
        <h4 className="title is-6 mb-3">Platform Metrics</h4>
        <div className="columns">
          <div className="column">
            <div className="box liquid-glass-card has-background-success-light">
              <p className="heading liquid-glass-text">Deployment Speed</p>
              <p className="title is-4 liquid-glass-text">50% Faster</p>
            </div>
          </div>
          <div className="column">
            <div className="box liquid-glass-card has-background-info-light">
              <p className="heading liquid-glass-text">Test Automation</p>
              <p className="title is-4 liquid-glass-text">100%</p>
            </div>
          </div>
          <div className="column">
            <div className="box liquid-glass-card has-background-warning-light">
              <p className="heading liquid-glass-text">Code Review</p>
              <p className="title is-4 liquid-glass-text">Automated</p>
            </div>
          </div>
        </div>
        <h4 className="title is-6 mt-4 mb-3">Features</h4>
        <ul>
          <li>Automated testing frameworks with comprehensive coverage</li>
          <li>Intelligent code review systems with AI assistance</li>
          <li>CI/CD pipeline automation with deployment tracking</li>
          <li>Developer analytics and productivity metrics</li>
          <li>Code quality metrics and trend analysis</li>
        </ul>
      </div>
    </div>
  );
}

