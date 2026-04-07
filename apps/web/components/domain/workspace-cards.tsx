"use client";

import Link from "next/link";
import { can, type Role } from "@/lib/rbac";

interface WorkspaceCardsProps {
  role: string;
}

const WORKSPACES = [
  {
    id: "operations",
    title: "Operations",
    description: "Real-time monitoring, KPIs, alerts, and system telemetry",
    href: "/operations",
    permission: "view:operations" as const,
    icon: "◉",
  },
  {
    id: "engineering",
    title: "Engineering",
    description: "Compressor configuration, demand forecasting, and simulation",
    href: "/engineering",
    permission: "view:engineering" as const,
    icon: "⚙",
  },
  {
    id: "admin",
    title: "Administration",
    description: "User management, role assignments, and audit logs",
    href: "/admin/users",
    permission: "view:admin" as const,
    icon: "⊞",
  },
] as const;

export function WorkspaceCards({ role }: WorkspaceCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {WORKSPACES.map((workspace) => {
        const hasAccess = can(role as Role, workspace.permission);

        if (hasAccess) {
          return (
            <Link
              key={workspace.id}
              href={workspace.href}
              className="group border border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-card/80"
            >
              <div className="mb-3 font-mono text-2xl text-primary">{workspace.icon}</div>
              <h2 className="font-mono text-sm font-bold tracking-wider text-foreground">
                {workspace.title.toUpperCase()}
              </h2>
              <p className="mt-2 text-xs text-muted-foreground">{workspace.description}</p>
              <div className="mt-4 font-mono text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                ENTER →
              </div>
            </Link>
          );
        }

        return (
          <div
            key={workspace.id}
            className="cursor-not-allowed border border-border/50 bg-muted/30 p-6 opacity-50"
          >
            <div className="mb-3 font-mono text-2xl text-muted-foreground">{workspace.icon}</div>
            <h2 className="font-mono text-sm font-bold tracking-wider text-muted-foreground">
              {workspace.title.toUpperCase()}
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">{workspace.description}</p>
            <div className="mt-4 font-mono text-xs text-muted-foreground">
              LOCKED — {workspace.permission.split(":")[1]?.toUpperCase()} ACCESS REQUIRED
            </div>
          </div>
        );
      })}
    </div>
  );
}
