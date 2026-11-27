import { useEffect, useState } from 'react';

import { photoService, photoUrls } from '@/services';
import { logger } from '@/utils/logger';

/** `expo-image` kaynağı: telefondaki dosya ya da sunucudaki fotoğrafın imzalı adresi. */
export type PhotoSource = string | { uri: string; cacheKey: string };

/**
 * İlaç fotoğrafının ekranda gösterilecek kaynağı; fotoğraf yoksa `null`.
 *
 * Önce telefondaki dosyaya bakılır. Dosya yoksa (ör. fotoğrafı aile ekledi) sunucudaki
 * yolun imzalı adresi alınır. `cacheKey` yol olduğu için imzalı adres yenilense de görüntü
 * yeniden indirilmez; diskte saklanır.
 */
export function useMedicationPhoto(photoFile: string, photoPath = ''): PhotoSource | null {
  const remotePath = photoFile ? '' : photoPath;
  // Yolu da tutulur: yol değişince eski adres gösterilmez.
  const [signed, setSigned] = useState<{ path: string; url: string } | null>(null);

  useEffect(() => {
    if (!remotePath) return;
    let active = true;
    photoUrls
      .urlFor(remotePath)
      .then((url) => active && setSigned({ path: remotePath, url }))
      .catch((error) => logger.warn('İlaç fotoğrafının adresi alınamadı:', error));
    return () => {
      active = false;
    };
  }, [remotePath]);

  if (photoFile) return photoService.photoUri(photoFile);
  if (remotePath && signed?.path === remotePath) return { uri: signed.url, cacheKey: remotePath };
  return null;
}
