import { Check, Download, Github, Link2, Loader2, Lock, RotateCw, Wrench } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import cornerSvg from "@/assets/corner.svg";
import harborDiscord from "@/assets/harbor-discord.svg";
import { useAuth } from "@/lib/auth";
import { useOnboarding } from "@/lib/onboarding";
import {
  resetOmdbBudget,
  subscribeOmdbBudget,
  type OmdbBudget,
  omdbBudget as readOmdbBudget,
} from "@/lib/providers/omdb";
import { useSettings } from "@/lib/settings";
import { repairStremioLibrary, type RepairProgress, type RepairResult } from "@/lib/stremio-library-repair";
import { openUrl } from "@/lib/window";
import {
  checkForUpdate,
  openUpdatePanel,
  updateAvailable,
  useUpdate,
} from "@/lib/updater/use-update";
import { BackupRow } from "./backup-row";
import { PrivacyRow } from "./privacy-row";
import { TrayRow } from "./tray-row";
import { Section } from "./shared";
import { Signature } from "./signature";
import { DesktopOnlyBlock } from "./player-panel/internals";

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
const DOWNLOAD_URL = "https://harbor.site/download";
const SOURCE_URL = "https://github.com/harborstremio/harbor";

export function AdvancedPanel() {
  return (
    <>
      {!isTauri && <WebBuildBanner />}

      {isTauri && (
        <Section
          title="Updates"
          subtitle="Harbor checks harbor.site for new versions and installs them in place. Nothing installs until you choose to, and a dismissed update never nags you again."
        >
          <UpdatesRow />
        </Section>
      )}

      <Section
        title="Backup & restore"
        subtitle="Export your entire Harbor setup to a single file, then restore it on a new computer or keep it as a backup. Everything is included except your Stremio sign-in."
      >
        <BackupRow />
      </Section>

      <Section
        title="Privacy"
        subtitle="Harbor sends no telemetry. This also drops outbound ad, analytics, and tracker requests that addons or metadata providers try to make, before they leave your machine."
      >
        <PrivacyRow />
      </Section>

      {isTauri && (
        <Section
          title="System tray"
          subtitle="Keep Harbor a click away. Close it to the Windows tray instead of quitting, and control it from the tray's right-click menu. These also mirror into the tray menu live."
        >
          <TrayRow />
        </Section>
      )}

      {isTauri && (
        <Section
          title="Stremio install links"
          subtitle="Harbor catches stremio:// install links so the configure-and-install flow stays inside the app. Every install also syncs to your Stremio account, so the official app remains the canonical home for your library."
        >
          <StremioDeeplinkRow />
        </Section>
      )}

      {isTauri && (
        <Section
          title="Discord Rich Presence"
          subtitle="Let your Discord friends see what you are watching, with the show poster and a live progress bar. Desktop only, and only your own Discord client is involved (nothing touches a Harbor server)."
        >
          <DiscordPresenceRow />
        </Section>
      )}

      <Section
        title="API budget"
        subtitle="Daily call counter for OMDb rating lookups. Reset if it stops returning fresh scores."
      >
        <OmdbBudgetRow />
      </Section>

      <Section
        title="Onboarding"
        subtitle="Replay the walkthrough or unhide every dismissed tip in the app."
      >
        <OnboardingRow />
      </Section>

      <Section
        title="Stremio library repair"
        subtitle="Scans your Stremio library and rewrites any item whose shape doesn't match Stremio's exact schema. Safe to run anytime; only items that need fixing get touched."
      >
        <DesktopOnlyBlock>
          <LibraryRepairRow />
        </DesktopOnlyBlock>
      </Section>

      <Section
        title="About"
        subtitle="Build identity. Useful when filing a bug report at bugs@harbor.site."
      >
        <AboutRow />
      </Section>

      <LegalDisclaimer />

      <Signature />
    </>
  );
}

function LegalDisclaimer() {
  return (
    <section className="rounded-2xl border border-edge-soft bg-canvas/30 p-5">
      <span className="block text-[10.5px] font-bold uppercase tracking-[0.22em] text-ink-subtle">
        Legal
      </span>
      <p className="mt-2 text-[12px] leading-relaxed text-ink-muted">
        Harbor is an independent, open-source desktop and web client. It is{" "}
        <span className="font-semibold text-ink">not affiliated with, endorsed by, sponsored by, or in any way associated with Stremio Ltd.</span>,{" "}
        the maker of <span className="font-semibold text-ink">Stremio</span>, or with any company,
        addon author, or trademark holder referenced inside the app.
        &quot;Stremio&quot;, &quot;Cinemeta&quot;, &quot;OpenSubtitles&quot;, &quot;Real-Debrid&quot;,
        &quot;Premiumize&quot;, &quot;AllDebrid&quot;, &quot;TorBox&quot;, &quot;DebridLink&quot;,
        &quot;TMDB&quot;, &quot;Trakt&quot;, &quot;IMDb&quot;, &quot;Netflix&quot;, &quot;Disney+&quot;,
        and all other names, logos, and brand references are property of their respective owners
        and are used here only for compatibility and identification.
      </p>
      <p className="mt-2 text-[12px] leading-relaxed text-ink-muted">
        Harbor itself does not host, distribute, or index any media. All streams come from
        third-party addons, debrid services, or your own Stremio account that you configure
        yourself. You are responsible for what you choose to play and for complying with the
        laws of your jurisdiction.
      </p>
    </section>
  );
}

function WebBuildBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-edge bg-elevated/60 p-7">
      <div className="group absolute -right-6 bottom-0 aspect-square h-[82%] cursor-default">
        <img
          src={cornerSvg}
          alt=""
          aria-hidden
          draggable={false}
          className="h-full w-full select-none transition-[filter] duration-[280ms] ease-out will-change-[filter] group-hover:blur-[7px] group-hover:brightness-[0.55]"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 scale-90 items-center justify-center rounded-full border border-white/20 bg-canvas/40 text-ink opacity-0 backdrop-blur-md transition-[opacity,transform] duration-[280ms] ease-out group-hover:scale-100 group-hover:opacity-100">
            <Lock size={22} strokeWidth={2.1} />
          </span>
        </div>
      </div>
      <div className="relative z-10 flex max-w-[54%] flex-col gap-3">
        <span className="w-fit rounded-full border border-edge-soft bg-canvas/60 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
          Web build
        </span>
        <h2 className="text-[19px] font-medium tracking-tight text-ink">
          Where your data lives
        </h2>
        <p className="text-[13.5px] leading-relaxed text-ink-muted">
          Everything you save here stays in this browser. Your Stremio login, API
          keys, watch progress, picker cache, dismissed tips. Harbor servers never
          see any of it. Clearing your browser data wipes it.
        </p>
        <p className="text-[13.5px] leading-relaxed text-ink-muted">
          The web build can't run mpv, the trickplay generator, the local bandwidth
          probe, or your own Cloudflare relay. If you want HDR passthrough,
          TrueHD or DTS-HD audio, and smoother seeking, grab the desktop app.
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openUrl(DOWNLOAD_URL)}
            className="flex h-10 w-fit items-center gap-2 rounded-xl bg-ink px-4 text-[13.5px] font-semibold text-canvas transition-transform hover:scale-[1.02] active:scale-[0.97]"
          >
            <Download size={14} strokeWidth={2.4} />
            Get Harbor for desktop
          </button>
          <button
            type="button"
            onClick={() => openUrl(SOURCE_URL)}
            className="flex h-10 w-fit items-center gap-2 rounded-xl border border-edge bg-elevated/60 px-4 text-[13.5px] font-semibold text-ink transition-colors hover:border-ink hover:bg-elevated"
          >
            <Github size={14} strokeWidth={2.2} />
            Source code
          </button>
        </div>
      </div>
    </section>
  );
}

function StremioDeeplinkRow() {
  const { settings, update } = useSettings();
  const on = settings.stremioDeeplinkInstall;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-start gap-3 rounded-xl border border-edge-soft bg-canvas/40 px-4 py-3.5">
        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            on ? "bg-accent/15 text-accent" : "bg-raised text-ink-subtle"
          }`}
        >
          <Link2 size={15} strokeWidth={2.2} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[14px] font-medium text-ink">
            Catch stremio:// install links inside Harbor
          </span>
          <p className="text-[12.5px] leading-relaxed text-ink-subtle">
            Harbor&apos;s in-app installer animates the manifest install and keeps you in
            context. Anything Harbor installs is also synced to your Stremio account, so the
            official app stays the canonical library. Turn this off and Stremio becomes the
            only handler for stremio:// links; Harbor still installs anything you trigger from
            inside the app (Configure &amp; install, paste, drag-and-drop).
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={() => update({ stremioDeeplinkInstall: !on })}
          className={`mt-1 flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors ${
            on ? "bg-accent" : "bg-raised"
          }`}
        >
          <span
            className={`h-5 w-5 rounded-full bg-canvas shadow-sm transition-transform ${
              on ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      {on ? (
        <p className="px-1 text-[11.5px] leading-relaxed text-ink-subtle">
          Heads up: if Stremio is also installed, Windows may ask which app to use the first
          time a stremio:// link fires. Pick Harbor to make it stick.
        </p>
      ) : (
        <p className="px-1 text-[11.5px] leading-relaxed text-ink-subtle">
          stremio:// links now open in the Stremio app. Harbor will only install when you
          trigger it from inside Harbor.
        </p>
      )}
    </div>
  );
}

function UpdatesRow() {
  const u = useUpdate();
  const ready = updateAvailable(u);
  const busy = u.status === "checking";
  const status =
    u.status === "checking"
      ? "Checking harbor.site for a newer build."
      : u.status === "downloading"
        ? `Downloading ${Math.round(u.progress * 100)}%`
        : u.status === "downloaded"
          ? "Downloaded. Ready to install and restart."
          : u.status === "installing"
            ? "Installing. Harbor will restart."
            : u.status === "available"
              ? "A new version is ready to download."
              : u.status === "uptodate"
                ? "You're on the latest version."
                : u.status === "error" && u.manualCheck
                  ? "Couldn't reach the update server. Try again in a moment."
                  : "Harbor checks automatically every few hours.";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-edge-soft bg-canvas/40 px-4 py-3.5">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
          ready ? "bg-accent/15 text-accent" : "bg-raised text-ink-muted"
        }`}
      >
        <RotateCw size={18} strokeWidth={2} className={busy ? "animate-spin" : ""} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[14px] font-medium text-ink">
          {ready && u.version ? `Harbor ${u.version} available` : `Harbor ${__APP_VERSION__}`}
        </span>
        <span className="text-[12.5px] text-ink-subtle">{status}</span>
      </div>
      {ready ? (
        <button
          onClick={openUpdatePanel}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-accent px-4 text-[13px] font-semibold text-[#1b1304] transition-[filter] hover:brightness-105"
        >
          <Download size={15} strokeWidth={2.2} /> Update now
        </button>
      ) : (
        <button
          onClick={() => void checkForUpdate(true)}
          disabled={busy}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-edge px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-raised disabled:opacity-60"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <RotateCw size={15} strokeWidth={2.2} />}
          {busy ? "Checking" : "Check for updates"}
        </button>
      )}
    </div>
  );
}

function DiscordPresenceRow() {
  const { settings, update } = useSettings();
  const on = settings.discordRichPresence;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-start gap-3 rounded-xl border border-edge-soft bg-canvas/40 px-4 py-3.5">
        <img
          src={harborDiscord}
          alt=""
          draggable={false}
          className="h-14 w-auto shrink-0 self-center object-contain"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[14px] font-medium text-ink">Show on Discord</span>
          <p className="text-[12.5px] leading-relaxed text-ink-subtle">
            Display what you are watching on your Discord profile, with the show poster and a
            live progress bar. Requires the Discord desktop app to be running.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={() => update({ discordRichPresence: !on })}
          className={`mt-1 flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors ${
            on ? "bg-accent" : "bg-raised"
          }`}
        >
          <span
            className={`h-5 w-5 rounded-full bg-canvas shadow-sm transition-transform ${
              on ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      {on && (
        <div className="flex flex-col gap-1.5 pl-4">
          <DiscordSubToggle
            label="Hide the title"
            hint="Show 'Watching something' with no show name or poster."
            on={settings.discordHideTitle}
            onToggle={() => update({ discordHideTitle: !settings.discordHideTitle })}
          />
          <DiscordSubToggle
            label="Show while paused"
            hint="Keep the presence visible when playback is paused."
            on={settings.discordShowWhenPaused}
            onToggle={() => update({ discordShowWhenPaused: !settings.discordShowWhenPaused })}
          />
          <DiscordSubToggle
            label="Show while browsing"
            hint="Display 'Browsing Harbor' when nothing is playing."
            on={settings.discordShowWhenBrowsing}
            onToggle={() => update({ discordShowWhenBrowsing: !settings.discordShowWhenBrowsing })}
          />
          <DiscordSubToggle
            label="Show poster"
            hint="Reveal the show or movie artwork. Off keeps the title but hides the poster."
            on={settings.discordShowPoster}
            onToggle={() => update({ discordShowPoster: !settings.discordShowPoster })}
          />
          <DiscordSubToggle
            label="Show elapsed time"
            hint="Display the live progress bar showing how far into the title you are."
            on={settings.discordShowTimestamp}
            onToggle={() => update({ discordShowTimestamp: !settings.discordShowTimestamp })}
          />
          <DiscordSubToggle
            label="Watch party join button"
            hint="Add a Join button with your room link while you're in a watch party."
            on={settings.discordShowPartyJoin}
            onToggle={() => update({ discordShowPartyJoin: !settings.discordShowPartyJoin })}
          />
          <p className="px-1 pt-1 text-[11.5px] leading-snug text-ink-subtle">
            And for the naughty ones: browsing or rating an adult addon never shows on Discord.
          </p>
        </div>
      )}
    </div>
  );
}

function DiscordSubToggle({
  label,
  hint,
  on,
  onToggle,
}: {
  label: string;
  hint: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-edge-soft/60 bg-canvas/30 px-3.5 py-2.5">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        <span className="text-[11.5px] leading-snug text-ink-subtle">{hint}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onToggle}
        className={`flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors ${
          on ? "bg-accent" : "bg-raised"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-canvas shadow-sm transition-transform ${
            on ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function OmdbBudgetRow() {
  const { settings } = useSettings();
  const [budget, setBudget] = useState<OmdbBudget>(() => readOmdbBudget());
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => subscribeOmdbBudget(setBudget), []);
  useEffect(() => {
    if (!confirmed) return;
    const t = setTimeout(() => setConfirmed(false), 1400);
    return () => clearTimeout(t);
  }, [confirmed]);

  if (!settings.omdbKey) {
    return (
      <ActionRow
        label="OMDB daily budget"
        sub="Save an OMDB key in Library & metadata to enable rating fetches."
        disabled
      />
    );
  }

  const sub = budget.keyInvalid
    ? "Key rejected. Check it on Library & metadata."
    : `${budget.used} / ${budget.limit} requests today.${budget.exhausted ? " Budget exhausted, resets at midnight UTC." : ""}`;

  return (
    <ActionRow
      label="OMDB daily budget"
      sub={sub}
      cta={confirmed ? "Reset" : "Reset counter"}
      icon={confirmed ? <Check size={14} strokeWidth={2.6} /> : <RotateCw size={14} />}
      tone={confirmed ? "success" : "neutral"}
      onClick={() => {
        resetOmdbBudget();
        setConfirmed(true);
      }}
    />
  );
}

function OnboardingRow() {
  const { resetOnboarding, resetNudges } = useOnboarding();
  const [phase, setPhase] = useState<"idle" | "walkthrough" | "hints">("idle");
  useEffect(() => {
    if (phase === "idle") return;
    const t = setTimeout(() => setPhase("idle"), 1400);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div className="flex flex-col gap-2.5">
      <ActionRow
        label="Replay walkthrough"
        sub="Re-runs the welcome flow and clears every dismissed tip."
        cta={phase === "walkthrough" ? "Done" : "Replay"}
        icon={phase === "walkthrough" ? <Check size={14} strokeWidth={2.6} /> : <RotateCw size={14} />}
        tone={phase === "walkthrough" ? "success" : "neutral"}
        onClick={() => {
          resetOnboarding();
          setPhase("walkthrough");
        }}
      />
      <ActionRow
        label="Restore dismissed hints"
        sub="Brings back the small in-app tips you've dismissed without redoing the welcome flow."
        cta={phase === "hints" ? "Restored" : "Restore"}
        icon={phase === "hints" ? <Check size={14} strokeWidth={2.6} /> : <RotateCw size={14} />}
        tone={phase === "hints" ? "success" : "neutral"}
        onClick={() => {
          resetNudges();
          setPhase("hints");
        }}
      />
    </div>
  );
}

function AboutRow() {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-edge-soft bg-canvas/40 px-4 py-3.5 text-[13px] text-ink-muted">
      <InfoLine label="Version" value={__APP_VERSION__} />
      <InfoLine label="Build" value={isTauri ? "Desktop (Tauri 2 / WebView2)" : "Web"} />
      <InfoLine label="Bug reports" value="bugs@harbor.site" />
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-subtle">
        {label}
      </span>
      <span className="text-[13.5px] tabular-nums text-ink">{value}</span>
    </div>
  );
}

function ActionRow({
  label,
  sub,
  cta,
  icon,
  tone = "neutral",
  onClick,
  disabled,
}: {
  label: string;
  sub: string;
  cta?: string;
  icon?: ReactNode;
  tone?: "neutral" | "success";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border border-edge-soft bg-canvas/40 px-4 py-3 ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[14px] font-medium text-ink">{label}</span>
        <span className="text-[12.5px] text-ink-subtle">{sub}</span>
      </div>
      {cta && (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-[12.5px] font-semibold transition-all ${
            tone === "success"
              ? "bg-accent/15 text-accent"
              : "border border-edge bg-elevated text-ink hover:border-ink hover:scale-[1.02] active:scale-[0.97]"
          } disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100`}
        >
          {icon}
          {cta}
        </button>
      )}
    </div>
  );
}

function LibraryRepairRow() {
  const { authKey } = useAuth();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<RepairProgress | null>(null);
  const [result, setResult] = useState<RepairResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!authKey || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress({ phase: "fetching" });
    try {
      const r = await repairStremioLibrary(authKey, (p) => setProgress(p));
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!authKey) {
    return (
      <ActionRow
        label="Repair library"
        sub="Sign in to Stremio first. The repair scans only the active profile's library."
      />
    );
  }

  const statusLine = (() => {
    if (error) return `Failed: ${error}`;
    if (result) {
      if (result.total === 0) return "Library is empty. Nothing to repair.";
      return `${result.repaired} fixed, ${result.alreadyClean} already clean${result.unrepairable > 0 ? `, ${result.unrepairable} unrepairable` : ""}.`;
    }
    if (!progress) return "Rewrites every library item to match Stremio's exact schema. Run once if your Stremio app started crashing after Harbor synced playback.";
    if (progress.phase === "fetching") {
      return progress.total ? `Fetching ${progress.total} items…` : "Fetching library index…";
    }
    if (progress.phase === "normalizing") {
      return progress.needsRepair != null
        ? `${progress.needsRepair} items need repair.`
        : `Checking ${progress.total ?? 0} items…`;
    }
    if (progress.phase === "pushing") {
      return `Pushing ${progress.pushed ?? 0} of ${progress.needsRepair ?? 0}…`;
    }
    return "Done.";
  })();

  return (
    <ActionRow
      label="Repair library"
      sub={statusLine}
      cta={busy ? "Working…" : result ? "Run again" : "Repair now"}
      icon={busy ? <Loader2 size={13} strokeWidth={2.4} className="animate-spin" /> : <Wrench size={13} strokeWidth={2.4} />}
      onClick={run}
      disabled={busy}
      tone={result && result.repaired > 0 && !error ? "success" : undefined}
    />
  );
}
