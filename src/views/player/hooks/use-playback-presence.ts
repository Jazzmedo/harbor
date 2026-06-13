import { useEffect } from "react";
import { setPlaybackPresence } from "@/lib/discord/presence";
import { getPlaybackPosition } from "@/lib/player/playback-clock";
import type { PlayerSnapshot } from "@/lib/player/bridge";
import type { PlayerSrc } from "@/lib/view";

export function usePlaybackPresence(params: {
  src: PlayerSrc;
  snap: PlayerSnapshot;
  season: number | undefined;
  episode: number | undefined;
  liveGuideOpen: boolean;
}) {
  const { src, snap, season, episode, liveGuideOpen } = params;

  useEffect(() => {
    if (snap.status !== "playing" && snap.status !== "paused") {
      setPlaybackPresence(null);
      return;
    }
    if (src.meta.id?.startsWith("iptv:")) return;
    const year =
      typeof src.meta.releaseInfo === "string" ? src.meta.releaseInfo.slice(0, 4) : undefined;
    const epLabel = season != null && episode != null ? `S${season} E${episode}` : undefined;
    setPlaybackPresence({
      title: src.meta.name ?? "Untitled",
      subtitle: epLabel || year,
      posterUrl: src.meta.poster ?? undefined,
      year,
      paused: snap.status === "paused",
      positionSec: getPlaybackPosition(),
      durationSec: snap.durationSec,
    });
  }, [
    snap.status,
    snap.durationSec,
    src.meta.id,
    src.meta.name,
    src.meta.poster,
    src.meta.releaseInfo,
    src.liveProgram,
    season,
    episode,
  ]);

  useEffect(() => {
    if (!(src.meta.id?.startsWith("iptv:") ?? false)) return;
    if (snap.status !== "playing" && snap.status !== "paused") {
      setPlaybackPresence(null);
      return;
    }
    if (liveGuideOpen) {
      setPlaybackPresence({
        title: "Browsing the TV guide",
        subtitle: "Live TV",
        paused: false,
        positionSec: 0,
        durationSec: 0,
      });
      return;
    }
    const lead = src.liveProgram || src.meta.name || "Live TV";
    setPlaybackPresence({
      title: `Live · ${lead}`,
      subtitle: src.liveProgram ? src.meta.name : undefined,
      posterUrl: src.meta.poster ?? undefined,
      paused: snap.status === "paused",
      positionSec: 0,
      durationSec: 0,
    });
  }, [
    liveGuideOpen,
    snap.status,
    src.meta.id,
    src.meta.name,
    src.meta.poster,
    src.liveProgram,
  ]);

  useEffect(() => () => setPlaybackPresence(null), []);
}
