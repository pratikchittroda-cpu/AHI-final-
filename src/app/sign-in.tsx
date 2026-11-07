import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Label, Button, Logo, Title, RoundButton, Deva, DarkTop } from '../components/ui';
import { Sprig, FadeIn, BackgroundFX, PanelGlow } from '../components/motion';
import { useAhi } from '../state/AhiContext';
import { C, F, useLayout } from '../theme';
import { t } from '../i18n';

/**
 * Sign in. There is no auth backend yet: any 6-digit code is accepted and the
 * profile is kept on this device. Replace `verify` with an API call later.
 */
function SignInForm() {
  const router = useRouter();
  const { setProfile, profile } = useAhi();
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const codeRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const phoneOk = phone.replace(/\D/g, '').length === 10;

  const verify = () => {
    setProfile({ contact: method === 'phone' ? `+91 ${phone}` : email, name: profile?.name ?? '' });
    router.replace('/home');
  };

  return (
    <View style={{ gap: 18, width: '100%', maxWidth: 420 }}>
      <View style={styles.seg} accessibilityRole="tablist">
        {(
          [
            ['phone', 'Mobile OTP'],
            ['email', 'Email'],
          ] as const
        ).map(([id, label]) => (
          <Pressable key={id} accessibilityRole="tab" accessibilityState={{ selected: method === id }} onPress={() => setMethod(id)} style={[styles.segBtn, method === id && styles.segOn]}>
            <Text style={{ fontFamily: F.semi, fontSize: 15, color: method === id ? C.ink : C.muted }}>{t(label)}</Text>
          </Pressable>
        ))}
      </View>

      {method === 'phone' ? (
        <FadeIn key={sent ? 'otp' : 'phone'} style={{ gap: 16 }}>
          <View style={{ gap: 8 }}>
            <Text style={[styles.fl, { fontFamily: F.semi }, { fontFamily: F.semi }]}>{t('Mobile number')}</Text>
            <View style={styles.field}>
              <Text style={{ fontFamily: F.semi, fontSize: 16, color: C.ink }}>+91</Text>
              <View style={{ width: 1, height: 22, backgroundColor: C.line }} />
              <TextInput value={phone} onChangeText={(t) => setPhone(t.replace(/[^\d ]/g, ''))} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" maxLength={11} placeholder="98765 43210" placeholderTextColor="#8A958C" style={[styles.input, { fontFamily: F.body }, { fontFamily: F.body }]} accessibilityLabel={t('Mobile number')} editable={!sent} />
            </View>
          </View>
          {!sent ? (
            <Button
              title={t('Send code')}
              disabled={!phoneOk}
              onPress={() => {
                setSent(true);
                setTimeout(() => codeRef.current?.focus(), 250);
              }}
            />
          ) : (
            <View style={{ gap: 12 }}>
              <Text style={[styles.fl, { fontFamily: F.semi }, { fontFamily: F.semi }]}>{t('Verification code')}</Text>
              <Pressable onPress={() => codeRef.current?.focus()} style={{ flexDirection: 'row', gap: 8 }} accessibilityLabel={t('One-time code')}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <View key={i} style={[styles.otp, i === code.length && { borderColor: C.forest, borderWidth: 2 }]}>
                    <Text style={{ fontFamily: F.display, fontSize: 26, color: C.ink }}>{code[i] || ''}</Text>
                  </View>
                ))}
              </Pressable>
              <TextInput ref={codeRef} value={code} onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="sms-otp" style={styles.hidden} accessibilityLabel={t('Enter the 6-digit code')} />
              <Text style={{ fontFamily: F.body, fontSize: 14, color: C.muted }}>
                {t('Sent to +91 {phone}', { phone })} ·{' '}
                <Text
                  onPress={() => {
                    setSent(false);
                    setCode('');
                  }}
                  style={{ fontFamily: F.semi, color: C.forest }}
                >
                  {t('Change')}
                </Text>
              </Text>
              <Button title={t('Continue')} disabled={code.length !== 6} onPress={verify} />
            </View>
          )}
        </FadeIn>
      ) : (
        <FadeIn key="email" style={{ gap: 14 }}>
          <Text style={[styles.fl, { fontFamily: F.semi }, { fontFamily: F.semi }]}>{t('Email')}</Text>
          <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder={t('you@example.com')} placeholderTextColor="#8A958C" style={[styles.field, styles.input, { fontFamily: F.body }]} accessibilityLabel={t('Email')} />
          <Text style={[styles.fl, { fontFamily: F.semi }, { fontFamily: F.semi }]}>{t('Password')}</Text>
          <TextInput value={pw} onChangeText={setPw} secureTextEntry autoComplete="password" style={[styles.field, styles.input, { fontFamily: F.body }]} accessibilityLabel={t('Password')} />
          <Button title={t('Continue')} disabled={!email.includes('@') || pw.length < 6} onPress={verify} />
        </FadeIn>
      )}

      <Text style={{ fontFamily: F.body, fontSize: 12.5, lineHeight: 19, color: C.muted }}>{t('Prototype: there is no server yet, so any 6-digit code signs you in on this device only.')}</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
        <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>{t('or')}</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
      </View>
      <Button title={t('Take the assessment without an account')} variant="link" onPress={() => router.replace('/assess')} style={{ alignSelf: 'center' }} />
      <Text style={{ fontFamily: F.body, fontSize: 15, color: C.body }}>
        {t('New to AHI?')}{' '}
        <Text onPress={() => router.replace('/onboarding')} style={{ fontFamily: F.bold, color: C.forest, textDecorationLine: 'underline' }}>
          {t('Create an account')}
        </Text>
      </Text>
    </View>
  );
}

export default function SignIn() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wide, height } = useLayout();

  if (wide) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: C.bg }}>
        <View style={[styles.aside, { minHeight: height }]}>
          <PanelGlow width={600} />
          <View style={{ position: 'absolute', right: -40, bottom: -20, opacity: 0.9 }}>
            <Sprig width={380} height={460} />
          </View>
          <Pressable accessibilityRole="link" onPress={() => router.push('/')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Logo size={36} light />
            <Text style={{ fontFamily: F.display, fontSize: 22, color: C.onDark }}>{t('Ayurveda Health Index')}</Text>
          </Pressable>
          <View style={{ gap: 16, maxWidth: 420 }}>
            <Deva style={{ fontSize: 22, lineHeight: 36, color: C.leaf }}>प्रसन्नात्मेन्द्रियमनाः स्वस्थ इत्यभिधीयते</Deva>
            <Title size={38} color={C.onDark} accentColor={C.leaf} accent={t('that is health.')}>
              {t('A content self, clear senses and a calm mind —')}
            </Title>
            <Label style={{ fontSize: 11, color: C.onDarkLabel }}>{t('Suśruta Saṃhitā · 15.41')}</Label>
          </View>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 64, gap: 24 }}>
          <BackgroundFX intensity={0.5} />
          <FadeIn style={{ gap: 8 }}>
            <Title size={52} accent={t('back.')}>
              {t('Welcome')}
            </Title>
            <Body style={{ fontSize: 17, color: C.muted }}>{t('Sign in to see your index and today’s plan.')}</Body>
          </FadeIn>
          <SignInForm />
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <BackgroundFX intensity={0.6} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }} keyboardShouldPersistTaps="handled">
        <DarkTop />
        <View style={[styles.head, { paddingTop: insets.top + 8 }]}>
          <PanelGlow />
          <View style={{ position: 'absolute', left: 18, top: insets.top + 8, zIndex: 2 }}>
            <RoundButton icon="arrow-back" label={t('Back')} dark onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
          </View>
          <View style={{ alignItems: 'center', marginTop: -10 }}>
            <Sprig width={190} height={230} />
          </View>
        </View>
        <View style={{ paddingHorizontal: 22, paddingTop: 24, gap: 6 }}>
          <FadeIn style={{ gap: 4 }}>
            <Title size={34} accent={t('AHI')}>
              {t('Welcome to')}
            </Title>
            <Body style={{ fontSize: 15, color: C.muted }}>{t('We’ll send a 6-digit code to your phone.')}</Body>
          </FadeIn>
          <View style={{ marginTop: 14 }}>
            <SignInForm />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  aside: { flexGrow: 1, flexShrink: 1, flexBasis: 520, overflow: 'hidden', backgroundColor: C.forest, paddingVertical: 40, paddingHorizontal: 52, justifyContent: 'space-between' },
  head: { height: 300, backgroundColor: C.forest, borderBottomLeftRadius: 160, borderBottomRightRadius: 160, overflow: 'hidden', justifyContent: 'flex-end' },
  fl: { fontSize: 14, color: C.ink },
  seg: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: C.mist, borderRadius: 999, padding: 4, gap: 4 },
  segBtn: { height: 42, paddingHorizontal: 18, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: C.paper, shadowColor: C.deep, shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  field: { minHeight: 54, borderWidth: 1, borderColor: C.lineStrong, borderRadius: 14, backgroundColor: C.paper, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, fontSize: 17, color: C.ink, paddingVertical: 12 },
  otp: { flex: 1, maxWidth: 54, height: 60, borderRadius: 14, borderWidth: 1, borderColor: C.lineStrong, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center' },
  hidden: { position: 'absolute', opacity: 0, height: 1, width: 1 },
});
