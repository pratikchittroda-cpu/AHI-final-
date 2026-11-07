import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, H2, Label, Button, Card, Title } from '../../components/ui';
import { FadeIn, PressScale } from '../../components/motion';
import { CompositePanel, ModuleGrid, TrendChart, KalaCard, KalaRow, RoutineList, GuidanceCards, HomeStats, routineDone } from '../../components/ahi';
import { useAhi } from '../../state/AhiContext';
import { DEFAULT_ROUTINE, currentKala } from '../../data/content';
import { MODULES } from '../../data/modules';
import { C, F, useLayout } from '../../theme';
import { locale, t } from '../../i18n';

const greet = () => {
  const h = new Date().getHours();
  return h < 12 ? t('Good morning') : h < 17 ? t('Good afternoon') : t('Good evening');
};

/** Home / dashboard: composite AHI, nine domain cards, Prakṛti, today's rhythm. */
export default function Home() {
  const router = useRouter();
  const { wide } = useLayout();
  const { profile, history, agni, routine, completed, prakriti } = useAhi();
  const first = profile?.name?.trim().split(' ')[0];
  const now = new Date();
  const date = now.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' });
  const delta = history.length > 1 ? history[0].composite - history[1].composite : null;
  const done = routineDone(routine.done);

  const header = (
    <FadeIn style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
      <View style={{ gap: 6, flexShrink: 1 }}>
        <Text style={{ fontFamily: F.body, fontSize: wide ? 15 : 14, color: C.muted }}>
          {date}
          {wide ? ` · ${t('{dosha} kāla', { dosha: t(currentKala().dosha) })}` : ''}
        </Text>
        <Title size={wide ? 44 : 32} accent={first ? `${first}.` : undefined}>
          {greet()}
          {first ? ',' : '.'}
        </Title>
      </View>
      {wide ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {completed > 0 ? <Button title={t('Report')} variant="ghost" size="sm" icon="document-text-outline" onPress={() => router.push('/report')} /> : null}
          <Button title={completed === MODULES.length ? t('Retake assessment') : t('Continue assessment')} size="sm" onPress={() => router.push('/assess')} />
        </View>
      ) : null}
    </FadeIn>
  );

  const modules = (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <H2>{wide ? t('Your nine domains') : t('Nine domains')}</H2>
        <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>{t('{n} of {total} complete', { n: completed, total: MODULES.length })}</Text>
      </View>
      <ModuleGrid />
    </View>
  );

  const agniLink = (
    <PressScale onPress={() => router.push('/agni-check')} accessibilityLabel={t('Agni check')} style={styles.agni} hoverStyle={{ borderColor: C.leaf }}>
      <View style={styles.agniIcon}>
        <Ionicons name="flame" size={22} color={C.goldText} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.semi, fontSize: 16, color: C.ink }}>{agni ? t(agni.name) : t('30-second Agni check')}</Text>
        <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>{agni ? t('Your digestive-fire type · check again') : t('Find your digestive-fire type')}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={C.muted} />
    </PressScale>
  );

  const prakritiLink = (
    <PressScale onPress={() => router.push(prakriti ? '/prakriti/result' : '/prakriti/quiz')} accessibilityLabel={t('Prakṛti, your constitution')} style={styles.agni} hoverStyle={{ borderColor: C.leaf }}>
      <View style={[styles.agniIcon, { backgroundColor: C.mist }]}>
        <Ionicons name="leaf" size={22} color={C.forest} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.semi, fontSize: 16, color: C.ink }}>{prakriti ? t('{type} Prakṛti', { type: prakriti.name }) : t('Find your Prakṛti')}</Text>
        <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>{prakriti ? `${t('Vāta')} ${prakriti.shares.vata}% · ${t('Pitta')} ${prakriti.shares.pitta}% · ${t('Kapha')} ${prakriti.shares.kapha}%` : t('Your constitution · 27 questions')}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={C.muted} />
    </PressScale>
  );

  if (wide) {
    return (
      <Screen fx={0.8} padded={false} style={{ paddingHorizontal: 40, paddingTop: 32, gap: 22 }} maxWidth={1240}>
        {header}
        <View style={styles.row}>
          <FadeIn delay={80} style={{ flexGrow: 1, flexShrink: 1, flexBasis: 380 }}>
            <CompositePanel size={170} delta={delta} style={{ flex: 1 }} />
          </FadeIn>
          <FadeIn delay={140} style={{ flexGrow: 2, flexShrink: 1, flexBasis: 460 }}>
            <Card style={{ flex: 1, padding: 26, gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Label style={{ color: C.muted, fontSize: 11 }}>{t('Your index over time')}</Label>
                <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>{history.length} saved</Text>
              </View>
              <TrendChart />
            </Card>
          </FadeIn>
        </View>
        <HomeStats delay={180} />
        {modules}
        <View style={styles.row}>
          <View style={{ flexGrow: 2, flexShrink: 1, flexBasis: 480, gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <H2>{t('Today’s routine')}</H2>
              <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>
                {t('{n} of {total}', { n: done, total: DEFAULT_ROUTINE.length })}
              </Text>
            </View>
            <RoutineList />
          </View>
          <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 300, gap: 22 }}>
            <KalaCard />
            {prakritiLink}
            {agniLink}
          </View>
        </View>
        {completed > 0 ? (
          <View style={{ gap: 14 }}>
            <Title size={30} accent={t('gently')}>
              {t('This week,')}
            </Title>
            <GuidanceCards wide />
          </View>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen fx={1} bottom={20} maxWidth={760}>
      {header}
      <FadeIn delay={100} style={{ marginTop: 18 }}>
        <CompositePanel size={112} delta={delta} onPress={() => router.push('/report')} style={{ padding: 18, gap: 16 }} />
      </FadeIn>
      <View style={{ marginTop: 14 }}>
        <HomeStats delay={140} />
      </View>
      <FadeIn delay={200} style={{ marginTop: 14 }}>
        <KalaRow />
      </FadeIn>
      <View style={{ marginTop: 24 }}>{modules}</View>
      <FadeIn delay={300} style={{ marginTop: 24, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <H2>{t('Today’s routine')}</H2>
          <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>
            {t('{n} of {total}', { n: done, total: DEFAULT_ROUTINE.length })}
          </Text>
        </View>
        <RoutineList limit={5} />
      </FadeIn>
      <FadeIn delay={360} style={{ marginTop: 16, gap: 12 }}>
        {prakritiLink}
        {agniLink}
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 22 },
  agni: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, backgroundColor: 'rgba(251,250,245,0.92)', borderWidth: 1, borderColor: C.line },
  agniIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center' },
});
