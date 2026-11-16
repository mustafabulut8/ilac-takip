import { StyleSheet, Text } from 'react-native';

import { Colors, FontSize } from '@/constants/theme';

/** Alanın altındaki kırmızı hata metni; mesaj yoksa hiçbir şey çizmez. */
export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <Text style={styles.error} accessibilityLiveRegion="polite">
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  error: {
    color: Colors.danger,
    fontSize: FontSize.body,
    fontWeight: '700',
  },
});
