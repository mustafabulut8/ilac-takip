import { StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Banner } from '@/components/banner';
import { Card } from '@/components/card';
import { Chip, ChipGroup } from '@/components/chip-group';
import { NumberStepper } from '@/components/number-stepper';
import { Colors, MinTouchSize, Spacing } from '@/constants/theme';
import type { MedicationWizard } from '@/hooks/useMedicationWizard';
import { DEFAULT_LOW_STOCK_THRESHOLD, getMedicationForm } from '@/models';
import { MAX_STOCK } from '@/models';

import { StepTitle } from './step-title';

const QUICK_STOCKS = [14, 28, 30, 60];

type ToggleRowProps = {
  title: string;
  detail: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

function ToggleRow({ title, detail, value, onChange }: ToggleRowProps) {
  return (
    <Card style={styles.toggle}>
      <View style={styles.flex}>
        <AppText weight="bold">{title}</AppText>
        <AppText size="small" color={Colors.textSecondary}>
          {detail}
        </AppText>
      </View>
      <View style={styles.switch}>
        <Switch
          value={value}
          onValueChange={onChange}
          accessibilityLabel={title}
          trackColor={{ true: Colors.primary }}
        />
      </View>
    </Card>
  );
}

export function StockStep({ wizard }: { wizard: MedicationWizard }) {
  const { draft, update } = wizard;
  const form = getMedicationForm(draft.form);
  const unit = form.stockUnit();

  if (!form.isCountable()) {
    return (
      <>
        <StepTitle title="Stok takibi" />
        <Banner
          tone="info"
          icon="info"
          title={`${form.label} adetle sayılmaz`}
          detail="Bitmeye yaklaşınca İlaçlarım ekranında “Bitmek üzere olarak işaretle” düğmesine basın."
        />
        <ToggleRow
          title="Bitmek üzere"
          detail="Şu anda elinizde az kaldıysa açın."
          value={draft.markedLow}
          onChange={(markedLow) => update({ markedLow })}
        />
      </>
    );
  }

  return (
    <>
      <StepTitle title={unit === 'adet' ? 'Kutuda kaç tane var?' : `Kutuda kaç ${unit} var?`} />
      <Card>
        <NumberStepper
          value={draft.stock}
          unit={unit}
          min={0}
          max={MAX_STOCK}
          step={1}
          onChange={(stock) => update({ stock })}
        />
        <ChipGroup>
          <Chip
            label="−10"
            accessibilityLabel="10 azalt"
            onPress={() => update({ stock: Math.max(draft.stock - 10, 0) })}
          />
          <Chip
            label="+10"
            accessibilityLabel="10 artır"
            onPress={() => update({ stock: Math.min(draft.stock + 10, MAX_STOCK) })}
          />
        </ChipGroup>
      </Card>
      <AppText weight="bold">Hızlı seçim</AppText>
      <ChipGroup>
        {QUICK_STOCKS.map((stock) => (
          <Chip
            key={stock}
            label={String(stock)}
            accessibilityLabel={`${stock} ${unit}`}
            selected={draft.stock === stock}
            onPress={() => update({ stock })}
          />
        ))}
      </ChipGroup>
      <ToggleRow
        title="Bitmeye yakın uyarı"
        detail={`Kutuda ${draft.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD} ${unit} kaldığında Bugün ekranında uyarılırsınız.`}
        value={draft.lowStockThreshold !== null}
        onChange={(isOn) =>
          update({ lowStockThreshold: isOn ? DEFAULT_LOW_STOCK_THRESHOLD : null })
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  flex: {
    flex: 1,
  },
  switch: {
    minWidth: MinTouchSize,
    minHeight: MinTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
