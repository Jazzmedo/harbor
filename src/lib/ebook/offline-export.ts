import { strToU8, zipSync, type Zippable } from "fflate";
import type { EBook } from "./api";
import {
  sourceEBookChapters,
  sourceEBookContent,
  type EBookChapter,
  type EBookChapterContent,
} from "./providers";

export type EBookExportFormat = "epub" | "pdf";
export type EBookExportProgress = {
  completed: number;
  total: number;
  percent: number;
  label: string;
};

export function sourceRouteForEBook(ebook: EBook): string | null {
  if (ebook.source === "source" && ebook.id.startsWith("source:")) return ebook.id;
  return (
    ebook.books?.find((book) => book.source === "source" && book.id.startsWith("source:"))?.id ??
    null
  );
}

function fileName(value: string): string {
  return (
    value
      .normalize("NFKC")
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || "Harbor eBook"
  );
}

function xml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function paragraphs(value: string): string {
  return value
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n+/g, " ").trim())
    .filter(Boolean)
    .map((paragraph) => `<p dir="auto">${xml(paragraph)}</p>`)
    .join("\n");
}

async function loadBook(
  ebook: EBook,
  onProgress?: (progress: EBookExportProgress) => void,
): Promise<{ chapters: EBookChapter[]; contents: EBookChapterContent[] }> {
  const route = sourceRouteForEBook(ebook);
  if (!route) throw new Error("This eBook is not connected to an installed source.");
  const chapters = await sourceEBookChapters(route);
  if (!chapters.length) throw new Error("This source did not provide any chapters.");
  const contents = new Array<EBookChapterContent>(chapters.length);
  let cursor = 0;
  let completed = 0;
  const worker = async () => {
    while (cursor < chapters.length) {
      const index = cursor++;
      const chapter = chapters[index];
      contents[index] = await sourceEBookContent(route, chapter.id, chapter.title);
      completed += 1;
      onProgress?.({
        completed,
        total: chapters.length,
        percent: Math.round((completed / chapters.length) * 100),
        label: chapter.title,
      });
    }
  };
  await Promise.all(Array.from({ length: Math.min(3, chapters.length) }, () => worker()));
  return { chapters, contents };
}

function chapterXhtml(ebook: EBook, chapter: EBookChapter, content: EBookChapterContent): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8"/>
<title>${xml(chapter.title)}</title><style>
body{font-family:serif;line-height:1.75;margin:5%;color:#171717}h1{font-size:1.55em;margin:0 0 1.4em}
p{margin:0 0 1em;text-align:start}img{display:block;max-width:100%;height:auto;margin:1em auto}
</style></head><body dir="auto"><h1>${xml(chapter.title || ebook.title)}</h1>
${paragraphs(content.text ?? "")}</body></html>`;
}

function makeEpub(
  ebook: EBook,
  chapters: EBookChapter[],
  contents: EBookChapterContent[],
): Uint8Array {
  const modified = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const chapterFiles = chapters.map((_, index) => `chapter-${String(index + 1).padStart(5, "0")}.xhtml`);
  const nav = chapters
    .map((chapter, index) => `<li><a href="${chapterFiles[index]}">${xml(chapter.title)}</a></li>`)
    .join("");
  const manifest = chapterFiles
    .map((path, index) => `<item id="c${index + 1}" href="${path}" media-type="application/xhtml+xml"/>`)
    .join("\n");
  const spine = chapterFiles.map((_, index) => `<itemref idref="c${index + 1}"/>`).join("\n");
  const files: Zippable = {
    mimetype: [strToU8("application/epub+zip"), { level: 0 }],
    "META-INF/container.xml": strToU8(`<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles><rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`),
    "EPUB/nav.xhtml": strToU8(`<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Contents</title></head>
<body><nav epub:type="toc"><h1>Contents</h1><ol>${nav}</ol></nav></body></html>`),
    "EPUB/package.opf": strToU8(`<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="book-id">urn:harbor:${xml(ebook.id)}</dc:identifier><dc:title>${xml(ebook.title)}</dc:title>
${ebook.authors.map((author) => `<dc:creator>${xml(author)}</dc:creator>`).join("")}
<dc:language>und</dc:language><dc:description>${xml(ebook.description)}</dc:description>
<meta property="dcterms:modified">${modified}</meta></metadata>
<manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>${manifest}</manifest>
<spine>${spine}</spine></package>`),
  };
  chapters.forEach((chapter, index) => {
    files[`EPUB/${chapterFiles[index]}`] = strToU8(chapterXhtml(ebook, chapter, contents[index]));
  });
  return zipSync(files, { level: 6 });
}

async function saveBytes(bytes: Uint8Array, name: string): Promise<boolean> {
  if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeFile } = await import("@tauri-apps/plugin-fs");
    const path = await save({
      defaultPath: name,
      filters: [{ name: "EPUB eBook", extensions: ["epub"] }],
    });
    if (!path) return false;
    await writeFile(path, bytes);
    return true;
  }
  const blob = new Blob([new Uint8Array(bytes).buffer as ArrayBuffer], {
    type: "application/epub+zip",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  return true;
}

function printPdf(ebook: EBook, chapters: EBookChapter[], contents: EBookChapterContent[]): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;inset:auto 0 0 auto;width:0;height:0;border:0;opacity:0";
  document.body.appendChild(iframe);
  const documentRef = iframe.contentDocument;
  if (!documentRef) {
    iframe.remove();
    throw new Error("The PDF print view could not be created.");
  }
  const body = chapters
    .map(
      (chapter, index) =>
        `<section><h2>${xml(chapter.title)}</h2>${paragraphs(contents[index].text ?? "")}</section>`,
    )
    .join("");
  documentRef.open();
  documentRef.write(`<!doctype html><html><head><meta charset="utf-8"><title>${xml(ebook.title)}</title>
<style>*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#171717}main{max-width:760px;margin:auto;font:17px/1.8 Georgia,"Noto Naskh Arabic","Segoe UI",serif}header{min-height:70vh;display:grid;place-content:center;text-align:center;page-break-after:always}h1{font-size:36px}h2{font-size:25px;margin:0 0 1.5em}p{margin:0 0 1em;text-align:start}section{page-break-before:always}@page{size:A4;margin:18mm}</style>
</head><body><main dir="auto"><header><h1>${xml(ebook.title)}</h1><p>${xml(ebook.authors.join(", "))}</p></header>${body}</main></body></html>`);
  documentRef.close();
  const windowRef = iframe.contentWindow;
  const cleanup = () => window.setTimeout(() => iframe.remove(), 400);
  windowRef?.addEventListener("afterprint", cleanup, { once: true });
  window.setTimeout(() => {
    windowRef?.focus();
    windowRef?.print();
    window.setTimeout(cleanup, 60_000);
  }, 180);
}

export async function exportEBookForOffline(
  ebook: EBook,
  format: EBookExportFormat,
  onProgress?: (progress: EBookExportProgress) => void,
): Promise<boolean> {
  const { chapters, contents } = await loadBook(ebook, onProgress);
  if (format === "pdf") {
    printPdf(ebook, chapters, contents);
    return true;
  }
  onProgress?.({
    completed: chapters.length,
    total: chapters.length,
    percent: 100,
    label: "Building EPUB",
  });
  return saveBytes(makeEpub(ebook, chapters, contents), `${fileName(ebook.title)}.epub`);
}
