import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { getMedicationForm, type Dose, type Medication } from '@/models';

import { AppText } from './app-text';
import { Card } from './card';
import { Icon } from './icon';
import { MedicationPhoto } from './medication-photo';
import { Pill } from './pill';
import { PrimaryButton } from './primary-button';
import { takenTime } from './status-chip';

type DoseDoneProps = {
  medication: Medication;
  takenAt: string | undefined;
  /** Az önce onaylandıysa teşekkür, önceden onaylıysa bilgi metni. */
  justConfirmed: boolean;
  nextDose: Dose | undefined;
  onHome: () => void;
};

/** Doz onaylandıktan sonraki ekran. */
export function DoseDone({ medication, takenAt, justConfirmed, nextDose, onHome }: DoseDoneProps) {
  const insets = useSafeAreaInsets();
  const form = getMedicationForm(medication.form);
  const stockLabel = form.stockLabel(medication.stock);
  const time = takenTime(takenAt);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <View style={styles.glow}>
          <View style={styles.circle}>
            <Icon name="check" size={64} color={Colors.textOnColor} />
          </View>
        </View>
        <View accessibilityLiveRegion="polite" style={styles.texts}>
          <AppText size="title" weight="bold" center accessibilityRole="header">
            {justConfirmed ? form.confirmedMessage() : form.alreadyConfirmedMessage()}
          </AppText>
          <AppText color={Colors.textSecondary} center>
            Dozunuz kaydedildi.
          </AppText>
        </View>

        <Card style={styles.card}>
          <View style={styles.row}>
            <AppText size="small" weight="bold" color={Colors.textSecondary}>
              Kayıt özeti
            </AppText>
            <Pill
              label="Tamamlandı"
              icon="check"
              color={Colors.success}
              background={Colors.successSoft}
              align="center"
            />
          </View>
          <View style={styles.medication}>
            <MedicationPhoto medication={medication} />
            <View style={styles.flex}>
              <AppText size="subtitle" weight="bold">
                {medication.name}
              </AppText>
              <AppText color={Colors.textSecondary}>{medication.dose}</AppText>
              {time !== '' && <AppText weight="semibold">Kayıt saati: {time}</AppText>}
              {stockLabel && <AppText weight="semibold">{stockLabel}</AppText>}
            </View>
          </View>
        </Card>

        <Card style={[styles.card, styles.medication]}>
          <Icon name="clock" size={32} color={Colors.primary} />
          <View style={styles.flex}>
            <AppText weight="bold">
              {nextDose ? `Sıradaki ilacınız ${nextDose.time}` : 'Bugün bekleyen ilacınız yok'}
            </AppText>
            {nextDose && (
              <AppText color={Colors.textSecondary}>
                {[nextDose.medication.name, nextDose.medication.dose].filter(Boolean).join(' · ')}
              </AppText>
            )}
          </View>
        </Card>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.three }]}>
        <PrimaryButton label="Ana sayfaya dön" icon="home" onPress={onHome} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.screen,
    padding: Spacing.screen,
  },
  glow: {
    width: 168,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.successSoft,
  },
  circle: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.success,
  },
  texts: {
    gap: Spacing.two,
  },
  card: {
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  medication: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  footer: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.three,
  },
});
