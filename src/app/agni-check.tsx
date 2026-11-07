import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Body, Label, Button, Card, BackHeader, DarkPanel, Title } from '../components/ui';
import { FadeIn, PressScale, GrowBar } from '../components/motion';
import { useAhi } from '../state/AhiContext';
import { AGNI_TYPES, classifyAgni, type AgniScored } from '../data/content';
import { C, F } from '../theme';
import { t } from '../i18n';

/** Quick Agni-type check (supplementary indicators in the AHI document). */
export default function AgniCheck() {
  const router = useRouter();
  const { saveAgni } = useAhi();
  const statements = useMemo(() => {
    const all = AGNI_TYPES.flatMap((t) => t.items.map((text, i) => ({ key: `${t.id}.${i}`, text })));
    return all
      .map((s, i) => ({ s, k: (i * 7) % all.length }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.s);
  }, []);
  const [yes, setYes] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<{ primary: AgniScored | null; scored: AgniScored[] } | null>(null);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const done = () => {
    const r = classifyAgni(yes);
    setResult(r);
    if (r.primary) saveAgni({ id: r.primary.id, name: r.primary.name });
  };

  if (result) {
    const p = result.primary;
    return (
      <Screen fx={0.7} maxWidth={640}>
        <BackHeader title={t('Agni check')} fallback="/" />
        {p ? (
          <>
            <FadeIn>
              <DarkPanel style={{ gap: 8, alignItems: 'center', paddingVertical: 30 }}>
                <View style={styles.flame}>
                  <Ionicons name="flame" size={30} color={C.goldText} />
                </View>
                <Label style={{ color: C.onDarkLabel }}>{t('Your digestive fire')}</Label>
                <Text style={{ fontFamily: F.display, fontSize: 38, color: C.onDark }}>{p.name}</Text>
                <Text style={{ fontFamily: F.italic, fontSize: 19, color: C.pale }}>{p.dosha === 'Balanced' ? t('Balanced') : t('{dosha}-type', { dosha: t(p.dosha) })}</Text>
                <Text style={{ fontFamily: F.body, fontSize: 15, lineHeight: 22, color: C.onDarkMuted, textAlign: 'center', marginTop: 6 }}>{p.meaning}</Text>
              </DarkPanel>
            </FadeIn>
            <FadeIn delay={120}>
              <Card style={{ marginTop: 16, gap: 8 }}>
                <Label>{t('What helps')}</Label>
                <Body>{p.advice}</Body>
              </Card>
            </FadeIn>
            <FadeIn delay={200}>
              <Card style={{ marginTop: 14, gap: 12 }}>
                <Label>{t('Your pattern')}</Label>
                {result.scored.map((ty, i) => (
                  <View key={ty.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ width: 96, fontFamily: F.italic, fontSize: 17, color: C.ink }}>{ty.name}</Text>
                    <GrowBar value={ty.share * 100} delay={300 + i * 80} color={ty.id === p.id ? C.forest : C.sage} />
                    <Text style={{ width: 36, textAlign: 'right', fontFamily: F.body, fontSize: 13, color: C.muted }}>
                      {ty.yes}/{ty.items.length}
                    </Text>
                  </View>
                ))}
              </Card>
            </FadeIn>
          </>
        ) : (
          <FadeIn>
            <Title size={32} accent={t('pattern')}>
              {t('No clear')}
            </Title>
            <Body style={{ marginTop: 10 }}>{t('None of the statements applied. Try “Agni in depth” on the assessment page for a complete picture.')}</Body>
          </FadeIn>
        )}
        <Button title={t('Done')} onPress={close} style={{ marginTop: 22 }} />
        <Button
          title={t('Check again')}
          variant="ghost"
          onPress={() => {
            setYes({});
            setResult(null);
          }}
          style={{ marginTop: 10 }}
        />
      </Screen>
    );
  }

  return (
    <Screen fx={0.7} maxWidth={640}>
      <BackHeader title={t('Agni check')} fallback="/" />
      <FadeIn>
        <Label>{t('About 30 seconds')}</Label>
        <Title size={32} accent={t('digestive fire?')} style={{ marginTop: 6 }}>
          {t('How is your')}
        </Title>
        <Body style={{ marginTop: 8 }}>{t('Tap every statement that is true for you most of the time.')}</Body>
      </FadeIn>
      <View style={{ gap: 10, marginTop: 18 }}>
        {statements.map((s, i) => {
          const on = !!yes[s.key];
          return (
            <FadeIn key={s.key} delay={80 + i * 35}>
              <PressScale onPress={() => setYes((y) => ({ ...y, [s.key]: !y[s.key] }))} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={s.text} style={[styles.item, on && styles.itemOn]} hoverStyle={on ? undefined : { borderColor: C.sage }}>
                <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={on ? C.forest : C.lineStrong} />
                <Text style={{ flex: 1, fontFamily: F.medium, fontSize: 16, lineHeight: 22, color: C.ink }}>{s.text}</Text>
              </PressScale>
            </FadeIn>
          );
        })}
      </View>
      <Button title={t('See my Agni type')} icon="flame-outline" onPress={done} style={{ marginTop: 20 }} />
      <Body style={{ fontSize: 13, color: C.muted, marginTop: 12, textAlign: 'center' }}>{t('Based on the classical Viṣama, Tīkṣṇa, Manda and Sama Agni indicators.')}</Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58, padding: 14, borderRadius: 18, backgroundColor: 'rgba(251,250,245,0.95)', borderWidth: 1, borderColor: C.line },
  itemOn: { borderColor: C.forest, backgroundColor: C.mist },
  flame: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
});
