import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Body, Label, Title, Deva, BackHeader, Card } from '../../components/ui';
import { FadeIn, PressScale } from '../../components/motion';
import { HerbArt } from '../../components/HerbArt';
import { HERBS, AGNI_TYPES } from '../../data/content';
import { useAhi } from '../../state/AhiContext';
import { C, F, useLayout } from '../../theme';
import { t } from '../../i18n';

/** Food & herbs: classical herbs and the Agni-type check. */
export default function Herbs() {
  const router = useRouter();
  const { wide, tablet } = useLayout();
  const { agni } = useAhi();
  const mine = AGNI_TYPES.find((t) => t.id === agni?.id);

  return (
    <Screen maxWidth={wide ? 1100 : 760} style={wide ? { paddingHorizontal: 40, paddingTop: 40 } : undefined}>
      {!wide ? <BackHeader title={t('Food & herbs')} fallback="/plan" /> : null}
      <FadeIn style={{ flexDirection: wide ? 'row' : 'column', justifyContent: 'space-between', alignItems: wide ? 'flex-end' : 'flex-start', gap: 14 }}>
        <View>
          <Label>{t('Āhāra · Dravya')}</Label>
          <Title size={wide ? 48 : 32} accent={t('herb garden.')} style={{ marginTop: 6 }}>
            {t('From the')}
          </Title>
        </View>
        <Body style={{ fontSize: 15, lineHeight: 23, color: C.muted, maxWidth: 400 }}>{t('Traditional uses from the classical texts. Always confirm herbs and amounts with a qualified Vaidya.')}</Body>
      </FadeIn>

      <View style={{ flexDirection: tablet ? 'row' : 'column', flexWrap: 'wrap', gap: 18, marginTop: 24 }}>
        {HERBS.map((h, i) => (
          <FadeIn key={h.name} delay={80 + i * 60} style={tablet ? { flexGrow: 1, flexShrink: 1, flexBasis: 230 } : undefined}>
            <Card style={{ padding: 0, overflow: 'hidden', flex: 1 }}>
              <View style={{ height: tablet ? 180 : 150, backgroundColor: h.bg, alignItems: 'center', justifyContent: 'center' }}>
                <HerbArt leaves={h.leaves} spread={h.spread} size={tablet ? 130 : 110} />
              </View>
              <View style={{ padding: 22, gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                  <Text style={{ fontFamily: F.display, fontSize: 24, color: C.ink }}>{h.name}</Text>
                  <Deva style={{ fontSize: 16, lineHeight: 26, color: C.muted }}>{h.deva}</Deva>
                </View>
                <Text style={{ fontFamily: F.italic, fontSize: 16, color: C.moss }}>{h.latin}</Text>
                <Body style={{ fontSize: 15, lineHeight: 23, marginTop: 4 }}>{h.text}</Body>
              </View>
            </Card>
          </FadeIn>
        ))}
      </View>

      <FadeIn delay={360}>
        <PressScale onPress={() => router.push('/agni-check')} accessibilityLabel={t('Agni check')} lift style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 16, padding: 22, borderRadius: 22, backgroundColor: C.pale }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="flame" size={24} color={C.goldText} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontFamily: F.display, fontSize: 22, color: C.ink }}>{mine ? mine.name : t('What is your digestive fire?')}</Text>
            <Text style={{ fontFamily: F.body, fontSize: 14, lineHeight: 21, color: C.body }}>{mine ? mine.advice : t('A 30-second check of the four classical Agni types — Viṣama, Tīkṣṇa, Manda and Sama.')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={C.forest} />
        </PressScale>
      </FadeIn>
    </Screen>
  );
}
