import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Banner } from '@/components/banner';
import { UNDELIVERED_NOTE } from '@/components/family/person-card';
import { MedicationCard } from '@/components/medication-card';
import { OFFLINE_MESSAGE } from '@/components/needs-internet';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { Colors, Spacing } from '@/constants/theme';
import { useCareSubject } from '@/hooks/useCareSubject';
import { useMedicationList } from '@/hooks/useMedicationList';
import { useOnline } from '@/hooks/useOnline';
import { useUndeliveredIds } from '@/hooks/useUndeliveredIds';

/** Aile üyesinin yakınının ilaçları: aynı ilaç kartları, aynı sihirbaz. */
export default function FamilyMedicationsScreen() {
  const insets = useSafeAreaInsets();
  const subject = useCareSubject();
  const online = useOnline();
  const { medications, now, error, toggleMarkedLow, remove } = useMedicationList();
  const undelivered = useUndeliveredIds(subject?.patientId ?? '', medications);
  const name = subject?.name ?? '';

  return (
    <View style={styles.container}>
      <ScreenHeader title={`${name} ilaçları`} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}>
        {!online && <Banner tone="warning" icon="warning" title={OFFLINE_MESSAGE} />}
        {error && <Banner tone="danger" icon="warning" title={error} />}
        <PrimaryButton
          label="İlaç ekle"
          icon="plus"
          disabled={!online}
          onPress={() =>
            router.push({
              pathname: '/yakin/[kisiId]/ilac-ekle',
              params: { kisiId: subject?.patientId ?? '' },
            })
          }
        />
        {medications.length === 0 && (
          <AppText center color={Colors.textSecondary}>
            {name} için henüz ilaç eklenmedi.
          </AppText>
        )}
        {medications.map((medication) => (
          <MedicationCard
            key={medication.id}
            medication={medication}
            now={now}
            disabled={!online}
            note={undelivered.includes(medication.id) ? UNDELIVERED_NOTE : undefined}
            onToggleMarkedLow={() => toggleMarkedLow(medication)}
            onRemove={() => remove(medication)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { gap: Spacing.three, padding: Spacing.screen },
});
