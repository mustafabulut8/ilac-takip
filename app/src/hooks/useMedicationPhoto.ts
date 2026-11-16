import { photoService } from '@/services';

/** Kayıtlı fotoğraf dosya adından ekranda gösterilecek adres. */
export function useMedicationPhoto(photoFile: string) {
  return photoService.photoUri(photoFile);
}
