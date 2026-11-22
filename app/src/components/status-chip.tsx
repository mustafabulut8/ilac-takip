import { Colors } from '@/constants/theme';
import type { Dose } from '@/models';

import type { IconName } from './icon';
import { Pill } from './pill';

type StatusLook = { label: string; color: string; background: string; icon: IconName };

/** Onay anının yerel saati, örn. "08:04"; kayıt bozuksa boş. */
export function takenTime(takenAt: string | undefined): string {
  const date = new Date(takenAt ?? '');
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

/** Alındı, Bekliyor, Kaçırıldı etiketi. Durum renkle birlikte ikon ve yazıyla da verilir. */
export function StatusChip({ dose }: { dose: Dose }) {
  return <Pill {...statusLook(dose)} />;
}

/** Doz durumunun etiketi ve renkleri (Bugün ve Geçmiş ortak kullanır). */
export function statusLook(dose: Dose): StatusLook {
  switch (dose.status) {
    case 'alindi':
      return {
        label: `Alındı ${takenTime(dose.takenAt)}`.trim(),
        color: Colors.success,
        background: Colors.successSoft,
        icon: 'check',
      };
    case 'kacirildi':
      return {
        label: 'Kaçırıldı',
        color: Colors.danger,
        background: Colors.dangerSoft,
        icon: 'close',
      };
    case 'yarin':
      return {
        label: dose.medication.schedule.kind === 'daily' ? 'Yarın başlıyor' : 'Sonra başlıyor',
        color: Colors.textSecondary,
        background: Colors.neutralSoft,
        icon: 'calendar',
      };
    case 'bekliyor':
      return {
        label: 'Bekliyor',
        color: Colors.textSecondary,
        background: Colors.neutralSoft,
        icon: 'clock',
      };
  }
}
