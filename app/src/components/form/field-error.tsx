import { AppText } from '@/components/app-text';
import { Colors } from '@/constants/theme';

/** Kırmızı hata metni; mesaj yoksa hiçbir şey çizmez. */
export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <AppText weight="bold" color={Colors.danger} accessibilityLiveRegion="polite">
      {message}
    </AppText>
  );
}
