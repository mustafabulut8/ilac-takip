import { makeMedication } from '@/test-utils/fakes';

import { ReminderPlanner } from '../ReminderPlanner';

const NOW = new Date(2026, 10, 27, 7, 0);
const OPEN_APP = 'Uygulamayı açın';

/** 6 günlük kür, günde 3 saat. */
function course(id: string) {
  return makeMedication({
    id,
    name: id,
    times: ['08:00', '14:00', '20:00'],
    startDate: '2026-11-27',
    duration: { kind: 'days', count: 6 },
  });
}

describe('ReminderPlanner: 64 bildirim sınırı', () => {
  const planner = new ReminderPlanner();

  it('6 gün × 3 saat × 4 ilaç = 72 hatırlatmadan en yakın 60 kurulur; sonuncusu "Uygulamayı açın" der', () => {
    const { reminders, remindersUntil } = planner.planWithCoverage(
      ['a', 'b', 'c', 'd'].map(course),
      NOW,
    );

    expect(reminders).toHaveLength(ReminderPlanner.MAX_PENDING);
    const times = reminders.map((reminder) => reminder.at!.getTime());
    expect(times).toEqual([...times].sort((x, y) => x - y));
    // 60 / 12 = 5 gün: 27–1 Aralık kurulur, 2 Aralık uygulama açılınca.
    const last = reminders.at(-1)!;
    expect(last.at).toEqual(new Date(2026, 11, 1, 20, 0));
    expect(last.content.body).toContain(OPEN_APP);
    // Kimliği farklı: sonraki eşitlemede artık son değilse sıradan bildirimle değişir.
    expect(last.identifier).toBe('d-20:00-2026-12-01-son');
    expect(
      reminders.slice(0, -1).some((reminder) => reminder.content.body.includes(OPEN_APP)),
    ).toBe(false);
    // Aile panelindeki uyarı için: hatırlatmalar ne zamana kadar kurulu.
    expect(remindersUntil).toEqual(new Date(2026, 11, 1, 20, 0));
  });

  it('hepsi sığıyorsa uyarı yok, "ne zamana kadar" boş', () => {
    const { reminders, remindersUntil } = planner.planWithCoverage([course('a')], NOW);
    expect(reminders).toHaveLength(18);
    expect(reminders.some((reminder) => reminder.content.body.includes(OPEN_APP))).toBe(false);
    expect(remindersUntil).toBeNull();
  });

  it('yalnızca tekrarlanan (sürekli) hatırlatmalar hiç bitmez: "ne zamana kadar" boş', () => {
    const daily = makeMedication({ times: ['08:00', '20:00'] });
    expect(planner.planWithCoverage([daily], NOW).remindersUntil).toBeNull();
  });

  it('tekrarlananlar yer kaplar; süreli olanlara kalan yer kadarı kurulur', () => {
    const daily = makeMedication({ id: 'gunluk', times: ['09:00', '21:00'] });
    const { reminders, remindersUntil } = planner.planWithCoverage(
      [daily, ...['a', 'b', 'c', 'd'].map(course)],
      NOW,
    );
    expect(reminders).toHaveLength(60);
    expect(reminders.filter((reminder) => reminder.trigger.kind === 'daily')).toHaveLength(2);
    expect(remindersUntil).toEqual(reminders.at(-1)!.at);
  });
});
