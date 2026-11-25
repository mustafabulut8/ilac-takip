import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { USER_ROLES, type UserRole } from '@/models';

import { AppText } from './app-text';
import { RoleOption } from './role-option';

/** Üç rol kartı; rol seçimi ve Ayarlar > Kullanım biçimi ekranlarında ortak. */
export function RolePicker({
  value,
  onChange,
}: {
  value: UserRole;
  onChange: (role: UserRole) => void;
}) {
  return (
    <View style={styles.list} accessibilityRole="radiogroup">
      <AppText size="subtitle" weight="semibold" accessibilityRole="header">
        Uygulamayı nasıl kullanacaksınız?
      </AppText>
      {USER_ROLES.map((role) => (
        <RoleOption
          key={role}
          role={role}
          selected={value === role}
          onPress={() => onChange(role)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.three,
  },
});
