import { useCallback, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ScanScreen } from '../screens/ScanScreen';
import { SymptomScreen } from '../screens/SymptomScreen';
import { ScanSavedScreen } from '../screens/ScanSavedScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { saveScanLocally } from '../services/scanService';
import { getDb } from '../storage/database';
import { SETTING_KEYS, getSetting, setSetting } from '../storage/settingsRepository';

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Scan: undefined;
  Symptoms: { photoUri: string };
  Saved: { scanId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// No login (PLAN.md Q15, 0.10): the app works with no account, and nothing on this default
// path imports Firebase (tests/local-first.test.ts enforces that). An account is only needed
// for sharing or booking, which come later; AuthScreen stays unrouted until then.
export function RootNavigator() {
  // null = still reading the saved choice from the phone.
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    getDb()
      .then((db) => getSetting(db, SETTING_KEYS.onboardingCompletedAt))
      .then((value) => setOnboarded(value !== null))
      .catch((err) => {
        console.warn('Could not read the saved onboarding state:', err);
        setOnboarded(false);
      });
  }, []);

  const finishOnboarding = useCallback(async () => {
    try {
      const db = await getDb();
      await setSetting(db, SETTING_KEYS.onboardingCompletedAt, new Date().toISOString());
    } catch (err) {
      // Carry on; the owner will just see this screen again next launch.
      console.warn('Could not save that onboarding finished:', err);
    }
    setOnboarded(true);
  }, []);

  if (onboarded === null) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!onboarded ? (
          <Stack.Screen name="Onboarding">
            {() => <OnboardingScreen onContinue={finishOnboarding} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Home">
              {({ navigation }) => (
                <HomeScreen
                  onScanPress={() => navigation.navigate('Scan')}
                  onSettingsPress={() => navigation.navigate('Settings')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Scan">
              {({ navigation }) => (
                <ScanScreen
                  onPhotoConfirmed={(uri) => navigation.navigate('Symptoms', { photoUri: uri })}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Symptoms">
              {({ navigation, route }) => (
                <SymptomScreen
                  onSubmit={async (symptoms) => {
                    // Saved on this phone only; nothing is uploaded (PLAN.md D3).
                    const scanId = await saveScanLocally({
                      photoUri: route.params.photoUri,
                      symptoms,
                    });
                    navigation.navigate('Saved', { scanId });
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Saved">
              {({ navigation }) => <ScanSavedScreen onDone={() => navigation.navigate('Home')} />}
            </Stack.Screen>
            <Stack.Screen name="Settings">
              {({ navigation }) => <SettingsScreen onBack={() => navigation.goBack()} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
