import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View, type ColorValue, type ViewProps } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurTargetView, BlurView } from 'expo-blur';

/**
 * Glass for floating chrome (the tab bar, round header buttons, stat cards).
 *
 * - iOS 26+: Apple's Liquid Glass (expo-glass-effect), when the API is present (some 26 betas lack it).
 * - Android 12+: a frosted blur (expo-blur) for chrome that is given a `blurTarget` — the content it
 *   floats over. Android has no Liquid Glass, and the blur below Android 12 is too slow to use.
 * - Everywhere else (web, older iOS / Android), and whenever the user asks for Reduce Transparency:
 *   the caller's `fallback` style, the solid look the app had before.
 */
const LIQUID = (() => {
  if (Platform.OS !== 'ios') return false;
  try {
    return isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  } catch {
    return false;
  }
})();
/**
 * True on iOS 26+ with Liquid Glass. Tab switches there are instant, as in Apple's own apps: a fading
 * transition leaves glass inside the screen unable to draw again (even freshly mounted glass).
 */
export const LIQUID_GLASS = LIQUID;
const ANDROID_BLUR = Platform.OS === 'android' && typeof Platform.Version === 'number' && Platform.Version >= 31;

function useReducedTransparency() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (!LIQUID) return undefined;
    let alive = true;
    AccessibilityInfo.isReduceTransparencyEnabled().then((v) => alive && setReduced(v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduced);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduced;
}

/**
 * True when floating chrome is see-through (so it should use its glass colours, e.g. dark icons).
 * Pass `blur` for chrome that has a blur target, which can be frosted on Android too.
 */
export function useGlass(blur = false): boolean {
  const reduced = useReducedTransparency();
  return !reduced && (LIQUID || (blur && ANDROID_BLUR));
}

/* ------------------------------------------------------------------ */
/* Blur targets: on Android each tab screen is wrapped in a            */
/* BlurTargetView, so the tab bar (outside the screens) can frost the  */
/* one in focus.                                                       */
/* ------------------------------------------------------------------ */
type ViewNode = React.ComponentRef<typeof View>;
type TargetRef = RefObject<ViewNode | null>;
const Targets = createContext<{ targets: Record<string, TargetRef>; register: (key: string, ref: TargetRef | null) => void } | null>(null);

export function BlurTargetsProvider({ children }: { children: React.ReactNode }) {
  const [targets, setTargets] = useState<Record<string, TargetRef>>({});
  const register = useCallback((key: string, ref: TargetRef | null) => {
    setTargets((prev) => {
      if (ref ? prev[key] === ref : !(key in prev)) return prev;
      const next = { ...prev };
      if (ref) next[key] = ref;
      else delete next[key];
      return next;
    });
  }, []);
  const value = useMemo(() => ({ targets, register }), [targets, register]);
  return <Targets.Provider value={value}>{children}</Targets.Provider>;
}

/** Wraps one screen so floating chrome can blur it (Android 12+ only; elsewhere it adds nothing). */
export function BlurTarget({ id, children }: { id: string; children: React.ReactNode }) {
  const ctx = useContext(Targets);
  const ref = useRef<ViewNode | null>(null);
  const register = ctx?.register;
  const attach = useCallback(
    (node: ViewNode | null) => {
      ref.current = node;
      register?.(id, node ? ref : null);
    },
    [id, register],
  );
  if (!ANDROID_BLUR || !ctx) return <>{children}</>;
  return (
    <BlurTargetView ref={attach} style={{ flex: 1 }}>
      {children}
    </BlurTargetView>
  );
}

/* ------------------------------------------------------------------ */
/* Backdrop: a screen's background layer as a blur target, so glass    */
/* inside the screen (stat tiles) can frost it on Android 12+. Glass   */
/* can't blur the screen target it sits in (it would draw itself), so  */
/* it blurs this layer, which holds everything behind the content.     */
/* ------------------------------------------------------------------ */
const BackdropCtx = createContext<TargetRef | undefined>(undefined);

/** Draws `layer` behind `children`; on Android 12+ the layer is a blur target for `<Glass backdrop>`. */
export function Backdrop({ layer, children }: { layer: React.ReactNode; children: React.ReactNode }) {
  const ref = useRef<ViewNode | null>(null);
  const [target, setTarget] = useState<TargetRef | undefined>(undefined);
  const attach = useCallback((node: ViewNode | null) => {
    ref.current = node;
    setTarget(node ? ref : undefined);
  }, []);
  if (!ANDROID_BLUR || !layer) {
    return (
      <>
        {layer}
        {children}
      </>
    );
  }
  return (
    <>
      <BlurTargetView ref={attach} pointerEvents="none" style={StyleSheet.absoluteFill}>
        {layer}
      </BlurTargetView>
      <BackdropCtx.Provider value={target}>{children}</BackdropCtx.Provider>
    </>
  );
}

/** The blur target registered for a screen (route key), if any. */
export function useBlurTarget(id: string | undefined): TargetRef | undefined {
  const ctx = useContext(Targets);
  return id ? ctx?.targets[id] : undefined;
}

/* ------------------------------------------------------------------ */
/* Glass                                                               */
/* ------------------------------------------------------------------ */
interface GlassProps extends ViewProps {
  /** Style used instead of the glass where glass isn't available. */
  fallback?: ViewProps['style'];
  tint?: ColorValue;
  scheme?: 'light' | 'dark' | 'auto';
  interactive?: boolean;
  /** 'regular' frosts more (better under text); 'clear' shows more of what's behind. */
  variant?: 'regular' | 'clear';
  /** Form the glass natively after this many ms (instead of fading a parent, which glass can't survive). */
  appear?: number;
  /** Android: the content this floats over; with it, Android 12+ draws a frosted blur. */
  blurTarget?: TargetRef;
  /** Android: frost the screen's background layer (see `Backdrop`) when no `blurTarget` is given. */
  backdrop?: boolean;
  /** Corner radius of the glass (Android's blur is clipped to it). */
  radius?: number;
}

/**
 * A view that is glass where it can be, and `fallback` where it can't.
 * Keep it (and its parents) at full opacity: Apple's glass does not render under reduced opacity.
 */
export function Glass({ fallback, tint, scheme = 'auto', interactive, variant = 'regular', appear, blurTarget: ownTarget, backdrop, radius = 0, style, children, ...rest }: GlassProps) {
  const reduced = useReducedTransparency();
  const backdropTarget = useContext(BackdropCtx);
  const blurTarget = ownTarget ?? (backdrop ? backdropTarget : undefined);
  const liquid = LIQUID && !reduced;
  const frosted = !liquid && ANDROID_BLUR && !!blurTarget;
  const [shown, setShown] = useState(appear === undefined);
  useEffect(() => {
    if (shown || !liquid) return undefined;
    const id = setTimeout(() => setShown(true), appear);
    return () => clearTimeout(id);
  }, [shown, liquid, appear]);

  if (liquid) {
    return (
      <GlassView
        style={style}
        glassEffectStyle={appear === undefined ? variant : { style: shown ? variant : 'none', animate: true, animationDuration: 0.6 }}
        tintColor={tint}
        colorScheme={scheme}
        isInteractive={interactive}
        {...rest}
      >
        {children}
      </GlassView>
    );
  }

  if (frosted) {
    // The blur and its wash are clipped in their own layer, so the outer view keeps its shadow.
    return (
      <View style={style} {...rest}>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
          <BlurView style={StyleSheet.absoluteFill} blurTarget={blurTarget} blurMethod="dimezisBlurViewSdk31Plus" intensity={70} tint="light" />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: tint ?? 'rgba(251, 250, 245, 0.5)' }]} />
          <View style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.55)' }]} />
        </View>
        {children}
      </View>
    );
  }

  return (
    <View style={[style, fallback]} {...rest}>
      {children}
    </View>
  );
}

