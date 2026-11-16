export type JsonParseResult = { ok: true; value: unknown } | { ok: false };

/** JSON.parse hata fırlatmaz; bozuk metin için `{ ok: false }` döner. */
export function safeJsonParse(text: string): JsonParseResult {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
