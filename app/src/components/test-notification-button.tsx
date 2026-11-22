import { View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTestNotification } from '@/hooks/useTestNotification';

import { AppText } from './app-text';
import { SecondaryButton } from './secondary-button';

/** Yalnızca geliştirme sürümünde: bildirimi denemek için. */
export function TestNotificationButton() {
  const { testMessage, sendTestNotification } = useTestNotification();
  return (
    <View style={{ gap: Spacing.two }}>
      <SecondaryButton
        label="1 dakika sonra test bildirimi"
        icon="bell"
        onPress={sendTestNotification}
      />
      {testMessage && (
        <AppText center accessibilityLiveRegion="polite">
          {testMessage}
        </AppText>
      )}
    </View>
  );
}
