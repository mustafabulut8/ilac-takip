import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Banner } from '@/components/banner';
import { Icon } from '@/components/icon';
import { MedicationCard } from '@/components/medication-card';
import { PrimaryButton } from '@/components/primary-button';
import { SectionHeader } from '@/components/section-header';
import { TabScreen } from '@/components/tab-screen';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { userMessageOf } from '@/errors';
import { useMedications } from '@/hooks/useMedications';
import { getMedicationForm } from '@/models';

const addMedication = () => router.push('/ilac-ekle');

export default function MedicationsScreen() {
  const { medications, updateMedication, removeMedication } = useMedications();
  const [error, setError] = useState<string | null>(null);
  const lowCount = medications.filter((item) =>
    getMedicationForm(item.form).isRunningLow(item),
  ).length;

  const run = async (action: Promise<void>) => {
    setError(null);
    try {
      await action;
    } catch (actionError) {
      setError(userMessageOf(actionError, 'İşlem yapılamadı. Lütfen tekrar deneyin.'));
    }
  };

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
          onToggleMarkedLow={() =>
            run(updateMedication(medication.id, { markedLow: !medication.markedLow }))
          }
          onRemove={() => run(removeMedication(medication.id))}
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
