# Development Guidelines

## CSS Framework Requirements

**CRITICAL: Use ONLY Bulma CSS - No Custom CSS**

- **DO NOT** add custom CSS classes or styles to `globals.css`
- **DO NOT** create custom utility classes
- **DO NOT** override Bulma's default styles
- **ONLY** use Bulma's native classes and components
- Use Bulma's built-in modifiers: `is-*`, `has-*`, etc.
- For dynamic styles (e.g., transforms, calculated positions), minimal inline styles are acceptable ONLY when absolutely necessary for runtime calculations

### Allowed:
- Bulma CSS import in `globals.css`
- Font variable definitions
- Bulma native classes: `is-flex`, `is-relative`, `has-text-centered`, `mb-6`, etc.
- Minimal inline styles for dynamic calculations (transform, z-index for layering)

### Not Allowed:
- Custom CSS classes
- Custom utility classes
- CSS overrides of Bulma components
- Custom spacing utilities beyond Bulma's built-in ones

## Package Manager

- Use **pnpm** for all package management operations
- Never use npm directly

## Git Configuration

- Email: zxcwqer9l@gmail.com
- Name: xiaooye

## Code Style

- Use Prettier for code formatting
- Follow TypeScript strict mode
- Use ESLint with Next.js config

## Project Demo Sub-Applications

### Overview

Each project in the portfolio should have an interactive demonstration sub-application accessible via `/projects/[id]` route. These demos showcase the project's architecture, features, and technical capabilities.

### Structure

```
app/
  projects/
    [id]/
      page.tsx          # Dynamic route for project demo
components/
  projects/
    demos/
      [ProjectName]Demo.tsx  # Specific demo component for each project
```

### Demo Requirements

1. **Architecture Visualization**
   - System architecture diagrams
   - Component relationships
   - Data flow diagrams
   - Technology stack visualization

2. **Core Features Demonstration**
   - Interactive feature showcases
   - Simulated data and operations
   - Real-time updates where applicable
   - Performance metrics display

3. **Technical Details**
   - Technology stack breakdown
   - Design decisions and rationale
   - Best practices implementation
   - Code examples (if applicable)

4. **Performance Metrics**
   - Real-time metrics display
   - Performance comparisons
   - Cost analysis
   - Scalability demonstrations

### Implementation Guidelines

- Use Bulma CSS classes only (no custom CSS)
- Follow WCAG 2.2 AAA accessibility standards
- Ensure responsive design (mobile-first)
- Use TypeScript with strict mode
- Implement proper error handling
- Add loading states for async operations
- Support keyboard navigation
- Include proper ARIA labels

### Data Integration

- Project data from `data/projects.ts`
- Update `demoUrl` in project data to point to `/projects/[id]`
- Use project ID for routing: `/projects/1`, `/projects/2`, etc.

### Example Structure

```typescript
// app/projects/[id]/page.tsx
import { projectsData } from "@/data/projects";
import { notFound } from "next/navigation";
import ProjectDemo from "@/components/projects/demos/ProjectDemo";

export default function ProjectDemoPage({ params }: { params: { id: string } }) {
  const project = projectsData.find((p) => p.id === params.id);
  
  if (!project) {
    notFound();
  }
  
  return <ProjectDemo project={project} />;
}
```

