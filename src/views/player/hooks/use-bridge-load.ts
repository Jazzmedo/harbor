import { useEffect, useRef, useState, type RefObject } from "react";
import type { PlayerBridge } from "@/lib/player/bridge";
import { readResumeMs, saveResumeMs } from "@/lib/resume";
import { episodeFromVideoId, libraryGetOne } from "@/lib/stremio";
import type { PlayerSrc } from "@/lib/view";

const RESUME_PROMPT_MIN_SEC = 30;

export function useBridgeLoad(params: {
  bridgeRef: RefObject<PlayerBridge | null>;
  inRoomRef: RefObject<boolean>;
  isHostRef: RefObject<boolean>;
  bridgeReady: boolean;
  bridgeKey: string;
  src: PlayerSrc;
  transcodedUrl: string | null;
  season: number | undefined;
  episode: number | undefined;
  authKey: string | null;
}): {
  pendingResumeSec: number | null;
  acknowledgeResume: (action: "resume" | "start-over") => void;
  pendingSeekSec: number | null;
  clearPendingSeek: () => void;
} {
  const {
    bridgeRef,
    inRoomRef,
    isHostRef,
    bridgeReady,
    bridgeKey,
    src,
    transcodedUrl,
    season,
    episode,
    authKey,
  } = params;

  const lastLoadedUrlRef = useRef<string | null>(null);
  const firstLoadRef = useRef(true);
  const [pendingResumeSec, setPendingResumeSec] = useState<number | null>(null);
  const [pendingSeekSec, setPendingSeekSec] = useState<number | null>(null);
  const ackRef = useRef<((action: "resume" | "start-over") => void) | null>(null);

  useEffect(() => {
    if (!bridgeReady) return;
    const bridge = bridgeRef.current;
    if (!bridge) return;
    const playUrl = transcodedUrl ?? src.url;
    if (lastLoadedUrlRef.current === playUrl) return;
    lastLoadedUrlRef.current = playUrl;
    const isFirstLoad = firstLoadRef.current;
    firstLoadRef.current = false;
    const isAutoRetry = (src.attempt ?? 0) > 0;
    const isLive = src.meta.id?.startsWith("iptv:") ?? false;
    let cancelled = false;
    (async () => {
      const resolved = isLive
        ? { ms: 0, fromRemote: false }
        : await resolveStartMs(
            src.meta.id,
            season,
            episode,
            authKey,
            src.imdbId ?? null,
            src.imdbIdVerified === true,
          );
      const startMs = resolved.ms;
      const startSec = startMs / 1000;
      const guestInRoom = inRoomRef.current && !isHostRef.current;
      const eligibleForPrompt =
        isFirstLoad &&
        !isAutoRetry &&
        !isLive &&
        !resolved.fromRemote &&
        startSec > RESUME_PROMPT_MIN_SEC &&
        !guestInRoom;
      try {
        await bridge.load({
          url: playUrl,
          subtitles: src.subtitles,
          notWebReady: src.notWebReady,
        });
      } catch (e) {
        if (cancelled) return;
        console.warn("[player] load failed", e);
        return;
      }
      if (cancelled) return;
      if (eligibleForPrompt) {
        bridge.pause();
        setPendingResumeSec(startSec);
        ackRef.current = (action) => {
          ackRef.current = null;
          setPendingResumeSec(null);
          if (action === "resume") {
            setPendingSeekSec(startSec);
          } else {
            setPendingSeekSec(0);
          }
        };
        return;
      }
      if (!guestInRoom && !isLive && startSec > 5) {
        bridge.pause();
        setPendingSeekSec(startSec);
        return;
      }
      if (!inRoomRef.current) {
        bridge.play().catch(() => {});
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bridgeReady, bridgeKey, src.url, src.notWebReady, src.meta.id, src.subtitles, season, episode, transcodedUrl, authKey]);

  useEffect(() => {
    lastLoadedUrlRef.current = null;
  }, [bridgeKey]);

  const acknowledgeResume = (action: "resume" | "start-over") => {
    ackRef.current?.(action);
  };

  const clearPendingSeek = () => setPendingSeekSec(null);

  return { pendingResumeSec, acknowledgeResume, pendingSeekSec, clearPendingSeek };
}

async function resolveStartMs(
  metaId: string,
  season: number | undefined,
  episode: number | undefined,
  authKey: string | null,
  imdbId: string | null,
  imdbVerified: boolean,
): Promise<{ ms: number; fromRemote: boolean }> {
  const local = readResumeMs(metaId, season, episode);
  if (!authKey) return { ms: local, fromRemote: false };
  const matchesEpisode = (
    item: { state?: { season?: number; episode?: number; video_id?: string } } | null,
  ) => {
    if (!item) return false;
    if (typeof season !== "number" || typeof episode !== "number") return true;
    const fromVid = episodeFromVideoId(item.state?.video_id);
    const se = item.state?.season ?? fromVid?.season;
    const ep = item.state?.episode ?? fromVid?.episode;
    return se === season && ep === episode;
  };
  const lookups: string[] = [];
  if (metaId.startsWith("tt")) lookups.push(metaId);
  else if (imdbVerified && imdbId?.startsWith("tt")) lookups.push(imdbId, metaId);
  else lookups.push(metaId);
  for (const lookupId of lookups) {
    const remote = await libraryGetOne(authKey, lookupId).catch(() => null);
    if (!remote || !matchesEpisode(remote)) continue;
    const remoteMs = remote.state?.timeOffset ?? 0;
    if (remoteMs <= 0) continue;
    if (remoteMs >= local) {
      if (remoteMs > local) saveResumeMs(metaId, remoteMs, season, episode);
      return { ms: remoteMs, fromRemote: true };
    }
    break;
  }
  return { ms: local, fromRemote: false };
}
