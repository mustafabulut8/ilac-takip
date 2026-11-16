import { AppError } from './app-error';

/** Telefondaki kayıtlı veri okunamadığında veya yazılamadığında. */
export class StorageError extends AppError {}
