export function HostMatchChip({
  match,
  long = false,
}: {
  match: "same" | "close" | null;
  long?: boolean;
}) {
  if (!match) return null;
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ring-1 ${
        match === "same"
          ? "bg-accent/15 text-accent ring-accent/30"
          : "bg-raised text-ink-muted ring-edge-soft"
      }`}
    >
      {match === "same"
        ? long
          ? "Same file as host"
          : "Same file"
        : long
          ? "Close match to host"
          : "Close match"}
    </span>
  );
}
