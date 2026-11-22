import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Colors, Radius } from '@/constants/theme';
import { useMedicationPhoto } from '@/hooks/useMedicationPhoto';
import { getMedicationForm } from '@/models';
import type { MedicationDraft } from '@/validation/medication-input';

/** Taslaktaki fotoğraf: yeni seçilen varsa o, yoksa kayıtlı olan; hiç yoksa ikon. */
export function DraftPhoto({ draft, height }: { draft: MedicationDraft; height: number }) {
  const savedUri = useMedicationPhoto(draft.photoFile);
  const uri = draft.photo ?? savedUri;
  const isLarge = height > 150;
  const shape = { height, width: isLarge ? ('100%' as const) : height };

  if (!uri) {
    const icon = draft.form ? getMedicationForm(draft.form).kind : 'camera';
    return (
      <View style={[styles.photo, styles.placeholder, shape]}>
        <Icon name={icon} size={isLarge ? 72 : height / 2} color={Colors.primary} />
      </View>
    );
  }
  return (
    <Image
      source={uri}
      style={[styles.photo, shape]}
      contentFit="cover"
      accessibilityLabel="İlacın fotoğrafı"
    />
  );
}

const styles = StyleSheet.create({
  photo: {
    borderRadius: Radius.card,
    backgroundColor: Colors.surface,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: Colors.accent,
    backgroundColor: Colors.primarySoft,
  },
});
