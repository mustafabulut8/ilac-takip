import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Banner } from '@/components/banner';
import { Card } from '@/components/card';
import { DoseCard } from '@/components/dose-card';
import { Icon } from '@/components/icon';
import { LowStockBanner } from '@/components/low-stock-banner';
import { ProgressCard } from '@/components/progress-card';
import { SecondaryButton } from '@/components/secondary-button';
import { SectionHeader } from '@/components/section-header';
import { TabScreen } from '@/components/tab-screen';
import { Colors, MinTouchSize, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useMedications } from '@/hooks/useMedications';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { useTodayDoses } from '@/hooks/useTodayDoses';
import type { Dose } from '@/models';
import { formatLongDate } from '@/utils/date';
import { DAY_PERIOD_LABELS, DAY_PERIOD_RANGES, greetingFor } from '@/utils/time';

function openDose({ medication, time, date }: Dose) {
  router.push({ pathname: '/aldim/[id]', params: { id: medication.id, time, date } });
}

export default function TodayScreen() {
  const { medications, storageWarnings } = useMedications();
  const { now, doses, groups, progress, nextDose } = useTodayDoses();
  const { profile } = useAuth();
  const permission = useNotificationPermission();

  return (
    <TabScreen title="Bugün">
      {storageWarnings.map((warning) => (
        <Banner key={warning} tone="danger" icon="warning" title={warning} />
      ))}
      {permission.missing && (
        <Banner
          tone="danger"
          icon="bell"
          title="Bildirim izni kapalı"
          detail="İzin vermezseniz ilaç saatinde hatırlatma alamazsınız.">
          <SecondaryButton
            label={permission.status === 'denied' ? 'Ayarları aç' : 'İzin ver'}
            variant="danger"
            onPress={permission.request}
          />
        </Banner>
      )}

      <View style={styles.greeting}>
        <AppText size="title" weight="bold">
          {greetingFor(now, profile?.name)}
        </AppText>
        <View style={styles.dateRow}>
          <View style={styles.date}>
            <Icon name="calendar" size={22} color={Colors.primary} />
            <AppText color={Colors.textSecondary}>{formatLongDate(now)}</AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="İlaç ekle"
            onPress={() => router.push('/ilac-ekle')}
            style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
            <Icon name="plus" size={20} color={Colors.textOnColor} />
            <AppText weight="bold" color={Colors.textOnColor}>
              İlaç ekle
            </AppText>
          </Pressable>
        </View>
      </View>

      {progress.total > 0 && <ProgressCard progress={progress} />}
      <LowStockBanner medications={medications} />

      {groups.map(({ period, doses: groupDoses }) => (
        <View key={period} style={styles.section}>
          <SectionHeader
            title={DAY_PERIOD_LABELS[period]}
            detail={DAY_PERIOD_RANGES[period]}
            icon={period}
          />
          {groupDoses.map((dose) => (
            <DoseCard
              key={`${dose.medication.id}_${dose.time}`}
              dose={dose}
              isNext={dose === nextDose}
              onPress={() => openDose(dose)}
            />
          ))}
        </View>
      ))}

      {doses.length === 0 && (
        <Card>
          <AppText center>
            {medications.length === 0
              ? 'Henüz ilaç eklemediniz. Başlamak için “İlaç ekle” düğmesine basın.'
              : 'Bugün için planlanmış doz yok.'}
          </AppText>
        </Card>
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  greeting: {
    gap: Spacing.two,
  },
  dateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  date: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  add: {
    minHeight: MinTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
  section: {
    gap: Spacing.three,
  },
});
