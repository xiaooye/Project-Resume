"use client";

import { useEffect, useState } from "react";
import { Project } from "@/types";

export default function ComponentDesignSystemDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="box liquid-glass-card">
      <h3 className="title is-5 mb-4 liquid-glass-text">Component Design System</h3>
      <div className="content liquid-glass-text">
        <h4 className="title is-6 mb-3">System Overview</h4>
        <div className="columns">
          <div className="column">
            <div className="box liquid-glass-card has-background-info-light">
              <p className="heading liquid-glass-text">Components</p>
              <p className="title is-4 liquid-glass-text">100+</p>
            </div>
          </div>
          <div className="column">
            <div className="box liquid-glass-card has-background-success-light">
              <p className="heading liquid-glass-text">Test Coverage</p>
              <p className="title is-4 liquid-glass-text">80%+</p>
            </div>
          </div>
          <div className="column">
            <div className="box liquid-glass-card has-background-warning-light">
              <p className="heading liquid-glass-text">WCAG Compliance</p>
              <p className="title is-4 liquid-glass-text">AAA</p>
            </div>
          </div>
        </div>
        <h4 className="title is-6 mt-4 mb-3">Features</h4>
        <ul>
          <li>Comprehensive component library with 100+ reusable components</li>
          <li>Full Storybook integration for component documentation</li>
          <li>WCAG 2.2 AAA accessibility compliance</li>
          <li>Extensive test coverage with React Testing Library</li>
          <li>Theming and internationalization support</li>
        </ul>
      </div>
    </div>
  );
}

