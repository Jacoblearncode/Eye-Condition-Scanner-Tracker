import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Chip, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { RedFlagAlert } from '../components/RedFlagAlert';
import { RED_FLAG_SYMPTOMS, getRedFlagMatch, type RedFlagSymptom } from '../utils/severityUtils';
import { ROUTINE_SYMPTOM_IDS } from '../utils/symptomIds';

type Props = { onSubmit: (symptoms: string[]) => Promise<void> };

export function SymptomScreen({ onSubmit }: Props) {
  const { t } = useTranslation();
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
      // Show a translated message; the raw error text is English-only and not meant for patients.
      console.warn('Saving the scan failed:', e);
      setError(t('symptoms.saveFailed'));
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
          {t('symptoms.title')}
        </Text>
        <Text style={styles.subtitle}>{t('symptoms.subtitle')}</Text>

        <View style={styles.chipWrap}>
          {ROUTINE_SYMPTOM_IDS.map((symptom) => (
            <Chip
              key={symptom}
              selected={selected.includes(symptom)}
              onPress={() => toggle(symptom)}
              style={styles.chip}
            >
              {t(`symptoms.items.${symptom}`)}
            </Chip>
          ))}
        </View>

        <Text variant="titleSmall" style={styles.emergencyTitle}>
          {t('symptoms.emergency')}
        </Text>
        <View style={styles.chipWrap}>
          {RED_FLAG_SYMPTOMS.map((key) => (
            <Chip
              key={key}
              selected={redFlags.includes(key)}
              onPress={() => toggleRedFlag(key)}
              style={styles.chip}
            >
              {t(`redFlags.${key}.label`)}
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
        {t('symptoms.next')}
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
