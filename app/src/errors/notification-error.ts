import { AppError } from './app-error';

/** Bildirim izni alınamadığında veya bildirim planlanamadığında. */
export class NotificationError extends AppError {}
