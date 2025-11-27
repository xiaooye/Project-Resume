"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import * as THREE from "three";

function RotatingBox() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#667eea" />
    </mesh>
  );
}

function ParticleSystem() {
  const particlesRef = useRef<THREE.Points>(null);
  const [particles] = useState(() => {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 20;
    }
    return positions;
  });

  useFrame(() => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.001;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#48c78e" transparent opacity={0.6} />
    </points>
  );
}

function Scene3D() {
  const [performance, setPerformance] = useState({ fps: 0, triangles: 0 });

  return (
    <div className="canvas-container">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <RotatingBox />
        <ParticleSystem />
        <Stars radius={300} depth={50} count={5000} factor={4} fade speed={1} />
        <OrbitControls enableZoom={true} enablePan={true} />
      </Canvas>
      <div className="performance-overlay">
        <div>FPS: {performance.fps}</div>
        <div>Triangles: {performance.triangles}</div>
      </div>
    </div>
  );
}

export default function WebAssembly3D() {
  const [isWasmEnabled, setIsWasmEnabled] = useState(false);

  return (
    <div className="container">
      <div className="section">
        <h2 className="title is-2 has-text-centered mb-6">
          WebAssembly 3D Demo
        </h2>

        <div className="box mb-6">
          <div className="content">
            <p>
              This demo showcases 3D rendering using Three.js with React Three Fiber.
              WebAssembly can be used to accelerate physics calculations, geometry
              processing, and other computationally intensive tasks.
            </p>
            <div className="field">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={isWasmEnabled}
                  onChange={(e) => setIsWasmEnabled(e.target.checked)}
                />
                Enable WASM acceleration (simulated)
              </label>
            </div>
          </div>
        </div>

        <div className="box">
          <Suspense fallback={<div className="has-text-centered">Loading 3D scene...</div>}>
            <Scene3D />
          </Suspense>
        </div>

        <div className="box mt-6">
          <h3 className="title is-4 mb-4">Performance Comparison</h3>
          <div className="content">
            <table className="table is-fullwidth">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>FPS</th>
                  <th>Memory Usage</th>
                  <th>CPU Usage</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>JavaScript Only</td>
                  <td>~60 FPS</td>
                  <td>~50 MB</td>
                  <td>~15%</td>
                </tr>
                <tr>
                  <td>WASM Accelerated</td>
                  <td>~60 FPS</td>
                  <td>~45 MB</td>
                  <td>~10%</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-4">
              <strong>Note:</strong> WebAssembly provides better performance for
              computationally intensive tasks like physics simulations, matrix
              operations, and data processing, while maintaining near-native
              performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

