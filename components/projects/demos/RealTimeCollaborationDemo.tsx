"use client";

import { useEffect, useState, useRef } from "react";
import { Project } from "@/types";

interface User {
  id: string;
  name: string;
  status: "online" | "offline";
  lastSeen: number;
}

interface Change {
  id: string;
  userId: string;
  type: "insert" | "delete" | "update";
  timestamp: number;
}

export default function RealTimeCollaborationDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [simulationEnabled, setSimulationEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setUsers([
      { id: "user-1", name: "Alice", status: "online", lastSeen: Date.now() },
      { id: "user-2", name: "Bob", status: "online", lastSeen: Date.now() },
      { id: "user-3", name: "Charlie", status: "online", lastSeen: Date.now() },
    ]);
  }, []);

  useEffect(() => {
    if (!isMounted || !simulationEnabled) return;
    
    intervalRef.current = setInterval(() => {
      const changeTypes: Change["type"][] = ["insert", "delete", "update"];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      const newChange: Change = {
        id: `change-${Date.now()}`,
        userId: randomUser.id,
        type: changeTypes[Math.floor(Math.random() * changeTypes.length)],
        timestamp: Date.now(),
      };
      
      setChanges(prev => [...prev.slice(-20), newChange]);
    }, 1000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMounted, simulationEnabled, users]);

  if (!isMounted) return null;

  return (
    <div className="box liquid-glass-card">
      <h3 className="title is-5 mb-4 liquid-glass-text">Real-time Collaboration Platform</h3>
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
          <div className="box liquid-glass-card">
            <h4 className="title is-6 liquid-glass-text">Active Users</h4>
            <div className="content">
              {users.map(user => (
                <div key={user.id} className="is-flex is-align-items-center mb-2">
                  <span className={`tag ${user.status === "online" ? "is-success" : "is-light"} mr-2`}>
                    {user.status}
                  </span>
                  <span className="liquid-glass-text">{user.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="column">
          <div className="box liquid-glass-card">
            <h4 className="title is-6 liquid-glass-text">Recent Changes</h4>
            <div className="table-container">
              <table className="table is-fullwidth">
                <thead>
                  <tr>
                    <th className="liquid-glass-text">User</th>
                    <th className="liquid-glass-text">Type</th>
                    <th className="liquid-glass-text">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {changes.slice(-10).reverse().map(change => {
                    const user = users.find(u => u.id === change.userId);
                    return (
                      <tr key={change.id}>
                        <td className="liquid-glass-text">{user?.name || "Unknown"}</td>
                        <td className="liquid-glass-text">{change.type}</td>
                        <td className="liquid-glass-text">
                          {new Date(change.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div className="content liquid-glass-text">
        <h4 className="title is-6 mb-3">Features</h4>
        <ul>
          <li>CRDT-based conflict-free data synchronization</li>
          <li>Real-time presence awareness</li>
          <li>Offline support with automatic sync</li>
          <li>Comprehensive conflict resolution</li>
        </ul>
      </div>
    </div>
  );
}

