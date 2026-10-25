import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { AuthScreen } from '../screens/AuthScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ScanScreen } from '../screens/ScanScreen';
import { SymptomScreen } from '../screens/SymptomScreen';
import { ScanSavedScreen } from '../screens/ScanSavedScreen';
import { saveScanLocally } from '../services/scanService';

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Home: undefined;
  Scan: undefined;
  Symptoms: { photoUri: string };
  Saved: { scanId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, initializing } = useAuth();
  const [hasOnboarded, setHasOnboarded] = useState(false);

  if (initializing) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasOnboarded ? (
          <Stack.Screen name="Onboarding">
            {() => <OnboardingScreen onContinue={() => setHasOnboarded(true)} />}
          </Stack.Screen>
        ) : !user ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name="Home">
              {({ navigation }) => (
                <HomeScreen onScanPress={() => navigation.navigate('Scan')} />
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
