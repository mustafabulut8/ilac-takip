import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BigButton } from '@/components/big-button';
import { TimeStepper } from '@/components/time-stepper';
import { Colors, FontSize, MinButtonHeight, Spacing } from '@/constants/theme';
import { useMedications } from '@/context/medications';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export default function AddMedicationScreen() {
  const { addMedication } = useMedications();
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [stock, setStock] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [times, setTimes] = useState<string[]>([]);
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Kamera izni verilmedi. Galeriden seçebilir veya Ayarlar’dan izin verebilirsiniz.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const addTime = () => {
    const time = formatTime(hour, minute);
    if (!times.includes(time)) setTimes([...times, time].sort());
  };

  const save = async () => {
    const stockCount = Number(stock);
    if (!name.trim()) return setError('Lütfen ilacın adını yazın.');
    if (!dose.trim()) return setError('Lütfen dozu yazın. Örnek: 1 tablet');
    if (!photoUri) return setError('Lütfen ilacın fotoğrafını ekleyin.');
    if (times.length === 0) return setError('Lütfen en az bir saat ekleyin.');
    if (!stock.trim() || !Number.isInteger(stockCount) || stockCount < 0) {
      return setError('Lütfen stok adedini sayı olarak yazın.');
    }

    setError(null);
    setIsSaving(true);
    try {
      await addMedication({
        name: name.trim(),
        dose: dose.trim(),
        times,
        stock: stockCount,
        photoSourceUri: photoUri,
      });
      router.back();
    } catch {
      setError('İlaç kaydedilemedi. Lütfen tekrar deneyin.');
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>İlacın adı</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Örnek: Aspirin" placeholderTextColor={Colors.pending} />

        <Text style={styles.label}>Doz</Text>
        <TextInput style={styles.input} value={dose} onChangeText={setDose} placeholder="Örnek: 1 tablet" placeholderTextColor={Colors.pending} />

        <Text style={styles.label}>Fotoğraf</Text>
        {photoUri && <Image source={photoUri} style={styles.photo} contentFit="cover" accessibilityLabel="Seçilen ilaç fotoğrafı" />}
        <BigButton label="Fotoğraf Çek" onPress={takePhoto} />
        <BigButton label="Galeriden Seç" onPress={pickPhoto} />

        <Text style={styles.label}>Günlük saatler</Text>
        <TimeStepper hour={hour} minute={minute} onHourChange={setHour} onMinuteChange={setMinute} />
        <BigButton label={`${formatTime(hour, minute)} Saatini Ekle`} onPress={addTime} />
        {times.map((time) => (
          <View key={time} style={styles.timeRow}>
            <Text style={styles.time}>{time}</Text>
            <BigButton
              label={`${time} Kaldır`}
              color={Colors.danger}
              onPress={() => setTimes(times.filter((item) => item !== time))}
            />
          </View>
        ))}

        <Text style={styles.label}>Stok adedi</Text>
        <TextInput style={styles.input} value={stock} onChangeText={setStock} keyboardType="number-pad" placeholder="Örnek: 30" placeholderTextColor={Colors.pending} />

        {error && (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        )}
        <BigButton label={isSaving ? 'Kaydediliyor…' : 'Kaydet'} color={Colors.success} onPress={save} disabled={isSaving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    gap: Spacing.three,
    padding: Spacing.three,
    paddingBottom: Spacing.five * 2,
  },
  label: {
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '700',
    marginTop: Spacing.two,
  },
  input: {
    minHeight: MinButtonHeight,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    color: Colors.text,
    fontSize: FontSize.body,
  },
  photo: {
    width: '100%',
    height: 240,
    borderRadius: Spacing.three,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  time: {
    color: Colors.text,
    fontSize: FontSize.title,
    fontWeight: '700',
  },
  error: {
    color: Colors.danger,
    fontSize: FontSize.body,
    fontWeight: '700',
  },
});
