"use client";

import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { type Session } from "next-auth";
import Link from "next/link";

interface TopBarProps {
  user: Session["user"];
}

export function TopBar({ user }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const role = (user as { role?: string }).role ?? "OPERATOR";

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-4">
        <Link href="/workspaces" className="font-mono text-sm font-bold tracking-wider text-primary">
          MPC PLATFORM
        </Link>
        <span className="font-mono text-xs text-muted-foreground">|</span>
        <nav className="flex items-center gap-3">
          <Link
            href="/operations"
            className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            OPERATIONS
          </Link>
          {(role === "ADMIN" || role === "ENGINEER") && (
            <Link
              href="/engineering"
              className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              ENGINEERING
            </Link>
          )}
          {role === "ADMIN" && (
            <Link
              href="/admin/users"
              className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              ADMIN
            </Link>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "☀ LIGHT" : "● DARK"}
        </button>
        <span className="font-mono text-xs text-muted-foreground">|</span>
        <span className="font-mono text-xs text-foreground">{user.name}</span>
        <span className="border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary">
          {role}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="font-mono text-xs text-muted-foreground transition-colors hover:text-destructive"
        >
          LOGOUT
        </button>
      </div>
    </header>
  );
}
