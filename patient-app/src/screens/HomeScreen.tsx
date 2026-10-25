import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, FAB, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/theme';

type Props = { onScanPress: () => void; onSettingsPress: () => void };

export function HomeScreen({ onScanPress, onSettingsPress }: Props) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll}>
        <Text variant="headlineSmall">{t('home.greeting')}</Text>
        <Card style={styles.statusCard}>
          <Card.Content>
            <Text variant="labelLarge">{t('home.statusLabel')}</Text>
            <Text variant="headlineMedium" style={{ color: colors.normal }}>
              {t('home.status')}
            </Text>
            <Text>{t('home.statusDetail')}</Text>
          </Card.Content>
        </Card>
        <Button mode="text" icon="cog" style={styles.settings} onPress={onSettingsPress}>
          {t('home.settings')}
        </Button>
      </ScrollView>
      <FAB icon="camera" style={styles.fab} onPress={onScanPress} label={t('home.scan')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scroll: { padding: 16 },
  statusCard: { marginTop: 16, backgroundColor: colors.surface },
  settings: { alignSelf: 'flex-start', marginTop: 16 },
  fab: { position: 'absolute', right: 16, bottom: 24, backgroundColor: colors.primary },
});
