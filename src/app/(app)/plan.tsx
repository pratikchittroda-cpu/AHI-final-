import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, H2, Body, Label, DarkPanel, Title, Button } from '../../components/ui';
import { FadeIn } from '../../components/motion';
import { KalaStrip, RoutineList, GuidanceCards, routineDone } from '../../components/ahi';
import { useAhi } from '../../state/AhiContext';
import { KALAS, currentKala, DEFAULT_ROUTINE } from '../../data/content';
import { C, F, useLayout } from '../../theme';
import { t } from '../../i18n';

const pad = (n: number) => String(n % 24).padStart(2, '0');

/** Dinacaryā: six kālas of the day and today's routine. */
export default function Plan() {
  const router = useRouter();
  const { wide } = useLayout();
  const { routine, completed } = useAhi();
  const cur = currentKala();
  const done = routineDone(routine.done);

  return (
    <Screen maxWidth={wide ? 1100 : 760} style={wide ? { paddingHorizontal: 40, paddingTop: 40 } : undefined}>
      <FadeIn>
        <Label>{t('Dinacaryā')}</Label>
        <Title size={wide ? 48 : 32} accent={t('rhythm.')} style={{ marginTop: 6 }}>
          {t('The day has a')}
        </Title>
        <Body style={{ marginTop: 6, maxWidth: 520 }}>{t('Six kālas, each ruled by a doṣa. Your plan follows them — rising, eating and resting at the times the body expects.')}</Body>
      </FadeIn>

      <FadeIn delay={100}>
        <DarkPanel style={{ marginTop: 20, gap: 22, padding: wide ? 32 : 20 }}>
          <KalaStrip dark />
          <View style={{ flexDirection: wide ? 'row' : 'column', gap: wide ? 18 : 14 }}>
            {KALAS.map((k) => (
              <View key={k.from} style={[{ opacity: k === cur ? 1 : 0.62 }, wide ? { flex: 1, gap: 6 } : { flexDirection: 'row', gap: 12 }]}>
                <Text style={{ width: wide ? undefined : 70, fontFamily: F.semi, fontSize: 11, letterSpacing: 1.4, color: C.leaf }}>
                  {pad(k.from)}–{pad(k.to)}
                </Text>
                <View style={{ flex: wide ? undefined : 1 }}>
                  <Text style={{ fontFamily: F.italic, fontSize: wide ? 24 : 19, color: C.onDark }}>
                    {t(k.dosha)}
                    {k === cur ? ` · ${t('now')}` : ''}
                  </Text>
                  <Text style={{ fontFamily: F.body, fontSize: 14, lineHeight: 21, color: C.onDarkMuted }}>{wide ? k.short : k.tip}</Text>
                </View>
              </View>
            ))}
          </View>
        </DarkPanel>
      </FadeIn>

      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 22, marginTop: 24 }}>
        <FadeIn delay={180} style={{ flex: wide ? 3 : undefined, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <H2>{t('Today’s routine')}</H2>
            <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>
              {t('{n} of {total}', { n: done, total: DEFAULT_ROUTINE.length })}
            </Text>
          </View>
          <RoutineList />
        </FadeIn>
        {!wide ? (
          <Button title={t('Food & herbs')} variant="ghost" icon="leaf-outline" onPress={() => router.push('/herbs')} />
        ) : null}
        <FadeIn delay={240} style={{ flex: wide ? 2 : undefined, gap: 12 }}>
          {completed > 0 ? (
            <>
              <Title size={wide ? 26 : 24} accent={t('gently')}>
                {t('This week,')}
              </Title>
              <GuidanceCards />
            </>
          ) : (
            <View style={styles.empty}>
              <Text style={{ fontFamily: F.display, fontSize: 22, color: C.ink }}>{t('Gentle guidance')}</Text>
              <Body style={{ fontSize: 15, lineHeight: 23 }}>{t('Complete a domain and your plan will suggest small changes for your lowest domains.')}</Body>
              <Button title={t('Begin the assessment')} size="sm" icon="arrow-forward" onPress={() => router.push('/assess')} style={{ alignSelf: 'flex-start', marginTop: 6 }} />
            </View>
          )}
        </FadeIn>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { backgroundColor: C.mist, borderRadius: 22, padding: 24, gap: 8 },
});
