"use client";

import { useEffect, useState } from "react";
import { Project } from "@/types";

interface User {
  id: string;
  name: string;
  role: string;
  permissions: string[];
  mfaEnabled: boolean;
  lastLogin: number;
}

export default function IdentityAccessManagementDemo({ project }: { project: Project }) {
  const [isMounted, setIsMounted] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    setIsMounted(true);
    setUsers([
      { id: "1", name: "Admin User", role: "admin", permissions: ["read", "write", "delete"], mfaEnabled: true, lastLogin: Date.now() - 3600000 },
      { id: "2", name: "Developer", role: "developer", permissions: ["read", "write"], mfaEnabled: true, lastLogin: Date.now() - 7200000 },
      { id: "3", name: "Viewer", role: "viewer", permissions: ["read"], mfaEnabled: false, lastLogin: Date.now() - 86400000 },
    ]);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="box liquid-glass-card">
      <h3 className="title is-5 mb-4 liquid-glass-text">Identity & Access Management</h3>
      <div className="table-container">
        <table className="table is-fullwidth">
          <thead>
            <tr>
              <th className="liquid-glass-text">User</th>
              <th className="liquid-glass-text">Role</th>
              <th className="liquid-glass-text">Permissions</th>
              <th className="liquid-glass-text">MFA</th>
              <th className="liquid-glass-text">Last Login</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td className="liquid-glass-text">{user.name}</td>
                <td>
                  <span className="tag is-info">{user.role}</span>
                </td>
                <td className="liquid-glass-text">
                  <div className="tags">
                    {user.permissions.map(perm => (
                      <span key={perm} className="tag is-light">{perm}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <span className={`tag ${user.mfaEnabled ? "is-success" : "is-danger"}`}>
                    {user.mfaEnabled ? "Enabled" : "Disabled"}
                  </span>
                </td>
                <td className="liquid-glass-text">
                  {new Date(user.lastLogin).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="content mt-4 liquid-glass-text">
        <h4 className="title is-6 mb-3">Features</h4>
        <ul>
          <li>OAuth 2.0 and OpenID Connect support</li>
          <li>JWT token management with refresh tokens</li>
          <li>Role-based access control (RBAC)</li>
          <li>Multi-factor authentication (MFA)</li>
          <li>Single Sign-On (SSO) support</li>
        </ul>
      </div>
    </div>
  );
}

