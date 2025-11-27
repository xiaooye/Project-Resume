"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { gsap } from "gsap";

// Simple Lottie animation data (in production, load from JSON file)
const lottieAnimationData = {
  v: "5.5.7",
  fr: 60,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  nm: "Demo Animation",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Circle",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [{ i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] }, t: 0, s: [0] }, { t: 60, s: [360] }] },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [50, 50] },
              p: { a: 0, k: [0, 0] },
              nm: "Ellipse Path 1",
            },
            {
              ty: "st",
              c: { a: 0, k: [0, 0.8, 0.5, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 3 },
              lc: 1,
              lj: 1,
              ml: 4,
              bm: 0,
              nm: "Stroke 1",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              sk: { a: 0, k: 0 },
              sa: { a: 0, k: 0 },
              nm: "Transform",
            },
          ],
          nm: "Ellipse 1",
          bm: 0,
        },
      ],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0,
    },
  ],
};

// Particle System
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
};

export default function AnimationsDemo() {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [activeTab, setActiveTab] = useState<"lottie" | "gsap" | "particles">("lottie");
  const [particles, setParticles] = useState<Particle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsapBoxRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize
  useEffect(() => {
    setIsMounted(true);

    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleReducedMotion = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    mediaQuery.addEventListener("change", handleReducedMotion);

    // Initialize particles
    if (activeTab === "particles") {
      initParticles();
    }

    return () => {
      window.removeEventListener("resize", checkScreenSize);
      mediaQuery.removeEventListener("change", handleReducedMotion);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // GSAP Animations
  useEffect(() => {
    if (activeTab === "gsap" && gsapBoxRef.current && !prefersReducedMotion) {
      const boxes = gsapBoxRef.current.querySelectorAll(".gsap-box");
      gsap.fromTo(
        boxes,
        { opacity: 0, y: 50, scale: 0.8 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "back.out(1.7)",
        }
      );

      // Continuous animation
      gsap.to(boxes, {
        rotation: 360,
        duration: 2,
        repeat: -1,
        ease: "none",
      });
    }
  }, [activeTab, prefersReducedMotion]);

  // Particle System
  const initParticles = () => {
    const count = isMobile ? 50 : 100;
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x: Math.random() * (canvasRef.current?.width || 800),
        y: Math.random() * (canvasRef.current?.height || 600),
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        life: 1,
      });
    }
    setParticles(newParticles);
  };

  useEffect(() => {
    if (activeTab === "particles" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      const animate = () => {
        if (prefersReducedMotion) {
          return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        setParticles((prev) =>
          prev.map((p) => {
            let x = p.x + p.vx;
            let y = p.y + p.vy;

            if (x < 0 || x > canvas.width) p.vx *= -1;
            if (y < 0 || y > canvas.height) p.vy *= -1;

            x = Math.max(0, Math.min(canvas.width, x));
            y = Math.max(0, Math.min(canvas.height, y));

            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();

            return { ...p, x, y };
          })
        );

        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animate();
    }
  }, [activeTab, prefersReducedMotion, isMobile]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="container is-fluid mt-6">
      <div className="box liquid-glass-card">
        <h1 className="title is-2 mb-6 liquid-glass-text">Advanced Animations Demo</h1>
        <p className="subtitle is-5 mb-6 liquid-glass-text">
          High-performance animations using Lottie, GSAP, and custom particle systems
        </p>

        {/* Tabs */}
        <div className="tabs is-boxed">
          <ul>
            <li className={activeTab === "lottie" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("lottie")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("lottie");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Lottie animations tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">🎬</span>
                </span>
                <span>Lottie</span>
              </a>
            </li>
            <li className={activeTab === "gsap" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("gsap")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("gsap");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="GSAP animations tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">⚡</span>
                </span>
                <span>GSAP</span>
              </a>
            </li>
            <li className={activeTab === "particles" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("particles")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("particles");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Particle system tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">✨</span>
                </span>
                <span>Particles</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Lottie Tab */}
          {activeTab === "lottie" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">Lottie Animations</h2>
              <p className="subtitle is-6 mb-4 liquid-glass-text">
                Vector-based animations with After Effects integration
              </p>

              <div className="box liquid-glass-card">
                <div className="columns">
                  <div className="column has-text-centered">
                    <div style={{ width: "200px", height: "200px", margin: "0 auto" }}>
                      <Lottie
                        animationData={lottieAnimationData}
                        loop={true}
                        autoplay={!prefersReducedMotion}
                        aria-label="Lottie animation demo"
                      />
                    </div>
                    <p className="liquid-glass-text mt-4">旋转动画</p>
                  </div>
                </div>
              </div>

              <div className="box liquid-glass-card">
                <h3 className="title is-5 mb-3 liquid-glass-text">Lottie 特性</h3>
                <div className="content">
                  <ul>
                    <li>🎨 矢量动画 - 无损缩放，文件小</li>
                    <li>⚡ 高性能 - 硬件加速渲染</li>
                    <li>🔄 After Effects 集成 - 设计师友好</li>
                    <li>📱 跨平台 - Web、iOS、Android 支持</li>
                    <li>🎛️ 可控制 - 播放、暂停、速度控制</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* GSAP Tab */}
          {activeTab === "gsap" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">GSAP Animations</h2>
              <p className="subtitle is-6 mb-4 liquid-glass-text">
                Professional-grade animation library with timeline control
              </p>

              <div className="box liquid-glass-card" ref={gsapBoxRef}>
                <div className="columns is-multiline">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className={`column ${isMobile ? "is-half" : "is-one-third"}`}>
                      <div className="box liquid-glass-card gsap-box has-text-centered" style={{ minHeight: "150px" }}>
                        <h3 className="title is-5 liquid-glass-text">Box {i}</h3>
                        <p className="liquid-glass-text">GSAP 动画演示</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="box liquid-glass-card">
                <h3 className="title is-5 mb-3 liquid-glass-text">GSAP 特性</h3>
                <div className="content">
                  <ul>
                    <li>⚡ 高性能 - 优化的动画引擎</li>
                    <li>🎬 Timeline 控制 - 复杂动画序列</li>
                    <li>🎯 精确控制 - 缓动函数，回调</li>
                    <li>📊 性能监控 - 内置性能工具</li>
                    <li>🔄 插件系统 - 丰富的扩展功能</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Particles Tab */}
          {activeTab === "particles" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">Particle System</h2>
              <p className="subtitle is-6 mb-4 liquid-glass-text">
                Real-time particle system with physics simulation
              </p>

              <div className="box liquid-glass-card">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="is-fullwidth"
                  style={{ height: isMobile ? "400px" : "600px", border: "1px solid #ccc" }}
                  aria-label="Particle system canvas"
                />
                <div className="buttons mt-4">
                  <button
                    className="button is-primary"
                    onClick={initParticles}
                    aria-label="Reset particles"
                  >
                    重置粒子
                  </button>
                </div>
              </div>

              <div className="box liquid-glass-card">
                <h3 className="title is-5 mb-3 liquid-glass-text">粒子系统特性</h3>
                <div className="content">
                  <ul>
                    <li>✨ 实时渲染 - 60fps 流畅动画</li>
                    <li>🔬 物理模拟 - 碰撞检测，重力</li>
                    <li>🎨 视觉效果 - 颜色渐变，透明度</li>
                    <li>⚡ 性能优化 - Canvas 2D 加速</li>
                    <li>📱 响应式 - 移动端自适应</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

