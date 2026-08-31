import { type CSSProperties, type ReactNode } from "react";
import { Poster } from "@/components/poster";
import "../ebook-book3d.css";

function openingLines(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function EBookBook3D({
  cover,
  seed,
  title,
  author,
  text,
  imprint,
  scale = 1,
  thickness = 9,
  lazy = false,
  children,
}: {
  cover?: string;
  seed: string;
  title: string;
  author?: string;
  text?: string;
  imprint?: string;
  scale?: number;
  thickness?: number;
  lazy?: boolean;
  children?: ReactNode;
}) {
  const opening = text ? openingLines(text) : "";
  return (
    <div
      className="hbk"
      style={{ "--hbk-scale": scale, "--hbk-thick": `${thickness}px` } as CSSProperties}
    >
      <div className="hbk-block">
        <div className="hbk-spine" aria-hidden="true" />
        <div className="hbk-edge" aria-hidden="true" />

        <div className="hbk-paper">
          <div className="hbk-page">
            <p className="hbk-page-title">{title}</p>
            {author && <p className="hbk-page-by">{author}</p>}
            <span className="hbk-page-rule" aria-hidden="true" />
            {opening && <p className="hbk-page-text">{opening}</p>}
            {imprint && <p className="hbk-page-mark">{imprint}</p>}
          </div>
        </div>

        <div className="hbk-cover">
          <div className="hbk-face">
            <Poster src={cover} seed={seed} ratio="portrait" lazy={lazy} />
          </div>
          <div className="hbk-inside" aria-hidden="true" />
        </div>

        {children}
      </div>
    </div>
  );
}
