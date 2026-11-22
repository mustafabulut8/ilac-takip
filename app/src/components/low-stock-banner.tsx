import { router } from 'expo-router';

import { getMedicationForm, type Medication } from '@/models';

import { Banner } from './banner';
import { SecondaryButton } from './secondary-button';

/** Bitmek üzere olan ilaçlar için sarı uyarı bandı; yoksa hiçbir şey çizmez. */
export function LowStockBanner({ medications }: { medications: Medication[] }) {
  const low = medications.filter((medication) =>
    getMedicationForm(medication.form).isRunningLow(medication),
  );
  if (low.length === 0) return null;

  const detail = low
    .map(({ name, form, stock }) => {
      const left = getMedicationForm(form).stockLabel(stock);
      return left ? `${name}: ${left}` : name;
    })
    .join('\n');

  return (
    <Banner
      tone="warning"
      icon="bell"
      title={low.length === 1 ? 'Bir ilacınız bitmek üzere' : `${low.length} ilacınız bitmek üzere`}
      detail={detail}>
      <SecondaryButton
        label="İlaçlarıma bak"
        compact
        onPress={() => router.navigate('/ilaclarim')}
      />
    </Banner>
  );
}
