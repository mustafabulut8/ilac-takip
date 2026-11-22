import { Text, type TextProps } from 'react-native';

import { Colors, FontFamily, FontSize } from '@/constants/theme';

export type AppTextProps = TextProps & {
  size?: keyof typeof FontSize;
  weight?: keyof typeof FontFamily;
  color?: string;
  center?: boolean;
};

/** Uygulamanın tek yazı bileşeni: Inter, temadaki boylar, en az 16pt. */
export function AppText({
  size = 'body',
  weight = 'regular',
  color = Colors.text,
  center,
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      style={[
        { color, fontSize: FontSize[size], fontFamily: FontFamily[weight] },
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
}
