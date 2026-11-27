import { Stack, useLocalSearchParams } from 'expo-router';

import { FamilyMemberProvider } from '@/context/family-member';

/** Aile üyesinin yakını için ekranlar; veri o kişinin sunucudaki listesinden gelir. */
export default function FamilyMemberLayout() {
  const { kisiId, ad } = useLocalSearchParams<{ kisiId: string; ad?: string }>();
  return (
    <FamilyMemberProvider patientId={kisiId} name={ad ?? ''}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="ilac-ekle" options={{ gestureEnabled: false }} />
        <Stack.Screen name="ilac-duzenle/[id]" options={{ gestureEnabled: false }} />
      </Stack>
    </FamilyMemberProvider>
  );
}
