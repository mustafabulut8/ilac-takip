import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

import { AppText } from './app-text';
import { Icon } from './icon';
import { PrimaryButton } from './primary-button';

/** Aile tarafında ekleme ve düzenleme çevrimdışı yapılamaz (çakışma riski). */
export const OFFLINE_MESSAGE = 'İnternet bağlantısı gerekiyor';

export function NeedsInternet() {
  return (
    <SafeAreaView style={styles.container}>
      <Icon name="warning" size={56} color={Colors.pending} />
      <AppText size="title" weight="bold" center>
        {OFFLINE_MESSAGE}
      </AppText>
      <AppText center color={Colors.textSecondary}>
        Yakınınızın ilaçlarını değiştirmek için internete bağlanın.
      </AppText>
      <PrimaryButton label="Geri dön" onPress={() => router.back()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: Spacing.four,
    padding: Spacing.screen,
    backgroundColor: Colors.background,
  },
});
