import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { login as apiLogin, getMe } from "../api/auth";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isBuyer: boolean;
  isProvider: boolean;
  businessId: string | null;
  providerId: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setState({ user: null, loading: false, error: null });
      return;
    }
    try {
      const user = await getMe();
      setState({ user, loading: false, error: null });
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setState({ user: null, loading: false, error: null });
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await apiLogin(email, password);
        localStorage.setItem("access_token", res.access_token);
        localStorage.setItem("refresh_token", res.refresh_token);
        await refreshUser();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Login failed";
        setState((s) => ({ ...s, loading: false, error: message }));
        throw e;
      }
    },
    [refreshUser]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setState({ user: null, loading: false, error: null });
  }, []);

  const businessId =
    state.user?.memberships?.find(
      (m: { business_id?: string }) => m.business_id
    )?.business_id ?? null;
  const providerId =
    state.user?.memberships?.find(
      (m: { provider_id?: string }) => m.provider_id
    )?.provider_id ?? null;
  const isBuyer = !!businessId;
  const isProvider = !!providerId;

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    refreshUser,
    isBuyer,
    isProvider,
    businessId,
    providerId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
