import { photoService } from '@/services';

/** Kayıtlı fotoğraf dosya adından ekranda gösterilecek adres; fotoğraf yoksa null. */
export function useMedicationPhoto(photoFile: string): string | null {
  return photoFile ? photoService.photoUri(photoFile) : null;
}
