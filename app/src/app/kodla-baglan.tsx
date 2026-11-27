import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Chip } from '@/components/chip-group';
import { FieldError } from '@/components/form/field-error';
import { TextField } from '@/components/form/text-field';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useRedeemCode } from '@/hooks/useRedeemCode';
import { MAX_RELATION_LABEL_LENGTH, RELATION_OPTIONS } from '@/models';
import { digitsOf, formatInviteCode } from '@/utils/invite-code';

const OTHER = 'Diğer';

/**
 * Kodla Bağlan (Stitch 17): aile üyesi, yakınının verdiği 6 haneli kodu ve yakınlığını
 * yazar. Bağlanınca Aile Paneli açılır. Hatalar Türkçe gösterilir.
 */
export default function RedeemCodeScreen() {
  const insets = useSafeAreaInsets();
  const { homeRoute } = useAuth();
  const form = useRedeemCode();
  const [code, setCode] = useState('');
  const [relation, setRelation] = useState<string | null>(null);
  const [otherLabel, setOtherLabel] = useState('');
  const relationLabel = relation === OTHER ? otherLabel : (relation ?? '');

  const leave = () => (router.canGoBack() ? router.back() : router.replace(homeRoute));
  const onConnect = async () => {
    if (await form.redeem({ code, relationLabel })) router.replace('/aile');
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Kodla bağlan" onBack={leave} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}>
        <AppText color={Colors.textSecondary}>
          Yakınınız uygulamada Ayarlar &gt; &quot;Ailemi bağla&quot; bölümünden 6 haneli bir kod
          alır. O kodu buraya yazın.
        </AppText>

        <TextField
          label="Davet kodu"
          value={formatInviteCode(code)}
          onChangeText={(text) => {
            setCode(digitsOf(text));
            form.clearField('code');
          }}
          placeholder="482 913"
          error={form.fieldErrors.code}
          inputProps={{ keyboardType: 'number-pad', maxLength: 7, autoComplete: 'one-time-code' }}
        />

        <View style={styles.section}>
          <AppText weight="bold">Size yakınlığı</AppText>
          <View style={styles.chips}>
            {[...RELATION_OPTIONS, OTHER].map((option) => (
              <Chip
                key={option}
                label={option}
                selected={relation === option}
                onPress={() => {
                  setRelation(option);
                  form.clearField('relationLabel');
                }}
              />
            ))}
          </View>
          {relation === OTHER && (
            <TextField
              label="Yakınlık"
              value={otherLabel}
              onChangeText={setOtherLabel}
              placeholder="Örneğin: Teyzem"
              inputProps={{ maxLength: MAX_RELATION_LABEL_LENGTH }}
            />
          )}
          <FieldError message={form.fieldErrors.relationLabel} />
        </View>

        <FieldError message={form.error} />
        <PrimaryButton label="Bağlan" icon="link" onPress={onConnect} disabled={form.busy} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.screen,
  },
  section: {
    gap: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
