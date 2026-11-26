import { useMedications } from '@/hooks/useMedications';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';

import { Banner } from './banner';
import { SecondaryButton } from './secondary-button';

/**
 * Ana ekranların (Bugün ve Sade) üstündeki uyarılar: okunamayan kayıtlı veri ve kapalı
 * bildirim izni. İki ekranda aynıdır; tek yerde tutulur.
 */
export function HomeAlerts() {
  const { storageWarnings } = useMedications();
  const permission = useNotificationPermission();
  return (
    <>
      {storageWarnings.map((warning) => (
        <Banner key={warning} tone="danger" icon="warning" title={warning} />
      ))}
      {permission.missing && (
        <Banner
          tone="danger"
          icon="bell"
          title="Bildirim izni kapalı"
          detail="İzin vermezseniz ilaç saatinde hatırlatma alamazsınız.">
          <SecondaryButton
            label={permission.status === 'denied' ? 'Ayarları aç' : 'İzin ver'}
            variant="danger"
            onPress={permission.request}
          />
        </Banner>
      )}
    </>
  );
}
