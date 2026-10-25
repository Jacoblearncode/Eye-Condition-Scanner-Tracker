import { Modal, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/theme';
import type { RedFlagSymptom } from '../utils/severityUtils';

type Props = {
  symptom: RedFlagSymptom | null;
  onDismiss: () => void;
};

export function RedFlagAlert({ symptom, onDismiss }: Props) {
  const { t } = useTranslation();
  if (!symptom) return null;

  return (
    <Modal visible transparent={false} animationType="fade">
      <SafeAreaView style={styles.container}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.headline}>{t('redFlagAlert.headline')}</Text>
        <Text style={styles.message}>{t(`redFlags.${symptom}.message`)}</Text>

        <Button
          mode="contained"
          buttonColor="#FFFFFF"
          textColor={colors.urgent}
          style={styles.button}
          onPress={() => Linking.openURL('tel:999')}
        >
          {t('redFlagAlert.call')}
        </Button>
        <Button
          mode="contained"
          buttonColor="#FFFFFF"
          textColor={colors.urgent}
          style={styles.button}
          onPress={() => Linking.openURL('https://maps.google.com/?q=hospital+near+me')}
        >
          {t('redFlagAlert.hospital')}
        </Button>

        <Button mode="text" textColor="#FFFFFF" onPress={onDismiss} style={styles.dismiss}>
          {t('redFlagAlert.dismiss')}
        </Button>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.urgent,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: { fontSize: 64, marginBottom: 16 },
  headline: { fontSize: 26, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 12 },
  message: { fontSize: 16, color: '#FFFFFF', textAlign: 'center', marginBottom: 32 },
  button: { width: '100%', marginBottom: 12 },
  dismiss: { marginTop: 24 },
});
