import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/theme';

type Props = { onDone: () => void };

// Shown after a scan is saved. The scan lives only on this phone: nothing was uploaded, and no
// AI or doctor has looked at it (PLAN.md D1/D3). Doctor review returns with the share flow (Phase 4).
export function ScanSavedScreen({ onDone }: Props) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.icon}>✓</Text>
        <Text variant="headlineSmall" style={styles.title}>
          {t('saved.title')}
        </Text>
        <Text style={styles.body}>{t('saved.body')}</Text>
      </View>
      <Button mode="contained" style={styles.action} onPress={onDone}>
        {t('common.done')}
      </Button>
      <Text style={styles.disclaimer}>{t('disclaimer')}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  icon: { fontSize: 48, marginBottom: 16, color: colors.normal },
  title: { marginBottom: 8, textAlign: 'center' },
  body: { textAlign: 'center', opacity: 0.7 },
  action: { marginHorizontal: 16 },
  disclaimer: { fontSize: 12, opacity: 0.6, textAlign: 'center', padding: 16 },
});
