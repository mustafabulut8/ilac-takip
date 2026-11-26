import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmailField } from '@/components/form/email-field';
import { FieldError } from '@/components/form/field-error';
import { PasswordField } from '@/components/form/password-field';
import { FormScreen } from '@/components/form-screen';
import { PrimaryButton } from '@/components/primary-button';
import { TextLink } from '@/components/text-link';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import type { SignInField } from '@/models';

/** Giriş yap (Stitch 11). Başarılı girişten sonra kök düzen role göre ana ekranı açar. */
export default function SignInScreen() {
  const { signIn } = useAuth();
  const { busy, fieldErrors, error, submit, clearField } = useFormSubmit<SignInField>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <FormScreen title="Tekrar hoş geldiniz" subtitle="E-posta adresiniz ve şifrenizle giriş yapın.">
      <View style={styles.form}>
        <EmailField
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            clearField('email');
          }}
          error={fieldErrors.email}
        />
        <PasswordField
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            clearField('password');
          }}
          placeholder="Şifreniz"
          error={fieldErrors.password}
        />
        <TextLink
          label="Şifremi unuttum"
          align="flex-end"
          onPress={() => router.push({ pathname: '/sifremi-unuttum', params: { eposta: email } })}
        />
      </View>

      <View style={styles.actions}>
        <FieldError message={error} />
        <PrimaryButton
          label={busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
          icon="arrowRight"
          onPress={() => submit(() => signIn(email, password))}
          disabled={busy}
        />
        <TextLink
          prefix="Hesabınız yok mu?"
          label="Hesap oluştur"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/hos-geldiniz'))}
        />
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.screen,
  },
  actions: {
    gap: Spacing.three,
  },
});
