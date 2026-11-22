import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import type { HistoryDay, DaySummary } from '@/hooks/useHistoryWeek';
import { formatLongDate, WEEKDAYS_SHORT } from '@/utils/date';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

type Look = { label: string; background: string; color: string; icon?: IconName };

const LOOKS: Record<DaySummary, Look> = {
  all: { label: 'Hepsi alındı', background: Colors.dayAll, color: Colors.onDayAll, icon: 'check' },
  some: {
    label: 'Bazıları kaçırıldı',
    background: Colors.daySome,
    color: Colors.text,
    icon: 'minus',
  },
  none: {
    label: 'Hiçbiri alınmadı',
    background: Colors.dayNone,
    color: Colors.onDayNone,
    icon: 'close',
  },
  open: {
    label: 'Doz yok veya gün sürüyor',
    background: Colors.neutralSoft,
    color: Colors.textSecondary,
  },
};

type WeekDaysProps = {
  days: HistoryDay[];
  selectedDate: string;
  onSelect: (date: string) => void;
};

/** Yedi gün dairesi. Durum yalnızca renkle değil, altındaki işaretle de verilir. */
export function WeekDays({ days, selectedDate, onSelect }: WeekDaysProps) {
  return (
    <View style={styles.row}>
      {days.map(({ day, date, summary }) => {
        const look = LOOKS[summary];
        const isSelected = date === selectedDate;
        return (
          <Pressable
            key={date}
            accessibilityRole="button"
            accessibilityLabel={`${formatLongDate(day)}, ${look.label}`}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(date)}
            style={styles.day}>
            <AppText size="small" weight={isSelected ? 'bold' : 'regular'} allowFontScaling={false}>
              {WEEKDAYS_SHORT[day.getDay()]}
            </AppText>
            <View
              style={[
                styles.circle,
                { backgroundColor: look.background },
                isSelected && styles.selected,
              ]}>
              <AppText size="small" weight="bold" color={look.color} allowFontScaling={false}>
                {day.getDate()}
              </AppText>
            </View>
            <View style={styles.mark}>
              {look.icon && <Icon name={look.icon} size={16} color={look.color} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Renklerin açıklaması. */
export function WeekLegend() {
  return (
    <View style={styles.legend}>
      {(['all', 'some', 'none'] as const).map((summary) => {
        const { label, background, color, icon } = LOOKS[summary];
        return (
          <View key={summary} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: background }]}>
              {icon && <Icon name={icon} size={16} color={color} />}
            </View>
            <AppText size="small">{label}</AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // Dar ekranda daire 40'a iner; dokunma alanı sütunun tamamıdır.
  day: {
    flex: 1,
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  circle: {
    width: '90%',
    maxWidth: 44,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: Colors.primary,
  },
  mark: {
    height: 16,
  },
  legend: {
    gap: Spacing.two,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
});
