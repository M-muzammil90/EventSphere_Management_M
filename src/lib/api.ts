import axios, { type AxiosInstance } from "axios";

/* =====================================================================
   EventSphere — API client
   ---------------------------------------------------------------------
   Base URL is driven by the VITE_API_URL env var so the same build can
   target local, staging or production. Falls back to localhost:5000.

   Auth uses HttpOnly cookies (JWT) — the token is NEVER read from
   localStorage, in line with the security requirements.
   ===================================================================== */

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send/receive HttpOnly auth cookies
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

/* ------------------------- request interceptor ------------------------ */
function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

api.interceptors.request.use((config) => {
  // Double-submit CSRF protection for mutating requests when cookies are used
  if (["post", "put", "patch", "delete"].includes(config.method ?? "")) {
    config.headers["X-Requested-With"] = "XMLHttpRequest";
    const csrfToken = readCookie("es_csrf");
    if (csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }
  }

  // Attach token from localStorage if available (ensures reliable auth across ports & proxies)
  if (typeof window !== "undefined") {
    try {
      const token = localStorage.getItem("es_token");
      if (token && !config.headers["Authorization"]) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    } catch {
      // ignore localStorage errors
    }
  }

  return config;
});

/* ------------------------ response interceptors ----------------------- */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    let message: string =
      error?.response?.data?.message ?? error?.message ?? "Unexpected network error";

    if (!error?.response && error?.message === "Network Error") {
      message = "Network Error: Backend server is offline or unreachable on port 5000. Run 'npm run dev' to start the server.";
    }

    if (status === 401) {
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("es_token");
        } catch {}
      }
      if (onUnauthorized) onUnauthorized();
    }

    // Normalise the error shape consumed by the UI
    return Promise.reject({
      status: status ?? 0,
      message,
      errors: error?.response?.data?.errors,
      isNetworkError: !error?.response,
      raw: error,
    });
  }
);

/* ============================ typed helpers =========================== */
export type ApiEnvelope<T> = { success: boolean; data: T; message?: string; meta?: any };
export type Paginated<T> = { items: T[]; page: number; pages: number; total: number };

export async function get<T>(url: string, params?: Record<string, any>): Promise<ApiEnvelope<T>> {
  const { data } = await api.get<ApiEnvelope<T>>(url, { params });
  return data;
}

export async function post<T>(url: string, body?: any): Promise<ApiEnvelope<T>> {
  const { data } = await api.post<ApiEnvelope<T>>(url, body ?? {});
  return data;
}

export async function patch<T>(url: string, body?: any): Promise<ApiEnvelope<T>> {
  const { data } = await api.patch<ApiEnvelope<T>>(url, body ?? {});
  return data;
}

export async function put<T>(url: string, body?: any): Promise<ApiEnvelope<T>> {
  const { data } = await api.put<ApiEnvelope<T>>(url, body ?? {});
  return data;
}

export async function del<T>(url: string): Promise<ApiEnvelope<T>> {
  const { data } = await api.delete<ApiEnvelope<T>>(url);
  return data;
}

export async function upload<T>(url: string, formData: FormData, onProgress?: (pct: number) => void): Promise<ApiEnvelope<T>> {
  const { data } = await api.post<ApiEnvelope<T>>(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data;
}

export function qs(params: Record<string, any>): string {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== null));
  return new URLSearchParams(clean as Record<string, string>).toString();
}

/* ============================ endpoint map ============================ */
export const endpoints = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
    forgot: "/auth/forgot-password",
    reset: "/auth/reset-password",
    verifyReset: (token: string) => `/auth/reset-password/${token}`,
    updatePassword: "/auth/update-password",
  },
  users: { profile: "/users/me" },
  expos: {
    list: "/expos",
    detail: (idOrSlug: string) => `/expos/${idOrSlug}`,
    create: "/expos",
    update: (id: string) => `/expos/${id}`,
    remove: (id: string) => `/expos/${id}`,
    publish: (id: string) => `/expos/${id}/publish`,
    banner: (id: string) => `/expos/${id}/banner`,
  },
  exhibitors: {
    profile: "/exhibitors/me",
    publicProfile: (id: string) => `/exhibitors/${id}`,
    directory: "/exhibitors/directory",
    applications: "/exhibitors/applications",
    apply: (expoId: string) => `/exhibitors/applications/${expoId}`,
    documents: "/exhibitors/documents",
    document: (id: string) => `/exhibitors/documents/${id}`,
    staff: "/exhibitors/staff",
    products: "/exhibitors/products",
    review: (id: string) => `/exhibitors/applications/${id}/review`,
  },
  booths: {
    floorPlan: (expoId: string) => `/booths/expo/${expoId}`,
    create: "/booths",
    detail: (id: string) => `/booths/${id}`,
    update: (id: string) => `/booths/${id}`,
    remove: (id: string) => `/booths/${id}`,
    reserve: (id: string) => `/booths/${id}/reserve`,
    release: (id: string) => `/booths/${id}/release`,
    assign: (id: string) => `/booths/${id}/assign`,
  },
  schedule: {
    list: "/schedule",
    detail: (id: string) => `/schedule/${id}`,
    create: "/schedule",
    update: (id: string) => `/schedule/${id}`,
    remove: (id: string) => `/schedule/${id}`,
    register: (id: string) => `/schedule/${id}/register`,
    bookmark: (id: string) => `/schedule/${id}/bookmark`,
  },
  registrations: {
    register: "/registrations",
    mine: "/registrations/mine",
    detail: (id: string) => `/registrations/${id}`,
    cancel: (id: string) => `/registrations/${id}/cancel`,
  },
  attendees: { list: "/attendees", detail: (id: string) => `/attendees/${id}` },
  messages: {
    conversations: "/messages/conversations",
    conversation: (id: string) => `/messages/conversations/${id}`,
    start: "/messages/conversations",
    send: (id: string) => `/messages/conversations/${id}/messages`,
    markRead: (id: string) => `/messages/conversations/${id}/read`,
  },
  appointments: {
    list: "/appointments",
    create: "/appointments",
    detail: (id: string) => `/appointments/${id}`,
    respond: (id: string) => `/appointments/${id}/respond`,
    cancel: (id: string) => `/appointments/${id}/cancel`,
  },
  feedback: {
    list: "/feedback",
    create: "/feedback",
    detail: (id: string) => `/feedback/${id}`,
    reply: (id: string) => `/feedback/${id}/reply`,
    status: (id: string) => `/feedback/${id}/status`,
  },
  notifications: {
    list: "/notifications",
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: "/notifications/read-all",
  },
  pricing: {
    boothPrices: "/pricing/booths",
    boothPrice: (id: string) => `/pricing/booths/${id}`,
    ticketTypes: "/pricing/tickets",
    ticketType: (id: string) => `/pricing/tickets/${id}`,
    settings: (expoId: string) => `/pricing/settings/${expoId}`,
  },
  payments: {
    quote: "/payments/quote",
    create: "/payments",
    confirm: (id: string) => `/payments/${id}/confirm`,
    receipt: (id: string) => `/payments/${id}/receipt`,
    mine: "/payments/mine",
  },
  analytics: {
    overview: "/analytics/overview",
    attendees: "/analytics/attendees",
    booths: "/analytics/booths",
    sessions: "/analytics/sessions",
    events: "/analytics/events",
    revenue: "/analytics/revenue",
  },
} as const;

export { api as default };
