import * as ImagePicker from 'expo-image-picker';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };

type PhotoPickerCallbacks = {
  onPicked: (uri: string) => void;
  onError: (message: string) => void;
};

/** Kamerayla çekme ve galeriden seçme. Kullanıcı vazgeçerse hiçbir şey olmaz. */
export function usePhotoPicker({ onPicked, onError }: PhotoPickerCallbacks) {
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      onError('Kamera izni verilmedi. Galeriden seçebilir veya Ayarlar’dan izin verebilirsiniz.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!result.canceled) onPicked(result.assets[0].uri);
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!result.canceled) onPicked(result.assets[0].uri);
  };

  return { takePhoto, pickPhoto };
}
