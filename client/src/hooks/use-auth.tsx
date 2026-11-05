import axios, { AxiosError } from "axios";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface AuthUser {
  user_id: string;
  user_name: string;
  email: string;
  phone: string | null;
  email_verified: boolean;
  phone_verified: boolean;
}

interface RegisterInput {
  user_name: string;
  email: string;
  password: string;
  phone?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AUTH_SERVER_URL = import.meta.env.VITE_AUTH_SERVER_URL;
const STORED_USER_KEY = "mxanime.auth.user";

const authApi = axios.create({
  baseURL: AUTH_SERVER_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    if (error.response?.status === 409) return "An account with that email already exists.";
    if (error.response?.status === 406) return "The account details are not valid.";
    if (error.response?.status === 401) return "Invalid email or password.";
    if (typeof error.response?.data === "string" && error.response.data) {
      return error.response.data;
    }
  }
  if (error instanceof Error) return error.message;
  return "The authentication request failed.";
}

function sanitizeUser(user: Partial<AuthUser>): AuthUser {
  return {
    user_id: user.user_id ?? "",
    user_name: user.user_name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? null,
    email_verified: Boolean(user.email_verified),
    phone_verified: Boolean(user.phone_verified),
  };
}

function persistUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(STORED_USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORED_USER_KEY);
}

function clearAuthCookies() {
  for (const name of ["access_token", "refresh_token"]) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(
    AUTH_SERVER_URL ? null : "VITE_AUTH_SERVER_URL is not configured.",
  );

  useEffect(() => {
    if (!AUTH_SERVER_URL) {
      setIsLoading(false);
      return;
    }

    const stored = localStorage.getItem(STORED_USER_KEY);
    if (stored) {
      try {
        setUser(sanitizeUser(JSON.parse(stored)));
      } catch {
        localStorage.removeItem(STORED_USER_KEY);
      }
    }

    authApi
      .get("/client/refresh")
      .catch((requestError: unknown) => {
        if (requestError instanceof AxiosError && requestError.response?.status === 401) {
          setUser(null);
          persistUser(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const runAuth = useCallback(
    async (request: () => Promise<{ data: Partial<AuthUser> }>) => {
      setError(null);
      setIsLoading(true);
      try {
        const response = await request();
        const nextUser = sanitizeUser(response.data);
        if (!nextUser.user_id || !nextUser.email) {
          throw new Error("The auth server returned an invalid user.");
        }
        setUser(nextUser);
        persistUser(nextUser);
      } catch (requestError) {
        const message = getErrorMessage(requestError);
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      setError(null);
      setIsLoading(true);
      try {
        await authApi.post("/client/register", input);
        const response = await authApi.post<Partial<AuthUser>>(
          "/client/login",
          { email: input.email, password: input.password },
        );
        const nextUser = sanitizeUser(response.data);
        if (!nextUser.user_id || !nextUser.email) {
          throw new Error("The auth server returned an invalid user.");
        }
        setUser(nextUser);
        persistUser(nextUser);
      } catch (requestError) {
        const message = getErrorMessage(requestError);
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const login = useCallback(
    (input: LoginInput) =>
      runAuth(() => authApi.post<Partial<AuthUser>>("/client/login", input)),
    [runAuth],
  );

  const logout = useCallback(() => {
    clearAuthCookies();
    setUser(null);
    persistUser(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, error, register, login, logout, clearError: () => setError(null) }),
    [user, isLoading, error, register, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
