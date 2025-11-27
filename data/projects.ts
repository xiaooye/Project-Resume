import { Project } from "@/types";

// Project icon mapping
export const projectIcons: Record<string, string> = {
  "Enterprise Microservices Platform": "🏗️",
  "Distributed System Monitoring Platform": "📊",
  "Multi-Tenant SaaS Architecture": "🏢",
  "High-Performance API Gateway": "🚪",
  "Real-time Data Streaming Pipeline": "🌊",
  "Auto-Scaling Infrastructure Platform": "📈",
  "Enterprise TypeScript Framework": "📘",
  "Component Design System": "🎨",
  "Developer Productivity Platform": "⚡",
  "Cost Optimization Analytics Platform": "💰",
  "Performance Optimization Platform": "⚡",
  "Scalable E-commerce Platform": "🛒",
  "GraphQL Federation Platform": "🔷",
  "Serverless Application Framework": "☁️",
  "Real-time Collaboration Platform": "👥",
  "Event-Driven Architecture Platform": "📡",
  "Distributed Cache System": "💾",
  "API Rate Limiting & Throttling System": "🛡️",
  "Security Audit & Compliance Platform": "🔒",
  "Identity & Access Management System": "🔐",
  "Big Data Processing Engine": "📊",
};

// Get project icon
export function getProjectIcon(projectTitle: string): string {
  return projectIcons[projectTitle] || "💻";
}

// Project categories (matching skill categories)
export const projectCategories = [
  "Languages",
  "Frontend",
  "Backend",
  "Cloud",
  "DevOps",
  "Advanced",
  "AI/ML",
];

// All projects data
export const projectsData: Project[] = [
  // System Architecture & Design Projects
  {
    id: "1",
    title: "Enterprise Microservices Platform",
    description:
      "Production-ready microservices platform with service mesh, circuit breakers, distributed tracing, and auto-scaling. Handles 10M+ requests/day with 99.9% uptime.",
    longDescription:
      "A comprehensive enterprise-grade microservices platform designed for high availability and scalability. Features include service mesh architecture with Istio integration, circuit breaker patterns for fault tolerance, distributed tracing with OpenTelemetry, and intelligent auto-scaling based on real-time metrics. The platform supports horizontal scaling across multiple data centers and implements advanced load balancing strategies.",
    technologies: ["Node.js", "TypeScript", "gRPC", "Kubernetes", "Redis", "PostgreSQL"],
    category: "Backend",
    status: "completed",
    completionDate: "2023-12-15",
    startDate: "2023-01-10",
    complexity: "expert",
    featured: true,
    githubUrl: "https://github.com/example/enterprise-microservices",
    metrics: {
      performance: "Sub-100ms P95 latency",
      scale: "10M+ requests/day",
      cost: "Horizontal scaling efficiency",
    },
    highlights: [
      "Service mesh architecture with Istio",
      "Circuit breaker patterns for fault tolerance",
      "Distributed tracing with OpenTelemetry",
      "99.9% uptime SLA",
      "Auto-scaling based on real-time metrics",
    ],
  },
  {
    id: "2",
    title: "Distributed System Monitoring Platform",
    description:
      "Real-time distributed system monitoring with P95/P99 metrics, anomaly detection, SLA tracking, and automated alerting. Supports 1000+ services.",
    longDescription:
      "A comprehensive monitoring solution for distributed systems that provides real-time visibility into system health, performance metrics, and service dependencies. Features advanced anomaly detection using machine learning algorithms, SLA tracking with automated reporting, and intelligent alerting that reduces false positives through correlation analysis.",
    technologies: ["TypeScript", "Node.js", "InfluxDB", "Grafana", "Prometheus", "WebSocket"],
    category: "DevOps",
    status: "completed",
    completionDate: "2023-11-20",
    startDate: "2023-02-01",
    complexity: "expert",
    featured: true,
    githubUrl: "https://github.com/example/distributed-monitoring",
    metrics: {
      performance: "Real-time metrics collection",
      scale: "1000+ services monitored",
      cost: "Anomaly detection accuracy",
    },
    highlights: [
      "P95/P99 latency tracking",
      "ML-based anomaly detection",
      "SLA compliance monitoring",
      "Automated alerting system",
      "Service dependency mapping",
    ],
  },
  {
    id: "3",
    title: "Multi-Tenant SaaS Architecture",
    description:
      "Scalable multi-tenant SaaS platform with tenant isolation, resource quotas, and cost optimization. Supports 10,000+ tenants.",
    longDescription:
      "A robust multi-tenant SaaS architecture that ensures complete tenant isolation at the database, application, and infrastructure levels. Implements sophisticated resource quota management, cost optimization through shared resource pooling, and advanced billing systems. The platform supports both shared and dedicated tenant models with seamless migration capabilities.",
    technologies: ["Node.js", "TypeScript", "PostgreSQL", "Redis", "AWS", "Docker"],
    category: "Backend",
    status: "completed",
    completionDate: "2023-10-30",
    startDate: "2023-01-15",
    complexity: "expert",
    featured: true,
    githubUrl: "https://github.com/example/multi-tenant-saas",
    metrics: {
      performance: "Tenant isolation guarantee",
      scale: "10,000+ tenants",
      cost: "Resource efficiency optimization",
    },
    highlights: [
      "Complete tenant isolation",
      "Resource quota management",
      "Cost per tenant optimization",
      "Shared and dedicated models",
      "Seamless tenant migration",
    ],
  },
  // Production-Ready Systems Projects
  {
    id: "4",
    title: "High-Performance API Gateway",
    description:
      "Enterprise API gateway with rate limiting, authentication, request routing, and load balancing. Handles 1M+ requests/minute.",
    longDescription:
      "A high-performance API gateway designed for enterprise-scale traffic. Features include advanced rate limiting algorithms (sliding window, token bucket), comprehensive authentication and authorization, intelligent request routing with health checks, and sophisticated load balancing strategies. The gateway supports API versioning, request/response transformation, and comprehensive analytics.",
    technologies: ["Node.js", "TypeScript", "Express", "Redis", "Nginx", "Kubernetes"],
    category: "Backend",
    status: "completed",
    completionDate: "2023-09-25",
    startDate: "2023-02-10",
    complexity: "expert",
    featured: true,
    githubUrl: "https://github.com/example/api-gateway",
    metrics: {
      performance: "Sub-50ms latency",
      scale: "1M+ requests/minute",
      cost: "99.99% uptime",
    },
    highlights: [
      "Advanced rate limiting algorithms",
      "Comprehensive authentication",
      "Intelligent request routing",
      "Health check integration",
      "API versioning support",
    ],
  },
  {
    id: "5",
    title: "Real-time Data Streaming Pipeline",
    description:
      "High-throughput real-time data streaming pipeline with event sourcing, CQRS, and stream processing. Processes 100M+ events/day.",
    longDescription:
      "A high-performance data streaming platform that processes millions of events in real-time. Implements event sourcing for complete audit trails, CQRS pattern for read/write separation, and advanced stream processing with windowing and aggregation. The system supports exactly-once processing semantics and provides comprehensive monitoring and alerting.",
    technologies: ["Node.js", "TypeScript", "Kafka", "Redis", "PostgreSQL", "WebSocket"],
    category: "Backend",
    status: "completed",
    completionDate: "2023-08-15",
    startDate: "2023-01-20",
    complexity: "expert",
    featured: true,
    githubUrl: "https://github.com/example/streaming-pipeline",
    metrics: {
      performance: "Low latency streaming",
      scale: "100M+ events/day",
      cost: "Event sourcing efficiency",
    },
    highlights: [
      "Event sourcing implementation",
      "CQRS pattern architecture",
      "Exactly-once processing",
      "Real-time stream processing",
      "Comprehensive monitoring",
    ],
  },
  {
    id: "6",
    title: "Auto-Scaling Infrastructure Platform",
    description:
      "Intelligent auto-scaling platform with predictive analytics, capacity planning, and cost optimization across multiple cloud providers.",
    longDescription:
      "An intelligent infrastructure management platform that provides predictive auto-scaling based on machine learning models. Features include advanced capacity planning, cost optimization across AWS and Azure, and automated resource provisioning. The platform analyzes historical patterns to predict traffic spikes and scales proactively.",
    technologies: ["Kubernetes", "Docker", "Prometheus", "Python", "AWS", "Azure"],
    category: "DevOps",
    status: "completed",
    completionDate: "2023-07-10",
    startDate: "2023-02-01",
    complexity: "expert",
    featured: true,
    githubUrl: "https://github.com/example/auto-scaling-platform",
    metrics: {
      performance: "Predictive scaling accuracy",
      scale: "Multi-cloud support",
      cost: "40% cost reduction",
    },
    highlights: [
      "ML-based predictive scaling",
      "Multi-cloud support",
      "Capacity planning",
      "Cost optimization",
      "Automated provisioning",
    ],
  },
  // Technical Leadership Projects
  {
    id: "7",
    title: "Enterprise TypeScript Framework",
    description:
      "Comprehensive TypeScript framework with advanced type system, code generation, and developer tooling. Used by 50+ teams.",
    longDescription:
      "A comprehensive TypeScript framework designed for enterprise applications. Features include advanced type system utilities, automated code generation, comprehensive developer tooling, and best practices enforcement. The framework includes custom ESLint rules, Babel plugins, and AST manipulation tools for code transformation.",
    technologies: ["TypeScript", "Node.js", "AST manipulation", "ESLint", "Babel"],
    category: "Languages",
    status: "completed",
    completionDate: "2023-06-20",
    startDate: "2022-11-01",
    complexity: "expert",
    featured: false,
    githubUrl: "https://github.com/example/typescript-framework",
    metrics: {
      performance: "Code quality improvement",
      scale: "50+ teams adoption",
      cost: "Developer productivity increase",
    },
    highlights: [
      "Advanced type system utilities",
      "Automated code generation",
      "Custom ESLint rules",
      "AST manipulation tools",
      "Best practices enforcement",
    ],
  },
  {
    id: "8",
    title: "Component Design System",
    description:
      "Enterprise component design system with 100+ reusable components, comprehensive documentation, and accessibility compliance.",
    longDescription:
      "A comprehensive design system for enterprise applications featuring over 100 reusable components. Each component includes comprehensive documentation, Storybook stories, accessibility compliance (WCAG 2.2 AAA), and extensive test coverage. The system supports theming, internationalization, and responsive design patterns.",
    technologies: ["React", "TypeScript", "Storybook", "Testing Library", "Webpack"],
    category: "Frontend",
    status: "completed",
    completionDate: "2023-05-15",
    startDate: "2022-10-01",
    complexity: "advanced",
    featured: false,
    githubUrl: "https://github.com/example/design-system",
    metrics: {
      performance: "80%+ test coverage",
      scale: "100+ components",
      cost: "WCAG 2.2 AAA compliance",
    },
    highlights: [
      "100+ reusable components",
      "Comprehensive documentation",
      "WCAG 2.2 AAA compliance",
      "Storybook integration",
      "Extensive test coverage",
    ],
  },
  {
    id: "9",
    title: "Developer Productivity Platform",
    description:
      "Comprehensive developer productivity platform with automated testing, code review, deployment pipelines, and developer analytics.",
    longDescription:
      "An all-in-one platform designed to enhance developer productivity through automation and analytics. Features include automated testing frameworks, intelligent code review systems, comprehensive CI/CD pipelines, and detailed developer analytics. The platform integrates with Git, provides code quality metrics, and automates deployment processes.",
    technologies: ["Node.js", "TypeScript", "Docker", "Kubernetes", "CI/CD", "Git"],
    category: "DevOps",
    status: "completed",
    completionDate: "2023-04-30",
    startDate: "2022-09-01",
    complexity: "expert",
    featured: false,
    githubUrl: "https://github.com/example/dev-productivity",
    metrics: {
      performance: "50% faster deployments",
      scale: "Automated testing coverage",
      cost: "Code review automation",
    },
    highlights: [
      "Automated testing frameworks",
      "Intelligent code review",
      "CI/CD pipeline automation",
      "Developer analytics",
      "Code quality metrics",
    ],
  },
  // Business Impact Projects
  {
    id: "10",
    title: "Cost Optimization Analytics Platform",
    description:
      "Multi-cloud cost optimization platform with resource analysis, cost forecasting, and automated optimization recommendations. Saves 30%+ cloud costs.",
    longDescription:
      "A comprehensive platform for analyzing and optimizing cloud costs across multiple providers. Features include detailed resource analysis, predictive cost forecasting using machine learning, automated optimization recommendations, and ROI analysis. The platform supports AWS, Azure, and GCP with unified cost reporting.",
    technologies: ["Python", "AWS SDK", "Azure SDK", "Data Analysis", "React", "TypeScript"],
    category: "Cloud",
    status: "completed",
    completionDate: "2023-03-20",
    startDate: "2022-08-01",
    complexity: "expert",
    featured: true,
    githubUrl: "https://github.com/example/cost-optimization",
    metrics: {
      performance: "Cost forecasting accuracy",
      scale: "Multi-cloud support",
      cost: "30%+ cost reduction",
    },
    highlights: [
      "Multi-cloud cost analysis",
      "Predictive cost forecasting",
      "Automated recommendations",
      "ROI analysis",
      "Unified cost reporting",
    ],
  },
  {
    id: "11",
    title: "Performance Optimization Platform",
    description:
      "Automated performance optimization platform with Core Web Vitals monitoring, optimization recommendations, and A/B testing.",
    longDescription:
      "An automated platform for monitoring and optimizing web performance. Features include real-time Core Web Vitals tracking, automated optimization recommendations, A/B testing capabilities, and comprehensive performance analytics. The platform provides actionable insights and automated fixes for common performance issues.",
    technologies: ["React", "TypeScript", "Web Workers", "Performance API", "Lighthouse"],
    category: "Frontend",
    status: "completed",
    completionDate: "2023-02-28",
    startDate: "2022-07-01",
    complexity: "advanced",
    featured: false,
    githubUrl: "https://github.com/example/performance-optimization",
    metrics: {
      performance: "40% performance improvement",
      scale: "Core Web Vitals optimization",
      cost: "User experience metrics",
    },
    highlights: [
      "Core Web Vitals monitoring",
      "Automated optimization",
      "A/B testing capabilities",
      "Performance analytics",
      "Actionable insights",
    ],
  },
  {
    id: "12",
    title: "Scalable E-commerce Platform",
    description:
      "High-performance e-commerce platform with server-side rendering, edge caching, and payment processing. Handles Black Friday traffic spikes.",
    longDescription:
      "A production-ready e-commerce platform designed to handle massive traffic spikes during events like Black Friday. Features include Next.js server-side rendering, edge caching with CDN integration, secure payment processing with Stripe, and comprehensive inventory management. The platform supports millions of products and concurrent users.",
    technologies: ["Next.js", "TypeScript", "React", "Node.js", "PostgreSQL", "Redis", "Stripe"],
    category: "Frontend",
    status: "completed",
    completionDate: "2023-01-15",
    startDate: "2022-06-01",
    complexity: "expert",
    featured: true,
    githubUrl: "https://github.com/example/ecommerce-platform",
    metrics: {
      performance: "Sub-2s page load",
      scale: "Black Friday traffic handling",
      cost: "99.9% uptime",
    },
    highlights: [
      "Server-side rendering",
      "Edge caching with CDN",
      "Secure payment processing",
      "Inventory management",
      "Traffic spike handling",
    ],
  },
  // Full Stack Expertise Projects
  {
    id: "13",
    title: "GraphQL Federation Platform",
    description:
      "GraphQL federation platform with schema stitching, query optimization, and distributed GraphQL architecture across 20+ services.",
    longDescription:
      "A comprehensive GraphQL federation platform that enables distributed GraphQL architecture across multiple microservices. Features include schema stitching, query optimization to solve N+1 problems, distributed query execution, and comprehensive schema management. The platform supports 20+ federated services with unified API access.",
    technologies: ["GraphQL", "Apollo Server", "Node.js", "TypeScript", "PostgreSQL", "Redis"],
    category: "Backend",
    status: "completed",
    completionDate: "2022-12-20",
    startDate: "2022-05-01",
    complexity: "expert",
    featured: false,
    githubUrl: "https://github.com/example/graphql-federation",
    metrics: {
      performance: "Query optimization",
      scale: "20+ federated services",
      cost: "N+1 problem solved",
    },
    highlights: [
      "Schema stitching",
      "Query optimization",
      "Distributed execution",
      "Schema management",
      "Unified API access",
    ],
  },
  {
    id: "14",
    title: "Serverless Application Framework",
    description:
      "Multi-cloud serverless framework with auto-scaling, cost optimization, and unified deployment across AWS and Azure.",
    longDescription:
      "A comprehensive framework for building and deploying serverless applications across multiple cloud providers. Features include automatic scaling, cost optimization through intelligent resource allocation, unified deployment pipelines, and comprehensive monitoring. The framework abstracts cloud-specific differences and provides a unified development experience.",
    technologies: ["AWS Lambda", "Azure Functions", "TypeScript", "Serverless Framework", "DynamoDB"],
    category: "Cloud",
    status: "completed",
    completionDate: "2022-11-30",
    startDate: "2022-04-01",
    complexity: "expert",
    featured: false,
    githubUrl: "https://github.com/example/serverless-framework",
    metrics: {
      performance: "Auto-scaling",
      scale: "Multi-cloud deployment",
      cost: "60% cost reduction",
    },
    highlights: [
      "Multi-cloud support",
      "Automatic scaling",
      "Cost optimization",
      "Unified deployment",
      "Cloud abstraction",
    ],
  },
  {
    id: "15",
    title: "Real-time Collaboration Platform",
    description:
      "Real-time collaborative platform with conflict-free data synchronization, presence awareness, and offline support.",
    longDescription:
      "A real-time collaboration platform that enables multiple users to work together seamlessly. Features include CRDT-based conflict-free data synchronization, real-time presence awareness, offline support with automatic sync, and comprehensive conflict resolution. The platform supports collaborative editing, shared whiteboards, and real-time communication.",
    technologies: ["React", "TypeScript", "WebSocket", "CRDT", "Redis", "Node.js"],
    category: "Frontend",
    status: "completed",
    completionDate: "2022-10-25",
    startDate: "2022-03-01",
    complexity: "expert",
    featured: false,
    githubUrl: "https://github.com/example/collaboration-platform",
    metrics: {
      performance: "Real-time sync",
      scale: "Conflict resolution",
      cost: "Offline support",
    },
    highlights: [
      "CRDT-based synchronization",
      "Presence awareness",
      "Offline support",
      "Conflict resolution",
      "Real-time communication",
    ],
  },
  // Advanced Architecture Projects
  {
    id: "16",
    title: "Event-Driven Architecture Platform",
    description:
      "Enterprise event-driven architecture with event sourcing, CQRS pattern, and event replay capabilities for audit and recovery.",
    longDescription:
      "A comprehensive event-driven architecture platform that implements event sourcing and CQRS patterns. Features include complete event history, event replay capabilities for audit and recovery, read/write separation, and comprehensive event processing. The platform supports millions of events with efficient storage and retrieval.",
    technologies: ["Node.js", "TypeScript", "Event Sourcing", "CQRS", "Kafka", "PostgreSQL"],
    category: "Backend",
    status: "completed",
    completionDate: "2022-09-15",
    startDate: "2022-02-01",
    complexity: "expert",
    featured: false,
    githubUrl: "https://github.com/example/event-driven-architecture",
    metrics: {
      performance: "Event sourcing",
      scale: "CQRS implementation",
      cost: "Event replay capabilities",
    },
    highlights: [
      "Event sourcing implementation",
      "CQRS pattern",
      "Event replay",
      "Audit trail",
      "Recovery capabilities",
    ],
  },
  {
    id: "17",
    title: "Distributed Cache System",
    description:
      "High-performance distributed caching system with consistent hashing, cache invalidation strategies, and multi-region replication.",
    longDescription:
      "A high-performance distributed caching system designed for enterprise-scale applications. Features include consistent hashing for load distribution, sophisticated cache invalidation strategies, multi-region replication for global availability, and comprehensive cache analytics. The system achieves 99.9% cache hit rate with sub-10ms latency.",
    technologies: ["Node.js", "TypeScript", "Redis Cluster", "Memcached", "Consistent Hashing"],
    category: "Backend",
    status: "completed",
    completionDate: "2022-08-20",
    startDate: "2022-01-01",
    complexity: "expert",
    featured: false,
    githubUrl: "https://github.com/example/distributed-cache",
    metrics: {
      performance: "Sub-10ms latency",
      scale: "99.9% cache hit rate",
      cost: "Multi-region replication",
    },
    highlights: [
      "Consistent hashing",
      "Cache invalidation strategies",
      "Multi-region replication",
      "Cache analytics",
      "High availability",
    ],
  },
  {
    id: "18",
    title: "API Rate Limiting & Throttling System",
    description:
      "Distributed rate limiting system with sliding window algorithm, token bucket, and adaptive throttling for API protection.",
    longDescription:
      "A sophisticated distributed rate limiting system that protects APIs from abuse and ensures fair resource allocation. Features include multiple algorithms (sliding window, token bucket, fixed window), adaptive throttling based on system load, distributed coordination, and comprehensive analytics. The system supports per-user, per-IP, and per-endpoint rate limiting.",
    technologies: ["Node.js", "TypeScript", "Redis", "Algorithm Design", "Distributed Systems"],
    category: "Backend",
    status: "completed",
    completionDate: "2022-07-10",
    startDate: "2021-12-01",
    complexity: "advanced",
    featured: false,
    githubUrl: "https://github.com/example/rate-limiting",
    metrics: {
      performance: "Distributed rate limiting",
      scale: "Multiple algorithms",
      cost: "API protection",
    },
    highlights: [
      "Sliding window algorithm",
      "Token bucket algorithm",
      "Adaptive throttling",
      "Distributed coordination",
      "Comprehensive analytics",
    ],
  },
  // Security & Compliance Projects
  {
    id: "19",
    title: "Security Audit & Compliance Platform",
    description:
      "Automated security audit platform with OWASP Top 10 scanning, vulnerability detection, and compliance reporting.",
    longDescription:
      "A comprehensive security audit platform that automates security scanning and compliance checking. Features include OWASP Top 10 vulnerability scanning, SAST/DAST integration, automated compliance reporting, and security best practices enforcement. The platform supports multiple compliance standards and provides actionable remediation guidance.",
    technologies: ["Python", "Node.js", "TypeScript", "Security Scanning", "OWASP", "SAST/DAST"],
    category: "DevOps",
    status: "completed",
    completionDate: "2022-06-05",
    startDate: "2021-11-01",
    complexity: "expert",
    featured: false,
    githubUrl: "https://github.com/example/security-audit",
    metrics: {
      performance: "OWASP compliance",
      scale: "Vulnerability detection",
      cost: "Automated scanning",
    },
    highlights: [
      "OWASP Top 10 scanning",
      "SAST/DAST integration",
      "Compliance reporting",
      "Automated remediation",
      "Security best practices",
    ],
  },
  {
    id: "20",
    title: "Identity & Access Management System",
    description:
      "Enterprise IAM system with OAuth 2.0, JWT tokens, role-based access control, and multi-factor authentication.",
    longDescription:
      "A comprehensive identity and access management system for enterprise applications. Features include OAuth 2.0 and OpenID Connect support, JWT token management, role-based access control (RBAC), multi-factor authentication (MFA), and comprehensive audit logging. The system supports SSO, passwordless authentication, and fine-grained permissions.",
    technologies: ["Node.js", "TypeScript", "OAuth 2.0", "JWT", "RBAC", "PostgreSQL"],
    category: "Backend",
    status: "completed",
    completionDate: "2022-05-15",
    startDate: "2021-10-01",
    complexity: "expert",
    featured: false,
    githubUrl: "https://github.com/example/iam-system",
    metrics: {
      performance: "OAuth 2.0",
      scale: "RBAC implementation",
      cost: "MFA support",
    },
    highlights: [
      "OAuth 2.0 and OpenID Connect",
      "JWT token management",
      "Role-based access control",
      "Multi-factor authentication",
      "SSO support",
    ],
  },
  // Data & Analytics Projects
  {
    id: "21",
    title: "Big Data Processing Engine",
    description:
      "Distributed big data processing engine with batch and stream processing, data transformation, and analytics capabilities.",
    longDescription:
      "A high-performance big data processing engine that handles both batch and stream processing workloads. Features include distributed processing with Apache Spark, real-time stream processing with Kafka, data transformation pipelines, and comprehensive analytics capabilities. The system processes billions of records with fault tolerance and exactly-once semantics.",
    technologies: ["Python", "Node.js", "Apache Spark", "Kafka", "PostgreSQL", "Data Analysis"],
    category: "Backend",
    status: "completed",
    completionDate: "2022-04-20",
    startDate: "2021-09-01",
    complexity: "expert",
    featured: false,
    githubUrl: "https://github.com/example/big-data-engine",
    metrics: {
      performance: "Batch and stream processing",
      scale: "1B+ records processed",
      cost: "Data transformation",
    },
    highlights: [
      "Distributed processing",
      "Batch and stream processing",
      "Data transformation pipelines",
      "Analytics capabilities",
      "Fault tolerance",
    ],
  },
];

