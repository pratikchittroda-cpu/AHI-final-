/** AHI building blocks shared by the website and app screens. */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Line, Path, Circle } from 'react-native-svg';
import { Button, Card, DarkPanel, Label, Body, Chip, type IconName } from './ui';
import { Glass, useGlass } from './glass';
import { Ring, Glow, GrowBar, PressScale, FadeIn, FOCUS_RING, type PressState } from './motion';
import { useAhi } from '../state/AhiContext';
import { MODULES, TOTAL_QUESTIONS, type AhiModule } from '../data/modules';
import { bandFor, moduleProgress, weakest } from '../lib/scoring';
import { DEFAULT_ROUTINE, GUIDANCE, KALAS, currentKala, dayPosition } from '../data/content';
import { C, F, DOSHA_COLOR, toneColor } from '../theme';
import { getLanguage, lh, locale, noSpacing, t } from '../i18n';

const hhmm = (d = new Date()) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/* ------------------------------------------------------------------ */
/* Composite AHI                                                       */
/* ------------------------------------------------------------------ */
export function CompositePanel({ size = 150, onPress, delta, style }: { size?: number; onPress?: () => void; delta?: number | null; style?: StyleProp<ViewStyle> }) {
  const { composite, completed } = useAhi();
  const band = composite === null ? null : bandFor(composite);
  const glow = size + 70;
  const ring = (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: glow, height: glow, left: -35, top: -35 }}>
        <Glow size={glow} on={composite !== null} />
      </View>
      <Ring score={composite} size={size} stroke={size > 130 ? 9 : 8} label={composite === null ? t('Index not ready, {n} of {total} complete', { n: completed, total: MODULES.length }) : t('Index {n} of 100', { n: composite })}>
        <Text style={{ fontFamily: F.display, fontSize: size * 0.32, color: C.onDark }}>{composite ?? '–'}</Text>
        <Text style={{ fontFamily: F.body, fontSize: 11, color: C.onDarkLabel }}>{composite === null ? t('{n} of {total}', { n: completed, total: MODULES.length }) : t('of 100')}</Text>
      </Ring>
    </View>
  );
  const text = (
    <View style={{ flex: 1, minWidth: onPress ? 0 : 160, gap: 8 }}>
      <Label style={{ color: C.onDarkLabel, fontSize: 11 }}>{t('Your index')}</Label>
      {band ? (
        <>
          <Text style={{ fontFamily: F.italic, fontSize: getLanguage() === 'en' ? 28 : 22, lineHeight: lh(28, 32), color: C.pale }}>{band.short}</Text>
          <Text style={{ fontFamily: F.body, fontSize: 15, lineHeight: 23, color: C.onDarkMuted }}>
            {band.sanskrit} · {band.text}
          </Text>
          {delta != null && delta !== 0 ? <Chip tone="leaf" icon={delta > 0 ? 'trending-up' : 'trending-down'} label={t('{delta} since last time', { delta: `${delta > 0 ? '+' : ''}${delta}` })} /> : null}
        </>
      ) : (
        <>
          <Text style={{ fontFamily: F.italic, fontSize: getLanguage() === 'en' ? 26 : 21, lineHeight: lh(26, 30), color: C.pale }}>{t('Find your index')}</Text>
          <Text style={{ fontFamily: F.body, fontSize: 15, lineHeight: 23, color: C.onDarkMuted }}>
            {completed === 0 ? t('Nine short domains, {total} questions in all. Your index appears once all nine are complete.', { total: TOTAL_QUESTIONS }) : t('{n} more to go — your index appears once all nine domains are complete.', { n: MODULES.length - completed })}
          </Text>
          <View style={{ flexDirection: 'row', gap: 4, marginTop: 2 }}>
            {MODULES.map((_, i) => (
              <View key={i} style={{ flex: 1, height: 4, borderRadius: 9, backgroundColor: i < completed ? C.leaf : 'rgba(220,229,211,0.2)' }} />
            ))}
          </View>
        </>
      )}
    </View>
  );
  const body = (
    <DarkPanel style={[{ flexDirection: 'row', flexWrap: onPress ? 'nowrap' : 'wrap', alignItems: 'center', gap: 24, padding: 26 }, style]}>
      {ring}
      {text}
      {onPress ? <Ionicons name="chevron-forward" size={20} color={C.onDarkLabel} /> : null}
    </DarkPanel>
  );
  if (!onPress) return body;
  return (
    <PressScale onPress={onPress} accessibilityLabel={band ? t('Your index {n}, {band}. Open report', { n: composite ?? 0, band: band.label }) : t('Open your index')}>
      {body}
    </PressScale>
  );
}

/* ------------------------------------------------------------------ */
/* Module card: small ring, Sanskrit term, English label, band, action */
/* ------------------------------------------------------------------ */
export function ModuleCard({ mod, style }: { mod: AhiModule; style?: StyleProp<ViewStyle> }) {
  const router = useRouter();
  const { scores, drafts } = useAhi();
  const score = scores[mod.id];
  const band = score === undefined ? null : bandFor(score);
  const draft = drafts[mod.id];
  const prog = draft ? moduleProgress(mod, draft) : null;
  const action = prog && prog.answered > 0 ? `${t('Continue')} · ${prog.answered}/${prog.total}` : score === undefined ? t('Begin assessment') : t('Retake');
  return (
    <View style={[styles.mcard, style]}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${mod.en}, ${mod.title}. ${band ? `${score}, ${band.label}. ${t('Open result')}` : t('Not scored yet')}`}
        onPress={() => router.push(score === undefined ? `/${mod.id}/quiz` : `/${mod.id}/result`)}
        style={({ hovered, focused }: PressState) => [{ flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 14 }, hovered && { opacity: 0.82 }, focused && FOCUS_RING] as StyleProp<ViewStyle>}
      >
        <Ring score={score ?? null} size={64} stroke={6} color={band ? toneColor(band.tone) : C.moss} track={C.mist} inner={false} delay={300}>
          {score === undefined ? <Ionicons name={`${mod.icon}-outline` as IconName} size={22} color={C.forest} /> : <Text style={{ fontFamily: F.display, fontSize: 21, color: C.ink }}>{score}</Text>}
        </Ring>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.italic, fontSize: 19, color: C.moss }}>{mod.title}</Text>
          <Text style={{ fontFamily: F.display, fontSize: 21, lineHeight: lh(21, 26), color: C.ink }}>{mod.en}</Text>
          <Text style={{ fontFamily: F.semi, fontSize: 12.5, color: band ? toneColor(band.tone) : C.muted, marginTop: 2 }}>{band ? band.short : t('{n} questions · not scored', { n: mod.questions.length })}</Text>
        </View>
      </Pressable>
      <View style={{ marginTop: 'auto' }}>
        <Button title={action} size="sm" variant={score === undefined && !prog ? 'primary' : 'ghost'} icon={score === undefined ? 'arrow-forward' : 'refresh'} onPress={() => router.push(`/${mod.id}/quiz`)} />
      </View>
    </View>
  );
}

/** Lays the nine domain cards out in even columns (3 / 2 / 1 by width). */
export function ModuleGrid({ delay = 160 }: { delay?: number }) {
  const [w, setW] = useState(0);
  const gap = 14;
  const cols = w >= 760 ? 3 : w >= 540 ? 2 : 1;
  const cardW = cols === 1 ? undefined : Math.floor((w - gap * (cols - 1)) / cols);
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
      {MODULES.map((m, i) => (
        <FadeIn key={m.id} delay={delay + i * 50} style={cardW ? { width: cardW } : { width: '100%' }}>
          <ModuleCard mod={m} style={cols === 1 ? { minHeight: 0 } : { flex: 1 }} />
        </FadeIn>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Domain bars                                                         */
/* ------------------------------------------------------------------ */
export function DomainBars({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const { scores } = useAhi();
  return (
    <View style={{ gap: compact ? 11 : 14 }}>
      {MODULES.map((m, i) => {
        const s = scores[m.id];
        const band = s === undefined ? null : bandFor(s);
        return (
          <Pressable key={m.id} accessibilityRole="link" accessibilityLabel={`${m.en}: ${s === undefined ? t('not scored') : `${s}, ${band?.label}`}`} onPress={() => router.push(s === undefined ? `/${m.id}/quiz` : `/${m.id}/result`)} style={styles.barRow}>
            <Ionicons name={`${m.icon}-outline` as IconName} size={compact ? 20 : 22} color={C.moss} style={{ width: compact ? 24 : 32 }} />
            <View style={{ width: compact ? 104 : 190 }}>
              <Text style={{ fontFamily: compact ? F.body : F.semi, fontSize: compact ? 14 : 15, color: C.ink }} numberOfLines={1}>{m.en}</Text>
              {!compact ? <Text style={{ fontFamily: F.italic, fontSize: 15, color: C.muted }}>{m.title}</Text> : null}
            </View>
            <GrowBar value={s ?? 0} height={compact ? 7 : 8} delay={300 + i * 70} color={toneColor(band?.tone)} />
            <Text style={{ width: compact ? 30 : 40, textAlign: 'right', fontFamily: F.display, fontSize: compact ? 16 : 20, color: s === undefined ? C.muted : C.ink }}>{s ?? '–'}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Trend chart (composite history)                                     */
/* ------------------------------------------------------------------ */
export function TrendChart() {
  const { history } = useAhi();
  const pts = [...history].reverse().slice(-8);
  if (pts.length < 2) {
    return (
      <View style={{ height: 190, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Svg width={220} height={60} viewBox="0 0 220 60">
          <Path d="M10,46 C50,48 70,30 110,32 C150,34 170,18 210,16" fill="none" stroke={C.lineStrong} strokeWidth={2} strokeDasharray="4 6" strokeLinecap="round" />
        </Svg>
        <Text style={{ fontFamily: F.body, fontSize: 14, color: C.muted, textAlign: 'center', maxWidth: 320 }}>
          {pts.length === 0 ? t('Your trend appears after you complete all nine domains twice.') : t('One index saved. Retake the domains later to see how it moves.')}
        </Text>
      </View>
    );
  }
  const W = 600;
  const H = 190;
  const min = Math.max(0, Math.min(...pts.map((p) => p.composite)) - 10);
  const max = Math.min(100, Math.max(...pts.map((p) => p.composite)) + 10);
  const xy = pts.map((p, i) => [20 + (i * (W - 40)) / (pts.length - 1), 170 - ((p.composite - min) / Math.max(1, max - min)) * 130] as const);
  let d = `M${xy[0][0]},${xy[0][1]}`;
  for (let i = 1; i < xy.length; i++) {
    const [x0, y0] = xy[i - 1];
    const [x1, y1] = xy[i];
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  const last = xy[xy.length - 1];
  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" accessibilityLabel={t('Index moved from {a} to {b}', { a: pts[0].composite, b: pts[pts.length - 1].composite })}>
        <Defs>
          <LinearGradient id="gf" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={C.sage} stopOpacity={0.35} />
            <Stop offset="1" stopColor={C.sage} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {[50, 110, 170].map((y) => (
          <Line key={y} x1="0" y1={y} x2={W} y2={y} stroke="#E5E6DC" />
        ))}
        <Path d={`${d} L${last[0]},${H} L${xy[0][0]},${H}Z`} fill="url(#gf)" />
        <Path d={d} fill="none" stroke={C.forest} strokeWidth={2.5} strokeLinecap="round" />
        <Circle cx={last[0]} cy={last[1]} r={6} fill={C.forest} stroke={C.paper} strokeWidth={2.5} />
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {pts.map((p, i) => (
          <Text key={p.at} style={{ fontFamily: i === pts.length - 1 ? F.semi : F.body, fontSize: 13, color: i === pts.length - 1 ? C.ink : C.muted }}>
            {new Date(p.at).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })}
            {i === pts.length - 1 ? ` · ${p.composite}` : ''}
          </Text>
        ))}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Kāla (time-of-day) card                                             */
/* ------------------------------------------------------------------ */
export function KalaCard({ style }: { style?: StyleProp<ViewStyle> }) {
  const k = currentKala();
  const now = new Date();
  return (
    <View style={[styles.kala, style]}>
      <Label style={{ fontSize: 11 }}>{t('Right now')} · {hhmm(now)}</Label>
      <Text style={{ fontFamily: F.display, fontSize: 28, color: C.ink }}>{t('{dosha} kāla', { dosha: t(k.dosha) })}</Text>
      <View style={{ flexDirection: 'row', height: 8, borderRadius: 99, overflow: 'hidden', gap: 2 }}>
        {KALAS.map((x) => (
          <View key={x.from} style={{ flex: 1, backgroundColor: x === k ? C.moss : DOSHA_COLOR[x.dosha], opacity: x === k ? 1 : 0.45 }} />
        ))}
      </View>
      <Text style={{ fontFamily: F.body, fontSize: 14, lineHeight: 21, color: C.body }}>{k.tip}</Text>
    </View>
  );
}

/** Compact kāla row for phones. */
export function KalaRow() {
  const k = currentKala();
  const now = new Date();
  const night = now.getHours() >= 18 || now.getHours() < 6;
  return (
    <View style={styles.kalaRow}>
      <Ionicons name={night ? 'moon' : 'sunny'} size={24} color={C.forest} />
      <View style={{ flex: 1 }}>
        <Label style={{ fontSize: 10 }}>
          {t('{dosha} kāla', { dosha: t(k.dosha) })} · {hhmm(now)}
        </Label>
        <Text style={{ fontFamily: F.semi, fontSize: 15, color: C.ink, marginTop: 2 }}>{k.tip}</Text>
      </View>
    </View>
  );
}

export function KalaStrip({ dark }: { dark?: boolean }) {
  const cur = currentKala();
  const pos = dayPosition();
  return (
    <View style={{ paddingTop: 28 }}>
      <View style={{ flexDirection: 'row', height: 14, borderRadius: 99, overflow: 'hidden', gap: 3 }}>
        {KALAS.map((k) => (
          <View key={k.from} style={{ flex: 1, backgroundColor: k === cur && !dark ? C.moss : DOSHA_COLOR[k.dosha], opacity: k === cur ? 1 : 0.45 }} />
        ))}
      </View>
      <View style={{ position: 'absolute', left: `${pos}%`, top: 20, width: 2, height: 30, backgroundColor: dark ? C.onDark : C.forest }} />
      <Text style={{ position: 'absolute', left: `${pos}%`, top: 0, transform: [{ translateX: -30 }], fontFamily: F.semi, fontSize: 10, letterSpacing: 1.4, color: dark ? C.onDark : C.forest, textTransform: 'uppercase', ...noSpacing() }}>{t('Now')} · {hhmm()}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Routine checklist                                                   */
/* ------------------------------------------------------------------ */
export function RoutineList({ limit }: { limit?: number }) {
  const { routine, toggleRoutine } = useAhi();
  const items = limit ? DEFAULT_ROUTINE.slice(0, limit) : DEFAULT_ROUTINE;
  return (
    <Card style={{ padding: 0 }}>
      {items.map((r, i) => {
        const on = !!routine.done[r.id];
        return (
          <Pressable
            key={r.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={t('{item} at {time}', { item: r.label, time: r.time })}
            onPress={() => toggleRoutine(r.id)}
            style={({ hovered }: PressState) => [styles.task, i > 0 && { borderTopWidth: 1, borderTopColor: C.lineSoft }, hovered && { backgroundColor: 'rgba(233,238,227,0.6)' }] as StyleProp<ViewStyle>}
          >
            <Ionicons name={`${r.icon}-outline` as IconName} size={21} color={C.moss} />
            <Text style={{ flex: 1, fontFamily: F.medium, fontSize: 15, color: on ? '#7A867D' : C.ink, textDecorationLine: on ? 'line-through' : 'none' }}>{r.label}</Text>
            <Text style={{ fontFamily: F.body, fontSize: 12, color: C.muted }}>{r.time}</Text>
            <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={on ? C.forest : C.lineStrong} />
          </Pressable>
        );
      })}
    </Card>
  );
}

export function routineDone(done: Record<string, boolean>) {
  return DEFAULT_ROUTINE.filter((r) => done[r.id]).length;
}

/* ------------------------------------------------------------------ */
/* "This week, gently" — tips for the lowest modules                   */
/* ------------------------------------------------------------------ */
export function GuidanceCards({ wide }: { wide?: boolean }) {
  const { scores, plan, togglePlan } = useAhi();
  const ids = weakest(scores, wide ? 3 : 2);
  if (!ids.length) return null;
  return (
    <View style={{ flexDirection: wide ? 'row' : 'column', flexWrap: 'wrap', gap: 16 }}>
      {ids.map((id) => {
        const m = MODULES.find((x) => x.id === id) as AhiModule;
        const tip = GUIDANCE[id][0];
        const key = `${id}.0`;
        const on = !!plan[key];
        return (
          <Card key={id} style={[{ gap: 10, padding: 24 }, wide && { flexGrow: 1, flexShrink: 1, flexBasis: 260 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.mist, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={`${m.icon}-outline` as IconName} size={22} color={C.forest} />
              </View>
              <Chip label={`${m.en} · ${scores[id]}`} />
            </View>
            <Text style={{ fontFamily: F.display, fontSize: 22, lineHeight: lh(22, 27), color: C.ink, marginTop: 4 }}>{tip.title}</Text>
            <Body style={{ fontSize: 15, lineHeight: 23 }}>{tip.body}</Body>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => togglePlan(key)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, marginTop: 'auto' }}>
              <Ionicons name={on ? 'checkbox' : 'square-outline'} size={20} color={on ? C.forest : C.lineStrong} />
              <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.forest }}>{on ? t('Added to my plan') : t('Add to my plan')}</Text>
            </Pressable>
          </Card>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Stat tiles                                                          */
/* ------------------------------------------------------------------ */
export interface Stat {
  label: string; // sentence case, no trailing colon
  value: string;
  unit?: string; // quiet suffix beside the value ("of 9")
  note?: string; // one quiet line under the value
  meter?: number; // 0–100: a progress meter, moss on a lighter moss track
  icon?: string; // Ionicons base name, shown quietly beside the label
}

/** One headline number: label, value, optional unit, note and meter. The number is the chart. */
export function StatTile({ stat, delay = 0, appear, style }: { stat: Stat; delay?: number; appear?: number; style?: StyleProp<ViewStyle> }) {
  // A number is shown large; a word value (a domain's name) is set smaller and may wrap to two lines.
  const numeric = /^[\d.,%–-]+$/.test(stat.value);
  const a11y = `${stat.label}: ${stat.value}${stat.unit ? ` ${stat.unit}` : ''}${stat.note ? `. ${stat.note}` : ''}`;
  return (
    // Sits over the moving leaf background, so it is a pane of liquid glass where iOS has it.
    <Glass accessible accessibilityLabel={a11y} style={[styles.stat, style]} fallback={styles.statSolid} scheme="light" variant="clear" appear={appear}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {stat.icon ? <Ionicons name={`${stat.icon}-outline` as IconName} size={15} color={C.moss} /> : null}
        <Text numberOfLines={2} style={{ flex: 1, fontFamily: F.medium, fontSize: 13, lineHeight: lh(13, 17), color: C.muted }}>
          {t(stat.label)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
        <Text numberOfLines={numeric ? 1 : 2} style={{ flexShrink: 1, fontFamily: F.semi, fontSize: numeric ? 28 : 20, lineHeight: numeric ? 34 : lh(20, 25), color: C.ink }}>
          {stat.value}
        </Text>
        {stat.unit ? <Text style={{ fontFamily: F.body, fontSize: 14, color: C.muted }}>{t(stat.unit)}</Text> : null}
      </View>
      {stat.note ? (
        <Text numberOfLines={2} style={{ fontFamily: F.body, fontSize: 12.5, lineHeight: 18, color: C.muted, marginTop: 2 }}>
          {t(stat.note)}
        </Text>
      ) : null}
      {stat.meter !== undefined ? (
        <View style={{ marginTop: 'auto', paddingTop: 12 }}>
          <GrowBar value={stat.meter} height={6} color={C.moss} track={C.mist} delay={300 + delay} />
        </View>
      ) : null}
    </Glass>
  );
}

/** A row of stat tiles: four across on wide layouts, two by two on phones. */
export function StatRow({ stats, delay = 0 }: { stats: Stat[]; delay?: number }) {
  const [w, setW] = useState(0);
  const glass = useGlass();
  const gap = 12;
  const cols = w >= 720 ? Math.min(4, stats.length) : 2;
  const tileW = w ? Math.floor((w - gap * (cols - 1)) / cols) : undefined;
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
      {stats.map((st, i) => (
        <FadeIn key={st.label} delay={delay + i * 60} fade={!glass} style={tileW ? { width: tileW } : { width: '47%' }}>
          <StatTile stat={st} delay={i * 60} appear={glass ? delay + i * 60 : undefined} style={{ flex: 1 }} />
        </FadeIn>
      ))}
    </View>
  );
}

/** The dashboard's stats: progress through the domains and questions, today's routine, strongest domain. */
export function HomeStats({ delay = 0 }: { delay?: number }) {
  const { scores, drafts, completed, routine } = useAhi();
  const answered = MODULES.reduce((n, m) => n + Math.max(scores[m.id] !== undefined ? m.questions.length : 0, Object.keys(drafts[m.id] ?? {}).length), 0);
  const done = routineDone(routine.done);
  const scored = MODULES.filter((m) => scores[m.id] !== undefined);
  const best = scored.length ? scored.reduce((a, b) => ((scores[b.id] ?? 0) > (scores[a.id] ?? 0) ? b : a)) : null;
  const bestScore = best ? (scores[best.id] as number) : 0;
  const stats: Stat[] = [
    { label: t('Domains complete'), icon: 'leaf', value: String(completed), unit: t('of {total}', { total: MODULES.length }), meter: (completed / MODULES.length) * 100 },
    { label: t('Questions answered'), icon: 'chatbubble-ellipses', value: String(answered), unit: t('of {total}', { total: TOTAL_QUESTIONS }), meter: (answered / TOTAL_QUESTIONS) * 100 },
    { label: t('Today’s routine'), icon: 'sunny', value: String(done), unit: t('of {total}', { total: DEFAULT_ROUTINE.length }), meter: (done / DEFAULT_ROUTINE.length) * 100 },
    best
      ? { label: t('Strongest domain'), icon: 'trophy', value: best.en, note: `${best.title} · ${bestScore} · ${bandFor(bestScore).short}` }
      : { label: t('Strongest domain'), icon: 'trophy', value: '–', note: t('Complete a domain to see it') },
  ];
  return <StatRow stats={stats} delay={delay} />;
}

const styles = StyleSheet.create({
  stat: { minHeight: 132, padding: 16, borderRadius: 20 },
  statSolid: { backgroundColor: 'rgba(251,250,245,0.94)', borderWidth: 1, borderColor: C.line },
  mcard: { backgroundColor: 'rgba(251,250,245,0.94)', borderRadius: 22, borderWidth: 1, borderColor: C.line, padding: 20, gap: 18, minHeight: 190 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 36 },
  kala: { backgroundColor: C.pale, borderRadius: 24, padding: 24, gap: 10 },
  kalaRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, backgroundColor: 'rgba(220,229,211,0.9)' },
  task: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, paddingHorizontal: 16 },
});
