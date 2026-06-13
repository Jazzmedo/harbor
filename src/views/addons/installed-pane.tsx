import { ArrowUpDown, Settings2 } from "lucide-react";
import { useState } from "react";
import { AddonLogo, resolveAddonLogo } from "@/components/addon-logo";
import type { ResolvedAddon } from "@/lib/addons-store/store";
import { addonKey, idOf, nameOf, subtitleFromManifest } from "./addons-utils";

export function InstalledPane({
  installed,
  search,
  onOpen,
  onUninstall,
  onManage,
  onReorder,
}: {
  installed: ResolvedAddon[];
  search?: string | null;
  onOpen: (id: string) => void;
  onUninstall: (r: ResolvedAddon) => Promise<void>;
  onManage?: (r: ResolvedAddon) => void;
  onReorder?: () => void;
}) {
  const q = search?.trim().toLowerCase() ?? "";
  const filtered = q
    ? installed.filter((r) => {
        const name = (r.manifest?.name ?? "").toLowerCase();
        const desc = (r.manifest?.description ?? "").toLowerCase();
        const id = (r.manifest?.id ?? r.curated?.id ?? "").toLowerCase();
        return name.includes(q) || desc.includes(q) || id.includes(q);
      })
    : installed;
  if (installed.length === 0) {
    return (
      <div className="rounded-2xl border border-edge-soft bg-elevated/30 p-12 text-center">
        <h3 className="font-display text-[22px] font-medium text-ink">No addons installed yet</h3>
        <p className="mx-auto mt-2 max-w-md text-[13.5px] text-ink-muted">
          Head to Discover. Cinemeta and OpenSubtitles cover the basics; Torrentio + a debrid key
          cover almost everything else.
        </p>
      </div>
    );
  }
  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-edge-soft bg-canvas/30 p-10 text-center">
        <p className="font-display text-[16px] font-medium text-ink">No installed addon matches that.</p>
        <p className="mt-1.5 text-[12.5px] text-ink-subtle">
          Clear the search to see all {installed.length} installed.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {onReorder && (
        <div className="flex justify-end">
          <button
            onClick={onReorder}
            title="Change the order addons are tried in"
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-edge-soft px-3 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-subtle transition-colors hover:border-edge hover:text-ink-muted"
          >
            <ArrowUpDown size={13} strokeWidth={2.4} />
            Reorder
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {filtered.map((r) => (
          <InstalledRow
            key={addonKey(r)}
            resolved={r}
            onOpen={onOpen}
            onUninstall={onUninstall}
            onManage={onManage}
          />
        ))}
      </div>
    </div>
  );
}

function InstalledRow({
  resolved,
  onOpen,
  onUninstall,
  onManage,
}: {
  resolved: ResolvedAddon;
  onOpen: (id: string) => void;
  onUninstall: (r: ResolvedAddon) => Promise<void>;
  onManage?: (r: ResolvedAddon) => void;
}) {
  const r = resolved;
  const [busy, setBusy] = useState(false);
  const isConfigurable =
    r.manifest?.behaviorHints?.configurable === true ||
    r.manifest?.behaviorHints?.configurationRequired === true;
  const transportUrl = r.transportUrl;

  const handleUninstall = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      await onUninstall(r);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !busy && onOpen(idOf(r))}
      onKeyDown={(e) => !busy && (e.key === "Enter" || e.key === " ") && onOpen(idOf(r))}
      className={`flex items-center gap-3.5 rounded-xl border bg-elevated px-4 py-3 text-left transition-all ${
        busy
          ? "border-edge-soft cursor-wait opacity-60"
          : "border-edge-soft cursor-pointer hover:border-edge hover:bg-raised"
      }`}
    >
      <AddonLogo
        addonId={idOf(r)}
        addonName={nameOf(r)}
        manifestLogo={resolveAddonLogo(r.manifest?.logo, r.transportUrl)}
        size="lg"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[14px] font-medium text-ink">{nameOf(r)}</span>
        <span className="truncate text-[11.5px] text-ink-subtle">
          {subtitleFromManifest(r)}
        </span>
      </div>
      {isConfigurable && transportUrl && onManage && !busy && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onManage(r);
          }}
          title="Re-configure this addon and apply the updated link"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-raised px-3.5 py-1.5 text-[12px] font-semibold text-ink-muted ring-1 ring-edge-soft transition-colors hover:bg-elevated hover:text-ink hover:ring-edge"
        >
          <Settings2 size={12} strokeWidth={2.2} />
          Manage
        </button>
      )}
      <button
        onClick={handleUninstall}
        disabled={busy}
        className={`group/pill flex shrink-0 items-center gap-1 rounded-full px-3.5 py-1.5 text-[12px] font-semibold ring-1 transition-colors ${
          busy
            ? "bg-danger/15 text-danger ring-danger/30"
            : "bg-elevated/70 text-ink ring-edge-soft hover:bg-danger/15 hover:text-danger hover:ring-danger/30"
        }`}
      >
        {busy ? (
          <>
            <span>Uninstalling</span>
            <DotsAnim />
          </>
        ) : (
          "Installed"
        )}
      </button>
    </div>
  );
}

function DotsAnim() {
  return (
    <span className="inline-flex w-3 items-center">
      <span className="dots-anim text-[12px] leading-none">...</span>
    </span>
  );
}
