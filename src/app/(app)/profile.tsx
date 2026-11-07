import React, { useState } from 'react';
import { View, Text, Pressable, Alert, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, H2, Body, Label, Card, Button, Title, type IconName } from '../../components/ui';
import { FadeIn } from '../../components/motion';
import { useAhi } from '../../state/AhiContext';
import { GOALS, DISCLAIMER } from '../../data/content';
import { LANGUAGES, locale, t } from '../../i18n';
import { C, F, useLayout } from '../../theme';

/** Me / Settings: profile, saved results, reset. */
export default function Profile() {
  const router = useRouter();
  const { wide } = useLayout();
  const { profile, history, completed, signOut, resetAll, lang, setLang } = useAhi();
  const [confirming, setConfirming] = useState(false);
  const name = profile?.name?.trim();

  const wipe = async () => {
    await resetAll();
    setConfirming(false);
    router.replace('/');
  };
  const askWipe = () => {
    if (Platform.OS === 'web') {
      setConfirming(true);
      return;
    }
    Alert.alert(t('Reset all data?'), t('This removes your answers, scores, history and profile from this device.'), [
      { text: t('Cancel'), style: 'cancel' },
      { text: t('Reset'), style: 'destructive', onPress: wipe },
    ]);
  };

  return (
    <Screen maxWidth={wide ? 900 : 760} style={wide ? { paddingHorizontal: 40, paddingTop: 40 } : undefined}>
      <FadeIn style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={styles.avatar}>
          <Text style={{ fontFamily: F.display, fontSize: 26, color: C.onDark }}>{(name || 'A')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Title size={wide ? 36 : 28}>{name || t('Your profile')}</Title>
          <Text style={{ fontFamily: F.body, fontSize: 14, color: C.muted }}>{profile ? `${t('Individual')}${profile.contact ? ` · ${profile.contact}` : ''}` : t('Not signed in · everything is saved on this device')}</Text>
        </View>
      </FadeIn>

      {profile ? (
        <FadeIn delay={80}>
          <Card style={{ marginTop: 20, gap: 10, backgroundColor: 'rgba(220,229,211,0.92)', borderWidth: 0 }}>
            <Label>{t('Nurturing')}</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {GOALS.filter((g) => profile.goals.includes(g.id)).map((g) => (
                <View key={g.id} style={styles.pill}>
                  <Ionicons name={`${g.icon}-outline` as IconName} size={15} color={C.moss} />
                  <Text style={{ fontFamily: F.semi, fontSize: 13, color: C.ink }}>{t(g.label)}</Text>
                </View>
              ))}
            </View>
            <Text style={{ fontFamily: F.italic, fontSize: 17, color: C.body }}>{t('Rises at {time}', { time: profile.wake })}</Text>
          </Card>
        </FadeIn>
      ) : (
        <FadeIn delay={80}>
          <Card style={{ marginTop: 20, gap: 10 }}>
            <Body>{t('Create a profile to personalise your greeting and daily plan. It stays on this device.')}</Body>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              <Button title={t('Create a profile')} size="sm" icon="arrow-forward" onPress={() => router.push('/onboarding')} />
              <Button title={t('Sign in')} size="sm" variant="ghost" onPress={() => router.push('/sign-in')} />
            </View>
          </Card>
        </FadeIn>
      )}

      <FadeIn delay={110}>
        <H2 style={{ marginTop: 24 }}>{t('Language')}</H2>
        <Card style={{ marginTop: 10, padding: 6 }}>
          <View accessibilityRole="radiogroup" style={{ flexDirection: wide ? 'row' : 'column', gap: 4 }}>
            {LANGUAGES.map((l) => {
              const on = l.id === lang;
              return (
                <Pressable
                  key={l.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`${l.native}, ${l.name}`}
                  onPress={() => setLang(l.id)}
                  style={({ pressed }) => [styles.lang, wide && { flex: 1 }, on && styles.langOn, pressed && !on && { backgroundColor: C.mist }]}
                >
                  <View style={[styles.radio, on && { borderColor: C.forest }]}>{on ? <View style={styles.dot} /> : null}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: F.semi, fontSize: 16, color: C.ink }}>{l.native}</Text>
                    {l.native !== l.name ? <Text style={{ fontFamily: F.body, fontSize: 12.5, color: C.muted }}>{l.name}</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>
        {lang !== 'en' ? <Body style={{ fontSize: 12.5, lineHeight: 19, color: C.muted, marginTop: 8 }}>{t('Translations of the health questions are a draft and are being reviewed by Vaidyas.')}</Body> : null}
      </FadeIn>

      <FadeIn delay={140}>
        <H2 style={{ marginTop: 24 }}>{t('Saved indices')}</H2>
        {history.length ? (
          <Card style={{ marginTop: 10, padding: 0 }}>
            {history.map((r, i) => (
              <View key={r.at} style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: C.lineSoft }]}>
                <Text style={{ flex: 1, fontFamily: F.medium, fontSize: 15, color: C.ink }}>{new Date(r.at).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                <Text style={{ fontFamily: F.display, fontSize: 22, color: C.ink }}>{r.composite}</Text>
              </View>
            ))}
          </Card>
        ) : (
          <Body style={{ marginTop: 8 }}>{t('{n} of 9 domains complete. Your index is saved here once all nine are done.', { n: completed })}</Body>
        )}
      </FadeIn>

      <FadeIn delay={200}>
        <Card style={{ marginTop: 18, gap: 8 }}>
          <Label>{t('About AHI')}</Label>
          <Body style={{ fontSize: 14, lineHeight: 21 }}>{t(DISCLAIMER)} {t('Scores are calculated on this device and never leave it.')}</Body>
        </Card>
        {profile ? <Button title={t('Sign out')} variant="ghost" icon="log-out-outline" onPress={signOut} style={{ marginTop: 18 }} /> : null}

        {confirming ? (
          <View style={styles.confirm}>
            <Text style={{ fontFamily: F.semi, fontSize: 15, color: C.ink }}>{t('Reset all data?')}</Text>
            <Body style={{ fontSize: 14, lineHeight: 21 }}>{t('This removes your answers, scores, history and profile from this device.')}</Body>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title={t('Cancel')} size="sm" variant="ghost" onPress={() => setConfirming(false)} />
              <Button title={t('Reset everything')} size="sm" onPress={wipe} style={{ backgroundColor: C.care }} />
            </View>
          </View>
        ) : (
          <Pressable onPress={askWipe} accessibilityRole="button" style={{ alignSelf: 'center', padding: 12, marginTop: 6, minHeight: 44 }}>
            <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.care }}>{t('Reset all data')}</Text>
          </Pressable>
        )}
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: C.moss, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: C.paper },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: 16 },
  lang: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 14, borderRadius: 16 },
  langOn: { backgroundColor: C.pale },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: C.radio, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.forest },
  confirm: { marginTop: 14, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: C.care, backgroundColor: C.paper, gap: 10 },
});
