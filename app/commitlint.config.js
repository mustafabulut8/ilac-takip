/**
 * Commit mesajı standardı: Conventional Commits (CLAUDE.md, "Commit standardı").
 * Biçim: `tür(kapsam): kısa Türkçe açıklama`. Açıklama Türkçe olduğu için büyük/küçük
 * harf kuralı kapatıldı ("Aldım", "Sade" gibi özel adlar büyük harfle başlayabilir).
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'refactor',
        'test',
        'docs',
        'chore',
        'ci',
        'build',
        'perf',
        'style',
        'revert',
      ],
    ],
  },
};
