import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { AwardLogo, laurelColorFor } from "@/components/icons/award-logo";
import { Laurel } from "@/components/icons/laurel";
import { awardSourceMeta, findAnyAwardWins, parseAwardYear } from "@/lib/anime-awards";
import type { Meta } from "@/lib/cinemeta";
import { awardSummary, useAwards, type AwardType } from "@/lib/providers/wikidata";
import { mergeBundledAwards } from "@/lib/awards-history";

const HEADLINE_FOR: Record<string, string> = {
  oscar: "Academy Award",
  emmy: "Primetime Emmy",
  bafta: "BAFTA",
  golden_globe: "Golden Globe",
  sag: "SAG Award",
  cannes: "Cannes",
  venice: "Venice",
  berlin: "Berlin",
  critics_choice: "Critics' Choice",
};

const NOUN_FOR: Record<string, string> = {
  oscar: "Oscar",
  emmy: "Emmy",
  bafta: "BAFTA",
  golden_globe: "Golden Globe",
  sag: "SAG Award",
  cannes: "Cannes Award",
  venice: "Venice Award",
  berlin: "Berlin Award",
  critics_choice: "Critics' Choice Award",
};

export function MetaAwardsCorner({ meta, imdbId }: { meta: Meta; imdbId?: string | null }) {
  const isAnime = meta.id.startsWith("kitsu:") || meta.id.startsWith("mal:");
  if (isAnime) return <AnimeCorner name={meta.name} year={parseAwardYear(meta.releaseInfo)} />;
  return <ClassicCorner imdbId={imdbId ?? null} name={meta.name} year={parseAwardYear(meta.releaseInfo)} />;
}

function useHostWide(min = 860) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [wide, setWide] = useState(true);
  useLayoutEffect(() => {
    let host = ref.current?.offsetParent as HTMLElement | null;
    while (host && host.clientWidth < 340 && host.offsetParent) {
      host = host.offsetParent as HTMLElement;
    }
    if (!host) return;
    const check = () => setWide(host.clientWidth >= min);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);
  return { ref, wide };
}

function AnimeCorner({ name, year }: { name: string; year?: number }) {
  const { ref, wide } = useHostWide();
  const wins = findAnyAwardWins(name, year);
  if (wins.length === 0) return null;
  const top = wins[0];
  const src = awardSourceMeta(top.source);
  const won = true;
  const headline = `${src.name} ${top.isAOTY ? "Winner" : "Winner"}`;
  const subline = top.isAOTY
    ? `${top.year} Anime of the Year`
    : `${top.year} ${top.categoryName.replace(/^Best\s+/i, "Best ")}`;
  const otherWins = wins.length - 1;
  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute bottom-10 right-10 z-10 hidden items-center gap-4 text-right ${wide ? "lg:flex" : ""}`}
      title={wins.map((w) => `${awardSourceMeta(w.source).shortName} ${w.year} ${w.categoryName}`).join("\n")}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-ink/55">
          {headline}
        </span>
        <span className="text-[13px] font-semibold text-ink/85">{subline}</span>
        {otherWins > 0 && (
          <span className="text-[11px] text-ink-subtle">
            +{otherWins} more award{otherWins === 1 ? "" : "s"}
          </span>
        )}
      </div>
      <span className="shrink-0 text-accent">
        {won ? (
          <Laurel size={68}>
            <img
              src={src.iconSmall}
              alt=""
              className={`h-7 w-7 object-contain ${top.source === "animation_kobe" ? "brightness-0 invert" : ""}`}
              draggable={false}
            />
          </Laurel>
        ) : (
          <img
            src={src.iconSmall}
            alt=""
            className={`h-9 w-9 object-contain opacity-90 ${top.source === "animation_kobe" ? "brightness-0 invert" : ""}`}
            draggable={false}
          />
        )}
      </span>
    </div>
  );
}

function ClassicCorner({ imdbId, name, year }: { imdbId: string | null; name: string; year?: number }) {
  const { ref, wide } = useHostWide();
  const live = useAwards(imdbId ?? undefined);
  const awards = useMemo(() => mergeBundledAwards(live, name, year), [live, name, year]);
  const summary = useMemo(() => awardSummary(awards).slice(0, 2), [awards]);
  if (summary.length === 0) return null;
  const top = summary[0];
  const won = top.wins > 0;
  const lines: string[] = [];
  for (const item of summary) {
    if (item.wins > 0) {
      lines.push(`${item.wins} ${pluralizeNoun(item.type, item.wins)}`);
    } else if (item.nominations > 0) {
      lines.push(
        `${item.nominations} ${pluralizeNoun(item.type, item.nominations)} ${item.nominations === 1 ? "nomination" : "nominations"}`,
      );
    }
  }
  const headline = `${HEADLINE_FOR[top.type] ?? "Award"} ${won ? "Winner" : "Nominee"}`;
  const laurelTint = laurelColorFor(top.type);
  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute bottom-10 right-10 z-10 hidden items-center gap-4 text-right ${wide ? "lg:flex" : ""}`}
      title={lines.join(" · ")}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-ink/55">
          {headline}
        </span>
        {lines.slice(0, 2).map((l, i) => (
          <span key={i} className="text-[13px] font-medium text-ink/85">
            {l}
          </span>
        ))}
      </div>
      <span
        className="shrink-0 text-accent"
        style={laurelTint ? { color: laurelTint } : undefined}
      >
        {won ? (
          <Laurel size={68}>
            <AwardLogo type={top.type as AwardType} size={24} />
          </Laurel>
        ) : (
          <span className="flex h-16 w-16 items-center justify-center opacity-85">
            <AwardLogo type={top.type as AwardType} size={36} />
          </span>
        )}
      </span>
    </div>
  );
}

function pluralizeNoun(type: string, n: number): string {
  const base = NOUN_FOR[type] ?? "Award";
  if (n === 1) return base;
  if (base.endsWith("s")) return base;
  return `${base}s`;
}

