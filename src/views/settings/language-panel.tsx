import { Github } from "lucide-react";
import { useState } from "react";
import { useSettings } from "@/lib/settings";
import { openUrl } from "@/lib/window";
import { Section, ToggleRow } from "./shared";
import { LanguagesPicker } from "./streaming-panel";

export function LanguagePanel() {
  const { settings, update } = useSettings();
  const [blockDraft, setBlockDraft] = useState(settings.trackBlockWords.join(", "));
  return (
    <>
    <Section
      title="Subtitle languages"
      subtitle="When playback starts, Harbor automatically finds and loads a subtitle in one of these languages, so you never have to search by hand. The first available match wins, so put your main language first."
    >
      <LanguagesPicker
        value={settings.preferredSubLangs}
        onChange={(langs) => update({ preferredSubLangs: langs })}
      />
      <ToggleRow
        label="Start with subtitles off"
        sub="Harbor still finds and loads subtitles so they're one click away in the player, it just won't turn them on automatically."
        value={settings.subtitlesOffByDefault}
        onChange={(v) => update({ subtitlesOffByDefault: v })}
      />
      <ToggleRow
        label="Prefer embedded subtitles"
        sub="When the file ships its own subtitle track, keep it selected instead of switching to a downloaded one. Embedded tracks are usually the best synced."
        value={settings.preferEmbeddedSubs}
        onChange={(v) => update({ preferEmbeddedSubs: v })}
      />
      <ToggleRow
        label="Forced subs with native audio"
        sub="When the audio already matches your subtitle language, pick a forced track (foreign dialogue and signs only) instead of full subtitles. If the file has no forced track, subtitles stay off."
        value={settings.forcedSubsWhenNativeAudio}
        onChange={(v) => update({ forcedSubsWhenNativeAudio: v })}
      />
      <div className="flex flex-col gap-1.5 pt-1">
        <p className="text-[13.5px] font-medium text-ink">Never auto-select tracks containing</p>
        <p className="text-[12px] leading-relaxed text-ink-subtle">
          Comma-separated words. Audio or subtitle tracks whose name matches any of these are skipped
          during automatic selection. You can still pick them by hand in the player.
        </p>
        <input
          type="text"
          value={blockDraft}
          onChange={(e) => {
            setBlockDraft(e.target.value);
            update({
              trackBlockWords: e.target.value
                .split(",")
                .map((w) => w.trim())
                .filter(Boolean),
            });
          }}
          placeholder="commentary, descriptive"
          className="h-11 w-full max-w-[340px] rounded-xl border border-edge-soft bg-canvas/40 px-3.5 text-[13.5px] text-ink outline-none transition-colors focus:border-edge"
        />
      </div>
    </Section>

    <Section
      title="Metadata language"
      subtitle="Titles, overviews, and taglines from TMDB display in this language when a translation exists. Needs a TMDB key."
    >
      <select
        value={settings.tmdbLanguage}
        onChange={(e) => update({ tmdbLanguage: e.target.value })}
        className="h-11 w-full max-w-[340px] rounded-xl border border-edge-soft bg-canvas/40 px-3.5 text-[13.5px] text-ink outline-none transition-colors focus:border-edge"
      >
        <option value="">English (default)</option>
        <option value="es-ES">Español (España)</option>
        <option value="es-MX">Español (Latinoamérica)</option>
        <option value="fr-FR">Français</option>
        <option value="de-DE">Deutsch</option>
        <option value="it-IT">Italiano</option>
        <option value="pt-BR">Português (Brasil)</option>
        <option value="pt-PT">Português (Portugal)</option>
        <option value="ja-JP">日本語</option>
        <option value="ko-KR">한국어</option>
        <option value="zh-CN">中文 (简体)</option>
        <option value="ar-SA">العربية</option>
        <option value="tr-TR">Türkçe</option>
        <option value="ru-RU">Русский</option>
        <option value="hi-IN">हिन्दी</option>
        <option value="pl-PL">Polski</option>
        <option value="nl-NL">Nederlands</option>
        <option value="uk-UA">Українська</option>
      </select>
    </Section>

    <Section
      title="Audio languages"
      subtitle="When a release ships multiple audio tracks, Harbor selects the first match from this list."
    >
      <LanguagesPicker
        value={settings.preferredAudioLangs}
        onChange={(langs) => update({ preferredAudioLangs: langs })}
      />
    </Section>

    <Section
      title="Preferred languages"
      subtitle="Streams in these languages rank first. Toggle below to drop everything else."
    >
      <LanguagesPicker
        value={settings.preferredLanguages}
        onChange={(langs) => update({ preferredLanguages: langs })}
      />
      <ToggleRow
        label="Only show streams in my languages"
        sub="Hides streams with no detected preferred language. Multi-audio releases count as a match."
        value={settings.requirePreferredLanguage}
        onChange={(v) => update({ requirePreferredLanguage: v })}
      />
      <div className="mt-2 flex flex-col gap-3 rounded-xl border border-edge-soft bg-canvas/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] leading-relaxed text-ink-muted sm:max-w-[480px]">
          Heads up: Harbor was built in English. Multi-language support is partial,
          so your addons usually catch what Harbor's own filters miss. If you speak
          another language and want to help fill the gaps, the source is open.
        </p>
        <button
          onClick={() => openUrl("https://github.com/harborstremio/harbor")}
          className="flex shrink-0 items-center gap-2 self-start rounded-full border border-edge-soft px-4 py-2 text-[12.5px] font-semibold text-ink transition-colors hover:border-edge sm:self-auto"
        >
          <Github size={13} strokeWidth={2.2} />
          Contribute on GitHub
        </button>
      </div>
    </Section>
    </>
  );
}
