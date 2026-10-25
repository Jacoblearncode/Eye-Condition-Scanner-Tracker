import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Checkbox } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { LanguagePicker } from '../components/LanguagePicker';

type Props = { onContinue: () => void };

export function OnboardingScreen({ onContinue }: Props) {
  const { t } = useTranslation();
  const [consented, setConsented] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <LanguagePicker />
        <Text variant="headlineMedium" style={styles.title}>
          {t('onboarding.title')}
        </Text>
        <Text style={styles.body}>{t('onboarding.body')}</Text>
        <View style={styles.consentRow}>
          <Checkbox
            status={consented ? 'checked' : 'unchecked'}
            onPress={() => setConsented(!consented)}
          />
          <Text style={styles.consentText} onPress={() => setConsented(!consented)}>
            {t('onboarding.consent')}
          </Text>
        </View>
        <Button mode="contained" onPress={onContinue} disabled={!consented}>
          {t('onboarding.continue')}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { marginTop: 32, marginBottom: 16 },
  body: { marginBottom: 24, lineHeight: 22 },
  consentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  consentText: { flex: 1 },
});
