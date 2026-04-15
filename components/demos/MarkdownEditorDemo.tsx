"use client";

import { useState, useMemo } from "react";

// ---------------------------------------------------------------------------
// Zero-dependency markdown parser
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inlineFmt(text: string): string {
  // Escape HTML first to prevent XSS, then apply markdown formatting
  return escapeHtml(text)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:4px" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--accent)">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code style="background:var(--bg-subtle);padding:0.1em 0.35em;border-radius:3px;font-size:0.9em">$1</code>');
}

function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inCode = false;
  const codeBuf: string[] = [];
  let inUl = false;
  let inOl = false;

  const closeList = () => {
    if (inUl) { out.push("</ul>"); inUl = false; }
    if (inOl) { out.push("</ol>"); inOl = false; }
  };

  for (const line of lines) {
    // Code block toggle
    if (line.startsWith("```")) {
      if (inCode) {
        out.push(`<pre style="background:var(--bg-subtle);padding:1rem;border-radius:8px;overflow:auto;font-size:0.85rem;line-height:1.6"><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
        codeBuf.length = 0;
        inCode = false;
      } else {
        closeList();
        inCode = true;
      }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }

    // Headings
    const hMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (hMatch) {
      closeList();
      const lvl = hMatch[1].length;
      const sizes: Record<number, string> = { 1: "1.75rem", 2: "1.4rem", 3: "1.15rem", 4: "1rem", 5: "0.9rem", 6: "0.85rem" };
      out.push(`<h${lvl} style="font-family:var(--font-display);font-size:${sizes[lvl]};margin:1.25em 0 0.5em;letter-spacing:-0.02em">${inlineFmt(hMatch[2])}</h${lvl}>`);
      continue;
    }

    // HR
    if (/^[-*_]{3,}\s*$/.test(line)) {
      closeList();
      out.push('<hr style="border:none;border-top:1px solid var(--border);margin:1.5rem 0" />');
      continue;
    }

    // Blockquote
    const bq = line.match(/^>\s?(.*)$/);
    if (bq) {
      closeList();
      out.push(`<blockquote style="border-left:3px solid var(--accent);padding-left:1rem;margin:0.75rem 0;color:var(--text-secondary)">${inlineFmt(bq[1])}</blockquote>`);
      continue;
    }

    // Unordered list
    const ul = line.match(/^[-*]\s+(.+)$/);
    if (ul) {
      if (inOl) { out.push("</ol>"); inOl = false; }
      if (!inUl) { out.push('<ul style="padding-left:1.5rem;margin:0.5rem 0">'); inUl = true; }
      out.push(`<li style="margin:0.25rem 0">${inlineFmt(ul[1])}</li>`);
      continue;
    }

    // Ordered list
    const ol = line.match(/^\d+\.\s+(.+)$/);
    if (ol) {
      if (inUl) { out.push("</ul>"); inUl = false; }
      if (!inOl) { out.push('<ol style="padding-left:1.5rem;margin:0.5rem 0">'); inOl = true; }
      out.push(`<li style="margin:0.25rem 0">${inlineFmt(ol[1])}</li>`);
      continue;
    }

    closeList();

    // Blank line
    if (line.trim() === "") continue;

    // Paragraph
    out.push(`<p style="margin:0.6rem 0;line-height:1.7">${inlineFmt(line)}</p>`);
  }

  closeList();
  return out.join("\n");
}

// ---------------------------------------------------------------------------
// Sample content
// ---------------------------------------------------------------------------

const SAMPLE = `# Markdown Editor

A **live preview** editor with a hand-rolled parser — zero dependencies.

## Features

- Real-time preview as you type
- Supports **bold**, *italic*, and \`inline code\`
- Code blocks, links, lists, blockquotes
- Copy the rendered HTML output

## Code Example

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("world"));
\`\`\`

> This parser was written from scratch — no marked, no remark, no external libraries.

### Try It

1. Edit this text on the left
2. Watch the preview update instantly
3. Click **Copy HTML** to grab the output

---

Built by [Wei](https://wei-dev.com) as a portfolio demo.`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MarkdownEditorDemo() {
  const [md, setMd] = useState(SAMPLE);
  const [copied, setCopied] = useState(false);

  const html = useMemo(() => markdownToHtml(md), [md]);
  const wordCount = md.trim() ? md.trim().split(/\s+/).length : 0;
  const charCount = md.length;

  const copyHtml = () => {
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "1100px" }}>
        <h1 className="title is-2 font-display mb-2">Markdown Editor</h1>
        <p className="text-secondary mb-5" style={{ lineHeight: 1.7, maxWidth: "640px" }}>
          Live split-pane editor with a zero-dependency markdown parser.
          Headings, bold, italic, code blocks, lists, links, blockquotes —
          all parsed from scratch, no libraries.
        </p>

        {/* Editor */}
        <div className="columns" style={{ minHeight: "500px" }}>
          {/* Left: Source */}
          <div className="column is-half">
            <div className="liquid-glass-card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  padding: "0.75rem 1.25rem",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span className="has-text-weight-bold" style={{ fontSize: "0.85rem" }}>Markdown</span>
                <span className="text-muted" style={{ fontSize: "0.7rem" }}>
                  {wordCount} words &middot; {charCount} chars
                </span>
              </div>
              <textarea
                value={md}
                onChange={(e) => setMd(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1,
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                  lineHeight: 1.7,
                  padding: "1rem 1.25rem",
                  border: "none",
                  background: "transparent",
                  color: "var(--text-primary)",
                  resize: "none",
                  outline: "none",
                  width: "100%",
                }}
              />
            </div>
          </div>

          {/* Right: Preview — input is HTML-escaped before rendering */}
          <div className="column is-half">
            <div className="liquid-glass-card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  padding: "0.75rem 1.25rem",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span className="has-text-weight-bold" style={{ fontSize: "0.85rem" }}>Preview</span>
                <button
                  onClick={copyHtml}
                  className="button is-small is-light"
                  style={{ border: "1px solid var(--border)", fontSize: "0.75rem" }}
                >
                  {copied ? "Copied!" : "Copy HTML"}
                </button>
              </div>
              <div
                style={{
                  flex: 1,
                  padding: "1rem 1.25rem",
                  overflow: "auto",
                  fontSize: "0.9rem",
                  color: "var(--text-primary)",
                }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
