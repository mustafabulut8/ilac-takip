import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Spacing } from '@/constants/theme';
import type { Dose, DoseStatus } from '@/lib/doses';
import { photoUri } from '@/lib/photos';

const STATUS: Record<DoseStatus, { label: string; color: string }> = {
  bekliyor: { label: 'Bekliyor', color: Colors.pending },
  alindi: { label: 'Alındı', color: Colors.success },
  kacirildi: { label: 'Kaçırıldı', color: Colors.danger },
};

export function DoseCard({ dose }: { dose: Dose }) {
  const status = STATUS[dose.status];

  return (
    <View style={styles.card}>
      <Image
        source={photoUri(dose.medication.photoFile)}
        style={styles.photo}
        contentFit="cover"
        accessibilityLabel={`${dose.medication.name} fotoğrafı`}
      />
      <View style={styles.details}>
        <Text style={styles.name}>{dose.medication.name}</Text>
        <Text style={styles.time}>{dose.time}</Text>
        <Text style={[styles.status, { backgroundColor: status.color }]}>{status.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Spacing.three,
    backgroundColor: Colors.background,
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
    color: Colors.textOnColor,
    fontSize: FontSize.small,
    fontWeight: '700',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
});
