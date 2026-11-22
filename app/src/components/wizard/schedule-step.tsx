import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Chip, ChipGroup } from '@/components/chip-group';
import { NumberStepper } from '@/components/number-stepper';
import { OptionCard } from '@/components/option-card';
import type { MedicationWizard } from '@/hooks/useMedicationWizard';
import { WEEK_ORDER, WEEKDAYS, WEEKDAYS_SHORT } from '@/utils/date';
import { DURATION_DAYS } from '@/validation/medication-input';

import { StepTitle } from './step-title';

const DEFAULT_DAYS = 7;

export function ScheduleStep({ wizard }: { wizard: MedicationWizard }) {
  const { schedule, duration } = wizard.draft;
  const { update } = wizard;
  const selectedDays = schedule.kind === 'weekdays' ? schedule.days : [];

  const toggleDay = (day: number) => {
    const days = selectedDays.includes(day)
      ? selectedDays.filter((item) => item !== day)
      : [...selectedDays, day].sort();
    update({ schedule: { kind: 'weekdays', days } });
  };

  return (
    <>
      <StepTitle title="Ne sıklıkla alacaksınız?" />
      <OptionCard
        label="Her gün"
        icon="repeat"
        selected={schedule.kind === 'daily'}
        onPress={() => update({ schedule: { kind: 'daily' } })}
      />
      <OptionCard
        label="Haftanın belirli günleri"
        icon="calendar"
        selected={schedule.kind === 'weekdays'}
        onPress={() => update({ schedule: { kind: 'weekdays', days: selectedDays } })}
      />
      {schedule.kind === 'weekdays' && (
        <ChipGroup>
          {WEEK_ORDER.map((day) => (
            <Chip
              key={day}
              multiple
              label={WEEKDAYS_SHORT[day]}
              accessibilityLabel={WEEKDAYS[day]}
              selected={selectedDays.includes(day)}
              onPress={() => toggleDay(day)}
            />
          ))}
        </ChipGroup>
      )}

      <AppText size="subtitle" weight="bold" accessibilityRole="header">
        Ne kadar süre?
      </AppText>
      <OptionCard
        label="Sürekli kullanım"
        icon="repeat"
        selected={duration.kind === 'continuous'}
        onPress={() => update({ duration: { kind: 'continuous' } })}
      />
      <OptionCard
        label="Belirli gün sayısı"
        icon="hourglass"
        selected={duration.kind === 'days'}
        onPress={() =>
          duration.kind === 'continuous' &&
          update({ duration: { kind: 'days', count: DEFAULT_DAYS } })
        }
      />
      {duration.kind === 'days' && (
        <Card>
          <NumberStepper
            value={duration.count}
            unit="gün"
            onChange={(count) => update({ duration: { kind: 'days', count } })}
            {...DURATION_DAYS}
          />
        </Card>
      )}
    </>
  );
}
