import React from 'react';
import { useTranslation } from 'react-i18next';

export function TestComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <button>{t('common.save')}</button>
      <button>{t('common.cancel')}</button>
      <button>{t('common.confirm')}</button>
      <button>{t('auth.login')}</button>
      <button>{t('auth.logout')}</button>
      <span>{t('messages.welcome')}</span>
      <span>{t('missing.key')}</span>
    </div>
  );
}
