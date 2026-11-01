import { describe, it, expect } from 'vitest';
import { getSafeRedirectPath } from './safeRedirect';

describe('getSafeRedirectPath (src/shared/lib/safeRedirect.ts)', () => {
  // ── Malicious inputs → always fallback ─────────────────────────────────────

  it('rejects https://evil.com (absolute URL with scheme)', () => {
    expect(getSafeRedirectPath('https://evil.com')).toBe('/dashboard');
  });

  it('rejects //evil.com (protocol-relative URL)', () => {
    expect(getSafeRedirectPath('//evil.com')).toBe('/dashboard');
  });

  it('rejects /\\evil.com (backslash vector)', () => {
    expect(getSafeRedirectPath('/\\evil.com')).toBe('/dashboard');
  });

  it('rejects javascript:alert(1) (scheme without leading slash)', () => {
    expect(getSafeRedirectPath('javascript:alert(1)')).toBe('/dashboard');
  });

  it('rejects /%2F%2Fevil.com (encoded // — safe after decode check)', () => {
    expect(getSafeRedirectPath('/%2F%2Fevil.com')).toBe('/dashboard');
  });

  // ── Control characters (\x00-\x1f, \x7f) ──────────────────────────────────

  it('rejects /\\t/evil.com (tab character in raw input)', () => {
    expect(getSafeRedirectPath('/\t/evil.com')).toBe('/dashboard');
  });

  it('rejects /\\n/evil.com (newline character in raw input)', () => {
    expect(getSafeRedirectPath('/\n/evil.com')).toBe('/dashboard');
  });

  it('rejects /%09/evil.com (URL-encoded tab — rejected after decodeURIComponent)', () => {
    expect(getSafeRedirectPath('/%09/evil.com')).toBe('/dashboard');
  });

  it('rejects /%00/evil.com (URL-encoded null byte)', () => {
    expect(getSafeRedirectPath('/%00/evil.com')).toBe('/dashboard');
  });

  it('rejects /%0A/evil.com (URL-encoded line feed)', () => {
    expect(getSafeRedirectPath('/%0A/evil.com')).toBe('/dashboard');
  });

  it('rejects /%0D/evil.com (URL-encoded carriage return)', () => {
    expect(getSafeRedirectPath('/%0D/evil.com')).toBe('/dashboard');
  });

  it('rejects /%7F/evil.com (URL-encoded DEL character)', () => {
    expect(getSafeRedirectPath('/%7F/evil.com')).toBe('/dashboard');
  });

  it('returns fallback for empty string', () => {
    expect(getSafeRedirectPath('')).toBe('/dashboard');
  });

  it('returns fallback for undefined', () => {
    expect(getSafeRedirectPath(undefined)).toBe('/dashboard');
  });

  it('returns fallback for null', () => {
    expect(getSafeRedirectPath(null)).toBe('/dashboard');
  });

  // ── Public auth routes → always fallback (loop guard) ──────────────────────

  it('rejects /login (public auth route loop guard)', () => {
    expect(getSafeRedirectPath('/login')).toBe('/dashboard');
  });

  it('rejects /signup (public auth route loop guard)', () => {
    expect(getSafeRedirectPath('/signup')).toBe('/dashboard');
  });

  it('rejects /login?next=/foo (query does not rescue a blocked route)', () => {
    expect(getSafeRedirectPath('/login?next=/foo')).toBe('/dashboard');
  });

  it('rejects /change-password (public auth route loop guard)', () => {
    expect(getSafeRedirectPath('/change-password')).toBe('/dashboard');
  });

  // ── Safe paths → returned unchanged ────────────────────────────────────────

  it('accepts /dashboard', () => {
    expect(getSafeRedirectPath('/dashboard')).toBe('/dashboard');
  });

  it('accepts /dashboard?tab=1 (safe path with query string)', () => {
    expect(getSafeRedirectPath('/dashboard?tab=1')).toBe('/dashboard?tab=1');
  });

  it('accepts /profile (arbitrary safe path)', () => {
    expect(getSafeRedirectPath('/profile')).toBe('/profile');
  });

  it('accepts /branches/b-1/edit', () => {
    expect(getSafeRedirectPath('/branches/b-1/edit')).toBe('/branches/b-1/edit');
  });

  // ── Custom fallback ─────────────────────────────────────────────────────────

  it('uses a custom fallback when provided', () => {
    expect(getSafeRedirectPath('//evil.com', '/home')).toBe('/home');
  });

  it('uses /dashboard as the default fallback', () => {
    expect(getSafeRedirectPath(null)).toBe('/dashboard');
  });
});
