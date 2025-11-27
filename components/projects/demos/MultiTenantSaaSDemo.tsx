"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Project } from "@/types";

interface Tenant {
  id: string;
  name: string;
  plan: "free" | "basic" | "pro" | "enterprise";
  status: "active" | "suspended" | "trial";
  resourceUsage: {
    cpu: number;
    memory: number;
    storage: number;
    requests: number;
  };
  quota: {
    cpu: number;
    memory: number;
    storage: number;
    requests: number;
  };
  cost: number;
  createdAt: number;
}

export default function MultiTenantSaaSDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [activeTab, setActiveTab] = useState<"tenants" | "isolation" | "costs" | "resources">("tenants");
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [simulationEnabled, setSimulationEnabled] = useState(true);
  const [totalCost, setTotalCost] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const initializeTenants = useCallback(() => {
    const plans: Tenant["plan"][] = ["free", "basic", "pro", "enterprise"];
    const statuses: Tenant["status"][] = ["active", "active", "active", "trial", "suspended"];
    
    const newTenants: Tenant[] = Array.from({ length: 50 }, (_, i) => {
      const plan = plans[Math.floor(Math.random() * plans.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const quotas = {
        free: { cpu: 10, memory: 512, storage: 1024, requests: 1000 },
        basic: { cpu: 50, memory: 2048, storage: 10240, requests: 10000 },
        pro: { cpu: 200, memory: 8192, storage: 51200, requests: 100000 },
        enterprise: { cpu: 1000, memory: 32768, storage: 512000, requests: 1000000 },
      };
      
      const quota = quotas[plan];
      const usage = {
        cpu: Math.random() * quota.cpu * 0.8,
        memory: Math.random() * quota.memory * 0.8,
        storage: Math.random() * quota.storage * 0.7,
        requests: Math.random() * quota.requests * 0.9,
      };
      
      const costs = { free: 0, basic: 29, pro: 99, enterprise: 499 };
      const cost = costs[plan];
      
      return {
        id: `tenant-${i}`,
        name: `Tenant ${i + 1}`,
        plan,
        status,
        resourceUsage: usage,
        quota,
        cost,
        createdAt: Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
      };
    });
    
    setTenants(newTenants);
  }, []);

  const updateTenants = useCallback(() => {
    if (!simulationEnabled) return;
    
    setTenants(prev => prev.map(tenant => {
      const variation = (Math.random() - 0.5) * 0.1;
      return {
        ...tenant,
        resourceUsage: {
          cpu: Math.max(0, Math.min(tenant.quota.cpu, tenant.resourceUsage.cpu * (1 + variation))),
          memory: Math.max(0, Math.min(tenant.quota.memory, tenant.resourceUsage.memory * (1 + variation))),
          storage: Math.max(0, Math.min(tenant.quota.storage, tenant.resourceUsage.storage * (1 + variation * 0.5))),
          requests: Math.max(0, Math.min(tenant.quota.requests, tenant.resourceUsage.requests * (1 + variation))),
        },
      };
    }));
    
    const revenue = tenants.reduce((sum, t) => sum + (t.status === "active" ? t.cost : 0), 0);
    const cost = tenants.reduce((sum, t) => {
      const usageCost = (t.resourceUsage.cpu * 0.01) + (t.resourceUsage.memory * 0.001) + (t.resourceUsage.storage * 0.0001);
      return sum + usageCost;
    }, 0);
    
    setTotalRevenue(revenue);
    setTotalCost(cost);
  }, [simulationEnabled, tenants]);

  useEffect(() => {
    setIsMounted(true);
    initializeTenants();
    
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    mediaQuery.addEventListener("change", (e) => setPrefersReducedMotion(e.matches));
    
    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, [initializeTenants]);

  useEffect(() => {
    if (!isMounted || !simulationEnabled) return;
    
    intervalRef.current = setInterval(updateTenants, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMounted, simulationEnabled, updateTenants]);

  if (!isMounted) return null;

  const selectedTenantData = tenants.find(t => t.id === selectedTenant);

  return (
    <div className="box liquid-glass-card">
      <div className="tabs is-boxed mb-4">
        <ul>
          <li className={activeTab === "tenants" ? "is-active" : ""}>
            <a onClick={() => setActiveTab("tenants")} role="button" tabIndex={0} aria-label="Tenants view">
              Tenants ({tenants.length})
            </a>
          </li>
          <li className={activeTab === "isolation" ? "is-active" : ""}>
            <a onClick={() => setActiveTab("isolation")} role="button" tabIndex={0} aria-label="Isolation view">
              Isolation
            </a>
          </li>
          <li className={activeTab === "costs" ? "is-active" : ""}>
            <a onClick={() => setActiveTab("costs")} role="button" tabIndex={0} aria-label="Cost analysis view">
              Cost Analysis
            </a>
          </li>
          <li className={activeTab === "resources" ? "is-active" : ""}>
            <a onClick={() => setActiveTab("resources")} role="button" tabIndex={0} aria-label="Resource usage view">
              Resources
            </a>
          </li>
        </ul>
      </div>

      <div className="box liquid-glass-card mb-4">
        <div className="field">
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
      </div>

      {activeTab === "tenants" && (
        <div>
          <h3 className="title is-5 mb-4 liquid-glass-text">Tenant Management</h3>
          <div className="columns is-multiline">
            {tenants.slice(0, 20).map(tenant => (
              <div key={tenant.id} className="column is-one-quarter-tablet is-half-mobile">
                <div className="box liquid-glass-card">
                  <h4 className="title is-6 liquid-glass-text">{tenant.name}</h4>
                  <div className="tags mb-2">
                    <span className={`tag ${
                      tenant.plan === "enterprise" ? "is-danger" :
                      tenant.plan === "pro" ? "is-warning" :
                      tenant.plan === "basic" ? "is-info" : "is-light"
                    }`}>
                      {tenant.plan}
                    </span>
                    <span className={`tag ${
                      tenant.status === "active" ? "is-success" :
                      tenant.status === "trial" ? "is-warning" : "is-danger"
                    }`}>
                      {tenant.status}
                    </span>
                  </div>
                  <div className="content is-small liquid-glass-text">
                    <p><strong>Cost:</strong> ${tenant.cost}/mo</p>
                    <p><strong>CPU:</strong> {(tenant.resourceUsage.cpu / tenant.quota.cpu * 100).toFixed(1)}%</p>
                    <p><strong>Memory:</strong> {(tenant.resourceUsage.memory / tenant.quota.memory * 100).toFixed(1)}%</p>
                    <p><strong>Storage:</strong> {(tenant.resourceUsage.storage / tenant.quota.storage * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "isolation" && (
        <div>
          <h3 className="title is-5 mb-4 liquid-glass-text">Tenant Isolation</h3>
          <div className="box liquid-glass-card">
            <h4 className="title is-6 liquid-glass-text">Isolation Levels</h4>
            <div className="content liquid-glass-text">
              <ul>
                <li><strong>Database Level:</strong> Separate schemas per tenant with row-level security</li>
                <li><strong>Application Level:</strong> Tenant context in all requests, isolated sessions</li>
                <li><strong>Infrastructure Level:</strong> Resource quotas, network isolation, dedicated resources for enterprise</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === "costs" && (
        <div>
          <h3 className="title is-5 mb-4 liquid-glass-text">Cost Analysis</h3>
          <div className="columns">
            <div className="column">
              <div className="box liquid-glass-card has-background-success-light">
                <p className="heading liquid-glass-text">Total Revenue</p>
                <p className="title is-4 liquid-glass-text">${totalRevenue.toFixed(2)}/mo</p>
              </div>
            </div>
            <div className="column">
              <div className="box liquid-glass-card has-background-warning-light">
                <p className="heading liquid-glass-text">Total Cost</p>
                <p className="title is-4 liquid-glass-text">${totalCost.toFixed(2)}/mo</p>
              </div>
            </div>
            <div className="column">
              <div className="box liquid-glass-card has-background-info-light">
                <p className="heading liquid-glass-text">Profit Margin</p>
                <p className="title is-4 liquid-glass-text">
                  {totalRevenue > 0 ? ((1 - totalCost / totalRevenue) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "resources" && (
        <div>
          <h3 className="title is-5 mb-4 liquid-glass-text">Resource Usage</h3>
          <div className="table-container">
            <table className="table is-fullwidth">
              <thead>
                <tr>
                  <th className="liquid-glass-text">Tenant</th>
                  <th className="liquid-glass-text">Plan</th>
                  <th className="liquid-glass-text">CPU Usage</th>
                  <th className="liquid-glass-text">Memory Usage</th>
                  <th className="liquid-glass-text">Storage Usage</th>
                </tr>
              </thead>
              <tbody>
                {tenants.slice(0, 10).map(tenant => (
                  <tr key={tenant.id}>
                    <td className="liquid-glass-text">{tenant.name}</td>
                    <td className="liquid-glass-text">{tenant.plan}</td>
                    <td className="liquid-glass-text">
                      {(tenant.resourceUsage.cpu / tenant.quota.cpu * 100).toFixed(1)}%
                    </td>
                    <td className="liquid-glass-text">
                      {(tenant.resourceUsage.memory / tenant.quota.memory * 100).toFixed(1)}%
                    </td>
                    <td className="liquid-glass-text">
                      {(tenant.resourceUsage.storage / tenant.quota.storage * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

