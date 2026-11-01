import { Directory, File, Paths } from 'expo-file-system';

function photosDirectory() {
  return new Directory(Paths.document, 'photos');
}

/** Seçilen fotoğraf geçici olabileceği için kalıcı klasöre kopyalanır; dosya adı döner. */
export async function savePhoto(sourceUri: string, medicationId: string) {
  const directory = photosDirectory();
  directory.create({ intermediates: true, idempotent: true });

  const source = new File(sourceUri);
  const fileName = `${medicationId}${source.extension || '.jpg'}`;
  await source.copy(new File(directory, fileName), { overwrite: true });
  return fileName;
}

export function photoUri(fileName: string) {
  return new File(photosDirectory(), fileName).uri;
}
