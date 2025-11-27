"use client";

import { useEffect, useState, useRef } from "react";
import { Project } from "@/types";

interface Event {
  id: string;
  type: string;
  timestamp: number;
  source: string;
  processed: boolean;
}

export default function EventDrivenArchitectureDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [simulationEnabled, setSimulationEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !simulationEnabled) return;
    
    intervalRef.current = setInterval(() => {
      const eventTypes = ["OrderCreated", "PaymentProcessed", "InventoryUpdated", "UserRegistered"];
      const sources = ["OrderService", "PaymentService", "InventoryService", "UserService"];
      
      const newEvent: Event = {
        id: `event-${Date.now()}-${Math.random()}`,
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        timestamp: Date.now(),
        source: sources[Math.floor(Math.random() * sources.length)],
        processed: false,
      };
      
      setEvents(prev => [...prev.slice(-30), newEvent]);
      
      setTimeout(() => {
        setEvents(prev => prev.map(e => e.id === newEvent.id ? { ...e, processed: true } : e));
        setProcessedCount(prev => prev + 1);
      }, 200);
    }, 500);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMounted, simulationEnabled]);

  if (!isMounted) return null;

  return (
    <div className="box liquid-glass-card">
      <h3 className="title is-5 mb-4 liquid-glass-text">Event-Driven Architecture</h3>
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
              <th className="liquid-glass-text">Event Type</th>
              <th className="liquid-glass-text">Source</th>
              <th className="liquid-glass-text">Status</th>
              <th className="liquid-glass-text">Time</th>
            </tr>
          </thead>
          <tbody>
            {events.slice(-20).reverse().map(event => (
              <tr key={event.id}>
                <td className="liquid-glass-text">{event.type}</td>
                <td className="liquid-glass-text">{event.source}</td>
                <td>
                  <span className={`tag ${event.processed ? "is-success" : "is-warning"}`}>
                    {event.processed ? "Processed" : "Processing"}
                  </span>
                </td>
                <td className="liquid-glass-text">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="content mt-4 liquid-glass-text">
        <h4 className="title is-6 mb-3">Architecture Features</h4>
        <ul>
          <li>Event sourcing for complete audit trails</li>
          <li>CQRS pattern for read/write separation</li>
          <li>Event replay capabilities for audit and recovery</li>
          <li>Distributed event processing</li>
        </ul>
      </div>
    </div>
  );
}

