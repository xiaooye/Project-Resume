import { Skill } from "@/types";

// Skills data - curated top 20 production tools (5 years total professional experience)
export const skillsData: Skill[] = [
  // Core Languages
  { name: "TypeScript", level: 95, category: "Core Languages", yearsOfExperience: 4 },
  { name: "JavaScript", level: 98, category: "Core Languages", yearsOfExperience: 5 },
  { name: "SQL", level: 90, category: "Core Languages", yearsOfExperience: 5 },
  { name: "Python", level: 85, category: "Core Languages", yearsOfExperience: 3 },

  // Frontend
  { name: "Vue.js", level: 95, category: "Frontend", yearsOfExperience: 4 },
  { name: "React", level: 92, category: "Frontend", yearsOfExperience: 3 },
  { name: "Nuxt.js", level: 90, category: "Frontend", yearsOfExperience: 3 },
  { name: "Next.js", level: 90, category: "Frontend", yearsOfExperience: 3 },
  { name: "Tailwind CSS", level: 92, category: "Frontend", yearsOfExperience: 3 },

  // Backend
  { name: "Node.js", level: 92, category: "Backend", yearsOfExperience: 5 },
  { name: "Fastify", level: 85, category: "Backend", yearsOfExperience: 2 },
  { name: "GraphQL", level: 85, category: "Backend", yearsOfExperience: 3 },
  { name: "PostgreSQL", level: 90, category: "Backend", yearsOfExperience: 4 },
  { name: "Redis", level: 82, category: "Backend", yearsOfExperience: 3 },

  // AI & Tooling
  { name: "Claude API", level: 90, category: "AI & Tooling", yearsOfExperience: 2 },
  { name: "RAG Pipelines", level: 85, category: "AI & Tooling", yearsOfExperience: 1 },
  { name: "MCP Servers", level: 88, category: "AI & Tooling", yearsOfExperience: 1 },

  // DevOps
  { name: "Docker", level: 88, category: "DevOps", yearsOfExperience: 4 },
  { name: "CI/CD", level: 88, category: "DevOps", yearsOfExperience: 4 },
  { name: "AWS", level: 85, category: "DevOps", yearsOfExperience: 3 },
];

// Skill icon mapping
export const skillIcons: Record<string, string> = {};

// Get skill icon
export function getSkillIcon(skillName: string): string {
  return skillIcons[skillName] || "";
}

// Skill category configuration
export const skillCategories = [
  { name: "Core Languages", label: "Core Languages", color: "is-primary" },
  { name: "Frontend", label: "Frontend", color: "is-info" },
  { name: "Backend", label: "Backend", color: "is-success" },
  { name: "AI & Tooling", label: "AI & Tooling", color: "is-dark" },
  { name: "DevOps", label: "DevOps", color: "is-warning" },
];
