import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WorkspaceCards } from "@/components/domain/workspace-cards";

export default async function WorkspacesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as { role?: string }).role ?? "OPERATOR";

  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="font-mono text-xl font-bold tracking-wider text-foreground">
            SELECT WORKSPACE
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a workspace to continue
          </p>
        </div>
        <WorkspaceCards role={role} />
      </div>
    </div>
  );
}
