import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

import { NoticeBanner } from './notice-banner';
import { ScreenHeader } from './screen-header';
import { SettingsButton } from './settings-button';

/** Alt menüdeki ekranların iskeleti: başlık, Ayarlar dişlisi, kaydırılan içerik. */
export function TabScreen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.container}>
      <ScreenHeader title={title} right={<SettingsButton />} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <NoticeBanner />
        {children}
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
    gap: Spacing.screen,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
  },
});
