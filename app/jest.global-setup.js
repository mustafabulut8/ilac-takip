/**
 * Testler her makinede ve CI'da aynı saat diliminde çalışır. Yaz/kış saati geçişi olan
 * bir dilim seçildi; böylece geçiş günleri de denenebilir (Türkiye 2016'dan beri geçiş
 * yapmıyor). Test içinden process.env.TZ değiştirmek Jest'te etkisizdir.
 */
module.exports = () => {
  process.env.TZ = 'Europe/Berlin';
};
