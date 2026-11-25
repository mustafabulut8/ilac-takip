/**
 * KVKK Aydınlatma Metni taslağı (prototip). Gerçek kullanımdan önce veri sorumlusu
 * bilgileri tamamlanmalı ve hukuki olarak gözden geçirilmelidir (kararlar.md, 16. karar).
 */
export const KVKK_TEXT: { title: string; body: string }[] = [
  {
    title: 'Veri sorumlusu',
    body: 'Bu uygulama bir bitirme projesidir. Kişisel verileriniz, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında proje ekibi tarafından işlenir.',
  },
  {
    title: 'Hangi verileri işliyoruz?',
    body: 'Adınız, e-posta adresiniz, şifreniz (şifrelenmiş olarak) ve kullanım biçiminiz (sade, standart veya aile). İlaçlarınız, saatleri ve aldığınız dozlar şimdilik yalnızca bu telefonda tutulur.',
  },
  {
    title: 'Neden işliyoruz?',
    body: 'Hesabınızı açmak, size adınızla seslenmek, ilaç hatırlatmalarını göstermek ve izin verirseniz yakınınızın kaçırılan dozlardan haberdar olmasını sağlamak için.',
  },
  {
    title: 'Hukuki sebep',
    body: 'Hizmeti sunabilmek için gerekli olması ve açık rızanız. İlaç bilgileri sağlık verisi sayıldığı için yalnızca açık rızanızla işlenir.',
  },
  {
    title: 'Veriler nerede saklanır, kimlerle paylaşılır?',
    body: 'Hesap bilgileriniz Supabase hizmetinin Avrupa Birliği’ndeki sunucularında saklanır. Verileriniz satılmaz ve reklam için kullanılmaz. Yalnızca sizin bağladığınız aile üyeleri ilaç saatlerinizi ve doz durumunuzu görebilir.',
  },
  {
    title: 'Haklarınız',
    body: 'KVKK 11. madde uyarınca verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini isteme ve işlemeye itiraz etme hakkınız vardır. Hesabınızı uygulamadaki Ayarlar bölümünden silebileceksiniz.',
  },
];
