import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { AppShell, PillTabBar } from '../../components/AppShell';
import { BlurTarget, BlurTargetsProvider, LIQUID_GLASS } from '../../components/glass';
import { C } from '../../theme';

/**
 * Today · My index · Assessment · Daily rhythm · Food & herbs · Settings.
 * A tab navigator keeps each screen mounted, so switching tabs is instant and keeps scroll position.
 * Phones draw the floating pill bar; wide screens use the sidebar (PillTabBar renders nothing there).
 *
 * Transitions: instant on the web and on iOS 26+ (Liquid Glass); elsewhere the built-in short sideways shift.
 */
/** Hidden tabs are built in this order, one at a time, once the opening has played (see `warm`). */
const WARM_ORDER = ['home', 'report', 'assess', 'plan', 'profile', 'herbs'];
const WARM_AFTER = 2600; // ms after this layout mounts: the splash has flown away by then
const WARM_EVERY = 450; // ms between tabs, so each build is a single short blip, never one long stall

export default function AppLayout() {
  // Building all six screens at once (their leaf wreaths are hundreds of SVG paths) held the main thread
  // for over 250 ms, which froze the splash. So only the tab on view is built at first; the others
  // are preloaded one by one afterwards, and are ready long before anyone switches to them.
  const [warm, setWarm] = useState(0);
  useEffect(() => {
    if (warm >= WARM_ORDER.length) return undefined;
    const t = setTimeout(() => setWarm((w) => w + 1), warm === 0 ? WARM_AFTER : WARM_EVERY);
    return () => clearTimeout(t);
  }, [warm]);

  return (
    <AppShell>
      <BlurTargetsProvider>
      <Tabs
        tabBar={(props) => <PillTabBar {...props} />}
        // On Android 12+ each screen is a blur target, so the floating tab bar can frost what's under it.
        screenLayout={({ route, children }) => <BlurTarget id={route.key}>{children}</BlurTarget>}
        screenOptions={({ route }) => ({
          headerShown: false,
          // Instant on the web (as a website's pages are) and on iOS 26+, as Apple's own tab bars are — a
          // fade would leave the Liquid Glass inside the screen unable to draw; a short shift elsewhere.
          animation: Platform.OS === 'web' || LIQUID_GLASS ? 'none' : 'shift',
          // Every tab ends up mounted (preloaded in turn, see `warm`), so a first visit never builds a whole
          // screen mid-animation. Hidden tabs pause their background animations (see Screen).
          lazy: WARM_ORDER.indexOf(route.name) >= warm,
          sceneStyle: { backgroundColor: C.bg },
        })}
      >
        <Tabs.Screen name="home" options={{ title: 'Today · AHI' }} />
        <Tabs.Screen name="report" options={{ title: 'My index · AHI' }} />
        <Tabs.Screen name="assess" options={{ title: 'Assessment · AHI' }} />
        <Tabs.Screen name="plan" options={{ title: 'Daily rhythm · AHI' }} />
        <Tabs.Screen name="herbs" options={{ title: 'Food & herbs · AHI' }} />
        <Tabs.Screen name="profile" options={{ title: 'Settings · AHI' }} />
      </Tabs>
      </BlurTargetsProvider>
    </AppShell>
  );
}
