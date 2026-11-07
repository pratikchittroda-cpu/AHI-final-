import { ALL_MODULES, GROUPS } from '../data/modules';
import { BANDS, DOSHA_NAME } from '../lib/scoring';
import { SHLOKA, KALAS, DEFAULT_ROUTINE, GUIDANCE, GOALS, DOSHAS, HERBS, AGNI_TYPES } from '../data/content';
import { getLanguage, setLanguage, t, type Lang } from './index';

/**
 * The app's data (domains, questions and answer options, bands, tips, routine, doṣas, herbs…) is
 * translated in place: each text field is reset from its English original through `t()`. Screens read
 * these objects directly, so they show the current language without wrapping each use.
 */
const ROOTS: Record<string, unknown> = { ALL_MODULES, GROUPS, BANDS, DOSHA_NAME, SHLOKA, KALAS, DEFAULT_ROUTINE, GUIDANCE, GOALS, DOSHAS, HERBS, AGNI_TYPES };

/** Fields that hold readable text. Everything else (ids, icons, colours, times, Devanāgarī, Latin names) is left alone. */
const TEXT_KEYS = new Set(['en', 'title', 'blurb', 'why', 'source', 'context', 'text', 'section', 'domain', 'label', 'short', 'body', 'meaning', 'advice', 'items', 'note', 'elements', 'name', 'tip', 'english', 'bandLabels', 'vata', 'pitta', 'kapha']);

// The English originals, captured once per app session. Kept on the global object so a hot reload of
// this file (which can happen while the data is already translated) never mistakes a translation for English.
const store = globalThis as typeof globalThis & { __ahiEnglish?: Record<string, unknown> };
store.__ahiEnglish ??= JSON.parse(JSON.stringify(ROOTS)) as Record<string, unknown>;
const ENGLISH = store.__ahiEnglish;

type Node = Record<string, unknown> | unknown[];

function walk(live: Node, english: Node, visit: (text: string) => string, textual: boolean) {
  if (Array.isArray(english)) {
    english.forEach((v, i) => {
      if (typeof v === 'string') {
        if (textual) (live as unknown[])[i] = visit(v);
      } else if (v && typeof v === 'object') walk((live as unknown[])[i] as Node, v as Node, visit, false);
    });
    return;
  }
  for (const [k, v] of Object.entries(english)) {
    if (typeof v === 'string') {
      if (TEXT_KEYS.has(k)) (live as Record<string, unknown>)[k] = visit(v);
    } else if (v && typeof v === 'object') walk((live as Record<string, unknown>)[k] as Node, v as Node, visit, TEXT_KEYS.has(k));
  }
}

let applied: Lang = 'en';

/** Switch the app's language: interface strings and every data text field. */
export function setAppLanguage(lang: Lang) {
  if (lang === applied && lang === getLanguage()) return;
  setLanguage(lang);
  applied = lang;
  for (const key of Object.keys(ROOTS)) walk(ROOTS[key] as Node, ENGLISH[key] as Node, (s) => t(s), false);
}

/** Every English data string that needs a translation (for the completeness check). */
export function dataStrings(): string[] {
  const out = new Set<string>();
  for (const key of Object.keys(ENGLISH)) walk(JSON.parse(JSON.stringify(ENGLISH[key])) as Node, ENGLISH[key] as Node, (s) => (out.add(s), s), false);
  return [...out];
}
