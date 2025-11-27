"use client";

import { useState, useRef, useCallback } from "react";
import { InferenceResult } from "@/lib/onnx/model-manager";

interface ImageClassificationInterfaceProps {
  onRunInference: (input: HTMLImageElement | HTMLCanvasElement | ImageData) => Promise<InferenceResult>;
  isModelLoaded: boolean;
  isCameraActive: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onCaptureFrame: () => HTMLCanvasElement | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onUrlInput: (url: string) => void;
  currentImage: HTMLImageElement | null;
  isRealTimeInference: boolean;
  onStartRealTime: () => void;
  onStopRealTime: () => void;
}

export default function ImageClassificationInterface({
  onRunInference,
  isModelLoaded,
  isCameraActive,
  onStartCamera,
  onStopCamera,
  onCaptureFrame,
  videoRef,
  canvasRef,
  fileInputRef,
  onFileUpload,
  onUrlInput,
  currentImage,
  isRealTimeInference,
  onStartRealTime,
  onStopRealTime,
}: ImageClassificationInterfaceProps) {
  const [inputSource, setInputSource] = useState<"camera" | "upload" | "url">("camera");

  return (
    <div className="box">
      <h3 className="title is-5 mb-4">Image Input</h3>

      {/* Input Source Tabs */}
      <div className="tabs is-boxed mb-4">
        <ul>
          <li className={inputSource === "camera" ? "is-active" : ""}>
            <a
              onClick={() => {
                if (!isCameraActive) {
                  onStartCamera();
                }
                setInputSource("camera");
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (!isCameraActive) {
                    onStartCamera();
                  }
                  setInputSource("camera");
                }
              }}
              aria-label="Use camera input"
            >
              <span className="icon is-small">
                <i className="fas fa-camera"></i>
              </span>
              <span>Camera</span>
            </a>
          </li>
          <li className={inputSource === "upload" ? "is-active" : ""}>
            <a
              onClick={() => {
                fileInputRef.current?.click();
                setInputSource("upload");
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                  setInputSource("upload");
                }
              }}
              aria-label="Upload image file"
            >
              <span className="icon is-small">
                <i className="fas fa-upload"></i>
              </span>
              <span>Upload</span>
            </a>
          </li>
          <li className={inputSource === "url" ? "is-active" : ""}>
            <a
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  const url = prompt("Enter image URL:");
                  if (url) {
                    onUrlInput(url);
                    setInputSource("url");
                  }
                }
              }}
              aria-label="Load image from URL"
            >
              <span className="icon is-small">
                <i className="fas fa-link"></i>
              </span>
              <span>URL</span>
            </a>
          </li>
        </ul>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileUpload}
        className="is-hidden"
        aria-label="Image file input"
      />

      {/* Camera View */}
      {isCameraActive && (
        <div className="mb-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="image"
            style={{ maxWidth: "100%", height: "auto" }}
            aria-label="Camera preview"
          />
          <div className="field is-grouped mt-4">
            <div className="control">
              <button
                className={`button ${isRealTimeInference ? "is-danger" : "is-success"}`}
                onClick={isRealTimeInference ? onStopRealTime : onStartRealTime}
                disabled={!isModelLoaded}
                aria-label={isRealTimeInference ? "Stop real-time inference" : "Start real-time inference"}
              >
                {isRealTimeInference ? "Stop Real-time" : "Start Real-time"}
              </button>
            </div>
            <div className="control">
              <button
                className="button is-warning"
                onClick={() => {
                  const canvas = onCaptureFrame();
                  if (canvas) {
                    onRunInference(canvas);
                  }
                }}
                disabled={!isModelLoaded}
                aria-label="Run single inference"
              >
                Single Inference
              </button>
            </div>
            <div className="control">
              <button
                className="button is-light"
                onClick={onStopCamera}
                aria-label="Stop camera"
              >
                Stop Camera
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {currentImage && !isCameraActive && (
        <div className="mb-4">
          <figure className="image">
            <img
              src={currentImage.src}
              alt="Input image for inference"
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </figure>
          <div className="field mt-4">
            <button
              className="button is-primary"
              onClick={() => onRunInference(currentImage)}
              disabled={!isModelLoaded}
              aria-label="Run inference on image"
            >
              Run Inference
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="is-hidden" aria-hidden="true" />
    </div>
  );
}

