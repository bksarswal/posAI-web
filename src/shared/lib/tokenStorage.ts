/**
 * In-memory token storage.
 * The access token lives in module memory only (never written to browser storage or cookies).
 */

type TokenListener = () => void;

let accessToken: string | null = null;
const listeners = new Set<TokenListener>();

/**
 * Returns the current in-memory access token, or null if unauthenticated.
 */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Updates the in-memory access token and notifies all active subscribers.
 */
export function setAccessToken(token: string | null): void {
  if (accessToken === token) {
    return;
  }
  accessToken = token;
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error('Error notifying token listener', err);
    }
  });
}

/**
 * Subscribes to token changes (usable with React's useSyncExternalStore).
 * Returns an unsubscribe cleanup function.
 */
export function subscribe(listener: TokenListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
