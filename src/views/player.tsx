import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { activeLayout } from "@/lib/theme";
import { DrawCanvas, StrokesLayer } from "@/components/player/draw-canvas";
import { StreamSwitcher } from "@/components/player/stream-switcher";
import { type PlayerBridge } from "@/lib/player/bridge";
import { useDebridClients } from "@/lib/debrid/registry";
import { useSettings } from "@/lib/settings";
import { nameColor } from "@/lib/together/colors";
import { useTogether } from "@/lib/together/provider";
import { buildPlayInvite } from "@/lib/together/build-invite";
import { useView, type PlayerSrc, type PlayEpisode } from "@/lib/view";
import { useSkipSegments } from "@/lib/skip-intro";
import { StreamCheckPill } from "@/components/player/stream-check-pill";
import { isLocalUrl } from "@/lib/player/local-url";
import { useAuth } from "@/lib/auth";
import { CastLayer } from "./player/cast-layer";
import { DragClickStage } from "./player/drag-click-stage";
import { LiveLayer } from "./player/live-layer";
import { LoaderLayer } from "./player/loader-layer";
import { PanelsLayer } from "./player/panels-layer";
import { RoomLayer } from "./player/room-layer";
import { ShellLayer } from "./player/shell-layer";
import { StageOverlays } from "./player/stage-overlays";
import { ToolsLayer } from "./player/tools-layer";
import { embedFlags } from "./player/player-utils";
import { useFullscreen } from "./player/hooks/use-fullscreen";
import { usePlayerCast } from "./player/hooks/use-player-cast";
import { useCastReturnPublish } from "./player/hooks/use-cast-return-publish";
import { useChromeConfig } from "./player/hooks/use-chrome-config";
import { useEverPlayed } from "./player/hooks/use-ever-played";
import { useDrawMode } from "./player/hooks/use-draw-mode";
import { useChromeVisibility } from "./player/hooks/use-chrome-visibility";
import { useAutoRetry } from "./player/hooks/use-auto-retry";
import { useEngineStats } from "./player/hooks/use-engine-stats";
import { isBundledEngineUrl, isLocalEngineUrl } from "@/lib/stremio-server";
import { usePauseOnInactive } from "./player/hooks/use-pause-on-inactive";
import { spoilerMaskFor } from "@/lib/spoilers";
import { usePlayerWatched } from "./player/hooks/use-player-watched";
import { useRoomSync } from "./player/hooks/use-room-sync";
import { useHostSource } from "./player/hooks/use-host-source";
import { useLobbyGate } from "./player/hooks/use-lobby-gate";
import { hostSourceMatchesMedia } from "@/lib/together/room-derive";
import { useLiveChannelOverlay } from "./player/hooks/use-live-channel-overlay";
import { useStreamSwitcher } from "./player/hooks/use-stream-switcher";
import { useMpvEmbed } from "./player/hooks/use-mpv-embed";
import { usePlayerBridge } from "./player/hooks/use-player-bridge";
import { useEpisodeNavigation } from "./player/hooks/use-episode-navigation";
import { useAbLoop } from "./player/hooks/use-ab-loop";
import { useAutoNextEpisode } from "./player/hooks/use-auto-next-episode";
import { useFrameGrab } from "./player/hooks/use-frame-grab";
import { useGifRecorder } from "./player/hooks/use-gif-recorder";
import { useSleepTimer } from "./player/hooks/use-sleep-timer";
import { useAutoEndExit } from "./player/hooks/use-auto-end-exit";
import { usePipMode } from "./player/hooks/use-pip-mode";
import { usePlaybackControls } from "./player/hooks/use-playback-controls";
import { usePlaybackPresence } from "./player/hooks/use-playback-presence";
import { usePlayerExit } from "./player/hooks/use-player-exit";
import { usePendingSeekApply } from "./player/hooks/use-pending-seek-apply";
import { usePlayerHotkeys } from "./player/hooks/use-player-hotkeys";
import { usePlayerMedia } from "./player/hooks/use-player-media";
import { useStreamPill } from "./player/hooks/use-stream-pill";
import { useStubDetection } from "./player/hooks/use-stub-detection";
import { useBridgeLoad } from "./player/hooks/use-bridge-load";
import { useVideoFill } from "./player/hooks/use-video-fill";
import { setSkipSegmentsView } from "@/lib/skip-intro/segment-store";

export function PlayerView({ src }: { src: PlayerSrc }) {
  const { setChromeHidden, topPath, openPicker, exitPlayback, replacePlayerSrc } = useView();
  const { settings, update } = useSettings();
  const chromeTheme = activeLayout(settings.theme) === "stremio" ? "stremio" : "default";
  const {
    avatarsCorner,
    chatCorner,
    episodesCorner,
    avatarsHidden,
    chatHidden,
    episodesHidden,
  } = useChromeConfig(chromeTheme);
  const { authKey } = useAuth();
  const debrids = useDebridClients();
  const {
    snapshot: roomSnapshot,
    publishState,
    sendCommand,
    onIncomingCommand,
    suppressOutgoingFor,
    onIncomingState,
    clientId,
    markReady,
    notifyHostLeaving,
    clearInvite,
    sendInvite,
    claimHost,
    chat,
    sendChat,
    sendDraw,
    onIncomingDraw,
    presenceMap,
    participantLocations,
    startRoom,
    hostSource,
  } = useTogether();
  const stageRef = useRef<HTMLDivElement>(null);
  const videoMountRef = useRef<HTMLDivElement>(null);
  const bridgeRef = useRef<PlayerBridge | null>(null);
  const selfFrameReadyRef = useRef(false);
  const { fullscreen, toggleFullscreen } = useFullscreen(stageRef);
  const { snap, engine, bridgeReady, bridgeKey } = usePlayerBridge({
    bridgeRef,
    videoMountRef,
    src,
    settings,
  });
  const isP2pEngine =
    (isBundledEngineUrl(src.url) || isLocalEngineUrl(src.url)) &&
    !src.url.includes("/hlsv2/") &&
    !!src.streamRef?.infoHash;
  const { stats: engineStats, genuineFailure } = useEngineStats({
    url: src.url,
    infoHash: src.streamRef?.infoHash ?? null,
    fileIdx: src.streamRef?.fileIdx ?? null,
    active: snap.status !== "ended" && snap.videoWidth <= 0,
  });
  const shellSnapRef = useRef(snap);
  const snapRef = useRef(snap);
  snapRef.current = snap;
  const [foreignNotice, setForeignNotice] = useState<{ title: string | null; from: string } | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const cast = usePlayerCast({ src, debrids, snapRef, bridgeRef });
  const [now, setNow] = useState(() => Date.now());
  const { pipMode, togglePipMode, exitPip } = usePipMode({ bridgeRef, setChromeHidden });
  const { slowLoad, transcodedUrl } = useAutoRetry({
    bridgeRef,
    src,
    snap,
    stremioServerTranscode: settings.stremioServerTranscode,
    instantPlay: settings.instantPlay,
    inRoom: roomSnapshot.state === "joined",
    debrids,
    selfFrameReadyRef,
    openPicker,
    engineFailure: genuineFailure,
    isP2pEngine,
    engineStats,
  });

  useEffect(() => {
    if (roomSnapshot.state !== "joined") return;
    const id = window.setInterval(() => setNow(Date.now()), 6000);
    return () => window.clearInterval(id);
  }, [roomSnapshot.state]);

  const season = src.episode?.season;
  const episode = src.episode?.episode;
  const inRoom = roomSnapshot.state === "joined" && roomSnapshot.participants.length >= 2;
  const isHost = inRoom && roomSnapshot.hostClientId === clientId;
  const canControl = !inRoom || hasStarted;
  const guestPickRef = useRef(settings.togetherGuestsPick);
  guestPickRef.current = settings.togetherGuestsPick;

  usePauseOnInactive({ bridgeRef, snapRef });

  const showWaiting = inRoom && !hasStarted;
  const selfName = useMemo(
    () => roomSnapshot.participants.find((p) => p.id === clientId)?.name ?? "You",
    [roomSnapshot.participants, clientId],
  );
  const selfColor = settings.harborColor || nameColor(selfName);
  const playing = snap.status === "playing";

  const {
    drawMode,
    setDrawMode,
    hideOthersDrawings,
    setHideOthersDrawings,
    strokes,
    onDrawStart,
    onDrawPoint,
    onDrawEnd,
  } = useDrawMode({
    inRoom,
    participantCount: roomSnapshot.participants.length,
    clientId,
    topPath,
    onIncomingDraw,
    sendDraw,
  });

  const { chromeVisible, wakeChrome, setAnyMenuOpen, cursorStyle } = useChromeVisibility({
    playing,
    drawMode,
    pipMode,
    setChromeHidden,
  });

  const { adjacent, swappingEp, goToEpisode } = useEpisodeNavigation({
    src,
    settings,
    debrids,
    authKey,
    inRoom,
    isHost,
    sendInvite,
    claimHost,
    replacePlayerSrc,
    openPicker,
  });

  const canChangeEpisode = src.meta.type === "series" && (!inRoom || isHost);
  const roomGuest = inRoom && !isHost;
  const broadcastEpisode = useCallback(
    (ep: PlayEpisode) => {
      if (!inRoom || !isHost) return;
      claimHost(true);
      sendInvite(buildPlayInvite(src.meta, ep));
    },
    [inRoom, isHost, claimHost, sendInvite, src.meta],
  );

  const [autoNextCancelled, setAutoNextCancelled] = useState(false);
  useEffect(() => {
    setAutoNextCancelled(false);
  }, [src.url]);

  useAutoNextEpisode({
    src,
    snap,
    nextEp: adjacent.next,
    canChangeEpisode,
    cancelled: autoNextCancelled,
    goToEpisode,
  });

  const quickToolsEnabled = !inRoom || isHost;
  const ab = useAbLoop({
    bridgeRef,
    durationSec: snap.durationSec,
    enabled: quickToolsEnabled,
    resetKey: src.url,
  });
  const sleep = useSleepTimer({
    bridgeRef,
    status: snap.status,
    durationSec: snap.durationSec,
    srcUrl: src.url,
  });
  const frameGrab = useFrameGrab({
    bridgeRef,
    src,
  });
  const gif = useGifRecorder({ src });

  const { resolvedImdbId, subAssNative, captureExitSnapshot, download, subDropToast } = usePlayerMedia({
    src,
    snap,
    engine,
    settings,
    authKey,
    bridgeRef,
    bridgeReady,
    bridgeKey,
    videoMountRef,
    toggleFullscreen,
    castActiveRef: cast.castActiveRef,
    season,
    episode,
  });

  const {
    streamCheckOpen,
    setStreamCheckOpen,
    switcherOpen,
    setSwitcherOpen,
    swapResolvingKey,
    liveUrl,
    liveStreamRef,
    pickAnother,
    onSwitchStream,
  } = useStreamSwitcher({
    bridgeRef,
    src,
    snap,
    debrids,
  });
  const { hostSourceRef } = useHostSource({
    inRoom,
    isHost,
    hasStarted,
    src,
    liveUrl,
    liveStreamRef,
    snap,
    guestPickRef,
    publishState,
  });
  const guestHostSource =
    inRoom && !isHost && hostSourceMatchesMedia(hostSource, src.meta.id, src.episode ?? null)
      ? hostSource!.descriptor
      : null;
  const liveOverlay = useLiveChannelOverlay({
    src,
    replacePlayerSrc,
  });

  usePlaybackPresence({ src, snap, season, episode, liveGuideOpen: liveOverlay.open });
  useCastReturnPublish({
    casting: !!cast.castDevice,
    inRoom,
    isHost,
    src,
    snapRef,
    hostSourceRef,
    guestPickRef,
    publishState,
  });

  const { closePlayer, onStubEject } = usePlayerExit({
    src,
    season,
    episode,
    bridgeRef,
    liveUrl,
    liveStreamRef,
    inRoom,
    isHost,
    instantPlay: settings.instantPlay,
    captureExitSnapshot,
    exitPip,
    castActiveRef: cast.castActiveRef,
    stopCast: cast.stopCast,
    publishState,
    notifyHostLeaving,
    clearInvite,
    exitPlayback,
    openPicker,
  });

  const [dvrOpen, setDvrOpen] = useState(false);
  const pickAnotherOrGuide = useCallback(() => {
    if (liveOverlay.isLive) {
      liveOverlay.setOpen(true);
    } else {
      pickAnother();
    }
  }, [liveOverlay, pickAnother]);

  const [episodePanelOpen, setEpisodePanelOpen] = useState(false);
  const { watchedFor } = usePlayerWatched({
    meta: src.meta,
    authKey,
    imdbId: resolvedImdbId,
    enabled: !!src.episode && (episodePanelOpen || !!adjacent.next),
  });
  const nextEpMask = spoilerMaskFor(settings, {
    watched: adjacent.next ? watchedFor(adjacent.next) : true,
    isNextUp: true,
  });
  const isSeriesPlayback = !!src.episode && src.meta.type === "series";

  const showHeaderWarning =
    src.notWebReady === true && engine === "html5" && (snap.status === "error" || snap.status === "loading");
  const [noAudioDismissed, setNoAudioDismissed] = useState(false);
  useEffect(() => {
    setNoAudioDismissed(false);
  }, [src.url]);
  const showNoAudioWarning =
    engine === "html5" &&
    snap.noAudio === true &&
    !noAudioDismissed &&
    !liveOverlay.isLive &&
    settings.playerEngine !== "auto";

  const { inRoomRef, isHostRef, initialSyncDoneRef } = useRoomSync({
    inRoom,
    isHost,
    hasStarted,
    setHasStarted,
    selfFrameReadyRef,
    roomSnapshot,
    clientId,
    src,
    snap,
    bridgeRef,
    hostSourceRef,
    guestPickRef,
    publishState,
    onIncomingState,
    onIncomingCommand,
    markReady,
    suppressOutgoingFor,
    setForeignNotice,
    cast: cast.sync,
  });

  const lobby = useLobbyGate({
    inRoom,
    isHost,
    hasStarted,
    setHasStarted,
    roomSnapshot,
    startRoom,
    suppressOutgoingFor,
    bridgeRef,
    initialSyncDoneRef,
    mediaKey: `${src.meta.id}|${src.episode?.season ?? ""}|${src.episode?.episode ?? ""}`,
  });

  const { rememberSubChoice, cycleSubtitles, playPauseToggle, seekStep, seekTo } = usePlaybackControls({
    bridgeRef,
    snapRef,
    metaId: src.meta.id,
    inRoom,
    isHost,
    hasStarted,
    canControl,
    castDevice: cast.castDevice,
    startHost: lobby.startHost,
    togglePlayCast: cast.togglePlayCast,
    seekCast: cast.seekCast,
    sendCommand,
  });

  const videoFill = useVideoFill(bridgeRef, src.url);
  const { holdSpeedActive, showStats } = usePlayerHotkeys({
    bridgeRef,
    snap,
    metaId: src.meta.id,
    drawMode,
    setDrawMode,
    closePlayer,
    playPauseToggle,
    seekStep,
    seekTo,
    toggleFullscreen,
    cycleSubtitles,
    canChangeEpisode,
    adjacent,
    goToEpisode,
    toggleSwitcher: () => setSwitcherOpen((v) => !v),
    toggleEpisodePanel: () => setEpisodePanelOpen((v) => !v),
    liveOverlay,
    toggleDvr: () => setDvrOpen((v) => !v),
    sleep,
    quickToolsEnabled,
    frameGrab,
    gif,
    videoFill,
  });

  const { pendingResumeSec, acknowledgeResume, pendingSeekSec, clearPendingSeek } = useBridgeLoad({
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
  });

  usePendingSeekApply({
    pendingSeekSec,
    clearPendingSeek,
    durationSec: snap.durationSec,
    bridgeRef,
    inRoomRef,
  });

  useStubDetection({ src, snap, onStub: onStubEject });

  useAutoEndExit({
    src,
    snap,
    nextEp: adjacent.next,
    canChangeEpisode,
    roomGuest,
    closePlayer,
  });

  const isLocalSrc = isLocalUrl(src.url);
  const streamPillVariant = useStreamPill({
    srcUrl: src.url,
    snap,
    pipMode,
    showWaiting,
    isLocalSrc,
    slowLoad,
    inRoom,
    streamCheckOpen,
  });

  const skipSegments = useSkipSegments(src.meta, src.episode, snap.chapters, snap.durationSec);
  useEffect(() => {
    setSkipSegmentsView(skipSegments);
    return () => setSkipSegmentsView([]);
  }, [skipSegments]);
  const hasNextEpisodeNow = canChangeEpisode && !!adjacent.next;

  useMpvEmbed({ engine, settings });

  const { mpvEmbedWindowsActive, stageBg } = embedFlags(
    engine,
    settings.playerMpvEmbed,
    snap.videoWidth,
    snap.videoHeight,
  );
  const { loaderActive } = useEverPlayed({
    url: src.url,
    status: snap.status,
    durationSec: snap.durationSec,
    swappingEp,
    swapResolvingKey,
  });
  const [loaderShowing, setLoaderShowing] = useState(false);
  const showChrome = !loaderActive && !loaderShowing && (chromeVisible || drawMode);
  const liveShellSnap = cast.castDevice
    ? { ...snap, status: (cast.castPlaying ? "playing" : "paused") as typeof snap.status }
    : snap;
  if (showChrome) shellSnapRef.current = liveShellSnap;
  const shellSnap = showChrome ? liveShellSnap : shellSnapRef.current;
  return (
    <main
      ref={stageRef}
      data-harbor-player
      className={`fixed inset-0 z-[100] overflow-hidden ${stageBg}`}
      style={cursorStyle}
      onMouseMove={wakeChrome}
      onMouseEnter={wakeChrome}
    >
      <div
        ref={videoMountRef}
        className="absolute inset-0"
        onClick={(e) => {
          if (e.target !== e.currentTarget) return;
          if (drawMode || pipMode) return;
          playPauseToggle();
        }}
      />
      <StageOverlays
        snap={snap}
        engine={engine}
        pipMode={pipMode}
        subShowInPip={settings.subShowInPip}
        subAssNative={subAssNative}
        showStats={showStats}
        holdSpeedActive={holdSpeedActive}
        videoFillPill={videoFill.pill}
        subDropToast={subDropToast}
      />
      <CastLayer cast={cast} src={src} durationSec={snap.durationSec} onPickAnother={pickAnother} />
      <DragClickStage
        drawMode={drawMode}
        pipMode={pipMode}
        onClick={playPauseToggle}
        onDoubleClick={toggleFullscreen}
      />

      <LoaderLayer
        src={src}
        snap={snap}
        isLocalSrc={isLocalSrc}
        forceShow={swappingEp || swapResolvingKey != null}
        onCancel={closePlayer}
        engineStats={engineStats}
        onShowingChange={setLoaderShowing}
        onRetry={() => {
          const b = bridgeRef.current;
          if (b) {
            void b.load({ url: src.url, subtitles: src.subtitles, notWebReady: src.notWebReady });
          }
        }}
      />

      {!pipMode && !cast.castDevice && (
        <StrokesLayer strokes={strokes} hideOthers={hideOthersDrawings} selfId={clientId} />
      )}
      {drawMode && !pipMode && !cast.castDevice && bridgeRef.current && (
        <DrawCanvas
          enabled={drawMode}
          selfId={clientId}
          selfName={selfName}
          selfColor={selfColor}
          hideOthers={hideOthersDrawings}
          strokes={strokes}
          onStrokeStart={onDrawStart}
          onStrokePoint={onDrawPoint}
          onStrokeEnd={onDrawEnd}
        />
      )}

      <ToolsLayer
        pipMode={pipMode}
        drawMode={drawMode}
        showWaiting={showWaiting}
        pendingResumeSec={pendingResumeSec}
        pendingSeekSec={pendingSeekSec}
        skipSegments={skipSegments}
        durationSec={snap.durationSec}
        hasNextEpisode={hasNextEpisodeNow}
        hasNextEpDisplay={canChangeEpisode && !autoNextCancelled && !!adjacent.next}
        nextEp={canChangeEpisode && !autoNextCancelled ? adjacent.next : null}
        nextEpMask={nextEpMask}
        pillsVisible={hasStarted || !inRoom}
        allowAutoSkip={!roomGuest}
        onSkip={seekTo}
        onNextEpisode={() => goToEpisode(adjacent.next)}
        onCancelAutoNext={() => setAutoNextCancelled(true)}
        showChrome={showChrome}
        ab={ab}
        frameGrabToast={frameGrab.toast}
        gif={gif}
      />

      {!loaderActive && (
        <ShellLayer
          shellId={settings.playerShellId}
          shellSnap={shellSnap}
          snapRef={snapRef}
          bridgeRef={bridgeRef}
          engine={engine}
          visible={showChrome}
          fullscreen={fullscreen}
          drawMode={drawMode}
          hideOthersDrawings={hideOthersDrawings}
          pipMode={pipMode}
          showDraw={inRoom && roomSnapshot.participants.length > 1 && !cast.castDevice}
          metaId={src.meta.id}
          onMenuOpenChange={setAnyMenuOpen}
          onBack={closePlayer}
          onPlayPause={playPauseToggle}
          onSeek={seekTo}
          onSeekStep={seekStep}
          rememberSubChoice={rememberSubChoice}
          onPiP={() => togglePipMode()}
          onFullscreen={toggleFullscreen}
          openCastMenu={cast.openCastMenu}
          onToggleDraw={() => {
            setDrawMode((d) => !d);
            wakeChrome();
          }}
          onToggleHideOthers={() => setHideOthersDrawings((h) => !h)}
          onPickAnother={pickAnotherOrGuide}
          canPickAnother={!liveOverlay.isLive || !inRoom || isHost}
          title={src.title}
          subtitle={src.subtitle}
          hoverTitle={src.meta.name}
          hoverSub={
            src.episode
              ? `S${src.episode.season} · E${String(src.episode.episode).padStart(2, "0")}`
              : undefined
          }
          hasPrevEp={canChangeEpisode && !!adjacent.prev}
          hasNextEp={canChangeEpisode && !!adjacent.next}
          onPrevEp={() => goToEpisode(adjacent.prev)}
          onNextEp={() => goToEpisode(adjacent.next)}
          metaImdbId={resolvedImdbId}
          metaTitle={src.meta.name ?? null}
          metaReleaseDate={src.meta.releaseDate ?? null}
          meta={src.meta}
          tmdbKey={settings.tmdbKey ?? null}
          season={src.episode?.season ?? null}
          episode={src.episode?.episode ?? null}
          download={download}
          onOpenDvr={liveOverlay.isLive ? () => setDvrOpen(true) : undefined}
          sleep={sleep}
        />
      )}

      <RoomLayer
        inRoom={inRoom}
        pipMode={pipMode}
        drawMode={drawMode}
        participants={roomSnapshot.participants}
        clientId={clientId}
        hostClientId={roomSnapshot.hostClientId}
        syncState={roomSnapshot.syncState}
        avatarsVisible={chromeVisible || !playing}
        presenceMap={presenceMap}
        participantLocations={participantLocations}
        now={now}
        avatarsCorner={avatarsCorner}
        avatarsHidden={avatarsHidden}
        chat={chat}
        sendChat={sendChat}
        chromeVisible={chromeVisible}
        chatCorner={chatCorner}
        chatHidden={chatHidden}
        showWaiting={showWaiting}
        isHost={isHost}
        staleIds={lobby.staleIds}
        guestEscapeReady={lobby.guestEscapeReady}
        onStart={lobby.startHost}
        onPlayWithoutSync={lobby.playWithoutSync}
        onLeave={closePlayer}
        guestHostSource={guestHostSource}
        guestDurationSec={snap.durationSec}
        casting={!!cast.castDevice}
        currentUrl={liveUrl}
        switcherOpen={switcherOpen}
        onFindCloser={pickAnother}
        foreignNotice={foreignNotice}
        onDismissForeign={() => setForeignNotice(null)}
      />

      {streamPillVariant && !switcherOpen && (
        <StreamCheckPill
          variant={streamPillVariant}
          visible
          compact={mpvEmbedWindowsActive}
          live={liveOverlay.isLive}
          onLooksGood={
            streamPillVariant === "check" ? () => setStreamCheckOpen(false) : undefined
          }
          onPickAnother={pickAnotherOrGuide}
        />
      )}

      <LiveLayer
        liveOverlay={liveOverlay}
        dvrOpen={dvrOpen}
        onCloseDvr={() => setDvrOpen(false)}
        srcUrl={src.url}
        channelName={src.meta.name ?? src.title}
      />
      <StreamSwitcher
        open={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        onPick={onSwitchStream}
        resolvingKey={swapResolvingKey}
        currentUrl={liveUrl}
        debridSlugs={debrids.map((d) => d.slug)}
        meta={src.meta}
        episode={src.episode}
        hostSource={guestHostSource}
      />

      <PanelsLayer
        isSeriesPlayback={isSeriesPlayback}
        meta={src.meta}
        currentEpisode={src.episode}
        episodePanelOpen={episodePanelOpen}
        onOpenEpisodePanel={() => setEpisodePanelOpen(true)}
        onCloseEpisodePanel={() => setEpisodePanelOpen(false)}
        upNextButtonVisible={
          isSeriesPlayback && chromeVisible && !episodePanelOpen && !switcherOpen && !pipMode && !drawMode && !episodesHidden && !roomGuest
        }
        episodesCorner={episodesCorner}
        episodesHidden={episodesHidden}
        roomGuest={roomGuest}
        onHostAdvance={broadcastEpisode}
        watchedFor={watchedFor}
        nextEp={adjacent.next}
        pendingResumeSec={pendingResumeSec}
        durationSec={snap.durationSec}
        resumeTitle={src.meta.name ?? src.title}
        onResume={() => acknowledgeResume("resume")}
        onStartOver={() => acknowledgeResume("start-over")}
        showHeaderWarning={showHeaderWarning && !streamPillVariant}
        showNoAudioWarning={showNoAudioWarning}
        onUseMpv={() => update({ playerEngine: "mpv" })}
        onDismissNoAudio={() => setNoAudioDismissed(true)}
        onPickAnother={pickAnotherOrGuide}
      />
    </main>
  );
}
