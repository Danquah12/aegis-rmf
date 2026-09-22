function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-medium text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function RichText({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: { type: "h" | "p" | "li" | "table"; level?: number; items: string[] }[] = [];

  for (const line of lines) {
    if (/^\s*\|.*\|\s*$/.test(line) || /^\s*\|?\s*-{3,}/.test(line)) continue;
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({ type: "h", level: heading[1].length, items: [heading[2]] });
      continue;
    }
    const li = /^\s*[-*]\s+(.*)$/.exec(line) || /^\s*\d+\.\s+(.*)$/.exec(line);
    if (li) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "li") last.items.push(li[1]);
      else blocks.push({ type: "li", items: [li[1]] });
      continue;
    }
    if (!line.trim()) continue;
    const last = blocks[blocks.length - 1];
    if (last?.type === "p") last.items[0] += ` ${line.trim()}`;
    else blocks.push({ type: "p", items: [line.trim()] });
  }

  return (
    <div className="space-y-3 text-sm">
      {blocks.map((b, i) => {
        if (b.type === "h") {
          const cls =
            b.level === 1
              ? "font-display text-lg tracking-tight"
              : "text-sm font-medium tracking-tight";
          return (
            <h3 key={i} className={cls}>
              {inline(b.items[0])}
            </h3>
          );
        }
        if (b.type === "li") {
          return (
            <ul key={i} className="list-disc space-y-1 pl-4 text-muted-foreground">
              {b.items.map((item, j) => (
                <li key={j} className="text-foreground/90">
                  {inline(item)}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-foreground/90">
            {inline(b.items[0])}
          </p>
        );
      })}
    </div>
  );
}
