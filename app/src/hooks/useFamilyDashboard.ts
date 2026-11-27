import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import type { CareLink } from '@/models';
import { familyDashboard, realtimeMedicationChanges, type FamilySummary } from '@/services';
import { logger } from '@/utils/logger';

import { useCareLinks } from './useCareLinks';

export type FamilyPerson = {
  link: CareLink;
  /** `null`: yükleniyor; `'error'`: alınamadı. */
  summary: FamilySummary | 'error' | null;
};

/**
 * Aile Paneli: her bağlı yakın için bugünün özeti. Sunucuda bir ilaç veya doz değişince
 * (Realtime), uygulama öne gelince ve ekrana dönülünce yeniden okunur.
 */
export function useFamilyDashboard() {
  const care = useCareLinks();
  const { links, reload } = care;
  const [summaries, setSummaries] = useState<Record<string, FamilySummary | 'error'>>({});
  // Her artış özetleri yeniden ister.
  const [version, setVersion] = useState(0);
  const refreshSummaries = () => setVersion((current) => current + 1);

  useEffect(() => {
    if (!links) return;
    let active = true;
    Promise.all(
      links.map((link) =>
        familyDashboard
          .summaryOf(link.personId)
          .then((summary): [string, FamilySummary | 'error'] => [link.personId, summary])
          .catch((error): [string, 'error'] => {
            logger.warn('Yakının özeti alınamadı:', error);
            return [link.personId, 'error'];
          }),
      ),
    ).then((entries) => active && setSummaries(Object.fromEntries(entries)));
    return () => {
      active = false;
    };
  }, [links, version]);

  useEffect(() => {
    if (!links) return;
    const stops = links.map((link) =>
      realtimeMedicationChanges.subscribe(link.personId, refreshSummaries),
    );
    return () => stops.forEach((stop) => stop());
  }, [links]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshSummaries();
    });
    return () => subscription.remove();
  }, []);

  // Sihirbazdan veya yönetim ekranından dönünce bağlantılar ve özetler yeniden okunur.
  useFocusEffect(useCallback(() => reload(), [reload]));

  const people: FamilyPerson[] | null =
    links?.map((link) => ({ link, summary: summaries[link.personId] ?? null })) ?? null;

  return { people, error: care.error };
}
