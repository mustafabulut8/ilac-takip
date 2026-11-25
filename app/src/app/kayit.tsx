import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ConsentCheckbox } from '@/components/form/consent-checkbox';
import { EmailField } from '@/components/form/email-field';
import { FieldError } from '@/components/form/field-error';
import { PasswordField } from '@/components/form/password-field';
import { TextField } from '@/components/form/text-field';
import { FormScreen } from '@/components/form-screen';
import { PrimaryButton } from '@/components/primary-button';
import { TextLink } from '@/components/text-link';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { isUserRole } from '@/models';
import type { SignUpField } from '@/validation/auth-input';

/** Kayıt ol (Stitch 10). Rol, önceki ekranda seçilir. */
export default function SignUpScreen() {
  const { rol } = useLocalSearchParams<{ rol?: string }>();
  const role = isUserRole(rol) ? rol : 'standart';
  const { signUp } = useAuth();
  const { busy, fieldErrors, error, submit, clearField } = useFormSubmit<SignUpField>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);

  // Başarılı kayıttan sonra yönlendirmeyi kök düzen yapar (Bildirim İzni ekranı).
  const onSubmit = () => submit(() => signUp({ name, email, password, role, consent }));

  return (
    <FormScreen
      title="Hesap oluştur"
      subtitle="Adınızı uygulamada size seslenmek ve ilaç hatırlatmalarınızı kişiselleştirmek için kullanacağız.">
      <View style={styles.form}>
        <TextField
          label="Adınız"
          hint="Gerekli"
          value={name}
          onChangeText={(text) => {
            setName(text);
            clearField('name');
          }}
          placeholder="Örn. Mustafa"
          error={fieldErrors.name}
          inputProps={{ autoComplete: 'given-name', textContentType: 'givenName', maxLength: 100 }}
        />
        <EmailField
          hint="Gerekli"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            clearField('email');
          }}
          error={fieldErrors.email}
        />
        <PasswordField
          isNew
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            clearField('password');
          }}
          placeholder="En az 8 karakter"
          error={fieldErrors.password}
        />
        <ConsentCheckbox
          checked={consent}
          onToggle={() => {
            setConsent((current) => !current);
            clearField('consent');
          }}
          onOpenText={() => router.push('/kvkk')}
          error={fieldErrors.consent}
        />
      </View>

      <View style={styles.actions}>
        <FieldError message={error ?? fieldErrors.role} />
        <PrimaryButton
          label={busy ? 'Hesap oluşturuluyor…' : 'Hesap oluştur'}
          icon="arrowRight"
          onPress={onSubmit}
          disabled={busy}
        />
        <TextLink
          prefix="Zaten hesabım var"
          label="Giriş yap"
          onPress={() => router.replace('/giris')}
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
