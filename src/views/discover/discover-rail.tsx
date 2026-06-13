import type { Meta } from "@/lib/cinemeta";
import type { RailDef } from "@/lib/feed";
import { FeedShelf } from "@/components/feed-shelf";
import { useView } from "@/lib/view";

export function Rail({
  railId,
  allRails,
  deduped,
  loadMore,
}: {
  railId: string;
  allRails: RailDef[];
  deduped: Record<string, Meta[] | null>;
  loadMore: (id: string) => void;
}) {
  const { openGrid } = useView();
  const def = allRails.find((r) => r.id === railId);
  if (!def) return null;
  const items = deduped[railId] ?? null;
  return (
    <FeedShelf
      shelf={def.shelf}
      items={items}
      onEndReached={() => loadMore(railId)}
      scrollKey={`discover:${railId}`}
      onViewAll={() =>
        openGrid({
          title: def.shelf.title,
          fetcher: (page) => def.fetch(page),
          initial: items ?? undefined,
        })
      }
    />
  );
}
