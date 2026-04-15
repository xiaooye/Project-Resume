"use client";

import { useState, useRef } from "react";

type MigrationTarget = "vue3" | "tailwind" | "vite" | "react" | "typescript";

const targets: { value: MigrationTarget; label: string; description: string }[] = [
  { value: "vue3", label: "Vue 3 Composition API", description: "Migrate jQuery, vanilla JS, or Options API to Vue 3 Composition API" },
  { value: "react", label: "React + Hooks", description: "Convert legacy code to modern React with hooks and functional components" },
  { value: "tailwind", label: "Tailwind CSS", description: "Convert traditional CSS/SCSS to Tailwind utility classes" },
  { value: "typescript", label: "TypeScript", description: "Add type safety to plain JavaScript code" },
  { value: "vite", label: "Vite Config", description: "Migrate Webpack, Rollup, or CRA config to Vite" },
];

const exampleCode: Record<MigrationTarget, string> = {
  vue3: `// jQuery todo app
$(document).ready(function() {
  var todos = [];

  $('#add-btn').on('click', function() {
    var text = $('#todo-input').val();
    if (text) {
      todos.push({ text: text, done: false });
      renderTodos();
      $('#todo-input').val('');
    }
  });

  function renderTodos() {
    $('#todo-list').empty();
    todos.forEach(function(todo, i) {
      var li = $('<li>').text(todo.text);
      if (todo.done) li.addClass('done');
      li.on('click', function() {
        todos[i].done = !todos[i].done;
        renderTodos();
      });
      $('#todo-list').append(li);
    });
    $('#count').text(todos.filter(t => !t.done).length + ' remaining');
  }
});`,
  react: `// Class component with lifecycle methods
class UserProfile extends React.Component {
  constructor(props) {
    super(props);
    this.state = { user: null, loading: true, error: null };
  }

  componentDidMount() {
    fetch('/api/user/' + this.props.userId)
      .then(res => res.json())
      .then(user => this.setState({ user, loading: false }))
      .catch(err => this.setState({ error: err.message, loading: false }));
  }

  componentDidUpdate(prevProps) {
    if (prevProps.userId !== this.props.userId) {
      this.setState({ loading: true });
      this.componentDidMount();
    }
  }

  render() {
    if (this.state.loading) return <div>Loading...</div>;
    if (this.state.error) return <div>Error: {this.state.error}</div>;
    return <div><h1>{this.state.user.name}</h1></div>;
  }
}`,
  tailwind: `.card-container {
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 16px;
  transition: box-shadow 0.2s ease;
}
.card-container:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}
.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}
.card-description {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}`,
  typescript: `// Untyped API service
function createApiClient(baseUrl) {
  async function get(endpoint, params) {
    const query = params
      ? '?' + new URLSearchParams(params)
      : '';
    const res = await fetch(baseUrl + endpoint + query);
    if (!res.ok) throw new Error('Failed: ' + res.status);
    return res.json();
  }

  async function post(endpoint, body) {
    const res = await fetch(baseUrl + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Failed: ' + res.status);
    return res.json();
  }

  return { get, post };
}

const api = createApiClient('https://api.example.com');`,
  vite: `// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { VueLoaderPlugin } = require('vue-loader');

module.exports = {
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
  },
  module: {
    rules: [
      { test: /\\.vue$/, loader: 'vue-loader' },
      { test: /\\.js$/, exclude: /node_modules/,
        use: 'babel-loader' },
      { test: /\\.css$/,
        use: [MiniCssExtractPlugin.loader,
              'css-loader', 'postcss-loader'] },
      { test: /\\.(png|jpe?g|gif|svg)$/,
        type: 'asset/resource' },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({ template: './index.html' }),
    new MiniCssExtractPlugin(),
  ],
  resolve: {
    extensions: ['.js', '.vue'],
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  devServer: { hot: true, port: 8080 },
};`,
};

export default function CodeMigrationDemo() {
  const [target, setTarget] = useState<MigrationTarget>("vue3");
  const [inputCode, setInputCode] = useState(exampleCode.vue3);
  const [outputCode, setOutputCode] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [showKey, setShowKey] = useState(false);
  const outputRef = useRef("");

  const handleTargetChange = (t: MigrationTarget) => {
    setTarget(t);
    setInputCode(exampleCode[t]);
    setOutputCode("");
    setError("");
  };

  const handleMigrate = async () => {
    if (!inputCode.trim()) {
      setError("Please enter code to migrate.");
      return;
    }

    setIsProcessing(true);
    setError("");
    setOutputCode("");
    outputRef.current = "";

    const targetInfo = targets.find((t) => t.value === target);
    const prompt = `You are a senior developer performing a code migration. Migrate the following code to ${targetInfo?.label}.

Rules:
- Output ONLY the migrated code, no explanations before or after
- Preserve all functionality
- Use modern best practices
- Add brief inline comments where the migration pattern is non-obvious

Code to migrate:
\`\`\`
${inputCode}
\`\`\``;

    try {
      const res = await fetch("/api/ai-agent/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey.trim() ? { "x-api-key": apiKey } : {}),
        },
        body: JSON.stringify({ message: prompt, stream: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `API returned ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const json = JSON.parse(data);
              if (json.text) {
                outputRef.current += json.text;
                setOutputCode(outputRef.current);
              }
            } catch {
              // skip parse errors in SSE chunks
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Migration failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "1100px" }}>
        <h1 className="title is-2 font-display mb-2">AI Code Migration</h1>
        <p className="text-secondary mb-5" style={{ lineHeight: 1.7, maxWidth: "640px" }}>
          Paste legacy code, choose a target framework, and get an AI-powered migration
          with streaming output. Powered by Gemini — or bring your own API key.
        </p>

        {/* API Key */}
        <div className="mb-5" style={{ maxWidth: "480px" }}>
          <label className="label" htmlFor="migration-api-key" style={{ fontSize: "0.875rem" }}>
            Gemini API Key <span className="text-muted">(optional)</span>
          </label>
          <div className="field has-addons">
            <div className="control is-expanded">
              <input
                id="migration-api-key"
                className="input"
                type={showKey ? "text" : "password"}
                placeholder="Enter your Gemini API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                aria-label="Gemini API key"
              />
            </div>
            <div className="control">
              <button
                className="button is-light"
                onClick={() => setShowKey(!showKey)}
                aria-label={showKey ? "Hide API key" : "Show API key"}
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <p className="text-muted mt-1">Leave blank to use the built-in key, or enter your own. Never stored.</p>
        </div>

        {/* Target Selection */}
        <div className="mb-5">
          <label className="label">Migration Target</label>
          <div className="is-flex is-flex-wrap-wrap" style={{ gap: "0.5rem" }}>
            {targets.map((t) => (
              <button
                key={t.value}
                className={`button is-small ${target === t.value ? "is-primary" : "is-light"}`}
                onClick={() => handleTargetChange(t.value)}
                aria-label={`Migrate to ${t.label}`}
                aria-pressed={target === t.value}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-muted mt-2">
            {targets.find((t) => t.value === target)?.description}
          </p>
        </div>

        {/* Code Panels */}
        <div className="columns">
          <div className="column is-half">
            <div className="liquid-glass-card" style={{ padding: "1.25rem" }}>
              <div className="is-flex is-justify-content-space-between is-align-items-center mb-3">
                <h2 className="title is-6 mb-0">Before</h2>
                <span className="tag is-light">Editable</span>
              </div>
              <textarea
                className="textarea"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                rows={20}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                  lineHeight: 1.6,
                  resize: "vertical",
                }}
                aria-label="Source code to migrate"
                spellCheck={false}
              />
            </div>
          </div>
          <div className="column is-half">
            <div className="liquid-glass-card" style={{ padding: "1.25rem" }}>
              <div className="is-flex is-justify-content-space-between is-align-items-center mb-3">
                <h2 className="title is-6 mb-0">After</h2>
                {isProcessing && <span className="tag is-warning is-light">Streaming...</span>}
                {outputCode && !isProcessing && <span className="tag is-success is-light">Complete</span>}
              </div>
              <pre
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                  lineHeight: 1.6,
                  background: "var(--bg-subtle)",
                  padding: "1rem",
                  borderRadius: "8px",
                  overflow: "auto",
                  minHeight: "454px",
                  maxHeight: "454px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: "var(--text-primary)",
                }}
              >
                <code>{outputCode || "Migrated code will appear here..."}</code>
              </pre>
            </div>
          </div>
        </div>

        {error && (
          <div className="notification is-danger mt-4" role="alert">{error}</div>
        )}

        <div className="mt-5 has-text-centered">
          <button
            className="button is-primary is-medium"
            onClick={handleMigrate}
            disabled={isProcessing || !inputCode.trim()}
            aria-label="Run AI migration"
          >
            {isProcessing ? "Migrating..." : "Migrate with AI"}
          </button>
        </div>
      </div>
    </div>
  );
}
