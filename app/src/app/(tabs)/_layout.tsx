import { Tabs } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Colors, FontFamily, FontSize } from '@/constants/theme';

const BAR_HEIGHT = 80;

const icon = (name: IconName) =>
  function TabIcon({ focused }: { focused: boolean }) {
    return <Icon name={name} size={28} color={focused ? Colors.primary : Colors.textSecondary} />;
  };

/** Alt menü: günlük kullanılan üç ekran (kararlar.md, 7. karar). */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: { fontSize: FontSize.small, fontFamily: FontFamily.bold },
        tabBarAllowFontScaling: false,
        tabBarStyle: {
          height: BAR_HEIGHT + insets.bottom,
          paddingTop: 8,
          backgroundColor: Colors.card,
          borderTopColor: Colors.hairline,
        },
        sceneStyle: { backgroundColor: Colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Bugün', tabBarIcon: icon('home'), tabBarAccessibilityLabel: 'Bugün' }}
      />
      <Tabs.Screen
        name="ilaclarim"
        options={{
          title: 'İlaçlarım',
          tabBarIcon: icon('pills'),
          tabBarAccessibilityLabel: 'İlaçlarım',
        }}
      />
      <Tabs.Screen
        name="gecmis"
        options={{
          title: 'Geçmiş',
          tabBarIcon: icon('history'),
          tabBarAccessibilityLabel: 'Geçmiş',
        }}
      />
    </Tabs>
  );
}
