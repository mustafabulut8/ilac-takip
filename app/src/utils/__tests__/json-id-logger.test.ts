import { createId } from '../id';
import { isRecord, safeJsonParse } from '../json';
import { Logger, type LogSink } from '../logger';

describe('safeJsonParse', () => {
  it('geçerli JSON okunur', () => {
    expect(safeJsonParse('[1,2]')).toEqual({ ok: true, value: [1, 2] });
  });

  it('bozuk JSON hata fırlatmaz', () => {
    expect(safeJsonParse('{bozuk')).toEqual({ ok: false });
  });
});

describe('isRecord', () => {
  it('yalnızca düz nesneler için doğru döner', () => {
    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord('metin')).toBe(false);
  });
});

describe('createId', () => {
  it('her çağrıda farklı kimlik üretir', () => {
    const now = new Date(2026, 10, 16);
    expect(createId(now)).not.toBe(createId(now));
  });
});

describe('Logger', () => {
  it('kaydı tüm hedeflere yazar', () => {
    const sink: LogSink = { write: jest.fn() };
    const logger = new Logger([sink]);
    logger.error('hata', { kod: 1 });
    logger.warn('uyarı');
    logger.info('bilgi');
    expect(sink.write).toHaveBeenCalledWith('error', 'hata', { kod: 1 });
    expect(sink.write).toHaveBeenCalledWith('warn', 'uyarı', undefined);
    expect(sink.write).toHaveBeenCalledWith('info', 'bilgi', undefined);
  });

  it('bozuk bir hedef diğerlerini ve uygulamayı durdurmaz', () => {
    const broken: LogSink = {
      write: () => {
        throw new Error('ağ yok');
      },
    };
    const remote: LogSink = { write: jest.fn() };
    const logger = new Logger([broken]);
    logger.addSink(remote);
    expect(() => logger.error('hata')).not.toThrow();
    expect(remote.write).toHaveBeenCalled();
  });

  it('varsayılan hedef console kullanır', () => {
    const logger = new Logger();
    logger.error('hata');
    expect(console.error).toHaveBeenCalledWith('hata');
  });
});
