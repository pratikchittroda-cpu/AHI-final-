import { useWindowDimensions } from 'react-native';
import type { Tone } from './lib/scoring';

/** V5 — herbal green on ivory, with sage and moss. */
export const C = {
  bg: '#F4F2EA',
  paper: '#FBFAF5',
  mist: '#E9EEE3',
  pale: '#DCE5D3',
  sage: '#8FA98A',
  leaf: '#B9CBB0',
  moss: '#4E6B45',
  forest: '#1F3A2B',
  deep: '#14261C',
  ink: '#1B2A21',
  body: '#3C4A41',
  muted: '#56645A',
  line: '#DCDCCF',
  lineSoft: '#ECEDE4',
  lineRow: '#C9CDBF',
  lineStrong: '#BFC5B6',
  gold: '#B08D3C',
  goldSoft: '#F1E9D2',
  goldText: '#7A5E22',
  care: '#9A5A2A',
  onDark: '#F4F2EA',
  onDarkMuted: '#C9D3C4',
  onDarkLabel: '#A9B9A3',
  vata: '#7FA3A8',
  pitta: '#C8A85A',
  kapha: '#4E6B45',
  radio: '#8A958C',
} as const;

export type FontRole = 'display' | 'italic' | 'body' | 'medium' | 'semi' | 'bold';

const LATIN: Record<FontRole, string> = {
  display: 'Gloock_400Regular',
  italic: 'Newsreader_400Regular_Italic',
  body: 'InstrumentSans_400Regular',
  medium: 'InstrumentSans_500Medium',
  semi: 'InstrumentSans_600SemiBold',
  bold: 'InstrumentSans_700Bold',
};

let script: Record<FontRole, string> | null = null;

/**
 * Hindi, Gujarati and Tamil need fonts drawn for their scripts: Gloock and Instrument Sans have no
 * Indic letters, and borrowing them glyph by glyph detaches the vowel signs. `setScriptFonts` swaps
 * every role for a script font (null = the V5 Latin fonts). Read at render, so screens follow it.
 */
export function setScriptFonts(fonts: Record<FontRole, string> | null) {
  script = fonts;
}

export const F = {
  get display() {
    return script?.display ?? LATIN.display;
  },
  get italic() {
    return script?.italic ?? LATIN.italic;
  },
  get body() {
    return script?.body ?? LATIN.body;
  },
  get medium() {
    return script?.medium ?? LATIN.medium;
  },
  get semi() {
    return script?.semi ?? LATIN.semi;
  },
  get bold() {
    return script?.bold ?? LATIN.bold;
  },
  deva: 'TiroDevanagariSanskrit_400Regular',
};

export const toneColor = (tone?: Tone) => (tone === 'good' ? C.moss : tone === 'watch' ? C.gold : tone === 'care' ? C.care : C.lineStrong);

export const DOSHA_COLOR: Record<string, string> = { 'Vāta': C.vata, Pitta: C.pitta, Kapha: C.kapha };

/** Desktop-style layouts kick in at this width (web, tablets in landscape). */
export const WIDE = 960;

export function useLayout() {
  const { width, height } = useWindowDimensions();
  return { width, height, wide: width >= WIDE, tablet: width >= 640 };
}
