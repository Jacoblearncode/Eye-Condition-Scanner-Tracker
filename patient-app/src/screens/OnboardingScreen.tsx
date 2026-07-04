import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Checkbox } from 'react-native-paper';

type Props = { onContinue: () => void };

export function OnboardingScreen({ onContinue }: Props) {
  const [consented, setConsented] = useState(false);

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Before you start
      </Text>
      <Text style={styles.body}>
        EyeChecker collects photos of your eye, symptom reports, and recovery timeline data to
        help your clinic monitor your recovery. This is a progress aid only — it does not replace
        your doctor's diagnosis or advice.
      </Text>
      <View style={styles.consentRow}>
        <Checkbox
          status={consented ? 'checked' : 'unchecked'}
          onPress={() => setConsented(!consented)}
        />
        <Text style={styles.consentText}>I agree to the PDPA Privacy Policy</Text>
      </View>
      <Button mode="contained" onPress={onContinue} disabled={!consented} style={styles.button}>
        Continue
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { marginBottom: 16 },
  body: { marginBottom: 24, lineHeight: 22 },
  consentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  consentText: { flex: 1 },
  button: {},
});
