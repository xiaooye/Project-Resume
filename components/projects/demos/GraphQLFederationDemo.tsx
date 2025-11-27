"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Project } from "@/types";

interface Service {
  id: string;
  name: string;
  schema: string;
  queries: number;
  mutations: number;
}

interface Query {
  id: string;
  query: string;
  services: string[];
  latency: number;
  timestamp: number;
}

export default function GraphQLFederationDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [simulationEnabled, setSimulationEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const initializeServices = useCallback(() => {
    const newServices: Service[] = [
      { id: "user-service", name: "User Service", schema: "User, Profile", queries: 0, mutations: 0 },
      { id: "order-service", name: "Order Service", schema: "Order, OrderItem", queries: 0, mutations: 0 },
      { id: "product-service", name: "Product Service", schema: "Product, Category", queries: 0, mutations: 0 },
      { id: "payment-service", name: "Payment Service", schema: "Payment, Transaction", queries: 0, mutations: 0 },
    ];
    setServices(newServices);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    initializeServices();
  }, [initializeServices]);

  useEffect(() => {
    if (!isMounted || !simulationEnabled) return;
    
    intervalRef.current = setInterval(() => {
      const queryTypes = [
        { query: "query { user { orders { products } } }", services: ["user-service", "order-service", "product-service"] },
        { query: "query { products { category { name } } }", services: ["product-service"] },
        { query: "mutation { createOrder { id } }", services: ["order-service", "payment-service"] },
      ];
      
      const randomQuery = queryTypes[Math.floor(Math.random() * queryTypes.length)];
      const latency = randomQuery.services.length * 20 + Math.random() * 30;
      
      const newQuery: Query = {
        id: `query-${Date.now()}`,
        query: randomQuery.query,
        services: randomQuery.services,
        latency,
        timestamp: Date.now(),
      };
      
      setQueries(prev => [...prev.slice(-20), newQuery]);
      
      setServices(prev => prev.map(svc => 
        randomQuery.services.includes(svc.id)
          ? { ...svc, queries: svc.queries + 1 }
          : svc
      ));
    }, 1000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMounted, simulationEnabled]);

  if (!isMounted) return null;

  return (
    <div className="box liquid-glass-card">
      <h3 className="title is-5 mb-4 liquid-glass-text">GraphQL Federation</h3>
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
      <div className="columns is-multiline mb-4">
        {services.map(service => (
          <div key={service.id} className="column is-one-quarter-tablet is-half-mobile">
            <div className="box liquid-glass-card">
              <h4 className="title is-6 liquid-glass-text">{service.name}</h4>
              <div className="content is-small liquid-glass-text">
                <p><strong>Schema:</strong> {service.schema}</p>
                <p><strong>Queries:</strong> {service.queries}</p>
                <p><strong>Mutations:</strong> {service.mutations}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="table-container">
        <table className="table is-fullwidth">
          <thead>
            <tr>
              <th className="liquid-glass-text">Query</th>
              <th className="liquid-glass-text">Services</th>
              <th className="liquid-glass-text">Latency</th>
              <th className="liquid-glass-text">Time</th>
            </tr>
          </thead>
          <tbody>
            {queries.slice(-10).reverse().map(query => (
              <tr key={query.id}>
                <td className="liquid-glass-text"><code className="is-size-7">{query.query.substring(0, 40)}...</code></td>
                <td className="liquid-glass-text">{query.services.join(", ")}</td>
                <td className="liquid-glass-text">{query.latency.toFixed(1)}ms</td>
                <td className="liquid-glass-text">{new Date(query.timestamp).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

