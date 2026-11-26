import { StyleSheet, View } from 'react-native';

import { Colors, Radius } from '@/constants/theme';

import { AppText } from './app-text';
import { Card } from './card';

/** Adın ilk harfi (Türkçe büyük harfle); ad yoksa boş. */
function initialOf(name?: string) {
  return name?.trim().charAt(0).toLocaleUpperCase('tr-TR') ?? '';
}

/** Ayarlar'ın üstündeki hesap kartı: baş harf, ad ve e-posta (Stitch 19). */
export function ProfileCard({ name, email }: { name?: string; email?: string }) {
  return (
    <Card style={styles.profile}>
      <View style={styles.avatar}>
        <AppText size="title" weight="bold" color={Colors.textOnColor}>
          {initialOf(name)}
        </AppText>
      </View>
      <View style={styles.texts}>
        <AppText size="subtitle" weight="bold">
          {name ?? 'Hesap'}
        </AppText>
        {/* E-posta kısaltılmaz; uzunsa alt satıra geçer (2. tur farkları). */}
        <AppText color={Colors.textSecondary}>{email ?? ''}</AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  texts: {
    flex: 1,
    gap: 6,
  },
});
