import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { PHOTO_QUALITY, resizeFor } from '@/utils/photo';

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

  /**
   * Seçilen fotoğraf küçültülüp (uzun kenar 1080 px) JPEG %70 ile sıkıştırılır ve kalıcı
   * klasöre yazılır; dosya adı döner. Sunucuya da bu küçük dosya yüklenir.
   */
  async savePhoto(sourceUri: string, baseName: string): Promise<string> {
    const directory = this.directory();
    directory.create({ intermediates: true, idempotent: true });

    const compressed = new File(await this.compress(sourceUri));
    const fileName = `${baseName}.jpg`;
    compressed.move(new File(directory, fileName), { overwrite: true });
    return fileName;
  }

  /** Küçültülmüş JPEG'in geçici adresi. */
  private async compress(sourceUri: string): Promise<string> {
    const original = await ImageManipulator.manipulate(sourceUri).renderAsync();
    const resize = resizeFor(original);
    const image = resize
      ? await ImageManipulator.manipulate(sourceUri).resize(resize).renderAsync()
      : original;
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: PHOTO_QUALITY });
    return saved.uri;
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
