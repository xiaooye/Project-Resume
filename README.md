# Senior Full Stack Developer Portfolio

A Next.js portfolio website showcasing advanced full-stack development skills including real-time systems, WebAssembly, AI/ML, cloud services, and more.

## Important Development Rules

**⚠️ CRITICAL: Use ONLY Bulma CSS - No Custom CSS**

- Only use Bulma's native classes and components
- Do NOT add custom CSS classes or styles
- Do NOT override Bulma's default styles
- See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed guidelines

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Vercel Optimization

This project is optimized for Vercel's serverless environment:

#### Server-Sent Events (SSE) Streaming
- **Auto-reconnection**: Client automatically reconnects when serverless function times out
- **Keepalive pings**: Server sends keepalive every 15 seconds to prevent timeouts
- **Exponential backoff**: Reconnection uses exponential backoff (2s, 4s, 8s, 16s, 32s)
- **Max duration**: Configured for 60 seconds (Pro plan), client handles reconnection

#### Performance Optimizations
- **Force dynamic**: API routes marked as `force-dynamic` to prevent caching
- **Memory optimization**: Efficient data structures and cleanup on disconnect
- **Stateless design**: Configuration stored in memory (consider Vercel KV for production)

#### Vercel Configuration
- `vercel.json`: Configures function timeouts and headers
- `next.config.ts`: Sets proper SSE headers
- CORS headers: Configured for cross-origin requests

#### Limitations & Considerations
- **Function timeout**: Hobby (10s), Pro (60s), Enterprise (300s)
- **Stateless**: In-memory state is lost between function invocations
- **Cold starts**: First request may be slower (~1-2s)
- **Recommendation**: For production, consider using Vercel KV for persistent configuration storage

#### Production Recommendations
1. **Vercel KV**: Use for persistent session storage (optional)
2. **Monitoring**: Add Vercel Analytics for performance monitoring
3. **Edge Functions**: Consider Edge Functions for lower latency (if compatible)
4. **Rate Limiting**: Implement rate limiting for API endpoints
