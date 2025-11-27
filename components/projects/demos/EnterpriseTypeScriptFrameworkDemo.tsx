"use client";

import { useEffect, useState } from "react";
import { Project } from "@/types";

export default function EnterpriseTypeScriptFrameworkDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="box liquid-glass-card">
      <h3 className="title is-5 mb-4 liquid-glass-text">Enterprise TypeScript Framework</h3>
      <div className="content liquid-glass-text">
        <h4 className="title is-6 mb-3">Framework Features</h4>
        <ul>
          <li><strong>Advanced Type System:</strong> Utility types, conditional types, mapped types</li>
          <li><strong>Code Generation:</strong> Automated code generation from schemas and types</li>
          <li><strong>Developer Tooling:</strong> Custom ESLint rules, Babel plugins, AST manipulation</li>
          <li><strong>Best Practices:</strong> Enforced coding standards and patterns</li>
        </ul>
        <h4 className="title is-6 mt-4 mb-3">Adoption Metrics</h4>
        <div className="columns">
          <div className="column">
            <div className="box liquid-glass-card has-background-info-light">
              <p className="heading liquid-glass-text">Teams Using</p>
              <p className="title is-4 liquid-glass-text">50+</p>
            </div>
          </div>
          <div className="column">
            <div className="box liquid-glass-card has-background-success-light">
              <p className="heading liquid-glass-text">Code Quality</p>
              <p className="title is-4 liquid-glass-text">+40%</p>
            </div>
          </div>
          <div className="column">
            <div className="box liquid-glass-card has-background-warning-light">
              <p className="heading liquid-glass-text">Productivity</p>
              <p className="title is-4 liquid-glass-text">+30%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

