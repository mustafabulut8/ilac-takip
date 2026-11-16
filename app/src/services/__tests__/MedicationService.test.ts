import { AppError, StorageError, ValidationError } from '@/errors';
import type { NewMedication } from '@/models';
import { FakeStorage, makeMedication } from '@/test-utils/fakes';

import { MedicationService, type PhotoStore, type ReminderScheduler } from '../MedicationService';

const NOW = new Date(2026, 10, 16, 9, 0);

const input: NewMedication = {
  name: 'Aspirin',
  dose: '1 tablet',
  times: ['08:00'],
  stock: 30,
  photoSourceUri: 'file:///gecici.jpg',
};

function setup() {
  const storage = new FakeStorage();
  const photos = {
    savePhoto: jest.fn().mockResolvedValue('kopya.jpg'),
    deletePhoto: jest.fn(),
  } satisfies PhotoStore;
  const reminders = {
    scheduleMedication: jest.fn().mockResolvedValue(undefined),
    cancelMedication: jest.fn().mockResolvedValue(undefined),
    sync: jest.fn().mockResolvedValue(undefined),
  } satisfies ReminderScheduler;
  const service = new MedicationService(storage, photos, reminders, () => NOW);
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

describe('MedicationService.add', () => {
  it('fotoğrafı kopyalar, tablet formuyla kaydeder ve hatırlatma kurar', async () => {
    const { storage, photos, reminders, service } = setup();
    const result = await service.add([], input);

    const [medication] = result.medications;
    expect(medication).toMatchObject({
      name: 'Aspirin',
      form: 'tablet',
      photoFile: 'kopya.jpg',
      createdAt: NOW.toISOString(),
    });
    expect(photos.savePhoto).toHaveBeenCalledWith('file:///gecici.jpg', medication.id);
    expect(storage.medications).toEqual(result.medications);
    expect(reminders.scheduleMedication).toHaveBeenCalledWith(medication);
    expect(result.notice).toBe('İlaç kaydedildi');
  });

  it('geçersiz girdiyi kaydetmez', async () => {
    const { storage, service } = setup();
    await expect(service.add([], { ...input, stock: -1 })).rejects.toBeInstanceOf(ValidationError);
    expect(storage.saveCount).toBe(0);
  });

  it('hatırlatma kurulamazsa ilaç yine kaydedilir, kullanıcı uyarılır', async () => {
    const { storage, reminders, service } = setup();
    reminders.scheduleMedication.mockRejectedValue(new Error('izin yok'));
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
  it('güncellemede hatırlatmaları yeniden kurar, negatif stoğu sıfırlar', async () => {
    const { reminders, service } = setup();
    const existing = makeMedication();
    const [updated] = await service.update([existing], 'ilac1', { times: ['09:00'], stock: -2 });

    expect(updated.times).toEqual(['09:00']);
    expect(updated.stock).toBe(0);
    expect(reminders.cancelMedication).toHaveBeenCalledWith(existing);
    expect(reminders.scheduleMedication).toHaveBeenCalledWith(updated);
  });

  it('silmede hatırlatmaları ve fotoğrafı kaldırır', async () => {
    const { storage, photos, reminders, service } = setup();
    const existing = makeMedication();
    const result = await service.remove([existing, makeMedication({ id: 'ilac2' })], 'ilac1');

    expect(result.map((item) => item.id)).toEqual(['ilac2']);
    expect(storage.medications).toEqual(result);
    expect(reminders.cancelMedication).toHaveBeenCalledWith(existing);
    expect(photos.deletePhoto).toHaveBeenCalledWith('ilac1.jpg');
  });

  it('fotoğraf silinemese de ilaç silinir', async () => {
    const { photos, service } = setup();
    photos.deletePhoto.mockImplementation(() => {
      throw new Error('dosya kilitli');
    });
    await expect(service.remove([makeMedication()], 'ilac1')).resolves.toEqual([]);
  });

  it('olmayan ilaç için AppError verir', async () => {
    const { service } = setup();
    await expect(service.remove([], 'yok')).rejects.toBeInstanceOf(AppError);
    await expect(service.update([], 'yok', {})).rejects.toBeInstanceOf(AppError);
  });
});
