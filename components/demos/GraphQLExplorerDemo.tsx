"use client";

import { useState, useCallback, useMemo } from "react";

interface ExampleQuery { name: string; label: string; query: string }

const examples: ExampleQuery[] = [
  { name: "allUsers", label: "Get all users", query: `{\n  users {\n    id\n    name\n    email\n    posts {\n      title\n    }\n  }\n}` },
  { name: "allPosts", label: "Get all posts with authors", query: `{\n  posts {\n    id\n    title\n    content\n    author {\n      name\n    }\n    comments {\n      content\n    }\n  }\n}` },
  { name: "singleUser", label: "Get single user", query: `{\n  user(id: "1") {\n    name\n    email\n    posts {\n      title\n    }\n  }\n}` },
  { name: "createUser", label: "Create a user", query: `mutation {\n  createUser(name: "Test", email: "test@example.com") {\n    id\n    name\n  }\n}` },
  { name: "createPost", label: "Create a post", query: `mutation {\n  createPost(title: "New Post", content: "Hello world", authorId: "1") {\n    id\n    title\n    author {\n      name\n    }\n  }\n}` },
];

const schemaRef = [
  { type: "Query", fields: ["users: [User]", "user(id: ID!): User", "posts: [Post]", "post(id: ID!): Post"] },
  { type: "Mutation", fields: ["createUser(name: String!, email: String!): User", "createPost(title: String!, content: String!, authorId: ID!): Post", "createComment(content: String!, postId: ID!, authorId: ID!): Comment"] },
  { type: "User", fields: ["id: ID!", "name: String!", "email: String!", "posts: [Post]"] },
  { type: "Post", fields: ["id: ID!", "title: String!", "content: String!", "author: User!", "comments: [Comment]"] },
  { type: "Comment", fields: ["id: ID!", "content: String!", "author: User!", "post: Post!"] },
];

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono, 'SF Mono', 'Fira Code', 'Consolas', monospace)",
  fontSize: "0.85rem", lineHeight: 1.6,
};
const btnBase: React.CSSProperties = {
  padding: "0.35rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 500,
  cursor: "pointer", border: "1px solid var(--border)", background: "var(--bg-subtle)",
  color: "var(--text-primary)", transition: "border-color 0.15s",
};
const labelSt: React.CSSProperties = {
  fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)",
  display: "block", marginBottom: "0.5rem",
};

interface JsonToken { text: string; color: string; bold?: boolean }

function tokenizeJson(json: string): JsonToken[] {
  const tokens: JsonToken[] = [];
  const re = /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(json)) !== null) {
    if (m.index > last) tokens.push({ text: json.slice(last, m.index), color: "inherit" });
    const v = m[0];
    if (v.startsWith('"') && v.endsWith(":")) tokens.push({ text: v, color: "var(--text-primary)", bold: true });
    else if (v.startsWith('"')) tokens.push({ text: v, color: "#16a34a" });
    else if (/true|false/.test(v)) tokens.push({ text: v, color: "#d97706" });
    else if (/null/.test(v)) tokens.push({ text: v, color: "#6b7280" });
    else tokens.push({ text: v, color: "var(--accent, #2563eb)" });
    last = re.lastIndex;
  }
  if (last < json.length) tokens.push({ text: json.slice(last), color: "inherit" });
  return tokens;
}

function HighlightedJson({ json }: { json: string }) {
  const tokens = useMemo(() => tokenizeJson(json), [json]);
  return (
    <>
      {tokens.map((t, i) => (
        <span key={i} style={{ color: t.color, fontWeight: t.bold ? 600 : undefined }}>{t.text}</span>
      ))}
    </>
  );
}

export default function GraphQLExplorerDemo() {
  const [query, setQuery] = useState(examples[0].query);
  const [response, setResponse] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeExample, setActiveExample] = useState(examples[0].name);
  const [showSchema, setShowSchema] = useState(false);

  const executeQuery = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setStatusCode(null);
    setResponseTime(null);
    try {
      const start = performance.now();
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      const time = Math.round(performance.now() - start);
      setStatusCode(res.status);
      setResponseTime(time);
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [query]);

  const loadExample = useCallback((ex: ExampleQuery) => {
    setQuery(ex.query);
    setActiveExample(ex.name);
    setResponse(null);
    setStatusCode(null);
    setResponseTime(null);
    setError(null);
  }, []);

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "1100px" }}>
        <h1 className="title is-2 font-display mb-2">GraphQL API Explorer</h1>
        <p className="text-secondary mb-5" style={{ lineHeight: 1.7, maxWidth: "640px" }}>
          A real Apollo Server endpoint running on this site. Write queries, execute them, and see live responses.
        </p>
        <p className="text-muted mb-5">
          Endpoint: <code style={{ ...mono, fontSize: "0.8rem" }}>/api/graphql</code> -- Try the example queries or write your own.
        </p>

        <div className="columns">
          <div className="column is-7">
            {/* Example queries */}
            <div className="mb-4">
              <label className="label" style={labelSt}>Example Queries</label>
              <div className="is-flex is-flex-wrap-wrap" style={{ gap: "0.5rem" }}>
                {examples.map((ex) => (
                  <button key={ex.name} onClick={() => loadExample(ex)} style={{
                    ...btnBase,
                    borderColor: activeExample === ex.name ? "var(--accent)" : "var(--border)",
                    background: activeExample === ex.name ? "var(--accent)" : "var(--bg-subtle)",
                    color: activeExample === ex.name ? "#fff" : "var(--text-primary)",
                  }}>
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Query editor */}
            <div className="liquid-glass-card" style={{ padding: "1.25rem" }}>
              <label htmlFor="gql-editor" style={labelSt}>Query</label>
              <textarea
                id="gql-editor" value={query} rows={12} spellCheck={false}
                onChange={(e) => { setQuery(e.target.value); setActiveExample(""); }}
                style={{ ...mono, width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)", resize: "vertical" }}
                aria-label="GraphQL query editor"
              />
              <div className="is-flex is-justify-content-space-between is-align-items-center" style={{ marginTop: "0.75rem" }}>
                <button onClick={executeQuery} disabled={loading || !query.trim()} style={{
                  padding: "0.5rem 1.25rem", borderRadius: "6px", border: "none", background: "var(--accent)",
                  color: "#fff", fontSize: "0.9rem", fontWeight: 600,
                  cursor: loading ? "wait" : "pointer", opacity: loading || !query.trim() ? 0.6 : 1,
                }}>
                  {loading ? "Executing..." : "Execute Query"}
                </button>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  {responseTime !== null && (
                    <span className="text-muted" style={{ fontSize: "0.8rem" }}>{responseTime}ms</span>
                  )}
                  {statusCode !== null && (
                    <span style={{
                      fontSize: "0.75rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "4px",
                      color: statusCode === 200 ? "#16a34a" : "#dc2626",
                      border: `1px solid ${statusCode === 200 ? "#16a34a33" : "#dc262633"}`,
                      background: statusCode === 200 ? "#16a34a11" : "#dc262611",
                    }}>
                      {statusCode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Schema toggle */}
            <div style={{ marginTop: "1rem" }}>
              <button onClick={() => setShowSchema(!showSchema)} style={{ ...btnBase, fontSize: "0.78rem", background: "transparent" }}>
                {showSchema ? "Hide" : "Show"} Schema Reference
              </button>
              {showSchema && (
                <div className="liquid-glass-card" style={{ padding: "1rem", marginTop: "0.75rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                    {schemaRef.map((s) => (
                      <div key={s.type}>
                        <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: "0.35rem" }}>{s.type}</p>
                        {s.fields.map((f) => (
                          <p key={f} className="text-secondary" style={{ ...mono, fontSize: "0.75rem", lineHeight: 1.8 }}>{f}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Response */}
          <div className="column is-5">
            <div className="liquid-glass-card" style={{ padding: "1.25rem" }}>
              <div className="is-flex is-justify-content-space-between is-align-items-center" style={{ marginBottom: "0.75rem" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Response</h3>
                {response && (
                  <button onClick={() => navigator.clipboard.writeText(response)}
                    style={{ ...btnBase, fontSize: "0.72rem", padding: "0.2rem 0.5rem" }}
                    aria-label="Copy response to clipboard">
                    Copy
                  </button>
                )}
              </div>

              {error && (
                <div style={{ padding: "0.75rem", borderRadius: "6px", background: "#dc262611", border: "1px solid #dc262633", color: "#dc2626", fontSize: "0.85rem" }}>
                  {error}
                </div>
              )}

              {!response && !error && (
                <p className="text-muted" style={{ fontSize: "0.85rem", padding: "2rem 0", textAlign: "center" }}>
                  Execute a query to see the response.
                </p>
              )}

              {response && (
                <pre style={{
                  ...mono, fontSize: "0.78rem", padding: "0.75rem", borderRadius: "6px",
                  background: "var(--bg-subtle)", border: "1px solid var(--border)",
                  overflow: "auto", maxHeight: "520px", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  <HighlightedJson json={response} />
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
