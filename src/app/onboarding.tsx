import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Body, Button, BackHeader, Card, Title, Logo, Label, type IconName } from '../components/ui';
import { FadeIn, PressScale } from '../components/motion';
import { useAhi } from '../state/AhiContext';
import { GOALS, type GoalId } from '../data/content';
import { C, F, useLayout } from '../theme';
import { lh, t } from '../i18n';

const WAKES = ['05:00', '05:30', '06:00', '07:00', '08:00+'];
const STEPS = ['About you', 'Your goals', 'Your rhythm'];

function Check({ checked, onPress, children }: { checked: boolean; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onPress} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 8, minHeight: 44 }}>
      <View style={[styles.box, checked && { backgroundColor: C.forest, borderColor: C.forest }]}>{checked ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}</View>
      <Text style={{ flex: 1, fontFamily: F.body, fontSize: 15, lineHeight: 22, color: C.body }}>{children}</Text>
    </Pressable>
  );
}

/** Three-step profile set-up (stored on this device only). */
export default function Onboarding() {
  const router = useRouter();
  const { wide } = useLayout();
  const { setProfile } = useAhi();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [goals, setGoals] = useState<GoalId[]>(['sleep', 'digest']);
  const [wake, setWake] = useState('06:00');
  const [terms, setTerms] = useState(false);
  const [notDx, setNotDx] = useState(false);

  const stepOk = [name.trim().length > 1, goals.length > 0, terms && notDx][step];
  const next = () => {
    if (step < 2) return setStep(step + 1);
    setProfile({ name: name.trim(), contact: contact.trim() || undefined, goals, wake });
    router.replace('/assess');
  };

  const steps = (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {STEPS.map((s, i) => (
        <View key={s} style={{ flex: 1, gap: 8 }}>
          <View style={{ height: 3, borderRadius: 9, backgroundColor: i <= step ? C.forest : C.line }} />
          <Text style={{ fontFamily: i === step ? F.semi : F.body, fontSize: 13, color: i <= step ? C.ink : C.muted }}>
            0{i + 1} · {t(s)}
          </Text>
        </View>
      ))}
    </View>
  );

  const body = (
    <>
      {step === 0 ? (
        <FadeIn key="s0" style={{ gap: 16 }}>
          <Title size={wide ? 46 : 32} accent={t('you.')}>
            {t('Let’s begin with')}
          </Title>
          <Body style={{ color: C.muted }}>{t('Your profile stays on this device. Nothing is sent anywhere.')}</Body>
          <Text style={[styles.fl, { fontFamily: F.semi }, { fontFamily: F.semi }]}>{t('Your name')}</Text>
          <TextInput value={name} onChangeText={setName} autoComplete="name" style={[styles.input, { fontFamily: F.body }, { fontFamily: F.body }]} accessibilityLabel={t('Your name')} />
          <Text style={[styles.fl, { fontFamily: F.semi }, { fontFamily: F.semi }]}>{t('Mobile or email (optional)')}</Text>
          <TextInput value={contact} onChangeText={setContact} autoCapitalize="none" style={[styles.input, { fontFamily: F.body }, { fontFamily: F.body }]} accessibilityLabel={t('Mobile or email')} />
        </FadeIn>
      ) : null}

      {step === 1 ? (
        <FadeIn key="s1" style={{ gap: 18 }}>
          <Title size={wide ? 46 : 32} accent={t('to nurture?')}>
            {t('What would you like')}
          </Title>
          <Body style={{ color: C.muted }}>{t('Choose any. Your daily plan will lean towards them.')}</Body>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {GOALS.map((g, i) => {
              const on = goals.includes(g.id);
              return (
                <FadeIn key={g.id} delay={i * 50}>
                  <PressScale
                    onPress={() => setGoals((x) => (on ? x.filter((y) => y !== g.id) : [...x, g.id]))}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={g.label}
                    style={[styles.pill, on && { backgroundColor: C.forest, borderColor: C.forest }]}
                    hoverStyle={on ? undefined : { borderColor: C.sage }}
                  >
                    <Ionicons name={`${g.icon}-outline` as IconName} size={18} color={on ? C.onDark : C.moss} />
                    <Text style={{ fontFamily: F.semi, fontSize: 15, color: on ? C.onDark : C.ink }}>{g.label}</Text>
                    {on ? <Ionicons name="checkmark" size={16} color={C.onDark} /> : null}
                  </PressScale>
                </FadeIn>
              );
            })}
          </View>
        </FadeIn>
      ) : null}

      {step === 2 ? (
        <FadeIn key="s2" style={{ gap: 14 }}>
          <Title size={wide ? 46 : 32} accent={t('daily rhythm.')}>
            {t('And your')}
          </Title>
          <Text style={[styles.fl, { fontFamily: F.semi }, { fontFamily: F.semi }]}>{t('When do you usually wake?')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {WAKES.map((w) => (
              <PressScale key={w} onPress={() => setWake(w)} accessibilityRole="radio" accessibilityState={{ checked: wake === w }} accessibilityLabel={w} style={[styles.pill, wake === w && { backgroundColor: C.forest, borderColor: C.forest }]}>
                <Text style={{ fontFamily: F.semi, fontSize: 15, color: wake === w ? C.onDark : C.ink }}>{w}</Text>
              </PressScale>
            ))}
          </View>
          <Card style={{ gap: 2, marginTop: 6 }}>
            <Check checked={terms} onPress={() => setTerms(!terms)}>
              {t('I agree to AHI storing my answers on this device.')}
            </Check>
            <Check checked={notDx} onPress={() => setNotDx(!notDx)}>
              {t('I understand AHI is a wellness screening, not a medical diagnosis.')}
            </Check>
          </Card>
        </FadeIn>
      ) : null}
    </>
  );

  const actions = (
    <View style={[{ flexDirection: 'row', gap: 10, justifyContent: 'space-between' }, wide && { marginTop: 'auto', borderTopWidth: 1, borderTopColor: '#E5E6DC', paddingTop: 22 }]}>
      {step > 0 ? <Button title={t('Back')} variant="ghost" onPress={() => setStep(step - 1)} style={wide ? undefined : { flex: 1 }} /> : <View />}
      <Button title={step === 2 ? t('Create profile') : t('Continue')} icon="arrow-forward" disabled={!stepOk} onPress={next} style={wide ? undefined : { flex: 2 }} />
    </View>
  );

  if (wide) {
    const chosen = GOALS.filter((g) => goals.includes(g.id));
    return (
      <Screen fx={0.6} padded={false} maxWidth={1240} style={{ paddingHorizontal: 28 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }}>
          <Pressable accessibilityRole="link" onPress={() => router.push('/')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Logo size={32} />
            <Text style={{ fontFamily: F.display, fontSize: 20, color: C.ink }}>{t('AHI')}</Text>
          </Pressable>
          <Text style={{ fontFamily: F.body, fontSize: 15, color: C.ink }}>
            {t('Have an account?')}{' '}
            <Text onPress={() => router.replace('/sign-in')} style={{ fontFamily: F.bold, textDecorationLine: 'underline' }}>
              {t('Sign in')}
            </Text>
          </Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 40, alignItems: 'flex-start', paddingTop: 10 }}>
          <View style={styles.form}>
            {steps}
            {body}
            {actions}
          </View>
          <View style={styles.aside}>
            <Label style={{ fontSize: 11 }}>{t('Your profile')}</Label>
            <Text style={{ fontFamily: F.display, fontSize: 32, lineHeight: lh(32, 36), color: name ? C.ink : C.muted }}>{name.trim() || 'Your name'}</Text>
            <Text style={{ fontFamily: F.body, fontSize: 14, color: C.body }}>{t('Individual')}</Text>
            <View style={{ height: 1, backgroundColor: C.leaf }} />
            <Label style={{ fontSize: 11 }}>{t('Nurturing')}</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {chosen.map((g) => (
                <View key={g.id} style={styles.tag}>
                  <Ionicons name={`${g.icon}-outline` as IconName} size={16} color={C.moss} />
                  <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.ink }}>{g.label}</Text>
                </View>
              ))}
            </View>
            <View style={{ height: 1, backgroundColor: C.leaf }} />
            <Label style={{ fontSize: 11 }}>{t('Wakes at')}</Label>
            <Text style={{ fontFamily: F.display, fontSize: 36, lineHeight: 38, color: C.ink }}>{wake}</Text>
            <Text style={{ fontFamily: F.italic, fontSize: 18, lineHeight: lh(18, 27), color: C.body, marginTop: 'auto' }}>{t('Next: a ten-minute assessment to find your index.')}</Text>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen fx={0.6} maxWidth={640}>
        <BackHeader title={t('Create profile')} fallback="/" />
        {steps}
        <View style={{ marginTop: 24 }}>{body}</View>
        <View style={{ marginTop: 26 }}>{actions}</View>
        <Text style={{ fontFamily: F.body, fontSize: 15, color: C.body, textAlign: 'center', marginTop: 20 }}>
          {t('Already a member?')}{' '}
          <Text onPress={() => router.replace('/sign-in')} style={{ fontFamily: F.semi, color: C.forest }}>
            {t('Sign in')}
          </Text>
        </Text>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fl: { fontSize: 14, color: C.ink },
  input: { minHeight: 54, borderWidth: 1, borderColor: C.lineStrong, borderRadius: 14, backgroundColor: C.paper, paddingHorizontal: 16, fontSize: 17, color: C.ink },
  pill: { minHeight: 52, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: C.lineStrong, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 8 },
  box: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: C.lineStrong, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  form: { flexGrow: 3, flexShrink: 1, flexBasis: 600, minWidth: 0, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 28, padding: 40, gap: 26, minHeight: 640 },
  aside: { flexGrow: 2, flexShrink: 1, flexBasis: 320, backgroundColor: C.pale, borderRadius: 28, padding: 32, gap: 18, minHeight: 640 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: C.paper },
});
