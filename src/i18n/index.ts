import hi from './hi';
import gu from './gu';
import ta from './ta';

/**
 * Translations. Every piece of on-screen text goes through `t(english)`: the English text is the key,
 * so a missing translation simply shows the English. Placeholders like {n} are filled from `vars`.
 *
 * The current language lives in app state (AhiContext), which sets it here before rendering; every
 * screen reads that state, so a language change re-renders the app in the new language.
 */
export type Lang = 'en' | 'hi' | 'gu' | 'ta';

export const LANGUAGES: { id: Lang; name: string; native: string }[] = [
  { id: 'en', name: 'English', native: 'English' },
  { id: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { id: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { id: 'ta', name: 'Tamil', native: 'தமிழ்' },
];

const DICTS: Record<Exclude<Lang, 'en'>, Record<string, string>> = { hi, gu, ta };
const LOCALES: Record<Lang, string> = { en: 'en-IN', hi: 'hi-IN', gu: 'gu-IN', ta: 'ta-IN' };

let current: Lang = 'en';

export function setLanguage(lang: Lang) {
  current = lang;
}

export function getLanguage(): Lang {
  return current;
}

/**
 * Letter spacing pulls apart the joined letters of Indian scripts, so spaced-out text styles
 * (small capitals labels, tight headings) drop it outside English.
 */
export function noSpacing(): { letterSpacing?: number } {
  return current === 'en' ? {} : { letterSpacing: 0 };
}

/**
 * Line height for headings. Indian scripts carry vowel signs above and below the letters, so a line
 * height tuned for Latin (1.0–1.25 × the size) clips them; they get at least 1.5 × the size.
 */
export function lh(size: number, latin: number): number {
  return current === 'en' ? latin : Math.max(latin, Math.round(size * 1.5));
}

/** Locale for dates in the current language. */
export function locale(): string {
  return LOCALES[current];
}

export function t(text: string, vars?: Record<string, string | number>): string {
  const base = current === 'en' ? text : (DICTS[current][text] ?? text);
  return vars ? base.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : base;
}

/** All dictionaries, for the completeness check. */
export const DICTIONARIES = DICTS;
