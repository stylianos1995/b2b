import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type UserRole = "business" | "provider" | null;

interface AuthState {
  role: UserRole;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  setRole: (role: UserRole) => void;
  setAuthenticated: (value: boolean) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ROLE_STORAGE_KEY = "b2b_selected_role";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => {
    try {
      const stored = localStorage.getItem(ROLE_STORAGE_KEY);
      return stored === "business" || stored === "provider" ? stored : null;
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setAuthenticated] = useState(false);

  const setRole = useCallback((newRole: UserRole) => {
    setRoleState(newRole);
    if (newRole) localStorage.setItem(ROLE_STORAGE_KEY, newRole);
    else localStorage.removeItem(ROLE_STORAGE_KEY);
  }, []);

  const clearAuth = useCallback(() => {
    setRoleState(null);
    setAuthenticated(false);
    localStorage.removeItem(ROLE_STORAGE_KEY);
  }, []);

  const value: AuthContextValue = {
    role,
    isAuthenticated,
    setRole,
    setAuthenticated,
    clearAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
