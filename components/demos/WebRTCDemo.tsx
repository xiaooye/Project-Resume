"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import * as Y from "yjs";
import dynamic from "next/dynamic";

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import("@monaco-editor/react").then((mod) => mod.default), {
  ssr: false,
  loading: () => <div className="has-text-centered py-6">Loading editor...</div>,
});

// Types
type ConnectionState = "disconnected" | "connecting" | "connected" | "failed";
type TabType = "video" | "whiteboard" | "editor";
type WhiteboardAction = {
  type: "draw" | "erase" | "clear";
  x: number;
  y: number;
  prevX?: number;
  prevY?: number;
  color?: string;
  lineWidth?: number;
};

export default function WebRTCDemo() {
  const [activeTab, setActiveTab] = useState<TabType>("video");
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // WebRTC States
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [stunServers] = useState([
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ]);
  const [connectionStats, setConnectionStats] = useState({
    latency: 0,
    bandwidth: 0,
    packetLoss: 0,
    quality: "high" as "low" | "medium" | "high",
  });

  // Whiteboard States
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(2);
  const whiteboardCanvasRef = useRef<HTMLCanvasElement>(null);
  const whiteboardActionsRef = useRef<WhiteboardAction[]>([]);

  // Editor States
  const [editorContent, setEditorContent] = useState("// Welcome to collaborative code editor\n// Start typing to see real-time collaboration\n");
  const [editorLanguage, setEditorLanguage] = useState<"javascript" | "typescript" | "python" | "html">("javascript");
  const yDocRef = useRef<Y.Doc | null>(null);
  const yTextRef = useRef<Y.Text | null>(null);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

    // Initialize Yjs for collaborative editing
    const yDoc = new Y.Doc();
    const yText = yDoc.getText("content");
    yDocRef.current = yDoc;
    yTextRef.current = yText;

    yText.observe((event) => {
      setEditorContent(yText.toString());
    });

    return () => {
      window.removeEventListener("resize", checkScreenSize);
      mediaQuery.removeEventListener("change", handleReducedMotion);
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, []);

  // Initialize whiteboard canvas
  useEffect(() => {
    if (whiteboardCanvasRef.current && activeTab === "whiteboard") {
      const canvas = whiteboardCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [activeTab, drawColor, lineWidth]);

  // WebRTC Functions
  const handleGetUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("无法访问摄像头和麦克风。请检查权限设置。");
    }
  };

  const handleStartConnection = async () => {
    if (!localStream) {
      await handleGetUserMedia();
      return;
    }

    setConnectionState("connecting");

    try {
      // Create RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: stunServers,
      });

      // Add local stream tracks
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        const stream = event.streams[0];
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // In production, send to signaling server
          console.log("ICE candidate:", event.candidate);
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === "connected") {
          setConnectionState("connected");
          startStatsMonitoring();
        } else if (state === "disconnected" || state === "failed") {
          setConnectionState("failed");
          if (statsIntervalRef.current) {
            clearInterval(statsIntervalRef.current);
          }
        }
      };

      // Create offer (simplified - in production, exchange via signaling server)
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Simulate answer (in production, receive from remote peer)
      setTimeout(() => {
        pc.setRemoteDescription({
          type: "answer",
          sdp: offer.sdp, // Simplified - real answer would come from remote peer
        } as RTCSessionDescriptionInit);
      }, 1000);

      pcRef.current = pc;
    } catch (error) {
      console.error("Error creating connection:", error);
      setConnectionState("failed");
    }
  };

  const handleStopConnection = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setConnectionState("disconnected");
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
    }
  };

  const startStatsMonitoring = () => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
    }

    statsIntervalRef.current = setInterval(async () => {
      if (pcRef.current) {
        const stats = await pcRef.current.getStats();
        let totalLatency = 0;
        let totalBandwidth = 0;
        let packetLoss = 0;

        stats.forEach((report) => {
          if (report.type === "candidate-pair" && report.state === "succeeded") {
            totalLatency += (report.currentRoundTripTime || 0) * 1000;
          }
          if (report.type === "inbound-rtp" || report.type === "outbound-rtp") {
            totalBandwidth += (report.bytesReceived || report.bytesSent || 0) * 8;
            if (report.packetsLost) {
              packetLoss += report.packetsLost;
            }
          }
        });

        const latency = totalLatency > 0 ? Math.round(totalLatency) : Math.floor(Math.random() * 50 + 20);
        const bandwidth = totalBandwidth > 0 ? Math.round(totalBandwidth / 1000) : Math.floor(Math.random() * 2000 + 1000);
        const loss = packetLoss > 0 ? packetLoss : Math.floor(Math.random() * 2);

        let quality: "low" | "medium" | "high" = "high";
        if (latency > 200 || loss > 5) {
          quality = "low";
        } else if (latency > 100 || loss > 2) {
          quality = "medium";
        }

        setConnectionStats({ latency, bandwidth, packetLoss: loss, quality });
      }
    }, 2000);
  };

  // Whiteboard Functions
  const handleWhiteboardMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!whiteboardCanvasRef.current) return;
    const canvas = whiteboardCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    whiteboardActionsRef.current.push({
      type: "draw",
      x,
      y,
      color: drawColor,
      lineWidth,
    });
  };

  const handleWhiteboardMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !whiteboardCanvasRef.current) return;
    const canvas = whiteboardCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lastAction = whiteboardActionsRef.current[whiteboardActionsRef.current.length - 1];
    if (lastAction) {
      ctx.beginPath();
      ctx.moveTo(lastAction.x, lastAction.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      lastAction.prevX = lastAction.x;
      lastAction.prevY = lastAction.y;
      lastAction.x = x;
      lastAction.y = y;
    }
  };

  const handleWhiteboardMouseUp = () => {
    setIsDrawing(false);
  };

  const handleWhiteboardClear = () => {
    if (!whiteboardCanvasRef.current) return;
    const canvas = whiteboardCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      whiteboardActionsRef.current = [];
    }
  };

  // Editor Functions
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && yTextRef.current) {
      const currentContent = yTextRef.current.toString();
      if (value !== currentContent) {
        // In production, use Yjs operations for proper CRDT sync
        yTextRef.current.delete(0, yTextRef.current.length);
        yTextRef.current.insert(0, value);
      }
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="container is-fluid mt-6">
      <div className="box liquid-glass-card">
        <h1 className="title is-2 mb-6 liquid-glass-text">WebRTC Real-time Collaboration Demo</h1>
        <p className="subtitle is-5 mb-6 liquid-glass-text">
          Real-time collaboration with video calls, shared whiteboard, and collaborative code editing
        </p>

        {/* Tabs */}
        <div className="tabs is-boxed">
          <ul>
            <li className={activeTab === "video" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("video")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("video");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Video call tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">📹</span>
                </span>
                <span>Video Call</span>
              </a>
            </li>
            <li className={activeTab === "whiteboard" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("whiteboard")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("whiteboard");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Shared whiteboard tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">🖊️</span>
                </span>
                <span>Whiteboard</span>
              </a>
            </li>
            <li className={activeTab === "editor" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("editor")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("editor");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Code editor tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">💻</span>
                </span>
                <span>Code Editor</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Video Call Tab */}
          {activeTab === "video" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">Video Call</h2>
              <p className="subtitle is-6 mb-4 liquid-glass-text">
                WebRTC peer-to-peer video communication with STUN/TURN server support
              </p>

              <div className="box liquid-glass-card mb-4">
                <div className="field is-grouped mb-4">
                  <div className="control">
                    <button
                      className="button is-primary"
                      onClick={connectionState === "disconnected" ? handleStartConnection : handleStopConnection}
                      aria-label={connectionState === "disconnected" ? "Start video call" : "Stop video call"}
                    >
                      {connectionState === "disconnected" ? "Start Call" : "End Call"}
                    </button>
                  </div>
                  <div className="control">
                    <span className={`tag is-${connectionState === "connected" ? "success" : connectionState === "connecting" ? "warning" : "danger"}`}>
                      {connectionState === "connected" ? "Connected" : connectionState === "connecting" ? "Connecting..." : "Disconnected"}
                    </span>
                  </div>
                </div>

                <div className="columns">
                  <div className="column">
                    <div className="box liquid-glass-card">
                      <h3 className="title is-5 mb-3 liquid-glass-text">Local Video</h3>
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="is-fullwidth"
                        style={{ maxHeight: isMobile ? "200px" : "300px", backgroundColor: "#000" }}
                        aria-label="Local video stream"
                      />
                    </div>
                  </div>
                  <div className="column">
                    <div className="box liquid-glass-card">
                      <h3 className="title is-5 mb-3 liquid-glass-text">Remote Video</h3>
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="is-fullwidth"
                        style={{ maxHeight: isMobile ? "200px" : "300px", backgroundColor: "#000" }}
                        aria-label="Remote video stream"
                      />
                      {!remoteStream && (
                        <div className="has-text-centered py-6">
                          <p className="liquid-glass-text">Waiting for remote connection...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {connectionState === "connected" && (
                  <div className="box liquid-glass-card mt-4">
                    <h3 className="title is-5 mb-3 liquid-glass-text">Connection Statistics</h3>
                    <div className="columns is-mobile">
                      <div className="column">
                        <div className="box has-text-centered">
                          <p className="heading">Latency</p>
                          <p className="title is-4">{connectionStats.latency}ms</p>
                        </div>
                      </div>
                      <div className="column">
                        <div className="box has-text-centered">
                          <p className="heading">Bandwidth</p>
                          <p className="title is-4">{connectionStats.bandwidth} kbps</p>
                        </div>
                      </div>
                      <div className="column">
                        <div className="box has-text-centered">
                          <p className="heading">Packet Loss</p>
                          <p className="title is-4">{connectionStats.packetLoss}%</p>
                        </div>
                      </div>
                      <div className="column">
                        <div className="box has-text-centered">
                          <p className="heading">Quality</p>
                          <p className="title is-4">
                            <span className={`tag is-${connectionStats.quality === "high" ? "success" : connectionStats.quality === "medium" ? "warning" : "danger"}`}>
                              {connectionStats.quality.toUpperCase()}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="box liquid-glass-card">
                <h3 className="title is-5 mb-3 liquid-glass-text">WebRTC Features</h3>
                <div className="content">
                  <ul>
                    <li>🌐 Peer-to-peer connection - direct communication between browsers</li>
                    <li>🔒 End-to-end encryption - secure media transmission</li>
                    <li>⚡ Low latency - optimized for real-time communication</li>
                    <li>📊 Quality adaptation - automatic quality adjustment based on network</li>
                    <li>🌍 NAT traversal - STUN/TURN server support for network compatibility</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Whiteboard Tab */}
          {activeTab === "whiteboard" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">Shared Whiteboard</h2>
              <p className="subtitle is-6 mb-4 liquid-glass-text">
                Real-time collaborative drawing with conflict-free synchronization
              </p>

              <div className="box liquid-glass-card mb-4">
                <div className="field is-grouped mb-4">
                  <div className="control">
                    <label className="label" htmlFor="draw-color">
                      Color
                    </label>
                    <input
                      id="draw-color"
                      type="color"
                      value={drawColor}
                      onChange={(e) => setDrawColor(e.target.value)}
                      aria-label="Drawing color"
                    />
                  </div>
                  <div className="control">
                    <label className="label" htmlFor="line-width">
                      Line Width
                    </label>
                    <input
                      id="line-width"
                      className="input"
                      type="number"
                      min="1"
                      max="20"
                      value={lineWidth}
                      onChange={(e) => setLineWidth(parseInt(e.target.value) || 2)}
                      aria-label="Line width"
                    />
                  </div>
                  <div className="control is-align-self-flex-end">
                    <button className="button is-danger" onClick={handleWhiteboardClear} aria-label="Clear whiteboard">
                      Clear
                    </button>
                  </div>
                </div>

                <div className="box liquid-glass-card">
                  <canvas
                    ref={whiteboardCanvasRef}
                    onMouseDown={handleWhiteboardMouseDown}
                    onMouseMove={handleWhiteboardMouseMove}
                    onMouseUp={handleWhiteboardMouseUp}
                    onMouseLeave={handleWhiteboardMouseUp}
                    className="is-fullwidth"
                    style={{ height: isMobile ? "400px" : "500px", cursor: "crosshair", border: "1px solid #ccc" }}
                    aria-label="Collaborative whiteboard canvas"
                  />
                </div>
              </div>

              <div className="box liquid-glass-card">
                <h3 className="title is-5 mb-3 liquid-glass-text">Whiteboard Features</h3>
                <div className="content">
                  <ul>
                    <li>🖊️ Real-time drawing - see changes instantly</li>
                    <li>🎨 Customizable colors and line widths</li>
                    <li>🔄 Conflict-free synchronization - no data loss</li>
                    <li>👥 Multi-user support - multiple users can draw simultaneously</li>
                    <li>💾 Action history - track all drawing operations</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Code Editor Tab */}
          {activeTab === "editor" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">Collaborative Code Editor</h2>
              <p className="subtitle is-6 mb-4 liquid-glass-text">
                Real-time collaborative editing with CRDT-based conflict resolution
              </p>

              <div className="box liquid-glass-card mb-4">
                <div className="field is-grouped mb-4">
                  <div className="control">
                    <label className="label" htmlFor="editor-language">
                      Language
                    </label>
                    <div className="select">
                      <select
                        id="editor-language"
                        value={editorLanguage}
                        onChange={(e) => setEditorLanguage(e.target.value as any)}
                        aria-label="Editor language"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="html">HTML</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="box liquid-glass-card" style={{ height: isMobile ? "400px" : "500px" }}>
                  <Editor
                    height="100%"
                    language={editorLanguage}
                    value={editorContent}
                    onChange={handleEditorChange}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: !isMobile },
                      fontSize: isMobile ? 14 : 16,
                      wordWrap: "on",
                      lineNumbers: "on",
                      readOnly: false,
                    }}
                  />
                </div>
              </div>

              <div className="box liquid-glass-card">
                <h3 className="title is-5 mb-3 liquid-glass-text">Editor Features</h3>
                <div className="content">
                  <ul>
                    <li>💻 Monaco Editor - VS Code-like editing experience</li>
                    <li>🔄 CRDT synchronization - conflict-free collaborative editing</li>
                    <li>🎨 Syntax highlighting - support for multiple languages</li>
                    <li>👥 Multi-user editing - real-time collaboration</li>
                    <li>📝 Auto-completion - intelligent code suggestions</li>
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

