import * as ImagePicker from 'expo-image-picker';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };

/** Kullanıcı vazgeçmediyse ilk fotoğrafın adresini iletir. */
function pickedUri(result: ImagePicker.ImagePickerResult, onPicked: (uri: string) => void) {
  const uri = result.canceled ? undefined : result.assets[0]?.uri;
  if (uri) onPicked(uri);
}

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
    pickedUri(await ImagePicker.launchCameraAsync(PICKER_OPTIONS), onPicked);
  };

  const pickPhoto = async () => {
    pickedUri(await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS), onPicked);
  };

  return { takePhoto, pickPhoto };
}
