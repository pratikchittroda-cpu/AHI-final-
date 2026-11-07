import React, { useCallback, useState } from 'react';
import { View, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Gloock_400Regular } from '@expo-google-fonts/gloock';
import { Newsreader_400Regular_Italic } from '@expo-google-fonts/newsreader';
import { InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold, InstrumentSans_700Bold } from '@expo-google-fonts/instrument-sans';
import { TiroDevanagariSanskrit_400Regular } from '@expo-google-fonts/tiro-devanagari-sanskrit';
import { AhiProvider, useAhi } from '../state/AhiContext';
import { AnimatedSplash } from '../components/Splash';
import { C } from '../theme';

// Keep the native splash up until the animated one has drawn its first (identical) frame.
SplashScreen.preventAutoHideAsync().catch(() => {});

/** The website opens straight to its content; the phone apps open through the animated splash. */
const SHOW_SPLASH = Platform.OS !== 'web';

function AppContent() {
  const { ready } = useAhi();
  const [splashDone, setSplashDone] = useState(!SHOW_SPLASH);
  // On phones the app mounts beneath the splash once its opening has played, so the two never compete.
  const [showApp, setShowApp] = useState(!SHOW_SPLASH);
  const finish = useCallback(() => setSplashDone(true), []);
  const reveal = useCallback(() => setShowApp(true), []);

  if (!SHOW_SPLASH && ready) SplashScreen.hide();

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {ready && showApp ? (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: 'default', gestureEnabled: true, fullScreenGestureEnabled: true }}>
          <Stack.Screen name="index" options={{ animation: 'fade', title: 'AHI · Ayurveda Health Index' }} />
          <Stack.Screen name="sign-in" options={{ title: 'Sign in · AHI' }} />
          <Stack.Screen name="onboarding" options={{ title: 'Create your profile · AHI' }} />
          <Stack.Screen name="(app)" options={{ animation: 'fade' }} />
          <Stack.Screen name="[moduleId]/quiz" options={{ animation: 'slide_from_right', title: 'Assessment · AHI' }} />
          <Stack.Screen name="[moduleId]/result" options={{ animation: 'fade_from_bottom', animationDuration: 320, title: 'Result · AHI' }} />
          <Stack.Screen name="agni-check" options={{ presentation: 'modal', title: 'Agni check · AHI' }} />
        </Stack>
      ) : null}
      {splashDone ? null : <AnimatedSplash ready={ready} onShowApp={reveal} onDone={finish} />}
    </View>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Gloock_400Regular,
    Newsreader_400Regular_Italic,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
    TiroDevanagariSanskrit_400Regular,
  });
  // Until the fonts are in, the native splash stays on screen.
  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <AhiProvider>
        <StatusBar style="dark" />
        <AppContent />
      </AhiProvider>
    </SafeAreaProvider>
  );
}
