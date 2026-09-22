import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/grc/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { askAegis } from "@/lib/grc/ai";
import { listAskMessages } from "@/lib/grc/queries";
import { RichText } from "@/components/grc/rich-text";

export const Route = createFileRoute("/ask")({
  component: AskPage,
});

const PROMPTS = [
  "Why is AETHER-C2 not ready for reauthorization?",
  "What evidence supports SC-7 on AETHER-C2?",
  "Which high-risk POA&Ms are overdue?",
  "What happens to authorization if CVE-2026-44102 remains unresolved?",
  "What is blocking HELIOS-LAKE from an AO decision?",
];

function AskPage() {
  const qc = useQueryClient();
  const [question, setQuestion] = useState("");
  const history = useQuery({
    queryKey: ["ask"],
    queryFn: () => listAskMessages(),
  });

  const mut = useMutation({
    mutationFn: (q: string) => askAegis({ data: { question: q } }),
    onSuccess: (res) => {
      if (!res.ok) toast.error(res.error);
      qc.invalidateQueries({ queryKey: ["ask"] });
    },
    onError: () => toast.error("Aegis could not complete that request"),
  });

  function send(q: string) {
    const text = q.trim();
    if (!text || mut.isPending) return;
    setQuestion("");
    mut.mutate(text);
  }

  const messages = history.data ?? [];

  return (
    <div>
      <PageHeader
        kicker="AO copilot"
        title="Ask Aegis"
        description="Grounded in the live RMF dataset. Citations use control IDs, evidence, and POA&M identifiers. Aegis recommends; humans authorize."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => send(p)}
            className="rounded-full bg-secondary px-3 py-2 text-left text-xs text-muted-foreground hover:text-foreground"
          >
            {p}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="min-h-64 space-y-4">
            {messages.length === 0 && !mut.isPending ? (
              <p className="text-sm text-muted-foreground">
                Ask why a system is not ready, which controls block authorization, or what a vulnerability does to residual risk.
              </p>
            ) : null}
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "ml-8 rounded-lg bg-secondary px-4 py-3 text-sm"
                    : "mr-4 rounded-lg bg-card px-4 py-3 text-sm shadow-[var(--shadow-border)]"
                }
              >
                <div className="mb-1 text-[11px] tracking-wide text-muted-foreground uppercase">
                  {m.role === "user" ? "You" : "Aegis"}
                </div>
                {m.role === "assistant" ? (
                  <RichText text={m.content} />
                ) : (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                )}
              </div>
            ))}
            {mut.isPending ? (
              <div className="text-sm text-muted-foreground">Aegis is examining the authorization package…</div>
            ) : null}
          </div>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(question);
            }}
          >
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about ATO blockers, evidence, or residual risk"
              rows={3}
            />
            <Button type="submit" disabled={mut.isPending || !question.trim()}>
              {mut.isPending ? "Working…" : "Ask"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
