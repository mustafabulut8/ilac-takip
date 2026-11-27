import type { RedeemField, RedeemInput, RedeemResult } from '@/models';
import { careService } from '@/services';

import { useFormSubmit } from './useFormSubmit';

/** Kodla Bağlan formu: alan hataları alanların altında, sunucu mesajı formun altında. */
export function useRedeemCode() {
  const form = useFormSubmit<RedeemField>();

  /** Bağlanılırsa kişiyi, olmazsa `null` döner (hata `form.error`'da). */
  const redeem = async (input: RedeemInput): Promise<RedeemResult | null> => {
    let result: RedeemResult | null = null;
    await form.submit(async () => {
      result = await careService.redeem(input);
    });
    return result;
  };

  return { ...form, redeem };
}
