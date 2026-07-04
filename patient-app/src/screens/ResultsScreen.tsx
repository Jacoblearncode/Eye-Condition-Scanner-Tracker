import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { colors } from '../theme/theme';

// finalSeverity is set by the doctor via the clinic dashboard — never derived
// from the AI's raw aiSeverityHint. See build guide Section 9 / Phase 5 CRITICAL note.
export type FinalSeverity = 'normal' | 'follow-up' | 'hospital' | null;

type Props = {
  finalSeverity: FinalSeverity;
  doctorNote?: string;
  homeCareSteps?: string[];
  onAction: () => void;
};

const SEVERITY_CONFIG = {
  normal: { label: 'On Track', color: colors.normal, actionLabel: 'All Good' },
  'follow-up': { label: 'Follow-Up Advised', color: colors.watch, actionLabel: 'Book Follow-Up' },
  hospital: { label: 'Hospital Referral', color: colors.urgent, actionLabel: 'Go to Hospital Now' },
} as const;

export function ResultsScreen({ finalSeverity, doctorNote, homeCareSteps, onAction }: Props) {
  if (!finalSeverity) {
    return (
      <View style={styles.pendingContainer}>
        <Text style={styles.pendingIcon}>🕐</Text>
        <Text variant="headlineSmall" style={styles.pendingTitle}>
          Your scan is being reviewed
        </Text>
        <Text style={styles.pendingBody}>
          A clinician will review your results shortly. This usually takes 24 hours.
        </Text>
        <Disclaimer />
      </View>
    );
  }

  const config = SEVERITY_CONFIG[finalSeverity];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={[styles.badgeCard, { backgroundColor: `${config.color}22` }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: config.color }}>
              {config.label}
            </Text>
          </Card.Content>
        </Card>

        {doctorNote && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="labelLarge">Doctor's Note</Text>
              <Text>{doctorNote}</Text>
            </Card.Content>
          </Card>
        )}

        {homeCareSteps && homeCareSteps.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="labelLarge">Suggested Home Care</Text>
              {homeCareSteps.map((step) => (
                <Text key={step}>• {step}</Text>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <Button mode="contained" buttonColor={config.color} style={styles.action} onPress={onAction}>
        {config.actionLabel}
      </Button>
      <Disclaimer />
    </View>
  );
}

function Disclaimer() {
  return (
    <Text style={styles.disclaimer}>
      This app is a recovery progress aid and does not replace medical diagnosis. Always follow
      your doctor's advice.
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16 },
  pendingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  pendingIcon: { fontSize: 48, marginBottom: 16 },
  pendingTitle: { marginBottom: 8, textAlign: 'center' },
  pendingBody: { textAlign: 'center', opacity: 0.7, marginBottom: 32 },
  badgeCard: { marginBottom: 16 },
  card: { marginBottom: 16, backgroundColor: colors.surface },
  action: { marginHorizontal: 16 },
  disclaimer: { fontSize: 12, opacity: 0.6, textAlign: 'center', padding: 16 },
});
