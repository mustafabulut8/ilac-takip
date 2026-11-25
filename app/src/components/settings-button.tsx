import { router } from 'expo-router';

import { Colors } from '@/constants/theme';

import { IconButton } from './icon-button';

/** Ana ekranların sağ üstündeki dişli; Ayarlar'ı açar. */
export function SettingsButton() {
  return (
    <IconButton
      icon="settings"
      accessibilityLabel="Ayarlar"
      color={Colors.textSecondary}
      background={Colors.card}
      onPress={() => router.push('/ayarlar')}
    />
  );
}
