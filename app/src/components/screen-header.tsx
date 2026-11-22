import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

import { AppText } from './app-text';
import { IconButton } from './icon-button';

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  backIcon?: 'back' | 'close';
  right?: ReactNode;
};

/** 80pt başlık çubuğu: isteğe bağlı geri düğmesi, başlık ve sağ düğme. */
export function ScreenHeader({ title, onBack, backIcon = 'back', right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      {onBack && (
        <IconButton
          icon={backIcon}
          accessibilityLabel={backIcon === 'back' ? 'Geri' : 'Kapat'}
          onPress={onBack}
        />
      )}
      <AppText
        size="title"
        weight="bold"
        accessibilityRole="header"
        maxFontSizeMultiplier={1.4}
        style={styles.title}>
        {title}
      </AppText>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.screen,
    backgroundColor: Colors.background,
  },
  title: {
    flex: 1,
    paddingVertical: 20,
  },
});
