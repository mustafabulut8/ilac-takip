import { makeMedication } from '@/test-utils/fakes';

import { PhotoSync, PhotoUrls } from '../PhotoSync';
import type { PhotoStorageApi } from '../remote-ports';

const NOW = new Date(Date.UTC(2026, 10, 27, 10, 0));

function fakeStorage(): jest.Mocked<PhotoStorageApi> {
  return {
    upload: jest.fn().mockResolvedValue(undefined),
    removeExcept: jest.fn().mockResolvedValue(undefined),
    signedUrl: jest.fn(
      async (path: string, _seconds: number) => `https://imzali/${path}?t=${Math.random()}`,
    ),
  };
}
const localPhotos = { photoUri: (fileName: string) => `file:///photos/${fileName}` };

describe('PhotoSync', () => {
  it('telefonda fotoğrafı olup sunucuda yolu olmayan ilacın fotoğrafını yükler', async () => {
    const storage = fakeStorage();
    const sync = new PhotoSync(storage, localPhotos, () => NOW);
    const medication = makeMedication({ id: 'met', photoFile: 'met.jpg', photoPath: '' });

    const uploaded = await sync.ensureUploaded(medication, 'fatma');

    const path = `fatma/met-${NOW.getTime()}.jpg`;
    expect(storage.upload).toHaveBeenCalledWith(path, 'file:///photos/met.jpg');
    expect(uploaded).toEqual({ ...medication, photoPath: path });
  });

  it('fotoğraf yoksa ya da zaten yüklendiyse hiçbir şey göndermez', async () => {
    const storage = fakeStorage();
    const sync = new PhotoSync(storage, localPhotos, () => NOW);
    const none = makeMedication({ photoFile: '', photoPath: '' });
    const done = makeMedication({ photoFile: 'a.jpg', photoPath: 'fatma/a-1.jpg' });
    expect(await sync.ensureUploaded(none, 'fatma')).toBe(none);
    expect(await sync.ensureUploaded(done, 'fatma')).toBe(done);
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it('eski fotoğrafları temizler; hata olursa işi durdurmaz', async () => {
    const storage = fakeStorage();
    storage.removeExcept.mockRejectedValueOnce(new Error('ağ'));
    const sync = new PhotoSync(storage, localPhotos, () => NOW);
    await expect(sync.cleanUp('fatma', 'met', 'fatma/met-2.jpg')).resolves.toBeUndefined();
    expect(storage.removeExcept).toHaveBeenCalledWith('fatma', 'met', 'fatma/met-2.jpg');
  });
});

describe('PhotoUrls (imzalı adres önbelleği)', () => {
  it('aynı fotoğraf için süresi dolana kadar aynı adresi verir, sonra yeniler', async () => {
    const storage = fakeStorage();
    let now = NOW;
    const urls = new PhotoUrls(storage, () => now);
    const first = await urls.urlFor('fatma/met-1.jpg');
    expect(await urls.urlFor('fatma/met-1.jpg')).toBe(first);
    expect(storage.signedUrl).toHaveBeenCalledWith('fatma/met-1.jpg', 3600);

    now = new Date(NOW.getTime() + 56 * 60_000);
    expect(await urls.urlFor('fatma/met-1.jpg')).not.toBe(first);
    expect(storage.signedUrl).toHaveBeenCalledTimes(2);
  });
});
