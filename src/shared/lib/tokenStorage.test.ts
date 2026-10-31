import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getAccessToken, setAccessToken, subscribe } from './tokenStorage';

describe('tokenStorage', () => {
  beforeEach(() => {
    setAccessToken(null);
    vi.restoreAllMocks();
  });

  it('sets, gets, clears, subscribes and unsubscribes without writing to browser storage (Test 14)', () => {
    // Provide Storage polyfill in Node environment if undefined
    if (typeof globalThis.Storage === 'undefined') {
      class MockStorage {
        setItem(_key: string, _value: string): void {}
        getItem(_key: string): string | null {
          return null;
        }
        removeItem(_key: string): void {}
        clear(): void {}
      }
      (globalThis as unknown as { Storage: typeof MockStorage }).Storage = MockStorage;
      (globalThis as unknown as { localStorage: MockStorage }).localStorage = new MockStorage();
      (globalThis as unknown as { sessionStorage: MockStorage }).sessionStorage = new MockStorage();
    }

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    expect(getAccessToken()).toBeNull();

    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    setAccessToken('token-123');
    expect(getAccessToken()).toBe('token-123');
    expect(listener).toHaveBeenCalledTimes(1);

    // Setting same token does not re-notify
    setAccessToken('token-123');
    expect(listener).toHaveBeenCalledTimes(1);

    // Clear token
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);

    // Unsubscribe
    unsubscribe();
    setAccessToken('token-456');
    expect(listener).toHaveBeenCalledTimes(2);

    // Assert Storage.prototype.setItem was never called
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('scans all src/ files: localStorage and sessionStorage appear nowhere except inside test files (Test 16)', () => {
    const srcDir = path.resolve(process.cwd(), 'src');

    function scanDir(dir: string): string[] {
      const violations: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          violations.push(...scanDir(fullPath));
        } else if (entry.isFile()) {
          const isTestFile =
            entry.name.endsWith('.test.ts') ||
            entry.name.endsWith('.test.tsx') ||
            entry.name.endsWith('.spec.ts') ||
            entry.name.endsWith('.spec.tsx');

          if (!isTestFile) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('localStorage')) {
              violations.push(`${fullPath}: contains "localStorage"`);
            }
            if (content.includes('sessionStorage')) {
              violations.push(`${fullPath}: contains "sessionStorage"`);
            }
          }
        }
      }

      return violations;
    }

    const violations = scanDir(srcDir);
    expect(violations).toEqual([]);
  });
});
