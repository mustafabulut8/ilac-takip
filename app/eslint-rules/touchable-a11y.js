/**
 * Proje kuralı (kararlar.md, ADR-020): ekran okuyucu her dokunulabilir öğenin ne olduğunu
 * ve ne işe yaradığını söyleyebilmeli. `Pressable` ve Touchable* bileşenlerinde hem
 * `accessibilityLabel` hem `accessibilityRole` zorunludur; `Switch` ve `TextInput`'ta
 * rol yerleşik olduğu için yalnızca etiket istenir. Dokunma alanının 48pt olduğu
 * `touch-targets` testinde ölçülür.
 */
const NEEDS_LABEL_AND_ROLE = new Set([
  'Pressable',
  'TouchableOpacity',
  'TouchableHighlight',
  'TouchableWithoutFeedback',
  'TouchableNativeFeedback',
]);
const NEEDS_LABEL = new Set(['Switch', 'TextInput']);

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Dokunulabilir öğede erişilebilirlik etiketi ve rolü zorunlu' },
    messages: {
      missing: '<{{element}}> için {{props}} verilmeli (ekran okuyucu bunu okur).',
    },
    schema: [],
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const element = node.name.type === 'JSXIdentifier' ? node.name.name : null;
        if (!element) return;
        const required = NEEDS_LABEL_AND_ROLE.has(element)
          ? ['accessibilityLabel', 'accessibilityRole']
          : NEEDS_LABEL.has(element)
            ? ['accessibilityLabel']
            : [];
        if (required.length === 0) return;
        // Yayılan özellikler ({...props}) içinde gelebilir; kural bunu bilemez, uyarmaz.
        if (node.attributes.some((attribute) => attribute.type === 'JSXSpreadAttribute')) return;
        const given = new Set(
          node.attributes
            .filter((attribute) => attribute.type === 'JSXAttribute')
            .map((attribute) => attribute.name.name),
        );
        const missing = required.filter((prop) => !given.has(prop));
        if (missing.length > 0) {
          context.report({
            node,
            messageId: 'missing',
            data: { element, props: missing.join(' ve ') },
          });
        }
      },
    };
  },
};
