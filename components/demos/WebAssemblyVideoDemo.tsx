"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

type VideoFormat = "mp4" | "webm" | "avi" | "mov" | "mkv";
type VideoCodec = "libx264" | "libvpx-vp9" | "libvpx" | "copy";

interface ProcessingProgress {
  ratio: number;
  time: number;
}

export default function WebAssemblyVideoDemo() {
  const [isMounted, setIsMounted] = useState(false);
  const [ffmpeg, setFFmpeg] = useState<FFmpeg | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({ ratio: 0, time: 0 });
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [outputFile, setOutputFile] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat>("mp4");
  const [selectedCodec, setSelectedCodec] = useState<VideoCodec>("libx264");
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [fileSize, setFileSize] = useState<{ input: number; output: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const inputVideoRef = useRef<HTMLVideoElement>(null);
  const outputVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load FFmpeg
  useEffect(() => {
    setIsMounted(true);

    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    const loadFFmpeg = async () => {
      try {
        setIsLoading(true);
        const ffmpegInstance = new FFmpeg();
        
        ffmpegInstance.on("log", ({ message }) => {
          console.log("[FFmpeg]", message);
        });

        ffmpegInstance.on("progress", ({ progress: ratio, time }) => {
          setProgress({ ratio, time });
        });

        // Load FFmpeg from CDN
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
        await ffmpegInstance.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });

        setFFmpeg(ffmpegInstance);
        setIsLoaded(true);
      } catch (err) {
        console.error("Failed to load FFmpeg:", err);
        setError(`Failed to load FFmpeg: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadFFmpeg();

    return () => {
      window.removeEventListener("resize", checkScreenSize);
      if (outputUrl) {
        URL.revokeObjectURL(outputUrl);
      }
    };
  }, []);

  // Handle file input
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("video/")) {
        setError("Please select a video file");
        return;
      }

      setInputFile(file);
      setOutputFile(null);
      setOutputUrl(null);
      setError(null);
      setFileSize({ input: file.size, output: 0 });

      // Create preview URL
      const url = URL.createObjectURL(file);
      if (inputVideoRef.current) {
        inputVideoRef.current.src = url;
      }
    },
    []
  );

  // Process video
  const processVideo = useCallback(async () => {
    if (!ffmpeg || !inputFile || !isLoaded) return;

    try {
      setIsProcessing(true);
      setError(null);
      setProgress({ ratio: 0, time: 0 });
      const startTime = Date.now();

      // Write input file to FFmpeg virtual file system
      const inputFileName = "input." + inputFile.name.split(".").pop();
      await ffmpeg.writeFile(inputFileName, await fetchFile(inputFile));

      // Determine output filename based on format
      const outputFileName = `output.${selectedFormat}`;

      // Build FFmpeg command
      const args: string[] = [];
      
      // Input file
      args.push("-i", inputFileName);

      // Codec selection
      if (selectedCodec !== "copy") {
        if (selectedFormat === "mp4") {
          args.push("-c:v", "libx264");
          args.push("-c:a", "aac");
        } else if (selectedFormat === "webm") {
          args.push("-c:v", selectedCodec === "libvpx-vp9" ? "libvpx-vp9" : "libvpx");
          args.push("-c:a", "libopus");
        } else {
          args.push("-c:v", selectedCodec);
          args.push("-c:a", "copy");
        }
      } else {
        args.push("-c", "copy");
      }

      // Quality settings
      args.push("-preset", "medium");
      args.push("-crf", "23");

      // Output file
      args.push(outputFileName);

      // Execute FFmpeg
      await ffmpeg.exec(args);

      // Read output file
      const data = await ffmpeg.readFile(outputFileName);
      // FileData can be Uint8Array or string, convert to Blob
      const blob = data instanceof Uint8Array 
        ? new Blob([data as BlobPart], { type: `video/${selectedFormat}` })
        : new Blob([data as BlobPart], { type: `video/${selectedFormat}` });
      
      setOutputFile(blob);
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
      
      if (outputVideoRef.current) {
        outputVideoRef.current.src = url;
      }

      setFileSize((prev) => prev ? { ...prev, output: blob.size } : null);
      setProcessingTime(Date.now() - startTime);

      // Clean up input file from virtual FS
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
    } catch (err) {
      console.error("Video processing error:", err);
      setError(`Processing failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  }, [ffmpeg, inputFile, isLoaded, selectedFormat, selectedCodec]);

  // Download output
  const handleDownload = useCallback(() => {
    if (!outputFile || !outputUrl) return;

    const a = document.createElement("a");
    a.href = outputUrl;
    a.download = `output.${selectedFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [outputFile, outputUrl, selectedFormat]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="container is-fluid mt-6">
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="title is-2 has-text-centered mb-6">
          WebAssembly Video Processing Demo
        </h1>
        <p className="subtitle is-5 has-text-centered mb-6">
          FFmpeg.wasm video encoding, decoding, and format conversion in the browser
        </p>

        {/* Technology Tags */}
        <div className="has-text-centered mb-6">
          <span className="tag is-info is-medium">FFmpeg.wasm</span>
          <span className="tag is-info is-medium">WebAssembly</span>
          <span className="tag is-info is-medium">Video Processing</span>
          <span className="tag is-info is-medium">Format Conversion</span>
        </div>

        {/* About This Demo */}
        <div className="box mb-6">
          <div className="content">
            <h3 className="title is-4 mb-4">About This Demo</h3>
            <p className="mb-4">
              This demonstration showcases <strong>video processing in the browser</strong> using 
              <strong> FFmpeg.wasm</strong>, a WebAssembly port of FFmpeg. Process videos directly 
              in your browser without uploading to a server - encode, decode, convert formats, and 
              more, all running locally in WebAssembly.
            </p>
            <div className="columns">
              <div className="column">
                <h4 className="title is-5 mb-3">Key Features:</h4>
                <ul>
                  <li>Video format conversion (MP4, WebM, AVI, MOV, MKV)</li>
                  <li>Multiple codec support (H.264, VP9, VP8)</li>
                  <li>Real-time processing progress</li>
                  <li>Web Workers for multi-threading</li>
                  <li>No server upload required</li>
                  <li>Privacy-first processing</li>
                </ul>
              </div>
              <div className="column">
                <h4 className="title is-5 mb-3">Supported Operations:</h4>
                <ul>
                  <li><strong>Encoding:</strong> Convert videos to different formats</li>
                  <li><strong>Decoding:</strong> Extract frames and audio</li>
                  <li><strong>Format Conversion:</strong> MP4, WebM, AVI, MOV, MKV</li>
                  <li><strong>Codec Selection:</strong> H.264, VP9, VP8, or copy</li>
                </ul>
              </div>
            </div>
            <p className="mt-4">
              <strong>Note:</strong> FFmpeg.wasm is loaded from CDN on first use. Processing happens 
              entirely in your browser using WebAssembly for maximum performance.
            </p>
          </div>
        </div>

        {/* FFmpeg Status */}
        <div className="box mb-6">
          <div className="level is-mobile">
            <div className="level-left">
              <div className="level-item">
                <div>
                  <p className="heading">FFmpeg Status</p>
                  {isLoading ? (
                    <p className="title is-5">
                      <span className="tag is-warning is-large">
                        <span className="icon">
                          <i className="fas fa-spinner fa-spin"></i>
                        </span>
                        <span>Loading...</span>
                      </span>
                    </p>
                  ) : isLoaded ? (
                    <p className="title is-5">
                      <span className="tag is-success is-large">
                        <span className="icon">
                          <i className="fas fa-check"></i>
                        </span>
                        <span>Ready</span>
                      </span>
                    </p>
                  ) : (
                    <p className="title is-5">
                      <span className="tag is-danger is-large">
                        <span className="icon">
                          <i className="fas fa-times"></i>
                        </span>
                        <span>Not Loaded</span>
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="notification is-danger mb-6">
            <button
              className="delete"
              onClick={() => setError(null)}
              aria-label="Close error message"
            ></button>
            <p>{error}</p>
          </div>
        )}

        {/* File Selection */}
        <div className="box mb-6">
          <h2 className="title is-4 mb-4">Select Video File</h2>
          <div className="field">
            <label className="label" htmlFor="video-file-input">
              Video File
            </label>
            <div className="control">
              <input
                id="video-file-input"
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                disabled={!isLoaded || isProcessing}
                className="input"
                aria-label="Select video file"
              />
            </div>
            <p className="help">
              Select a video file to process. Supported formats: MP4, WebM, AVI, MOV, MKV
            </p>
          </div>

          {inputFile && (
            <div className="content mt-4">
              <p>
                <strong>Selected File:</strong> {inputFile.name}
              </p>
              <p>
                <strong>Size:</strong> {(inputFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p>
                <strong>Type:</strong> {inputFile.type}
              </p>
            </div>
          )}
        </div>

        {/* Processing Options */}
        {inputFile && isLoaded && (
          <div className="box mb-6">
            <h2 className="title is-4 mb-4">Processing Options</h2>
            <div className="columns">
              <div className="column">
                <div className="field">
                  <label className="label" htmlFor="format-select">
                    Output Format
                  </label>
                  <div className="control">
                    <div className="select is-fullwidth">
                      <select
                        id="format-select"
                        value={selectedFormat}
                        onChange={(e) => setSelectedFormat(e.target.value as VideoFormat)}
                        disabled={isProcessing}
                        aria-label="Select output format"
                      >
                        <option value="mp4">MP4</option>
                        <option value="webm">WebM</option>
                        <option value="avi">AVI</option>
                        <option value="mov">MOV</option>
                        <option value="mkv">MKV</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="column">
                <div className="field">
                  <label className="label" htmlFor="codec-select">
                    Video Codec
                  </label>
                  <div className="control">
                    <div className="select is-fullwidth">
                      <select
                        id="codec-select"
                        value={selectedCodec}
                        onChange={(e) => setSelectedCodec(e.target.value as VideoCodec)}
                        disabled={isProcessing}
                        aria-label="Select video codec"
                      >
                        <option value="libx264">H.264 (libx264)</option>
                        <option value="libvpx-vp9">VP9 (libvpx-vp9)</option>
                        <option value="libvpx">VP8 (libvpx)</option>
                        <option value="copy">Copy (No Re-encoding)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="field is-grouped mt-4">
              <div className="control">
                <button
                  className={`button is-primary ${isProcessing ? "is-loading" : ""}`}
                  onClick={processVideo}
                  disabled={!inputFile || !isLoaded || isProcessing}
                  aria-label="Process video"
                >
                  <span className="icon">
                    <i className="fas fa-cog"></i>
                  </span>
                  <span>Process Video</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress */}
        {isProcessing && (
          <div className="box mb-6">
            <h3 className="title is-5 mb-4">Processing Progress</h3>
            <progress
              className="progress is-primary is-large"
              value={progress.ratio * 100}
              max="100"
              aria-label={`Processing progress: ${(progress.ratio * 100).toFixed(1)}%`}
            >
              {(progress.ratio * 100).toFixed(1)}%
            </progress>
            <p className="has-text-centered mt-2">
              {((progress.ratio || 0) * 100).toFixed(1)}% complete
            </p>
            {progress.time > 0 && (
              <p className="has-text-centered is-size-7 has-text-grey">
                Processing time: {progress.time.toFixed(2)}s
              </p>
            )}
          </div>
        )}

        {/* Video Previews */}
        <div className="columns">
          <div className="column">
            <div className="box">
              <h3 className="title is-5 mb-4">Input Video</h3>
              {inputFile ? (
                <video
                  ref={inputVideoRef}
                  controls
                  className="is-fullwidth"
                  style={{ maxHeight: isMobile ? "200px" : "400px" }}
                  aria-label="Input video preview"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="has-text-centered has-text-grey" style={{ minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p>No video selected</p>
                </div>
              )}
            </div>
          </div>
          <div className="column">
            <div className="box">
              <h3 className="title is-5 mb-4">Output Video</h3>
              {outputUrl ? (
                <>
                  <video
                    ref={outputVideoRef}
                    controls
                    className="is-fullwidth"
                    style={{ maxHeight: isMobile ? "200px" : "400px" }}
                    aria-label="Output video preview"
                  >
                    Your browser does not support the video tag.
                  </video>
                  <div className="field is-grouped mt-4">
                    <div className="control">
                      <button
                        className="button is-success"
                        onClick={handleDownload}
                        aria-label="Download processed video"
                      >
                        <span className="icon">
                          <i className="fas fa-download"></i>
                        </span>
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                  {fileSize && processingTime > 0 && (
                    <div className="content mt-4">
                      <p>
                        <strong>Processing Time:</strong> {(processingTime / 1000).toFixed(2)}s
                      </p>
                      <p>
                        <strong>Input Size:</strong> {(fileSize.input / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p>
                        <strong>Output Size:</strong> {(fileSize.output / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p>
                        <strong>Compression Ratio:</strong>{" "}
                        {fileSize.output > 0
                          ? ((1 - fileSize.output / fileSize.input) * 100).toFixed(1)
                          : 0}
                        %
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="has-text-centered has-text-grey" style={{ minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p>Processed video will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

