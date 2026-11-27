import { AppError, StorageError, ValidationError } from '@/errors';
import type { NewMedication } from '@/models';
import { FakeStorage, makeMedication } from '@/test-utils/fakes';
import { logger } from '@/utils/logger';

import { MedicationService } from '../MedicationService';
import type { PhotoStore, ReminderScheduler } from '../ports';

const NOW = new Date(2026, 10, 16, 9, 0);

const input: NewMedication = {
  name: 'Aspirin',
  dose: '1 tablet',
  amount: 1,
  unit: 'adet',
  location: '',
  form: 'tablet',
  times: ['08:00'],
  schedule: { kind: 'daily' },
  duration: { kind: 'continuous' },
  mealTiming: 'full',
  stock: 30,
  lowStockThreshold: 5,
  markedLow: false,
  photoSourceUri: 'file:///gecici.jpg',
};

function setup() {
  const storage = new FakeStorage();
  const photos = {
    savePhoto: jest.fn().mockResolvedValue('kopya.jpg'),
    deletePhoto: jest.fn(),
  } satisfies PhotoStore;
  const reminders = {
    cancelMedication: jest.fn().mockResolvedValue(undefined),
    sync: jest.fn().mockResolvedValue(undefined),
  } satisfies ReminderScheduler;
  const service = new MedicationService(storage.repositories, photos, reminders, () => NOW);
  return { storage, photos, reminders, service };
}

describe('MedicationService.load', () => {
  it('kayıtlı veriyi döner ve hatırlatmaları eşitler', async () => {
    const { storage, reminders, service } = setup();
    storage.medications = [makeMedication()];
    const data = await service.load();
    expect(data.medications).toHaveLength(1);
    expect(reminders.sync).toHaveBeenCalledWith(data.medications);
  });

  it('eşitleme hatası yüklemeyi bozmaz', async () => {
    const { reminders, service } = setup();
    reminders.sync.mockRejectedValue(new Error('izin yok'));
    await expect(service.load()).resolves.toBeDefined();
  });
});

describe('MedicationService.syncReminders', () => {
  it('verilen listeyi eşitler', () => {
    const { reminders, service } = setup();
    const medications = [makeMedication()];
    service.syncReminders(medications);
    expect(reminders.sync).toHaveBeenCalledTimes(1);
    expect(reminders.sync).toHaveBeenCalledWith(medications);
  });

  it('eşitleme hatası fırlatılmaz, uyarı olarak kaydedilir', async () => {
    const { reminders, service } = setup();
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => {});
    const error = new Error('izin yok');
    reminders.sync.mockRejectedValue(error);
    expect(() => service.syncReminders([])).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();
    expect(warn).toHaveBeenCalledWith(expect.any(String), error);
    warn.mockRestore();
  });
});

describe('MedicationService.add', () => {
  it('fotoğrafı kopyalar, kaydeder ve hatırlatma kurar', async () => {
    const { storage, photos, reminders, service } = setup();
    const result = await service.add([], input);

    const [medication] = result.medications;
    expect(medication).toMatchObject({
      name: 'Aspirin',
      form: 'tablet',
      photoFile: 'kopya.jpg',
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
      photoPath: '',
    });
    expect(photos.savePhoto).toHaveBeenCalledWith('file:///gecici.jpg', medication?.id);
    expect(storage.medications).toEqual(result.medications);
    expect(reminders.sync).toHaveBeenCalledWith(result.medications);
    expect(result.notice).toBe('İlaç kaydedildi');
  });

  it('fotoğrafsız ilaç kaydedilebilir', async () => {
    const { photos, service } = setup();
    const result = await service.add([], { ...input, photoSourceUri: null });
    expect(result.medications[0]?.photoFile).toBe('');
    expect(photos.savePhoto).not.toHaveBeenCalled();
  });

  it('süre ilk dozun gününden sayılır', async () => {
    const { service } = setup();
    const startOf = async (times: string[]) =>
      (await service.add([], { ...input, times, duration: { kind: 'days', count: 7 } }))
        .medications[0]?.startDate;
    // Saat 09:00: bugünün 08:00 dozu geçti, 20:00 dozu bugün alınabilir.
    expect(await startOf(['08:00'])).toBe('2026-11-17');
    expect(await startOf(['08:00', '20:00'])).toBe('2026-11-16');
  });

  it('geçersiz girdiyi kaydetmez', async () => {
    const { storage, service } = setup();
    await expect(service.add([], { ...input, stock: -1 })).rejects.toBeInstanceOf(ValidationError);
    expect(storage.saveCount).toBe(0);
  });

  it('hatırlatma kurulamazsa ilaç yine kaydedilir, kullanıcı uyarılır', async () => {
    const { storage, reminders, service } = setup();
    reminders.sync.mockRejectedValue(new Error('izin yok'));
    const result = await service.add([], input);
    expect(storage.medications).toHaveLength(1);
    expect(result.notice).toMatch(/hatırlatma kurulamadı/);
  });

  it('fotoğraf kopyalanamazsa Türkçe mesajlı hata verir ve kaydetmez', async () => {
    const { storage, photos, service } = setup();
    photos.savePhoto.mockRejectedValue(new Error('disk dolu'));
    await expect(service.add([], input)).rejects.toMatchObject({
      userMessage: 'Fotoğraf kaydedilemedi. Lütfen fotoğrafı yeniden seçip tekrar deneyin.',
    });
    expect(storage.saveCount).toBe(0);
  });

  it('depolama hatası StorageError olarak iletilir', async () => {
    const { storage, service } = setup();
    storage.failWrites = true;
    await expect(service.add([], input)).rejects.toBeInstanceOf(StorageError);
  });
});

describe('MedicationService.update / remove', () => {
  it('plan değişince hatırlatmalar yeniden kurulur, eski plan saklanır', async () => {
    const { reminders, service } = setup();
    const existing = makeMedication();
    const { medications, notice } = await service.update([existing], 'ilac1', { times: ['09:30'] });

    expect(medications[0]?.times).toEqual(['09:30']);
    expect(medications[0]?.pastPlans).toEqual([
      {
        times: ['08:00', '20:00'],
        schedule: { kind: 'daily' },
        duration: { kind: 'continuous' },
        startDate: '2026-01-01',
        until: NOW.toISOString(),
      },
    ]);
    expect(reminders.cancelMedication).toHaveBeenCalledWith(existing);
    expect(reminders.sync).toHaveBeenCalledWith(medications);
    expect(notice).toBe('Değişiklik kaydedildi');
  });

  it('yalnızca stok değişince plan ve hatırlatmalara dokunulmaz', async () => {
    const { reminders, service } = setup();
    const { medications } = await service.update([makeMedication()], 'ilac1', { stock: 30 });
    expect(medications[0]).toEqual(makeMedication({ stock: 30, updatedAt: NOW.toISOString() }));
    expect(reminders.cancelMedication).not.toHaveBeenCalled();
  });

  it('geçersiz değişikliği kaydetmez', async () => {
    const { storage, service } = setup();
    for (const changes of [{ stock: -2 }, { times: [] }, { name: ' ' }]) {
      await expect(service.update([makeMedication()], 'ilac1', changes)).rejects.toBeInstanceOf(
        ValidationError,
      );
    }
    expect(storage.saveCount).toBe(0);
  });

  it('süren kür uzatılınca başlangıç korunur, biten kür yeniden başlar', async () => {
    const { service } = setup();
    const startAfter = async (startDate: string) => {
      const course = makeMedication({ startDate, duration: { kind: 'days', count: 7 } });
      const { medications } = await service.update([course], 'ilac1', {
        duration: { kind: 'days', count: 10 },
      });
      return medications[0]?.startDate;
    };
    expect(await startAfter('2026-11-14')).toBe('2026-11-14');
    expect(await startAfter('2026-10-01')).toBe('2026-11-16');
  });

  it('yeni fotoğraf farklı adla kopyalanır, eskisi kayıttan sonra silinir', async () => {
    const { storage, photos, service } = setup();
    photos.deletePhoto.mockImplementation(() => expect(storage.saveCount).toBe(1));
    const { medications } = await service.update([makeMedication()], 'ilac1', {
      photoSourceUri: 'file:///yeni.jpg',
    });
    expect(photos.savePhoto).toHaveBeenCalledWith('file:///yeni.jpg', `ilac1-${NOW.getTime()}`);
    expect(medications[0]?.photoFile).toBe('kopya.jpg');
    expect(photos.deletePhoto).toHaveBeenCalledWith('ilac1.jpg');
  });

  it('fotoğraf değişince ya da kaldırılınca sunucudaki yolu sıfırlanır (yeniden yüklenir)', async () => {
    const { service } = setup();
    const uploaded = makeMedication({ photoPath: 'sahip/ilac1-1.jpg' });
    const changed = await service.update([uploaded], 'ilac1', {
      photoSourceUri: 'file:///yeni.jpg',
    });
    expect(changed.medications[0]?.photoPath).toBe('');
    const removed = await service.update([uploaded], 'ilac1', { photoSourceUri: null });
    expect(removed.medications[0]?.photoPath).toBe('');
    const untouched = await service.update([uploaded], 'ilac1', { name: 'Yeni ad' });
    expect(untouched.medications[0]?.photoPath).toBe('sahip/ilac1-1.jpg');
  });

  it('kayıt başarısız olursa eski fotoğraf silinmez', async () => {
    const { storage, photos, service } = setup();
    storage.failWrites = true;
    await expect(
      service.update([makeMedication()], 'ilac1', { photoSourceUri: null }),
    ).rejects.toBeInstanceOf(StorageError);
    expect(photos.deletePhoto).not.toHaveBeenCalled();
  });

  it('hatırlatma kurulamazsa değişiklik yine kaydedilir, kullanıcı uyarılır', async () => {
    const { storage, reminders, service } = setup();
    storage.medications = [makeMedication()];
    reminders.cancelMedication.mockRejectedValue(new Error('bildirim yok'));
    const { notice } = await service.update([makeMedication()], 'ilac1', { times: ['09:30'] });
    expect(storage.medications[0]?.times).toEqual(['09:30']);
    expect(notice).toMatch(/hatırlatma kurulamadı/);
  });

  it('silmede hatırlatmaları ve fotoğrafı kaldırır', async () => {
    const { storage, photos, reminders, service } = setup();
    const existing = makeMedication();
    storage.medications = [existing, makeMedication({ id: 'ilac2' })];
    const { medications, notice } = await service.remove(
      [existing, makeMedication({ id: 'ilac2' })],
      'ilac1',
    );

    expect(medications.map((item) => item.id)).toEqual(['ilac2']);
    expect(storage.medications).toEqual(medications);
    expect(reminders.cancelMedication).toHaveBeenCalledWith(existing);
    expect(photos.deletePhoto).toHaveBeenCalledWith('ilac1.jpg');
    expect(notice).toBe('İlaç silindi');
  });

  it('fotoğraf silinemese de ilaç silinir', async () => {
    const { photos, service } = setup();
    photos.deletePhoto.mockImplementation(() => {
      throw new Error('dosya kilitli');
    });
    await expect(service.remove([makeMedication()], 'ilac1')).resolves.toMatchObject({
      medications: [],
    });
  });

  it('olmayan ilaç için AppError verir', async () => {
    const { service } = setup();
    await expect(service.remove([], 'yok')).rejects.toBeInstanceOf(AppError);
    await expect(service.update([], 'yok', {})).rejects.toBeInstanceOf(AppError);
  });
});

describe('MedicationService.update hatırlatma hatası', () => {
  it('eski hatırlatmalar kaldırılamasa da yeni saatler kurulur', async () => {
    const { service, reminders } = setup();
    reminders.cancelMedication.mockRejectedValue(new Error('iptal edilemedi'));
    const current = [makeMedication()];

    const result = await service.update(current, 'ilac1', { times: ['09:00'] });

    expect(reminders.sync).toHaveBeenCalledWith(result.medications);
    expect(result.notice).toBe(
      'Değişiklik kaydedildi, ancak hatırlatma kurulamadı. Bildirim iznini kontrol edin.',
    );
  });
});

describe('MedicationService: son değişiklik anı (eşitleme)', () => {
  it('güncelleme ve silme olmayan her değişiklik updatedAt alanını şimdiki an yapar', async () => {
    const { storage, service } = setup();
    const existing = makeMedication({ updatedAt: '2026-01-01T00:00:00.000Z' });
    storage.medications = [existing];
    const result = await service.update([existing], existing.id, { name: 'Yeni' });
    expect(result.medications[0]?.updatedAt).toBe(NOW.toISOString());
    expect(storage.medications[0]?.updatedAt).toBe(NOW.toISOString());
  });
});
