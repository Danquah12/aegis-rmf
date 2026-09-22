import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CycleBadge } from "@/components/grc/cycle-badge";
import { PageHeader } from "@/components/grc/page-header";
import { StatusBadge } from "@/components/grc/status-badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { NIST_CATALOG } from "@/lib/grc/catalog";
import { rmfStepForControl, RMF_STEP_META, RMF_STEPS } from "@/lib/grc/cycle";
import { FAMILY_META, FAMILY_ORDER } from "@/lib/grc/families";
import type { ControlFamily, RmfStep } from "@/lib/grc/types";

export const Route = createFileRoute("/controls/")({
  component: ControlsPage,
});

function ControlsPage() {
  const [q, setQ] = useState("");
  const [family, setFamily] = useState<ControlFamily | "all">("all");
  const [step, setStep] = useState<RmfStep | "all">("all");
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return NIST_CATALOG.filter((c) => {
      if (family !== "all" && c.family !== family) return false;
      if (step !== "all" && rmfStepForControl(c.id) !== step) return false;
      if (!query) return true;
      return (
        c.id.toLowerCase().includes(query) ||
        c.title.toLowerCase().includes(query) ||
        c.statement.toLowerCase().includes(query)
      );
    });
  }, [q, family, step]);

  return (
    <div>
      <PageHeader
        kicker="OSCAL catalog"
        title="NIST SP 800-53 Rev. 5"
        description="Machine-readable control library covering twenty families. Each control is mapped to the RMF step that owns it."
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search control ID, title, or statement"
          className="sm:max-w-sm"
        />
        <div className="text-sm text-muted-foreground self-center tabular-nums">
          {filtered.length} controls
        </div>
      </div>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        <FamilyChip active={step === "all"} onClick={() => setStep("all")} label="All steps" />
        {RMF_STEPS.map((id) => (
          <FamilyChip
            key={id}
            active={step === id}
            onClick={() => setStep(id)}
            label={`${RMF_STEP_META[id].index} ${RMF_STEP_META[id].name}`}
          />
        ))}
      </div>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <FamilyChip active={family === "all"} onClick={() => setFamily("all")} label="All families" />
        {FAMILY_ORDER.map((id) => (
          <FamilyChip
            key={id}
            active={family === id}
            onClick={() => setFamily(id)}
            label={id}
          />
        ))}
      </div>
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {filtered.map((c) => (
            <Link
              key={c.id}
              to="/controls/$controlId"
              params={{ controlId: c.id }}
              className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs">{c.id}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {FAMILY_META[c.family].name}
                  </span>
                  <CycleBadge step={rmfStepForControl(c.id)} link={false} />
                </div>
                <div className="text-sm font-medium">{c.title}</div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.statement}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {c.baselines.map((b) => (
                  <StatusBadge key={b} status={b} />
                ))}
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function FamilyChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "h-9 shrink-0 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground"
          : "h-9 shrink-0 rounded-md bg-secondary px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
      }
    >
      {label}
    </button>
  );
}
