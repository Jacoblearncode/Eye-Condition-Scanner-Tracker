import { Modal, View, StyleSheet, Linking } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { colors } from '../theme/theme';
import type { RedFlagSymptom } from '../utils/severityUtils';
import { RED_FLAG_SYMPTOMS } from '../utils/severityUtils';

type Props = {
  symptom: RedFlagSymptom | null;
  onDismiss: () => void;
};

export function RedFlagAlert({ symptom, onDismiss }: Props) {
  if (!symptom) return null;
  const { message } = RED_FLAG_SYMPTOMS[symptom];

  return (
    <Modal visible transparent={false} animationType="fade">
      <View style={styles.container}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.headline}>Seek Emergency Care Now</Text>
        <Text style={styles.message}>{message}</Text>

        <Button
          mode="contained"
          buttonColor="#FFFFFF"
          textColor={colors.urgent}
          style={styles.button}
          onPress={() => Linking.openURL('tel:999')}
        >
          Call Emergency Services
        </Button>
        <Button
          mode="contained"
          buttonColor="#FFFFFF"
          textColor={colors.urgent}
          style={styles.button}
          onPress={() => Linking.openURL('https://maps.google.com/?q=hospital+near+me')}
        >
          Find Nearest Hospital
        </Button>

        <Button mode="text" textColor="#FFFFFF" onPress={onDismiss} style={styles.dismiss}>
          I understand, continue to app
        </Button>
      </View>
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
