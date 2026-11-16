import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { BigButton } from '@/components/big-button';
import { Spacing } from '@/constants/theme';

import { FormField } from './form-field';

type PhotoFieldProps = {
  uri: string | null;
  error?: string;
  onTakePhoto: () => void;
  onPickPhoto: () => void;
  onLayoutY?: (y: number) => void;
};

/** Seçilen fotoğrafın önizlemesi ve kamera / galeri butonları. */
export function PhotoField({ uri, error, onTakePhoto, onPickPhoto, onLayoutY }: PhotoFieldProps) {
  return (
    <FormField label="Fotoğraf" error={error} onLayoutY={onLayoutY}>
      {uri && (
        <Image
          source={uri}
          style={styles.photo}
          contentFit="cover"
          accessibilityLabel="Seçilen ilaç fotoğrafı"
        />
      )}
      <BigButton label="Fotoğraf Çek" onPress={onTakePhoto} />
      <BigButton label="Galeriden Seç" onPress={onPickPhoto} />
    </FormField>
  );
}

const styles = StyleSheet.create({
  photo: {
    width: '100%',
    height: 240,
    borderRadius: Spacing.three,
  },
});
