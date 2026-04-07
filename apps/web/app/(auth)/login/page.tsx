"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/workspaces";
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isDev = process.env.NODE_ENV !== "production";

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signIn("credentials", { email, callbackUrl });
    setIsLoading(false);
  };

  const handleAzureLogin = () => {
    setIsLoading(true);
    signIn("microsoft-entra-id", { callbackUrl });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md border border-border bg-card p-8">
        <div className="mb-8 text-center">
          <h1 className="font-mono text-2xl font-bold tracking-tight text-primary">
            MPC PLATFORM
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            AI-Driven Model Predictive Control
          </p>
        </div>

        <button
          onClick={handleAzureLogin}
          disabled={isLoading}
          className="w-full border border-border bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        >
          Sign in with Microsoft
        </button>

        {isDev && (
          <>
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="font-mono text-xs text-muted-foreground">DEV ONLY</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <form onSubmit={handleDevLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block font-mono text-xs text-muted-foreground">
                  EMAIL
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mpc.local"
                  required
                  className="w-full border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary px-4 py-2 font-mono text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? "SIGNING IN..." : "DEV LOGIN"}
              </button>
              <div className="space-y-1 font-mono text-xs text-muted-foreground">
                <p>admin@mpc.local — ADMIN</p>
                <p>engineer@mpc.local — ENGINEER</p>
                <p>operator@mpc.local — OPERATOR</p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
