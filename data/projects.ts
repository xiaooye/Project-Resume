export interface ShowcaseProject {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  url: string;
  githubUrl?: string;
  image?: string;
  tags: string[];
  stack: string[];
  highlights: string[];
  status: "live" | "in-progress" | "planned";
}

export const projects: ShowcaseProject[] = [
  {
    slug: "thread-ecommerce",
    title: "THREAD — E-Commerce Platform",
    tagline: "Full-stack headless commerce with custom modules and demo mode architecture",
    description:
      "A complete e-commerce storefront built on Medusa.js v2 (headless commerce engine) and Next.js 15. Features custom backend modules for reviews and webhooks, event-driven architecture with 6 subscribers, and a novel demo mode pattern that lets the site run fully without a live backend. 280+ components, 59 test files, warm editorial design system.",
    url: "https://ecom.wei-dev.com",
    githubUrl: "https://github.com/xiaooye/ecom",
    tags: ["E-Commerce", "Full Stack", "Architecture"],
    stack: ["Next.js 15", "React 19", "Medusa.js v2", "PostgreSQL", "Redis", "Stripe", "Tailwind v4", "TypeScript"],
    highlights: [
      "Custom Medusa modules (reviews, webhooks) with model, service, migrations, and admin widgets",
      "Demo mode data wrapper pattern — tries real API, falls back to typed static data",
      "280+ components, 12 custom hooks, 5 Zustand stores, 59 test files",
      "Warm editorial design system with Playfair Display serif + product imagery",
    ],
    status: "live",
  },
  {
    slug: "datapilot",
    title: "DataPilot — AI Data Analysis",
    tagline: "Upload a CSV and get instant insights, charts, and natural-language Q&A",
    description:
      "An AI-powered data analysis platform built on Next.js 16 and React 19. Features client-side CSV parsing, auto-generated charts via Recharts, anomaly detection, and a streaming chat interface for natural-language data exploration. Uses OpenRouter for LLM inference with server-sent events for real-time responses.",
    url: "https://data.wei-dev.com",
    tags: ["AI", "Data Visualization", "Full Stack"],
    stack: ["Next.js 16", "React 19", "TypeScript", "Tailwind v4", "Zustand", "Recharts", "Streaming SSE"],
    highlights: [
      "Client-side CSV parsing with Papa Parse — raw data never leaves the browser",
      "Auto-generated chart recommendations (bar, line, pie, scatter) based on column types",
      "Streaming SSE chat interface for natural-language data Q&A",
      "Anomaly detection with statistical analysis and AI-powered insights",
    ],
    status: "live",
  },
  {
    slug: "teampilot",
    title: "TeamPilot — SaaS Workspace Platform",
    tagline: "White-label multi-tenant collaboration platform with real-time features",
    description:
      "A production-grade SaaS workspace platform with multi-tenancy, real-time chat, Kanban boards, calendar, CMS with Tiptap block editor, and AI integration. Features white-label portal customization, role-based access control, and workspace-level theming.",
    url: "https://cms.wei-dev.com",
    tags: ["SaaS", "Multi-Tenant", "Real-Time"],
    stack: ["Next.js 16", "React 19", "Prisma", "PostgreSQL", "Redis", "NextAuth", "Tailwind v4", "TypeScript"],
    highlights: [
      "Multi-tenant architecture with workspace-level isolation and RBAC",
      "Real-time chat with channels, typing indicators, and presence via SWR polling",
      "Drag-and-drop Kanban board with dnd-kit, priorities, assignees, and labels",
      "White-label portal with customizable branding, navigation, and feature flags",
    ],
    status: "live",
  },
];
