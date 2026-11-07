import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Reanimated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import RNMaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient as Gradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useReduceMotion } from './motion';
import { LOTUS, LOTUS_RATIO } from './brand';
import { C, F } from '../theme';
import { getLanguage, t } from '../i18n';

/** The lotus artwork's own paper: the native splash and this one share it, so the hand-over is seamless. */
export const SPLASH_PAPER = '#F8F7F2';
/** Same width as the native splash image (app.json → expo-splash-screen → imageWidth). */
const MARK = 120;
const MARK_H = MARK / LOTUS_RATIO;
const EASE = Easing.out(Easing.cubic);
const STAGE = 420; // the square every ring, ray and petal is laid out in, centred on the lotus
const LIFT = -96; // how far the lotus rises to make room for the name
const MOTES = 22;
const PETALS = 12;
const RIPPLES = 3;
const PETAL = petalShape(44, 13);
/** When the opening has settled (the last line of words is in place) and the app can mount beneath. */
const SETTLED = 3700;
/** When the lotus and everything around it begin to appear (all together). */
const START = 60;

// The package's class typings predate React 19's JSX types; its props are these.
const MaskedView = RNMaskedView as unknown as React.ComponentType<{ style?: StyleProp<ViewStyle>; maskElement: React.ReactElement; children?: React.ReactNode }>;

/** The app's palette, for the light, rays and petals around the lotus. */
const L = { indigo: C.forest, terra: C.moss, peach: C.leaf, gold: C.gold, cream: C.pale };

/** A fine line-drawn petal for the mandala: an asymmetric blade with a drip tip, a midrib and side veins. */
function petalShape(Len: number, W: number) {
  const f = (n: number) => n.toFixed(1);
  const blade =
    `M0 0 C ${f(Len * 0.06)} ${f(-W * 0.85)}, ${f(Len * 0.42)} ${f(-W * 1.18)}, ${f(Len * 0.78)} ${f(-W * 0.55)} ` +
    `C ${f(Len * 0.88)} ${f(-W * 0.3)}, ${f(Len * 0.95)} ${f(-W * 0.1)}, ${f(Len)} ${f(W * 0.04)} ` +
    `C ${f(Len * 0.9)} ${f(W * 0.28)}, ${f(Len * 0.8)} ${f(W * 0.5)}, ${f(Len * 0.68)} ${f(W * 0.66)} ` +
    `C ${f(Len * 0.4)} ${f(W * 1.05)}, ${f(Len * 0.06)} ${f(W * 0.8)}, 0 0 Z`;
  const rib = `M${f(-Len * 0.12)} ${f(W * 0.06)} L0 0 Q ${f(Len * 0.5)} ${f(-W * 0.12)} ${f(Len * 0.97)} ${f(W * 0.03)}`;
  return { blade, rib };
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

/** Soft rays of sunlight fanning out from the lotus, turning slowly. */
const RAYS = Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * Math.PI * 2;
  const s = 0.045 + (i % 3) * 0.02;
  const r = STAGE * (i % 2 ? 0.5 : 0.44);
  const c = STAGE / 2;
  const p = (ang: number, rad: number) => `${(c + Math.cos(ang) * rad).toFixed(1)} ${(c + Math.sin(ang) * rad).toFixed(1)}`;
  return `M${c} ${c} L${p(a - s, r)} L${p(a + s, r)} Z`;
}).join(' ');

/** One mote of golden light: it spirals in and is drawn into the flower's heart. */
function Mote({ i, gather }: { i: number; gather: SharedValue<number> }) {
  const angle = (i * 137.5 * Math.PI) / 180; // golden angle: evenly scattered, never in rows
  const from = 170 + ((i * 53) % 190);
  const start = (i % 7) * 0.05;
  const size = 2.4 + (i % 3) * 1.4;
  const style = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, (gather.get() - start) / 0.62));
    const e = 1 - Math.pow(1 - p, 3);
    const a = angle + (1 - e) * 1.6; // the spiral tightens as it nears
    const r = from * (1 - e) + 6;
    return {
      opacity: p <= 0 || p >= 1 ? 0 : Math.min(1, p * 5) * Math.min(1, (1 - p) * 4),
      transform: [{ translateX: Math.cos(a) * r }, { translateY: Math.sin(a) * r }, { scale: 0.6 + (1 - e) * 0.8 }],
    };
  });
  return <Reanimated.View style={[styles.mote, { width: size, height: size, borderRadius: size, marginLeft: -size / 2, marginTop: -size / 2 }, style]} />;
}

/** One petal of the mandala that unfurls behind the lotus. */
function Petal({ i, bloom }: { i: number; bloom: SharedValue<number> }) {
  const angle = (i * 360) / PETALS;
  const start = ((i % PETALS) / PETALS) * 0.45;
  const inner = i % 2 === 0;
  const style = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, (bloom.get() - start) / 0.55));
    const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p) * Math.cos(p * Math.PI * 1.4); // a soft overshoot, like a petal opening
    return { opacity: Math.min(1, p * 3), transform: [{ translateY: 22 * (1 - e) }, { scale: Math.max(0.01, e) }] };
  });
  const tone = inner ? L.terra : L.gold;
  return (
    <View style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${angle + (inner ? 0 : 15)}deg` }] }]}>
      <Reanimated.View style={[styles.petal, { top: STAGE / 2 - (inner ? 96 : 114) - 50 }, style]}>
        <Svg width={32} height={60} viewBox="-16 -48 32 60">
          <G transform="rotate(-90)">
            <Path d={PETAL.blade} fill={tone} fillOpacity={inner ? 0.16 : 0.12} stroke={tone} strokeOpacity={0.7} strokeWidth={1} />
            <Path d={PETAL.rib} fill="none" stroke={tone} strokeOpacity={0.45} strokeWidth={0.8} />
          </G>
        </Svg>
      </Reanimated.View>
    </View>
  );
}

/** A thin orbit: dashed, turning, drawn in from nothing. */
function Orbit({ r, dash, spin, dir, appear, at, opacity }: { r: number; dash: string; spin: SharedValue<number>; dir: 1 | -1; appear: SharedValue<number>; at: number; opacity: number }) {
  const style = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, (appear.get() - at) / 0.5));
    return { opacity: p * opacity, transform: [{ scale: 0.55 + 0.45 * (1 - Math.pow(1 - p, 3)) }, { rotate: `${dir * spin.get() * 360}deg` }] };
  });
  return (
    <Reanimated.View style={[StyleSheet.absoluteFill, style]}>
      <Svg width={STAGE} height={STAGE}>
        <Circle cx={STAGE / 2} cy={STAGE / 2} r={r} fill="none" stroke={L.indigo} strokeWidth={0.9} strokeDasharray={dash} strokeLinecap="round" />
        <Circle cx={STAGE / 2 + r} cy={STAGE / 2} r={2.6} fill={L.gold} />
      </Svg>
    </Reanimated.View>
  );
}

/** A ripple spreading over still water beneath the flower. */
function Ripple({ i, ripple }: { i: number; ripple: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, ripple.get() * 1.6 - i * 0.3));
    const k = 0.3 + p * 2.6;
    // A circle squashed flat: an ellipse lying on the water.
    return { opacity: p <= 0 ? 0 : (1 - p) * 0.55, transform: [{ scaleX: k }, { scaleY: k * 0.26 }] };
  });
  return <Reanimated.View style={[styles.ripple, style]} />;
}

/** A letter (or, for scripts that must stay joined, the whole word) rising into place. */
function Rise({ children, at, show, style }: { children: React.ReactNode; at: number; show: SharedValue<number>; style?: object }) {
  const a = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, (show.get() - at) / 0.4));
    const e = 1 - Math.pow(1 - p, 3);
    return { opacity: e, transform: [{ translateY: 18 * (1 - e) }, { scale: 0.92 + 0.08 * e }] };
  });
  return <Reanimated.View style={[style, a]}>{children}</Reanimated.View>;
}

/*
 * The lotus opening. The artwork (373 x 291 px) is cut, by masks, into three pieces that line up pixel
 * for pixel at rest: the front petal with its stamens, and the left and right wings (everything else,
 * either side of the centre line). All three turn and grow about the heart of the flower, where every
 * petal meets.
 */
const ART_W = 373;
const ART_H = 291;
const HEART = { x: 186, y: 214 };
const ORIGIN = `${((HEART.x / ART_W) * 100).toFixed(2)}% ${((HEART.y / ART_H) * 100).toFixed(2)}%`;
/** The heart's height within the lotus as drawn on screen (points from its top edge). */
const HEART_Y = (HEART.y / ART_H) * MARK_H;
/** The front petal's outline (artwork pixels), and each half of it. */
const FRONT = 'M186 4 C 150 35, 122 80, 126 120 C 130 160, 165 195, 186 214 C 207 195, 242 160, 246 120 C 250 80, 222 35, 186 4 Z';
const FRONT_L = 'M186 4 C 150 35, 122 80, 126 120 C 130 160, 165 195, 186 214 Z';
const FRONT_R = 'M186 4 C 222 35, 250 80, 246 120 C 242 160, 207 195, 186 214 Z';
// The wings overlap the centre line by 1.5 px, and the front petal's mask is drawn 1.5 px fuller than the
// hole cut for it, so no hairline of paper shows where the pieces meet.
const WING_L = `M0 0 H187.5 V${ART_H} H0 Z ${FRONT_L}`;
const WING_R = `M184.5 0 H${ART_W} V${ART_H} H184.5 Z ${FRONT_R}`;

function Piece({ mask, stroke }: { mask: string; stroke?: boolean }) {
  return (
    <MaskedView
      style={StyleSheet.absoluteFill}
      maskElement={
        <Svg width={MARK} height={MARK_H} viewBox={`0 0 ${ART_W} ${ART_H}`} preserveAspectRatio="none">
          <Path d={mask} fill="#000" fillRule="evenodd" stroke={stroke ? '#000' : undefined} strokeWidth={stroke ? 3 : 0} />
        </Svg>
      }
    >
      <Image source={LOTUS} style={{ width: MARK, height: MARK_H }} />
    </MaskedView>
  );
}

/**
 * A wing's pose as the flower opens (`o` 0 → 1). Closed, it is folded in behind the front petal; open, it
 * lies exactly in place. (Module level: a worklet declared inside a component isn't reliably captured.)
 */
function wingStyle(o: number, side: -1 | 1) {
  'worklet';
  // Each side grows out of the heart too, opening outward by a small turn, so the flower stays whole.
  return { opacity: Math.min(1, o * 2.5), transform: [{ rotate: `${-side * 14 * (1 - o)}deg` }, { scale: Math.max(0.001, o) }] };
}

/**
 * The lotus, opening from its heart: all its petals grow together out of the point where they meet, the
 * side petals turning gently outward into place; a band of light sweeps across the open flower.
 */
function Lotus({ rise, open, shine }: { rise: SharedValue<number>; open: SharedValue<number>; shine: SharedValue<number> }) {
  const front = useAnimatedStyle(() => {
    const r = rise.get();
    // The middle petal grows out of the heart, where every petal meets.
    return { opacity: Math.min(1, r * 2), transform: [{ scale: Math.max(0.001, r) }] };
  });
  const left = useAnimatedStyle(() => wingStyle(open.get(), -1));
  const right = useAnimatedStyle(() => wingStyle(open.get(), 1));
  const band = useAnimatedStyle(() => ({ transform: [{ translateX: -MARK * 1.2 + shine.get() * MARK * 2.6 }, { rotate: '20deg' }] }));
  return (
    <View style={{ width: MARK, height: MARK_H }}>
      <Reanimated.View style={[StyleSheet.absoluteFill, { transformOrigin: ORIGIN }, left]}>
        <Piece mask={WING_L} />
      </Reanimated.View>
      <Reanimated.View style={[StyleSheet.absoluteFill, { transformOrigin: ORIGIN }, right]}>
        <Piece mask={WING_R} />
      </Reanimated.View>
      <Reanimated.View style={[StyleSheet.absoluteFill, { transformOrigin: ORIGIN }, front]}>
        <Piece mask={FRONT} stroke />
      </Reanimated.View>
      <MaskedView style={StyleSheet.absoluteFill} maskElement={<Image source={LOTUS} style={{ width: MARK, height: MARK_H }} />}>
        <Reanimated.View style={[styles.shine, band]}>
          <Gradient colors={['rgba(255,255,255,0)', 'rgba(255,250,235,0.85)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        </Reanimated.View>
      </MaskedView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* The splash                                                          */
/* ------------------------------------------------------------------ */

/**
 * Animated launch, built around the AHI lotus.
 * It begins on the native splash's frame — plain paper — and starts moving at once:
 *  1. all at once: the lotus grows out of its heart, the point where every petal meets, while ripples spread
 *     over the water from it and warm light, slow rays and orbits open around it;
 *  2. prāṇa: motes of golden light spiral in and are drawn into the flower's heart;
 *  3. the lotus takes a breath — a ring of light, a soft haptic, a gleam sweeping across it — and a mandala of petals unfurls;
 *  4. the lotus rises and the name surfaces letter by letter, then the Sanskrit line;
 *  5. we fly through the flower into the first screen.
 * The app itself is mounted underneath at the end of step 4 (`onShowApp`), once everything but the slow
 * spin has come to rest, so the moment it takes to build never shows as a stutter.
 */
export function AnimatedSplash({ ready, onShowApp, onDone }: { ready: boolean; onShowApp: () => void; onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const reduce = useReduceMotion();
  const dawn = useSharedValue(0); // light, rays and orbits
  const spin = useSharedValue(0); // endless slow turn
  const ripple = useSharedValue(0); // rings on the water
  const gather = useSharedValue(0); // motes converging
  const rise = useSharedValue(0); // the middle petal growing
  const open = useSharedValue(0); // the side petals opening
  const pulse = useSharedValue(0); // the lotus's breath
  const shock = useSharedValue(0); // ring of light at the breath
  const shine = useSharedValue(0); // gleam across the lotus
  const bloom = useSharedValue(0); // petal mandala
  const lift = useSharedValue(0); // lotus rising
  const words = useSharedValue(0); // title letters, subtitle, Sanskrit
  const exit = useSharedValue(0); // fly-through
  const startedAt = useRef(0);
  const [shown, setShown] = useState(false);
  const [laidOut, setLaidOut] = useState(false);
  const latin = getLanguage() === 'en';
  const name = t('AHI');
  const letters = useMemo(() => (latin ? name.split('') : [name]), [latin, name]);

  // Begin on the very first frame: the native splash goes and the same picture starts to move.
  useEffect(() => {
    if (!laidOut) return undefined;
    SplashScreen.hide();
    startedAt.current = Date.now();
    const timers: ReturnType<typeof setTimeout>[] = [];
    const showApp = () => {
      setShown(true);
      onShowApp();
    };
    if (reduce) {
      rise.set(1);
      open.set(1);
      lift.set(1);
      words.set(1);
      dawn.set(withTiming(1, { duration: 300 }));
      timers.push(setTimeout(showApp, 0));
    } else {
      // Everything begins together: the lotus grows out of its heart while the light, rays, orbits, ripples
      // and motes open around it.
      rise.set(withDelay(START, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })));
      open.set(withDelay(START, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) })));
      dawn.set(withDelay(START, withTiming(1, { duration: 1100, easing: EASE })));
      spin.set(withDelay(START, withRepeat(withTiming(1, { duration: 40000, easing: Easing.linear }), -1, false)));
      ripple.set(withDelay(START, withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) })));
      gather.set(withDelay(START, withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) })));
      pulse.set(withDelay(1950, withSequence(withTiming(1, { duration: 180, easing: EASE }), withSpring(0, { stiffness: 120, damping: 9 }))));
      shock.set(withDelay(1950, withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) })));
      shine.set(withDelay(2000, withTiming(1, { duration: 900, easing: Easing.inOut(Easing.cubic) })));
      bloom.set(withDelay(2000, withTiming(1, { duration: 1100, easing: Easing.linear })));
      lift.set(withDelay(2350, withSpring(1, { stiffness: 110, damping: 16 })));
      words.set(withDelay(2550, withTiming(1, { duration: 1200, easing: Easing.linear })));
      timers.push(setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {}), 2000));
      // Building the first screen holds the main thread for a moment (~0.2 s), and every animation stops
      // with it. So the app is mounted once the words have settled, when only the slow 40 s spin is still
      // moving: a pause there can't be seen.
      timers.push(setTimeout(showApp, SETTLED));
    }
    return () => timers.forEach(clearTimeout);
    // Runs once, when the first frame is on screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laidOut]);

  // Leave once the app is mounted underneath and the intro has played (about 3.3 s; 0.3 s with reduce motion).
  useEffect(() => {
    if (!ready || !shown) return undefined;
    const stay = Math.max(reduce ? 120 : 350, (reduce ? 300 : SETTLED) - (Date.now() - startedAt.current));
    const outFor = reduce ? 250 : 750;
    const start = setTimeout(() => exit.set(withTiming(1, { duration: outFor, easing: Easing.in(Easing.cubic) })), stay);
    const done = setTimeout(onDone, stay + outFor + 30);
    return () => {
      clearTimeout(start);
      clearTimeout(done);
    };
  }, [ready, shown, reduce, exit, onDone]);

  // Fly-through: the world rushes past (the stage grows fastest), the words fall away, everything dissolves.
  const rootStyle = useAnimatedStyle(() => ({ opacity: interpolate(exit.get(), [0, 0.55, 1], [1, 0.9, 0]) }));
  const stageStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: LIFT * lift.get() }, { scale: (1 - 0.18 * lift.get()) * (1 + exit.get() * exit.get() * 7) }],
  }));
  const raysStyle = useAnimatedStyle(() => ({ opacity: dawn.get() * 0.6, transform: [{ rotate: `${spin.get() * -360}deg` }, { scale: 0.6 + dawn.get() * 0.4 }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: dawn.get() * (0.85 + pulse.get() * 0.15), transform: [{ scale: 0.5 + dawn.get() * 0.5 + pulse.get() * 0.12 }] }));
  const shockStyle = useAnimatedStyle(() => ({ opacity: shock.get() > 0 ? (1 - shock.get()) * 0.8 : 0, transform: [{ scale: 1 + shock.get() * 2.6 }] }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: pulse.get() * 0.12 + exit.get() * 0.3 }));
  const markStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.get() * 0.1 }] }));
  const waterStyle = useAnimatedStyle(() => ({ opacity: 1 - lift.get() }));
  const mandalaStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.get() * 360}deg` }] }));
  const wordsStyle = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, exit.get() * 2.2), transform: [{ translateY: exit.get() * 40 }] }));

  const motes = useMemo(() => Array.from({ length: MOTES }, (_, i) => i), []);
  const petals = useMemo(() => Array.from({ length: PETALS }, (_, i) => i), []);
  const ripples = useMemo(() => Array.from({ length: RIPPLES }, (_, i) => i), []);
  const glow = Math.max(width, height) * 1.1;

  return (
    <Reanimated.View pointerEvents="none" onLayout={laidOut ? undefined : () => setLaidOut(true)} style={[StyleSheet.absoluteFill, styles.root, rootStyle]}>
      <StatusBar style="dark" />

      {/* A faint warm wash at the top and bottom edges, so the light at the centre reads as dawn. */}
      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        <Defs>
          <LinearGradient id="splashSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={L.cream} stopOpacity="0.55" />
            <Stop offset="0.45" stopColor={SPLASH_PAPER} stopOpacity="0" />
            <Stop offset="1" stopColor={L.peach} stopOpacity="0.28" />
          </LinearGradient>
        </Defs>
        <Path d={`M0 0 H${width} V${height} H0 Z`} fill="url(#splashSky)" />
      </Svg>

      <Reanimated.View style={[styles.stage, { left: width / 2 - STAGE / 2, top: height / 2 - STAGE / 2 }, stageStyle]}>
        {/* Dawn: a great soft light, and rays turning */}
        <Reanimated.View style={[styles.abs, { width: glow, height: glow, left: STAGE / 2 - glow / 2, top: STAGE / 2 - glow / 2 }, glowStyle]}>
          <Svg width={glow} height={glow}>
            <Defs>
              <RadialGradient id="splashGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={L.peach} stopOpacity="0.55" />
                <Stop offset="0.18" stopColor={L.gold} stopOpacity="0.22" />
                <Stop offset="0.5" stopColor={L.cream} stopOpacity="0.12" />
                <Stop offset="1" stopColor={SPLASH_PAPER} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={glow / 2} cy={glow / 2} r={glow / 2} fill="url(#splashGlow)" />
          </Svg>
        </Reanimated.View>
        <Reanimated.View style={[StyleSheet.absoluteFill, raysStyle]}>
          <Svg width={STAGE} height={STAGE}>
            <Defs>
              <RadialGradient id="splashRay" cx="50%" cy="50%" r="50%">
                <Stop offset="0.2" stopColor={L.gold} stopOpacity="0.3" />
                <Stop offset="1" stopColor={L.gold} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Path d={RAYS} fill="url(#splashRay)" />
          </Svg>
        </Reanimated.View>

        {/* Ripples on the water the lotus floats on (flattened circles, spreading out and fading) */}
        <Reanimated.View style={[styles.water, { left: STAGE / 2 - 60, top: STAGE / 2 - 30 }, waterStyle]}>
          {ripples.map((i) => (
            <Ripple key={i} i={i} ripple={ripple} />
          ))}
        </Reanimated.View>

        {/* Orbits */}
        <Orbit r={196} dash="1 9" spin={spin} dir={1} appear={dawn} at={0.1} opacity={0.32} />
        <Orbit r={150} dash="28 10 2 10" spin={spin} dir={-1} appear={dawn} at={0.25} opacity={0.26} />
        <Orbit r={112} dash="2 6" spin={spin} dir={1} appear={dawn} at={0.4} opacity={0.34} />

        {/* Petal mandala */}
        <Reanimated.View style={[StyleSheet.absoluteFill, mandalaStyle]}>
          {petals.map((i) => (
            <Petal key={i} i={i} bloom={bloom} />
          ))}
        </Reanimated.View>

        {/* Prāṇa: golden light drawn inward */}
        <View style={[styles.abs, { left: STAGE / 2, top: STAGE / 2 }]}>
          {motes.map((i) => (
            <Mote key={i} i={i} gather={gather} />
          ))}
        </View>

        {/* The lotus, its breath and its ring of light */}
        <Reanimated.View style={[styles.ring, { left: STAGE / 2 - MARK / 2, top: STAGE / 2 - MARK / 2 }, shockStyle]} />
        {/* The lotus sits with its heart (where every petal meets) at the centre of the stage, so the light,
            rays, orbits, ripples and motes all open from the point the flower grows out of. */}
        <Reanimated.View style={[styles.abs, { left: STAGE / 2 - MARK / 2, top: STAGE / 2 - HEART_Y, transformOrigin: `50% ${HEART_Y}px` }, markStyle]}>
          <Lotus rise={rise} open={open} shine={shine} />
        </Reanimated.View>
      </Reanimated.View>

      {/* A breath of light over everything at the pulse, and as we pass through */}
      <Reanimated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }, flashStyle]} />

      <Reanimated.View style={[styles.words, wordsStyle]}>
        <View style={{ flexDirection: 'row' }}>
          {letters.map((ch, i) => (
            <Rise key={i} at={i * 0.1} show={words}>
              <Text style={{ fontFamily: F.display, fontSize: 46, lineHeight: latin ? 52 : 70, color: C.forest, marginHorizontal: latin ? 2 : 0 }}>{ch}</Text>
            </Rise>
          ))}
        </View>
        <Rise at={0.3} show={words}>
          <Text style={{ fontFamily: F.italic, fontSize: 19, lineHeight: latin ? 26 : 34, color: C.moss, marginTop: 2 }}>{t('Ayurveda Health Index')}</Text>
        </Rise>
        <Rise at={0.55} show={words} style={{ marginTop: 22, paddingHorizontal: 32 }}>
          <View style={styles.rule} />
          <Text style={{ fontFamily: F.deva, fontSize: 15, lineHeight: 26, color: C.muted, textAlign: 'center', marginTop: 12 }}>प्रसन्नात्मेन्द्रियमनाः स्वस्थ इत्यभिधीयते</Text>
        </Rise>
      </Reanimated.View>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: SPLASH_PAPER, zIndex: 100, overflow: 'hidden' },
  stage: { position: 'absolute', width: STAGE, height: STAGE },
  abs: { position: 'absolute' },
  mote: { position: 'absolute', backgroundColor: L.gold },
  petal: { position: 'absolute', left: STAGE / 2 - 16, width: 32, height: 60 },
  ring: { position: 'absolute', width: MARK, height: MARK, borderRadius: MARK / 2, borderWidth: 1.5, borderColor: L.gold },
  water: { position: 'absolute', width: 120, height: 60, alignItems: 'center', justifyContent: 'center' },
  ripple: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 1.6, borderColor: L.indigo },
  shine: { position: 'absolute', top: -MARK_H * 0.5, width: MARK * 0.45, height: MARK_H * 2 },
  words: { position: 'absolute', left: 0, right: 0, top: '50%', marginTop: 60, alignItems: 'center' },
  rule: { alignSelf: 'center', width: 36, height: 1, backgroundColor: L.gold, opacity: 0.8 },
});
