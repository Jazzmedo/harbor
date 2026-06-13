import type { Meta } from "@/lib/cinemeta";
import type { PlayEpisode } from "@/lib/view";

export function PickerHeader({ meta, episode }: { meta: Meta; episode?: PlayEpisode }) {
  if (episode) {
    return (
      <header className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-ink-subtle">
          {meta.name} · Season {episode.imdbSeason ?? episode.season} · Episode {String(episode.imdbEpisode ?? episode.episode).padStart(2, "0")}
        </p>
        <h1 className="font-display text-[64px] font-medium leading-[0.96] tracking-tight text-ink">
          {episode.name || `Episode ${episode.episode}`}
        </h1>
        {episode.overview && (
          <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-ink-muted">
            {episode.overview}
          </p>
        )}
      </header>
    );
  }
  return (
    <header className="flex flex-col gap-3">
      {meta.releaseInfo && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-ink-subtle">
          {meta.releaseInfo}
          {meta.genres?.length ? ` · ${meta.genres.slice(0, 2).join(" · ")}` : ""}
        </p>
      )}
      <h1 className="font-display text-[68px] font-medium leading-[0.96] tracking-tight text-ink">
        {meta.name}
      </h1>
    </header>
  );
}
