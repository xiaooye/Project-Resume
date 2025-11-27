"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Project } from "@/types";

interface Event {
  id: string;
  type: string;
  timestamp: number;
  data: Record<string, any>;
  processed: boolean;
}

export default function RealTimeDataStreamingDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [simulationEnabled, setSimulationEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isMounted || !simulationEnabled) return;
    
    intervalRef.current = setInterval(() => {
      const newEvent: Event = {
        id: `event-${Date.now()}-${Math.random()}`,
        type: ["order", "payment", "inventory", "user"][Math.floor(Math.random() * 4)],
        timestamp: Date.now(),
        data: { value: Math.random() * 1000 },
        processed: false,
      };
      
      setEvents(prev => [...prev.slice(-50), newEvent]);
      
      setTimeout(() => {
        setEvents(prev => prev.map(e => e.id === newEvent.id ? { ...e, processed: true } : e));
        setProcessedCount(prev => prev + 1);
      }, 100);
    }, 200);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMounted, simulationEnabled]);

  if (!isMounted) return null;

  return (
    <div className="box liquid-glass-card">
      <h3 className="title is-5 mb-4 liquid-glass-text">Real-time Event Streaming</h3>
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
            <p className="heading liquid-glass-text">Total Events</p>
            <p className="title is-4 liquid-glass-text">{events.length}</p>
          </div>
        </div>
        <div className="column">
          <div className="box liquid-glass-card has-background-success-light">
            <p className="heading liquid-glass-text">Processed</p>
            <p className="title is-4 liquid-glass-text">{processedCount}</p>
          </div>
        </div>
      </div>
      <div className="table-container">
        <table className="table is-fullwidth">
          <thead>
            <tr>
              <th className="liquid-glass-text">Event ID</th>
              <th className="liquid-glass-text">Type</th>
              <th className="liquid-glass-text">Status</th>
              <th className="liquid-glass-text">Time</th>
            </tr>
          </thead>
          <tbody>
            {events.slice(-20).reverse().map(event => (
              <tr key={event.id}>
                <td className="liquid-glass-text"><code className="is-size-7">{event.id.substring(0, 20)}...</code></td>
                <td className="liquid-glass-text">{event.type}</td>
                <td>
                  <span className={`tag ${event.processed ? "is-success" : "is-warning"}`}>
                    {event.processed ? "Processed" : "Processing"}
                  </span>
                </td>
                <td className="liquid-glass-text">{new Date(event.timestamp).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

