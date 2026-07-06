import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, FAB } from 'react-native-paper';
import { colors } from '../theme/theme';

type Props = { onScanPress: () => void };

export function HomeScreen({ onScanPress }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll}>
        <Text variant="headlineSmall">Good morning</Text>
        <Card style={styles.statusCard}>
          <Card.Content>
            <Text variant="labelLarge">Recovery Status</Text>
            <Text variant="headlineMedium" style={{ color: colors.normal }}>
              On Track
            </Text>
            <Text>Day 12 · Expected recovery: 2 weeks remaining</Text>
          </Card.Content>
        </Card>
      </ScrollView>
      <FAB icon="camera" style={styles.fab} onPress={onScanPress} label="Scan" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scroll: { padding: 16 },
  statusCard: { marginTop: 16, backgroundColor: colors.surface },
  fab: { position: 'absolute', right: 16, bottom: 24, backgroundColor: colors.primary },
});
