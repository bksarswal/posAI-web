import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

describe('parseEnv', () => {
  it('accepts a valid URL for NEXT_PUBLIC_API_URL', () => {
    const valid = parseEnv({
      NEXT_PUBLIC_API_URL: 'http://localhost:8080/api/v1',
    });
    expect(valid.NEXT_PUBLIC_API_URL).toBe('http://localhost:8080/api/v1');

    const httpsValid = parseEnv({
      NEXT_PUBLIC_API_URL: 'https://api.posai.app/v1',
    });
    expect(httpsValid.NEXT_PUBLIC_API_URL).toBe('https://api.posai.app/v1');
  });

  it('fails clearly when NEXT_PUBLIC_API_URL is missing or empty', () => {
    expect(() => parseEnv({})).toThrow('Invalid frontend environment configuration:');
    expect(() => parseEnv({})).toThrow('NEXT_PUBLIC_API_URL');

    expect(() =>
      parseEnv({
        NEXT_PUBLIC_API_URL: '',
      }),
    ).toThrow('NEXT_PUBLIC_API_URL is required');
  });

  it('fails clearly when NEXT_PUBLIC_API_URL is not a valid URL', () => {
    expect(() =>
      parseEnv({
        NEXT_PUBLIC_API_URL: 'not-a-url',
      }),
    ).toThrow('NEXT_PUBLIC_API_URL must be a valid URL');

    expect(() =>
      parseEnv({
        NEXT_PUBLIC_API_URL: 'not a valid url',
      }),
    ).toThrow('NEXT_PUBLIC_API_URL must be a valid URL');
  });
});
