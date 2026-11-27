import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Colors, Radius } from '@/constants/theme';
import { useMedicationPhoto } from '@/hooks/useMedicationPhoto';
import { getMedicationForm, type Medication } from '@/models';

import { Icon } from './icon';

type MedicationPhotoProps = {
  medication: Pick<Medication, 'name' | 'photoFile' | 'form'> &
    Partial<Pick<Medication, 'photoPath'>>;
  size?: number;
  badgeSize?: number;
};

/** Kullanıcının çektiği ilaç fotoğrafı ve form rozeti; fotoğraf yoksa form ikonu. */
export function MedicationPhoto({ medication, size = 72, badgeSize = 24 }: MedicationPhotoProps) {
  const uri = useMedicationPhoto(medication.photoFile, medication.photoPath);
  const { kind } = getMedicationForm(medication.form);
  const shape = { width: size, height: size };

  if (!uri) {
    return (
      <View style={[styles.photo, styles.placeholder, shape]}>
        <Icon name={kind} size={Math.round(size * 0.5)} color={Colors.primary} />
      </View>
    );
  }
  return (
    <View style={shape}>
      <Image
        source={uri}
        style={[styles.photo, shape]}
        contentFit="cover"
        accessibilityLabel={`${medication.name} fotoğrafı`}
      />
      <View style={[styles.badge, { width: badgeSize, height: badgeSize }]}>
        <Icon name={kind} size={Math.round(badgeSize * 0.6)} color={Colors.textOnColor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    borderRadius: Radius.button,
    backgroundColor: Colors.surface,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySoft,
  },
  badge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Colors.card,
    backgroundColor: Colors.primary,
  },
});
