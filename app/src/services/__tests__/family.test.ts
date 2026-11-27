import { deviceNotifications, FakeMedicationRows, makeMedication } from '@/test-utils/fakes';
import { toMedicationRow } from '@/validation/medication-rows';

import { DoseCalculator } from '../DoseCalculator';
import { createFamilyServices, FamilyDashboardService, NO_REMINDERS } from '../family';
import { NotificationService } from '../NotificationService';
import { RemoteDoseLogRepository } from '../RemoteDoseLogRepository';
import type { DoseLogRowsApi } from '../remote-ports';

const PATIENT = 'fatma';
const NOW = new Date(2026, 10, 27, 10, 0);
const today = '2026-11-27';

class FakeDoseRows implements DoseLogRowsApi {
  rows: unknown[] = [];
  since: string[] = [];
  async list(_ownerId: string, fromDate: string) {
    this.since.push(fromDate);
    return this.rows;
  }
}

function doseRow(medicationId: string, time: string) {
  return {
    id: `${medicationId}_${today}_${time}`,
    medication_id: medicationId,
    scheduled_date: today,
    scheduled_time: time,
    taken_at: `${today}T06:00:00Z`,
    status: 'taken',
  };
}

function setup() {
  const rows = new FakeMedicationRows();
  const doseRows = new FakeDoseRows();
  const photos = { savePhoto: jest.fn().mockResolvedValue(''), deletePhoto: jest.fn() };
  return { rows, doseRows, photos };
}

describe('RemoteDoseLogRepository', () => {
  it('alınan dozları okur; atlanan ve bozuk satırlar sayılmaz', async () => {
    const { doseRows } = setup();
    doseRows.rows = [
      doseRow('a', '08:00'),
      { ...doseRow('a', '20:00'), status: 'skipped' },
      { id: 1 },
    ];
    const repository = new RemoteDoseLogRepository(doseRows, PATIENT, () => NOW);
    const loaded = await repository.load();
    expect(loaded.items).toEqual([
      {
        id: `a_${today}_08:00`,
        medicationId: 'a',
        date: today,
        time: '08:00',
        takenAt: `${today}T06:00:00Z`,
      },
    ]);
    expect(loaded.warnings).toEqual(['Sunucudaki 1 doz kaydı okunamadı.']);
  });

  it('aile yakını adına doz onaylayamaz', async () => {
    const repository = new RemoteDoseLogRepository(setup().doseRows, PATIENT, () => NOW);
    await expect(repository.recordDose()).rejects.toThrow();
  });
});

describe('createFamilyServices: aile yakını için ilaç ekler', () => {
  it('ilaç yakının sunucudaki listesine yazılır; aile telefonu hatırlatma kurmaz', async () => {
    const { rows, doseRows, photos } = setup();
    // Aile telefonundaki gerçek bildirim servisi: yakının ilaçları buraya hiç ulaşmamalı.
    const device = deviceNotifications();
    new NotificationService(device.api, 'ios', () => NOW);
    const services = createFamilyServices({ rows, doseRows, photos, now: () => NOW }, PATIENT);

    const added = await services.medications.add([], {
      name: 'Metformin',
      dose: '1000 mg',
      amount: 1,
      unit: 'adet',
      location: '',
      form: 'tablet',
      times: ['09:00'],
      schedule: { kind: 'daily' },
      duration: { kind: 'continuous' },
      mealTiming: 'full',
      stock: 30,
      lowStockThreshold: 5,
      markedLow: false,
      photoSourceUri: null,
    });
    const [medication] = added.medications;
    await services.medications.update(added.medications, medication!.id, { times: ['10:00'] });

    expect(rows.get(medication!.id)).toMatchObject({ owner_id: PATIENT, times: ['10:00'] });
    expect(device.pending.size).toBe(0);
    expect(device.api.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('hatırlatıcı boştur: hiçbir şey kurmaz, kaldırmaz', async () => {
    await expect(NO_REMINDERS.sync([makeMedication()])).resolves.toBeUndefined();
    await expect(NO_REMINDERS.cancelMedication(makeMedication())).resolves.toBeUndefined();
  });

  it('sunucuda değişiklik olunca (Realtime) güncel listeyi verir; bayat düzenlemeden sonra da', async () => {
    const { rows, doseRows, photos } = setup();
    let notify = () => {};
    const realtime = {
      subscribe: jest.fn((_owner: string, onChange: () => void) => {
        notify = onChange;
        return () => {};
      }),
    };
    const services = createFamilyServices(
      { rows, doseRows, photos, realtime, now: () => NOW },
      PATIENT,
    );
    const listener = jest.fn();
    services.changes.subscribe(listener);
    expect(realtime.subscribe).toHaveBeenCalledWith(PATIENT, expect.any(Function));
    rows.put(toMedicationRow(makeMedication({ id: 'yeni', name: 'Yeni' }), PATIENT));
    notify();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(listener).toHaveBeenCalledWith([expect.objectContaining({ id: 'yeni' })]);
  });

  it('doz onayı aile tarafında yoktur', async () => {
    const services = createFamilyServices({ ...setup(), now: () => NOW }, PATIENT);
    expect(await services.doses.confirmDose()).toBeNull();
  });
});

describe('FamilyDashboardService', () => {
  function dashboard() {
    const { rows, doseRows } = setup();
    const service = new FamilyDashboardService(rows, doseRows, new DoseCalculator(), () => NOW);
    return { rows, doseRows, service };
  }

  it('bugünün dozları mevcut doz kurallarıyla: alındı, kaçırıldı, bekliyor', async () => {
    const { rows, doseRows, service } = dashboard();
    rows.put(
      toMedicationRow(makeMedication({ id: 'met', name: 'Metformin', times: ['08:00'] }), PATIENT),
    );
    rows.put(
      toMedicationRow(makeMedication({ id: 'cor', name: 'Coraspin', times: ['09:00'] }), PATIENT),
    );
    rows.put(
      toMedicationRow(
        makeMedication({ id: 'ato', name: 'Atorvastatin', times: ['21:00'] }),
        PATIENT,
      ),
    );
    doseRows.rows = [doseRow('cor', '09:00')];

    const summary = await service.summaryOf(PATIENT);

    expect(summary.doses.map((dose) => [dose.time, dose.status])).toEqual([
      ['08:00', 'kacirildi'],
      ['09:00', 'alindi'],
      ['21:00', 'bekliyor'],
    ]);
    expect(summary.progress).toEqual({ taken: 1, total: 3 });
    expect(summary.missed.map((dose) => dose.medication.name)).toEqual(['Metformin']);
    // Dünden bu yana alınan dozlar istenir (gece yarısından sonra dünün dozları da görünür).
    expect(doseRows.since).toEqual(['2026-11-26']);
  });

  it('"telefona ulaştı" bilgisi boş olan ilaçları ayrıca verir', async () => {
    const { rows, service } = dashboard();
    rows.familyWrite(toMedicationRow(makeMedication({ id: 'yeni' }), PATIENT));
    rows.put({ ...toMedicationRow(makeMedication({ id: 'eski' }), PATIENT), delivered_at: 'x' });
    expect((await service.summaryOf(PATIENT)).undeliveredIds).toEqual(['yeni']);
  });
});
