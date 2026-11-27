import { useEffect, useState } from 'react';

import type { CareLink } from '@/models';
import { careService } from '@/services';
import { logger } from '@/utils/logger';

import { useAuth } from './useAuth';

/** Kullanıcının bağlantıları (aile için yakınları, yaşlı için aile üyeleri) ve kaldırma. */
export function useCareLinks() {
  const { profile } = useAuth();
  const userId = profile?.id ?? null;
  const [links, setLinks] = useState<CareLink[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Her artış listeyi yeniden ister.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    careService
      .links(userId)
      .then((next) => {
        if (!active) return;
        setLinks(next);
        setError(null);
      })
      .catch((caught) => {
        logger.warn('Bağlantılar alınamadı:', caught);
        if (active) setError('Bağlı yakınlar alınamadı. İnternet bağlantınızı kontrol edin.');
      });
    return () => {
      active = false;
    };
  }, [userId, version]);

  const reload = () => setVersion((current) => current + 1);

  /** Hata onay penceresinde gösterilsin diye fırlatılır. */
  const remove = async (id: string) => {
    await careService.removeLink(id);
    reload();
  };

  return { links, error, reload, remove };
}
