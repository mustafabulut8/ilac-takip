import { StyleSheet, View } from 'react-native';

import { AdherenceCard } from '@/components/adherence-card';
import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { DoseCard } from '@/components/dose-card';
import { IconButton } from '@/components/icon-button';
import { SectionHeader } from '@/components/section-header';
import { TabScreen } from '@/components/tab-screen';
import { WeekDays, WeekLegend } from '@/components/week-days';
import { Spacing } from '@/constants/theme';
import { useHistoryWeek } from '@/hooks/useHistoryWeek';
import { formatDateRange, formatLongDate } from '@/utils/date';

export default function HistoryScreen() {
  const history = useHistoryWeek();
  const { week, selectedDay, monday, sunday } = history;

  return (
    <TabScreen title="Geçmiş">
      <Card style={styles.week}>
        <View style={styles.weekHeader}>
          <IconButton
            icon="back"
            accessibilityLabel="Önceki hafta"
            disabled={!history.canGoBack}
            onPress={history.previousWeek}
          />
          <AppText weight="bold" center style={styles.flex}>
            {formatDateRange(monday, sunday)}
          </AppText>
          <IconButton
            icon="forward"
            accessibilityLabel="Sonraki hafta"
            disabled={!history.canGoForward}
            onPress={history.nextWeek}
          />
        </View>
        <WeekDays days={week.days} selectedDate={selectedDay.date} onSelect={history.selectDay} />
        <WeekLegend />
      </Card>

      <AdherenceCard
        adherence={week.adherence}
        missed={week.missed}
        isCurrentWeek={!history.canGoForward}
      />

      <SectionHeader title={formatLongDate(selectedDay.day)} icon="calendar" />
      {selectedDay.doses.map((dose) => (
        <DoseCard key={`${dose.medication.id}_${dose.time}`} dose={dose} />
      ))}
      {selectedDay.doses.length === 0 && (
        <Card>
          <AppText center>Bu gün için doz yok.</AppText>
        </Card>
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  week: {
    paddingHorizontal: Spacing.three,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
