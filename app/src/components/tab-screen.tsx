import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

import { IconButton } from './icon-button';
import { NoticeBanner } from './notice-banner';
import { ScreenHeader } from './screen-header';

/** Alt menüdeki ekranların iskeleti: başlık, profil düğmesi, kaydırılan içerik. */
export function TabScreen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.container}>
      <ScreenHeader
        title={title}
        right={
          <IconButton
            icon="person"
            accessibilityLabel="Ayarlar"
            color={Colors.textOnColor}
            background={Colors.primary}
            onPress={() => router.push('/ayarlar')}
          />
        }
      />
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
