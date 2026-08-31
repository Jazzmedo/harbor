import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const view = readFileSync(new URL("../src/views/ebook.tsx", import.meta.url), "utf8");
const wheel = readFileSync(
  new URL("../src/views/ebook/ebook-wheel-menu.tsx", import.meta.url),
  "utf8",
);
const exporter = readFileSync(
  new URL("../src/lib/ebook/offline-export.ts", import.meta.url),
  "utf8",
);
const readerState = readFileSync(
  new URL("../src/lib/ebook/reader-state.ts", import.meta.url),
  "utf8",
);

test("eBook cards and the featured book open the dedicated wheel menu", () => {
  assert.match(view, /onContextMenu=\{\(event\) => openMenu\(ebook, event\)\}/);
  assert.match(view, /onContextMenu=\{\(event\) => current && openMenu\(current, event\)\}/);
  assert.match(view, /<EBookWheelMenu/);
});

test("the wheel exposes every requested eBook action", () => {
  for (const label of [
    "Start Reading",
    "Continue Reading",
    "Book Details",
    "Download",
    "Add to Shelf",
    "Bookmark",
    "Mark as watched",
  ])
    assert.match(wheel, new RegExp(label));
  assert.match(wheel, /ebook\.description/);
  assert.match(wheel, /detailBook\.genres\.slice/);
  assert.match(wheel, /sourceName\(ebook\)/);
});

test("book details resolve source metadata and chapter statistics without a loading loop", () => {
  assert.match(wheel, /sourceEBookDetail\(route\)\.then/);
  assert.match(wheel, /sourceEBookChapters\(route\)/);
  assert.match(wheel, /authors: detail\.authors\.length \? detail\.authors : ebook\.authors/);
  assert.doesNotMatch(wheel, /\[ebook, mode, stats, statsLoading\]/);
  assert.match(wheel, /if \(active\) setStatsLoading\(false\)/);
});

test("continue reading persists a profile-scoped chapter resume", () => {
  assert.match(readerState, /harbor\.ebook\.resume\.v1/);
  assert.match(view, /loadEBookResume\(profile, ebook\.id\)/);
  assert.match(view, /saveEBookResume\(profile, ebook\.id/);
  assert.match(view, /chapter\.id === resume\?\.chapterId/);
});

test("offline export builds a valid EPUB and preserves a Unicode PDF print path", () => {
  assert.match(exporter, /application\/epub\+zip/);
  assert.match(exporter, /META-INF\/container\.xml/);
  assert.match(exporter, /EPUB\/package\.opf/);
  assert.match(exporter, /<meta charset="utf-8">/);
  assert.match(exporter, /windowRef\?\.print\(\)/);
});

test("the eBook home replaces Universes with the live Shelf view", () => {
  assert.doesNotMatch(view, /EBookUniverses(?:Cta)?/);
  assert.match(view, /screen === "shelf"/);
  assert.match(view, /setScreen\("shelf"\)/);
  assert.match(view, /items=\{displaySaved\}/);
  assert.match(view, /Books you add to your shelf will appear here/);
  assert.match(view, /harbor:ebook-library/);
});

test("the home bookmark rail is distinct from the Shelf collection", () => {
  assert.match(view, /title: "Continue your bookmarks"/);
  assert.match(view, /resume: loadEBookResume\(activeId \?\? "default", ebook\.id\)/);
  assert.match(view, /items: continueBookmarks/);
  assert.match(view, /resumeReading: true/);
  assert.match(view, /if \(rail\.resumeReading\) setReadIntent\(ebook\.id\)/);
  assert.match(view, /harbor:ebook-resume/);
  assert.match(view, /items=\{displaySaved\}/);
});
