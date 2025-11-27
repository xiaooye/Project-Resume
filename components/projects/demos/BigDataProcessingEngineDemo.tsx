"use client";

import { useEffect, useState, useRef } from "react";
import { Project } from "@/types";

interface ProcessingJob {
  id: string;
  type: "batch" | "stream";
  status: "running" | "completed" | "failed";
  recordsProcessed: number;
  recordsTotal: number;
  startTime: number;
  duration: number;
}

export default function BigDataProcessingEngineDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [simulationEnabled, setSimulationEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setJobs([
      { id: "job-1", type: "batch", status: "running", recordsProcessed: 0, recordsTotal: 1000000, startTime: Date.now(), duration: 0 },
      { id: "job-2", type: "stream", status: "running", recordsProcessed: 0, recordsTotal: 0, startTime: Date.now(), duration: 0 },
    ]);
  }, []);

  useEffect(() => {
    if (!isMounted || !simulationEnabled) return;
    
    intervalRef.current = setInterval(() => {
      setJobs(prev => prev.map(job => {
        if (job.status === "running") {
          const newProcessed = job.type === "batch" 
            ? Math.min(job.recordsTotal, job.recordsProcessed + Math.floor(Math.random() * 10000))
            : job.recordsProcessed + Math.floor(Math.random() * 1000);
          
          const isComplete = job.type === "batch" && newProcessed >= job.recordsTotal;
          
          return {
            ...job,
            recordsProcessed: newProcessed,
            status: isComplete ? "completed" : "running",
            duration: Date.now() - job.startTime,
          };
        }
        return job;
      }));
    }, 1000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMounted, simulationEnabled]);

  if (!isMounted) return null;

  const totalProcessed = jobs.reduce((sum, j) => sum + j.recordsProcessed, 0);
  const totalRecords = jobs.reduce((sum, j) => sum + (j.type === "batch" ? j.recordsTotal : 0), 0);

  return (
    <div className="box liquid-glass-card">
      <h3 className="title is-5 mb-4 liquid-glass-text">Big Data Processing Engine</h3>
      <div className="field mb-4">
        <label className="checkbox liquid-glass-text">
          <input
            type="checkbox"
            checked={simulationEnabled}
            onChange={(e) => setSimulationEnabled(e.target.checked)}
            aria-label="Enable simulation"
          />
          {" "}Enable Simulation
        </label>
      </div>
      <div className="columns mb-4">
        <div className="column">
          <div className="box liquid-glass-card has-background-info-light">
            <p className="heading liquid-glass-text">Total Processed</p>
            <p className="title is-4 liquid-glass-text">{(totalProcessed / 1000000).toFixed(2)}M</p>
          </div>
        </div>
        <div className="column">
          <div className="box liquid-glass-card has-background-success-light">
            <p className="heading liquid-glass-text">Batch Jobs</p>
            <p className="title is-4 liquid-glass-text">
              {jobs.filter(j => j.type === "batch").length}
            </p>
          </div>
        </div>
        <div className="column">
          <div className="box liquid-glass-card has-background-warning-light">
            <p className="heading liquid-glass-text">Stream Jobs</p>
            <p className="title is-4 liquid-glass-text">
              {jobs.filter(j => j.type === "stream").length}
            </p>
          </div>
        </div>
      </div>
      <div className="columns is-multiline">
        {jobs.map(job => (
          <div key={job.id} className="column is-one-half-tablet is-full-mobile">
            <div className="box liquid-glass-card">
              <h4 className="title is-6 liquid-glass-text">
                {job.type === "batch" ? "Batch" : "Stream"} Processing
              </h4>
              <div className="content is-small liquid-glass-text">
                <p><strong>Status:</strong> 
                  <span className={`tag ml-2 ${
                    job.status === "completed" ? "is-success" :
                    job.status === "failed" ? "is-danger" : "is-info"
                  }`}>
                    {job.status}
                  </span>
                </p>
                <p><strong>Records Processed:</strong> {job.recordsProcessed.toLocaleString()}</p>
                {job.type === "batch" && (
                  <>
                    <p><strong>Total Records:</strong> {job.recordsTotal.toLocaleString()}</p>
                    <progress
                      className="progress is-info mt-2"
                      value={job.recordsProcessed}
                      max={job.recordsTotal}
                      aria-label={`Progress: ${(job.recordsProcessed / job.recordsTotal * 100).toFixed(1)}%`}
                    >
                      {(job.recordsProcessed / job.recordsTotal * 100).toFixed(1)}%
                    </progress>
                  </>
                )}
                <p><strong>Duration:</strong> {(job.duration / 1000).toFixed(1)}s</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="content mt-4 liquid-glass-text">
        <h4 className="title is-6 mb-3">Features</h4>
        <ul>
          <li>Distributed processing with Apache Spark</li>
          <li>Real-time stream processing with Kafka</li>
          <li>Data transformation pipelines</li>
          <li>Fault tolerance and exactly-once semantics</li>
        </ul>
      </div>
    </div>
  );
}

