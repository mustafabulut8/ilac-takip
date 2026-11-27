import { AppError } from './app-error';

/** İşlem internet gerektiriyor ve telefon çevrimdışı; hiçbir şey değiştirilmedi. */
export class OfflineError extends AppError {
  constructor(action: string) {
    super(`Çevrimdışıyken yapılamaz: ${action}`, 'İnternet bağlantısı gerekiyor');
  }
}
