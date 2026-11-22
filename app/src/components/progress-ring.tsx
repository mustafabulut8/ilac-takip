import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

import { AppText } from './app-text';

const SIZE = 88;
const STROKE = 10;

/** Yarım halkanın, verilen yüzde aralığındaki dönüş açısı. */
function rotation(percent: number, isSecondHalf: boolean) {
  const part = Math.min(Math.max(isSecondHalf ? percent - 50 : percent, 0), 50);
  return `${45 + (part / 50) * 180 - 180}deg`;
}

/** SVG paketi gerektirmeyen ilerleme halkası: iki yarım halka döndürülür. */
export function ProgressRing({ percent }: { percent: number }) {
  return (
    <View
      style={styles.ring}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Günün ilerlemesi"
      accessibilityValue={{ min: 0, max: 100, now: percent }}>
      <View style={styles.track} />
      <View style={[styles.half, styles.right]}>
        <View
          style={[
            styles.arc,
            styles.arcRight,
            { transform: [{ rotate: rotation(percent, false) }] },
          ]}
        />
      </View>
      <View style={[styles.half, styles.left]}>
        <View
          style={[styles.arc, styles.arcLeft, { transform: [{ rotate: rotation(percent, true) }] }]}
        />
      </View>
      <AppText weight="extrabold" maxFontSizeMultiplier={1.2}>
        %{percent}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    ...StyleSheet.absoluteFill,
    borderRadius: SIZE / 2,
    borderWidth: STROKE,
    borderColor: Colors.accentSoft,
  },
  half: {
    position: 'absolute',
    top: 0,
    width: SIZE / 2,
    height: SIZE,
    overflow: 'hidden',
  },
  right: {
    left: SIZE / 2,
  },
  left: {
    left: 0,
  },
  arc: {
    position: 'absolute',
    top: 0,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: STROKE,
    borderTopColor: Colors.accent,
    borderRightColor: Colors.accent,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  arcRight: {
    left: -SIZE / 2,
  },
  // Sol yarıda 180 derece ek dönüş gerekir: bu yarının kenarlıkları ters taraftadır.
  arcLeft: {
    left: 0,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.accent,
    borderLeftColor: Colors.accent,
  },
});
