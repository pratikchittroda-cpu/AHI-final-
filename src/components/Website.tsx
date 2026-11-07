/** The V5 public website (landing page). Rendered on web; the native app shows a mobile welcome instead. */
import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { Logo, Title, Kicker, Button, Deva, LeafDivider, Label, Container, type IconName } from './ui';
import { BackgroundFX, FadeIn, Sprig, PressScale, FOCUS_RING, type PressState } from './motion';
import { HerbArt } from './HerbArt';
import { KalaStrip, StatRow, type Stat } from './ahi';
import { MODULES, PRAKRITI, TOTAL_QUESTIONS } from '../data/modules';
import { useAhi } from '../state/AhiContext';
import { SHLOKA, DOSHAS, HERBS, KALAS, currentKala, DISCLAIMER } from '../data/content';
import { C, F, useLayout } from '../theme';
import { lh, noSpacing, t } from '../i18n';

type SectionKey = 'top' | 'dosha' | 'domains' | 'day' | 'herbs' | 'vaidya';
const NAV: [SectionKey, string][] = [
  ['dosha', 'Doṣa'],
  ['domains', 'Domains'],
  ['day', 'Daily rhythm'],
  ['herbs', 'Herbs'],
  ['vaidya', 'For Vaidyas'],
];

const SAMPLE = [72, 64, 80, 77, 70, 75, 68, 82, 78]; // illustrative sample index on the hero card (one per domain, averaging 74)

function NavLink({ label, onPress, color = C.ink, style }: { label: string; onPress: () => void; color?: string; style?: StyleProp<TextStyle> }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={({ focused }: PressState) => [{ paddingVertical: 8 }, focused && FOCUS_RING] as StyleProp<ViewStyle>}>
      {({ hovered }: PressState) => <Text style={[{ fontFamily: F.medium, fontSize: 15, color: hovered ? C.moss : color }, style]}>{label}</Text>}
    </Pressable>
  );
}

const Para = ({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) => <Text style={[styles.p, { fontFamily: F.body }, style]}>{children}</Text>;

/** Facts about the index itself, shown under the hero. */
const FACTS: Stat[] = [
  { label: 'Questions', icon: 'chatbubble-ellipses', value: String(TOTAL_QUESTIONS), note: `Plain questions about the last 30 days, across ${MODULES.length} domains.` },
  { label: 'Classical domains', icon: 'leaf', value: String(MODULES.length), note: 'From Agni and Nidrā to Sattva, rooted in Caraka Saṃhitā.' },
  { label: 'Prakṛti questions', icon: 'flower', value: String(PRAKRITI.questions.length), note: 'A separate questionnaire to find your constitution.' },
  { label: 'Kept on your device', icon: 'lock-closed', value: '100%', note: 'No account needed. Your answers and scores never leave it.' },
];

export function Website() {
  const router = useRouter();
  const { width, wide } = useLayout();
  const { completed } = useAhi();
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [pos, setPos] = useState<Partial<Record<SectionKey, number>>>({});
  const mark = (k: SectionKey) => (e: { nativeEvent: { layout: { y: number } } }) => {
    const y = e.nativeEvent.layout.y;
    setPos((p) => (p[k] === y ? p : { ...p, [k]: y }));
  };
  const go = (k: SectionKey) => scroll.current?.scrollTo({ y: Math.max(0, (pos[k] ?? 0) - 70), animated: true });
  const begin = () => router.push(completed ? '/home' : '/assess');
  const h1 = wide ? Math.max(56, Math.min(88, width * 0.06)) : Math.max(42, Math.min(56, width * 0.11));
  const h2 = wide ? Math.max(40, Math.min(60, width * 0.044)) : 38;
  const cur = currentKala();
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <BackgroundFX intensity={1} />
      {/* Sticky header */}
      <View style={styles.header}>
        <Container style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20, paddingVertical: 14 }}>
          <Pressable accessibilityRole="link" accessibilityLabel={t('AHI, Ayurveda Health Index')} onPress={() => go('top')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Logo size={36} />
            <View>
              <Text style={{ fontFamily: F.display, fontSize: 22, lineHeight: 24, color: C.ink }}>{t('AHI')}</Text>
              <Text style={{ fontFamily: F.body, fontSize: 12, color: C.muted }}>{t('Ayurveda Health Index')}</Text>
            </View>
          </Pressable>
          {wide ? (
            <View style={{ flexDirection: 'row', gap: 30 }} accessibilityRole="none" aria-label={t('Primary')}>
              {NAV.map(([k, l]) => (
                <NavLink key={k} label={t(l)} onPress={() => go(k)} />
              ))}
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {width > 520 ? <NavLink label={t('Sign in')} onPress={() => router.push('/sign-in')} style={{ fontFamily: F.semi, paddingHorizontal: 14 }} /> : null}
            <Button title={completed ? t('Open my index') : t('Begin assessment')} size="sm" onPress={begin} />
          </View>
        </Container>
      </View>

      <ScrollView ref={scroll} scrollEventThrottle={16} contentContainerStyle={{ paddingTop: 0 }}>
        {/* Hero */}
        <View onLayout={mark('top')}>
          <Container style={{ paddingTop: wide ? 72 : 40, paddingBottom: wide ? 96 : 56, flexDirection: 'row', flexWrap: 'wrap', gap: 64, alignItems: 'center' }}>
            <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 500, gap: 26 }}>
              <FadeIn>
                <Kicker>{t('आयुर्वेद · A classical wellness index')}</Kicker>
              </FadeIn>
              <FadeIn delay={100}>
                <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: h1, lineHeight: lh(h1, h1 * 1.02), color: C.ink, letterSpacing: -0.5, ...noSpacing() }}>
                  Return to your natural <Text style={{ fontFamily: F.italic, color: C.moss }}>{t('balance.')}</Text>
                </Text>
              </FadeIn>
              <FadeIn delay={200}>
                <Para style={{ fontSize: 19, lineHeight: 31, maxWidth: 500 }}>
                  {t('A gentle assessment across nine classical domains — from Agni and Nidrā to Sattva and immunity — scored from 0 to 100, with a daily plan rooted in Caraka, Suśruta and Vāgbhaṭa.')}
                </Para>
              </FadeIn>
              <FadeIn delay={300} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                <Button title={t('Begin the assessment')} size="lg" icon="arrow-forward" onPress={begin} />
                <Button title={t('Try the 30-second Agni check')} variant="link" onPress={() => router.push('/agni-check')} />
              </FadeIn>
              <FadeIn delay={300} style={styles.trust}>
                {(
                  [
                    ['leaf-outline', 'No account to start'],
                    ['book-outline', 'Classical sources cited'],
                    ['shield-checkmark-outline', 'Screening, not diagnosis'],
                  ] as [IconName, string][]
                ).map(([i, label]) => (
                  <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name={i} size={19} color={C.moss} />
                    <Text style={{ fontFamily: F.body, fontSize: 14, color: C.muted }}>{t(label)}</Text>
                  </View>
                ))}
              </FadeIn>
            </View>
            <FadeIn delay={200} style={{ flexGrow: 1, flexShrink: 1, flexBasis: 440, alignItems: 'center' }}>
              <View style={[styles.arch, { width: Math.min(460, width - 56), height: wide ? 560 : 500 }]}>
                <View style={StyleSheet.absoluteFill}>
                  <View style={{ position: 'absolute', left: 0, right: 0, bottom: 90, alignItems: 'center' }}>
                    <Sprig width={wide ? 400 : 320} height={wide ? 480 : 390} />
                  </View>
                </View>
                <View style={styles.sample}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <View style={{ gap: 2 }}>
                      <Label style={{ fontSize: 10, color: C.muted }}>{t('Sample index')}</Label>
                      <Text style={{ fontFamily: F.display, fontSize: 52, lineHeight: 54, color: C.ink }}>74</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <Text style={{ fontFamily: F.italic, fontSize: 22, color: C.moss }}>{t('Prāya Sama')}</Text>
                      <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>{t('Good')}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 54 }}>
                    {SAMPLE.map((s, i) => (
                      <View key={i} style={{ flex: 1, height: (s / 100) * 54 + 4, borderRadius: 4, backgroundColor: s < 61 ? C.gold : C.moss }} />
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {MODULES.map((m) => (
                      <Text key={m.id} numberOfLines={1} style={{ flex: 1, textAlign: 'center', fontFamily: F.body, fontSize: 10, color: C.muted }}>
                        {m.id === 'vyadhi' ? 'Vyādhi' : m.id === 'samhanana' ? 'Saṃh.' : m.title}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            </FadeIn>
          </Container>
        </View>

        {/* What AHI measures, at a glance */}
        <Container style={{ paddingBottom: wide ? 72 : 44 }}>
          <StatRow stats={FACTS} delay={200} />
        </Container>

        {/* Shloka */}
        <View style={styles.band}>
          <Container max={900} style={{ paddingVertical: wide ? 88 : 56, alignItems: 'center', gap: 18 }}>
            <LeafDivider />
            <Deva style={{ fontSize: wide ? 28 : 22, lineHeight: wide ? 48 : 38, textAlign: 'center' }}>{SHLOKA.sanskrit}</Deva>
            <Text style={{ fontFamily: F.italic, fontSize: wide ? 22 : 19, lineHeight: lh(wide ? 22 : 19, wide ? 34 : 29), color: C.body, textAlign: 'center', maxWidth: 700 }}>{SHLOKA.english}</Text>
            <Label style={{ fontSize: 11, color: C.muted }}>{SHLOKA.source}</Label>
          </Container>
        </View>

        {/* Doṣas */}
        <View onLayout={mark('dosha')}>
          <Container style={{ paddingTop: wide ? 110 : 64, paddingBottom: wide ? 80 : 40 }}>
            <View style={styles.secHead}>
              <Title size={h2} accent={t('one constitution.')} style={{ maxWidth: 620 }}>
                {t('Three doṣas,')}
              </Title>
              <Para style={{ maxWidth: 420 }}>{t('Every answer is read against the three doṣas — the forces that shape digestion, sleep, mind and body, and shift with season and routine.')}</Para>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
              {DOSHAS.map((d) => (
                <PressScale key={d.id} lift accessibilityRole="none" style={[styles.card, { flexGrow: 1, flexShrink: 1, flexBasis: 300, padding: 30, gap: 14 }]} hoverStyle={{ borderColor: C.leaf }}>
                  <Svg width={64} height={64} viewBox="0 0 64 64">
                    <Circle cx="32" cy="32" r="30" fill="none" stroke={d.color} strokeWidth={1} />
                    <Circle cx="32" cy="32" r="22" fill="none" stroke={d.color} strokeWidth={1} strokeDasharray={d.dash} />
                    <Circle cx="32" cy="32" r="12" fill={d.color} />
                  </Svg>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
                    <Text style={{ fontFamily: F.display, fontSize: 34, color: C.ink }}>{d.name}</Text>
                    <Deva style={{ fontSize: 20, color: C.muted }}>{d.deva}</Deva>
                  </View>
                  <Label style={{ fontSize: 11, color: d.color }}>{d.elements}</Label>
                  <Para style={{ fontSize: 16, lineHeight: 26 }}>{d.text}</Para>
                </PressScale>
              ))}
            </View>
          </Container>
        </View>

        {/* Nine domains */}
        <View onLayout={mark('domains')}>
          <Container style={{ paddingTop: wide ? 60 : 40, paddingBottom: wide ? 100 : 60, flexDirection: 'row', flexWrap: 'wrap', gap: 56, alignItems: 'flex-start' }}>
            <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 320, gap: 16 }}>
              <Label style={{ fontSize: 12 }}>{t('Nine domains')}</Label>
              <Title size={h2} accent={t('listen for.')}>
                {t('What we')}
              </Title>
              <Para>Each domain maps a classical parameter of Svāsthya to plain questions about the last thirty days — {TOTAL_QUESTIONS} in all. A separate Prakṛti questionnaire finds your constitution.</Para>
            </View>
            <View style={{ flexGrow: 2, flexShrink: 1, flexBasis: 620, borderTopWidth: 1, borderTopColor: C.lineRow }}>
              {MODULES.map((m, i) => (
                <PressScale key={m.id} onPress={() => router.push(`/${m.id}/quiz`)} accessibilityRole="link" accessibilityLabel={`${m.en}, ${m.title}. Begin`} style={styles.domRow} hoverStyle={{ backgroundColor: C.mist }}>
                  {({ hovered }) => (
                    <>
                      {wide ? <Text style={{ width: 40, fontFamily: F.display, fontSize: 22, color: C.sage }}>{String(i + 1).padStart(2, '0')}</Text> : null}
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.mist, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name={`${m.icon}-outline` as IconName} size={22} color={C.forest} />
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 10 }}>
                          <Text style={{ fontFamily: F.display, fontSize: wide ? 26 : 22, color: C.ink }}>{m.en}</Text>
                          <Text style={{ fontFamily: F.italic, fontSize: 20, color: C.moss }}>{m.title}</Text>
                          <Deva style={{ fontSize: 16, lineHeight: 24, color: C.muted }}>{m.deva}</Deva>
                        </View>
                        <Text style={{ fontFamily: F.body, fontSize: 15, lineHeight: 23, color: C.body }}>{m.blurb}</Text>
                      </View>
                      <Ionicons name="arrow-forward" size={20} color={C.moss} style={{ transform: [{ translateX: hovered ? 4 : 0 }] }} />
                    </>
                  )}
                </PressScale>
              ))}
            </View>
          </Container>
        </View>

        {/* Daily rhythm */}
        <View onLayout={mark('day')} style={{ backgroundColor: C.forest }}>
          <Container style={{ paddingVertical: wide ? 100 : 64, gap: 40 }}>
            <View style={styles.secHead}>
              <Title size={h2} color={C.onDark} accentColor={C.leaf} accent={t('rhythm.')}>
                {t('The day has a')}
              </Title>
              <Para style={{ color: C.onDarkMuted, maxWidth: 440 }}>{t('Six kālas, each ruled by a doṣa. Your plan follows them — rising, eating and resting at the times the body expects.')}</Para>
            </View>
            <KalaStrip dark />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}>
              {KALAS.map((k) => (
                <View key={k.from} style={{ flexGrow: 1, flexShrink: 1, flexBasis: wide ? 140 : 150, gap: 6, opacity: k === cur ? 1 : 0.6 }}>
                  <Label style={{ fontSize: 11, color: C.leaf }}>
                    {String(k.from % 24).padStart(2, '0')}–{String(k.to % 24).padStart(2, '0')}
                    {k === cur ? ` · ${t('now')} ${hhmm}` : ''}
                  </Label>
                  <Text style={{ fontFamily: F.italic, fontSize: 24, color: C.onDark }}>{t(k.dosha)}</Text>
                  <Text style={{ fontFamily: F.body, fontSize: 14, lineHeight: 21, color: C.onDarkMuted }}>{k.short}</Text>
                </View>
              ))}
            </View>
          </Container>
        </View>

        {/* Herbs */}
        <View onLayout={mark('herbs')}>
          <Container style={{ paddingTop: wide ? 110 : 64, paddingBottom: wide ? 90 : 48 }}>
            <View style={styles.secHead}>
              <Title size={h2} accent={t('herb garden.')}>
                {t('From the')}
              </Title>
              <Para style={{ fontSize: 15, lineHeight: 24, color: C.muted, maxWidth: 400 }}>{t('Traditional uses from the classical texts. Always confirm herbs and amounts with a qualified Vaidya.')}</Para>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}>
              {HERBS.map((h) => (
                <PressScale key={h.name} lift accessibilityRole="none" style={[styles.card, { flexGrow: 1, flexShrink: 1, flexBasis: 250, overflow: 'hidden' }]} hoverStyle={{ borderColor: C.leaf }}>
                  <View style={{ height: 180, backgroundColor: h.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <HerbArt leaves={h.leaves} spread={h.spread} />
                  </View>
                  <View style={{ padding: 22, gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                      <Text style={{ fontFamily: F.display, fontSize: 24, color: C.ink }}>{h.name}</Text>
                      <Deva style={{ fontSize: 16, lineHeight: 26, color: C.muted }}>{h.deva}</Deva>
                    </View>
                    <Text style={{ fontFamily: F.italic, fontSize: 16, color: C.moss }}>{h.latin}</Text>
                    <Para style={{ fontSize: 15, lineHeight: 23, marginTop: 6 }}>{h.text}</Para>
                  </View>
                </PressScale>
              ))}
            </View>
          </Container>
        </View>

        {/* For Vaidyas */}
        <View onLayout={mark('vaidya')} style={{ paddingHorizontal: 28, paddingBottom: wide ? 110 : 64 }}>
          <View style={[styles.vaidya, { padding: wide ? 60 : 28 }]}>
            <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 400, gap: 18 }}>
              <Label style={{ fontSize: 12 }}>{t('For Vaidyas')}</Label>
              <Title size={wide ? Math.max(38, Math.min(54, width * 0.04)) : 34} accent={t('beautifully simple.')}>
                {t('Aṣṭavidha Parīkṣā,')}
              </Title>
              <Para>{t('See each patient’s index before they arrive, record the eight-fold examination in a few taps, and share a plan they can follow at home.')}</Para>
              <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.moss }}>{t('Practitioner portal · coming soon')}</Text>
            </View>
            <View style={styles.patients} accessibilityLabel={t('Illustration of the practitioner view')}>
              {(
                [
                  ['A', 'Patient A', '10:00 · follow-up', 74, '+6', C.forest, C.moss],
                  ['B', 'Patient B', '10:30 · new', 58, 'New', '#5E7F86', C.muted],
                  ['C', 'Patient C', '11:15 · follow-up', 81, '+3', C.moss, C.moss],
                  ['D', 'Patient D', '12:00 · follow-up', 62, '−4', '#9A7B34', '#8A5A1F'],
                ] as const
              ).map(([i, n, when, s, d, bg, dc], k) => (
                <View key={i} style={[styles.prow, k > 0 && { borderTopWidth: 1, borderTopColor: '#E5E6DC' }]}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: F.display, fontSize: 18, color: C.onDark }}>{i}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: F.semi, fontSize: 16, color: C.ink }}>{t(n)}</Text>
                    <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>{t(when)}</Text>
                  </View>
                  <Text style={{ fontFamily: F.display, fontSize: 26, color: C.ink }}>{s}</Text>
                  <Text style={{ minWidth: 48, textAlign: 'right', fontFamily: F.semi, fontSize: 13, color: dc }}>{t(d)}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Closing CTA */}
        <Container max={900} style={{ paddingBottom: wide ? 110 : 64, alignItems: 'center', gap: 22 }}>
          <HerbArt leaves={6} size={110} color={C.moss} />
          <Title size={wide ? Math.max(42, Math.min(66, width * 0.05)) : 38} accent={t('for your health.')} center>
            {t('Ten quiet minutes')}
          </Title>
          <Button title={t('Begin the assessment')} size="lg" onPress={begin} />
          <Text style={{ fontFamily: F.body, fontSize: 14, lineHeight: 22, color: C.muted, maxWidth: 520, textAlign: 'center' }}>{t(DISCLAIMER)}</Text>
        </Container>

        {/* Footer */}
        <View style={{ backgroundColor: C.deep }}>
          <Container style={{ paddingVertical: 36, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
              <Text style={{ fontFamily: F.display, fontSize: 22, color: C.onDark }}>{t('AHI')}</Text>
              <Text style={{ fontFamily: F.body, fontSize: 14, color: C.onDarkMuted }}>© {new Date().getFullYear()} Ayurveda Health Index</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 24, flexWrap: 'wrap' }}>
              <NavLink label={t('My index')} color={C.pale} onPress={() => router.push('/home')} />
              <NavLink label={t('Assessment')} color={C.pale} onPress={() => router.push('/assess')} />
              <NavLink label={t('Daily rhythm')} color={C.pale} onPress={() => router.push('/plan')} />
              <NavLink label={t('Health disclaimer')} color={C.pale} onPress={() => go('top')} />
            </View>
          </Container>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { zIndex: 10, backgroundColor: 'rgba(244,242,234,0.9)', borderBottomWidth: 1, borderBottomColor: C.line },
  p: { fontSize: 17, lineHeight: 28, color: C.body },
  trust: { flexDirection: 'row', flexWrap: 'wrap', gap: 28, paddingTop: 22, borderTopWidth: 1, borderTopColor: C.line },
  arch: { borderTopLeftRadius: 230, borderTopRightRadius: 230, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, backgroundColor: C.forest, overflow: 'hidden', justifyContent: 'flex-end', padding: 28 },
  sample: { backgroundColor: C.paper, borderRadius: 18, paddingVertical: 20, paddingHorizontal: 22, gap: 14, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 30, shadowOffset: { width: 0, height: 20 } },
  band: { backgroundColor: 'rgba(233,238,227,0.92)', borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line },
  secHead: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, marginBottom: 44 },
  card: { backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 22 },
  domRow: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingVertical: 24, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.lineRow },
  vaidya: { width: '100%', maxWidth: 1240, alignSelf: 'center', backgroundColor: C.pale, borderRadius: 32, flexDirection: 'row', flexWrap: 'wrap', gap: 56, alignItems: 'center' },
  patients: { flexGrow: 1, flexShrink: 1, flexBasis: 360, backgroundColor: C.paper, borderRadius: 22, paddingVertical: 8, shadowColor: C.deep, shadowOpacity: 0.25, shadowRadius: 30, shadowOffset: { width: 0, height: 24 } },
  prow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 22 },
});
