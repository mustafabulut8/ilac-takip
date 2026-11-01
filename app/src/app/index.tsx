import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { BigButton } from '@/components/big-button';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { useMedications } from '@/context/medications';

export default function HomeScreen() {
  const { medications } = useMedications();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Kayıtlı ilaç sayısı: {medications.length}</Text>
      <BigButton label="İlaç Ekle" onPress={() => router.push('/ilac-ekle')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  text: {
    color: Colors.text,
    fontSize: FontSize.body,
    textAlign: 'center',
  },
});
