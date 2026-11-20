import React, { createContext, useContext } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BackgroundFX, PressScale, PanelGlow, useSettledFocus, type PressState } from './motion';
import { BrandMark } from './brand';
import { Backdrop, Glass } from './glass';
import { C, F, toneColor } from '../theme';
import { lh, noSpacing, t } from '../i18n';
import type { Band } from '../lib/scoring';

type Children = { children?: React.ReactNode };
export type IconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * Place first inside a ScrollView whose content starts with a dark header. It paints the header colour
 * above the content, so pulling past the top (iOS bounce) shows more header instead of a pale gap, and
 * switches the status bar to light text while this screen is on view.
 */
export function DarkTop({ color = C.forest }: { color?: string }) {
  const focused = useIsFocused();
  return (
    <>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: -1000, height: 1000, backgroundColor: color }} />
      {focused ? <StatusBar style="light" /> : null}
    </>
  );
}

/** Height the floating tab bar covers at the foot of the screen (0 when there is none). */
export const TabBarSpace = createContext(0);

/** Screen with the herbal background effects behind the content. */
export function Screen({ children, scroll = true, fx = 1, padded = true, flushTop = false, bottom = 28, maxWidth, style }: Children & { scroll?: boolean; fx?: number; padded?: boolean; flushTop?: boolean; bottom?: number; maxWidth?: number; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  const barSpace = useContext(TabBarSpace);
  const focused = useIsFocused();
  const settled = useSettledFocus();
  // While a tab switch is under way (focus changed, not yet settled) Android draws this screen once into
  // a GPU texture, so the transition moves a picture instead of redrawing the screen every frame.
  const moving = focused !== settled;
  const pad: ViewStyle = { paddingTop: flushTop ? 0 : insets.top + 12, paddingBottom: (barSpace || insets.bottom) + bottom, paddingHorizontal: padded ? 20 : 0 };
  const inner: ViewStyle | null = maxWidth ? { width: '100%', maxWidth, alignSelf: 'center' } : null;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }} renderToHardwareTextureAndroid={moving && Platform.OS === 'android'}>
      {/* The leaf layer is a blur target on Android 12+, so glass tiles over it frost it. */}
      <Backdrop layer={fx ? <BackgroundFX intensity={fx} paused={!settled} /> : null}>
        {scroll ? (
          <ScrollView contentContainerStyle={[pad, inner, style]} showsVerticalScrollIndicator={false} scrollEventThrottle={16} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, pad, inner, style]}>{children}</View>
        )}
      </Backdrop>
    </View>
  );
}

/** Centered max-width column used by the website sections. */
export function Container({ children, max = 1240, style }: Children & { max?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ width: '100%', maxWidth: max, alignSelf: 'center', paddingHorizontal: 28 }, style]}>{children}</View>;
}

/** Gloock heading with an optional Newsreader-italic accent tail ("Return to your natural *balance.*"). */
export function Title({ children, accent, size = 32, color = C.ink, accentColor = C.moss, style, center }: Children & { accent?: string; size?: number; color?: string; accentColor?: string; style?: StyleProp<TextStyle>; center?: boolean }) {
  return (
    <Text accessibilityRole="header" style={[{ fontFamily: F.display, fontSize: size, lineHeight: lh(size, Math.round(size * 1.12)), color }, center && { textAlign: 'center' }, style]}>
      {children}
      {accent ? (
        <Text style={{ fontFamily: F.italic, color: accentColor }}>
          {children ? ' ' : ''}
          {accent}
        </Text>
      ) : null}
    </Text>
  );
}

export const H2 = ({ children, style }: Children & { style?: StyleProp<TextStyle> }) => (
  <Text accessibilityRole="header" style={[styles.h2, { fontFamily: F.display, lineHeight: lh(23, 29) }, style]}>
    {children}
  </Text>
);
export const It = ({ children, style }: Children & { style?: StyleProp<TextStyle> }) => <Text style={[styles.it, { fontFamily: F.italic }, style]}>{children}</Text>;
export const Body = ({ children, style }: Children & { style?: StyleProp<TextStyle> }) => <Text style={[styles.body, { fontFamily: F.body }, style]}>{children}</Text>;
export const Label = ({ children, style }: Children & { style?: StyleProp<TextStyle> }) => <Text style={[styles.label, { fontFamily: F.semi }, style, noSpacing()]}>{children}</Text>;
export const Deva = ({ children, style }: Children & { style?: StyleProp<TextStyle> }) => <Text style={[styles.deva, { fontFamily: F.deva }, style]}>{children}</Text>;

/** Small uppercase label with the leading rule used on the V5 website ("—— आयुर्वेद · …"). */
export function Kicker({ children, color = C.moss }: Children & { color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: 28, height: 1, backgroundColor: color }} />
      <Label style={{ color, fontSize: 12 }}>{children}</Label>
    </View>
  );
}

type ButtonVariant = 'primary' | 'ghost' | 'light' | 'link';

export function Button({ title, onPress, variant = 'primary', icon, disabled, size = 'md', style }: { title: string; onPress?: () => void; variant?: ButtonVariant; icon?: IconName; disabled?: boolean; size?: 'sm' | 'md' | 'lg'; style?: StyleProp<ViewStyle> }) {
  const primary = variant === 'primary';
  const fg = primary ? C.onDark : C.ink;
  const h = size === 'lg' ? 58 : size === 'sm' ? 46 : 54;
  const fs = size === 'lg' ? 17 : size === 'sm' ? 15 : 16;
  if (variant === 'link') {
    return (
      <Pressable accessibilityRole="link" onPress={onPress} style={({ hovered }: PressState) => [{ paddingVertical: 12, paddingHorizontal: 4 }, style, hovered && { opacity: 0.75 }] as StyleProp<ViewStyle>}>
        <Text style={{ fontFamily: F.semi, fontSize: fs, color: C.ink, textDecorationLine: 'underline' }}>{title}</Text>
      </Pressable>
    );
  }
  return (
    <PressScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={title}
      hoverStyle={primary ? { backgroundColor: C.deep, transform: [{ translateY: -2 }] } : variant === 'ghost' ? { backgroundColor: C.mist } : { backgroundColor: C.leaf }}
      style={[styles.btn, { minHeight: h, paddingHorizontal: size === 'lg' ? 28 : 22 }, primary ? styles.btnPrimary : variant === 'light' ? styles.btnLight : styles.btnGhost, disabled && { opacity: 0.45 }, style]}
    >
      <Text style={[styles.btnText, { fontFamily: F.semi }, { color: fg, fontSize: fs }]}>{title}</Text>
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
    </PressScale>
  );
}

export const Card = ({ children, style }: Children & { style?: StyleProp<ViewStyle> }) => <View style={[styles.card, style]}>{children}</View>;

export function DarkPanel({ children, style }: Children & { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.dark, style]}>
      <PanelGlow />
      {children}
    </View>
  );
}

/**
 * The AHI lotus. On light grounds it stands on its own; `light` is for dark grounds, where it sits on a
 * paper disc so its forest outline still reads.
 */
export function Logo({ size = 36, light }: { size?: number; light?: boolean }) {
  if (!light) return <BrandMark size={size} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center' }}>
      <BrandMark size={size} scale={0.78} />
    </View>
  );
}

export function Chip({ label, icon, tone = 'gold' }: { label: string; icon?: IconName; tone?: 'gold' | 'leaf' | 'mist' }) {
  const bg = tone === 'gold' ? C.goldSoft : tone === 'leaf' ? C.leaf : C.mist;
  const fg = tone === 'gold' ? C.goldText : C.forest;
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      {icon ? <Ionicons name={icon} size={14} color={fg} /> : null}
      <Text style={{ fontFamily: F.semi, fontSize: 13, color: fg }}>{label}</Text>
    </View>
  );
}

/** Band label paired with its colour — colour is never the only signal. */
export function BandTag({ band, style }: { band: Band | null; style?: StyleProp<TextStyle> }) {
  if (!band) return null;
  return <Text style={[{ fontFamily: F.semi, fontSize: 12.5, color: toneColor(band.tone) }, style]}>{band.short}</Text>;
}

export function RoundButton({ icon, label, onPress, dark }: { icon: IconName; label: string; onPress: () => void; dark?: boolean }) {
  // Floats over headers, so on iOS 26 it is a drop of liquid glass; elsewhere the outlined/frosted disc.
  return (
    <Glass
      style={styles.roundGlass}
      fallback={[styles.round, dark ? { borderColor: 'rgba(244,242,234,0.3)' } : { backgroundColor: 'rgba(251,250,245,0.8)' }]}
      scheme={dark ? 'dark' : 'light'}
      variant="clear"
      interactive
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ hovered }: PressState) => [styles.roundHit, hovered && { backgroundColor: dark ? 'rgba(244,242,234,0.12)' : C.mist }] as StyleProp<ViewStyle>}
      >
        <Ionicons name={icon} size={20} color={dark ? C.onDark : C.ink} />
      </Pressable>
    </Glass>
  );
}

export function BackHeader({ title, right, dark, fallback = '/home' }: { title: string; right?: React.ReactNode; dark?: boolean; fallback?: string }) {
  const router = useRouter();
  const col = dark ? C.onDark : C.ink;
  return (
    <View style={styles.backRow}>
      <RoundButton icon="arrow-back" label={t('Back')} dark={dark} onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback as never))} />
      <Text style={{ fontFamily: F.semi, fontSize: 15, color: col }}>{title}</Text>
      <View style={{ minWidth: 44, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function LeafDivider() {
  return (
    <Svg width={60} height={20} viewBox="0 0 60 20" style={{ alignSelf: 'center' }}>
      <Path d="M2 10 H22 M38 10 H58" stroke={C.sage} strokeWidth={1} />
      <Path d="M30 3 C34 6 34 14 30 17 C26 14 26 6 30 3Z" fill="none" stroke={C.moss} strokeWidth={1.2} />
    </Svg>
  );
}

/** Round sage icon badge used beside module names. */
export function IconBadge({ icon, done, size = 44, dark }: { icon: string; done?: boolean; size?: number; dark?: boolean }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: done || dark ? C.forest : C.mist, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={(done ? 'checkmark' : `${icon}-outline`) as IconName} size={size * 0.46} color={done || dark ? C.onDark : C.forest} />
    </View>
  );
}

/** A stem with one leaf per module — filled leaves are complete, pale ones in progress. */
export function LeafProgress({ states, width = 300, height = 44 }: { states: ('done' | 'part' | 'none')[]; width?: number; height?: number }) {
  const n = states.length;
  const W = 300;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${W} 44`} accessibilityLabel={t('{n} of {total} complete', { n: states.filter((s) => s === 'done').length, total: n })}>
      <Path d="M8 36 C 80 28, 220 44, 292 30" fill="none" stroke={C.sage} strokeWidth={1.2} />
      {states.map((s, i) => {
        const x = 26 + i * ((W - 52) / Math.max(1, n - 1));
        const y = 34 - Math.sin((i / Math.max(1, n - 1)) * Math.PI) * 2;
        const d = `M${x} ${y} C ${x - 12} ${y - 6}, ${x - 10} ${y - 22}, ${x} ${y - 28} C ${x + 10} ${y - 22}, ${x + 12} ${y - 6}, ${x} ${y} Z`;
        return <Path key={i} d={d} fill={s === 'done' ? C.moss : s === 'part' ? C.leaf : C.paper} stroke={C.moss} strokeWidth={1.1} />;
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  h2: { fontSize: 23, lineHeight: 29, color: C.ink },
  it: { fontSize: 18, color: C.moss },
  body: { fontSize: 16, lineHeight: 25, color: C.body },
  label: { fontSize: 11.5, letterSpacing: 1.6, textTransform: 'uppercase', color: C.moss },
  deva: { fontSize: 20, lineHeight: 34, color: C.forest },
  btn: { borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnPrimary: { backgroundColor: C.forest, shadowColor: C.deep, shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  btnGhost: { backgroundColor: 'rgba(251,250,245,0.9)', borderWidth: 1, borderColor: C.lineStrong },
  btnLight: { backgroundColor: C.pale },
  btnText: { fontSize: 16 },
  card: { backgroundColor: 'rgba(251,250,245,0.92)', borderRadius: 22, borderWidth: 1, borderColor: C.line, padding: 20 },
  dark: { backgroundColor: C.forest, borderRadius: 24, padding: 20, overflow: 'hidden' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  backRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  round: { borderWidth: 1, borderColor: C.line },
  roundGlass: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  roundHit: { width: '100%', height: '100%', borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
