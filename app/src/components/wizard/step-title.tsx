import { AppText } from '@/components/app-text';
import { Colors } from '@/constants/theme';

/** Adımın sorusu ve isteğe bağlı açıklaması. */
export function StepTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <>
      <AppText size="title" weight="bold" accessibilityRole="header">
        {title}
      </AppText>
      {detail && <AppText color={Colors.textSecondary}>{detail}</AppText>}
    </>
  );
}
