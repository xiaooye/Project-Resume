"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Sky,
  ContactShadows,
  Grid,
  Float,
  Text3D,
  Center,
  Html,
  useKeyboardControls,
  PointerLockControls,
} from "@react-three/drei";
import * as THREE from "three";
import * as wasm3D from "@/lib/wasm/3d-calculations";

type CameraMode = "first-person" | "third-person" | "free";
type GameState = "menu" | "playing" | "paused" | "gameover";

interface PerformanceMetrics {
  fps: number;
  drawCalls: number;
  triangles: number;
  memoryUsage: number;
  wasmTime: number;
  wasmCalls: number;
}

interface GameStats {
  score: number;
  collectibles: number;
  time: number;
  health: number;
}

interface SceneConfig {
  enableShadows: boolean;
  enableFog: boolean;
  lightIntensity: number;
  shadowMapSize: number;
  renderDistance: number;
  lodEnabled: boolean;
}

interface Collectible {
  id: string;
  position: [number, number, number];
  collected: boolean;
  type: "coin" | "powerup" | "key";
}

export default function WebAssembly3D() {
  const [isMounted, setIsMounted] = useState(false);
  const [gameState, setGameState] = useState<GameState>("menu");
  const [cameraMode, setCameraMode] = useState<CameraMode>("third-person");
  const [isPlaying, setIsPlaying] = useState(true);
  const [performance, setPerformance] = useState<PerformanceMetrics>({
    fps: 0,
    drawCalls: 0,
    triangles: 0,
    memoryUsage: 0,
    wasmTime: 0,
    wasmCalls: 0,
  });
  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    collectibles: 0,
    time: 0,
    health: 100,
  });
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [sceneConfig, setSceneConfig] = useState<SceneConfig>({
    enableShadows: true,
    enableFog: false,
    lightIntensity: 1.0,
    shadowMapSize: 2048,
    renderDistance: 100,
    lodEnabled: true,
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
  const gameTimeRef = useRef<number>(0);

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
        setSceneConfig((prev) => ({
          ...prev,
          shadowMapSize: 1024,
          renderDistance: 50,
        }));
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    // Initialize collectibles
    const initialCollectibles: Collectible[] = [];
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const radius = 3 + Math.random() * 7;
      initialCollectibles.push({
        id: `collectible-${i}`,
        position: [
          Math.cos(angle) * radius,
          1 + Math.random() * 2,
          Math.sin(angle) * radius,
        ],
        collected: false,
        type: Math.random() > 0.7 ? (Math.random() > 0.5 ? "powerup" : "key") : "coin",
      });
    }
    setCollectibles(initialCollectibles);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  // Game timer
  useEffect(() => {
    if (gameState !== "playing") return;

    const interval = setInterval(() => {
      gameTimeRef.current += 0.1;
      setGameStats((prev) => ({
        ...prev,
        time: Math.round(gameTimeRef.current * 10) / 10,
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [gameState]);

  // Performance monitoring
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const stats = wasm3D.getPerformanceStats();
      const memoryInfo = (window.performance as any).memory;
      const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0;

      // Calculate average FPS
      const avgFps =
        fpsRef.current.length > 0
          ? fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length
          : 0;

      setPerformance((prev) => ({
        ...prev,
        fps: Math.round(avgFps),
        memoryUsage: Math.round(memoryUsage * 10) / 10,
        wasmTime: Math.round(stats.avgWasmTime * 100) / 100,
        wasmCalls: stats.wasmCalls,
      }));

      // Keep only last 60 FPS measurements
      if (fpsRef.current.length > 60) {
        fpsRef.current.shift();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Reset performance stats
  const resetStats = useCallback(() => {
    wasm3D.resetPerformanceStats();
    fpsRef.current = [];
    frameCountRef.current = 0;
  }, []);

  // Start game
  const startGame = useCallback(() => {
    setGameState("playing");
    setGameStats({
      score: 0,
      collectibles: 0,
      time: 0,
      health: 100,
    });
    gameTimeRef.current = 0;
    // Reset collectibles
    setCollectibles((prev) =>
      prev.map((c) => ({ ...c, collected: false }))
    );
  }, []);

  // Collect item
  const collectItem = useCallback((id: string, type: Collectible["type"]) => {
    setCollectibles((prev) =>
      prev.map((c) => (c.id === id ? { ...c, collected: true } : c))
    );
    setGameStats((prev) => {
      const scoreIncrease =
        type === "coin" ? 10 : type === "powerup" ? 50 : 100;
      const collectibleIncrease = 1;
      return {
        ...prev,
        score: prev.score + scoreIncrease,
        collectibles: prev.collectibles + collectibleIncrease,
      };
    });
  }, []);

  // Scene height based on device
  const sceneHeight = isMobile ? 500 : isTablet ? 600 : 700;

  return (
    <div className="container">
      <div className="section">
        <h1 className="title is-2 has-text-centered mb-6">
          WebAssembly 3D Game Demo
        </h1>

        <div className="box mb-6">
          <div className="content">
            <p className="mb-4">
              A realistic 3D game environment powered by WebAssembly. Collect items, explore the
              world, and experience real-time 3D rendering with advanced physics and lighting.
            </p>
            <div className="tags">
              <span className="tag is-info">WebAssembly</span>
              <span className="tag is-info">Three.js</span>
              <span className="tag is-info">Real-time Rendering</span>
              <span className="tag is-info">Game Mechanics</span>
              <span className="tag is-info">Physics</span>
              <span className="tag is-info">Dynamic Lighting</span>
            </div>
          </div>
        </div>

        {/* Game UI */}
        {gameState === "playing" && (
          <div className="box mb-6">
            <div className="columns is-mobile is-vcentered">
              <div className="column">
                <div className="content">
                  <p className="has-text-weight-bold">
                    Score: <span className="has-text-primary">{gameStats.score}</span>
                  </p>
                  <p>
                    Collectibles: <span className="has-text-success">{gameStats.collectibles}/20</span>
                  </p>
                </div>
              </div>
              <div className="column">
                <div className="content has-text-right">
                  <p>Time: {gameStats.time.toFixed(1)}s</p>
                  <p>
                    Health: <span className="has-text-danger">{gameStats.health}%</span>
                  </p>
                </div>
              </div>
              <div className="column is-narrow">
                <button
                  className="button is-warning"
                  onClick={() => setGameState("paused")}
                  aria-label="Pause game"
                >
                  Pause
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        {gameState === "playing" && (
          <div className="box mb-6">
            <h2 className="title is-4 mb-4">Controls</h2>
            <div className="columns is-mobile is-multiline">
              <div className="column is-half-tablet is-full-mobile">
                <div className="field">
                  <label className="label" htmlFor="camera-mode">
                    Camera Mode
                  </label>
                  <div className="control">
                    <div className="select is-fullwidth">
                      <select
                        id="camera-mode"
                        value={cameraMode}
                        onChange={(e) => setCameraMode(e.target.value as CameraMode)}
                        aria-label="Select camera mode"
                      >
                        <option value="first-person">First Person</option>
                        <option value="third-person">Third Person</option>
                        <option value="free">Free Camera</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="column is-half-tablet is-full-mobile">
                <div className="field">
                  <label className="label" htmlFor="light-intensity">
                    Light Intensity: {sceneConfig.lightIntensity.toFixed(1)}
                  </label>
                  <div className="control">
                    <input
                      id="light-intensity"
                      className="slider is-fullwidth"
                      type="range"
                      min="0.1"
                      max="2.0"
                      step="0.1"
                      value={sceneConfig.lightIntensity}
                      onChange={(e) =>
                        setSceneConfig((prev) => ({
                          ...prev,
                          lightIntensity: parseFloat(e.target.value),
                        }))
                      }
                      aria-label="Adjust light intensity"
                    />
                  </div>
                </div>
              </div>

              <div className="column is-one-third-tablet is-half-mobile">
                <div className="field">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={sceneConfig.enableShadows}
                      onChange={(e) =>
                        setSceneConfig((prev) => ({
                          ...prev,
                          enableShadows: e.target.checked,
                        }))
                      }
                      aria-label="Enable shadows"
                    />
                    Enable Shadows
                  </label>
                </div>
              </div>

              <div className="column is-one-third-tablet is-half-mobile">
                <div className="field">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={sceneConfig.enableFog}
                      onChange={(e) =>
                        setSceneConfig((prev) => ({
                          ...prev,
                          enableFog: e.target.checked,
                        }))
                      }
                      aria-label="Enable fog"
                    />
                    Enable Fog
                  </label>
                </div>
              </div>

              <div className="column is-one-third-tablet is-half-mobile">
                <div className="field">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={sceneConfig.lodEnabled}
                      onChange={(e) =>
                        setSceneConfig((prev) => ({
                          ...prev,
                          lodEnabled: e.target.checked,
                        }))
                      }
                      aria-label="Enable LOD"
                    />
                    Enable LOD
                  </label>
                </div>
              </div>

              <div className="column is-full">
                <div className="field is-grouped">
                  <div className="control">
                    <button
                      className="button is-info"
                      onClick={resetStats}
                      aria-label="Reset performance statistics"
                    >
                      Reset Stats
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menu Screen */}
        {gameState === "menu" && (
          <div className="box mb-6 has-text-centered">
            <h2 className="title is-3 mb-4">Welcome to 3D Game Demo</h2>
            <p className="mb-5">
              Use WASD or Arrow Keys to move, Mouse to look around. Collect all items to win!
            </p>
            <button
              className="button is-primary is-large"
              onClick={startGame}
              aria-label="Start game"
            >
              Start Game
            </button>
          </div>
        )}

        {/* Paused Screen */}
        {gameState === "paused" && (
          <div className="box mb-6 has-text-centered">
            <h2 className="title is-3 mb-4">Game Paused</h2>
            <div className="field is-grouped is-grouped-centered">
              <div className="control">
                <button
                  className="button is-primary"
                  onClick={() => setGameState("playing")}
                  aria-label="Resume game"
                >
                  Resume
                </button>
              </div>
              <div className="control">
                <button
                  className="button is-danger"
                  onClick={() => setGameState("menu")}
                  aria-label="Quit to menu"
                >
                  Quit to Menu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3D Scene */}
        {gameState === "playing" && (
          <div className="box mb-6">
            <div
              className="is-relative"
              style={{ width: "100%", height: `${sceneHeight}px` }}
              role="img"
              aria-label="3D game environment with player, collectibles, buildings, and terrain"
            >
              {isMounted && (
                <Canvas
                  gl={{
                    antialias: !isMobile,
                    powerPreference: "high-performance",
                  }}
                  dpr={isMobile ? 1 : 2}
                  shadows={sceneConfig.enableShadows}
                >
                  <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={75} />
                  <ambientLight intensity={0.4 * sceneConfig.lightIntensity} />
                  <directionalLight
                    position={[10, 10, 5]}
                    intensity={sceneConfig.lightIntensity}
                    castShadow={sceneConfig.enableShadows}
                    shadow-mapSize-width={sceneConfig.shadowMapSize}
                    shadow-mapSize-height={sceneConfig.shadowMapSize}
                    shadow-camera-far={sceneConfig.renderDistance}
                  />
                  <pointLight position={[-10, 10, -10]} intensity={0.5 * sceneConfig.lightIntensity} />

                  <GameScene3D
                    cameraMode={cameraMode}
                    sceneConfig={sceneConfig}
                    isPlaying={isPlaying}
                    prefersReducedMotion={!!prefersReducedMotion}
                    collectibles={collectibles}
                    onCollectItem={collectItem}
                    onPerformanceUpdate={(metrics) => {
                      setPerformance((prev) => ({
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

                  <Sky
                    sunPosition={[10, 10, 5]}
                    inclination={0.6}
                    azimuth={0.1}
                    turbidity={2}
                    rayleigh={0.5}
                  />

                  {sceneConfig.enableFog && (
                    <fog attach="fog" args={["#ffffff", 10, 50]} />
                  )}

                  {cameraMode === "free" && (
                    <OrbitControls
                      enableZoom={true}
                      enablePan={true}
                      enableRotate={true}
                      minDistance={5}
                      maxDistance={sceneConfig.renderDistance}
                      autoRotate={!prefersReducedMotion && isPlaying}
                      autoRotateSpeed={prefersReducedMotion ? 0 : 0.5}
                    />
                  )}

                  {cameraMode === "first-person" && (
                    <PointerLockControls />
                  )}
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
                <div
                  className="box has-background-dark has-text-light"
                  style={{ minWidth: "200px" }}
                >
                  <div className="content is-small">
                    <p className="has-text-weight-bold mb-2">Performance</p>
                    <table className="table is-narrow is-fullwidth">
                      <tbody>
                        <tr>
                          <td>FPS:</td>
                          <td className="has-text-right">{performance.fps}</td>
                        </tr>
                        <tr>
                          <td>Draw Calls:</td>
                          <td className="has-text-right">{performance.drawCalls}</td>
                        </tr>
                        <tr>
                          <td>Triangles:</td>
                          <td className="has-text-right">
                            {performance.triangles.toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td>Memory:</td>
                          <td className="has-text-right">{performance.memoryUsage} MB</td>
                        </tr>
                        <tr>
                          <td>WASM Calls:</td>
                          <td className="has-text-right">{performance.wasmCalls}</td>
                        </tr>
                        <tr>
                          <td>WASM Time:</td>
                          <td className="has-text-right">{performance.wasmTime}ms</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game Instructions */}
        <div className="box">
          <h2 className="title is-4 mb-4">Game Instructions</h2>
          <div className="content">
            <div className="columns is-multiline">
              <div className="column is-half-tablet is-full-mobile">
                <h3 className="title is-5 mb-3">Controls</h3>
                <ul>
                  <li><strong>WASD</strong> or <strong>Arrow Keys</strong>: Move player</li>
                  <li><strong>Mouse</strong>: Look around (First Person mode)</li>
                  <li><strong>Space</strong>: Jump (coming soon)</li>
                  <li><strong>ESC</strong>: Pause game</li>
                </ul>
              </div>

              <div className="column is-half-tablet is-full-mobile">
                <h3 className="title is-5 mb-3">Objectives</h3>
                <ul>
                  <li>Collect all 20 items to complete the game</li>
                  <li>Coins: 10 points each</li>
                  <li>Power-ups: 50 points each</li>
                  <li>Keys: 100 points each</li>
                </ul>
              </div>

              <div className="column is-half-tablet is-full-mobile">
                <h3 className="title is-5 mb-3">Features</h3>
                <ul>
                  <li>WebAssembly-accelerated physics</li>
                  <li>Real-time lighting and shadows</li>
                  <li>Dynamic environment</li>
                  <li>LOD optimization</li>
                </ul>
              </div>

              <div className="column is-half-tablet is-full-mobile">
                <h3 className="title is-5 mb-3">Performance</h3>
                <ul>
                  <li>All calculations use WebAssembly</li>
                  <li>Optimized rendering pipeline</li>
                  <li>Adaptive quality settings</li>
                  <li>Real-time performance metrics</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Game Scene Component
interface GameScene3DProps {
  cameraMode: CameraMode;
  sceneConfig: SceneConfig;
  isPlaying: boolean;
  prefersReducedMotion: boolean;
  collectibles: Collectible[];
  onCollectItem: (id: string, type: Collectible["type"]) => void;
  onPerformanceUpdate: (metrics: { drawCalls: number; triangles: number }) => void;
  onFrameUpdate: (deltaTime: number) => void;
}

function GameScene3D({
  cameraMode,
  sceneConfig,
  isPlaying,
  prefersReducedMotion,
  collectibles,
  onCollectItem,
  onPerformanceUpdate,
  onFrameUpdate,
}: GameScene3DProps) {
  const { gl } = useThree();
  const playerRef = useRef<THREE.Group>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const velocityRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const positionRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1, 0));

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Player movement
  useFrame((state, delta) => {
    if (!isPlaying || prefersReducedMotion) return;

    onFrameUpdate(delta);

    // Player movement using WASM physics
    const moveSpeed = 5;
    const moveVector = new THREE.Vector3();

    if (keysRef.current.has("w") || keysRef.current.has("arrowup")) {
      moveVector.z -= 1;
    }
    if (keysRef.current.has("s") || keysRef.current.has("arrowdown")) {
      moveVector.z += 1;
    }
    if (keysRef.current.has("a") || keysRef.current.has("arrowleft")) {
      moveVector.x -= 1;
    }
    if (keysRef.current.has("d") || keysRef.current.has("arrowright")) {
      moveVector.x += 1;
    }

    if (moveVector.length() > 0) {
      moveVector.normalize();
      moveVector.multiplyScalar(moveSpeed * delta);
      positionRef.current.add(moveVector);
    }

    // Update player position
    if (playerRef.current) {
      playerRef.current.position.copy(positionRef.current);
    }

    // Update camera for third-person view
    if (cameraMode === "third-person" && state.camera) {
      const camera = state.camera;
      const idealOffset = new THREE.Vector3(0, 5, 10);
      const idealPosition = positionRef.current.clone().add(idealOffset);
      camera.position.lerp(idealPosition, 0.1);
      camera.lookAt(positionRef.current);
    }

    // Update performance metrics
    const info = gl.info;
    onPerformanceUpdate({
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
    });
  });

  return (
    <>
      {/* Terrain */}
      <Terrain sceneConfig={sceneConfig} />

      {/* Buildings */}
      <Buildings sceneConfig={sceneConfig} />

      {/* Player */}
      <Player
        ref={playerRef}
        position={positionRef.current}
        cameraMode={cameraMode}
        sceneConfig={sceneConfig}
      />

      {/* Collectibles */}
      {collectibles.map((collectible) => (
        <CollectibleItem
          key={collectible.id}
          collectible={collectible}
          onCollect={onCollectItem}
          sceneConfig={sceneConfig}
          prefersReducedMotion={prefersReducedMotion}
        />
      ))}

      {/* Ground Grid */}
      <Grid
        renderOrder={-1}
        position={[0, -0.01, 0]}
        infiniteGrid
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6f6f6f"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#9d4b4b"
        fadeDistance={30}
        fadeStrength={1}
      />

      {/* Contact Shadows */}
      {sceneConfig.enableShadows && (
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.4}
          scale={20}
          blur={2}
          far={10}
        />
      )}
    </>
  );
}

// Player Component
const Player = React.forwardRef<
  THREE.Group,
  {
    position: THREE.Vector3;
    cameraMode: CameraMode;
    sceneConfig: SceneConfig;
  }
>(({ position, cameraMode, sceneConfig }, ref) => {
  const prefersReducedMotion = useReducedMotion();
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current && !prefersReducedMotion) {
      // Subtle idle animation
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={ref} position={position}>
      <mesh
        ref={meshRef}
        castShadow={sceneConfig.enableShadows}
        receiveShadow={sceneConfig.enableShadows}
      >
        <capsuleGeometry args={[0.5, 1, 4, 8]} />
        <meshStandardMaterial color="#4a90e2" roughness={0.7} metalness={0.3} />
      </mesh>
      {/* Player indicator */}
      <mesh position={[0, 1.5, 0]}>
        <coneGeometry args={[0.2, 0.5, 8]} />
        <meshStandardMaterial color="#ff6b6b" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
});

Player.displayName = "Player";

// Terrain Component
function Terrain({ sceneConfig }: { sceneConfig: SceneConfig }) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow={sceneConfig.enableShadows}
    >
      <planeGeometry args={[50, 50, 50, 50]} />
      <meshStandardMaterial color="#8b7355" roughness={0.8} metalness={0.2} />
    </mesh>
  );
}

// Buildings Component
function Buildings({ sceneConfig }: { sceneConfig: SceneConfig }) {
  const buildingPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 8 + Math.random() * 5;
      positions.push([
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius,
      ]);
    }
    return positions;
  }, []);

  return (
    <>
      {buildingPositions.map((position, index) => (
        <Building
          key={index}
          position={position}
          height={2 + Math.random() * 4}
          sceneConfig={sceneConfig}
        />
      ))}
    </>
  );
}

// Single Building Component
function Building({
  position,
  height,
  sceneConfig,
}: {
  position: [number, number, number];
  height: number;
  sceneConfig: SceneConfig;
}) {
  return (
    <group position={position}>
      <mesh
        castShadow={sceneConfig.enableShadows}
        receiveShadow={sceneConfig.enableShadows}
      >
        <boxGeometry args={[1.5, height, 1.5]} />
        <meshStandardMaterial color="#7a7a7a" roughness={0.7} metalness={0.3} />
      </mesh>
      {/* Roof */}
      <mesh
        position={[0, height / 2 + 0.1, 0]}
        castShadow={sceneConfig.enableShadows}
      >
        <boxGeometry args={[1.8, 0.2, 1.8]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
      </mesh>
    </group>
  );
}

// Collectible Item Component
function CollectibleItem({
  collectible,
  onCollect,
  sceneConfig,
  prefersReducedMotion,
}: {
  collectible: Collectible;
  onCollect: (id: string, type: Collectible["type"]) => void;
  sceneConfig: SceneConfig;
  prefersReducedMotion: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current && !prefersReducedMotion && !collectible.collected) {
      // Rotation animation
      meshRef.current.rotation.y += 0.02;
      // Floating animation
      meshRef.current.position.y =
        collectible.position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.3;
    }
  });

  const handleClick = () => {
    if (!collectible.collected) {
      onCollect(collectible.id, collectible.type);
    }
  };

  if (collectible.collected) return null;

  const color =
    collectible.type === "coin"
      ? "#ffd700"
      : collectible.type === "powerup"
      ? "#00ff00"
      : "#ff00ff";

  return (
    <Float
      speed={prefersReducedMotion ? 0 : 1}
      rotationIntensity={prefersReducedMotion ? 0 : 0.5}
    >
      <mesh
        ref={meshRef}
        position={collectible.position}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow={sceneConfig.enableShadows}
      >
        {collectible.type === "coin" ? (
          <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
        ) : collectible.type === "powerup" ? (
          <octahedronGeometry args={[0.4, 0]} />
        ) : (
          <boxGeometry args={[0.4, 0.4, 0.4]} />
        )}
        <meshStandardMaterial
          color={color}
          metalness={0.9}
          roughness={0.1}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.5}
        />
      </mesh>
    </Float>
  );
}

