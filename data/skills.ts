import { Skill } from "@/types";

// Skill icon mapping (using emoji and text icons)
export const skillIcons: Record<string, string> = {
  TypeScript: "📘",
  JavaScript: "📜",
  Python: "🐍",
  React: "⚛️",
  "Next.js": "▲",
  "Node.js": "🟢",
  GraphQL: "🔷",
  AWS: "☁️",
  Azure: "🔷",
  Docker: "🐳",
  Kubernetes: "☸️",
  WebAssembly: "🔷",
  WebRTC: "📡",
  "Machine Learning": "🤖",
  "Vue.js": "💚",
  Angular: "🔴",
  "Express.js": "⚡",
  MongoDB: "🍃",
  PostgreSQL: "🐘",
  Redis: "🔴",
  Git: "📦",
  "CI/CD": "🔄",
  Linux: "🐧",
};

// Skills data
export const skillsData: Skill[] = [
  { name: "TypeScript", level: 95, category: "Languages", yearsOfExperience: 8 },
  { name: "JavaScript", level: 98, category: "Languages", yearsOfExperience: 10 },
  { name: "Python", level: 85, category: "Languages", yearsOfExperience: 6 },
  { name: "React", level: 95, category: "Frontend", yearsOfExperience: 8 },
  { name: "Next.js", level: 90, category: "Frontend", yearsOfExperience: 5 },
  { name: "Node.js", level: 92, category: "Backend", yearsOfExperience: 8 },
  { name: "GraphQL", level: 85, category: "Backend", yearsOfExperience: 4 },
  { name: "AWS", level: 88, category: "Cloud", yearsOfExperience: 6 },
  { name: "Azure", level: 82, category: "Cloud", yearsOfExperience: 4 },
  { name: "Docker", level: 90, category: "DevOps", yearsOfExperience: 5 },
  { name: "Kubernetes", level: 80, category: "DevOps", yearsOfExperience: 3 },
  { name: "WebAssembly", level: 75, category: "Advanced", yearsOfExperience: 2 },
  { name: "WebRTC", level: 78, category: "Advanced", yearsOfExperience: 3 },
  { name: "Machine Learning", level: 70, category: "AI/ML", yearsOfExperience: 3 },
];

// Get skill icon
export function getSkillIcon(skillName: string): string {
  return skillIcons[skillName] || "💻";
}

// Skill category configuration
export const skillCategories = [
  { name: "Languages", label: "编程语言", color: "is-primary" },
  { name: "Frontend", label: "前端技术", color: "is-info" },
  { name: "Backend", label: "后端技术", color: "is-success" },
  { name: "Cloud", label: "云服务", color: "is-warning" },
  { name: "DevOps", label: "DevOps", color: "is-danger" },
  { name: "Advanced", label: "高级技术", color: "is-link" },
  { name: "AI/ML", label: "AI/ML", color: "is-dark" },
];

