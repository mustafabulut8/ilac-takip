import { useEffect, useState } from 'react';

import { networkStatus } from '@/services';

/** Telefon internete bağlı mı? Aile ekranları çevrimdışıyken ekleme ve düzenlemeyi kapatır. */
export function useOnline() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let active = true;
    networkStatus.isOnline().then((value) => active && setOnline(value));
    const stop = networkStatus.onChange(setOnline);
    return () => {
      active = false;
      stop();
    };
  }, []);

  return online;
}
