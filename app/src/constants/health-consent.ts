/**
 * Sağlık verisi açık rıza metni (KVKK, kararlar.md ADR-021). Metin değişirse sürüm de
 * değişir; sürüm rıza kaydına yazılır, böylece kişinin hangi metni kabul ettiği bilinir.
 */
export const HEALTH_CONSENT_VERSION = '2026-11-1';

export const HEALTH_CONSENT_TITLE = 'İlaç bilgileriniz hesabınızda saklansın mı?';

export const HEALTH_CONSENT_ITEMS: readonly { label: string; text: string }[] = [
  {
    label: 'Hangi bilgi',
    text: 'İlaçlarınızın adı, dozu, saatleri, kutudaki miktar, fotoğrafı ve hangi dozu ne zaman aldığınız.',
  },
  { label: 'Nerede', text: "Supabase sunucusunda, Avrupa Birliği'nde (İrlanda)." },
  {
    label: 'Kim görür',
    text: 'Yalnızca siz ve davet koduyla bağladığınız yakınlarınız. Başka hiç kimse göremez.',
  },
  {
    label: 'Neden',
    text: 'Telefonunuz değişse de ilaçlarınız kaybolmasın ve yakınlarınız ilaçlarınızı ekleyip dozlarınızı takip edebilsin.',
  },
  {
    label: 'Nasıl geri alırım',
    text: 'İstediğiniz zaman Ayarlar > "Sağlık verisi ve aile" bölümünden rızanızı geri alabilirsiniz. O zaman sunucudaki ilaç bilgileriniz silinir, yakınlarınızla bağlantınız kalkar; ilaçlarınız ve hatırlatmalarınız bu telefonda kalmaya devam eder.',
  },
];

export const HEALTH_CONSENT_FOOTER =
  'Kabul etmezseniz uygulama yalnızca bu telefonda çalışır; hatırlatmalar yine gelir.';

export const WITHDRAW_TITLE = 'Rızanızı geri almak istiyor musunuz?';
export const WITHDRAW_MESSAGE =
  'Sunucudaki ilaç bilgileriniz ve aile bağlantılarınız silinecek. Telefonunuzdaki ilaçlar ve hatırlatmalar devam eder.';
