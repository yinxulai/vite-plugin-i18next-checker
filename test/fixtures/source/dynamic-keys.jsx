// 这些包含动态内容的 key 应该被跳过

const dynamicKey1 = t(`dynamic.${variable}`);
const dynamicKey2 = t(`prefix.${id}.suffix`);
const dynamicKey3 = t('interpolation.{{variable}}');
const dynamicKey4 = t('interpolation.${variable}');

// 这些是有效的静态 key
const validKey1 = t('valid.static.key');
const validKey2 = t('another.valid.key');
 