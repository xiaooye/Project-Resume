"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

function ParticleField() {
  const meshRef = useRef<THREE.Points>(null);
  const [particles, setParticles] = useState<Float32Array | null>(null);
  const frameRef = useRef<number>();

  useEffect(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
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
  }, []);

  useEffect(() => {
    if (!meshRef.current || !particles) return;

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
  }, [particles]);

  if (!particles) return null;

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
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

function Scene3D() {
  return (
    <Canvas 
      camera={{ position: [0, 0, 5], fov: 75 }} 
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#6366f1" />
      <ParticleField />
      <Stars radius={300} depth={60} count={5000} factor={4} fade speed={1} />
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        autoRotate 
        autoRotateSpeed={0.3}
        enableDamping={true}
        dampingFactor={0.05}
      />
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

  // Cursor blinking animation
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  // Typing animation
  useEffect(() => {
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
  }, [displayText, isDeleting, currentRole]);

  return (
    <section className="hero is-fullheight">
      {/* 3D Background */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <Scene3D />
      </div>

      {/* Content */}
      <div className="hero-body" style={{ position: "relative", zIndex: 10 }}>
        <div className="container has-text-centered">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="title is-1 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Hi, I&apos;m a
            </motion.h1>

            <motion.div
              className="title is-1 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{ minHeight: "4rem" }}
            >
              <span className="has-text-primary">{displayText}</span>
              <motion.span
                animate={{ opacity: showCursor ? 1 : 0 }}
                transition={{ duration: 0.1 }}
                style={{ marginLeft: "4px", color: "var(--bulma-primary)" }}
              >
                |
              </motion.span>
            </motion.div>

            <motion.p
              className="subtitle is-4 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Building scalable, high-performance web applications with cutting-edge
              technologies. Specialized in real-time systems, WebAssembly, AI/ML, and
              cloud-native architectures.
            </motion.p>

            <motion.div
              className="buttons is-centered"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <motion.a
                href="#demos"
                className="button is-primary is-large"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.querySelector("#demos");
                  if (element) {
                    const offset = 80; // Account for fixed navbar
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: "smooth",
                    });
                  }
                }}
              >
                View Demos
              </motion.a>
              <motion.a
                href="/projects"
                className="button is-light is-large"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                My Projects
              </motion.a>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="hero-foot"
        style={{ position: "relative", zIndex: 10 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
      >
        <div className="container has-text-centered">
          <svg
            style={{ width: "24px", height: "24px" }}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </motion.div>
    </section>
  );
}

