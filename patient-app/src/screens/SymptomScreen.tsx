import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

type Props = { onSubmit: (symptoms: string[]) => Promise<void> };

export function SymptomScreen({ onSubmit }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [redFlags, setRedFlags] = useState<RedFlagSymptom[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeRedFlag = getRedFlagMatch(redFlags);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(selected);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit your scan. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll}>
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

      {error && <Text style={styles.error}>{error}</Text>}
      <Button
        mode="contained"
        style={styles.submit}
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting}
      >
        Next
      </Button>

      <RedFlagAlert symptom={activeRedFlag} onDismiss={() => setRedFlags([])} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scroll: { padding: 16 },
  title: { marginBottom: 4 },
  subtitle: { marginBottom: 16, opacity: 0.7 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chip: {},
  emergencyTitle: { marginBottom: 8, color: '#EF4444' },
  submit: { margin: 16 },
  error: { color: '#EF4444', marginHorizontal: 16 },
});
