import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Banner } from '@/components/banner';
import { Icon } from '@/components/icon';
import { MedicationCard } from '@/components/medication-card';
import { PrimaryButton } from '@/components/primary-button';
import { SectionHeader } from '@/components/section-header';
import { TabScreen } from '@/components/tab-screen';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useMedicationList } from '@/hooks/useMedicationList';

const addMedication = () => router.push('/ilac-ekle');

export default function MedicationsScreen() {
  const { medications, lowCount, now, error, toggleMarkedLow, remove } = useMedicationList();

  if (medications.length === 0) {
    return (
      <TabScreen title="İlaçlarım">
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Icon name="pills" size={72} color={Colors.primary} />
          </View>
          <AppText size="title" weight="bold" center>
            Henüz ilaç eklemediniz
          </AppText>
          <AppText color={Colors.textSecondary} center>
            İlk ilacınızı ekleyerek hatırlatmaları başlatın.
          </AppText>
        </View>
        <PrimaryButton label="İlaç ekle" icon="plus" onPress={addMedication} />
      </TabScreen>
    );
  }

  return (
    <TabScreen title="İlaçlarım">
      {error && <Banner tone="danger" icon="warning" title={error} />}
      <SectionHeader
        title="Kayıtlı ilaçlar"
        detail={
          lowCount > 0
            ? `${medications.length} ilaç · ${lowCount} tanesi bitmek üzere`
            : `${medications.length} ilaç`
        }
        icon="pills"
      />
      <PrimaryButton label="İlaç ekle" icon="plus" onPress={addMedication} />
      {medications.map((medication) => (
        <MedicationCard
          key={medication.id}
          medication={medication}
          now={now}
          onToggleMarkedLow={() => toggleMarkedLow(medication)}
          onRemove={() => remove(medication)}
        />
      ))}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.five,
  },
  emptyIcon: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.primarySoft,
  },
});
