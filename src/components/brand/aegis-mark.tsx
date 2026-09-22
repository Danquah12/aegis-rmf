import { cn } from "@/lib/utils";

export function AegisMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("text-primary", className)}
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M16 2.5 5.5 7.2v8.3c0 6.4 4.4 12.1 10.5 14 6.1-1.9 10.5-7.6 10.5-14V7.2L16 2.5zm0 2.3 8.2 3.6v7.1c0 5.1-3.4 9.6-8.2 11.2-4.8-1.6-8.2-6.1-8.2-11.2V8.4L16 4.8z"
      />
      <path
        fill="currentColor"
        d="M16 10.2 11.2 16l4.8 5.8L20.8 16 16 10.2zm0 2.8 2.2 2.7L16 18.6 13.8 15.7 16 13z"
      />
    </svg>
  );
}
