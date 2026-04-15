"use client";

import Link from "next/link";

const results = [
  { value: "85%", label: "Query resolution without human help" },
  { value: "< 2s", label: "Average response time" },
  { value: "40%", label: "Reduction in support tickets" },
  { value: "$0.02", label: "Average cost per query" },
];

export default function AIIntegrationPage() {
  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "780px" }}>
        <Link
          href="/case-studies"
          className="text-secondary mb-4"
          style={{ display: "inline-block", fontSize: "0.9rem" }}
        >
          &larr; Back to Case Studies
        </Link>

        <h1 className="title is-2 font-display mb-2">
          Production AI Agent System
        </h1>
        <p className="text-muted mb-6">Case Study — AI/ML Integration</p>

        {/* Overview box */}
        <div className="liquid-glass-card mb-6" style={{ padding: "1.5rem" }}>
          <div className="columns is-mobile">
            <div className="column">
              <strong>Role:</strong> AI Architect
            </div>
            <div className="column">
              <strong>Duration:</strong> 6+ months
            </div>
            <div className="column">
              <strong>Team:</strong> 3 developers
            </div>
            <div className="column">
              <strong>Status:</strong> In production
            </div>
          </div>
        </div>

        {/* The Challenge */}
        <h2 className="title is-4 font-display mb-3">The Challenge</h2>
        <p className="text-secondary mb-5" style={{ lineHeight: 1.8 }}>
          An enterprise SaaS product needed AI-powered features to stay
          competitive. The team had no AI/ML expertise. Previous attempts at
          "adding AI" had resulted in a basic ChatGPT wrapper that hallucinated
          domain-specific answers and provided no real value to users. Leadership
          wanted AI that actually understood the product's domain.
        </p>

        {/* The Approach */}
        <h2 className="title is-4 font-display mb-3">The Approach</h2>
        <p className="text-secondary mb-3" style={{ lineHeight: 1.8 }}>
          I architected a production AI agent system from scratch, building
          domain-aware intelligence layer by layer:
        </p>
        <ol
          style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}
          className="text-secondary mb-5"
        >
          <li className="mb-2">
            <strong>Domain Analysis</strong> — Mapped the product's knowledge
            base: documentation, help articles, support tickets, feature specs.
            Identified what users actually asked about vs. what generic AI
            couldn't answer
          </li>
          <li className="mb-2">
            <strong>RAG Pipeline</strong> — Built a retrieval-augmented
            generation pipeline: document ingestion, chunking, embedding, vector
            storage, semantic search, context-augmented prompting
          </li>
          <li className="mb-2">
            <strong>MCP Server Configuration</strong> — Set up Model Context
            Protocol servers to give the AI agent structured access to product
            APIs, user data, and business logic — not just document search
          </li>
          <li className="mb-2">
            <strong>Structured Prompting</strong> — Designed a prompt
            engineering system using claude.md files, skills, and plans to
            ensure consistent, accurate, and on-brand responses
          </li>
          <li className="mb-2">
            <strong>Evaluation & Tuning</strong> — Built an evaluation pipeline
            to measure response quality, relevance, and accuracy. Iteratively
            tuned retrieval parameters, chunk sizes, and prompting strategies
          </li>
          <li className="mb-2">
            <strong>Production Deployment</strong> — Streaming responses, error
            handling, cost monitoring, rate limiting, and usage analytics
          </li>
        </ol>

        {/* Technical Decisions */}
        <h2 className="title is-4 font-display mb-3">Technical Decisions</h2>
        <ul
          style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}
          className="text-secondary mb-5"
        >
          <li className="mb-2">
            Claude API over OpenAI for better reasoning and instruction
            following on complex domain queries
          </li>
          <li className="mb-2">
            MCP servers for structured tool use instead of function calling —
            more reliable for multi-step workflows
          </li>
          <li className="mb-2">
            Hybrid retrieval: semantic search + keyword search for better recall
            on technical terms
          </li>
          <li className="mb-2">
            Cost monitoring dashboard to track per-user and per-feature AI spend
          </li>
        </ul>

        {/* Code: RAG Pipeline */}
        <h2 className="title is-4 font-display mb-3">Code: RAG Pipeline</h2>
        <p className="text-secondary mb-4" style={{ lineHeight: 1.8 }}>
          The retrieval-augmented generation pipeline — semantic search with keyword fallback for technical terms:
        </p>

        <pre style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "8px", overflow: "auto", fontSize: "0.8rem", lineHeight: 1.6, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }} className="mb-5"><code>{`// Simplified RAG pipeline
async function answerQuery(query: string, context: UserContext) {
  // 1. Hybrid retrieval: semantic + keyword
  const [semantic, keyword] = await Promise.all([
    vectorStore.similaritySearch(query, { k: 5 }),
    fullTextSearch(query, { boost: ['title', 'code_refs'] }),
  ])

  // 2. Deduplicate and rank by relevance
  const chunks = deduplicateAndRank([...semantic, ...keyword], {
    maxTokens: 4000,
    minScore: 0.7,
  })

  // 3. Build context-aware prompt
  const prompt = buildPrompt({
    systemPrompt: await loadClaudeMd(context.feature),
    retrievedContext: chunks,
    userQuery: query,
    userRole: context.role,
    conversationHistory: context.history.slice(-5),
  })

  // 4. Stream response with cost tracking
  const stream = await claude.messages.stream({
    model: 'claude-sonnet-4-20250514',
    messages: prompt,
    max_tokens: 1024,
  })

  return {
    stream,
    sources: chunks.map(c => c.metadata.source),
    estimatedCost: estimateTokenCost(prompt, 1024),
  }
}`}</code></pre>

        {/* Results */}
        <h2 className="title is-4 font-display mb-3">Results</h2>
        <div className="columns is-mobile is-multiline mb-5">
          {results.map((result, index) => (
            <div key={index} className="column is-6-mobile is-3-tablet">
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <div
                  className="title is-3"
                  style={{ color: "var(--accent)", marginBottom: "0.5rem" }}
                >
                  {result.value}
                </div>
                <p className="text-secondary" style={{ fontSize: "0.9rem" }}>
                  {result.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Key Takeaways */}
        <h2 className="title is-4 font-display mb-3">Key Takeaways</h2>
        <ul
          style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}
          className="text-secondary mb-5"
        >
          <li className="mb-2">
            RAG is not "just add embeddings" — chunk size, overlap, and
            retrieval strategy make or break accuracy
          </li>
          <li className="mb-2">
            MCP servers are a game-changer for giving AI structured access to
            your product's data and APIs
          </li>
          <li className="mb-2">
            An evaluation pipeline is non-negotiable — you can't improve what
            you can't measure
          </li>
          <li className="mb-2">
            Cost monitoring from day one prevents surprises when usage scales
          </li>
        </ul>

        {/* CTA */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "2rem",
            marginTop: "2rem",
          }}
          className="has-text-centered"
        >
          <p className="text-secondary mb-4">
            Looking to add production AI to your product?
          </p>
          <a
            href="mailto:contact@wei-dev.com"
            className="button is-primary is-medium"
          >
            Let's Talk
          </a>
        </div>
      </div>
    </div>
  );
}
