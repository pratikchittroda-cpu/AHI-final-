import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Body, Label, Button, Card, Logo, Deva, LeafDivider, It, Title, type IconName } from '../components/ui';
import { FadeIn, Sprig, GrowBar } from '../components/motion';
import { Website } from '../components/Website';
import { useAhi } from '../state/AhiContext';
import { SHLOKA, DISCLAIMER } from '../data/content';
import { MODULES, TOTAL_QUESTIONS } from '../data/modules';
import { C, F } from '../theme';
import { t } from '../i18n';

const SAMPLE: [string, number][] = [
  ['Agni', 72],
  ['Nidrā', 64],
  ['Sattva', 85],
  ['Bala', 79],
];

/** Native welcome (V5 mobile landing). */
function MobileWelcome() {
  const router = useRouter();
  return (
    <Screen>
      <FadeIn style={styles.brand}>
        <Logo />
        <View>
          <Text style={{ fontFamily: F.display, fontSize: 21, color: C.ink }}>{t('AHI')}</Text>
          <Text style={{ fontFamily: F.body, fontSize: 12, color: C.muted }}>{t('Ayurveda Health Index')}</Text>
        </View>
      </FadeIn>

      <FadeIn delay={80}>
        <Label style={{ marginTop: 26 }}>{t('आयुर्वेद · A classical wellness index')}</Label>
      </FadeIn>
      <FadeIn delay={160}>
        <Title size={42} accent={t('balance.')} style={{ marginTop: 10, lineHeight: 47 }}>
          {t('Return to your natural')}
        </Title>
      </FadeIn>
      <FadeIn delay={240}>
        <Body style={{ marginTop: 12, fontSize: 17, lineHeight: 26 }}>
          {TOTAL_QUESTIONS} gentle questions across {MODULES.length} domains — from Agni and Nidrā to Sattva and immunity — scored from 0 to 100, with a daily plan rooted in Caraka, Suśruta and Vāgbhaṭa.
        </Body>
      </FadeIn>

      <FadeIn delay={320} style={styles.arch}>
        <View style={{ position: 'absolute', bottom: 70, alignSelf: 'center' }}>
          <Sprig width={240} height={290} />
        </View>
        <Card style={styles.sample}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Label style={{ color: C.muted, fontSize: 10 }}>{t('Sample index')}</Label>
              <Text style={{ fontFamily: F.display, fontSize: 46, color: C.ink, lineHeight: 50 }}>74</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <It style={{ fontSize: 20 }}>{t('Prāya Sama')}</It>
              <Text style={{ fontFamily: F.body, fontSize: 12, color: C.muted }}>{t('Good')}</Text>
            </View>
          </View>
          {SAMPLE.map(([n, s], i) => (
            <View key={n} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <Text style={{ width: 52, fontFamily: F.body, fontSize: 13, color: C.body }}>{n}</Text>
              <GrowBar value={s} delay={700 + i * 90} color={s < 70 ? C.gold : C.moss} height={7} />
            </View>
          ))}
        </Card>
      </FadeIn>

      <FadeIn delay={420} style={{ gap: 10, marginTop: 22 }}>
        <Button title={t('Begin the assessment')} icon="arrow-forward" onPress={() => router.push('/assess')} />
        <Button title={t('Try the 30-second Agni check')} variant="ghost" icon="flame-outline" onPress={() => router.push('/agni-check')} />
        <Text style={{ fontFamily: F.body, fontSize: 15, color: C.body, textAlign: 'center', marginTop: 8 }}>
          {t('Already with us?')}{' '}
          <Text onPress={() => router.push('/sign-in')} style={{ fontFamily: F.semi, color: C.forest }}>
            {t('Sign in')}
          </Text>
        </Text>
      </FadeIn>

      <View style={styles.quote}>
        <LeafDivider />
        <Deva style={{ textAlign: 'center', fontSize: 19, lineHeight: 32 }}>{SHLOKA.sanskrit}</Deva>
        <It style={{ textAlign: 'center', color: C.body, fontSize: 17, lineHeight: 25 }}>{SHLOKA.english}</It>
        <Label style={{ color: C.muted, fontSize: 10, textAlign: 'center' }}>{SHLOKA.source}</Label>
      </View>

      <View style={{ flexDirection: 'row', gap: 18, flexWrap: 'wrap', marginTop: 18, justifyContent: 'center' }}>
        {(
          [
            ['leaf-outline', 'No account to start'],
            ['book-outline', 'Classical sources'],
            ['medkit-outline', 'Screening, not diagnosis'],
          ] as [IconName, string][]
        ).map(([i, label]) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name={i} size={16} color={C.moss} />
            <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>{t(label)}</Text>
          </View>
        ))}
      </View>
      <Body style={{ fontSize: 12.5, lineHeight: 19, color: C.muted, textAlign: 'center', marginTop: 14 }}>{t(DISCLAIMER)}</Body>
    </Screen>
  );
}

export default function Index() {
  const { profile, completed, drafts } = useAhi();
  if (Platform.OS === 'web') return <Website />;
  // Returning users go straight to their dashboard.
  if (profile || completed > 0 || Object.keys(drafts).length) return <Redirect href="/home" />;
  return <MobileWelcome />;
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  arch: { marginTop: 24, height: 400, borderTopLeftRadius: 200, borderTopRightRadius: 200, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, backgroundColor: C.forest, overflow: 'hidden', justifyContent: 'flex-end', padding: 16 },
  sample: { backgroundColor: C.paper, borderWidth: 0, padding: 16 },
  quote: { marginTop: 30, paddingVertical: 26, paddingHorizontal: 18, borderRadius: 22, backgroundColor: 'rgba(233,238,227,0.85)', borderWidth: 1, borderColor: C.line, gap: 12 },
});
