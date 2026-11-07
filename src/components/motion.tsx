import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  View,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
  AccessibilityInfo,
  type StyleProp,
  type ViewStyle,
  type AccessibilityRole,
  type PressableStateCallbackType,
  type AccessibilityState,
} from 'react-native';
import Svg, { Circle, Path, Defs, RadialGradient, LinearGradient as SvgLinearGradient, Stop, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from 'expo-router';
import Reanimated, { useSharedValue, useAnimatedProps, useAnimatedStyle, withDelay, withTiming, Easing as REasing } from 'react-native-reanimated';
import { C } from '../theme';

const native = Platform.OS !== 'web';

/** Pressable state, plus the hovered / focused flags react-native-web adds. */
export type PressState = PressableStateCallbackType & { hovered?: boolean; focused?: boolean };

/* ------------------------------------------------------------------ */
/* Reduce motion                                                       */
/* ------------------------------------------------------------------ */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => alive && setReduce(!!v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => setReduce(!!v));
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return reduce;
}

/**
 * Whether this screen is on view, updated only once a tab switch has settled (~0.4 s). Starting or
 * stopping dozens of loops on the switch's first frame stalls it; doing it afterwards is invisible.
 */
export function useSettledFocus(delay = 400): boolean {
  const focused = useIsFocused();
  const [settled, setSettled] = useState(focused);
  useEffect(() => {
    if (focused === settled) return undefined;
    const t = setTimeout(() => setSettled(focused), delay);
    return () => clearTimeout(t);
  }, [focused, settled, delay]);
  return settled;
}

/**
 * True when a decorative, never-ending animation should hold still: reduce motion is on, or its screen
 * is not the one on view (tabs stay mounted). It resumes from where it stopped.
 */
function useAmbientOff(): boolean {
  const reduce = useReduceMotion();
  const focused = useSettledFocus();
  return reduce || !focused;
}

interface LoopOpts {
  delay?: number;
  pingPong?: boolean;
  easing?: (v: number) => number;
  disabled?: boolean;
}

/**
 * A 0 → 1 value that loops forever (optionally ping-pong).
 * Pausing (`disabled`) holds it where it is; resuming carries on from that exact point, so a paused
 * leaf or glow never jumps back to its start. Internally a linear phase runs 0 → 1; ping-pong and
 * easing are shaped from it by interpolation (all on the native driver).
 */
function useLoop(duration: number, { delay = 0, pingPong = false, easing = Easing.linear, disabled }: LoopOpts = {}) {
  const [phase] = useState(() => new Animated.Value(0));
  const started = useRef(false);
  const [ease] = useState(() => easing); // callers build their easing inline; the first one is kept
  useEffect(() => {
    if (disabled) return undefined;
    let alive = true;
    let anim: Animated.CompositeAnimation | null = null;
    const fromZero = () => {
      anim = Animated.loop(Animated.timing(phase, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: native }));
      anim.start();
    };
    const resume = () =>
      phase.stopAnimation((cur) => {
        if (!alive) return;
        anim = Animated.timing(phase, { toValue: 1, duration: Math.max(0, 1 - cur) * duration, easing: Easing.linear, useNativeDriver: native });
        anim.start(({ finished }) => {
          if (!finished || !alive) return;
          phase.setValue(0);
          fromZero();
        });
      });
    const t = setTimeout(resume, started.current ? 0 : delay);
    started.current = true;
    return () => {
      alive = false;
      clearTimeout(t);
      anim?.stop();
    };
  }, [phase, duration, delay, disabled]);
  return useMemo(
    () => (pingPong ? phase.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0], easing: ease }) : phase.interpolate({ inputRange: [0, 1], outputRange: [0, 1], easing: ease })),
    [phase, pingPong, ease],
  );
}

/* ------------------------------------------------------------------ */
/* Background effects                                                  */
/* ------------------------------------------------------------------ */
let blobId = 0;
interface BlobProps {
  size: number;
  color: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  duration: number;
  disabled: boolean;
}
function Blob({ size, color, x, y, dx, dy, duration, disabled }: BlobProps) {
  const id = useMemo(() => `blob${blobId++}`, []);
  const t = useLoop(duration, { pingPong: true, easing: Easing.inOut(Easing.sin), disabled });
  const tx = t.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
  const ty = t.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
  const sc = t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  return (
    <Animated.View style={{ position: 'absolute', left: x, top: y, width: size, height: size, transform: [{ translateX: tx }, { translateY: ty }, { scale: sc }] }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity="0.75" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* A botanical leaf, drawn along +x from its base at 0 to its tip at L: */
/* a short stem, an ovate blade with a drip tip, a tapering midrib that */
/* bows a little, pinnate veins sweeping toward the tip, and two halves */
/* so one side can catch the light while the other falls into shade.    */
/* ------------------------------------------------------------------ */
const f = (n: number) => n.toFixed(2);
export interface LeafGeometry {
  blade: string;
  shade: string;
  light: string;
  rib: string;
  stem: string;
  veins: string;
}
export function leafShape(L: number, W: number): LeafGeometry {
  const top =
    `M0 0 C ${f(L * 0.04)} ${f(-W * 0.62)}, ${f(L * 0.22)} ${f(-W * 1.02)}, ${f(L * 0.46)} ${f(-W * 0.98)} ` +
    `C ${f(L * 0.66)} ${f(-W * 0.94)}, ${f(L * 0.8)} ${f(-W * 0.5)}, ${f(L * 0.9)} ${f(-W * 0.2)} ` +
    `C ${f(L * 0.95)} ${f(-W * 0.07)}, ${f(L * 0.98)} ${f(-W * 0.03)}, ${f(L)} ${f(-W * 0.02)}`;
  const bottom =
    `C ${f(L * 0.97)} ${f(W * 0.01)}, ${f(L * 0.93)} ${f(W * 0.06)}, ${f(L * 0.88)} ${f(W * 0.16)} ` +
    `C ${f(L * 0.8)} ${f(W * 0.42)}, ${f(L * 0.64)} ${f(W * 0.86)}, ${f(L * 0.44)} ${f(W * 0.9)} ` +
    `C ${f(L * 0.2)} ${f(W * 0.94)}, ${f(L * 0.03)} ${f(W * 0.58)}, 0 0`;
  const ribOut = `C ${f(L * 0.33)} ${f(-W * 0.1)}, ${f(L * 0.66)} ${f(-W * 0.1)}, ${f(L)} ${f(-W * 0.02)}`;
  const ribBack = `C ${f(L * 0.66)} ${f(-W * 0.1)}, ${f(L * 0.33)} ${f(-W * 0.1)}, 0 0`;
  const r = W * 0.055;
  const rib =
    `M0 ${f(-r)} C ${f(L * 0.33)} ${f(-W * 0.1 - r * 0.7)}, ${f(L * 0.66)} ${f(-W * 0.1 - r * 0.35)}, ${f(L * 0.97)} ${f(-W * 0.02)} ` +
    `C ${f(L * 0.66)} ${f(-W * 0.1 + r * 0.35)}, ${f(L * 0.33)} ${f(-W * 0.1 + r * 0.7)}, 0 ${f(r)} Z`;
  const profile = (k: number) => Math.sin(Math.PI * Math.pow(Math.min(k, 1), 0.85)) * 0.95;
  const veins: string[] = [];
  [0.1, 0.21, 0.32, 0.43, 0.54, 0.64].forEach((k) => {
    for (const [side, off] of [[-1, 0], [1, 0.05]] as const) {
      const kk = k + off;
      const x = L * kk;
      const y = -W * 0.095 * Math.sin(Math.PI * kk);
      const reach = 0.2 * (1 - kk * 0.5);
      const ek = kk + reach;
      const ey = side * W * profile(ek) * 0.78 - W * 0.04;
      veins.push(`M${f(x)} ${f(y)} Q ${f(L * (kk + reach * 0.2))} ${f(y + side * W * profile(kk) * 0.6)} ${f(L * ek)} ${f(ey)}`);
    }
  });
  return {
    blade: `${top} ${bottom} Z`,
    light: `${top} ${ribBack} Z`,
    shade: `M0 0 ${ribOut} ${bottom} Z`,
    rib,
    stem: `M${f(-L * 0.16)} ${f(W * 0.1)} Q ${f(-L * 0.07)} ${f(W * 0.06)} 0 0`,
    veins: veins.join(' '),
  };
}

/**
 * Paints a leaf: `fill` (a colour or a gradient url) for the blade, the lower half in shade, the upper
 * half catching light, paler veins and midrib as on a real leaf, and a fine darker edge.
 */
export function LeafArt({ g, fill, light, dark, stemWidth = 1.2, veinWidth = 0.5 }: { g: LeafGeometry; fill: string; light: string; dark: string; stemWidth?: number; veinWidth?: number }) {
  return (
    <G>
      <Path d={g.stem} stroke={dark} strokeWidth={stemWidth} fill="none" strokeLinecap="round" />
      <Path d={g.blade} fill={fill} />
      <Path d={g.shade} fill={dark} fillOpacity={0.22} />
      <Path d={g.light} fill="#FFFFFF" fillOpacity={0.07} />
      <Path d={g.veins} stroke={light} strokeOpacity={0.55} strokeWidth={veinWidth} fill="none" strokeLinecap="round" />
      <Path d={g.rib} fill={light} fillOpacity={0.85} />
      <Path d={g.blade} fill="none" stroke={dark} strokeOpacity={0.35} strokeWidth={veinWidth} />
    </G>
  );
}

/** A light-to-tip gradient for LeafArt, lit from the upper left. */
export function LeafGradient({ id, base, tip }: { id: string; base: string; tip: string }) {
  return (
    <SvgLinearGradient id={id} x1="0" y1="0" x2="1" y2="0.6">
      <Stop offset="0" stopColor={base} />
      <Stop offset="1" stopColor={tip} />
    </SvgLinearGradient>
  );
}

/** Natural leaf colours: [base, sunlit tip, shade]. Mostly greens, one turning gold. */
const LEAF_TONES: [string, string, string][] = [
  ['#4A6E44', '#9DBB86', '#2F4A2C'],
  ['#6A9159', '#C5D7A6', '#45663C'],
  ['#3D6040', '#83A877', '#24402A'],
  ['#A98840', '#E0C783', '#7A5E26'],
];
const FALL_LEAF = leafShape(30, 10);

interface FallProps {
  left: number;
  height: number;
  duration: number;
  delay: number;
  tone: number;
  size: number;
  id: string;
  paused?: boolean;
}
function FallingLeaf({ left, height, duration, delay, tone, size, id, paused }: FallProps) {
  const t = useLoop(duration, { delay, disabled: paused });
  const ty = t.interpolate({ inputRange: [0, 1], outputRange: [-50, height + 50] });
  // Side-to-side sway, a slow spin, and a tumble (the leaf turning over shows its narrow edge).
  const tx = t.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0, 34, -6, 38, -2, 10] });
  const rot = t.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: ['-30deg', '40deg', '-20deg', '60deg', '0deg', '70deg'] });
  const flip = t.interpolate({ inputRange: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1], outputRange: [1, 0.45, -0.7, -0.3, 0.8, 1, 0.35, -0.75, -0.2, 0.7, 1] });
  const [base, tip, dark] = LEAF_TONES[tone % LEAF_TONES.length];
  return (
    <Animated.View style={{ position: 'absolute', left, top: 0, opacity: 0.7, transform: [{ translateY: ty }, { translateX: tx }, { rotate: rot }, { scaleY: flip }, { scale: size }] }}>
      <Svg width={44} height={28} viewBox="-6 -12 40 24">
        <Defs>
          <LeafGradient id={id} base={base} tip={tip} />
        </Defs>
        <LeafArt g={FALL_LEAF} fill={`url(#${id})`} light={tip} dark={dark} stemWidth={0.9} veinWidth={0.35} />
      </Svg>
    </Animated.View>
  );
}

function Mote({ left, height, duration, delay, size, paused }: Omit<FallProps, 'tone' | 'id'>) {
  const t = useLoop(duration, { delay, disabled: paused });
  const ty = t.interpolate({ inputRange: [0, 1], outputRange: [height + 10, -20] });
  const tx = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 24, -8] });
  const op = t.interpolate({ inputRange: [0, 0.12, 0.85, 1], outputRange: [0, 0.85, 0.7, 0] });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left,
        top: 0,
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: '#A9C29A',
        opacity: op,
        transform: [{ translateY: ty }, { translateX: tx }],
        ...(native ? null : ({ shadowColor: '#B9D4A0', shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, } as ViewStyle)),
        }}
    />
  );
}

const WREATH_BIG = leafShape(70, 22);
const WREATH_SMALL = leafShape(52, 17);
const WREATH_LEAVES = (() => {
  const out: { a: number; r: number; tilt: number; big: boolean }[] = [];
  const ring = (n: number, r: number, big: boolean) => {
    for (let i = 0; i < n; i++) out.push({ a: (i * 360) / n, r, tilt: i % 2 ? -18 : 14, big });
  };
  ring(24, 196, true);
  ring(12, 128, false);
  return out;
})();

function Wreath({ size, style, duration, reverse, disabled }: { size: number; style: ViewStyle; duration: number; reverse?: boolean; disabled: boolean }) {
  const t = useLoop(duration, { disabled });
  const id = `wr${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const rot = t.interpolate({ inputRange: [0, 1], outputRange: reverse ? ['360deg', '0deg'] : ['0deg', '360deg'] });
  return (
    <Animated.View style={[{ position: 'absolute', width: size, height: size, transform: [{ rotate: rot }] }, style]}>
      <Svg width={size} height={size} viewBox="0 0 600 600">
        <Circle cx="300" cy="300" r="190" fill="none" stroke={C.moss} strokeOpacity={0.14} strokeDasharray="2 8" />
        <Defs>
          <LeafGradient id={id} base="#7E9C74" tip="#C9D8B8" />
        </Defs>
        {/* Soft, as if seen through morning haze: real leaves, faded back. */}
        <G opacity={0.3}>
          {WREATH_LEAVES.map((l, i) => (
            // Each leaf grows outward from the ring, leaning alternately left and right.
            <G key={i} transform={`rotate(${l.a} 300 300) translate(300 ${300 - l.r}) rotate(${-90 + l.tilt})`}>
              <LeafArt g={l.big ? WREATH_BIG : WREATH_SMALL} fill={`url(#${id})`} light="#E3ECD6" dark="#4E6B45" stemWidth={1.4} veinWidth={0.8} />
            </G>
          ))}
        </G>
      </Svg>
    </Animated.View>
  );
}

function Beam({ width, height, disabled }: { width: number; height: number; disabled: boolean }) {
  const t = useLoop(16000, { pingPong: true, easing: Easing.inOut(Easing.sin), disabled });
  const tx = t.interpolate({ inputRange: [0, 1], outputRange: [-width * 0.2, width * 0.2] });
  return (
    <Animated.View style={{ position: 'absolute', top: -height * 0.1, left: -width * 0.3, width: width * 1.6, height: height * 0.7, transform: [{ translateX: tx }, { rotate: '-20deg' }], opacity: 0.55 }}>
      <LinearGradient
        colors={['rgba(255,250,225,0)', 'rgba(255,250,225,0.55)', 'rgba(255,250,225,0)', 'rgba(255,250,225,0.4)', 'rgba(255,250,225,0)']}
        locations={[0.15, 0.3, 0.45, 0.6, 0.75]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

/**
 * Herbal background: drifting glows, a slow leaf wreath, light beams,
 * falling leaves and rising light specks. Sits behind screen content.
 */
export const BackgroundFX = React.memo(function BackgroundFX({ intensity = 1, paused = false }: { intensity?: number; paused?: boolean }) {
  const { width: w, height } = useWindowDimensions();
  const width = Math.min(w, 900); // blob/wreath sizes are tuned for phone widths
  // Reduce motion removes the drifting leaves and specks; `paused` (screen hidden or mid-switch) only
  // holds everything in place, and it all carries on from there when the screen is back.
  const reduce = useReduceMotion();
  const still = reduce || paused;
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  // Phones get fewer particles: the look stays, the GPU has room for 60 fps scrolling.
  const leafCount = Math.round((w > 900 ? 9 : native ? 5 : 7) * intensity);
  const moteCount = Math.round((w > 900 ? 14 : native ? 6 : 10) * intensity);
  const leaves = useMemo(
    () =>
      Array.from({ length: leafCount }, (_, i) => ({
        left: ((i * 0.137 + 0.05) % 1) * w,
        duration: 18000 + ((i * 3700) % 12000),
        delay: (i * 2300) % 9000,
        tone: i,
        size: 0.75 + ((i * 0.23) % 0.6),
      })),
    [leafCount, w],
  );
  const motes = useMemo(
    () =>
      Array.from({ length: moteCount }, (_, i) => ({
        left: ((i * 0.091 + 0.03) % 1) * w,
        duration: 14000 + ((i * 2900) % 10000),
        delay: (i * 1700) % 12000,
        size: 3 + (i % 3),
      })),
    [moteCount, w],
  );
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      <Blob size={width * 1.3} color="#C9D9BE" x={-width * 0.55} y={-width * 0.5} dx={60} dy={40} duration={26000} disabled={still} />
      <Blob size={width * 1.1} color="#D8E4CF" x={w - width * 0.65} y={height * 0.3} dx={-50} dy={30} duration={32000} disabled={still} />
      <Blob size={width * 1.0} color="#E8E0C6" x={w * 0.3 - width * 0.5} y={height * 0.72} dx={40} dy={-30} duration={29000} disabled={still} />
      <Beam width={w} height={height} disabled={still} />
      <Wreath size={width * 1.4} style={{ right: -width * 0.6, top: -width * 0.55 }} duration={180000} disabled={still} />
      <Wreath size={width * 1.1} style={{ left: -width * 0.55, bottom: -width * 0.5 }} duration={240000} reverse disabled={still} />
      {!reduce && leaves.map((l, i) => <FallingLeaf key={`l${i}`} {...l} id={`${uid}l${i}`} height={height} paused={paused} />)}
      {!reduce && motes.map((m, i) => <Mote key={`m${i}`} {...m} height={height} paused={paused} />)}
    </View>
  );
});

/** Light specks rising through a dark panel (the sidebar). Pauses with its screen and resumes in place. */
export function Specks({ width, height, count = 7 }: { width: number; height: number; count?: number }) {
  const off = useAmbientOff();
  const reduce = useReduceMotion();
  const specks = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: ((i * 0.173 + 0.07) % 1) * width,
        duration: 16000 + ((i * 3100) % 9000),
        delay: (i * 1900) % 11000,
        size: 2 + (i % 3),
      })),
    [count, width],
  );
  if (reduce) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {specks.map((m, i) => (
        <Mote key={i} {...m} height={height} paused={off} />
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Botanical sprig (line drawing) that sways                           */
/* ------------------------------------------------------------------ */
const SPRIG_SPEC: [number, number, number, number][] = [
  // x, y on the stem, leaf length, angle (degrees; 180 = pointing left)
  [228, 470, 124, 200], [234, 440, 124, -20], [236, 380, 114, 205], [238, 350, 118, -25],
  [230, 290, 104, 210], [232, 260, 108, -30], [232, 210, 94, 215], [236, 185, 96, -35],
  [236, 140, 76, 220], [237, 120, 78, -40], [236, 85, 54, 235], [236, 75, 56, -55],
];
const SPRIG_LEAVES = SPRIG_SPEC.map(([x, y, len, ang]) => ({
  x,
  y,
  // Leaves on the left are mirrored so both sides curl upward like a real sprig.
  ang,
  flip: ang > 90 || ang < -90 ? -1 : 1,
  g: leafShape(len, len * 0.32),
}));

export function Sprig({ width = 230, height = 280, stroke = C.leaf, vein = C.sage }: { width?: number; height?: number; stroke?: string; vein?: string }) {
  const reduce = useAmbientOff();
  const t = useLoop(9000, { pingPong: true, easing: Easing.inOut(Easing.sin), disabled: reduce });
  const rot = t.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] });
  return (
    <Animated.View style={{ width, height, transform: [{ translateY: height / 2 }, { rotate: rot }, { translateY: -height / 2 }] }}>
      <Svg width={width} height={height} viewBox="0 0 460 560">
        <Path d="M230 560 C 226 470, 248 380, 232 290 C 220 220, 240 150, 236 70" fill="none" stroke={vein} strokeOpacity={0.45} strokeWidth={3} strokeLinecap="round" />
        <Defs>
          <LeafGradient id="sprigLeaf" base={vein} tip={stroke} />
        </Defs>
        {/* A backdrop, not a subject: text often sits over it, so the leaves stay faint. */}
        <G opacity={0.32}>
          {SPRIG_LEAVES.map((l, i) => (
            <G key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.ang}) scale(1 ${l.flip})`}>
              <LeafArt g={l.g} fill="url(#sprigLeaf)" light={C.pale} dark={C.deep} stemWidth={2} veinWidth={1} />
            </G>
          ))}
        </G>
      </Svg>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* Entrances, rings, bars, press feedback                              */
/* ------------------------------------------------------------------ */
export function FadeIn({ delay = 0, from = 18, fade = true, children, style }: { delay?: number; from?: number; fade?: boolean; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 650, delay, easing: Easing.out(Easing.cubic), useNativeDriver: native }).start();
  }, [v, delay]);
  const ty = v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] });
  // `fade={false}` only slides: liquid glass inside must never sit under a parent's partial opacity.
  return <Animated.View style={[style, { opacity: fade ? v : 1, transform: [{ translateY: ty }] }]}>{children}</Animated.View>;
}

const AnimatedCircle = Reanimated.createAnimatedComponent(Circle);
const EASE_OUT = REasing.out(REasing.cubic);

interface RingProps {
  score: number | null | undefined;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  inner?: boolean;
  delay?: number;
  label?: string;
  children?: React.ReactNode;
}

/** Score ring that draws itself from 0 to the score (animated on the UI thread). */
export function Ring({ score, size = 150, stroke = 9, color = C.leaf, track = 'rgba(220,229,211,0.18)', inner = true, delay = 200, label, children }: RingProps) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const v = useSharedValue(0);
  const reduce = useReduceMotion();
  useEffect(() => {
    const to = score ?? 0;
    v.set(reduce ? to : withDelay(delay, withTiming(to, { duration: 1400, easing: EASE_OUT })));
  }, [score, v, delay, reduce]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: circ * (1 - v.value / 100) }));
  return (
    <View style={{ width: size, height: size }} accessible accessibilityLabel={label ?? (score == null ? 'Not scored yet' : `Score ${score} out of 100`)}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        {score != null ? (
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circ} ${circ}`}
            animatedProps={props}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
        {inner ? <Circle cx={size / 2} cy={size / 2} r={r - stroke - 4} stroke={track} strokeWidth={1} strokeDasharray="2 5" fill="none" /> : null}
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>{children}</View>
    </View>
  );
}

/** Soft breathing glow behind the composite ring (Agni = the central domain). */
export function Glow({ size, color = '#B9CBB0', on }: { size: number; color?: string; on: boolean }) {
  const reduce = useAmbientOff();
  const t = useLoop(5200, { pingPong: true, easing: Easing.inOut(Easing.sin), disabled: reduce || !on });
  const sc = t.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] });
  const op = t.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.95] });
  if (!on) return null;
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', width: size, height: size, opacity: reduce ? 0.8 : op, transform: [{ scale: reduce ? 1 : sc }] }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="ringglow" cx="50%" cy="50%" r="50%">
            <Stop offset="0.45" stopColor={color} stopOpacity="0.45" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#ringglow)" />
      </Svg>
    </Animated.View>
  );
}

export function GrowBar({ value, color = C.moss, height = 8, delay = 0, track = C.mist }: { value: number; color?: string; height?: number; delay?: number; track?: string }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.set(withDelay(delay, withTiming(Math.max(0, Math.min(100, value || 0)), { duration: 1000, easing: EASE_OUT })));
  }, [value, v, delay]);
  // The fill is full width and slides in from the left (a transform, so nothing is laid out per frame);
  // the track clips it, and its rounded right end is the bar's end.
  const w = useSharedValue(0);
  const fill = useAnimatedStyle(() => ({ opacity: w.value ? 1 : 0, transform: [{ translateX: -w.value * (1 - v.value / 100) }] }));
  return (
    <View onLayout={(e) => w.set(e.nativeEvent.layout.width)} style={{ flex: 1, height, borderRadius: 99, backgroundColor: track, overflow: 'hidden' }}>
      <Reanimated.View style={[{ height, borderRadius: 99, backgroundColor: color }, fill]} />
    </View>
  );
}

interface PressProps {
  children: React.ReactNode | ((s: { hovered: boolean; pressed: boolean }) => React.ReactNode);
  style?: StyleProp<ViewStyle>;
  hoverStyle?: StyleProp<ViewStyle>;
  lift?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  disabled?: boolean;
}

/** Visible keyboard focus on web (outline props are web-only, hence the cast). */
export const FOCUS_RING = (Platform.OS === 'web' ? { outlineWidth: 2, outlineStyle: 'solid', outlineColor: C.moss, outlineOffset: 2 } : {}) as ViewStyle;

const OUTER = ['flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'width', 'minWidth', 'maxWidth', 'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical'];

/** Press feedback (scale) plus hover lift / hover style on web. */
export function PressScale({ children, style, hoverStyle, lift, onPress, accessibilityLabel, accessibilityRole = 'button', accessibilityState, disabled }: PressProps) {
  const [s] = useState(() => new Animated.Value(1));
  const pressIn = () => Animated.timing(s, { toValue: 0.965, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: native }).start();
  const pressOut = () => Animated.spring(s, { toValue: 1, useNativeDriver: native, speed: 24, bounciness: 8 }).start();
  // Layout props (flex, width, margins, alignSelf) must sit on the Pressable itself.
  const flat = (StyleSheet.flatten(style) || {}) as Record<string, unknown>;
  const outer: Record<string, unknown> = {};
  const inner: Record<string, unknown> = {};
  Object.keys(flat).forEach((k) => ((OUTER.includes(k) ? outer : inner)[k] = flat[k]));
  if (outer.flex !== undefined || outer.width !== undefined || outer.alignSelf === 'stretch' || outer.flexGrow !== undefined) inner.flexGrow = 1;
  return (
    <Pressable
      style={outer as ViewStyle}
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
    >
      {(state) => {
        const hovered = !!(state as { hovered?: boolean }).hovered && !disabled;
        const focused = !!(state as { focused?: boolean }).focused;
        return (
          <Animated.View
            style={[
              inner as ViewStyle,
              hovered && hoverStyle,
              focused && FOCUS_RING,
              hovered && lift ? { transform: [{ translateY: -4 }], shadowColor: C.deep, shadowOpacity: 0.18, shadowRadius: 22, shadowOffset: { width: 0, height: 18 } } : null,
              hovered && lift ? null : { transform: [{ scale: s }] },
            ]}
          >
            {typeof children === 'function' ? children({ hovered, pressed: state.pressed }) : children}
          </Animated.View>
        );
      }}
    </Pressable>
  );
}

/** A soft light that slowly drifts across dark green panels. */
export function PanelGlow({ width = 320 }: { width?: number }) {
  const reduce = useAmbientOff();
  const t = useLoop(14000, { pingPong: true, easing: Easing.inOut(Easing.sin), disabled: reduce });
  const tx = t.interpolate({ inputRange: [0, 1], outputRange: [-80, width * 0.4] });
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -120, left: 0, width: 320, height: 320, transform: [{ translateX: tx }] }}>
      <Svg width={320} height={320}>
        <Defs>
          <RadialGradient id="pg" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#B9CBB0" stopOpacity="0.32" />
            <Stop offset="1" stopColor="#B9CBB0" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={160} cy={160} r={160} fill="url(#pg)" />
      </Svg>
    </Animated.View>
  );
}
