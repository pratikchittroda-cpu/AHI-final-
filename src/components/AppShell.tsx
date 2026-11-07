import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Logo, TabBarSpace, type IconName } from './ui';
import { FOCUS_RING, FadeIn, PanelGlow, Specks, Sprig, type PressState } from './motion';
import { useAhi } from '../state/AhiContext';
import { Glass, useBlurTarget, useGlass } from './glass';
import { C, F, useLayout } from '../theme';
import { lh, noSpacing, t } from '../i18n';

interface Tab {
  href: string;
  label: string;
  short: string;
  icon: string;
  mobile: boolean;
}

const TABS: Tab[] = [
  { href: '/home', label: 'Today', short: 'Today', icon: 'home', mobile: true },
  { href: '/report', label: 'My index', short: 'Index', icon: 'leaf', mobile: true },
  { href: '/assess', label: 'Assessment', short: 'Assess', icon: 'clipboard', mobile: true },
  { href: '/plan', label: 'Daily rhythm', short: 'Plan', icon: 'sunny', mobile: true },
  { href: '/herbs', label: 'Food & herbs', short: 'Herbs', icon: 'restaurant', mobile: false },
  { href: '/profile', label: 'Settings', short: 'Me', icon: 'person', mobile: true },
];

const SIDE_W = 240;
const ITEM_H = 46;
const ITEM_GAP = 4;

/** One sidebar link: light text on the dark panel, a soft wash on hover, the icon nudging right. */
function SideItem({ tab, on, onPress }: { tab: Tab; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={({ hovered, focused }: PressState) => [styles.sideItem, !on && hovered ? styles.sideHover : null, focused && FOCUS_RING] as StyleProp<ViewStyle>}
    >
      {({ hovered }: PressState) => (
        <>
          <View style={{ transform: [{ translateX: hovered && !on ? 3 : 0 }] }}>
            <Ionicons name={(on ? tab.icon : `${tab.icon}-outline`) as IconName} size={21} color={on ? C.leaf : hovered ? C.onDark : C.onDarkLabel} />
          </View>
          <Text style={{ fontFamily: on ? F.semi : F.medium, fontSize: 15, color: on ? C.onDark : hovered ? C.onDark : C.onDarkMuted }}>{t(tab.label)}</Text>
        </>
      )}
    </Pressable>
  );
}

/**
 * Dark sidebar (wide screens): a deep forest gradient with a drifting glow, rising light specks and a
 * swaying sprig behind the day card. The active highlight springs from item to item.
 */
function Sidebar() {
  const router = useRouter();
  const path = usePathname();
  const { height } = useLayout();
  const { profile, routine, signOut, completed } = useAhi();
  const done = Object.values(routine.done).filter(Boolean).length;
  const name = profile?.name?.trim();
  const activeIndex = TABS.findIndex((tb) => tb.href === path);
  const y = useSharedValue(Math.max(0, activeIndex) * (ITEM_H + ITEM_GAP));
  useEffect(() => {
    if (activeIndex >= 0) y.set(withSpring(activeIndex * (ITEM_H + ITEM_GAP), TAB_SPRING));
  }, [activeIndex, y]);
  const highlight = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));

  return (
    <View style={styles.side} accessibilityRole="menu" aria-label="App">
      <LinearGradient colors={[C.forest, C.deep, '#0F1D15']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      <PanelGlow width={SIDE_W} />
      <Specks width={SIDE_W} height={height} />
      <View pointerEvents="none" style={styles.sprig}>
        <Sprig width={190} height={240} />
      </View>

      <FadeIn>
        <Pressable accessibilityRole="link" accessibilityLabel={t('AHI home page')} onPress={() => router.push('/')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8 }}>
          <Logo size={32} light />
          <Text style={{ fontFamily: F.display, fontSize: 20, color: C.onDark }}>AHI</Text>
        </Pressable>
      </FadeIn>

      <View style={{ gap: ITEM_GAP }}>
        {activeIndex >= 0 ? (
          <Reanimated.View pointerEvents="none" style={[styles.highlight, highlight]}>
            <View style={styles.highlightBar} />
          </Reanimated.View>
        ) : null}
        {TABS.map((tb, i) => (
          <FadeIn key={tb.href} delay={60 + i * 45} from={10}>
            <SideItem tab={tb} on={i === activeIndex} onPress={() => router.navigate(tb.href as never)} />
          </FadeIn>
        ))}
      </View>

      <FadeIn delay={380} style={{ marginTop: 'auto' }}>
        <View style={styles.streak}>
          <Text style={[styles.lbl, { fontFamily: F.semi }, noSpacing()]}>{t('Today')}</Text>
          <Text style={{ fontFamily: F.display, fontSize: 30, lineHeight: lh(30, 32), color: C.onDark }}>{t('{n} done', { n: done })}</Text>
          <Text style={{ fontFamily: F.body, fontSize: 13, lineHeight: 19, color: C.onDarkMuted }}>{t('of your Dinacaryā · {n} of 9 domains scored', { n: completed })}</Text>
        </View>
      </FadeIn>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 6 }}>
        <View style={styles.avatar}>
          <Text style={{ fontFamily: F.display, fontSize: 16, color: C.forest }}>{(name || 'A')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontFamily: F.semi, fontSize: 14, color: C.onDark }}>{name || t('Guest')}</Text>
          <Text style={{ fontFamily: F.body, fontSize: 12, color: C.onDarkLabel }}>{profile ? t('Individual') : t('Saved on this device')}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={profile ? t('Sign out') : t('Sign in')}
          onPress={() => {
            if (profile) signOut();
            router.push('/sign-in');
          }}
          style={({ hovered, focused }: PressState) => [styles.signBtn, hovered && styles.sideHover, focused && FOCUS_RING] as StyleProp<ViewStyle>}
        >
          <Ionicons name={profile ? 'log-out-outline' : 'log-in-outline'} size={21} color={C.onDarkMuted} />
        </Pressable>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Floating pill tab bar (phones)                                      */
/* ------------------------------------------------------------------ */
const BAR_H = 64;
const BAR_PAD = 6;
const PILL_H = BAR_H - BAR_PAD * 2;
const ICON = 22;
const LABEL_GAP = 8;
const PILL_SIDE = 20; // padding either side of icon + name inside the open pill
const SLOT = 160; // fixed box each tab's icon and name are drawn in; wider than any open pill

/** The pill's spring. Damping ratio ≈ 0.9: quick, settled, no wobble; about 350 ms to rest. */
export const TAB_SPRING = { stiffness: 280, damping: 30, mass: 1 };

interface BarTab {
  name: string; // route name inside (app)
  label: string;
  icon: string;
}

const BAR_TABS: BarTab[] = [
  { name: 'home', label: 'Today', icon: 'home' },
  { name: 'report', label: 'Index', icon: 'analytics' },
  { name: 'assess', label: 'Assess', icon: 'add-circle' },
  { name: 'plan', label: 'Plan', icon: 'partly-sunny' },
  { name: 'profile', label: 'Me', icon: 'person' },
];
const N = BAR_TABS.length;

/** Space the floating bar covers, for screens to pad their content. */
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return BAR_H + Math.max(insets.bottom, 12) + 14;
}

const openness = (i: number, pos: number) => {
  'worklet';
  return Math.max(0, 1 - Math.abs(pos - i));
};

/** Left edge and width of tab i while the active position slides through `pos`. */
function slot(i: number, pos: number, total: number, open: number[]) {
  'worklet';
  let openNow = 0;
  for (let j = 0; j < N; j++) openNow += openness(j, pos) * open[j];
  const closed = (total - openNow) / (N - 1);
  let left = 0;
  for (let j = 0; j < i; j++) left += closed + openness(j, pos) * (open[j] - closed);
  return { left, width: closed + openness(i, pos) * (open[i] - closed) };
}

/** Left edge and width of the light pill while `pos` slides between tabs. */
function pillSpan(pos: number, total: number, open: number[]) {
  'worklet';
  let left = 0;
  let width = 0;
  for (let j = 0; j < N; j++) {
    left += slot(j, pos, total, open).width * Math.max(0, Math.min(1, pos - j));
    width += openness(j, pos) * open[j];
  }
  return { left, width };
}

/**
 * Icon and name of one tab. Drawn with transforms and opacity only — no width or layout changes —
 * so the whole bar animates on the UI thread's compositor without re-measuring anything.
 */
function BarGlyph({ tab, index, pos, total, open, label, glass }: { tab: BarTab; index: number; pos: SharedValue<number>; total: SharedValue<number>; open: SharedValue<number[]>; label: SharedValue<number[]>; glass: boolean }) {
  const box = useAnimatedStyle(() => {
    if (!total.value) return { opacity: 0 };
    const { left, width } = slot(index, pos.value, total.value, open.value);
    return { opacity: 1, transform: [{ translateX: left + width / 2 - SLOT / 2 }] };
  });
  const icon = useAnimatedStyle(() => {
    const p = openness(index, pos.value);
    const content = ICON + p * (LABEL_GAP + label.value[index]);
    return { transform: [{ translateX: SLOT / 2 - content / 2 }] };
  });
  const name = useAnimatedStyle(() => {
    const p = openness(index, pos.value);
    const content = ICON + p * (LABEL_GAP + label.value[index]);
    return { opacity: p * p, transform: [{ translateX: SLOT / 2 - content / 2 + ICON + LABEL_GAP - (1 - p) * 6 }] };
  });
  const tint = useAnimatedStyle(() => ({ opacity: openness(index, pos.value) }));
  const rule = useAnimatedStyle(() => ({ opacity: 1 - openness(index, pos.value) }));
  return (
    <Reanimated.View pointerEvents="none" style={[styles.glyph, box]}>
      <Reanimated.View style={[styles.icon, icon]}>
        <Ionicons name={`${tab.icon}-outline` as IconName} size={ICON} color={glass ? C.forest : C.onDarkMuted} style={StyleSheet.absoluteFill} />
        <Reanimated.View style={[StyleSheet.absoluteFill, tint]}>
          <Ionicons name={tab.icon as IconName} size={ICON} color={C.forest} />
        </Reanimated.View>
        <Reanimated.View style={[styles.rule, glass && styles.ruleGlass, rule]} />
      </Reanimated.View>
      <Reanimated.Text numberOfLines={1} style={[styles.barLabel, { fontFamily: F.bold }, styles.name, name]}>
        {t(tab.label)}
      </Reanimated.Text>
    </Reanimated.View>
  );
}

/** Dark floating pill; the active tab grows into a light pill with its name, springing between tabs. */
export function PillTabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  useAhi(); // re-render (and re-measure the names) when the language changes
  const insets = useSafeAreaInsets();
  const { wide } = useLayout();
  const glass = useGlass(true);
  const current = state.routes[state.index]?.name;
  const blurTarget = useBlurTarget(state.routes[state.index]?.key);
  const found = BAR_TABS.findIndex((tb) => tb.name === current);
  // The highlighted tab follows the route; on a route with no tab (Food & herbs) the last one stays lit.
  const [active, setActive] = useState(Math.max(0, found));
  if (found >= 0 && found !== active) setActive(found);
  const [measured, setMeasured] = useState<{ total: number; open: number[] }>({ total: 0, open: BAR_TABS.map(() => 104) });
  const pos = useSharedValue(active);
  const total = useSharedValue(0);
  const open = useSharedValue<number[]>(BAR_TABS.map(() => 104));
  const label = useSharedValue<number[]>(BAR_TABS.map(() => 44));

  // The pill moves when the navigator commits the new tab, so it also follows navigation from
  // elsewhere (buttons, links, back).
  useEffect(() => {
    if (found >= 0) pos.set(withSpring(found, TAB_SPRING));
  }, [found, pos]);

  // The light pill: two round caps and a middle strip, all moved and stretched with transforms
  // (no width animation, so nothing is laid out while it moves).
  // (Every worklet used here is defined at module level: a helper declared inside the component is not
  // reliably captured on the UI thread, which froze half the pill on iOS.)
  const capL = useAnimatedStyle(() => {
    const { left } = pillSpan(pos.value, total.value, open.value);
    return { opacity: total.value ? 1 : 0, transform: [{ translateX: left }] };
  });
  const capR = useAnimatedStyle(() => {
    const { left, width } = pillSpan(pos.value, total.value, open.value);
    return { opacity: total.value ? 1 : 0, transform: [{ translateX: left + width - PILL_H }] };
  });
  const mid = useAnimatedStyle(() => {
    const { left, width } = pillSpan(pos.value, total.value, open.value);
    const w = Math.max(0, width - PILL_H);
    return { opacity: total.value ? 1 : 0, transform: [{ translateX: left + PILL_H / 2 + w / 2 - 50 }, { scaleX: w / 100 }] };
  });

  if (wide) return null;

  const go = (i: number) => {
    const tab = BAR_TABS[i];
    const route = state.routes.find((r) => r.name === tab.name);
    if (!route) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (current === tab.name || event.defaultPrevented) return;
    navigateToTab(route.key);
  };

  // Touch targets follow the settled layout (they change once per tap, not per frame).
  const closedW = measured.total ? (measured.total - measured.open[active]) / (N - 1) : 0;

  return (
    <View pointerEvents="box-none" style={[styles.barWrap, { bottom: Math.max(insets.bottom, 12) }]}>
      {/* Measure each name once so its open pill fits it exactly. */}
      <View style={styles.measure} pointerEvents="none">
        {BAR_TABS.map((tb, i) => (
          <Text
            key={tb.name}
            style={[styles.barLabel, { fontFamily: F.bold }, { fontFamily: F.bold }]}
            onLayout={(e) => {
              const lw = Math.ceil(e.nativeEvent.layout.width);
              label.set(label.get().map((v, j) => (j === i ? lw : v)));
              const ow = lw + ICON + LABEL_GAP + PILL_SIDE * 2;
              open.set(open.get().map((v, j) => (j === i ? ow : v)));
              setMeasured((m) => ({ ...m, open: m.open.map((v, j) => (j === i ? ow : v)) }));
            }}
          >
            {t(tb.label)}
          </Text>
        ))}
      </View>
      <Glass
        style={styles.bar}
        fallback={styles.barSolid}
        blurTarget={blurTarget}
        radius={BAR_H / 2}
        scheme="light"
        // iOS: Apple's regular glass, lightly frosted, so content under the bar softens rather than showing
        // sharp; a light ivory wash keeps the dark icons readable over dark content too.
        variant="regular"
        tint={Platform.OS === 'ios' ? 'rgba(251, 250, 245, 0.4)' : 'rgba(251, 250, 245, 0.6)'}
        interactive
        accessibilityRole="tablist"
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width - BAR_PAD * 2;
          total.set(w);
          setMeasured((m) => ({ ...m, total: w }));
        }}
      >
        <View pointerEvents="none" style={styles.track}>
          {/* The pill's caps and strip overlap; on glass they are faded together so no seams show. */}
          <View style={[StyleSheet.absoluteFill, glass && styles.pillGlassLayer]}>
            <Reanimated.View style={[styles.cap, glass && styles.pillGlass, capL]} />
            <Reanimated.View style={[styles.mid, glass && styles.pillGlass, mid]} />
            <Reanimated.View style={[styles.cap, glass && styles.pillGlass, capR]} />
          </View>
          {BAR_TABS.map((tb, i) => (
            <BarGlyph key={tb.name} tab={tb} index={i} pos={pos} total={total} open={open} label={label} glass={glass} />
          ))}
        </View>
        {BAR_TABS.map((tb, i) => (
          <Pressable
            key={tb.name}
            accessibilityRole="tab"
            accessibilityState={{ selected: i === active }}
            accessibilityLabel={t(tb.label)}
            onPress={() => go(i)}
            style={{ height: PILL_H, width: closedW ? (i === active ? measured.open[i] : closedW) : `${100 / N}%` }}
          />
        ))}
      </Glass>
    </View>
  );
}

/** App chrome: V5 sidebar on wide screens; on phones the floating tab bar is drawn by the tab navigator. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { wide } = useLayout();
  const space = useTabBarSpace();
  if (wide) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: C.bg }}>
        <Sidebar />
        <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
      </View>
    );
  }
  return (
    <TabBarSpace.Provider value={space}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>{children}</View>
    </TabBarSpace.Provider>
  );
}

const styles = StyleSheet.create({
  side: { width: SIDE_W, paddingVertical: 26, paddingHorizontal: 16, gap: 26, backgroundColor: C.deep, overflow: 'hidden', zIndex: 2 },
  sideItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, height: ITEM_H, borderRadius: 14 },
  sideHover: { backgroundColor: 'rgba(244, 242, 234, 0.07)' },
  highlight: { position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H, borderRadius: 14, backgroundColor: 'rgba(185, 203, 176, 0.16)', borderWidth: 1, borderColor: 'rgba(185, 203, 176, 0.22)', boxShadow: '0 6px 18px rgba(0, 0, 0, 0.25)' },
  highlightBar: { position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, borderRadius: 2, backgroundColor: C.leaf },
  sprig: { position: 'absolute', right: -46, bottom: 70, opacity: 0.32 },
  streak: { padding: 16, borderRadius: 18, backgroundColor: 'rgba(244, 242, 234, 0.06)', borderWidth: 1, borderColor: 'rgba(185, 203, 176, 0.16)', gap: 6 },
  lbl: { fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.leaf },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.leaf, alignItems: 'center', justifyContent: 'center' },
  signBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  barWrap: { position: 'absolute', left: 16, right: 16, alignItems: 'stretch' },
  bar: { height: BAR_H, borderRadius: BAR_H / 2, padding: BAR_PAD, flexDirection: 'row', boxShadow: '0 14px 30px rgba(20, 38, 28, 0.22), 0 2px 6px rgba(20, 38, 28, 0.12)' },
  // Without liquid glass (Android, web, older iOS, Reduce Transparency): the solid forest bar.
  barSolid: { backgroundColor: C.deep, boxShadow: '0 14px 30px rgba(20, 38, 28, 0.30), 0 2px 6px rgba(20, 38, 28, 0.18)' },
  track: { position: 'absolute', top: BAR_PAD, left: BAR_PAD, right: BAR_PAD, height: PILL_H },
  cap: { position: 'absolute', top: 0, left: 0, width: PILL_H, height: PILL_H, borderRadius: PILL_H / 2, backgroundColor: C.pale },
  mid: { position: 'absolute', top: 0, left: 0, width: 100, height: PILL_H, backgroundColor: C.pale },
  glyph: { position: 'absolute', top: 0, left: 0, width: SLOT, height: PILL_H },
  icon: { position: 'absolute', left: 0, top: (PILL_H - ICON) / 2, width: ICON, height: ICON },
  name: { position: 'absolute', left: 0, top: (PILL_H - 20) / 2, lineHeight: 20 },
  barLabel: { fontSize: 15, color: C.forest },
  rule: { position: 'absolute', left: 3, right: 3, bottom: -7, height: 2, borderRadius: 1, backgroundColor: 'rgba(201, 211, 196, 0.55)' },
  // On Apple's Liquid Glass the bar is clear, so its marks turn dark and the selection is a soft tint (as iOS does).
  ruleGlass: { backgroundColor: 'rgba(31, 58, 43, 0.22)' },
  pillGlass: { backgroundColor: C.forest },
  pillGlassLayer: { opacity: 0.1 },
  measure: { position: 'absolute', opacity: 0, flexDirection: 'row', left: -1000 },
});
