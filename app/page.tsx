import HeroSection from "@/components/sections/HeroSection";

import Link from "next/link";

export default function Home() {
  const demos = [
    {
      title: "Real-time Network Traffic",
      description: "WebSocket-based load balancing visualization with D3.js",
      href: "/demos/network-traffic",
      icon: "🌐",
    },
    {
      title: "Big Data Handling",
      description: "Virtual scrolling and streaming for millions of records",
      href: "/demos/big-data",
      icon: "📊",
    },
    {
      title: "WebAssembly 3D",
      description: "Three.js + WASM accelerated 3D rendering",
      href: "/demos/webassembly-3d",
      icon: "🎮",
    },
    {
      title: "WebAssembly Video",
      description: "FFmpeg.wasm video processing and encoding",
      href: "/demos/webassembly-video",
      icon: "🎬",
    },
    {
      title: "ONNX Runtime AI",
      description: "ONNX Runtime Web for ML inference",
      href: "/demos/onnx-ai",
      icon: "🤖",
    },
    {
      title: "AI Agents",
      description: "Gemini & GPT integration with streaming",
      href: "/demos/ai-agents",
      icon: "💬",
    },
  ];

  return (
    <div>
      <HeroSection />
      <section id="demos" className="section">
        <div className="container">
          <h2 className="title is-2 has-text-centered mb-6 liquid-glass-text">
            Interactive Demos
          </h2>
          <p className="subtitle is-5 has-text-centered mb-6 liquid-glass-text">
            Explore advanced technology demonstrations showcasing real-world
            applications
          </p>

          <div className="columns is-multiline">
            {demos.map((demo) => (
              <div key={demo.href} className="column is-one-third">
                <Link href={demo.href}>
                  <div className="card liquid-glass-card">
                    <div className="card-content">
                      <div className="media">
                        <div className="media-left">
                          <div className="is-size-1">{demo.icon}</div>
                        </div>
                        <div className="media-content">
                          <p className="title is-4 liquid-glass-text">{demo.title}</p>
                        </div>
                      </div>
                      <div className="content liquid-glass-text">{demo.description}</div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
