import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { type ComponentRef, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigButton } from '@/components/big-button';
import { TimeStepper } from '@/components/time-stepper';
import { Colors, FontSize, MinButtonHeight, Spacing } from '@/constants/theme';
import { useMedications } from '@/context/medications';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };

/** Ekrandaki sırayla: ilk eksik alana kaydırmak için kullanılır. */
const FIELDS = ['name', 'dose', 'photo', 'times', 'stock'] as const;
type Field = (typeof FIELDS)[number];
type FieldErrors = Partial<Record<Field, string>>;

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Text style={styles.error} accessibilityLiveRegion="polite">
      {message}
    </Text>
  );
}

export default function AddMedicationScreen() {
  const { addMedication } = useMedications();
  const insets = useSafeAreaInsets();
  const scrollView = useRef<ComponentRef<typeof ScrollView>>(null);
  const fieldPositions = useRef<Partial<Record<Field, number>>>({});
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [stock, setStock] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [times, setTimes] = useState<string[]>([]);
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const clearError = (field: Field) => setErrors((current) => ({ ...current, [field]: undefined }));

  const rememberPosition = (field: Field) => (y: number) => {
    fieldPositions.current[field] = y;
  };

  const choosePhoto = (uri: string) => {
    setPhotoUri(uri);
    clearError('photo');
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setErrors((current) => ({
        ...current,
        photo: 'Kamera izni verilmedi. Galeriden seçebilir veya Ayarlar’dan izin verebilirsiniz.',
      }));
      return;
    }
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!result.canceled) choosePhoto(result.assets[0].uri);
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!result.canceled) choosePhoto(result.assets[0].uri);
  };

  const addTime = () => {
    const time = formatTime(hour, minute);
    if (!times.includes(time)) setTimes([...times, time].sort());
    clearError('times');
  };

  const validate = () => {
    const stockCount = Number(stock);
    const found: FieldErrors = {};
    if (!name.trim()) found.name = 'Lütfen ilacın adını yazın.';
    if (!dose.trim()) found.dose = 'Lütfen dozu yazın. Örnek: 1 tablet';
    if (!photoUri) found.photo = 'Lütfen ilacın fotoğrafını ekleyin.';
    if (times.length === 0) {
      found.times = 'Lütfen saati seçip "Saatini Ekle" butonuna basın.';
    }
    if (!stock.trim() || !Number.isInteger(stockCount) || stockCount < 0) {
      found.stock = 'Lütfen stok adedini sayı olarak yazın.';
    }
    return found;
  };

  const save = async () => {
    const found = validate();
    setErrors(found);
    setSaveError(null);

    const firstInvalid = FIELDS.find((field) => found[field]);
    if (firstInvalid) {
      const y = fieldPositions.current[firstInvalid] ?? 0;
      scrollView.current?.scrollTo({ y: Math.max(y - Spacing.three, 0), animated: true });
      return;
    }

    setIsSaving(true);
    try {
      await addMedication({
        name: name.trim(),
        dose: dose.trim(),
        times,
        stock: Number(stock),
        photoSourceUri: photoUri!,
      });
      router.back();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'İlaç kaydedilemedi.');
      setIsSaving(false);
      scrollView.current?.scrollToEnd({ animated: true });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'android' ? 'height' : undefined}>
      <ScrollView
        ref={scrollView}
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        // iOS'ta klavye yüksekliği kadar kaydırma alanı ekler; boş yere dokununca klavye kapanır.
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <View style={styles.field} onLayout={(e) => rememberPosition('name')(e.nativeEvent.layout.y)}>
          <Text style={styles.label}>İlacın adı</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputInvalid]}
            value={name}
            onChangeText={(text) => {
              setName(text);
              clearError('name');
            }}
            placeholder="Örnek: Aspirin"
            placeholderTextColor={Colors.pending}
          />
          <FieldError message={errors.name} />
        </View>

        <View style={styles.field} onLayout={(e) => rememberPosition('dose')(e.nativeEvent.layout.y)}>
          <Text style={styles.label}>Doz</Text>
          <TextInput
            style={[styles.input, errors.dose && styles.inputInvalid]}
            value={dose}
            onChangeText={(text) => {
              setDose(text);
              clearError('dose');
            }}
            placeholder="Örnek: 1 tablet"
            placeholderTextColor={Colors.pending}
          />
          <FieldError message={errors.dose} />
        </View>

        <View style={styles.field} onLayout={(e) => rememberPosition('photo')(e.nativeEvent.layout.y)}>
          <Text style={styles.label}>Fotoğraf</Text>
          {photoUri && (
            <Image
              source={photoUri}
              style={styles.photo}
              contentFit="cover"
              accessibilityLabel="Seçilen ilaç fotoğrafı"
            />
          )}
          <BigButton label="Fotoğraf Çek" onPress={takePhoto} />
          <BigButton label="Galeriden Seç" onPress={pickPhoto} />
          <FieldError message={errors.photo} />
        </View>

        <View style={styles.field} onLayout={(e) => rememberPosition('times')(e.nativeEvent.layout.y)}>
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
          <FieldError message={errors.times} />
        </View>

        <View style={styles.field} onLayout={(e) => rememberPosition('stock')(e.nativeEvent.layout.y)}>
          <Text style={styles.label}>Stok adedi</Text>
          <TextInput
            style={[styles.input, errors.stock && styles.inputInvalid]}
            value={stock}
            onChangeText={(text) => {
              setStock(text);
              clearError('stock');
            }}
            keyboardType="number-pad"
            placeholder="Örnek: 30"
            placeholderTextColor={Colors.pending}
          />
          <FieldError message={errors.stock} />
        </View>

        <FieldError message={saveError ?? undefined} />
        <BigButton
          label={isSaving ? 'Kaydediliyor…' : 'Kaydet'}
          color={Colors.success}
          onPress={save}
          disabled={isSaving}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    gap: Spacing.four,
    padding: Spacing.three,
  },
  field: {
    gap: Spacing.two,
  },
  label: {
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '700',
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
  inputInvalid: {
    borderColor: Colors.danger,
    borderWidth: 3,
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
