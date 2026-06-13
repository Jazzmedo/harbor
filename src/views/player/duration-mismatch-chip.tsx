import { X } from "lucide-react";
import { useState } from "react";
import type { SourceDescriptor } from "@/lib/together/protocol";
import { formatRuntime } from "@/lib/together/source-descriptor";
import { DURATION_MISMATCH_S } from "./player-utils";

export function DurationMismatchChip(props: {
  hostSource: SourceDescriptor | null;
  guestDurationSec: number;
  casting: boolean;
  currentUrl: string;
  switcherOpen: boolean;
  onFindCloser: () => void;
}) {
  const { hostSource, guestDurationSec, casting, currentUrl, switcherOpen, onFindCloser } = props;
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  const hostDuration = hostSource?.durationSec ?? 0;
  const mismatch =
    !casting &&
    hostDuration > 0 &&
    guestDurationSec > 0 &&
    Math.abs(guestDurationSec - hostDuration) > DURATION_MISMATCH_S;
  if (!mismatch || switcherOpen) return null;

  const pairKey = `${hostSource?.infoHash ?? hostDuration}|${currentUrl}`;
  if (dismissedKey === pairKey) return null;

  return (
    <div className="pointer-events-auto absolute bottom-24 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-edge-soft bg-elevated/95 py-2 pl-4 pr-2 text-[12.5px] text-ink shadow-[0_18px_44px_-14px_rgba(0,0,0,0.7)] backdrop-blur-md">
      <span className="whitespace-nowrap">
        Your copy runs {formatRuntime(guestDurationSec)}, host's runs {formatRuntime(hostDuration)}. Sync may drift.
      </span>
      <button
        type="button"
        onClick={onFindCloser}
        className="whitespace-nowrap rounded-full px-2.5 py-1 font-semibold text-accent transition-colors hover:bg-accent/15"
      >
        Find closer match
      </button>
      <button
        type="button"
        onClick={() => setDismissedKey(pairKey)}
        aria-label="Dismiss"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-raised hover:text-ink"
      >
        <X size={13} strokeWidth={2.2} />
      </button>
    </div>
  );
}
