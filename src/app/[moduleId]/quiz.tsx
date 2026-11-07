import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, Platform, ScrollView, type StyleProp, type ViewStyle } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button, Label, Deva, Logo, RoundButton, LeafProgress } from '../../components/ui';
import { BackgroundFX, PressScale, FOCUS_RING, type PressState } from '../../components/motion';
import { useAhi } from '../../state/AhiContext';
import { MODULES, moduleById, type AhiModule } from '../../data/modules';
import { C, F, useLayout } from '../../theme';
import { lh, t } from '../../i18n';

/** Worded answer option: full-width rounded row with a radio dot, never a stock control. */
function OptionButton({ label, index, selected, onPress, wide }: { label: string; index: number; selected: boolean; onPress: () => void; wide: boolean }) {
  return (
    <PressScale
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      style={[styles.opt, { minHeight: wide ? 60 : 56 }, selected && styles.optOn]}
      hoverStyle={selected ? undefined : { borderColor: C.sage, backgroundColor: '#F6F7F0' }}
    >
      <View style={[styles.radio, selected && { borderColor: C.forest }]}>
        <View style={[styles.dot, selected && { backgroundColor: C.forest }]} />
      </View>
      <Text style={{ flex: 1, fontFamily: F.medium, fontSize: wide ? 17 : 16, lineHeight: lh(wide ? 17 : 16, 22), color: C.ink }}>{label}</Text>
      {wide ? <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>{index + 1}</Text> : null}
    </PressScale>
  );
}

function QuizFlow({ mod }: { mod: AhiModule }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wide } = useLayout();
  const { drafts, scores, setDraftAnswer, commitModule } = useAhi();
  const draft = useMemo(() => drafts[mod.id] ?? {}, [drafts, mod.id]);
  const visible = mod.questions;

  const [i, setI] = useState(() => {
    const first = visible.findIndex((qq) => draft[qq.id] === undefined);
    return first === -1 ? 0 : first;
  });
  const idx = Math.min(i, visible.length - 1);
  const qq = visible[idx];
  const chosen = draft[qq.id];
  const isLast = idx === visible.length - 1;

  const [anim] = useState(() => new Animated.Value(1));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }).start();
  }, [idx, anim]);

  const finish = useCallback(() => {
    if (!commitModule(mod.id)) {
      // Something is unanswered — jump back to it.
      const missing = mod.questions.findIndex((x) => (drafts[mod.id] ?? {})[x.id] === undefined);
      setI(Math.max(0, missing));
      return;
    }
    router.replace(`/${mod.id}/result`);
  }, [commitModule, drafts, mod, router]);

  const pick = (optionIndex: number) => {
    setDraftAnswer(mod.id, qq.id, optionIndex);
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    if (timer.current) clearTimeout(timer.current);
    // Advance after a beat so the selection is visible.
    timer.current = setTimeout(() => {
      if (isLast) finishRef.current();
      else setI((n) => n + 1);
    }, 320);
  };
  // Latest handlers for the delayed advance and the key listener, refreshed after every render.
  const finishRef = useRef(finish);

  const goNext = () => {
    if (chosen === undefined) return;
    if (isLast) finish();
    else setI(idx + 1);
  };
  const goBack = () => idx > 0 && setI(idx - 1);
  const exit = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  // Number keys answer, Enter continues, ← goes back (web).
  const keyRef = useRef({ pick, goNext, goBack, count: qq.options.length });
  useLayoutEffect(() => {
    finishRef.current = finish;
    keyRef.current = { pick, goNext, goBack, count: qq.options.length };
  });
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= keyRef.current.count) keyRef.current.pick(n - 1);
      else if (e.key === 'Enter') keyRef.current.goNext();
      else if (e.key === 'ArrowLeft') keyRef.current.goBack();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const tx = anim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] });
  const answeredCount = visible.filter((x) => draft[x.id] !== undefined).length;
  const moduleStates = MODULES.map((m) => (m.id === mod.id ? 'part' : scores[m.id] !== undefined ? 'done' : 'none') as 'done' | 'part' | 'none');

  const segments = (
    <View style={{ flexDirection: 'row', gap: 3 }} accessibilityLabel={t('Question {n} of {total}', { n: idx + 1, total: visible.length })}>
      {visible.map((x, k) => (
        <View key={x.id} style={{ flex: 1, height: 4, borderRadius: 9, backgroundColor: draft[x.id] !== undefined ? C.forest : k === idx ? C.sage : C.line }} />
      ))}
    </View>
  );

  const question = (
    <Animated.View style={{ opacity: anim, transform: [{ translateX: tx }], gap: wide ? 10 : 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <Label>{mod.en} · </Label>
        <Deva style={{ fontSize: 15, lineHeight: 22, color: C.moss }}>{mod.deva}</Deva>
        {wide ? (
          <Label>
            {' '}
            · {t('Question {n} of {total}', { n: idx + 1, total: visible.length })}
          </Label>
        ) : null}
      </View>
      {qq.section ? <Text style={{ fontFamily: F.italic, fontSize: wide ? 17 : 15, color: C.muted }}>{qq.section}</Text> : null}
      <Text accessibilityRole="header" style={[styles.q, { fontFamily: F.display, lineHeight: lh(28, 35) }, wide && { fontSize: 40, lineHeight: lh(40, 47), marginBottom: 18 }]}>
        {qq.text}
      </Text>
      <View accessibilityRole="radiogroup" style={{ gap: 10, marginTop: wide ? 0 : 12 }}>
        {qq.options.map((o, k) => (
          <OptionButton key={`${qq.id}.${k}`} label={o.label} index={k} selected={chosen === k} onPress={() => pick(k)} wide={wide} />
        ))}
      </View>
    </Animated.View>
  );

  // Picking an answer moves on by itself, so the only control needed is Back (from the second question).
  const nav = (
    <View style={{ flexDirection: 'row', minHeight: 54 }}>
      {idx > 0 ? <Button title={t('Back')} variant="ghost" onPress={goBack} /> : null}
    </View>
  );

  if (wide) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <BackgroundFX intensity={0.6} />
        <View style={styles.webHead}>
          <Pressable accessibilityRole="link" onPress={() => router.push('/')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Logo size={30} />
            <Text style={{ fontFamily: F.display, fontSize: 19, color: C.ink }}>{t('AHI assessment')}</Text>
          </Pressable>
          {mod.kind === 'index' ? (
            <View accessibilityLabel={`${mod.en}, ${t('domain {n} of {total}', { n: MODULES.indexOf(mod) + 1, total: MODULES.length })}`}>
              <LeafProgress states={moduleStates} width={280} height={36} />
            </View>
          ) : (
            <Text style={{ fontFamily: F.italic, fontSize: 17, color: C.moss }}>{mod.kind === 'prakriti' ? 'Your constitution' : 'In-depth questionnaire'}</Text>
          )}
          <Pressable accessibilityRole="button" onPress={exit} style={({ focused }: PressState) => [{ paddingVertical: 10, paddingHorizontal: 4 }, focused && FOCUS_RING] as StyleProp<ViewStyle>}>
            <Text style={{ fontFamily: F.semi, fontSize: 15, color: C.ink }}>{t('Save and exit')}</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.webMain}>
            <View style={{ flexGrow: 999, flexShrink: 1, flexBasis: 540, minWidth: 0, gap: 28 }}>
              {segments}
              {question}
              {nav}
              <Text style={{ fontFamily: F.body, fontSize: 14, color: C.muted }}>{t('Use keys 1–{n} to answer and ← to go back. Your progress is saved.', { n: qq.options.length })}</Text>
            </View>
            <View style={styles.aside}>
              <Ionicons name="leaf-outline" size={28} color={C.moss} />
              <Text style={{ fontFamily: F.display, fontSize: 22, color: C.ink }}>{t('Why we ask')}</Text>
              <Text style={{ fontFamily: F.body, fontSize: 15, lineHeight: 24, color: C.body }}>{mod.why}</Text>
              <Text style={{ fontFamily: F.italic, fontSize: 15, color: C.muted }}>{mod.source}</Text>
              <View style={{ height: 1, backgroundColor: C.leaf, marginVertical: 6 }} />
              <Text style={{ fontFamily: F.semi, fontSize: 13, color: C.muted }}>
                {t('{n} of {total} answered', { n: answeredCount, total: visible.length })}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <BackgroundFX intensity={0.5} />
      <View style={{ flex: 1, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }}>
        <View style={styles.top}>
          <RoundButton icon="close" label={t('Save and close')} onPress={exit} />
          <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.muted }}>
            {t('{n} of {total}', { n: idx + 1, total: visible.length })}
          </Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={{ paddingHorizontal: 20 }}>{segments}</View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 16 }}>
          {question}
          {idx === 0 ? <Text style={{ fontFamily: F.body, fontSize: 14, lineHeight: 20, color: C.muted, marginTop: 18 }}>{mod.why}</Text> : null}
        </ScrollView>
        <View style={{ paddingHorizontal: 20 }}>{nav}</View>
      </View>
    </View>
  );
}

export default function Quiz() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const mod = moduleById(String(moduleId));
  if (!mod) return <Redirect href="/assess" />;
  return <QuizFlow key={mod.id} mod={mod} />;
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  q: { fontSize: 28, lineHeight: 35, color: C.ink, marginTop: 4 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: C.line, backgroundColor: C.paper },
  optOn: { borderColor: C.forest, backgroundColor: C.mist },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: C.radio, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'transparent' },
  webHead: { paddingVertical: 14, paddingHorizontal: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: 'rgba(244,242,234,0.88)' },
  webMain: { flex: 1, width: '100%', maxWidth: 1100, alignSelf: 'center', paddingVertical: 56, paddingHorizontal: 28, flexDirection: 'row', flexWrap: 'wrap', gap: 48, alignItems: 'flex-start' },
  aside: { flexGrow: 1, flexShrink: 1, flexBasis: 280, backgroundColor: C.mist, borderRadius: 22, padding: 26, gap: 12 },
});
