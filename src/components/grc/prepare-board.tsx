import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Landmark, Shield, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Meter } from "@/components/grc/meter";
import { StatusBadge } from "@/components/grc/status-badge";
import { ActingAsPicker } from "@/components/grc/acting-as";
import { Phase0ArtifactsPanel } from "@/components/grc/phase0-artifacts";
import { DiscoveryPreview } from "@/components/grc/discovery-panel";
import { useActingRole } from "@/hooks/use-acting-role";
import {
  ORG_KIND_LABEL,
  RMF_ACTIONS,
  RMF_ROLES,
  buildOrgPrepareView,
  canPerform,
  componentUnits,
  isOrgUnitKind,
  personForAssignment,
  roleById,
  whoCan,
  type OrgNode,
  type RmfActionId,
} from "@/lib/grc/phase0";
import { registerSystem } from "@/lib/grc/queries";
import type { ImpactLevel, PortfolioSnapshot } from "@/lib/grc/types";
import { cn } from "@/lib/utils";

const DEPTH_PAD = ["pl-0", "pl-4", "pl-8", "pl-12", "pl-16"] as const;

function TreeRows({ nodes, depth = 0 }: { nodes: OrgNode[]; depth?: number }) {
  return (
    <ul className="space-y-1">
      {nodes.map((n) => {
        const label = isOrgUnitKind(n.unit.kind) ? ORG_KIND_LABEL[n.unit.kind] : n.unit.kind;
        return (
          <li key={n.unit.id}>
            <div
              className={cn(
                "flex min-h-11 flex-wrap items-center gap-2 rounded-md py-1.5 pr-2",
                DEPTH_PAD[Math.min(depth, DEPTH_PAD.length - 1)],
              )}
            >
              <span className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                {n.unit.acronym}
              </span>
              <span className="text-sm font-medium">{n.unit.name}</span>
              <Badge variant="outline">{label}</Badge>
              <StatusBadge status={n.unit.status} />
            </div>
            {n.unit.description ? (
              <p
                className={cn(
                  "pb-2 text-xs text-muted-foreground",
                  DEPTH_PAD[Math.min(depth, DEPTH_PAD.length - 1)],
                )}
              >
                {n.unit.description}
              </p>
            ) : null}
            {n.children.length ? <TreeRows nodes={n.children} depth={depth + 1} /> : null}
          </li>
        );
      })}
    </ul>
  );
}

export function PrepareBoard({ data }: { data: PortfolioSnapshot }) {
  const view = buildOrgPrepareView(data);
  const { roleId, role } = useActingRole();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [actionId, setActionId] = useState<RmfActionId>("ato.issue");
  const [name, setName] = useState("");
  const [acronym, setAcronym] = useState("");
  const [mission, setMission] = useState("");
  const [orgId, setOrgId] = useState(componentUnits(view.units)[0]?.id ?? "ORG-MD");
  const [impact, setImpact] = useState<ImpactLevel>("moderate");
  const components = componentUnits(view.units);
  const canCreate = view.readyForSystems && canPerform(roleId, "system.create");
  const actionHolders = whoCan(actionId);
  const actionMeta = RMF_ACTIONS.find((a) => a.id === actionId);

  const mut = useMutation({
    mutationFn: () =>
      registerSystem({
        data: { name, acronym, mission, orgId, impactLevel: impact, actingRole: roleId },
      }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Registered ${res.id}`);
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      void navigate({ to: "/systems/$systemId", params: { systemId: res.id } });
    },
  });

  return (
    <div className="min-w-0 space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Landmark className="size-4" />
            Organization-level Prepare
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{view.summary}</p>
          <Meter value={view.overall} label="Phase 0 completeness" />
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div>
              <div className="font-display text-xl tabular-nums text-foreground">{view.unitScore}%</div>
              Environment
            </div>
            <div>
              <div className="font-display text-xl tabular-nums text-foreground">{view.roleScore}%</div>
              Roles assigned
            </div>
            <div>
              <div className="font-display text-xl tabular-nums text-foreground">{view.taskScore}%</div>
              P-1 to P-7
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>1 · Organization environment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Agency, department, and component sit under the organization. Mission, business functions, risk
            executive, security program, privacy program, and governance sit beside them. Systems register under a
            component — never under the agency root.
          </p>
          <TreeRows nodes={view.tree} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2 · SP 800-37 tasks P-1 through P-7</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {view.tasks.map((t) => {
            const owner = roleById(t.ownerRole);
            return (
              <div key={t.id} className="rounded-md border border-border bg-secondary/40 px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] tracking-wide uppercase">{t.taskId}</span>
                  <span className="text-sm font-medium">{t.title}</span>
                  <StatusBadge status={t.status} />
                  {owner ? <Badge variant="outline">{owner.name}</Badge> : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t.evidence}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Phase0ArtifactsPanel data={data} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="size-4" />
            4 · RMF role model
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Who can perform which action. Agents and the engine are not a role — they never issue an ATO, never
            accept residual risk, and never close a POA&M.
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            {RMF_ROLES.map((r) => {
              const assigned = view.assignments.filter((a) => a.roleId === r.id);
              return (
                <div key={r.id} className="rounded-lg border border-border bg-card px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{r.name}</span>
                    {r.overlay ? <Badge variant="partial">{r.overlay}</Badge> : <Badge variant="outline">{r.scope}</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{r.notes}</p>
                  <div className="mt-2 text-xs">
                    <span className="text-muted-foreground">Can: </span>
                    {r.allows.map((a) => (
                      <span key={a} className="mr-1.5 font-mono text-[11px]">
                        {a}
                      </span>
                    ))}
                  </div>
                  {r.never.length ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Cannot: {r.never.map((a) => a).join(" · ")}
                    </div>
                  ) : null}
                  <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                    {assigned.map((a) => {
                      const person = personForAssignment(a, data.personnel);
                      return (
                        <li key={a.id}>
                          {person?.name ?? a.personId} — {a.notes}
                        </li>
                      );
                    })}
                    {assigned.length === 0 ? <li>Unassigned</li> : null}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5 · Action lookup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="rmf-action">Action</Label>
            <Select value={actionId} onValueChange={(v) => setActionId(v as RmfActionId)}>
              <SelectTrigger id="rmf-action" className="min-h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RMF_ACTIONS.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.label}
                    {a.official ? " — official / human" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {actionMeta?.official ? (
            <p className="text-sm text-muted-foreground">
              Official result. The engine will not perform this action.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {actionHolders.map((r) => (
              <Badge key={r.id} variant={r.id === "ao" || r.id === "aodr" ? "partial" : "outline"}>
                {r.name}
              </Badge>
            ))}
            {actionHolders.length === 0 ? (
              <span className="text-sm text-muted-foreground">No human role is allowed this action.</span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            You are acting as {role.name}. {canPerform(roleId, actionId) ? "You may perform this action." : "You may not perform this action."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6 · Acting as</CardTitle>
        </CardHeader>
        <CardContent>
          <ActingAsPicker />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-4" />
            7 · Register an information system
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Only after organization Prepare is complete, and only as System Owner or CIO. Enter the name, acronym, and
            mission — the discovery engine fills inventory from CMDB, cloud, identity, scanners, and pipelines. Do not
            type every CI. Registering a system is not an ATO.
          </p>
          {!view.readyForSystems ? (
            <p className="text-sm text-other">Gate closed — finish P-1 through P-7 and assign every SP 800-37 role.</p>
          ) : null}
          {!canPerform(roleId, "system.create") ? (
            <p className="text-sm text-muted-foreground">
              {role.name} cannot register a system. Switch acting-as to System Owner or CIO.
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="sys-name">System name</Label>
              <Input
                id="sys-name"
                className="min-h-11"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Harbor CUI Exchange"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sys-acro">Acronym</Label>
              <Input
                id="sys-acro"
                className="min-h-11"
                value={acronym}
                onChange={(e) => setAcronym(e.target.value)}
                placeholder="HARBOR"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="sys-mission">Mission</Label>
            <Textarea
              id="sys-mission"
              rows={3}
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              placeholder="What this boundary exists to do."
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="sys-org">Component</Label>
              <Select value={orgId} onValueChange={setOrgId}>
                <SelectTrigger id="sys-org" className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {components.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.acronym} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="sys-impact">FIPS 199 high-water mark</Label>
              <Select value={impact} onValueChange={(v) => setImpact(v as ImpactLevel)}>
                <SelectTrigger id="sys-impact" className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DiscoveryPreview name={name} acronym={acronym} mission={mission} />
          <div className="flex flex-wrap gap-2">
            <Button
              className="min-h-11"
              disabled={!canCreate || mut.isPending}
              onClick={() => mut.mutate()}
            >
              {mut.isPending ? "Registering…" : "Register + discover inventory"}
            </Button>
            <Button variant="outline" asChild className="min-h-11">
              <Link to="/systems">Open system register</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
