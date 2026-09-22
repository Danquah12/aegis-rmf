const TTL_MS = 5 * 60_000;
const store = new Map<string, { at: number; value: unknown }>();
const inflight = new Map<string, Promise<unknown>>();

export function cachedScan<T>(key: string, load: () => Promise<T>, ttl = TTL_MS): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttl) return Promise.resolve(hit.value as T);
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;
  const run = load()
    .then((value) => {
      store.set(key, { at: Date.now(), value });
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, run);
  return run;
}

export async function getTextFast(url: string, ms = 2500): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { accept: "text/html,application/javascript,*/*" },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function firstMatchingScript(
  pageUrl: string,
  origin: string,
  test: (js: string) => boolean,
): Promise<{ js: string; src: string } | null> {
  const html = await getTextFast(pageUrl);
  if (!html) return null;
  const scripts = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+\.js)"/g)].map((m) => m[1]!);
  const bodies = await Promise.all(
    scripts.map(async (src) => {
      const js = await getTextFast(`${origin}${src}`);
      return js ? { js, src } : null;
    }),
  );
  return bodies.find((b) => b && test(b.js)) ?? null;
}
