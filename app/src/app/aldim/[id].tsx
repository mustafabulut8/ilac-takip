import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BigButton } from '@/components/big-button';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { useMedications } from '@/context/medications';
import { doseLogId, formatDate } from '@/lib/doses';
import { photoUri } from '@/lib/photos';

function goHome() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function TakeDoseScreen() {
  const { id, time, date = formatDate(new Date()) } = useLocalSearchParams<{
    id: string;
    time: string;
    date?: string;
  }>();
  const { isLoaded, medications, doseLogs, confirmDose } = useMedications();
  const isConfirming = useRef(false);
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoaded) return null;

  const medication = medications.find((item) => item.id === id);
  if (!medication || !time) {
    return (
      <SafeAreaView style={styles.message}>
        <Text style={styles.name}>İlaç bulunamadı.</Text>
        <BigButton label="Ana Ekrana Dön" onPress={goHome} />
      </SafeAreaView>
    );
  }

  const isTaken = doseLogs.some((log) => log.id === doseLogId(medication.id, date, time));

  const confirm = async () => {
    // Hızlı çift dokunuş stoğu iki kez düşürmesin.
    if (isConfirming.current) return;
    isConfirming.current = true;
    try {
      await confirmDose(medication.id, date, time);
      setJustConfirmed(true);
      setError(null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError('Kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      isConfirming.current = false;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.details}>
        <Image
          source={photoUri(medication.photoFile)}
          style={styles.photo}
          contentFit="contain"
          accessibilityLabel={`${medication.name} fotoğrafı`}
        />
        <Text style={styles.name} numberOfLines={2} adjustsFontSizeToFit>
          {medication.name}
        </Text>
        <Text style={styles.info}>
          {medication.dose} · Saat {time}
        </Text>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      {isTaken ? (
        <View style={styles.confirmed} accessibilityLiveRegion="polite">
          <Text style={styles.confirmedTitle}>
            {justConfirmed ? '✓ Aldınız, teşekkürler!' : '✓ Bu doz alındı'}
          </Text>
          <Text style={styles.info}>Kalan stok: {medication.stock}</Text>
          <BigButton label="Ana Ekrana Dön" onPress={goHome} />
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${medication.name} ilacını aldım`}
          onPress={confirm}
          style={({ pressed }) => [styles.takeButton, pressed && styles.takeButtonPressed]}>
          <Text style={styles.takeButtonLabel}>ALDIM</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Üst ve alt yarı eşit flex alır: ALDIM butonu ekranın yarısını kaplar.
  details: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.three,
  },
  photo: {
    flex: 1,
    width: '100%',
  },
  name: {
    color: Colors.text,
    fontSize: FontSize.title,
    fontWeight: '700',
    textAlign: 'center',
  },
  info: {
    color: Colors.text,
    fontSize: FontSize.body,
    textAlign: 'center',
  },
  error: {
    color: Colors.danger,
    fontSize: FontSize.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  takeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
  },
  takeButtonPressed: {
    opacity: 0.7,
  },
  takeButtonLabel: {
    color: Colors.textOnColor,
    fontSize: FontSize.huge * 1.5,
    fontWeight: '800',
  },
  confirmed: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  confirmedTitle: {
    color: Colors.success,
    fontSize: FontSize.title,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
});
