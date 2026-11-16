import { AppError, NotificationError, StorageError, userMessageOf, ValidationError } from '..';

describe('hata sınıfları', () => {
  it('alt sınıflar instanceof ile ayırt edilebilir', () => {
    const error = new StorageError('teknik', 'Türkçe mesaj');
    expect(error).toBeInstanceOf(StorageError);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(NotificationError);
    expect(error.name).toBe('StorageError');
  });

  it('asıl hatayı cause olarak saklar', () => {
    const cause = new Error('kök');
    expect(new NotificationError('teknik', 'mesaj', { cause }).cause).toBe(cause);
  });

  it('ValidationError alan hatalarını taşır', () => {
    const error = new ValidationError({ name: 'Ad gerekli' });
    expect(error.fields).toEqual({ name: 'Ad gerekli' });
    expect(error.userMessage).toBe('Lütfen işaretli alanları düzeltin.');
  });

  it('userMessageOf yalnızca AppError için Türkçe mesajı kullanır', () => {
    expect(userMessageOf(new StorageError('teknik', 'Kaydedilemedi'), 'varsayılan')).toBe(
      'Kaydedilemedi',
    );
    expect(userMessageOf(new Error('teknik'), 'varsayılan')).toBe('varsayılan');
    expect(userMessageOf('metin', 'varsayılan')).toBe('varsayılan');
  });
});
