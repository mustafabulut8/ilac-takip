import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { Colors } from '@/constants/theme';
import type { DayPeriod } from '@/utils/time';
import type { MedicationFormKind } from '@/models';

type PlatformSymbol = Extract<SymbolViewProps['name'], { ios?: unknown }>;

/** iOS'ta SF Symbols, Android'de Material Symbols. */
const ICONS = {
  home: { ios: 'house.fill', android: 'home' },
  pills: { ios: 'pills.fill', android: 'pill' },
  history: { ios: 'clock.arrow.circlepath', android: 'history' },
  person: { ios: 'person.fill', android: 'person' },
  settings: { ios: 'gearshape.fill', android: 'settings' },
  eye: { ios: 'eye.fill', android: 'visibility' },
  eyeSlash: { ios: 'eye.slash.fill', android: 'visibility_off' },
  checkCircle: { ios: 'checkmark.circle.fill', android: 'check_circle' },
  mail: { ios: 'envelope.fill', android: 'mail' },
  mode: { ios: 'rectangle.3.group.fill', android: 'view_quilt' },
  family: { ios: 'person.2.fill', android: 'group' },
  calendar: { ios: 'calendar', android: 'calendar_today' },
  clock: { ios: 'clock.fill', android: 'schedule' },
  plus: { ios: 'plus', android: 'add' },
  minus: { ios: 'minus', android: 'remove' },
  check: { ios: 'checkmark', android: 'check' },
  close: { ios: 'xmark', android: 'close' },
  back: { ios: 'chevron.left', android: 'chevron_left' },
  forward: { ios: 'chevron.right', android: 'chevron_right' },
  arrowRight: { ios: 'arrow.right', android: 'arrow_forward' },
  bell: { ios: 'bell.fill', android: 'notifications' },
  snooze: { ios: 'zzz', android: 'snooze' },
  meal: { ios: 'fork.knife', android: 'restaurant' },
  camera: { ios: 'camera.fill', android: 'photo_camera' },
  gallery: { ios: 'photo.fill', android: 'image' },
  edit: { ios: 'pencil', android: 'edit' },
  trash: { ios: 'trash.fill', android: 'delete' },
  more: { ios: 'ellipsis', android: 'more_horiz' },
  box: { ios: 'shippingbox.fill', android: 'package_2' },
  repeat: { ios: 'repeat', android: 'repeat' },
  hourglass: { ios: 'hourglass', android: 'hourglass' },
  warning: { ios: 'exclamationmark.triangle.fill', android: 'warning' },
  info: { ios: 'info.circle.fill', android: 'info' },
  textSize: { ios: 'textformat.size', android: 'format_size' },
  shield: { ios: 'lock.shield.fill', android: 'shield' },
  share: { ios: 'square.and.arrow.up', android: 'share' },
  link: { ios: 'link', android: 'link' },
  document: { ios: 'doc.text.fill', android: 'description' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout' },
  morning: { ios: 'sunrise.fill', android: 'wb_twilight' },
  noon: { ios: 'sun.max.fill', android: 'light_mode' },
  evening: { ios: 'moon.fill', android: 'dark_mode' },
  tablet: { ios: 'pills.fill', android: 'pill' },
  capsule: { ios: 'capsule.lefthalf.filled', android: 'pill' },
  syrup: { ios: 'cross.vial.fill', android: 'medication_liquid' },
  drops: { ios: 'drop.fill', android: 'water_drop' },
  cream: { ios: 'hand.point.up.left.fill', android: 'touch_app' },
  spray: { ios: 'humidity.fill', android: 'airwave' },
  injection: { ios: 'syringe.fill', android: 'syringe' },
  sachet: { ios: 'bag.fill', android: 'shopping_bag' },
  patch: { ios: 'bandage.fill', android: 'healing' },
  other: { ios: 'ellipsis.circle.fill', android: 'more_horiz' },
} satisfies Record<string, PlatformSymbol> & Record<MedicationFormKind | DayPeriod, PlatformSymbol>;

export type IconName = keyof typeof ICONS;

/** Süs amaçlı ikon; anlamı yanındaki yazı taşır, ekran okuyucu okumaz. */
export function Icon({
  name,
  size = 24,
  color = Colors.text,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <SymbolView
      name={ICONS[name]}
      size={size}
      tintColor={color}
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
