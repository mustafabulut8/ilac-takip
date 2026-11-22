import { router } from 'expo-router';
import { FlatList, Linking, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { SecondaryButton } from '@/components/secondary-button';
import { DoseCard } from '@/components/dose-card';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { useMedications } from '@/hooks/useMedications';
import { useNotice } from '@/hooks/useNotice';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { useTestNotification } from '@/hooks/useTestNotification';
import { useTodayDoses } from '@/hooks/useTodayDoses';

export default function HomeScreen() {
  const { medications, storageWarnings } = useMedications();
  const { doses, findNextPendingDose } = useTodayDoses();
  const permissionDenied = useNotificationPermission();
  const notice = useNotice();
  const { testMessage, sendTestNotification } = useTestNotification(findNextPendingDose);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {storageWarnings.length > 0 && (
        <View style={styles.warning} accessibilityLiveRegion="polite">
          {storageWarnings.map((warning) => (
            <Text key={warning} style={styles.warningText}>
              {warning}
            </Text>
          ))}
        </View>
      )}
      {permissionDenied && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>
            Bildirim izni kapalı. İzin vermezseniz ilaç saatinde hatırlatma alamazsınız.
          </Text>
          <SecondaryButton
            label="Ayarları Aç"
            variant="danger"
            onPress={() => Linking.openSettings()}
          />
        </View>
      )}
      {notice && (
        <Text style={styles.notice} accessibilityLiveRegion="polite">
          {notice}
        </Text>
      )}
      <FlatList
        style={styles.list}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.listContent}
        data={doses}
        keyExtractor={(dose) => `${dose.medication.id}_${dose.time}`}
        renderItem={({ item }) => (
          <DoseCard
            dose={item}
            onPress={() =>
              router.push({
                pathname: '/aldim/[id]',
                params: { id: item.medication.id, time: item.time, date: item.date },
              })
            }
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {medications.length === 0
              ? 'Henüz ilaç eklemediniz. Başlamak için "İlaç Ekle" butonuna basın.'
              : 'Bugün için planlanmış doz yok.'}
          </Text>
        }
      />
      <View style={styles.actions}>
        {testMessage && (
          <Text style={styles.message} accessibilityLiveRegion="polite">
            {testMessage}
          </Text>
        )}
        <PrimaryButton label="İlaç Ekle" onPress={() => router.push('/ilac-ekle')} />
        <SecondaryButton
          label="1 Dakika Sonra Test Bildirimi"
          variant="neutral"
          onPress={sendTestNotification}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: Spacing.three,
    padding: Spacing.three,
  },
  empty: {
    color: Colors.text,
    fontSize: FontSize.body,
    textAlign: 'center',
    marginTop: Spacing.five,
  },
  actions: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
  },
  message: {
    color: Colors.text,
    fontSize: FontSize.small,
    fontWeight: '700',
    textAlign: 'center',
  },
  notice: {
    backgroundColor: Colors.success,
    color: Colors.textOnColor,
    fontSize: FontSize.body,
    fontWeight: '700',
    textAlign: 'center',
    padding: Spacing.three,
  },
  warning: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderBottomWidth: 2,
    borderBottomColor: Colors.danger,
  },
  warningText: {
    color: Colors.danger,
    fontSize: FontSize.small,
    fontWeight: '700',
  },
});
