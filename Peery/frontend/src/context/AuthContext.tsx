/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as authApi from '../api/authApi.ts';
import { LOGOUT_EVENT, TOKEN_KEY } from '../api/axiosClient.ts';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth.ts';

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  // If a token exists we must confirm it with the backend before rendering guarded routes.
  const [loading, setLoading] = useState<boolean>(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  // Restore the session on first load.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return undefined;

    let cancelled = false;
    authApi
      .getMe()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // The axios interceptor fires this when a protected call returns 401.
  useEffect(() => {
    const handleForcedLogout = () => setUser(null);
    window.addEventListener(LOGOUT_EVENT, handleForcedLogout);
    return () => window.removeEventListener(LOGOUT_EVENT, handleForcedLogout);
  }, []);

  const startSession = useCallback(({ token, user: sessionUser }: AuthResponse): User => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(sessionUser);
    return sessionUser;
  }, []);

  const login = useCallback(
    async (credentials: LoginPayload): Promise<User> =>
      startSession(await authApi.login(credentials)),
    [startSession],
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<User> =>
      startSession(await authApi.register(payload)),
    [startSession],
  );

  const logout = useCallback((): void => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, isAuthenticated: Boolean(user), login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}