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
  // Add more projects here as you build them:
  // {
  //   slug: "next-project",
  //   title: "Project Name",
  //   tagline: "One-line summary",
  //   description: "Detailed description...",
  //   url: "https://...",
  //   tags: ["Tag1", "Tag2"],
  //   stack: ["Tech1", "Tech2"],
  //   highlights: ["Highlight 1", "Highlight 2"],
  //   status: "live",
  // },
];
