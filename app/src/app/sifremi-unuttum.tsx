import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Banner } from '@/components/banner';
import { EmailField } from '@/components/form/email-field';
import { FieldError } from '@/components/form/field-error';
import { FormScreen } from '@/components/form-screen';
import { PrimaryButton } from '@/components/primary-button';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useFormSubmit } from '@/hooks/useFormSubmit';

/** Şifremi unuttum (Stitch'te yok; mevcut tasarım diliyle). */
export default function ForgotPasswordScreen() {
  const { eposta } = useLocalSearchParams<{ eposta?: string }>();
  const { resetPassword } = useAuth();
  const { busy, fieldErrors, error, submit, clearField } = useFormSubmit<'email'>();
  const [email, setEmail] = useState(eposta ?? '');
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    if (await submit(() => resetPassword(email))) setSent(true);
  };

  return (
    <FormScreen
      title="Şifremi unuttum"
      subtitle="E-posta adresinizi yazın. Şifrenizi yenilemeniz için size bir bağlantı göndereceğiz.">
      {sent ? (
        // Adresin kayıtlı olup olmadığı söylenmez; başkasının hesabı böyle sorgulanamaz.
        <Banner
          tone="success"
          icon="mail"
          title="E-posta gönderildi"
          detail="Bu adresle bir hesap varsa birkaç dakika içinde bağlantı gelir. Gelen kutunuza ve gereksiz klasörüne bakın."
        />
      ) : (
        <View style={styles.form}>
          <EmailField
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              clearField('email');
            }}
            error={fieldErrors.email}
          />
          <FieldError message={error} />
          <PrimaryButton
            label={busy ? 'Gönderiliyor…' : 'Bağlantı gönder'}
            icon="mail"
            onPress={onSubmit}
            disabled={busy}
          />
        </View>
      )}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.screen,
  },
});
