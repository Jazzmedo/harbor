import { useEffect, useState } from "react";
import allDebridLogo from "@/assets/addon-logos/alldebrid.webp";
import debridLinkLogo from "@/assets/addon-logos/debridlink.png";
import premiumizeLogo from "@/assets/addon-logos/premiumize.png";
import realDebridLogo from "@/assets/addon-logos/realdebrid.png";
import torboxLogo from "@/assets/addon-logos/torbox.png";
import { useAuth } from "@/lib/auth";
import { userAddons, type Addon } from "@/lib/addons";
import { SERVICES } from "@/lib/providers/streaming";
import { useSettings, type StreamingService } from "@/lib/settings";
import {
  fetchAioStatusHealth,
  type AioStatusSnapshot,
  type ServiceHealth,
} from "@/lib/streams/aiostatus";
import { ExtLink, KeyField, Section } from "./shared";
import { ManualAddonCard, ServiceCard } from "./streaming-panel";

export type DebridKey = "rd" | "tb" | "ad" | "pm" | "dl";

export function StreamingSourcesPanel({
  rdDraft,
  tbDraft,
  adDraft,
  pmDraft,
  dlDraft,
  setRdDraft,
  setTbDraft,
  setAdDraft,
  setPmDraft,
  setDlDraft,
  savedKey,
  saveKey,
}: {
  rdDraft: string;
  tbDraft: string;
  adDraft: string;
  pmDraft: string;
  dlDraft: string;
  setRdDraft: (v: string) => void;
  setTbDraft: (v: string) => void;
  setAdDraft: (v: string) => void;
  setPmDraft: (v: string) => void;
  setDlDraft: (v: string) => void;
  savedKey: string | null;
  saveKey: (which: DebridKey, value: string) => void;
}) {
  const { settings, update, toggleStreaming } = useSettings();
  const aioHealth = useAioStatusHealth();
  return (
    <>
      <Section
        title="Stream safety filter"
        subtitle="How aggressively Harbor rejects shady or mismatched streams before showing them in the picker."
      >
        <StreamFilterPicker
          value={settings.streamFilterLevel}
          onChange={(v) => update({ streamFilterLevel: v })}
        />
      </Section>

      <Section
        title="Picker layout"
        subtitle="Condensed shows a top pick, quality tiles, and a drawer. Stremio is a flat list grouped by addon, no scoring."
      >
        <PickerLayoutPicker
          value={settings.pickerLayout}
          onChange={(v) => update({ pickerLayout: v })}
        />
      </Section>

      <Section
        title="Result order"
        subtitle="Harbor ranking puts the best-scoring sources first. Addon order follows your addon priority (organize it in Addons, Installed tab, Reorder) and keeps each addon's results in the order it returned them, like the Stremio and Vidi apps."
      >
        <StreamSortPicker
          value={settings.streamSort}
          onChange={(v) => update({ streamSort: v })}
        />
        <p className="mt-3 rounded-xl border border-edge-soft bg-canvas/40 px-4 py-3 text-[12.5px] leading-relaxed text-ink-muted">
          Using AIOStreams or another aggregator addon? Its own sorting and filtering happen inside
          the addon before Harbor ever sees the results, then Harbor applies the stream filter and
          result order above on top. If results look thinner than expected, keep one side
          permissive: either relax the addon's internal filters or set Harbor's stream filter to
          Balanced or Off.
        </p>
      </Section>

      <Section
        title="Debrid services"
        subtitle="Real-Debrid, TorBox, AllDebrid, Premiumize, Debrid-Link. Cached streams play direct. Keys stay local."
      >
        {aioHealth && <AioStatusBanner snapshot={aioHealth} />}
        <KeyField
          label="Real-Debrid API token"
          placeholder="API token"
          value={rdDraft}
          onChange={setRdDraft}
          onSave={() => saveKey("rd", rdDraft)}
          saved={savedKey === "rd"}
          iconSrc={realDebridLogo}
          help={
            <>
              Get yours at{" "}
              <ExtLink href="https://real-debrid.com/apitoken">real-debrid.com/apitoken</ExtLink>.
              Used to check cache and unrestrict links. Harbor never adds or removes torrents on
              its own.
            </>
          }
          headerExtra={
            aioHealth?.health.has("rd") ? (
              <HealthBadge health={aioHealth.health.get("rd")} logo={aioHealth.addonLogo} />
            ) : undefined
          }
        />
        <KeyField
          label="TorBox API key"
          placeholder="API key"
          value={tbDraft}
          onChange={setTbDraft}
          onSave={() => saveKey("tb", tbDraft)}
          saved={savedKey === "tb"}
          iconSrc={torboxLogo}
          help={
            <>
              Get yours at{" "}
              <ExtLink href="https://torbox.app/settings">torbox.app/settings</ExtLink>. Same
              read-only usage as Real-Debrid. Also lets you queue uncached torrents from the play
              picker.
            </>
          }
          headerExtra={
            aioHealth?.health.has("tb") ? (
              <HealthBadge health={aioHealth.health.get("tb")} logo={aioHealth.addonLogo} />
            ) : undefined
          }
        />
        <KeyField
          label="AllDebrid API key"
          placeholder="API key"
          value={adDraft}
          onChange={setAdDraft}
          onSave={() => saveKey("ad", adDraft)}
          saved={savedKey === "ad"}
          iconSrc={allDebridLogo}
          help={
            <>
              Get yours at{" "}
              <ExtLink href="https://alldebrid.com/apikeys/">alldebrid.com/apikeys</ExtLink>.
              AllDebrid deprecated their cache-check endpoint, so streams may show as unknown
              until you actually hit Play.
            </>
          }
          headerExtra={
            aioHealth?.health.has("ad") ? (
              <HealthBadge health={aioHealth.health.get("ad")} logo={aioHealth.addonLogo} />
            ) : undefined
          }
        />
        <KeyField
          label="Premiumize API key"
          placeholder="API key"
          value={pmDraft}
          onChange={setPmDraft}
          onSave={() => saveKey("pm", pmDraft)}
          saved={savedKey === "pm"}
          iconSrc={premiumizeLogo}
          help={
            <>
              Get yours at{" "}
              <ExtLink href="https://www.premiumize.me/account">premiumize.me/account</ExtLink>.
              Uses the directdl endpoint, which skips queueing for anything already cached.
            </>
          }
          headerExtra={
            aioHealth?.health.has("pm") ? (
              <HealthBadge health={aioHealth.health.get("pm")} logo={aioHealth.addonLogo} />
            ) : undefined
          }
        />
        <KeyField
          label="Debrid-Link API key"
          placeholder="API key"
          value={dlDraft}
          onChange={setDlDraft}
          onSave={() => saveKey("dl", dlDraft)}
          saved={savedKey === "dl"}
          iconSrc={debridLinkLogo}
          help={
            <>
              Get yours at{" "}
              <ExtLink href="https://debrid-link.com/webapp/apikey">
                debrid-link.com/webapp/apikey
              </ExtLink>
              . EU-hosted, fast cache check. Same read-only usage as the others.
            </>
          }
          headerExtra={
            aioHealth?.health.has("dl") ? (
              <HealthBadge health={aioHealth.health.get("dl")} logo={aioHealth.addonLogo} />
            ) : undefined
          }
        />
      </Section>

      <Section
        title="Usenet"
        subtitle="Faster and quieter than torrents if you already pay for Usenet. Configure on the addon page, paste the manifest URL it returns."
      >
        <ManualAddonCard
          title="Easynews+"
          blurb="Searches and streams directly off Easynews. No debrid needed. Just your Easynews login."
          configureUrl="https://b89262c192b0-stremio-easynews-addon.baby-beamup.club/configure"
        />
      </Section>

      <Section
        title="Streaming catalogs"
        subtitle="Top titles per service. Toggle off the ones you don't pay for."
      >
        <div className="grid grid-cols-3 gap-2.5">
          {(Object.keys(SERVICES) as StreamingService[]).map((svc) => (
            <ServiceCard
              key={svc}
              service={svc}
              active={settings.streaming[svc]}
              onToggle={() => toggleStreaming(svc)}
            />
          ))}
        </div>
        {!settings.tmdbKey && (
          <p className="mt-3 text-[13px] text-ink-subtle">
            Save a TMDB key in Library &amp; metadata to turn on streaming catalogs.
          </p>
        )}
      </Section>
    </>
  );
}

function StreamFilterPicker({
  value,
  onChange,
}: {
  value: "strict" | "balanced" | "off";
  onChange: (v: "strict" | "balanced" | "off") => void;
}) {
  const options: Array<{ id: "strict" | "balanced" | "off"; label: string; sub: string }> = [
    {
      id: "strict",
      label: "Strict",
      sub: "Default. Rejects size outliers, suspicious extensions, year/episode mismatches, season packs (for episode requests), trailers, and likely cams.",
    },
    {
      id: "balanced",
      label: "Balanced",
      sub: "Keeps the malware/year/episode-mismatch checks but allows season packs and oversized files. Same as hitting Search wider in the picker.",
    },
    {
      id: "off",
      label: "Off",
      sub: "No filtering. Every stream every addon returns shows up, including obvious junk. You'll be on your own.",
    },
  ];
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex items-start gap-3.5 rounded-2xl border px-5 py-4 text-left transition-colors ${
              selected
                ? "border-ink bg-elevated"
                : "border-edge-soft bg-canvas/40 hover:border-edge hover:bg-canvas/60"
            }`}
          >
            <span
              className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                selected ? "border-ink" : "border-edge"
              }`}
            >
              {selected && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-[15px] font-semibold text-ink">{opt.label}</span>
              <span className="text-[12.5px] leading-snug text-ink-muted">{opt.sub}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function PickerLayoutPicker({
  value,
  onChange,
}: {
  value: "condensed" | "stremio";
  onChange: (v: "condensed" | "stremio") => void;
}) {
  const options: Array<{ id: "condensed" | "stremio"; label: string; sub: string }> = [
    {
      id: "condensed",
      label: "Condensed",
      sub: "Default. Top pick at the top, quality tiles, and an All-Sources drawer. Harbor scores and ranks results.",
    },
    {
      id: "stremio",
      label: "Stremio",
      sub: "Flat list of sources grouped by addon, with a filter dropdown. No re-ranking. Closest match to the Stremio app's stream picker.",
    },
  ];
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex items-start gap-3.5 rounded-2xl border px-5 py-4 text-left transition-colors ${
              selected
                ? "border-ink bg-elevated"
                : "border-edge-soft bg-canvas/40 hover:border-edge hover:bg-canvas/60"
            }`}
          >
            <span
              className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                selected ? "border-ink" : "border-edge"
              }`}
            >
              {selected && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-[15px] font-semibold text-ink">{opt.label}</span>
              <span className="text-[12.5px] leading-snug text-ink-muted">{opt.sub}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function StreamSortPicker({
  value,
  onChange,
}: {
  value: "harbor" | "addon";
  onChange: (v: "harbor" | "addon") => void;
}) {
  const options: Array<{ id: "harbor" | "addon"; label: string; sub: string }> = [
    {
      id: "harbor",
      label: "Harbor ranking",
      sub: "Default. Harbor parses and scores every source and surfaces the best quality first.",
    },
    {
      id: "addon",
      label: "Addon order",
      sub: "Show each addon's results in the order it returned them, grouped by your addon list. Matches the Stremio and Vidi apps.",
    },
  ];
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex items-start gap-3.5 rounded-2xl border px-5 py-4 text-left transition-colors ${
              selected
                ? "border-ink bg-elevated"
                : "border-edge-soft bg-canvas/40 hover:border-edge hover:bg-canvas/60"
            }`}
          >
            <span
              className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                selected ? "border-ink" : "border-edge"
              }`}
            >
              {selected && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-[15px] font-semibold text-ink">{opt.label}</span>
              <span className="text-[12.5px] leading-snug text-ink-muted">{opt.sub}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function useAioStatusHealth(): AioStatusSnapshot | null {
  const { authKey } = useAuth();
  const [snapshot, setSnapshot] = useState<AioStatusSnapshot | null>(null);
  useEffect(() => {
    if (!authKey) return;
    const ac = new AbortController();
    let cancelled = false;
    void (async () => {
      const list = await userAddons(authKey).catch(() => [] as Addon[]);
      if (cancelled || list.length === 0) return;
      const snap = await fetchAioStatusHealth(list, ac.signal);
      if (!cancelled) setSnapshot(snap);
    })();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [authKey]);
  return snapshot;
}

function AioStatusBanner({ snapshot }: { snapshot: AioStatusSnapshot }) {
  const count = snapshot.health.size;
  if (count === 0) return null;
  const expiringSoon = Array.from(snapshot.health.values()).filter(
    (h) => h.status === "expiring" || h.status === "expired",
  );
  const hasWarning = expiringSoon.length > 0;
  return (
    <div
      className={`mb-2 flex items-center gap-2.5 rounded-xl border px-3.5 py-2 text-[12px] ${
        hasWarning
          ? "border-amber-300/40 bg-amber-400/10 text-amber-100"
          : "border-edge-soft bg-canvas/40 text-ink-muted"
      }`}
    >
      <span className="font-semibold tracking-wide">{snapshot.addonName}</span>
      <span className="text-ink-subtle">·</span>
      <span>
        {hasWarning
          ? `${expiringSoon.length} service${expiringSoon.length === 1 ? "" : "s"} need${expiringSoon.length === 1 ? "s" : ""} attention`
          : `Health for ${count} service${count === 1 ? "" : "s"} below`}
      </span>
    </div>
  );
}

function HealthBadge({
  health,
  logo,
}: {
  health: ServiceHealth | undefined;
  logo: string | null;
}) {
  if (!health) return null;
  const palette =
    health.status === "expired"
      ? "text-rose-200"
      : health.status === "expiring"
        ? "text-amber-200"
        : health.status === "active"
          ? "text-emerald-200"
          : "text-ink-subtle";
  const dot =
    health.status === "expired"
      ? "bg-rose-300"
      : health.status === "expiring"
        ? "bg-amber-300"
        : health.status === "active"
          ? "bg-emerald-300"
          : "bg-ink-subtle";
  const label = (() => {
    if (health.status === "expired") return "Expired";
    if (health.daysLeft != null && health.status === "expiring")
      return `${health.daysLeft}d left`;
    if (health.daysLeft != null) return `${health.daysLeft}d left`;
    if (health.status === "active") return "Active";
    return health.rawLine.slice(0, 40);
  })();
  return (
    <span className="flex items-center gap-2 text-[11px] font-medium">
      <span className={`flex items-center gap-1.5 ${palette}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <span>{label}</span>
        {health.quotaUsedPercent != null && (
          <span className="text-ink-subtle">· {health.quotaUsedPercent}%</span>
        )}
      </span>
      <span className="flex items-center gap-1.5 text-ink-muted">
        {logo && (
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-canvas ring-1 ring-edge-soft">
            <img
              src={logo}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              draggable={false}
            />
          </span>
        )}
        <span>AIOStatus</span>
      </span>
    </span>
  );
}
