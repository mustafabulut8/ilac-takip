import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BigButton } from '@/components/big-button';
import { DoseCard } from '@/components/dose-card';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { useMedications } from '@/context/medications';
import { getTodayDoses } from '@/lib/doses';

const REFRESH_INTERVAL_MS = 30 * 1000;

export default function HomeScreen() {
  const { medications, doseLogs } = useMedications();
  const [now, setNow] = useState(() => new Date());

  // Bekleyen doz, ekran açıkken de "kaçırıldı" durumuna geçebilsin.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const doses = getTodayDoses(medications, doseLogs, now);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
        <BigButton label="İlaç Ekle" onPress={() => router.push('/ilac-ekle')} />
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
});
