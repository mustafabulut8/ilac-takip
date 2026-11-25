import { useState } from 'react';

import { userMessageOf, ValidationError } from '@/errors';
import { logger } from '@/utils/logger';

/**
 * Form gönderme durumu: işlem sürüyor mu, alan hataları ve genel hata mesajı.
 * ValidationError alanların altında, diğer hatalar formun altında Türkçe gösterilir.
 */
export function useFormSubmit<Field extends string>() {
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [error, setError] = useState<string | null>(null);

  /** İşlemi çalıştırır; başarılıysa true döner. */
  const submit = async (action: () => Promise<void>) => {
    if (busy) return false;
    setBusy(true);
    setFieldErrors({});
    setError(null);
    try {
      await action();
      return true;
    } catch (caught) {
      if (caught instanceof ValidationError) {
        setFieldErrors(caught.fields as Partial<Record<Field, string>>);
      } else {
        logger.warn('Form gönderilemedi:', caught);
        setError(userMessageOf(caught, 'Bir sorun oluştu. Lütfen yeniden deneyin.'));
      }
      return false;
    } finally {
      setBusy(false);
    }
  };

  /** Kullanıcı alanı düzeltmeye başlayınca o alanın hatası silinir. */
  const clearField = (field: Field) =>
    setFieldErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));

  return { busy, fieldErrors, error, submit, clearField };
}
