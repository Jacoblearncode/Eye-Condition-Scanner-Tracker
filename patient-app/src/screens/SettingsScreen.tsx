import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/theme';
import { LanguagePicker } from '../components/LanguagePicker';

type Props = { onBack: () => void };

export function SettingsScreen({ onBack }: Props) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          {t('settings.title')}
        </Text>
        <LanguagePicker />
      </View>
      <Button mode="contained" style={styles.back} onPress={onBack}>
        {t('common.back')}
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: 24 },
  title: { marginBottom: 24 },
  back: { margin: 16 },
});
