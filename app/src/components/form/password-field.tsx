import { useState } from 'react';

import { IconButton } from '@/components/icon-button';
import { Colors } from '@/constants/theme';

import { TextField } from './text-field';

type PasswordFieldProps = {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  /** Yeni şifre mi (kayıt) yoksa kayıtlı şifre mi (giriş)? Otomatik doldurmayı belirler. */
  isNew?: boolean;
};

/** Gizli yazılan şifre kutusu; göz düğmesiyle yazılan görülebilir. */
export function PasswordField({ label = 'Şifre', isNew, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      label={label}
      {...props}
      inputProps={{
        secureTextEntry: !visible,
        autoCapitalize: 'none',
        autoCorrect: false,
        autoComplete: isNew ? 'new-password' : 'current-password',
        textContentType: isNew ? 'newPassword' : 'password',
        maxLength: 72,
      }}
      trailing={
        <IconButton
          icon={visible ? 'eyeSlash' : 'eye'}
          accessibilityLabel={visible ? 'Şifreyi gizle' : 'Şifreyi göster'}
          color={Colors.textSecondary}
          background="transparent"
          onPress={() => setVisible((current) => !current)}
        />
      }
    />
  );
}
