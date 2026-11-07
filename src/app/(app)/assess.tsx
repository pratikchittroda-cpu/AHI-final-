import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Body, Label, Button, DarkPanel, Title, IconBadge, LeafProgress, Deva, H2 } from '../../components/ui';
import { FadeIn, GrowBar, PressScale } from '../../components/motion';
import { useAhi } from '../../state/AhiContext';
import { GROUPS, INDEPTH, MODULES, PRAKRITI, TOTAL_QUESTIONS, type AhiModule } from '../../data/modules';
import { bandFor, moduleProgress } from '../../lib/scoring';
import { C, F, toneColor, useLayout } from '../../theme';
import { t } from '../../i18n';

/** One questionnaire row: icon, names, then its score, Prakṛti type or progress. */
function ModuleRow({ m, delay }: { m: AhiModule; delay: number }) {
  const router = useRouter();
  const { wide } = useLayout();
  const { scores, drafts, prakriti } = useAhi();
  const draft = drafts[m.id];
  const p = draft ? moduleProgress(m, draft) : null;
  const s = scores[m.id];
  const done = m.kind === 'prakriti' ? !!prakriti : s !== undefined;
  const band = s === undefined ? null : bandFor(s, m);
  const status = m.kind === 'prakriti' && prakriti ? prakriti.name : band ? `${s}, ${band.label}` : p ? t('{n} of {total} answered', { n: p.answered, total: p.total }) : t('not started');
  return (
    <FadeIn delay={delay}>
      <PressScale
        onPress={() => router.push(done && !p ? `/${m.id}/result` : `/${m.id}/quiz`)}
        accessibilityLabel={`${m.en}, ${status}`}
        style={styles.row}
        hoverStyle={{ backgroundColor: C.mist }}
      >
        <IconBadge icon={m.icon} done={done} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.display, fontSize: wide ? 22 : 18, color: C.ink }}>{m.en}</Text>
          <Text style={{ fontFamily: F.italic, fontSize: 15, color: C.moss }}>
            {m.title} <Deva style={{ fontSize: 13, lineHeight: 20, color: C.muted }}>{m.deva}</Deva>
          </Text>
          {wide ? <Text style={{ fontFamily: F.body, fontSize: 14, lineHeight: 21, color: C.body, marginTop: 2 }}>{m.blurb}</Text> : null}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4, width: wide ? 150 : 86 }}>
          {m.kind === 'prakriti' && prakriti && !p ? (
            <Text style={{ fontFamily: F.italic, fontSize: 17, color: C.moss, textAlign: 'right' }}>{prakriti.name}</Text>
          ) : band && !p ? (
            <>
              <Text style={{ fontFamily: F.display, fontSize: 20, color: C.ink }}>{s}</Text>
              <Text style={{ fontFamily: F.semi, fontSize: 11.5, color: toneColor(band.tone), textAlign: 'right' }}>{band.short}</Text>
            </>
          ) : (
            <>
              <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.muted }}>
                {p ? p.answered : 0}/{p ? p.total : m.questions.length}
              </Text>
              <View style={{ width: 48 }}>
                <GrowBar value={p ? (p.answered / p.total) * 100 : 0} height={4} />
              </View>
            </>
          )}
        </View>
        {wide ? <Ionicons name="arrow-forward" size={20} color={C.moss} /> : null}
      </PressScale>
    </FadeIn>
  );
}

/** The assessment: nine index domains (grouped), Prakṛti, and the in-depth questionnaires. */
export default function Assess() {
  const router = useRouter();
  const { wide } = useLayout();
  const { scores, drafts, completed, agni } = useAhi();
  const states = MODULES.map((m) => (scores[m.id] !== undefined ? ('done' as const) : drafts[m.id] ? ('part' as const) : ('none' as const)));
  const next = MODULES.find((m) => scores[m.id] === undefined);
  const pct = Math.round((completed / MODULES.length) * 100);
  let n = 0;

  return (
    <Screen maxWidth={wide ? 900 : 760} style={wide ? { paddingHorizontal: 40, paddingTop: 40 } : undefined}>
      <FadeIn>
        <Label>{t('Parīkṣā · the assessment')}</Label>
        <Title size={wide ? 48 : 32} accent={t('body.')} style={{ marginTop: 6 }}>
          {t('Listen to your')}
        </Title>
        <Body style={{ marginTop: 8, maxWidth: 580 }}>
          {t('Nine domains, {total} questions in all. Answer for how you have felt over the last 30 days — each domain takes a few minutes and saves as you go.', { total: TOTAL_QUESTIONS })}
        </Body>
      </FadeIn>

      <FadeIn delay={100}>
        <DarkPanel style={{ marginTop: 20, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.onDark }}>
              {t('{n} of {total} domains complete', { n: completed, total: MODULES.length })}
            </Text>
            <Text style={{ fontFamily: F.display, fontSize: 18, color: C.leaf }}>{pct}%</Text>
          </View>
          <GrowBar value={pct} color={C.leaf} track="rgba(220,229,211,0.2)" />
          {next ? (
            <Button title={completed ? `${t('Continue')} · ${next.en}` : t('Begin with {name}', { name: next.en })} variant="light" icon="arrow-forward" onPress={() => router.push(`/${next.id}/quiz`)} />
          ) : (
            <Button title={t('See my index')} variant="light" icon="sparkles-outline" onPress={() => router.push('/report')} />
          )}
        </DarkPanel>
      </FadeIn>

      <FadeIn delay={160} style={{ marginTop: 14, alignItems: 'center' }}>
        <LeafProgress states={states} width={wide ? 440 : 320} height={wide ? 62 : 46} />
      </FadeIn>

      {GROUPS.map((g) => {
        const mods = MODULES.filter((m) => m.group === g.id);
        return (
          <View key={g.id} style={{ gap: 10, marginTop: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
              <Label>{g.label}</Label>
              {wide ? <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>{g.text}</Text> : null}
            </View>
            {mods.map((m) => (
              <ModuleRow key={m.id} m={m} delay={200 + n++ * 40} />
            ))}
          </View>
        );
      })}

      <View style={{ gap: 10, marginTop: 34 }}>
        <H2>{t('Your constitution')}</H2>
        <Body style={{ fontSize: 15, lineHeight: 23, color: C.muted }}>{t('Prakṛti is the nature you were born with. It is not scored and does not change your index.')}</Body>
        <ModuleRow m={PRAKRITI} delay={200 + n++ * 40} />
      </View>

      <View style={{ gap: 10, marginTop: 34 }}>
        <H2>{t('In depth')}</H2>
        <Body style={{ fontSize: 15, lineHeight: 23, color: C.muted }}>
          Longer questionnaires for healthy adults, scored Never (0) to Always (4). They sit alongside your index rather than inside it.
        </Body>
        {INDEPTH.map((m) => (
          <ModuleRow key={m.id} m={m} delay={200 + n++ * 40} />
        ))}
        <FadeIn delay={200 + n * 40}>
          <PressScale onPress={() => router.push('/agni-check')} accessibilityLabel={t('Agni type check')} style={styles.row} hoverStyle={{ backgroundColor: C.mist }}>
            <View style={styles.flame}>
              <Ionicons name="flame" size={22} color={C.goldText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.display, fontSize: wide ? 22 : 18, color: C.ink }}>{t('Agni type')}</Text>
              <Text style={{ fontFamily: F.italic, fontSize: 15, color: C.moss }}>{t('Viṣama · Tīkṣṇa · Manda · Sama')}</Text>
            </View>
            <Text style={{ fontFamily: F.italic, fontSize: 16, color: C.moss, textAlign: 'right', width: wide ? 150 : 86 }}>{agni ? agni.name : '13 statements'}</Text>
            {wide ? <Ionicons name="arrow-forward" size={20} color={C.moss} /> : null}
          </PressScale>
        </FadeIn>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 20, backgroundColor: 'rgba(251,250,245,0.92)', borderWidth: 1, borderColor: C.line },
  flame: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center' },
});
