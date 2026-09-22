import type { ReactNode } from "react";

export function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded-md bg-secondary" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-secondary" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-secondary" />
    </div>
  );
}

export function ErrorState({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-xl bg-card px-5 py-8 text-sm text-muted-foreground shadow-[var(--shadow-border)]">
      {children ?? "Unable to load the RMF workspace. Reload and try again."}
    </div>
  );
}
