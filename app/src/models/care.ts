import type { UserRole } from './profile';

/** Takip edilen kişinin ürettiği 6 haneli davet kodu; 24 saat geçerlidir. */
export type InviteCode = { code: string; expiresAt: string };

/** Bağlantının bu kullanıcıdan bakınca karşı tarafı (aile için yakını, yaşlı için aile üyesi). */
export type CareLink = {
  id: string;
  personId: string;
  name: string;
  role: UserRole;
  /** Aile üyesinin yazdığı yakınlık: "Annem", "Babam"… */
  relationLabel: string;
  createdAt: string;
};

export type RedeemInput = { code: string; relationLabel: string };
export type RedeemField = keyof RedeemInput;

/** Kodla bağlanınca dönen kişi. */
export type RedeemResult = { patientId: string; patientName: string };

export const MAX_RELATION_LABEL_LENGTH = 40;

/** Kodla Bağlan ekranındaki hazır yakınlıklar; "Diğer" seçilince serbest yazılır. */
export const RELATION_OPTIONS = ['Annem', 'Babam', 'Eşim'] as const;
