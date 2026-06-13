import { ArrowDown, ArrowUp, Check, Eye, EyeOff, ListOrdered, Pencil, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function RowControls({
  name,
  hidden,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onToggleHidden,
  onRename,
  onResetName,
  isRenamed,
  numeralsActive,
  canNumerals,
  onToggleNumerals,
  heroActive,
  canHero,
  onToggleHero,
}: {
  name: string;
  hidden: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleHidden: () => void;
  onRename: (next: string) => void;
  onResetName: () => void;
  isRenamed: boolean;
  numeralsActive?: boolean;
  canNumerals?: boolean;
  onToggleNumerals?: () => void;
  heroActive?: boolean;
  canHero?: boolean;
  onToggleHero?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(name);
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [editing, name]);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== name) onRename(next);
    setEditing(false);
  };

  return (
    <div className="mb-2 flex items-center gap-1.5 rounded-xl border border-edge-soft bg-canvas/60 px-2 py-1.5 text-[12px]">
      <button
        onClick={onMoveUp}
        disabled={!canMoveUp}
        title="Move up"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-raised hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-muted"
      >
        <ArrowUp size={14} strokeWidth={2.2} />
      </button>
      <button
        onClick={onMoveDown}
        disabled={!canMoveDown}
        title="Move down"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-raised hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-muted"
      >
        <ArrowDown size={14} strokeWidth={2.2} />
      </button>
      <button
        onClick={onToggleHidden}
        title={hidden ? "Show on home" : "Hide from home"}
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
          hidden ? "bg-danger/15 text-danger hover:bg-danger/25" : "text-ink-muted hover:bg-raised hover:text-ink"
        }`}
      >
        {hidden ? <EyeOff size={14} strokeWidth={2.2} /> : <Eye size={14} strokeWidth={2.2} />}
      </button>
      {onToggleNumerals && (
        <button
          onClick={onToggleNumerals}
          disabled={!canNumerals && !numeralsActive}
          title={
            numeralsActive
              ? "Show as a normal row"
              : canNumerals
                ? "Show as a Top 10 with big numerals"
                : "Needs at least 10 titles for the Top 10 look"
          }
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent ${
            numeralsActive
              ? "bg-accent/15 text-accent hover:bg-accent/25"
              : "text-ink-muted hover:bg-raised hover:text-ink"
          }`}
        >
          <ListOrdered size={14} strokeWidth={2.2} />
        </button>
      )}
      {onToggleHero && (
        <button
          onClick={onToggleHero}
          disabled={!canHero && !heroActive}
          title={
            heroActive
              ? "Stop feeding the hero carousel (back to automatic)"
              : canHero
                ? "Feature this catalog in the hero carousel"
                : "Needs artwork-rich titles to feed the hero"
          }
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent ${
            heroActive
              ? "bg-accent/15 text-accent hover:bg-accent/25"
              : "text-ink-muted hover:bg-raised hover:text-ink"
          }`}
        >
          <Sparkles size={14} strokeWidth={2.2} />
        </button>
      )}
      <div className="mx-1 h-5 w-px bg-edge-soft" />
      {editing ? (
        <>
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="flex-1 rounded-md border border-edge bg-elevated px-2 py-1 text-[13px] font-medium text-ink outline-none focus:border-ink-subtle"
          />
          <button
            onClick={commit}
            title="Save"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-accent transition-colors hover:bg-raised"
          >
            <Check size={14} strokeWidth={2.4} />
          </button>
          <button
            onClick={() => setEditing(false)}
            title="Cancel"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-raised hover:text-ink"
          >
            <X size={14} strokeWidth={2.2} />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 truncate text-[13px] font-medium text-ink">{name}</span>
          {isRenamed && (
            <button
              onClick={onResetName}
              title="Reset to original name"
              className="rounded-md bg-accent/15 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-accent transition-colors hover:bg-accent/25"
            >
              Renamed
            </button>
          )}
          <button
            onClick={() => setEditing(true)}
            title="Rename row"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-raised hover:text-ink"
          >
            <Pencil size={13} strokeWidth={2.2} />
          </button>
        </>
      )}
    </div>
  );
}
