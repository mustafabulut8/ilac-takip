import { StaleWriteError } from '@/errors';
import { FakeMedicationRows, makeMedication } from '@/test-utils/fakes';
import { toMedicationRow } from '@/validation/medication-rows';

import { RemoteMedicationRepository } from '../RemoteMedicationRepository';

const OWNER = 'sahip';
const NOW = new Date('2026-11-27T09:00:00.000Z');

function setup() {
  const rows = new FakeMedicationRows();
  const repository = new RemoteMedicationRepository(rows, OWNER, () => NOW);
  return { rows, repository };
}

describe('RemoteMedicationRepository', () => {
  it('kişinin silinmemiş ilaçlarını okur, bozuk satırı atlayıp uyarır', async () => {
    const { rows, repository } = setup();
    rows.put(toMedicationRow(makeMedication({ id: 'a' }), OWNER));
    rows.put({
      ...toMedicationRow(makeMedication({ id: 'b' }), OWNER),
      deleted_at: NOW.toISOString(),
    });
    rows.put({ id: 'bozuk', owner_id: OWNER, deleted_at: null });
    const loaded = await repository.load();
    expect(loaded.items.map((item) => item.id)).toEqual(['a']);
    expect(loaded.warnings).toEqual(['Sunucudaki 1 ilaç okunamadı.']);
  });

  it('ekleme ve güncelleme kişinin satırına yazılır', async () => {
    const { rows, repository } = setup();
    const medication = makeMedication({ updatedAt: '2026-11-27T08:00:00.000Z' });
    await repository.add(medication);
    await repository.update({ ...medication, name: 'Yeni', updatedAt: NOW.toISOString() });
    expect(rows.get('ilac1')).toMatchObject({ owner_id: OWNER, name: 'Yeni' });
  });

  describe('eski sürümle yazma (sunucu atlar)', () => {
    it('istemci bunu öğrenir: satır yeniden çekilir ve güncel hâliyle hata fırlatılır', async () => {
      const { rows, repository } = setup();
      const newer = makeMedication({
        name: 'Aile düzeltti',
        updatedAt: '2026-11-27T08:30:00.000Z',
      });
      rows.put(toMedicationRow(newer, OWNER));

      const stale = makeMedication({
        name: 'Telefondaki eski',
        updatedAt: '2026-11-27T08:00:00.000Z',
      });
      const error = await repository.update(stale).catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(StaleWriteError);
      expect((error as StaleWriteError).current).toMatchObject({ name: 'Aile düzeltti' });
      // Sunucudaki yeni sürüm değişmedi.
      expect(rows.get('ilac1')).toMatchObject({ name: 'Aile düzeltti' });
    });

    it('silme de eski kalırsa (ilaç bu arada değiştirildi) hata fırlatılır', async () => {
      const { rows, repository } = setup();
      rows.put(toMedicationRow(makeMedication({ updatedAt: '2026-11-27T10:00:00.000Z' }), OWNER));
      await expect(repository.remove('ilac1')).rejects.toBeInstanceOf(StaleWriteError);
      expect(rows.get('ilac1')).toMatchObject({ deleted_at: null });
    });

    it('ilaç bu arada silinmişse güncel hâl yoktur (null): telefon da kaldırır', async () => {
      const { rows, repository } = setup();
      const deletedAt = '2026-11-27T08:30:00.000Z';
      rows.put({
        ...toMedicationRow(makeMedication({ updatedAt: deletedAt }), OWNER),
        deleted_at: deletedAt,
      });
      const stale = makeMedication({ updatedAt: '2026-11-27T08:00:00.000Z' });
      const error = await repository.update(stale).catch((caught: unknown) => caught);
      expect((error as StaleWriteError).current).toBeNull();
    });

    it('satır yazılamadı ve artık görünmüyorsa güncel hâl yoktur (null)', async () => {
      const { rows, repository } = setup();
      rows.rejectWritesFor.add('ilac1');
      const error = await repository.add(makeMedication()).catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(StaleWriteError);
      expect((error as StaleWriteError).current).toBeNull();
    });
  });

  it('silme yumuşaktır: silinme ve değişiklik anı yazılır', async () => {
    const { rows, repository } = setup();
    rows.put(toMedicationRow(makeMedication(), OWNER));
    await repository.remove('ilac1');
    expect(rows.get('ilac1')).toMatchObject({
      deleted_at: NOW.toISOString(),
      updated_at: NOW.toISOString(),
    });
  });
});
