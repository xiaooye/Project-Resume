"use client";

import { useMemo } from "react";
import { Skill } from "@/types";
import { skillsData, skillCategories } from "@/data/skills";

function getDepthLabel(level: number): string {
  if (level >= 90) return "Daily use";
  if (level >= 80) return "Frequent";
  if (level >= 70) return "Proficient";
  return "Capable";
}

export default function SkillsPage() {
  const groupedSkills = useMemo(() => {
    const groups: Record<string, Skill[]> = {};
    skillsData.forEach((skill) => {
      if (!groups[skill.category]) groups[skill.category] = [];
      groups[skill.category].push(skill);
    });
    return groups;
  }, []);

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "780px" }}>
        <h1 className="title is-2 font-display mb-2">Technical Skills</h1>
        <p className="text-secondary mb-6" style={{ lineHeight: 1.7 }}>
          Core technologies I use in production. Curated for depth — these are the tools
          I reach for daily, not a list of everything I've touched.
        </p>

        {skillCategories.map((cat) => {
          const skills = groupedSkills[cat.name];
          if (!skills || skills.length === 0) return null;

          return (
            <div key={cat.name} className="mb-5">
              <h2
                className="title is-5 mb-3 liquid-glass-text"
                style={{
                  borderBottom: "1px solid rgba(128,128,128,0.15)",
                  paddingBottom: "0.5rem",
                }}
              >
                {cat.label}
              </h2>

              <div className="columns is-multiline">
                {skills.map((skill) => (
                  <div key={skill.name} className="column is-half">
                    <div style={{ padding: "0.5rem 0" }}>
                      <div className="is-flex is-justify-content-space-between is-align-items-center">
                        <div>
                          <span className="liquid-glass-text has-text-weight-bold">
                            {skill.name}
                          </span>
                          <span className="text-secondary" style={{ marginLeft: "0.5rem", fontSize: "0.85rem" }}>
                            {skill.yearsOfExperience} yr{skill.yearsOfExperience !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <span
                          className="tag is-light is-small"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {getDepthLabel(skill.level)}
                        </span>
                      </div>
                      <div className="skill-bar-track">
                        <div className="skill-bar-fill" style={{ width: `${skill.level}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
