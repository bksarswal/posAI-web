/**
 * Safe redirect path helper.
 *
 * Accepts only a same-origin relative path and rejects all open-redirect vectors.
 * Rules (all must pass):
 *  1. Must be a non-empty string.
 *  2. Must contain no ASCII control characters (\x00-\x1f, \x7f).
 *  3. Must start with exactly one "/" (not "//" → protocol-relative URL).
 *  4. Must contain no backslash (Windows-path vector).
 *  5. Must contain no scheme (e.g. "javascript:", "https:").
 *  6. Must still be safe after ONE decodeURIComponent pass (catches /%2F%2F…, /%09/…).
 *  7. The pathname portion must not be one of the public auth routes (loop guard).
 *
 * Returns `raw` unchanged when safe, otherwise returns `fallback`.
 */

/** Matches ASCII control characters: NUL (0x00) through US (0x1F), and DEL (0x7F). */
const CONTROL_CHARS_REGEX = /[\x00-\x1f\x7f]/;

/** Public auth routes that must never be used as a redirect target (would create loops). */
const PUBLIC_AUTH_ROUTES = new Set([
  '/login',
  '/signup',
  '/verify-email',
  '/resend-verification',
  '/forgot-password',
  '/reset-password',
  '/change-password',
]);

export function getSafeRedirectPath(raw: unknown, fallback = '/dashboard'): string {
  if (typeof raw !== 'string' || raw.length === 0) return fallback;

  // Rule 2: reject control characters in raw string
  if (CONTROL_CHARS_REGEX.test(raw)) return fallback;

  // Rule 3: must start with "/" but not "//"
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;

  // Rule 4: no backslash
  if (raw.includes('\\')) return fallback;

  // Rule 5: no scheme — a colon before the first slash (or end of string) signals a scheme
  if (/^[^/]*:/.test(raw)) return fallback;

  // Rule 6: decode once and re-validate
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return fallback;
  }

  // Reject control characters in decoded representation (e.g. /%09/evil.com)
  if (CONTROL_CHARS_REGEX.test(decoded)) return fallback;

  if (
    !decoded.startsWith('/') ||
    decoded.startsWith('//') ||
    decoded.includes('\\') ||
    /^[^/]*:/.test(decoded)
  ) {
    return fallback;
  }

  // Rule 7: strip query and fragment to get the bare pathname, then check for loops
  const pathOnly = raw.split('?')[0].split('#')[0];
  if (PUBLIC_AUTH_ROUTES.has(pathOnly)) return fallback;

  return raw;
}
