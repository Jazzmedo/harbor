import type { ComponentProps } from "react";
import { GifRecordPill } from "@/components/player/gif-record-pill";
import { QuickTools } from "@/components/player/quick-tools";
import type { PlayEpisode } from "@/lib/view";
import { SkipPillContainer } from "./skip-pill-container";
import type { useGifRecorder } from "./hooks/use-gif-recorder";

type SkipProps = ComponentProps<typeof SkipPillContainer>;
type QuickToolsProps = ComponentProps<typeof QuickTools>;

export function ToolsLayer({
  pipMode,
  drawMode,
  showWaiting,
  pendingResumeSec,
  pendingSeekSec,
  skipSegments,
  durationSec,
  hasNextEpisode,
  hasNextEpDisplay,
  nextEp,
  nextEpMask,
  pillsVisible,
  allowAutoSkip,
  onSkip,
  onNextEpisode,
  onCancelAutoNext,
  showChrome,
  ab,
  frameGrabToast,
  gif,
}: {
  pipMode: boolean;
  drawMode: boolean;
  showWaiting: boolean;
  pendingResumeSec: number | null;
  pendingSeekSec: number | null;
  skipSegments: SkipProps["skipSegments"];
  durationSec: number;
  hasNextEpisode: boolean;
  hasNextEpDisplay: boolean;
  nextEp: PlayEpisode | null;
  nextEpMask: SkipProps["nextEpMask"];
  pillsVisible: boolean;
  allowAutoSkip: boolean;
  onSkip: (sec: number) => void;
  onNextEpisode: () => void;
  onCancelAutoNext: () => void;
  showChrome: boolean;
  ab: QuickToolsProps["ab"];
  frameGrabToast: QuickToolsProps["toast"];
  gif: ReturnType<typeof useGifRecorder>;
}) {
  return (
    <>
      {!pipMode && !drawMode && !showWaiting && pendingResumeSec == null && pendingSeekSec == null && (
        <SkipPillContainer
          skipSegments={skipSegments}
          durationSec={durationSec}
          hasNextEpisode={hasNextEpisode}
          hasNextEpDisplay={hasNextEpDisplay}
          nextEp={nextEp}
          nextEpMask={nextEpMask}
          visible={pillsVisible}
          allowAutoSkip={allowAutoSkip}
          onSkip={onSkip}
          onNextEpisode={onNextEpisode}
          onCancelAutoNext={onCancelAutoNext}
        />
      )}

      {!pipMode && !drawMode && (
        <QuickTools
          visible={showChrome}
          ab={ab}
          toast={frameGrabToast}
          gifToast={gif.toast}
        />
      )}
      {!pipMode && !drawMode && (
        <GifRecordPill
          state={gif.state}
          elapsedSec={gif.elapsedSec}
          onStop={gif.stop}
          onAbort={gif.abort}
        />
      )}
    </>
  );
}
