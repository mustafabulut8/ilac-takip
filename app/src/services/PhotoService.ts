import { Directory, File, Paths } from 'expo-file-system';

import type { PhotoStore } from './ports';

/**
 * İlaç fotoğraflarını uygulamanın kalıcı klasöründe tutar.
 * Kayıtta tam yol değil dosya adı saklanır; iOS'ta uygulama klasörünün yolu değişebilir.
 */
export class PhotoService implements PhotoStore {
  private readonly directoryName: string;

  constructor(directoryName = 'photos') {
    this.directoryName = directoryName;
  }

  /** Seçilen fotoğraf geçici olabileceği için kalıcı klasöre kopyalanır; dosya adı döner. */
  async savePhoto(sourceUri: string, baseName: string): Promise<string> {
    const directory = this.directory();
    directory.create({ intermediates: true, idempotent: true });

    const source = new File(sourceUri);
    const fileName = `${baseName}${source.extension || '.jpg'}`;
    await source.copy(new File(directory, fileName), { overwrite: true });
    return fileName;
  }

  /** Kayıtlı dosya adından ekranda gösterilebilecek tam adres. */
  photoUri(fileName: string): string {
    return new File(this.directory(), fileName).uri;
  }

  /** İlaç silinince fotoğrafı da silinir; dosya yoksa hata vermez. */
  deletePhoto(fileName: string) {
    if (!fileName) return;
    const file = new File(this.directory(), fileName);
    if (file.exists) file.delete();
  }

  private directory() {
    return new Directory(Paths.document, this.directoryName);
  }
}
