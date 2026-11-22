import { ButtonBase, type ButtonBaseProps } from './button-base';

/** Ekranın tek ana eylemi: koyu turkuaz zemin, beyaz yazı, 56pt. */
export function PrimaryButton(props: Omit<ButtonBaseProps, 'variant'>) {
  return <ButtonBase {...props} variant="primary" />;
}
