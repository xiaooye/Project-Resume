"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

function ParticleField() {
  const meshRef = useRef<THREE.Points>(null);
  const [particles, setParticles] = useState<Float32Array | null>(null);

  useEffect(() => {
    const count = 2000;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 20;
    }

    setParticles(positions);
  }, []);

  useEffect(() => {
    if (!meshRef.current || !particles) return;

    const animate = () => {
      const positions = meshRef.current!.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += 0.01;
        if (positions[i] > 10) positions[i] = -10;
      }
      meshRef.current!.geometry.attributes.position.needsUpdate = true;
      requestAnimationFrame(animate);
    };

    animate();
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
      <pointsMaterial size={0.05} color="#3b82f6" transparent opacity={0.6} />
    </points>
  );
}

function Scene3D() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <ParticleField />
      <Stars radius={300} depth={50} count={5000} factor={4} fade speed={1} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
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

  useEffect(() => {
    const typeSpeed = isDeleting ? 50 : 100;
    const current = roles[currentRole];

    if (!isDeleting && displayText.length < current.length) {
      const timeout = setTimeout(() => {
        setDisplayText(current.substring(0, displayText.length + 1));
      }, typeSpeed);
      return () => clearTimeout(timeout);
    } else if (!isDeleting && displayText.length === current.length) {
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 2000);
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
      <div className="is-absolute" style={{ inset: 0, zIndex: 0 }}>
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
            >
              {displayText}
              <span>|</span>
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

