import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useScan } from '../hooks/useScan';
import { AuthScreen } from '../screens/AuthScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ScanScreen } from '../screens/ScanScreen';
import { SymptomScreen } from '../screens/SymptomScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { uploadScan } from '../services/scanService';

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Home: undefined;
  Scan: undefined;
  Symptoms: { photoUri: string };
  Results: { scanId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function ResultsScreenContainer({ scanId, onAction }: { scanId: string; onAction: () => void }) {
  const { finalSeverity, doctorNote, homeCareSteps } = useScan(scanId);
  return (
    <ResultsScreen
      finalSeverity={finalSeverity}
      doctorNote={doctorNote}
      homeCareSteps={homeCareSteps}
      onAction={onAction}
    />
  );
}

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
                    const scanId = await uploadScan(user, route.params.photoUri, symptoms);
                    navigation.navigate('Results', { scanId });
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Results">
              {({ navigation, route }) => (
                <ResultsScreenContainer
                  scanId={route.params.scanId}
                  onAction={() => navigation.navigate('Home')}
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
