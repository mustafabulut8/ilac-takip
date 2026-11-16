import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigButton } from '@/components/big-button';
import { FieldError } from '@/components/form/field-error';
import { PhotoField } from '@/components/form/photo-field';
import { TextField } from '@/components/form/text-field';
import { TimesField } from '@/components/form/times-field';
import { Colors, Spacing } from '@/constants/theme';
import { userMessageOf } from '@/errors';
import { useFieldScroller } from '@/hooks/useFieldScroller';
import { useMedicationDraft } from '@/hooks/useMedicationDraft';
import { useMedications } from '@/hooks/useMedications';
import { usePhotoPicker } from '@/hooks/usePhotoPicker';
import type { NewMedication } from '@/models';
import type { MedicationField } from '@/validation/medication-input';

export default function AddMedicationScreen() {
  const { addMedication } = useMedications();
  const insets = useSafeAreaInsets();
  const { draft, errors, setText, setPhoto, setError, addTime, removeTime, check } =
    useMedicationDraft();
  const { scrollView, rememberPosition, scrollToField, scrollToEnd } =
    useFieldScroller<MedicationField>();
  const photoPicker = usePhotoPicker({
    onPicked: setPhoto,
    onError: (message) => setError('photo', message),
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (input: NewMedication) => {
    setIsSaving(true);
    try {
      await addMedication(input);
      router.back();
    } catch (error) {
      setSaveError(userMessageOf(error, 'İlaç kaydedilemedi.'));
      setIsSaving(false);
      scrollToEnd();
    }
  };

  const save = () => {
    setSaveError(null);
    const result = check();
    if (result.ok) submit(result.value);
    else scrollToField(result.firstInvalid);
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
        <TextField
          label="İlacın adı"
          value={draft.name}
          onChangeText={(text) => setText('name', text)}
          placeholder="Örnek: Aspirin"
          error={errors.name}
          onLayoutY={(y) => rememberPosition('name', y)}
        />
        <TextField
          label="Doz"
          value={draft.dose}
          onChangeText={(text) => setText('dose', text)}
          placeholder="Örnek: 1 tablet"
          error={errors.dose}
          onLayoutY={(y) => rememberPosition('dose', y)}
        />
        <PhotoField
          uri={draft.photo}
          error={errors.photo}
          onTakePhoto={photoPicker.takePhoto}
          onPickPhoto={photoPicker.pickPhoto}
          onLayoutY={(y) => rememberPosition('photo', y)}
        />
        <TimesField
          times={draft.times}
          error={errors.times}
          onAdd={addTime}
          onRemove={removeTime}
          onLayoutY={(y) => rememberPosition('times', y)}
        />
        <TextField
          label="Stok adedi"
          value={draft.stock}
          onChangeText={(text) => setText('stock', text)}
          keyboardType="number-pad"
          placeholder="Örnek: 30"
          error={errors.stock}
          onLayoutY={(y) => rememberPosition('stock', y)}
        />

        <FieldError message={saveError} />
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
});
