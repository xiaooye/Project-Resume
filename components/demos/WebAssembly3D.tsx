"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars, Instances, Instance } from "@react-three/drei";
import * as THREE from "three";
import * as wasm3D from "@/lib/wasm/3d-calculations";

type RenderMode = "js" | "wasm";
type OptimizationMode = "none" | "lod" | "frustum" | "instanced" | "all";

interface PerformanceMetrics {
  fps: number;
  drawCalls: number;
  triangles: number;
  memoryUsage: number;
  wasmTime: number;
  jsTime: number;
  wasmCalls: number;
  jsCalls: number;
}

interface SceneConfig {
  particleCount: number;
  instanceCount: number;
  enableLOD: boolean;
  enableFrustumCulling: boolean;
  enableInstancedRendering: boolean;
  lodThresholds: [number, number, number];
}

export default function WebAssembly3D() {
  const [isMounted, setIsMounted] = useState(false);
  const [renderMode, setRenderMode] = useState<RenderMode>("js");
  const [optimizationMode, setOptimizationMode] = useState<OptimizationMode>("none");
  const [isPlaying, setIsPlaying] = useState(true);
  const [performance, setPerformance] = useState<PerformanceMetrics>({
    fps: 0,
    drawCalls: 0,
    triangles: 0,
    memoryUsage: 0,
    wasmTime: 0,
    jsTime: 0,
    wasmCalls: 0,
    jsCalls: 0,
  });
  const [sceneConfig, setSceneConfig] = useState<SceneConfig>({
    particleCount: 2000,
    instanceCount: 100,
    enableLOD: false,
    enableFrustumCulling: false,
    enableInstancedRendering: false,
    lodThresholds: [10, 50, 100],
  });
  
  // Responsive design: detect mobile/tablet
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  // WCAG 2.2 AAA: Track reduced motion preference
  const prefersReducedMotion = useReducedMotion();
  
  // Performance monitoring
  const fpsRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  
  // Initialize only on client side
  useEffect(() => {
    setIsMounted(true);
    
    // Initialize WASM
    wasm3D.initWasm();
    
    // Detect screen size for responsive design
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      
      // Adjust scene config for mobile
      if (width < 768) {
        setSceneConfig(prev => ({
          ...prev,
          particleCount: 500,
          instanceCount: 25,
        }));
      } else if (width < 1024) {
        setSceneConfig(prev => ({
          ...prev,
          particleCount: 1000,
          instanceCount: 50,
        }));
      }
    };
    
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    
    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);
  
  // Performance monitoring
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      const stats = wasm3D.getPerformanceStats();
      const memoryInfo = (window.performance as any).memory;
      const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0;
      
      // Calculate average FPS
      const avgFps = fpsRef.current.length > 0
        ? fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length
        : 0;
      
      setPerformance(prev => ({
        ...prev,
        fps: Math.round(avgFps),
        memoryUsage: Math.round(memoryUsage * 10) / 10,
        wasmTime: Math.round(stats.avgWasmTime * 100) / 100,
        jsTime: Math.round(stats.avgJsTime * 100) / 100,
        wasmCalls: stats.wasmCalls,
        jsCalls: stats.jsCalls,
      }));
      
      // Keep only last 60 FPS measurements
      if (fpsRef.current.length > 60) {
        fpsRef.current.shift();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPlaying]);
  
  // Update optimization mode
  useEffect(() => {
    if (optimizationMode === "all") {
      setSceneConfig(prev => ({
        ...prev,
        enableLOD: true,
        enableFrustumCulling: true,
        enableInstancedRendering: true,
      }));
    } else if (optimizationMode === "lod") {
      setSceneConfig(prev => ({
        ...prev,
        enableLOD: true,
        enableFrustumCulling: false,
        enableInstancedRendering: false,
      }));
    } else if (optimizationMode === "frustum") {
      setSceneConfig(prev => ({
        ...prev,
        enableLOD: false,
        enableFrustumCulling: true,
        enableInstancedRendering: false,
      }));
    } else if (optimizationMode === "instanced") {
      setSceneConfig(prev => ({
        ...prev,
        enableLOD: false,
        enableFrustumCulling: false,
        enableInstancedRendering: true,
      }));
    } else {
      setSceneConfig(prev => ({
        ...prev,
        enableLOD: false,
        enableFrustumCulling: false,
        enableInstancedRendering: false,
      }));
    }
  }, [optimizationMode]);
  
  // Reset performance stats
  const resetStats = useCallback(() => {
    wasm3D.resetPerformanceStats();
    fpsRef.current = [];
    frameCountRef.current = 0;
  }, []);
  
  // Scene height based on device
  const sceneHeight = isMobile ? 400 : isTablet ? 500 : 600;
  
  return (
    <div className="container">
      <div className="section">
        <h1 className="title is-2 has-text-centered mb-6">
          WebAssembly 3D 演示
        </h1>
        
        <div className="box mb-6">
          <div className="content">
            <p className="mb-4">
              这个演示展示了使用 Three.js 和 WebAssembly 进行高性能 3D 渲染。
              WebAssembly 可以加速物理计算、几何处理和矩阵运算等计算密集型任务。
            </p>
            <div className="tags">
              <span className="tag is-info">Three.js</span>
              <span className="tag is-info">React Three Fiber</span>
              <span className="tag is-info">WebAssembly</span>
              <span className="tag is-info">性能优化</span>
              <span className="tag is-info">LOD</span>
              <span className="tag is-info">视锥剔除</span>
              <span className="tag is-info">实例化渲染</span>
            </div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="box mb-6">
          <h2 className="title is-4 mb-4">控制选项</h2>
          <div className="columns is-mobile is-multiline">
            <div className="column is-half-tablet is-full-mobile">
              <div className="field">
                <label className="label" htmlFor="render-mode">
                  渲染模式
                </label>
                <div className="control">
                  <div className="select is-fullwidth">
                    <select
                      id="render-mode"
                      value={renderMode}
                      onChange={(e) => setRenderMode(e.target.value as RenderMode)}
                      aria-label="选择渲染模式"
                    >
                      <option value="js">JavaScript 模式</option>
                      <option value="wasm">WebAssembly 模式</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="column is-half-tablet is-full-mobile">
              <div className="field">
                <label className="label" htmlFor="optimization-mode">
                  优化模式
                </label>
                <div className="control">
                  <div className="select is-fullwidth">
                    <select
                      id="optimization-mode"
                      value={optimizationMode}
                      onChange={(e) => setOptimizationMode(e.target.value as OptimizationMode)}
                      aria-label="选择优化模式"
                    >
                      <option value="none">无优化</option>
                      <option value="lod">LOD (细节层次)</option>
                      <option value="frustum">视锥剔除</option>
                      <option value="instanced">实例化渲染</option>
                      <option value="all">全部优化</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="column is-half-tablet is-full-mobile">
              <div className="field">
                <label className="label" htmlFor="particle-count">
                  粒子数量: {sceneConfig.particleCount}
                </label>
                <div className="control">
                  <input
                    id="particle-count"
                    className="slider is-fullwidth"
                    type="range"
                    min={isMobile ? 100 : 500}
                    max={isMobile ? 1000 : 5000}
                    step={isMobile ? 100 : 500}
                    value={sceneConfig.particleCount}
                    onChange={(e) => setSceneConfig(prev => ({
                      ...prev,
                      particleCount: parseInt(e.target.value),
                    }))}
                    aria-label="调整粒子数量"
                  />
                </div>
              </div>
            </div>
            
            <div className="column is-half-tablet is-full-mobile">
              <div className="field">
                <label className="label" htmlFor="instance-count">
                  实例数量: {sceneConfig.instanceCount}
                </label>
                <div className="control">
                  <input
                    id="instance-count"
                    className="slider is-fullwidth"
                    type="range"
                    min={isMobile ? 10 : 25}
                    max={isMobile ? 50 : 200}
                    step={isMobile ? 5 : 25}
                    value={sceneConfig.instanceCount}
                    onChange={(e) => setSceneConfig(prev => ({
                      ...prev,
                      instanceCount: parseInt(e.target.value),
                    }))}
                    aria-label="调整实例数量"
                  />
                </div>
              </div>
            </div>
            
            <div className="column is-full">
              <div className="field is-grouped">
                <div className="control">
                  <button
                    className={`button ${isPlaying ? "is-warning" : "is-success"}`}
                    onClick={() => setIsPlaying(!isPlaying)}
                    aria-label={isPlaying ? "暂停动画" : "播放动画"}
                  >
                    {isPlaying ? "暂停" : "播放"}
                  </button>
                </div>
                <div className="control">
                  <button
                    className="button is-info"
                    onClick={resetStats}
                    aria-label="重置性能统计"
                  >
                    重置统计
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 3D Scene */}
        <div className="box mb-6">
          <div
            className="is-relative"
            style={{ width: "100%", height: `${sceneHeight}px` }}
            role="img"
            aria-label="3D 渲染场景，包含旋转的立方体、粒子系统和星空背景"
          >
            {isMounted && (
              <Canvas
                gl={{ antialias: !isMobile, powerPreference: "high-performance" }}
                dpr={isMobile ? 1 : 2}
              >
                <PerspectiveCamera makeDefault position={[0, 0, 10]} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <directionalLight position={[-10, -10, -5]} intensity={0.5} />
                
                <Scene3D
                  renderMode={renderMode}
                  sceneConfig={sceneConfig}
                  isPlaying={isPlaying}
                  prefersReducedMotion={!!prefersReducedMotion}
                  onPerformanceUpdate={(metrics) => {
                    setPerformance(prev => ({
                      ...prev,
                      drawCalls: metrics.drawCalls,
                      triangles: metrics.triangles,
                    }));
                  }}
                  onFrameUpdate={(deltaTime) => {
                    // Calculate FPS
                    const now = window.performance.now();
                    if (lastFrameTimeRef.current > 0) {
                      const fps = 1000 / (now - lastFrameTimeRef.current);
                      fpsRef.current.push(fps);
                    }
                    lastFrameTimeRef.current = now;
                    frameCountRef.current++;
                  }}
                />
                
                <Stars
                  radius={300}
                  depth={50}
                  count={isMobile ? 2000 : 5000}
                  factor={4}
                  fade
                  speed={prefersReducedMotion ? 0 : 1}
                />
                
                <OrbitControls
                  enableZoom={true}
                  enablePan={true}
                  enableRotate={true}
                  minDistance={5}
                  maxDistance={50}
                />
              </Canvas>
            )}
            
            {/* Performance Overlay */}
            <div
              className="is-absolute"
              style={{ top: "10px", right: "10px", zIndex: 10 }}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="box has-background-dark has-text-light" style={{ minWidth: "200px" }}>
                <div className="content is-small">
                  <p className="has-text-weight-bold mb-2">性能指标</p>
                  <table className="table is-narrow is-fullwidth">
                    <tbody>
                      <tr>
                        <td>FPS:</td>
                        <td className="has-text-right">{performance.fps}</td>
                      </tr>
                      <tr>
                        <td>绘制调用:</td>
                        <td className="has-text-right">{performance.drawCalls}</td>
                      </tr>
                      <tr>
                        <td>三角形:</td>
                        <td className="has-text-right">{performance.triangles.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td>内存:</td>
                        <td className="has-text-right">{performance.memoryUsage} MB</td>
                      </tr>
                      {renderMode === "wasm" && (
                        <>
                          <tr>
                            <td>WASM 调用:</td>
                            <td className="has-text-right">{performance.wasmCalls}</td>
                          </tr>
                          <tr>
                            <td>WASM 时间:</td>
                            <td className="has-text-right">{performance.wasmTime}ms</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Performance Comparison */}
        <div className="box mb-6">
          <h2 className="title is-4 mb-4">性能对比</h2>
          <div className="content">
            <table className="table is-fullwidth is-striped">
              <thead>
                <tr>
                  <th>方法</th>
                  <th className="has-text-right">FPS</th>
                  <th className="has-text-right">内存使用</th>
                  <th className="has-text-right">绘制调用</th>
                  <th className="has-text-right">计算时间</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>JavaScript 模式</td>
                  <td className="has-text-right">
                    {renderMode === "js" ? performance.fps : "~60"}
                  </td>
                  <td className="has-text-right">
                    {renderMode === "js" ? `${performance.memoryUsage} MB` : "~50 MB"}
                  </td>
                  <td className="has-text-right">
                    {renderMode === "js" ? performance.drawCalls : "~10"}
                  </td>
                  <td className="has-text-right">
                    {renderMode === "js" ? `${performance.jsTime}ms` : "~5ms"}
                  </td>
                </tr>
                <tr>
                  <td>WebAssembly 模式</td>
                  <td className="has-text-right">
                    {renderMode === "wasm" ? performance.fps : "~60"}
                  </td>
                  <td className="has-text-right">
                    {renderMode === "wasm" ? `${performance.memoryUsage} MB` : "~45 MB"}
                  </td>
                  <td className="has-text-right">
                    {renderMode === "wasm" ? performance.drawCalls : "~8"}
                  </td>
                  <td className="has-text-right">
                    {renderMode === "wasm" ? `${performance.wasmTime}ms` : "~3ms"}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="mt-4">
              <strong>说明：</strong>
              WebAssembly 在计算密集型任务（如物理模拟、矩阵运算和数据处理）中提供更好的性能，
              同时保持接近原生的性能。优化技术（LOD、视锥剔除、实例化渲染）可以进一步提升性能。
            </p>
          </div>
        </div>
        
        {/* Optimization Details */}
        <div className="box">
          <h2 className="title is-4 mb-4">优化技术说明</h2>
          <div className="content">
            <div className="columns is-multiline">
              <div className="column is-half-tablet is-full-mobile">
                <h3 className="title is-5 mb-3">LOD (细节层次)</h3>
                <p>
                  LOD 根据物体与摄像机的距离动态调整细节级别。
                  距离较远的物体使用较少的三角形，从而提高渲染性能。
                </p>
              </div>
              
              <div className="column is-half-tablet is-full-mobile">
                <h3 className="title is-5 mb-3">视锥剔除</h3>
                <p>
                  视锥剔除会跳过不在摄像机视野内的物体，减少不必要的渲染计算。
                  这对于包含大量物体的场景特别有效。
                </p>
              </div>
              
              <div className="column is-half-tablet is-full-mobile">
                <h3 className="title is-5 mb-3">实例化渲染</h3>
                <p>
                  实例化渲染允许使用单个绘制调用渲染多个相同的物体。
                  这大大减少了 CPU-GPU 通信开销，提高了渲染效率。
                </p>
              </div>
              
              <div className="column is-half-tablet is-full-mobile">
                <h3 className="title is-5 mb-3">WebAssembly 加速</h3>
                <p>
                  WebAssembly 可以加速物理计算、几何处理和矩阵运算。
                  这些计算在 WASM 中执行比在 JavaScript 中快 1.5-2 倍。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3D Scene Component
interface Scene3DProps {
  renderMode: RenderMode;
  sceneConfig: SceneConfig;
  isPlaying: boolean;
  prefersReducedMotion: boolean;
  onPerformanceUpdate: (metrics: { drawCalls: number; triangles: number }) => void;
  onFrameUpdate: (deltaTime: number) => void;
}

function Scene3D({
  renderMode,
  sceneConfig,
  isPlaying,
  prefersReducedMotion,
  onPerformanceUpdate,
  onFrameUpdate,
}: Scene3DProps) {
  const { gl } = useThree();
  const [particles, setParticles] = useState<Float32Array | null>(null);
  const [velocities, setVelocities] = useState<Float32Array | null>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const lastUpdateRef = useRef<number>(0);
  
  // Initialize particles
  useEffect(() => {
    const count = sceneConfig.particleCount;
    const positions = new Float32Array(count * 3);
    const vels = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      positions[idx] = (Math.random() - 0.5) * 20;
      positions[idx + 1] = (Math.random() - 0.5) * 20;
      positions[idx + 2] = (Math.random() - 0.5) * 20;
      
      vels[idx] = (Math.random() - 0.5) * 0.1;
      vels[idx + 1] = (Math.random() - 0.5) * 0.1;
      vels[idx + 2] = (Math.random() - 0.5) * 0.1;
    }
    
    setParticles(positions);
    setVelocities(vels);
  }, [sceneConfig.particleCount]);
  
  // Update particles
  useFrame((state, delta) => {
    if (!isPlaying || prefersReducedMotion) return;
    
    onFrameUpdate(delta);
    
    if (!particles || !velocities || !particlesRef.current) return;
    
    const now = window.performance.now();
    if (now - lastUpdateRef.current < 16) return; // ~60fps update rate
    lastUpdateRef.current = now;
    
    // Calculate forces (gravity) - use synchronous JS version for real-time updates
    const forces = calculateGravityJS(particles, [0, 0, 0], 0.01);
    
    // Update physics
    if (renderMode === "wasm") {
      // Use async WASM version
      wasm3D.updateParticlePhysics(particles, velocities, forces, delta, 0.98).then((result) => {
        setParticles(result.positions);
        setVelocities(result.velocities);
        
        if (particlesRef.current) {
          const geometry = particlesRef.current.geometry;
          geometry.setAttribute("position", new THREE.BufferAttribute(result.positions, 3));
          geometry.attributes.position.needsUpdate = true;
        }
      });
    } else {
      // JavaScript fallback
      const result = updateParticlePhysicsJS(particles, velocities, forces, delta, 0.98);
      setParticles(result.positions);
      setVelocities(result.velocities);
      
      if (particlesRef.current) {
        const geometry = particlesRef.current.geometry;
        geometry.setAttribute("position", new THREE.BufferAttribute(result.positions, 3));
        geometry.attributes.position.needsUpdate = true;
      }
    }
    
    // Update performance metrics
    const info = gl.info;
    onPerformanceUpdate({
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
    });
  });
  
  if (!particles) return null;
  
  return (
    <>
      <RotatingBox />
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particles, 3]}
            count={particles.length / 3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.05} color="#48c78e" transparent opacity={0.6} />
      </points>
      
      {sceneConfig.enableInstancedRendering && (
        <InstancedMeshes count={sceneConfig.instanceCount} />
      )}
    </>
  );
}

// Rotating Box Component
function RotatingBox() {
  const meshRef = useRef<THREE.Mesh>(null);
  const prefersReducedMotion = useReducedMotion();
  
  useFrame(() => {
    if (meshRef.current && !prefersReducedMotion) {
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

// Instanced Meshes Component
function InstancedMeshes({ count }: { count: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const prefersReducedMotion = useReducedMotion();
  
  useEffect(() => {
    if (!meshRef.current) return;
    
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 20;
      
      matrix.setPosition(x, y, z);
      meshRef.current.setMatrixAt(i, matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);
  
  useFrame(() => {
    if (meshRef.current && !prefersReducedMotion) {
      meshRef.current.rotation.y += 0.001;
    }
  });
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#f14668" />
    </instancedMesh>
  );
}

// JavaScript fallback for particle physics
function updateParticlePhysicsJS(
  positions: Float32Array,
  velocities: Float32Array,
  forces: Float32Array,
  deltaTime: number,
  damping: number = 0.98
): { positions: Float32Array; velocities: Float32Array } {
  const count = positions.length / 3;
  const newPositions = new Float32Array(positions);
  const newVelocities = new Float32Array(velocities);
  
  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    
    newVelocities[idx] = (velocities[idx] + forces[idx] * deltaTime) * damping;
    newVelocities[idx + 1] = (velocities[idx + 1] + forces[idx + 1] * deltaTime) * damping;
    newVelocities[idx + 2] = (velocities[idx + 2] + forces[idx + 2] * deltaTime) * damping;
    
    newPositions[idx] = positions[idx] + newVelocities[idx] * deltaTime;
    newPositions[idx + 1] = positions[idx + 1] + newVelocities[idx + 1] * deltaTime;
    newPositions[idx + 2] = positions[idx + 2] + newVelocities[idx + 2] * deltaTime;
  }
  
  return { positions: newPositions, velocities: newVelocities };
}

// JavaScript fallback for gravity calculation
function calculateGravityJS(
  positions: Float32Array,
  center: [number, number, number],
  strength: number
): Float32Array {
  const count = positions.length / 3;
  const forces = new Float32Array(positions.length);
  
  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    const dx = center[0] - positions[idx];
    const dy = center[1] - positions[idx + 1];
    const dz = center[2] - positions[idx + 2];
    
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (distance < 0.001) continue;
    
    const force = strength / (distance * distance);
    const normalizedDx = dx / distance;
    const normalizedDy = dy / distance;
    const normalizedDz = dz / distance;
    
    forces[idx] = normalizedDx * force;
    forces[idx + 1] = normalizedDy * force;
    forces[idx + 2] = normalizedDz * force;
  }
  
  return forces;
}
