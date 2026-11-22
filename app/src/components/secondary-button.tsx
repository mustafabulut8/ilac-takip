import { ButtonBase, type ButtonBaseProps } from './button-base';

type SecondaryButtonProps = Omit<ButtonBaseProps, 'variant'> & {
  variant?: Exclude<ButtonBaseProps['variant'], 'primary'>;
};

/** Ana eylem olmayan buton: çerçeveli, gri veya uyarı renginde. */
export function SecondaryButton({ variant = 'outline', ...props }: SecondaryButtonProps) {
  return <ButtonBase {...props} variant={variant} />;
}
