import { useNotice } from '@/hooks/useNotice';

import { Banner } from './banner';

/** "İlaç kaydedildi" gibi kısa süreli bilgi. */
export function NoticeBanner() {
  const notice = useNotice();
  if (!notice) return null;
  return <Banner tone="success" icon="check" title={notice} />;
}
