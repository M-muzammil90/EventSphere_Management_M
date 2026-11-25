import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Role } from "./data";
import { fetchMe, logout as apiLogout, ROLE_HOME, ROLE_LABEL } from "./authService";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  company?: string;
  avatar?: string;
  jobTitle?: string;
  phone?: string;
  bio?: string;
  address?: string;
};

/** "live" = talking to the Express API · "demo" = mock data (backend offline) */
export type ApiMode = "live" | "demo";

type Toast = { id: number; title: string; body?: string; tone: "success" | "info" | "warn" | "danger" };

type StoreShape = {
  user: User | null;
  authMode: ApiMode;
  setAuthMode: (m: ApiMode) => void;
  login: (u: User, mode?: ApiMode) => void;
  logout: () => void;
  hydrating: boolean;

  bookmarks: string[];
  toggleBookmark: (id: string) => void;

  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;

  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
};

const StoreCtx = createContext<StoreShape | null>(null);
const LS_USER = "es-user";
const LS_MODE = "es-mode";

export { ROLE_HOME, ROLE_LABEL };

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<ApiMode>("demo");
  const [hydrating, setHydrating] = useState(true);
  const [bookmarks, setBookmarks] = useState<string[]>(["SS-01", "SS-04"]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /* ---------------------------- toasts ---------------------------- */
  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...t, id }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200);
  }, []);
  const dismiss = useCallback((id: number) => setToasts((p) => p.filter((x) => x.id !== id)), []);

  /* ---------------------------- session --------------------------- */
  const login = useCallback((u: User, mode: ApiMode = "demo") => {
    setUser(u);
    setAuthMode(mode);
    try {
      localStorage.setItem(LS_USER, JSON.stringify(u));
      localStorage.setItem(LS_MODE, mode);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    setAuthMode("demo");
    try {
      localStorage.removeItem(LS_USER);
      localStorage.removeItem(LS_MODE);
    } catch {
      /* ignore */
    }
  }, []);

  /* --------------------- restore on first load -------------------- */
  useEffect(() => {
    (async () => {
      // 1. try the live session (HttpOnly cookie)
      const me = await fetchMe();
      if (me) {
        setUser(me);
        setAuthMode("live");
        setHydrating(false);
        return;
      }
      // 2. fall back to a cached demo session
      try {
        const raw = localStorage.getItem(LS_USER);
        const mode = (localStorage.getItem(LS_MODE) as ApiMode) || "demo";
        if (raw) {
          setUser(JSON.parse(raw));
          setAuthMode(mode);
        }
      } catch {
        /* ignore */
      }
      setHydrating(false);
    })();
  }, []);

  /* --------------------------- bookmarks -------------------------- */
  const toggleBookmark = useCallback(
    (id: string) => {
      setBookmarks((prev) => {
        const has = prev.includes(id);
        toast(
          has
            ? { title: "Removed from your agenda", tone: "info" }
            : { title: "Session bookmarked", body: "We'll remind you 45 minutes before it starts.", tone: "success" }
        );
        return has ? prev.filter((x) => x !== id) : [...prev, id];
      });
    },
    [toast]
  );

  const value = useMemo(
    () => ({
      user, authMode, setAuthMode, login, logout, hydrating,
      bookmarks, toggleBookmark,
      toasts, toast, dismiss,
      sidebarCollapsed, setSidebarCollapsed,
    }),
    [user, authMode, login, logout, hydrating, bookmarks, toggleBookmark, toasts, toast, dismiss, sidebarCollapsed]
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

/* --------------------------- formatters --------------------------- */
export const fmt = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
};

export const money = (n: number) =>
  n >= 1000 ? "$" + (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "K" : "$" + n;
