import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { HEALTH_CONSENT_VERSION } from '@/constants/health-consent';
import type { UserRole } from '@/models';
import {
  consentService,
  realtimeMedicationChanges,
  syncService,
  type ConsentService,
  type ConsentState,
  type SyncService,
} from '@/services';
import { logger } from '@/utils/logger';
import type { ConsentStep } from '@/utils/routes';

/** Sağlayıcının kullandığı servis metotları; testte sahtesi verilir. */
export type ConsentServices = {
  consent: Pick<ConsentService, 'current' | 'grant' | 'decline' | 'withdraw'>;
  sync: Pick<SyncService, 'setOwner' | 'start' | 'run' | 'uploadAll'>;
  changes: { subscribe(ownerId: string, onChange: () => void): () => void };
};

type ConsentContextValue = {
  /** `null`: henüz okunmadı veya oturum yok. */
  status: ConsentStep;
  /** Rızanın verildiği veya geri alındığı an. */
  at: string | null;
  grant: () => Promise<void>;
  decline: () => Promise<void>;
  withdraw: () => Promise<void>;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

const DEFAULT_SERVICES: ConsentServices = {
  consent: consentService,
  sync: syncService,
  changes: realtimeMedicationChanges,
};

/** Kendi ilaçları olan roller; aile rolü yakınının verisini doğrudan sunucudan okur. */
const OWNS_MEDICATIONS: readonly UserRole[] = ['sade', 'standart'];

/**
 * Sağlık verisi rızasının durumu ve eşitlemenin açılıp kapanması. Rıza varsa eşitleme
 * açılır, hemen çalışır ve sunucudaki değişiklikler canlı dinlenir. İş kuralı
 * `ConsentService` ve `SyncService`'tedir.
 */
export function ConsentProvider({
  profile,
  children,
  services = DEFAULT_SERVICES,
}: {
  profile: { id: string; role: UserRole } | null;
  children: ReactNode;
  services?: ConsentServices;
}) {
  const userId = profile && OWNS_MEDICATIONS.includes(profile.role) ? profile.id : null;
  // Durum kimliğiyle saklanır: hesap değişince eskisinin durumu kendiliğinden yok sayılır.
  const [state, setState] = useState<(ConsentState & { userId: string }) | null>(null);
  const current = state && state.userId === userId ? state : null;
  const status: ConsentStep = current?.status ?? null;

  const refresh = async (id: string) => {
    const next = await services.consent.current(id);
    setState({ ...next, userId: id });
  };

  useEffect(() => {
    services.sync.setOwner(userId);
    if (!userId) return;
    let active = true;
    services.consent
      .current(userId)
      .then((next) => active && setState({ ...next, userId }))
      .catch((error) => logger.warn('Rıza durumu okunamadı:', error));
    return () => {
      active = false;
    };
  }, [userId, services]);

  // Rıza varken eşitleme açık ve sunucudaki değişiklikler dinleniyor.
  useEffect(() => {
    if (!userId || status !== 'granted') return;
    services.sync.start();
    void services.sync.run();
    return services.changes.subscribe(userId, () => void services.sync.run());
  }, [userId, status, services]);

  const requireUser = () => {
    if (!userId) throw new Error('Rıza için oturum açmış sade veya standart kullanıcı gerekir.');
    return userId;
  };

  // İşlemden sonra durum servisten okunur (an, servisin saatinden gelir).
  const grant = async () => {
    const id = requireUser();
    await services.consent.grant(id, HEALTH_CONSENT_VERSION);
    await refresh(id);
    // İlk yükleme: telefondaki ilaçlar ve doz geçmişi kuyruğa girer ve gönderilir.
    void services.sync.uploadAll();
  };

  const decline = async () => {
    const id = requireUser();
    await services.consent.decline(id);
    await refresh(id);
  };

  const withdraw = async () => {
    const id = requireUser();
    await services.consent.withdraw(id);
    await refresh(id);
  };

  return (
    <ConsentContext.Provider value={{ status, at: current?.at ?? null, grant, decline, withdraw }}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const value = useContext(ConsentContext);
  if (!value) throw new Error('useConsent, ConsentProvider içinde kullanılmalıdır.');
  return value;
}
