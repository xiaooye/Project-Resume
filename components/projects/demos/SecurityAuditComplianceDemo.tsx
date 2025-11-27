"use client";

import { useEffect, useState } from "react";
import { Project } from "@/types";

interface SecurityIssue {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "fixed" | "ignored";
  description: string;
}

export default function SecurityAuditComplianceDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);
  const [issues, setIssues] = useState<SecurityIssue[]>([]);
  const [compliance, setCompliance] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    setIssues([
      { id: "1", type: "XSS", severity: "high", status: "open", description: "Potential XSS vulnerability in user input" },
      { id: "2", type: "SQL Injection", severity: "critical", status: "fixed", description: "SQL injection risk in query builder" },
      { id: "3", type: "CSRF", severity: "medium", status: "open", description: "Missing CSRF token validation" },
      { id: "4", type: "Authentication", severity: "low", status: "fixed", description: "Weak password policy" },
    ]);
    setCompliance(85);
  }, []);

  if (!isMounted) return null;

  const criticalIssues = issues.filter(i => i.severity === "critical").length;
  const highIssues = issues.filter(i => i.severity === "high").length;
  const fixedIssues = issues.filter(i => i.status === "fixed").length;

  return (
    <div className="box liquid-glass-card">
      <h3 className="title is-5 mb-4 liquid-glass-text">Security Audit & Compliance</h3>
      <div className="columns mb-4">
        <div className="column">
          <div className="box liquid-glass-card has-background-danger-light">
            <p className="heading liquid-glass-text">Critical Issues</p>
            <p className="title is-4 liquid-glass-text">{criticalIssues}</p>
          </div>
        </div>
        <div className="column">
          <div className="box liquid-glass-card has-background-warning-light">
            <p className="heading liquid-glass-text">High Issues</p>
            <p className="title is-4 liquid-glass-text">{highIssues}</p>
          </div>
        </div>
        <div className="column">
          <div className="box liquid-glass-card has-background-success-light">
            <p className="heading liquid-glass-text">Fixed</p>
            <p className="title is-4 liquid-glass-text">{fixedIssues}</p>
          </div>
        </div>
        <div className="column">
          <div className="box liquid-glass-card has-background-info-light">
            <p className="heading liquid-glass-text">Compliance</p>
            <p className="title is-4 liquid-glass-text">{compliance}%</p>
          </div>
        </div>
      </div>
      <div className="table-container">
        <table className="table is-fullwidth">
          <thead>
            <tr>
              <th className="liquid-glass-text">Type</th>
              <th className="liquid-glass-text">Severity</th>
              <th className="liquid-glass-text">Status</th>
              <th className="liquid-glass-text">Description</th>
            </tr>
          </thead>
          <tbody>
            {issues.map(issue => {
              const severityColor = 
                issue.severity === "critical" ? "is-danger" :
                issue.severity === "high" ? "is-warning" :
                issue.severity === "medium" ? "is-info" : "is-light";
              
              const statusColor = 
                issue.status === "fixed" ? "is-success" :
                issue.status === "ignored" ? "is-light" : "is-danger";
              
              return (
                <tr key={issue.id}>
                  <td className="liquid-glass-text">{issue.type}</td>
                  <td>
                    <span className={`tag ${severityColor}`}>
                      {issue.severity}
                    </span>
                  </td>
                  <td>
                    <span className={`tag ${statusColor}`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="liquid-glass-text">{issue.description}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

