import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, FlatList, Linking, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BigButton } from '@/components/big-button';
import { DoseCard } from '@/components/dose-card';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { useMedications } from '@/context/medications';
import { getTodayDoses } from '@/lib/doses';
import {
  hasNotificationPermission,
  requestNotificationPermission,
  scheduleTestNotification,
} from '@/lib/notifications';

const REFRESH_INTERVAL_MS = 30 * 1000;

export default function HomeScreen() {
  const { medications, doseLogs } = useMedications();
  const [now, setNow] = useState(() => new Date());
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  // Bekleyen doz, ekran açıkken de "kaçırıldı" durumuna geçebilsin.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    requestNotificationPermission().then((granted) => setPermissionDenied(!granted));

    // Kullanıcı Ayarlar'dan dönünce izin durumu ve saat güncellensin.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      setNow(new Date());
      hasNotificationPermission().then((granted) => setPermissionDenied(!granted));
    });
    return () => subscription.remove();
  }, []);

  const doses = getTodayDoses(medications, doseLogs, now);

  const sendTestNotification = async () => {
    const nextDose = getTodayDoses(medications, doseLogs, new Date()).find(
      (dose) => dose.status === 'bekliyor',
    );
    if (!nextDose) {
      setTestMessage('Test için bekleyen doz yok. Önce ilaç veya yeni bir saat ekleyin.');
      return;
    }
    try {
      await scheduleTestNotification(nextDose);
      setTestMessage(`${nextDose.medication.name} için bildirim 1 dakika sonra gelecek.`);
    } catch {
      setTestMessage('Test bildirimi planlanamadı. Bildirim iznini kontrol edin.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {permissionDenied && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>
            Bildirim izni kapalı. İzin vermezseniz ilaç saatinde hatırlatma alamazsınız.
          </Text>
          <BigButton label="Ayarları Aç" color={Colors.danger} onPress={() => Linking.openSettings()} />
        </View>
      )}
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={doses}
        keyExtractor={(dose) => `${dose.medication.id}_${dose.time}`}
        renderItem={({ item }) => <DoseCard dose={item} />}
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
        <BigButton label="İlaç Ekle" onPress={() => router.push('/ilac-ekle')} />
        <BigButton label="1 Dakika Sonra Test Bildirimi" color={Colors.pending} onPress={sendTestNotification} />
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
