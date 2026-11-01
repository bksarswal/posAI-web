'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getAccessToken, subscribe } from '@/shared/lib/tokenStorage';
import {
  refreshSession,
  registerAuthHandlers,
  type SessionEndedReason,
} from '@/shared/lib/authSession';

export interface AuthContextValue {
  isInitialized: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  isInitialized: false,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const hasRefreshedRef = useRef(false);

  // Synchronously subscribe to the in-memory access token state
  const isAuthenticated = useSyncExternalStore(
    subscribe,
    () => getAccessToken() !== null,
    () => false,
  );

  // Register and keep handlers up to date with the latest router and queryClient references
  useEffect(() => {
    registerAuthHandlers({
      onSessionEnded: (reason: SessionEndedReason) => {
        queryClient.clear();
        const message =
          reason === 'reused'
            ? 'Signed in on another device'
            : 'Your session ended. Please log in again.';
        toast.error(message);
        router.push('/login');
      },
      onPasswordChangeRequired: () => {
        router.push('/change-password?forced=true');
      },
    });
  }, [router, queryClient]);

  // Single-flight refresh attempt on initial mount for silent login via httpOnly cookie
  useEffect(() => {
    if (hasRefreshedRef.current) {
      return;
    }
    hasRefreshedRef.current = true;

    refreshSession()
      .catch(() => {
        // Failing silent refresh is expected when unauthenticated
      })
      .finally(() => {
        setIsInitialized(true);
      });
  }, []);

  return (
    <AuthContext.Provider value={{ isInitialized, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Access the global authentication state:
 * - isInitialized: true after the initial silent session check completes
 * - isAuthenticated: true if an in-memory access token currently exists
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
