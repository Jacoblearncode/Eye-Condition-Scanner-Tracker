import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Chip, Button } from 'react-native-paper';
import { RedFlagAlert } from '../components/RedFlagAlert';
import { RED_FLAG_SYMPTOMS, getRedFlagMatch, type RedFlagSymptom } from '../utils/severityUtils';

const ROUTINE_SYMPTOMS = [
  'Redness or pink colouring',
  'Watery or teary eyes',
  'Thick discharge or crusting',
  'Itching or burning sensation',
  'Sensitivity to light',
  'Blurred or hazy vision',
  'Swelling of eyelid',
  'Foreign body sensation',
];

type Props = { onSubmit: (symptoms: string[]) => void };

export function SymptomScreen({ onSubmit }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [redFlags, setRedFlags] = useState<RedFlagSymptom[]>([]);
  const activeRedFlag = getRedFlagMatch(redFlags);

  const toggle = (symptom: string) => {
    setSelected((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const toggleRedFlag = (symptom: RedFlagSymptom) => {
    // Rule-based check — fires immediately, independent of the AI pipeline.
    setRedFlags((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text variant="headlineSmall" style={styles.title}>
          How are you feeling today?
        </Text>
        <Text style={styles.subtitle}>Select all that apply</Text>

        <View style={styles.chipWrap}>
          {ROUTINE_SYMPTOMS.map((symptom) => (
            <Chip
              key={symptom}
              selected={selected.includes(symptom)}
              onPress={() => toggle(symptom)}
              style={styles.chip}
            >
              {symptom}
            </Chip>
          ))}
        </View>

        <Text variant="titleSmall" style={styles.emergencyTitle}>
          Emergency symptoms
        </Text>
        <View style={styles.chipWrap}>
          {(Object.keys(RED_FLAG_SYMPTOMS) as RedFlagSymptom[]).map((key) => (
            <Chip
              key={key}
              selected={redFlags.includes(key)}
              onPress={() => toggleRedFlag(key)}
              style={styles.chip}
            >
              {RED_FLAG_SYMPTOMS[key].label}
            </Chip>
          ))}
        </View>
      </ScrollView>

      <Button mode="contained" style={styles.submit} onPress={() => onSubmit(selected)}>
        Next
      </Button>

      <RedFlagAlert symptom={activeRedFlag} onDismiss={() => setRedFlags([])} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },
  title: { marginBottom: 4 },
  subtitle: { marginBottom: 16, opacity: 0.7 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chip: {},
  emergencyTitle: { marginBottom: 8, color: '#EF4444' },
  submit: { margin: 16 },
});
