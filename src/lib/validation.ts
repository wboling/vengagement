// ─── File validation ─────────────────────────────────────────────────────────

export const ALLOWED_DOC_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
]);

export const ALLOWED_DOC_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv']);

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml',
]);

export const ALLOWED_IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'svg']);

export const MAX_DOC_BYTES   = 50 * 1024 * 1024; //  50 MB
export const MAX_IMAGE_BYTES =  5 * 1024 * 1024; //   5 MB

function ext(filename: string): string {
  return (filename.split('.').pop() ?? '').toLowerCase();
}

export function validateDocumentFile(file: { name: string; type: string; size: number }):
  { ok: true } | { ok: false; error: string } {
  if (file.size > MAX_DOC_BYTES) {
    return { ok: false, error: `File too large — maximum is 50 MB` };
  }
  if (!ALLOWED_DOC_MIME_TYPES.has(file.type)) {
    return { ok: false, error: `File type not allowed. Accepted: PDF, Word (.docx), Excel (.xlsx), plain text, CSV` };
  }
  if (!ALLOWED_DOC_EXTENSIONS.has(ext(file.name))) {
    return { ok: false, error: `File extension not allowed. Accepted: pdf, docx, doc, xlsx, xls, txt, csv` };
  }
  return { ok: true };
}

export function validateImageFile(file: { name: string; type: string; size: number }):
  { ok: true } | { ok: false; error: string } {
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: `Image too large — maximum is 5 MB` };
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    return { ok: false, error: `Only PNG, JPG, WEBP, or SVG images are accepted` };
  }
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext(file.name))) {
    return { ok: false, error: `File extension not allowed. Accepted: png, jpg, jpeg, webp, svg` };
  }
  return { ok: true };
}

// ─── Input string validation ──────────────────────────────────────────────────

export class ValidationError extends Error {
  status = 400;
  constructor(message: string) { super(message); this.name = 'ValidationError'; }
}

export function str(
  val: unknown,
  field: string,
  opts: { required?: boolean; max?: number; min?: number } = {}
): string | null {
  if (val === undefined || val === null || val === '') {
    if (opts.required) throw new ValidationError(`${field} is required`);
    return null;
  }
  if (typeof val !== 'string') throw new ValidationError(`${field} must be a string`);
  const trimmed = val.trim();
  if (trimmed === '') {
    if (opts.required) throw new ValidationError(`${field} is required`);
    return null;
  }
  const max = opts.max ?? 1000;
  if (trimmed.length > max) throw new ValidationError(`${field} must be ${max} characters or fewer`);
  if (opts.min && trimmed.length < opts.min) throw new ValidationError(`${field} must be at least ${opts.min} characters`);
  return trimmed;
}

export function email(val: unknown, field = 'Email'): string | null {
  const s = str(val, field, { max: 254 });
  if (!s) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new ValidationError(`${field} is not a valid email address`);
  return s;
}

export function url(val: unknown, field = 'URL'): string | null {
  const s = str(val, field, { max: 2048 });
  if (!s) return null;
  try { new URL(s); } catch { throw new ValidationError(`${field} is not a valid URL`); }
  return s;
}
