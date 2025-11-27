"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

function ParticleField({ 
  particleCount, 
  prefersReducedMotion 
}: { 
  particleCount: number;
  prefersReducedMotion: boolean;
}) {
  const meshRef = useRef<THREE.Points>(null);
  const [particles, setParticles] = useState<Float32Array | null>(null);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 30; // x
      positions[i + 1] = (Math.random() - 0.5) * 30; // y
      positions[i + 2] = (Math.random() - 0.5) * 30; // z
      velocities[i] = (Math.random() - 0.5) * 0.02; // vx
      velocities[i + 1] = Math.random() * 0.02 + 0.01; // vy (upward)
      velocities[i + 2] = (Math.random() - 0.5) * 0.02; // vz
    }

    setParticles(positions);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [particleCount]);

  useEffect(() => {
    if (!meshRef.current || !particles || prefersReducedMotion) return;

    const animate = () => {
      if (!meshRef.current) return;
      
      const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
      const count = positions.length / 3;
      
      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        // Update position
        positions[idx] += (Math.random() - 0.5) * 0.01;
        positions[idx + 1] += 0.015;
        positions[idx + 2] += (Math.random() - 0.5) * 0.01;
        
        // Reset if out of bounds
        if (positions[idx + 1] > 15) {
          positions[idx + 1] = -15;
          positions[idx] = (Math.random() - 0.5) * 30;
          positions[idx + 2] = (Math.random() - 0.5) * 30;
        }
      }
      
      meshRef.current.geometry.attributes.position.needsUpdate = true;
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [particles, prefersReducedMotion]);

  if (!particles) return null;

  return (
    <points ref={meshRef} aria-hidden="true">
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
          args={[particles, 3]}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.08} 
        color="#3b82f6" 
        transparent 
        opacity={0.7}
        sizeAttenuation={true}
      />
    </points>
  );
}

function Scene3D({ 
  isMobile, 
  prefersReducedMotion 
}: { 
  isMobile: boolean;
  prefersReducedMotion: boolean;
}) {
  // Reduce particle count on mobile for better performance
  const particleCount = isMobile ? 1000 : 3000;
  const starCount = isMobile ? 2000 : 5000;

  return (
    <Canvas 
      camera={{ position: [0, 0, 5], fov: 75 }} 
      gl={{ alpha: true, antialias: !isMobile }}
      dpr={isMobile ? 1 : 2}
      performance={{ min: 0.5 }}
      aria-label="3D particle field background animation"
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#6366f1" />
      <ParticleField particleCount={particleCount} prefersReducedMotion={prefersReducedMotion} />
      <Stars radius={300} depth={60} count={starCount} factor={4} fade speed={prefersReducedMotion ? 0 : 1} />
      {!prefersReducedMotion && (
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={0.3}
          enableDamping={true}
          dampingFactor={0.05}
        />
      )}
    </Canvas>
  );
}

const roles = [
  "Senior Full Stack Developer",
  "AI/ML Engineer",
  "Cloud Architect",
  "Web3 Developer",
  "System Designer",
];

export default function HeroSection() {
  const [currentRole, setCurrentRole] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [fps, setFps] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [loadTime, setLoadTime] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
  const loadStartTime = useRef<number>(0);
  const fpsRef = useRef<number>(0);
  const lastFrameTime = useRef<number>(performance.now());
  const frameCount = useRef<number>(0);
  const reducedMotion = useReducedMotion();

  // Mount check and initialize client-side only values
  useEffect(() => {
    setIsMounted(true);
    loadStartTime.current = performance.now();
    
    // Check if we should show performance metrics
    const shouldShow = process.env.NODE_ENV === "development" || 
      (typeof window !== "undefined" && window.location.search.includes("perf=true"));
    setShowPerformanceMetrics(shouldShow);
  }, []);

  // Detect mobile and reduced motion preference
  useEffect(() => {
    if (!isMounted) return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches || !!reducedMotion);
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches || !!reducedMotion);
    };
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      window.removeEventListener("resize", checkMobile);
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [reducedMotion, isMounted]);

  // Performance monitoring
  useEffect(() => {
    if (!isMounted) return;
    
    const measureFPS = () => {
      frameCount.current++;
      const now = performance.now();
      const elapsed = now - lastFrameTime.current;

      if (elapsed >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / elapsed));
        frameCount.current = 0;
        lastFrameTime.current = now;
      }

      fpsRef.current = requestAnimationFrame(measureFPS);
    };

    fpsRef.current = requestAnimationFrame(measureFPS);

    // Measure load time
    const loadEndTime = performance.now();
    setLoadTime(loadEndTime - loadStartTime.current);

    // Memory usage (Chrome only)
    const checkMemory = () => {
      // @ts-ignore - performance.memory is Chrome-specific
      if (performance.memory) {
        // @ts-ignore
        setMemoryUsage(performance.memory.usedJSHeapSize / 1048576); // MB
      }
    };
    checkMemory();
    const memoryInterval = setInterval(checkMemory, 2000);

    return () => {
      if (fpsRef.current) {
        cancelAnimationFrame(fpsRef.current);
      }
      clearInterval(memoryInterval);
    };
  }, [isMounted]);

  // Cursor blinking animation
  useEffect(() => {
    if (prefersReducedMotion) {
      setShowCursor(true);
      return;
    }
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, [prefersReducedMotion]);

  // Typing animation
  useEffect(() => {
    if (prefersReducedMotion) {
      // Show all text immediately if reduced motion is preferred
      setDisplayText(roles[currentRole]);
      return;
    }

    const typeSpeed = isDeleting ? 30 : 80;
    const pauseTime = isDeleting ? 50 : 2000;
    const current = roles[currentRole];

    if (!isDeleting && displayText.length < current.length) {
      const timeout = setTimeout(() => {
        setDisplayText(current.substring(0, displayText.length + 1));
      }, typeSpeed);
      return () => clearTimeout(timeout);
    } else if (!isDeleting && displayText.length === current.length) {
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, pauseTime);
      return () => clearTimeout(timeout);
    } else if (isDeleting && displayText.length > 0) {
      const timeout = setTimeout(() => {
        setDisplayText(current.substring(0, displayText.length - 1));
      }, typeSpeed);
      return () => clearTimeout(timeout);
    } else if (isDeleting && displayText.length === 0) {
      setIsDeleting(false);
      setCurrentRole((prev) => (prev + 1) % roles.length);
    }
  }, [displayText, isDeleting, currentRole, prefersReducedMotion]);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement> | React.KeyboardEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        const offset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
        (element as HTMLElement).focus();
      }
    }
  };

  return (
    <section className="hero is-fullheight is-relative" aria-label="Hero section">
      {/* 3D Background */}
      <div className="is-absolute is-fullwidth is-fullheight" aria-hidden="true">
        <Scene3D isMobile={isMobile} prefersReducedMotion={prefersReducedMotion} />
      </div>

      {/* Content */}
      <div className="hero-body is-relative">
        <div className="container has-text-centered">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? {} : { duration: 0.8 }}
            className="liquid-glass p-6"
            role="region"
            aria-label="Introduction"
          >
            <motion.h1
              className="title is-1 mb-6 liquid-glass-text"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={prefersReducedMotion ? false : { opacity: 1 }}
              transition={prefersReducedMotion ? {} : { delay: 0.2 }}
            >
              Hi, I&apos;m a
            </motion.h1>

            <motion.div
              className="title is-1 mb-6 liquid-glass-text"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={prefersReducedMotion ? false : { opacity: 1 }}
              transition={prefersReducedMotion ? {} : { delay: 0.4 }}
              aria-live="polite"
              aria-atomic="true"
            >
              <span className="has-text-primary" aria-label={`Current role: ${displayText || roles[currentRole]}`}>
                {displayText || roles[currentRole]}
              </span>
              {!prefersReducedMotion && (
                <motion.span
                  className="ml-1 has-text-primary"
                  animate={{ opacity: showCursor ? 1 : 0 }}
                  transition={{ duration: 0.1 }}
                  aria-hidden="true"
                >
                  |
                </motion.span>
              )}
            </motion.div>

            <motion.p
              className="subtitle is-4 mb-6 liquid-glass-text"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={prefersReducedMotion ? false : { opacity: 1 }}
              transition={prefersReducedMotion ? {} : { delay: 0.6 }}
            >
              Building scalable, high-performance web applications with cutting-edge
              technologies. Specialized in real-time systems, WebAssembly, AI/ML, and
              cloud-native architectures.
            </motion.p>

            <motion.div
              className="buttons is-centered"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? {} : { delay: 0.8 }}
            >
              <motion.a
                href="#demos"
                className="button is-primary is-large liquid-glass-button"
                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                onClick={(e) => handleSmoothScroll(e, "#demos")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleSmoothScroll(e, "#demos");
                  }
                }}
                aria-label="Navigate to demos section"
              >
                View Demos
              </motion.a>
              <motion.a
                href="/projects"
                className="button is-light is-large liquid-glass-button"
                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                aria-label="Navigate to projects page"
              >
                My Projects
              </motion.a>
            </motion.div>

            {/* Performance Metrics - Only show in development or with query param */}
            {isMounted && showPerformanceMetrics && (
              <div className="box mt-6 is-size-7">
                <div className="level">
                  <div className="level-item has-text-centered">
                    <div>
                      <p className="heading">FPS</p>
                      <p className="title is-6">{fps}</p>
                    </div>
                  </div>
                  <div className="level-item has-text-centered">
                    <div>
                      <p className="heading">Memory</p>
                      <p className="title is-6">{memoryUsage > 0 ? `${memoryUsage.toFixed(1)} MB` : "N/A"}</p>
                    </div>
                  </div>
                  <div className="level-item has-text-centered">
                    <div>
                      <p className="heading">Load Time</p>
                      <p className="title is-6">{loadTime.toFixed(0)}ms</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="hero-foot is-relative"
        initial={prefersReducedMotion ? false : { opacity: 0, y: -20 }}
        animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? {} : { delay: 1, repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
        aria-label="Scroll down indicator"
      >
        <div className="container has-text-centered">
          <svg
            className="icon"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </motion.div>
    </section>
  );
}

