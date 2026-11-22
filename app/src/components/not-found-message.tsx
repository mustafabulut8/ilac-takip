import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

import { AppText } from './app-text';
import { PrimaryButton } from './primary-button';

/** Silinmiş bir ilaca ait bildirim veya bağlantı açıldığında gösterilir. */
export function NotFoundMessage() {
  return (
    <SafeAreaView style={styles.container}>
      <AppText size="title" weight="bold" center>
        İlaç bulunamadı.
      </AppText>
      <PrimaryButton label="Ana sayfaya dön" onPress={() => router.dismissTo('/')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.four,
    padding: Spacing.screen,
    backgroundColor: Colors.background,
  },
});
