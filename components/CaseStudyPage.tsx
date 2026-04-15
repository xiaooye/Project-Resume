"use client";

import Link from "next/link";

const results = [
  { value: "Zero", label: "Downtime during migration" },
  { value: "3x", label: "Faster feature delivery" },
  { value: "90%", label: "Reduction in build time" },
  { value: "100%", label: "Team adoption of new stack" },
];

export default function CaseStudyPage() {
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
          Enterprise Legacy Migration
        </h1>
        <p className="text-muted mb-6">Case Study — Enterprise SaaS Platform</p>

        {/* Overview box */}
        <div className="liquid-glass-card mb-6" style={{ padding: "1.5rem" }}>
          <div className="columns is-mobile">
            <div className="column">
              <strong>Role:</strong> Lead Developer
            </div>
            <div className="column">
              <strong>Duration:</strong> 12+ months
            </div>
            <div className="column">
              <strong>Team:</strong> 4 developers
            </div>
            <div className="column">
              <strong>Status:</strong> In production
            </div>
          </div>
        </div>

        {/* The Challenge */}
        <h2 className="title is-4 font-display mb-3">The Challenge</h2>
        <p className="text-secondary mb-5" style={{ lineHeight: 1.8 }}>
          A US-based enterprise SaaS company had a legacy ASP application with
          injected inline scripts serving enterprise customers. The codebase had
          grown organically over 10+ years, making it increasingly difficult to
          maintain, test, and ship new features. Downtime and regressions were
          not an option — the product served paying enterprise clients with SLA
          requirements.
        </p>

        {/* The Approach */}
        <h2 className="title is-4 font-display mb-3">The Approach</h2>
        <p className="text-secondary mb-3" style={{ lineHeight: 1.8 }}>
          Rather than a risky big-bang rewrite, I designed an incremental
          migration strategy:
        </p>
        <ol
          style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}
          className="text-secondary mb-5"
        >
          <li className="mb-2">
            <strong>Assessment</strong> — Mapped the entire codebase, identified
            coupling points, and prioritized migration paths by business impact
          </li>
          <li className="mb-2">
            <strong>Bridge Layer</strong> — Built a compatibility layer allowing
            new components to coexist with legacy code, enabling parallel
            development
          </li>
          <li className="mb-2">
            <strong>Incremental Migration</strong> — Migrated page-by-page from
            inline scripts to a fully bundled Vite + component-based
            architecture
          </li>
          <li className="mb-2">
            <strong>Testing</strong> — Implemented comprehensive test coverage at
            each stage to catch regressions before they reached production
          </li>
          <li className="mb-2">
            <strong>Tooling</strong> — Built custom migration tooling to automate
            repetitive patterns and reduce human error
          </li>
        </ol>

        {/* Code: Before & After */}
        <h2 className="title is-4 font-display mb-3">Code: Before &amp; After</h2>
        <p className="text-secondary mb-4" style={{ lineHeight: 1.8 }}>
          A typical page migration — from inline scripts to a component-based architecture:
        </p>

        <div className="columns mb-5">
          <div className="column is-half">
            <p className="has-text-weight-bold mb-2" style={{ fontSize: "0.875rem" }}>Before — Inline scripts in ASP page</p>
            <pre style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "8px", overflow: "auto", fontSize: "0.8rem", lineHeight: 1.6, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}><code>{`<script>
  var grid = document.getElementById('data-grid');
  $.ajax('/api/records', {
    success: function(data) {
      data.forEach(function(row) {
        var tr = document.createElement('tr');
        tr.textContent = row.name + ' | ' + row.status;
        tr.onclick = function() {
          openModal(row.id);
        };
        grid.appendChild(tr);
      });
    }
  });
  function openModal(id) { /* 200 lines of DOM manipulation */ }
</script>`}</code></pre>
          </div>
          <div className="column is-half">
            <p className="has-text-weight-bold mb-2" style={{ fontSize: "0.875rem" }}>After — Vue 3 Composition API</p>
            <pre style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "8px", overflow: "auto", fontSize: "0.8rem", lineHeight: 1.6, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}><code>{`<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRecords } from '@/composables/useRecords'
import DataGrid from '@/components/DataGrid.vue'
import RecordModal from '@/components/RecordModal.vue'

const { records, loading, fetch } = useRecords()
const selectedId = ref<string | null>(null)

onMounted(() => fetch())
</script>

<template>
  <DataGrid
    :data="records"
    :loading="loading"
    @row-click="(row) => selectedId = row.id"
  />
  <RecordModal
    v-if="selectedId"
    :id="selectedId"
    @close="selectedId = null"
  />
</template>`}</code></pre>
          </div>
        </div>

        {/* AI Integration */}
        <h2 className="title is-4 font-display mb-3">AI Integration</h2>
        <p className="text-secondary mb-5" style={{ lineHeight: 1.8 }}>
          In parallel with the migration, I architected the company's AI
          integration from scratch: RAG pipelines for domain-specific knowledge
          retrieval, MCP server configuration, Claude-powered features with
          structured prompting, and LLM-driven workflows now running in
          production serving real users.
        </p>

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
            Big-bang rewrites are almost never the right answer for production
            systems
          </li>
          <li className="mb-2">
            Migration tooling pays for itself within the first month
          </li>
          <li className="mb-2">
            Incremental delivery builds team confidence and catches issues early
          </li>
          <li className="mb-2">
            AI integration doesn't have to be a separate initiative — it can
            happen alongside modernization
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
            Facing a similar migration challenge?
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
