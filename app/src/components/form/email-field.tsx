import { TextField } from './text-field';

type EmailFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  hint?: string;
};

/** E-posta kutusu: e-posta klavyesi, büyük harf ve otomatik düzeltme kapalı. */
export function EmailField(props: EmailFieldProps) {
  return (
    <TextField
      label="E-posta adresiniz"
      placeholder="ornek@mail.com"
      {...props}
      inputProps={{
        keyboardType: 'email-address',
        autoCapitalize: 'none',
        autoCorrect: false,
        autoComplete: 'email',
        textContentType: 'emailAddress',
        maxLength: 254,
      }}
    />
  );
}
