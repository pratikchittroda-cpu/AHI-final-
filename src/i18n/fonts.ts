import { Platform } from 'react-native';
import * as Font from 'expo-font';
import { setScriptFonts, type FontRole } from '../theme';
import type { Lang } from './index';

type Script = Exclude<Lang, 'en'>;

/** Noto Serif for headings and accents, Noto Sans for text, one family per script. */
const FILES: Record<Script, Record<string, number>> = {
  hi: {
    NotoSerifDevanagari_400Regular: require('@expo-google-fonts/noto-serif-devanagari/400Regular/NotoSerifDevanagari_400Regular.ttf'),
    NotoSerifDevanagari_600SemiBold: require('@expo-google-fonts/noto-serif-devanagari/600SemiBold/NotoSerifDevanagari_600SemiBold.ttf'),
    NotoSansDevanagari_400Regular: require('@expo-google-fonts/noto-sans-devanagari/400Regular/NotoSansDevanagari_400Regular.ttf'),
    NotoSansDevanagari_500Medium: require('@expo-google-fonts/noto-sans-devanagari/500Medium/NotoSansDevanagari_500Medium.ttf'),
    NotoSansDevanagari_600SemiBold: require('@expo-google-fonts/noto-sans-devanagari/600SemiBold/NotoSansDevanagari_600SemiBold.ttf'),
    NotoSansDevanagari_700Bold: require('@expo-google-fonts/noto-sans-devanagari/700Bold/NotoSansDevanagari_700Bold.ttf'),
  },
  gu: {
    NotoSerifGujarati_400Regular: require('@expo-google-fonts/noto-serif-gujarati/400Regular/NotoSerifGujarati_400Regular.ttf'),
    NotoSerifGujarati_600SemiBold: require('@expo-google-fonts/noto-serif-gujarati/600SemiBold/NotoSerifGujarati_600SemiBold.ttf'),
    NotoSansGujarati_400Regular: require('@expo-google-fonts/noto-sans-gujarati/400Regular/NotoSansGujarati_400Regular.ttf'),
    NotoSansGujarati_500Medium: require('@expo-google-fonts/noto-sans-gujarati/500Medium/NotoSansGujarati_500Medium.ttf'),
    NotoSansGujarati_600SemiBold: require('@expo-google-fonts/noto-sans-gujarati/600SemiBold/NotoSansGujarati_600SemiBold.ttf'),
    NotoSansGujarati_700Bold: require('@expo-google-fonts/noto-sans-gujarati/700Bold/NotoSansGujarati_700Bold.ttf'),
  },
  ta: {
    NotoSerifTamil_400Regular: require('@expo-google-fonts/noto-serif-tamil/400Regular/NotoSerifTamil_400Regular.ttf'),
    NotoSerifTamil_600SemiBold: require('@expo-google-fonts/noto-serif-tamil/600SemiBold/NotoSerifTamil_600SemiBold.ttf'),
    NotoSansTamil_400Regular: require('@expo-google-fonts/noto-sans-tamil/400Regular/NotoSansTamil_400Regular.ttf'),
    NotoSansTamil_500Medium: require('@expo-google-fonts/noto-sans-tamil/500Medium/NotoSansTamil_500Medium.ttf'),
    NotoSansTamil_600SemiBold: require('@expo-google-fonts/noto-sans-tamil/600SemiBold/NotoSansTamil_600SemiBold.ttf'),
    NotoSansTamil_700Bold: require('@expo-google-fonts/noto-sans-tamil/700Bold/NotoSansTamil_700Bold.ttf'),
  },
};

const FAMILY: Record<Script, { serif: string; sans: string }> = {
  hi: { serif: 'NotoSerifDevanagari', sans: 'NotoSansDevanagari' },
  gu: { serif: 'NotoSerifGujarati', sans: 'NotoSansGujarati' },
  ta: { serif: 'NotoSerifTamil', sans: 'NotoSansTamil' },
};

const roles = (s: Script): Record<FontRole, string> => {
  const { serif, sans } = FAMILY[s];
  return { display: `${serif}_600SemiBold`, italic: `${serif}_400Regular`, body: `${sans}_400Regular`, medium: `${sans}_500Medium`, semi: `${sans}_600SemiBold`, bold: `${sans}_700Bold` };
};

/** The system font shapes every script correctly; it stands in while a script's fonts download. */
const SYSTEM = Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui' }) as string;
const SYSTEM_ROLES: Record<FontRole, string> = { display: SYSTEM, italic: SYSTEM, body: SYSTEM, medium: SYSTEM, semi: SYSTEM, bold: SYSTEM };

const loaded = new Set<Script>();

/** Applies the fonts for a language right away (system font until its own fonts are loaded). */
export function applyScriptFonts(lang: Lang) {
  if (lang === 'en') setScriptFonts(null);
  else setScriptFonts(loaded.has(lang) ? roles(lang) : SYSTEM_ROLES);
}

/** Loads a language's fonts the first time it is chosen. Resolves true once they are in use. */
export async function loadScriptFonts(lang: Lang): Promise<boolean> {
  if (lang === 'en' || loaded.has(lang)) return false;
  await Font.loadAsync(FILES[lang]);
  loaded.add(lang);
  return true;
}
