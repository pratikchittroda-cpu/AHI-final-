import React from 'react';
import { View, Text, Share, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Label, Button, Card, Title, RoundButton, Body, DarkTop } from '../../components/ui';
import { FadeIn, PanelGlow, Ring, Glow, Sprig } from '../../components/motion';
import { CompositePanel, DomainBars, TrendChart, GuidanceCards } from '../../components/ahi';
import { useAhi } from '../../state/AhiContext';
import { MODULES } from '../../data/modules';
import { bandFor } from '../../lib/scoring';
import { DISCLAIMER } from '../../data/content';
import { C, F, useLayout } from '../../theme';
import { locale, t } from '../../i18n';

/** My index: composite AHI, the nine domain scores, history and guidance. */
export default function Report() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wide } = useLayout();
  const { composite, completed, scores, history } = useAhi();
  const band = composite === null ? null : bandFor(composite);
  const delta = history.length > 1 ? history[0].composite - history[1].composite : null;

  const share = () => {
    const lines = MODULES.filter((m) => scores[m.id] !== undefined).map((m) => `${m.en} (${m.title}): ${scores[m.id]}`);
    const head = composite !== null && band ? t('My Ayurveda Health Index: {n}/100 ({band}).', { n: composite, band: band.label }) : t('My Ayurveda Health Index: {n} of {total} domains complete.', { n: completed, total: MODULES.length });
    Share.share({ message: `${head}\n${lines.join('\n')}` }).catch(() => {});
  };

  const domains = (
    <Card style={{ gap: 14, padding: wide ? 26 : 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <Label style={{ color: C.muted, fontSize: 11 }}>{t('Nine domains')}</Label>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.gold }} />
          <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>{t('41–60 · mild imbalance')}</Text>
        </View>
      </View>
      <DomainBars compact={!wide} />
    </Card>
  );

  const historyCard = history.length ? (
    <Card style={{ padding: 0 }}>
      {history.slice(0, 8).map((h, i) => (
        <View key={h.at} style={[styles.hrow, i > 0 && { borderTopWidth: 1, borderTopColor: C.lineSoft }]}>
          <Text style={{ flex: 1, fontFamily: F.medium, fontSize: 15, color: C.ink }}>{new Date(h.at).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          <Text style={{ fontFamily: F.italic, fontSize: 15, color: C.moss, marginRight: 12 }}>{bandFor(h.composite).short}</Text>
          <Text style={{ fontFamily: F.display, fontSize: 22, color: C.ink }}>{h.composite}</Text>
        </View>
      ))}
    </Card>
  ) : null;

  if (wide) {
    return (
      <Screen fx={0.8} padded={false} maxWidth={1240} style={{ paddingHorizontal: 40, paddingTop: 32, gap: 22 }}>
        <FadeIn style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: F.body, fontSize: 15, color: C.muted }}>{t('Ayurveda Health Index · nine domains, equally weighted')}</Text>
            <Title size={44} accent={t('index.')}>
              {t('Your')}
            </Title>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title={t('Share')} variant="ghost" size="sm" icon="share-outline" onPress={share} />
            <Button title={t('Retake assessment')} size="sm" onPress={() => router.push('/assess')} />
          </View>
        </FadeIn>
        <View style={styles.row}>
          <FadeIn delay={80} style={{ flexGrow: 1, flexShrink: 1, flexBasis: 380 }}>
            <CompositePanel size={170} delta={delta} style={{ flex: 1 }} />
          </FadeIn>
          <FadeIn delay={140} style={{ flexGrow: 2, flexShrink: 1, flexBasis: 460 }}>
            <Card style={{ flex: 1, padding: 26, gap: 10 }}>
              <Label style={{ color: C.muted, fontSize: 11 }}>{t('Over time')}</Label>
              <TrendChart />
            </Card>
          </FadeIn>
        </View>
        <View style={styles.row}>
          <FadeIn delay={180} style={{ flexGrow: 2, flexShrink: 1, flexBasis: 480 }}>
            {domains}
          </FadeIn>
          <FadeIn delay={220} style={{ flexGrow: 1, flexShrink: 1, flexBasis: 300, gap: 12 }}>
            <Label style={{ color: C.muted, fontSize: 11 }}>{t('History')}</Label>
            {historyCard ?? <Body style={{ fontSize: 15 }}>{t('Your index is saved here each time all nine domains are complete.')}</Body>}
          </FadeIn>
        </View>
        {completed > 0 ? (
          <View style={{ gap: 14 }}>
            <Title size={30} accent={t('gently')}>
              {t('This week,')}
            </Title>
            <GuidanceCards wide />
          </View>
        ) : null}
        <Body style={{ fontSize: 13, lineHeight: 20, color: C.muted }}>{DISCLAIMER}</Body>
      </Screen>
    );
  }

  return (
    <Screen fx={0.6} padded={false} flushTop bottom={20}>
      <DarkTop />
      <View style={[styles.head, { paddingTop: insets.top + 10 }]}>
        <PanelGlow />
        <View style={{ position: 'absolute', right: -50, bottom: -10, opacity: 0.5 }}>
          <Sprig width={170} height={210} />
        </View>
        <View style={styles.headRow}>
          <RoundButton icon="arrow-back" label={t('Back')} dark onPress={() => router.navigate('/home')} />
          <Text style={{ fontFamily: F.semi, fontSize: 15, color: C.onDark }}>{t('Your index')}</Text>
          <RoundButton icon="share-outline" label={t('Share')} dark onPress={share} />
        </View>
        <View style={{ alignItems: 'center', gap: 8, marginTop: 6 }}>
          <View style={{ width: 176, height: 176, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', left: -40, top: -40 }}>
              <Glow size={256} on={composite !== null} />
            </View>
            <Ring score={composite} size={176} stroke={10} label={composite === null ? t('{n} of {total} complete', { n: completed, total: MODULES.length }) : t('Index {n} of 100', { n: composite })}>
              <Text style={{ fontFamily: F.display, fontSize: 56, color: C.onDark }}>{composite ?? '–'}</Text>
              <Text style={{ fontFamily: F.body, fontSize: 12, color: C.onDarkLabel }}>{composite === null ? `${completed} of ${MODULES.length} complete` : 'of 100'}</Text>
            </Ring>
          </View>
          <Text style={{ fontFamily: F.italic, fontSize: 28, color: C.pale }}>{band ? band.short : 'Not ready yet'}</Text>
          <Text style={{ fontFamily: F.body, fontSize: 14, color: C.onDarkMuted, textAlign: 'center', paddingHorizontal: 12 }}>
            {band ? `${band.sanskrit} · ${band.text}` : t('Complete all nine domains to reveal your composite index.')}
          </Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 20, gap: 14, marginTop: 20 }}>
        <FadeIn delay={200}>{domains}</FadeIn>
        {completed > 0 ? (
          <FadeIn delay={260} style={{ gap: 12 }}>
            <Title size={24} accent={t('gently')} style={{ marginTop: 8 }}>
              {t('This week,')}
            </Title>
            <GuidanceCards />
          </FadeIn>
        ) : null}
        {historyCard ? (
          <FadeIn delay={300} style={{ gap: 10 }}>
            <Label>{t('History')}</Label>
            {historyCard}
          </FadeIn>
        ) : null}
        <Button title={completed === MODULES.length ? t('See my daily plan') : t('Continue the assessment')} onPress={() => router.navigate(completed === MODULES.length ? '/plan' : '/assess')} />
        <Body style={{ fontSize: 12.5, lineHeight: 19, color: C.muted }}>{DISCLAIMER}</Body>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 22 },
  head: { backgroundColor: C.forest, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, paddingBottom: 26, paddingHorizontal: 16, overflow: 'hidden' },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hrow: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: 16 },
});
