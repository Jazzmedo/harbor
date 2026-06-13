import { useEffect } from "react";
import { isBundledEngineUrl } from "@/lib/stremio-server";
import { setTrickplayState, trickplaySetUrl, trickplaySpawnEager, trickplayStop } from "@/lib/trickplay";
import type { PlayerSrc } from "@/lib/view";

export function useTrickplay({ src, enabled }: { src: PlayerSrc; enabled: boolean }) {
  useEffect(() => {
    const url = src.url;
    if (!enabled || !url) {
      setTrickplayState({ active: false, bufferedOnly: false });
      return;
    }
    const isTorrent = isBundledEngineUrl(url);
    setTrickplayState({ active: true, bufferedOnly: isTorrent });
    let alive = true;
    void trickplaySetUrl(url).then(() => {
      if (!alive) return;
      void trickplaySpawnEager();
    });
    return () => {
      alive = false;
      setTrickplayState({ active: false, bufferedOnly: false });
      void trickplayStop();
    };
  }, [src.url, enabled]);
}
