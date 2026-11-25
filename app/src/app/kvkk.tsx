import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Pill } from '@/components/pill';
import { ScreenHeader } from '@/components/screen-header';
import { KVKK_TEXT } from '@/constants/kvkk';
import { Colors, Spacing } from '@/constants/theme';

/** KVKK Aydınlatma Metni; kayıttan ve Ayarlar > Gizlilik'ten açılır. */
export default function KvkkScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Aydınlatma Metni"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}>
        <Pill label="Taslak" />
        <AppText color={Colors.textSecondary}>
          Kişisel verilerinizin nasıl işlendiğini aşağıda kısaca anlatıyoruz.
        </AppText>
        {KVKK_TEXT.map(({ title, body }) => (
          <Card key={title} style={styles.section}>
            <AppText size="subtitle" weight="bold" accessibilityRole="header">
              {title}
            </AppText>
            <AppText>{body}</AppText>
          </Card>
        ))}
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
    gap: Spacing.three,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.two,
  },
  section: {
    gap: Spacing.two,
  },
});
