import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Body, Card, Label, Deva, RoundButton, Chip, Logo, Title, DarkTop } from '../../components/ui';
import { BackgroundFX, FadeIn, GrowBar, PanelGlow, Ring, Sprig } from '../../components/motion';
import { useAhi } from '../../state/AhiContext';
import { MODULES, moduleById, type AhiModule } from '../../data/modules';
import { bandFor, domainScores, DOSHA_NAME, type PrakritiResult } from '../../lib/scoring';
import { DOSHAS, GUIDANCE } from '../../data/content';
import { C, F, toneColor, useLayout } from '../../theme';
import { t } from '../../i18n';

/** Dark rounded header shared by every result: logo or back button, title, and the hero content. */
function ResultHead({ mod, children }: { mod: AhiModule; children: React.ReactNode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wide } = useLayout();
  const overview = () => router.replace('/home');
  return (
    <View style={[styles.head, { paddingTop: (wide ? 28 : insets.top + 8) }]}>
      <PanelGlow width={wide ? 900 : 320} />
      <View style={{ position: 'absolute', right: -50, bottom: -10, opacity: 0.55 }}>
        <Sprig width={wide ? 240 : 170} height={wide ? 300 : 210} />
      </View>
      <View style={[styles.headRow, wide && { maxWidth: 900, width: '100%', alignSelf: 'center' }]}>
        {wide ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Logo size={30} light />
            <Text style={{ fontFamily: F.display, fontSize: 19, color: C.onDark }}>{t('AHI')}</Text>
          </View>
        ) : (
          <RoundButton icon="arrow-back" label={t('Back to overview')} dark onPress={overview} />
        )}
        <Text style={{ fontFamily: F.semi, fontSize: 15, color: C.onDark }}>{t('{name} result', { name: mod.en })}</Text>
        {wide ? <View style={{ width: 80 }} /> : <View style={{ width: 44 }} />}
      </View>
      {children}
    </View>
  );
}

function ResultView({ mod, score }: { mod: AhiModule; score: number }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wide } = useLayout();
  const { completed, composite, scores, answers } = useAhi();
  const band = bandFor(score, mod);
  const nextMod = MODULES.find((m) => m.id !== mod.id && scores[m.id] === undefined);
  const overview = () => router.replace('/home');
  const domains = mod.kind === 'indepth' ? domainScores(mod, answers[mod.id]) : null;
  const tips = mod.id === 'prakriti' ? [] : GUIDANCE[mod.id];

  const head = (
    <ResultHead mod={mod}>
      <View style={{ alignItems: 'center', gap: 6, marginTop: 10 }}>
        <Text style={{ fontFamily: F.italic, fontSize: 20, color: C.leaf }}>
          {mod.title} <Deva style={{ fontSize: 17, lineHeight: 26, color: C.onDarkLabel }}>{mod.deva}</Deva>
        </Text>
        <Ring score={score} size={wide ? 200 : 176} stroke={10} label={`${mod.en} ${t('{n} of 100', { n: score })}, ${band.label}`}>
          <Text style={{ fontFamily: F.display, fontSize: wide ? 64 : 56, color: C.onDark }}>{score}</Text>
          <Text style={{ fontFamily: F.body, fontSize: 12, color: C.onDarkLabel }}>{t('of 100')}</Text>
        </Ring>
        <Text style={{ fontFamily: F.italic, fontSize: wide ? 34 : 30, color: C.pale, textAlign: 'center' }}>{band.short}</Text>
        <Text style={{ fontFamily: F.body, fontSize: 14, lineHeight: 21, color: C.onDarkMuted, textAlign: 'center', maxWidth: 520 }}>
          {band.sanskrit} · {band.text}
        </Text>
      </View>
    </ResultHead>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <BackgroundFX intensity={0.6} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
        <DarkTop />
        {head}
        <View style={{ paddingHorizontal: 20, width: '100%', maxWidth: wide ? 900 : 640, alignSelf: 'center' }}>
          <FadeIn delay={200}>
            <Body style={{ textAlign: 'center', marginTop: 22, fontSize: wide ? 18 : 16, lineHeight: wide ? 28 : 25 }}>{mod.context}</Body>
          </FadeIn>

          <FadeIn delay={280} style={{ flexDirection: wide ? 'row' : 'column', gap: 14, marginTop: 22 }}>
            <Button title={t('Retake')} variant="ghost" icon="refresh" onPress={() => router.replace(`/${mod.id}/quiz`)} style={wide ? { flex: 1 } : undefined} />
            <Button title={t('Back to overview')} icon="arrow-forward" onPress={overview} style={wide ? { flex: 1 } : undefined} />
          </FadeIn>

          {domains ? (
            <FadeIn delay={320}>
              <Card style={{ marginTop: 22, gap: 14 }}>
                <Label style={{ color: C.muted, fontSize: 11 }}>{t('By domain')}</Label>
                {domains.map((d, i) => {
                  const b = bandFor(d.score);
                  return (
                    <View key={d.domain} accessibilityLabel={`${d.domain}: ${t('{n} of {total}', { n: d.raw, total: d.max })}, ${b.label}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Text style={{ width: wide ? 200 : 120, fontFamily: F.semi, fontSize: 14, color: C.ink }}>{d.domain}</Text>
                      <GrowBar value={d.score} delay={300 + i * 70} color={toneColor(b.tone)} />
                      <Text style={{ width: 58, textAlign: 'right', fontFamily: F.display, fontSize: 17, color: C.ink }}>
                        {d.raw}
                        <Text style={{ fontFamily: F.body, fontSize: 12, color: C.muted }}>/{d.max}</Text>
                      </Text>
                    </View>
                  );
                })}
              </Card>
            </FadeIn>
          ) : null}

          <FadeIn delay={340}>
            <Title size={wide ? 30 : 24} accent={t('gently')} style={{ marginTop: 30 }}>
              {t('This week,')}
            </Title>
            <View style={{ flexDirection: wide ? 'row' : 'column', gap: 12, marginTop: 12 }}>
              {tips.map((g) => (
                <Card key={g.title} style={[{ gap: 8 }, wide && { flex: 1 }]}>
                  <Chip label={`${mod.en} · ${score}`} />
                  <Text style={{ fontFamily: F.display, fontSize: 20, color: C.ink }}>{g.title}</Text>
                  <Body style={{ fontSize: 15, lineHeight: 22 }}>{g.body}</Body>
                </Card>
              ))}
            </View>
          </FadeIn>

          <FadeIn delay={400}>
            {mod.kind === 'index' ? (
            <Card style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(220,229,211,0.92)', borderWidth: 0 }}>
              <Ionicons name="leaf" size={24} color={C.forest} />
              <View style={{ flex: 1 }}>
                <Label style={{ fontSize: 10 }}>{t('Composite index')}</Label>
                <Text style={{ fontFamily: F.semi, fontSize: 15, color: C.ink, marginTop: 2 }}>
                  {composite !== null ? t('Your AHI is {n} — {band}.', { n: composite, band: bandFor(composite).short }) : `${t('{n} of {total} domains complete', { n: completed, total: MODULES.length })}${nextMod ? ` · ${t('next: {name}', { name: nextMod.en })}` : ''}.`}
                </Text>
              </View>
              {nextMod ? <Button title={t('Next')} size="sm" icon="arrow-forward" onPress={() => router.replace(`/${nextMod.id}/quiz`)} /> : null}
            </Card>
            ) : null}
            <Body style={{ fontSize: 12.5, lineHeight: 19, color: C.muted, marginTop: 18, textAlign: 'center' }}>{t('Source: {source}. AHI is a wellness screening, not a medical diagnosis.', { source: mod.source })}</Body>
          </FadeIn>
        </View>
      </ScrollView>
    </View>
  );
}

function PrakritiView({ mod, result }: { mod: AhiModule; result: PrakritiResult }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wide } = useLayout();
  const lead = DOSHAS.filter((d) => result.leading.includes(d.id as never));
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <BackgroundFX intensity={0.6} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
        <DarkTop />
        <ResultHead mod={mod}>
          <View style={{ alignItems: 'center', gap: 8, marginTop: 14, paddingHorizontal: 8 }}>
            <Text style={{ fontFamily: F.italic, fontSize: 20, color: C.leaf }}>
              {mod.title} <Deva style={{ fontSize: 17, lineHeight: 26, color: C.onDarkLabel }}>{mod.deva}</Deva>
            </Text>
            <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: wide ? 56 : 42, color: C.onDark, textAlign: 'center' }}>
              {result.name}
            </Text>
            <Text style={{ fontFamily: F.body, fontSize: 14, color: C.onDarkMuted }}>{result.leading.length === 1 ? t('Your leading doṣa') : result.leading.length === 2 ? t('Two doṣas lead together') : t('All three doṣas are close')}</Text>
            <View style={{ width: '100%', maxWidth: 520, gap: 12, marginTop: 14 }}>
              {(['vata', 'pitta', 'kapha'] as const).map((id, i) => (
                <View key={id} accessibilityLabel={`${DOSHA_NAME[id]} ${result.shares[id]} percent`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ width: 62, fontFamily: F.italic, fontSize: 18, color: C.pale }}>{DOSHA_NAME[id]}</Text>
                  <GrowBar value={result.shares[id]} delay={300 + i * 90} color={result.leading.includes(id) ? C.leaf : 'rgba(220,229,211,0.5)'} track="rgba(220,229,211,0.18)" />
                  <Text style={{ width: 44, textAlign: 'right', fontFamily: F.display, fontSize: 18, color: C.onDark }}>{result.shares[id]}%</Text>
                </View>
              ))}
            </View>
          </View>
        </ResultHead>
        <View style={{ paddingHorizontal: 20, width: '100%', maxWidth: wide ? 900 : 640, alignSelf: 'center' }}>
          <FadeIn delay={200}>
            <Body style={{ textAlign: 'center', marginTop: 22, fontSize: wide ? 18 : 16, lineHeight: wide ? 28 : 25 }}>{mod.context}</Body>
          </FadeIn>
          <FadeIn delay={260} style={{ flexDirection: wide ? 'row' : 'column', gap: 12, marginTop: 20 }}>
            {lead.map((d) => (
              <Card key={d.id} style={[{ gap: 8 }, wide && { flex: 1 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
                  <Text style={{ fontFamily: F.display, fontSize: 26, color: C.ink }}>{d.name}</Text>
                  <Deva style={{ fontSize: 17, lineHeight: 26, color: C.muted }}>{d.deva}</Deva>
                </View>
                <Label style={{ fontSize: 11, color: d.color }}>{d.elements}</Label>
                <Body style={{ fontSize: 15, lineHeight: 23 }}>{d.text}</Body>
              </Card>
            ))}
          </FadeIn>
          <FadeIn delay={320} style={{ flexDirection: wide ? 'row' : 'column', gap: 14, marginTop: 22 }}>
            <Button title={t('Retake')} variant="ghost" icon="refresh" onPress={() => router.replace(`/${mod.id}/quiz`)} style={wide ? { flex: 1 } : undefined} />
            <Button title={t('Back to overview')} icon="arrow-forward" onPress={() => router.replace('/home')} style={wide ? { flex: 1 } : undefined} />
          </FadeIn>
          <Body style={{ fontSize: 12.5, lineHeight: 19, color: C.muted, marginTop: 18, textAlign: 'center' }}>
            {t('Source: {source}. Raw points — Vāta {v}, Pitta {p}, Kapha {k} (9–36 each). A Vaidya’s examination gives the definitive Prakṛti.', { source: mod.source, v: result.raw.vata, p: result.raw.pitta, k: result.raw.kapha })}
          </Body>
        </View>
      </ScrollView>
    </View>
  );
}

export default function Result() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const { scores, prakriti } = useAhi();
  const mod = moduleById(String(moduleId));
  if (!mod) return <Redirect href="/home" />;
  if (mod.kind === 'prakriti') {
    if (!prakriti) return <Redirect href={`/${mod.id}/quiz`} />;
    return <PrakritiView mod={mod} result={prakriti} />;
  }
  const score = scores[mod.id];
  if (score === undefined) return <Redirect href={`/${mod.id}/quiz`} />;
  return <ResultView mod={mod} score={score} />;
}

const styles = StyleSheet.create({
  head: { backgroundColor: C.forest, borderBottomLeftRadius: 36, borderBottomRightRadius: 36, paddingBottom: 30, paddingHorizontal: 16, overflow: 'hidden' },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
