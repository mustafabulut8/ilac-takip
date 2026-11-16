import { type ComponentRef, useRef } from 'react';
import type { ScrollView } from 'react-native';

import { Spacing } from '@/constants/theme';

/** Form alanlarının konumunu hatırlar; hatalı alana veya sona kaydırır. */
export function useFieldScroller<Field extends string>() {
  const scrollView = useRef<ComponentRef<typeof ScrollView>>(null);
  const positions = useRef<Partial<Record<Field, number>>>({});

  const rememberPosition = (field: Field, y: number) => {
    positions.current[field] = y;
  };

  const scrollToField = (field: Field) => {
    const y = positions.current[field] ?? 0;
    scrollView.current?.scrollTo({ y: Math.max(y - Spacing.three, 0), animated: true });
  };

  const scrollToEnd = () => scrollView.current?.scrollToEnd({ animated: true });

  return { scrollView, rememberPosition, scrollToField, scrollToEnd };
}
