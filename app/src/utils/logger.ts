export type LogLevel = 'info' | 'warn' | 'error';

/** Kayıtların gönderileceği hedef. İleride uzak bir servis (ör. Supabase tablosu) eklenebilir. */
export interface LogSink {
  write(level: LogLevel, message: string, details?: unknown): void;
}

class ConsoleSink implements LogSink {
  write(level: LogLevel, message: string, details?: unknown) {
    const args = details === undefined ? [message] : [message, details];
    // Uygulamada console yalnızca burada kullanılır.
    console[level](...args);
  }
}

/** Uygulamanın tek kayıt noktası; doğrudan console.error çağrılmaz. */
export class Logger {
  private readonly sinks: LogSink[];

  constructor(sinks: LogSink[] = [new ConsoleSink()]) {
    this.sinks = [...sinks];
  }

  addSink(sink: LogSink) {
    this.sinks.push(sink);
  }

  info(message: string, details?: unknown) {
    this.write('info', message, details);
  }

  warn(message: string, details?: unknown) {
    this.write('warn', message, details);
  }

  error(message: string, details?: unknown) {
    this.write('error', message, details);
  }

  private write(level: LogLevel, message: string, details?: unknown) {
    for (const sink of this.sinks) {
      try {
        sink.write(level, message, details);
      } catch {
        // Kayıt hedefindeki bir hata uygulamayı durdurmamalı.
      }
    }
  }
}

export const logger = new Logger();
