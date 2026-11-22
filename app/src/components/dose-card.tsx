import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Radius, Shadow, Spacing } from '@/constants/theme';
import type { Dose, DoseStatus } from '@/models';
import { useMedicationPhoto } from '@/hooks/useMedicationPhoto';

const STATUS: Record<DoseStatus, { label: string; color: string; textColor: string }> = {
  bekliyor: { label: 'Bekliyor', color: Colors.pending, textColor: Colors.textOnColor },
  alindi: { label: 'Alındı', color: Colors.success, textColor: Colors.textOnColor },
  kacirildi: { label: 'Kaçırıldı', color: Colors.danger, textColor: Colors.textOnColor },
  yarin: { label: 'Yarın başlıyor', color: Colors.accent, textColor: Colors.textOnAccent },
};

export function DoseCard({ dose, onPress }: { dose: Dose; onPress: () => void }) {
  const status = STATUS[dose.status];
  const photoUri = useMedicationPhoto(dose.medication.photoFile);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${dose.medication.name}, saat ${dose.time}, ${status.label}`}
      disabled={dose.status === 'yarin'}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Image
        source={photoUri}
        style={styles.photo}
        contentFit="cover"
        accessibilityLabel={`${dose.medication.name} fotoğrafı`}
      />
      <View style={styles.details}>
        <Text style={styles.name}>{dose.medication.name}</Text>
        <Text style={styles.time}>{dose.time}</Text>
        <Text style={[styles.status, { backgroundColor: status.color, color: status.textColor }]}>
          {status.label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.card,
    backgroundColor: Colors.card,
    boxShadow: Shadow.card,
  },
  pressed: {
    opacity: 0.7,
  },
  photo: {
    width: 110,
    height: 110,
    borderRadius: Spacing.two,
    backgroundColor: Colors.surface,
  },
  details: {
    flex: 1,
    gap: Spacing.one,
    alignItems: 'flex-start',
  },
  name: {
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '700',
  },
  time: {
    color: Colors.text,
    fontSize: FontSize.body,
  },
  status: {
    fontSize: FontSize.small,
    fontWeight: '700',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
});
