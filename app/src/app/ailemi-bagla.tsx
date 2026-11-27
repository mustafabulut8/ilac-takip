import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { FieldError } from '@/components/form/field-error';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { SecondaryButton } from '@/components/secondary-button';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useCareLinks } from '@/hooks/useCareLinks';
import { useConsent } from '@/hooks/useConsent';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { useInviteCode } from '@/hooks/useInviteCode';
import type { CareLink } from '@/models';
import { formatInviteCode } from '@/utils/invite-code';

/** Kod yokken: aile bağlamak için önce sağlık verisi rızası gerekir (ADR-021). */
function ConsentRequired() {
  return (
    <Card style={styles.card}>
      <AppText weight="bold">Yakınınızı bağlamak için sağlık verisi rızası gerekir.</AppText>
      <AppText color={Colors.textSecondary}>
        Bağladığınız yakınınız ilaçlarınızı görebilir ve ekleyebilir. Bunun için ilaç bilgilerinizin
        hesabınızda saklanmasına izin vermeniz gerekir.
      </AppText>
      <PrimaryButton
        label="Rıza ekranını aç"
        onPress={() => router.push('/saglik-verisi-rizasi')}
      />
    </Card>
  );
}

/** Büyük kod, geçerlilik, paylaş ve yeni kod. */
function InviteCodeCard() {
  const invite = useInviteCode(true);
  const formatted = invite.code ? formatInviteCode(invite.code) : '— — —';

  const share = () =>
    Share.share({
      message: `İlaç Takip uygulamasında beni bağlamak için davet kodum: ${formatted}. Kod 24 saat geçerlidir.`,
    });

  return (
    <Card style={styles.card}>
      <AppText center color={Colors.textSecondary}>
        Bu kodu yakınınıza söyleyin veya gönderin.
      </AppText>
      <AppText
        size="huge"
        weight="bold"
        center
        accessibilityLabel={
          invite.code ? `Davet kodu ${invite.code.split('').join(' ')}` : 'Kod hazırlanıyor'
        }>
        {formatted}
      </AppText>
      <AppText center weight="semibold">
        Kod 24 saat geçerlidir
      </AppText>
      <FieldError message={invite.error} />
      <PrimaryButton
        label="Kodu paylaş"
        icon="share"
        onPress={share}
        disabled={!invite.code || invite.busy}
      />
      <SecondaryButton label="Yeni kod al" onPress={invite.renew} disabled={invite.busy} />
    </Card>
  );
}

/** Bağlı aile üyeleri ve onaylı "Bağlantıyı kaldır". */
function LinkedFamily() {
  const care = useCareLinks();
  const removal = useFormSubmit();
  const [removing, setRemoving] = useState<CareLink | null>(null);

  const onRemove = async () => {
    const link = removing;
    if (link && (await removal.submit(() => care.remove(link.id)))) setRemoving(null);
  };

  return (
    <View style={styles.section}>
      <AppText weight="bold" accessibilityRole="header">
        Bağlı yakınlarım
      </AppText>
      {care.error && <FieldError message={care.error} />}
      {care.links?.length === 0 && (
        <AppText color={Colors.textSecondary}>Henüz bağlı yakınınız yok.</AppText>
      )}
      {care.links?.map((link) => (
        <Card key={link.id} style={styles.card}>
          <AppText size="subtitle" weight="bold">
            {link.name}
          </AppText>
          <SecondaryButton
            label="Bağlantıyı kaldır"
            accessibilityLabel={`${link.name} bağlantısını kaldır`}
            compact
            onPress={() => setRemoving(link)}
          />
        </Card>
      ))}
      <ConfirmDialog
        visible={!!removing}
        icon="family"
        title="Bağlantıyı kaldırmak istiyor musunuz?"
        message={`${removing?.name ?? ''} artık ilaçlarınızı göremez ve ekleyemez. İsterseniz sonra yeni kodla yeniden bağlanabilirsiniz.`}
        confirmLabel="Bağlantıyı kaldır"
        onConfirm={onRemove}
        onCancel={() => setRemoving(null)}
        busy={removal.busy}
        error={removal.error}
      />
    </View>
  );
}

/** Ailemi Bağla (Stitch 16): takip edilen kişi davet kodu üretir ve bağlıları yönetir. */
export default function ConnectFamilyScreen() {
  const insets = useSafeAreaInsets();
  const { homeRoute } = useAuth();
  const { status } = useConsent();
  const granted = status === 'granted';

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Ailemi bağla"
        onBack={() => (router.canGoBack() ? router.back() : router.replace(homeRoute))}
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}>
        {granted ? (
          <>
            <InviteCodeCard />
            <LinkedFamily />
          </>
        ) : (
          <ConsentRequired />
        )}
        <AppText color={Colors.textSecondary}>
          Kodu yalnızca güvendiğiniz yakınınıza verin. Bağladığınız kişi ilaçlarınızı ve hangi dozu
          aldığınızı görür; başka hiç kimse göremez.
        </AppText>
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
  card: {
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.three,
  },
});
