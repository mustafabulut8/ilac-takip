import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { StyleSheet, type Insets, type ViewStyle } from 'react-native';

import { MinTouchSize } from '@/constants/theme';
import { DoseCalculator } from '@/services/DoseCalculator';
import { HistoryService } from '@/services/HistoryService';
import { makeMedication } from '@/test-utils/fakes';

import { Chip } from '../chip-group';
import { DoseCard } from '../dose-card';
import { ConsentCheckbox } from '../form/consent-checkbox';
import { IconButton } from '../icon-button';
import { NumberStepper } from '../number-stepper';
import { OptionCard } from '../option-card';
import { PrimaryButton } from '../primary-button';
import { RoleOption } from '../role-option';
import { SecondaryButton } from '../secondary-button';
import { SettingsRow } from '../settings-row';
import { TextLink } from '../text-link';
import { TimeStepper } from '../time-stepper';
import { WeekDays } from '../week-days';

// Yaşlı kullanıcı kuralı (CLAUDE.md): dokunma alanı en az 48pt, her dokunulabilir öğenin
// ekran okuyucu için etiketi ve rolü var. Ölçü, çizilen öğenin stilinden ve hitSlop'tan okunur.
jest.mock('@/hooks/useMedicationPhoto', () => ({ useMedicationPhoto: () => null }));

const INTERACTIVE_ROLES = ['button', 'link', 'radio', 'checkbox', 'switch', 'adjustable'] as const;
const noop = () => {};
const medication = makeMedication();
const now = new Date(2026, 10, 18, 9, 0);
const week = new HistoryService(new DoseCalculator()).getWeek(
  new Date(2026, 10, 16),
  [medication],
  [],
  now,
);

const CASES: [string, () => ReactElement][] = [
  ['Ana buton', () => <PrimaryButton label="Kaydet" onPress={noop} />],
  ['Küçük ikincil buton', () => <SecondaryButton label="Vazgeç" compact onPress={noop} />],
  ['Simge butonu', () => <IconButton icon="close" accessibilityLabel="Kapat" onPress={noop} />],
  ['Metin bağlantısı', () => <TextLink label="Şifremi unuttum" onPress={noop} />],
  ['Seçenek kartı', () => <OptionCard label="Tablet" selected={false} onPress={noop} />],
  ['Seçim çipi', () => <Chip label="Pzt" onPress={noop} />],
  ['Rol kartı', () => <RoleOption role="sade" selected={false} onPress={noop} />],
  ['Ayar satırı', () => <SettingsRow icon="person" label="Profil" onPress={noop} />],
  [
    'Doz kartı',
    () => (
      <DoseCard
        dose={{ medication, date: '2026-11-18', time: '20:00', status: 'bekliyor' }}
        onPress={noop}
      />
    ),
  ],
  ['KVKK onay kutusu', () => <ConsentCheckbox checked={false} onToggle={noop} onOpenText={noop} />],
  [
    'Sayı seçici',
    () => <NumberStepper value={10} unit="adet" min={0} max={999} step={1} onChange={noop} />,
  ],
  [
    'Saat seçici',
    () => <TimeStepper hour={8} minute={0} onHourChange={noop} onMinuteChange={noop} />,
  ],
  ['Hafta günleri', () => <WeekDays days={week.days} selectedDate="2026-11-18" onSelect={noop} />],
];

type HostElement = {
  props: { style?: unknown; hitSlop?: number | Insets; accessibilityLabel?: string };
};

function slopOf(hitSlop: number | Insets | undefined, a: keyof Insets, b: keyof Insets) {
  if (typeof hitSlop === 'number') return hitSlop * 2;
  return (hitSlop?.[a] ?? 0) + (hitSlop?.[b] ?? 0);
}

/** Stilin garanti ettiği en küçük boy; boy verilmemişse içeriğe bağlıdır (null). */
function guaranteed(style: ViewStyle, size: 'height' | 'width', min: 'minHeight' | 'minWidth') {
  const values = [style[size], style[min]].filter((value) => typeof value === 'number');
  return values.length > 0 ? Math.max(...(values as number[])) : null;
}

function interactiveElements(): HostElement[] {
  return INTERACTIVE_ROLES.flatMap((role) => screen.queryAllByRole(role)) as HostElement[];
}

describe('dokunma alanları ve erişilebilirlik', () => {
  it.each(CASES)('%s: etiketli, rollü ve en az 48pt', async (_name, build) => {
    await render(build());
    const targets = interactiveElements();
    expect(targets.length).toBeGreaterThan(0);

    for (const target of targets) {
      expect(target.props.accessibilityLabel?.trim()).toBeTruthy();
      const style = StyleSheet.flatten(target.props.style as ViewStyle) ?? {};
      const height = guaranteed(style, 'height', 'minHeight');
      expect(height).not.toBeNull();
      expect(height! + slopOf(target.props.hitSlop, 'top', 'bottom')).toBeGreaterThanOrEqual(
        MinTouchSize,
      );
      const width = guaranteed(style, 'width', 'minWidth');
      if (width !== null) {
        expect(width + slopOf(target.props.hitSlop, 'left', 'right')).toBeGreaterThanOrEqual(
          MinTouchSize,
        );
      }
    }
  });
});
