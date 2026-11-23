import { endpoints, get, post, API_BASE_URL } from "./api";
import type { Role } from "./data";

/* =====================================================================
   Auth service — talks to the Express API.
   ---------------------------------------------------------------------
   When the backend is unreachable the service falls back to DEMO mode so
   the UI remains explorable. `lastMode` tells the UI which one was used
   so it can be honest about it rather than silently faking a login.
   ===================================================================== */

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  company?: string;
  avatar?: string;
  jobTitle?: string;
};

export type AuthResult = {
  user: SessionUser;
  mode: "live" | "demo";
  message?: string;
};

const DEMO_ACCOUNTS: Record<Role, { name: string; email: string; company: string; avatar: string }> = {
  admin: {
    name: "EventSphere Owner",
    email: "admin@eventsphere.io",
    company: "EventSphere Management",
    avatar: "https://images.pexels.com/photos/6497112/pexels-photo-6497112.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
  },
  organizer: {
    name: "Sarah Whitfield",
    email: "admin@eventsphere.io",
    company: "EventSphere Management",
    avatar: "https://images.pexels.com/photos/6497112/pexels-photo-6497112.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
  },
  exhibitor: {
    name: "Amara Osei",
    email: "amara@nexoracloud.com",
    company: "Nexora Cloud",
    avatar: "https://images.pexels.com/photos/7752822/pexels-photo-7752822.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
  },
  attendee: {
    name: "Elena Marsh",
    email: "elena@northwindretail.com",
    company: "Northwind Retail",
    avatar: "https://images.pexels.com/photos/7752805/pexels-photo-7752805.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
  },
};

export const ROLE_HOME: Record<Role, string> = {
  admin: "/admin",
  organizer: "/admin",
  exhibitor: "/portal",
  attendee: "/attendee",
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin / Organizer",
  organizer: "Admin / Organizer",
  exhibitor: "Exhibitor",
  attendee: "Attendee",
};

/** Roles a user may pick when signing in. Admin login is allowed — only
 *  public *registration* as Admin is blocked. */
export const LOGIN_ROLES: Role[] = ["organizer", "exhibitor", "attendee"];
/** Roles offered on the public registration form. */
export const REGISTER_ROLES: Role[] = ["exhibitor", "attendee"];

/* ------------------------------- helpers ----------------------------- */
const mapUser = (u: any): SessionUser => ({
  id: u._id ?? u.id,
  name: u.name,
  email: u.email,
  role: (u.role === "admin" || u.role === "organizer" ? "organizer" : u.role) as Role,
  company: u.company ?? u.jobTitle,
  avatar: u.avatar,
  jobTitle: u.jobTitle,
});

/* --------------------------- backend reachable? ---------------------- */
let backendCheckedTime = 0;
let backendOnline = false;

export async function isBackendOnline(force = false): Promise<boolean> {
  const now = Date.now();
  if (!force && backendCheckedTime > 0 && now - backendCheckedTime < 5000) {
    return backendOnline;
  }
  try {
    const res = await fetch(`${API_BASE_URL.replace(/\/api\/v1$/, "")}/api/health`, {
      signal: AbortSignal.timeout(2500),
    });
    backendOnline = res.ok;
  } catch {
    backendOnline = false;
  }
  backendCheckedTime = now;
  return backendOnline;
}

/* ================================ LOGIN ============================== */
export async function login(payload: { email: string; password: string; role: Role }): Promise<AuthResult> {
  try {
    const { data } = await post<{ user: any; token: string }>(endpoints.auth.login, {
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    });

    if (data?.token && typeof window !== "undefined") {
      try {
        localStorage.setItem("es_token", data.token);
      } catch {}
    }

    const user = mapUser(data.user);
    // Guard: the selected portal must match the account's actual role
    if (user.role !== payload.role) {
      throw Object.assign(new Error(`This account is registered as a ${ROLE_LABEL[user.role]}. Switch the role selector to continue.`), { status: 403 });
    }
    return { user, mode: "live" };
  } catch (err: any) {
    // A real rejection from the server (bad password, wrong role) must surface
    if (err?.status && err.status >= 400 && err.status < 500) throw err;

    // Backend unreachable → demo mode
    const demo = DEMO_ACCOUNTS[payload.role];
    if (!payload.password || payload.password.length < 6) {
      throw Object.assign(new Error("Incorrect email or password"), { status: 401 });
    }
    return {
      user: {
        id: `demo-${payload.role}`,
        name: demo.name,
        email: payload.email || demo.email,
        role: payload.role,
        company: demo.company,
        avatar: demo.avatar,
      },
      mode: "demo",
      message: "Backend offline — signed in with demo data.",
    };
  }
}

/* ============================== REGISTER ============================= */
export async function register(payload: {
  name: string;
  email: string;
  password: string;
  role: Role;
  company?: string;
  jobTitle?: string;
  phone?: string;
}): Promise<AuthResult> {
  try {
    const { data } = await post<{ user: any; token: string }>(endpoints.auth.register, {
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      passwordConfirm: payload.password,
      role: payload.role,
      company: payload.company,
      jobTitle: payload.jobTitle,
      phone: payload.phone,
      consent: true,
    });

    if (data?.token && typeof window !== "undefined") {
      try {
        localStorage.setItem("es_token", data.token);
      } catch {}
    }

    return { user: mapUser(data.user), mode: "live" };
  } catch (err: any) {
    if (err?.status && err.status >= 400 && err.status < 500) throw err;

    const demo = DEMO_ACCOUNTS[payload.role];
    return {
      user: {
        id: `demo-${payload.role}-${Date.now()}`,
        name: payload.name || demo.name,
        email: payload.email || demo.email,
        role: payload.role,
        company: payload.company || demo.company,
        avatar: demo.avatar,
      },
      mode: "demo",
      message: "Backend offline — account created in demo mode.",
    };
  }
}

/* ================================ ME ================================= */
export async function fetchMe(): Promise<SessionUser | null> {
  try {
    const { data } = await get<{ user: any }>(endpoints.auth.me);
    return mapUser(data.user);
  } catch {
    return null;
  }
}

/* ============================== LOGOUT =============================== */
export async function logout(): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("es_token");
    } catch {}
  }
  try {
    await post(endpoints.auth.logout);
  } catch {
    /* cookie is cleared client-side regardless */
  }
}

/* ========================= FORGOT / RESET ============================ */
export async function requestPasswordReset(email: string) {
  try {
    await post(endpoints.auth.forgot, { email: email.trim().toLowerCase() });
    return { mode: "live" as const };
  } catch (err: any) {
    if (err?.status && err.status >= 400 && err.status < 500) throw err;
    return { mode: "demo" as const };
  }
}

export async function resetPassword(token: string, password: string) {
  try {
    await post(`/auth/reset-password/${token}`, { password, passwordConfirm: password });
    return { mode: "live" as const };
  } catch (err: any) {
    if (err?.status && err.status >= 400 && err.status < 500) throw err;
    return { mode: "demo" as const };
  }
}

export async function verifyResetToken(token: string): Promise<boolean> {
  try {
    await get(endpoints.auth.verifyReset(token));
    return true;
  } catch {
    return false;
  }
}

export { DEMO_ACCOUNTS };
