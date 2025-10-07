export function anotherFile() {
  const text = t('common.delete');
  const message = t('messages.goodbye');
  
  // 这个应该被跳过，因为包含变量插值
  const dynamic = t(`dynamic.${variable}`);
  
  return { text, message };
}
