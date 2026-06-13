import { useEffect, useState } from "react";
import { meta as fetchMeta } from "@/lib/cinemeta";
import type { LibraryItem } from "@/lib/stremio";

const TTL = 6 * 60 * 60 * 1000;
const cache = new Map<string, { value: boolean; t: number }>();
const inflight = new Map<string, Promise<boolean>>();

async function compute(id: string, lastWatchedMs: number): Promise<boolean> {
  const m = await fetchMeta("series", id).catch(() => null);
  const vids = m?.videos ?? [];
  const now = Date.now();
  for (const v of vids) {
    const raw = v.released ?? v.firstAired;
    const rel = raw ? Date.parse(raw) : NaN;
    if (!Number.isFinite(rel)) continue;
    if (rel <= now && rel > lastWatchedMs) return true;
  }
  return false;
}

export function hasNewEpisode(item: LibraryItem): Promise<boolean> {
  if (!item._id.startsWith("tt") || item.type !== "series") return Promise.resolve(false);
  const lastWatched = Date.parse(item.state?.lastWatched ?? item._mtime ?? "");
  if (!Number.isFinite(lastWatched)) return Promise.resolve(false);
  const key = `${item._id}|${Math.floor(lastWatched / 60_000)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < TTL) return Promise.resolve(hit.value);
  const pending = inflight.get(key);
  if (pending) return pending;
  const p = compute(item._id, lastWatched)
    .then((value) => {
      cache.set(key, { value, t: Date.now() });
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, p);
  return p;
}

export function useHasNewEpisode(item: LibraryItem): boolean {
  const [fresh, setFresh] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setFresh(false);
    void hasNewEpisode(item).then((v) => {
      if (!cancelled) setFresh(v);
    });
    return () => {
      cancelled = true;
    };
  }, [item._id, item.state?.lastWatched, item._mtime]);
  return fresh;
}
