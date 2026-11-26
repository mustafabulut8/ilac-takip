import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Banner } from '@/components/banner';
import { Card } from '@/components/card';
import { Icon, type IconName } from '@/components/icon';
import { Pill } from '@/components/pill';
import { SecondaryButton } from '@/components/secondary-button';
import { Colors, Spacing } from '@/constants/theme';
import type { MedicationWizard, WizardStepId } from '@/hooks/useMedicationWizard';
import { doseTextOf, formatNumber, getMedicationForm, MEAL_TIMING_LABELS } from '@/models';
import { describeDuration, describeSchedule } from '@/utils/schedule';

import { DraftPhoto } from './draft-photo';
import { StepTitle } from './step-title';

export function SummaryStep({ wizard }: { wizard: MedicationWizard }) {
  const { draft, editStep, isComplete } = wizard;
  const form = getMedicationForm(draft.form);

  const row = (step: WizardStepId, icon: IconName, title: string, value: ReactNode) => (
    <Card key={step} style={styles.row}>
      <View style={styles.rowTexts}>
        <Icon name={icon} size={26} color={Colors.primary} />
        <View style={styles.flex}>
          <AppText size="small" color={Colors.textSecondary}>
            {title}
          </AppText>
          {typeof value === 'string' ? <AppText weight="bold">{value}</AppText> : value}
        </View>
      </View>
      <SecondaryButton
        label="Düzenle"
        icon="edit"
        compact
        accessibilityLabel={`${title}: düzenle`}
        onPress={() => editStep(step)}
      />
    </Card>
  );

  const stockText = form.isCountable()
    ? `${formatNumber(draft.stock)} ${form.stockUnit()} · ${
        draft.lowStockThreshold === null
          ? 'Uyarı kapalı'
          : `${formatNumber(draft.lowStockThreshold)} kalınca uyarılır`
      }`
    : draft.markedLow
      ? 'Bitmek üzere'
      : 'Adetle sayılmaz';

  return (
    <>
      <StepTitle title="Bilgileri kontrol edin" />
      {isComplete && (
        <Banner
          tone="success"
          icon="check"
          title="Tüm bilgiler tamam"
          detail="Kaydetmeden önce son kez göz atın."
        />
      )}
      {row('photo', 'camera', 'Fotoğraf', <DraftPhoto draft={draft} height={96} />)}
      {row('name', 'pills', 'İlaç adı', draft.name.trim() || 'Yazılmadı')}
      {row('form', form.kind, 'İlaç şekli', draft.form ? form.label : 'Seçilmedi')}
      {row('dose', 'pills', 'Doz miktarı', doseTextOf(draft) || 'Yazılmadı')}
      {row(
        'schedule',
        'repeat',
        'Sıklık ve süre',
        `${describeSchedule(draft)} · ${describeDuration(draft)}`,
      )}
      {row(
        'times',
        'clock',
        'Hatırlatma saatleri',
        <View style={styles.pills}>
          {draft.times.map((time) => (
            <Pill key={time} label={time} color={Colors.text} background={Colors.accentSoft} />
          ))}
        </View>,
      )}
      {row(
        'meal',
        'meal',
        'Aç / tok durumu',
        draft.mealTiming ? MEAL_TIMING_LABELS[draft.mealTiming] : 'Seçilmedi',
      )}
      {row('stock', 'box', 'Kutu mevcudu ve uyarı', stockText)}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 12,
  },
  rowTexts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  flex: {
    flex: 1,
    gap: Spacing.one,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
