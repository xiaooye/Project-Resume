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

