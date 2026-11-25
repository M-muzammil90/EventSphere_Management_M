import { forwardRef, useEffect, useId, useMemo, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Role } from "@/lib/data";
import { useStore, ROLE_HOME, ROLE_LABEL } from "@/lib/store";
import {
  LOGIN_ROLES,
  REGISTER_ROLES,
  requestPasswordReset,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
} from "@/lib/authService";
import { Button, Checkbox, Field } from "@/components/ui";
import { Logo } from "@/components/SiteLayout";
import { cn } from "@/utils/cn";
import {
  AlertCircle, Building2, CheckCircle2, Eye, EyeOff,
  LayoutDashboard, Lock, Mail, MailCheck, Phone, User as UserIcon, Users,
} from "lucide-react";

type Mode = "login" | "register" | "forgot";

/* ------------------------------------------------------------------ */
/*  Role metadata — Admin is login-only, never offered on register.    */
/* ------------------------------------------------------------------ */
const ROLE_META: Record<string, { title: string; desc: string; icon: typeof Users }> = {
  organizer: { title: "Admin", desc: "Manage expos, floor plans, approvals and analytics.", icon: LayoutDashboard },
  exhibitor: { title: "Exhibitor", desc: "Reserve booths and manage your company, staff and leads.", icon: Building2 },
  attendee: { title: "Attendee", desc: "Find expos, save sessions and meet exhibitors.", icon: Users },
};

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/* ------------------------------------------------------------------ */
const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your email address")
  .max(254, "Email is too long")
  .email("Enter a valid email address, like name@company.com");

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean().optional(),
});

const COMMON_PASSWORDS = ["password", "12345678", "qwerty123", "iloveyou", "admin123", "welcome1", "letmein1"];

const makeRegisterSchema = (role: Role) =>
  z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(80, "Name must be 80 characters or fewer")
        // any language's letters, plus space . ' -
        .regex(/^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u, "Use letters, spaces, apostrophes, dots or hyphens only")
        .transform((v) => v.replace(/\s+/g, " ")),
      email: emailField,
      phone: z
        .string()
        .trim()
        .refine((v) => v === "" || /^\+?[0-9\s().-]+$/.test(v), "Use digits, spaces, + ( ) - only")
        .refine((v) => v === "" || (v.replace(/\D/g, "").length >= 7 && v.replace(/\D/g, "").length <= 15), "Phone number must have 7–15 digits"),
      company:
        role === "exhibitor"
          ? z.string().trim().min(2, "Enter your company name").max(140, "Company name is too long")
          : z.string().trim().max(140).optional(),
      jobTitle: z.string().trim().max(100, "Job title is too long").optional(),
      password: z
        .string()
        .min(8, "Use at least 8 characters")
        .max(72, "Use 72 characters or fewer")
        .regex(/[A-Z]/, "Add an uppercase letter")
        .regex(/[a-z]/, "Add a lowercase letter")
        .regex(/[0-9]/, "Add a number")
        .regex(/[^A-Za-z0-9]/, "Add a symbol, like ! @ # $")
        .refine((v) => !/\s/.test(v), "Password can't contain spaces")
        .refine((v) => !COMMON_PASSWORDS.some((c) => v.toLowerCase().includes(c)), "That password is too common"),
      confirm: z.string().min(1, "Re-enter your password"),
      terms: z.boolean().refine((v) => v === true, "Accept the terms to create an account"),
    })
    .superRefine((d, ctx) => {
      if (d.password !== d.confirm) {
        ctx.addIssue({ code: "custom", path: ["confirm"], message: "Passwords don't match" });
      }
      const local = d.email.split("@")[0];
      if (local.length >= 4 && d.password.toLowerCase().includes(local)) {
        ctx.addIssue({ code: "custom", path: ["password"], message: "Password can't contain your email name" });
      }
    });

const forgotSchema = z.object({ email: emailField });

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<ReturnType<typeof makeRegisterSchema>>;
type ForgotForm = z.infer<typeof forgotSchema>;

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */
const inputBase =
  "h-11 w-full rounded-lg border bg-white text-[14px] text-slate-900 outline-none transition placeholder:text-slate-400 " +
  "focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-slate-50";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  invalid?: boolean;
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { icon, invalid, className, ...rest },
  ref
) {
  return (
    <div className="relative">
      {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(inputBase, icon ? "pl-10" : "pl-3.5", "pr-3.5", invalid ? "border-rose-400" : "border-slate-300", className)}
        {...rest}
      />
    </div>
  );
});

const PasswordInput = forwardRef<HTMLInputElement, Omit<TextInputProps, "type" | "icon">>(function PasswordInput(
  { invalid, className, ...rest },
  ref
) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={ref}
        type={show ? "text" : "password"}
        aria-invalid={invalid || undefined}
        className={cn(inputBase, "pl-10 pr-11", invalid ? "border-rose-400" : "border-slate-300", className)}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
});

function PasswordChecklist({ value }: { value: string }) {
  const rules = [
    { ok: value.length >= 8, label: "8+ characters" },
    { ok: /[A-Z]/.test(value), label: "Uppercase letter" },
    { ok: /[a-z]/.test(value), label: "Lowercase letter" },
    { ok: /[0-9]/.test(value), label: "Number" },
    { ok: /[^A-Za-z0-9]/.test(value), label: "Symbol" },
  ];
  const score = rules.filter((r) => r.ok).length;
  const label = ["Too weak", "Too weak", "Weak", "Fair", "Good", "Strong"][score];
  const color = score >= 5 ? "bg-emerald-500" : score >= 4 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="-mt-1 space-y-2" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex h-1.5 flex-1 gap-1" aria-hidden>
          {rules.map((_, i) => (
            <span key={i} className={cn("flex-1 rounded-full transition-colors", i < score ? color : "bg-slate-200")} />
          ))}
        </div>
        <span className="w-14 text-right text-[12px] font-semibold text-slate-600">{label}</span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {rules.map((r) => (
          <li key={r.label} className={cn("flex items-center gap-1.5 text-[12px]", r.ok ? "text-emerald-700" : "text-slate-500")}>
            <CheckCircle2 className={cn("size-3.5 shrink-0", r.ok ? "opacity-100" : "opacity-40")} />
            {r.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Alert({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  const styles =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : "border-emerald-200 bg-emerald-50 text-emerald-900";
  const Icon = tone === "error" ? AlertCircle : MailCheck;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex items-start gap-2.5 rounded-lg border p-3.5 text-[13px] leading-snug", styles)}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Left panel — full-bleed event photo with rotating message          */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  Left artwork — event badges on lanyards (pure SVG, no image file)  */
/* ------------------------------------------------------------------ */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pixels that "dissolve" along the bottom edge of a badge's artwork. */
function dissolve(seed: number, w: number, y: number, cell = 14) {
  const r = rng(seed);
  const out: { x: number; y: number }[] = [];
  for (let cx = 0; cx < w / cell; cx++) {
    const depth = Math.floor(r() * 4); // 0..3 cells
    for (let d = 0; d <= depth; d++) if (r() > 0.18) out.push({ x: cx * cell, y: y + d * cell });
  }
  return out;
}

function Clasp({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 11} y={y - 70} width="22" height="62" rx="11" fill="url(#gold)" />
      <rect x={x - 5} y={y - 62} width="10" height="40" rx="5" fill="#0d0820" opacity="0.35" />
      <circle cx={x} cy={y - 2} r="14" fill="none" stroke="url(#gold)" strokeWidth="6" />
    </g>
  );
}

function AuthArt({ className }: { className?: string }) {
  const bg = useMemo(() => {
    const r = rng(7);
    const tones = ["#0a0618", "#160d38", "#22135a", "#2d1a73"];
    const cells: { x: number; y: number; c: string; o: number }[] = [];
    for (let gx = 0; gx < 20; gx++) {
      for (let gy = 0; gy < 30; gy++) {
        const p = Math.pow(gy / 30, 2.2) * 0.75;
        if (r() < p) cells.push({ x: gx * 30, y: gy * 30, c: tones[Math.floor(r() * tones.length)], o: 0.6 + r() * 0.4 });
      }
    }
    return cells;
  }, []);
  const pxA = useMemo(() => dissolve(11, 260, 262), []);
  const pxB = useMemo(() => dissolve(23, 270, 272), []);

  return (
    <svg viewBox="0 0 600 900" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label="Event badges for organizers and exhibitors">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0d0820" />
          <stop offset="0.55" stopColor="#1f1056" />
          <stop offset="1" stopColor="#4a2bb8" />
        </linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6e3b4" />
          <stop offset="0.5" stopColor="#c9a45c" />
          <stop offset="1" stopColor="#8d6a2c" />
        </linearGradient>
        <linearGradient id="artA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#47c9e8" />
          <stop offset="1" stopColor="#7a86ff" />
        </linearGradient>
        <linearGradient id="artB" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff9a2e" />
          <stop offset="0.55" stopColor="#f0527a" />
          <stop offset="1" stopColor="#6a3df0" />
        </linearGradient>
        <linearGradient id="strap" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#120a2e" />
          <stop offset="0.5" stopColor="#2a1a60" />
          <stop offset="1" stopColor="#120a2e" />
        </linearGradient>
        <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22" /></filter>
        <filter id="shadow" x="-20%" y="-10%" width="140%" height="130%"><feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#000" floodOpacity="0.55" /></filter>
        <filter id="grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0" />
        </filter>
        <clipPath id="clipA"><rect width="260" height="420" rx="18" /></clipPath>
        <clipPath id="clipB"><rect width="270" height="440" rx="18" /></clipPath>
      </defs>

      {/* background */}
      <rect width="600" height="900" fill="url(#bg)" />
      {bg.map((c, i) => <rect key={i} x={c.x} y={c.y} width="30" height="30" fill={c.c} opacity={c.o} />)}
      <ellipse cx="470" cy="180" rx="220" ry="180" fill="#6a3df0" opacity="0.28" filter="url(#soft)" />

      {/* ---------- badge A (behind) ---------- */}
      <path d="M150 -20 L169 262" stroke="url(#strap)" strokeWidth="38" fill="none" />
      <g transform="translate(60 250) rotate(-6 130 220)" filter="url(#shadow)">
        <g clipPath="url(#clipA)">
          <rect width="260" height="420" fill="#14102e" />
          <rect width="260" height="300" fill="url(#artA)" />
          <ellipse cx="70" cy="210" rx="90" ry="60" fill="#ff5fa2" opacity="0.85" filter="url(#soft)" />
          <ellipse cx="210" cy="60" rx="70" ry="50" fill="#5b3df5" opacity="0.7" filter="url(#soft)" />
          {pxA.map((p, i) => <rect key={i} x={p.x} y={p.y} width="14" height="14" fill="#14102e" />)}
          <rect x="0" y="262" width="260" height="0" />
          <text x="22" y="150" fill="#fff" fontSize="40" fontWeight="800" fontFamily="inherit" letterSpacing="-1">EXHIBITOR</text>
          <text x="22" y="182" fill="#fff" fontSize="22" fontWeight="300" fontFamily="inherit">BOOTH ACCESS</text>
          <text x="22" y="372" fill="#fff" fontSize="20" fontWeight="800" fontFamily="inherit">EventSphere</text>
          <text x="22" y="394" fill="#fff" fontSize="12" opacity="0.7" fontFamily="inherit">Expo Platform</text>
          <rect x="110" y="16" width="40" height="10" rx="5" fill="#0d0820" />
          <rect width="260" height="420" filter="url(#grain)" opacity="0.12" />
        </g>
      </g>
      <Clasp x={169} y={274} />

      {/* ---------- badge B (front) ---------- */}
      <path d="M420 -20 L402 342" stroke="url(#strap)" strokeWidth="38" fill="none" />
      <g transform="translate(250 330) rotate(5 135 220)" filter="url(#shadow)">
        <g clipPath="url(#clipB)">
          <rect width="270" height="440" fill="#14102e" />
          <rect width="270" height="310" fill="url(#artB)" />
          <ellipse cx="200" cy="230" rx="100" ry="60" fill="#47c9e8" opacity="0.6" filter="url(#soft)" />
          <ellipse cx="60" cy="40" rx="80" ry="50" fill="#ffd36b" opacity="0.7" filter="url(#soft)" />
          {pxB.map((p, i) => <rect key={i} x={p.x} y={p.y} width="14" height="14" fill="#14102e" />)}
          <text x="22" y="150" fill="#fff" fontSize="38" fontWeight="800" fontFamily="inherit" letterSpacing="-1">ORGANIZER</text>
          <text x="22" y="184" fill="#fff" fontSize="26" fontWeight="300" fontFamily="inherit">ALL ACCESS</text>
          <path d="M232 60 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 z" fill="#fff" />
          <text x="22" y="388" fill="#fff" fontSize="22" fontWeight="800" fontFamily="inherit">EventSphere</text>
          <text x="22" y="410" fill="#fff" fontSize="12" opacity="0.7" fontFamily="inherit">Expo Platform</text>
          <rect x="115" y="16" width="40" height="10" rx="5" fill="#0d0820" />
          <rect width="270" height="440" filter="url(#grain)" opacity="0.12" />
        </g>
      </g>
      <Clasp x={402} y={354} />
    </svg>
  );
}

function SidePanel() {
  return (
    <aside className="relative hidden bg-ink-950 lg:sticky lg:top-0 lg:block lg:h-screen">
      <AuthArt className="absolute inset-0 size-full" />
      <div className="relative p-12">
        <Logo light />
      </div>
    </aside>
  );
}

/** Only allow same-site relative paths — blocks open-redirect attacks. */
function safeRedirect(path: string | null): string | null {
  if (!path) return null;
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") ? path : null;
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */
export default function Auth({ mode }: { mode: Mode }) {
  const [params] = useSearchParams();
  const location = useLocation();
  const nav = useNavigate();
  const { login, toast, authMode } = useStore();
  const roleGroupId = useId();

  const availableRoles = (mode === "login" ? LOGIN_ROLES : REGISTER_ROLES) as Role[];
  const [role, setRole] = useState<Role>(availableRoles[0]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState<string | null>(null);

  const registeredEmail = params.get("registered") === "1" ? params.get("email") : null;
  const emailPreviewUrl = (location.state as { emailPreviewUrl?: string | null } | null)?.emailPreviewUrl;

  /* keep the selected role valid for the current mode / URL */
  useEffect(() => {
    const fromUrl = params.get("role") as Role | null;
    if (fromUrl && availableRoles.includes(fromUrl)) setRole(fromUrl);
    else if (!availableRoles.includes(role)) setRole(availableRoles[0]);
    setApiError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, params]);

  /* ------------------------------ forms ---------------------------- */
  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: registeredEmail ?? "", password: "", remember: true },
  });

  const registerSchema = useMemo(() => makeRegisterSchema(role), [role]);
  const regForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", phone: "", company: "", jobTitle: "", password: "", confirm: "", terms: false },
  });

  const forgotForm = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema), mode: "onTouched", defaultValues: { email: "" } });

  /* re-validate once when role changes so the "company" rule applies immediately */
  useEffect(() => {
    if (mode === "register" && regForm.formState.isSubmitted) void regForm.trigger("company");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const password = regForm.watch("password");
  const meta = ROLE_META[role];

  /* ---------------------------- handlers --------------------------- */
  async function onLogin(v: LoginForm) {
    setApiError(null);
    try {
      const res = await apiLogin({ email: v.email, password: v.password, role });
      login(res.user, res.mode);
      toast({
        title: `Welcome back, ${res.user.name.split(" ")[0]}`,
        body: res.mode === "live" ? `Signed in to the ${ROLE_LABEL[res.user.role]} portal` : "Backend offline — demo mode",
        tone: "success",
      });
      nav(safeRedirect(params.get("redirect")) ?? ROLE_HOME[res.user.role]);
    } catch (err: any) {
      setApiError(err?.message || (err instanceof Error && err.message) || "Couldn't sign you in. Check your details and try again.");
      loginForm.setValue("password", "");
      loginForm.setFocus("password");
    }
  }

  async function onRegister(v: RegisterForm) {
    setApiError(null);
    try {
      const res = await apiRegister({
        name: v.name,
        email: v.email,
        password: v.password,
        role,
        phone: v.phone || undefined,
        company: role === "exhibitor" ? v.company || undefined : undefined,
        jobTitle: role === "exhibitor" ? v.jobTitle || undefined : undefined,
      });
      // make the user sign in explicitly
      await apiLogout().catch(() => {});
      toast({ title: "Account created", body: `We sent a welcome email to ${v.email}. Sign in to continue.`, tone: "success" });
      nav(`/login?registered=1&email=${encodeURIComponent(v.email)}&role=${role}`, {
        state: { emailPreviewUrl: res.emailPreviewUrl || null },
      });
    } catch (err: any) {
      const message = err?.message || "Couldn't create your account. Try again.";
      // surface "email already used" next to the field instead of only at the top
      if (/already|exists|registered|taken/i.test(message)) {
        regForm.setError("email", { type: "server", message: "An account with this email already exists" });
        regForm.setFocus("email");
      } else {
        setApiError(message);
      }
    }
  }

  async function onForgot(v: ForgotForm) {
    setApiError(null);
    try {
      const res = await requestPasswordReset(v.email);
      setResetEmail(v.email);
      toast({
        title: "Check your email",
        body: res.mode === "live" ? "If that address has an account, a reset link is on its way." : "Backend offline — demo mode.",
        tone: "success",
      });
    } catch {
      setApiError("Couldn't send the reset link. Try again in a moment.");
    }
  }

  const isSubmitting =
    mode === "login" ? loginForm.formState.isSubmitting : mode === "register" ? regForm.formState.isSubmitting : forgotForm.formState.isSubmitting;

  /* ============================== render =========================== */
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr]">
      <SidePanel />

      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 pt-6 sm:px-10 lg:justify-end">
          <div className="lg:hidden"><Logo /></div>
          <Link
            to={mode === "login" ? "/register" : "/login"}
            className="inline-flex h-10 items-center rounded-full bg-ink-950 px-6 text-[13.5px] font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            {mode === "login" ? "Create account" : "Sign in"}
          </Link>
        </header>

        <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-6 py-10">
          <div className="w-full">
            <h1 className="text-[28px] font-bold tracking-tight text-slate-900">
              {mode === "login" ? "Welcome back" : mode === "register" ? "Create your account" : "Reset your password"}
            </h1>
            <p className="mt-1.5 text-[14px] text-slate-500">
              {mode === "login"
                ? "Sign in to your EventSphere account."
                : mode === "register"
                ? "Free for 14 days. No credit card needed."
                : "Enter your email and we'll send you a reset link."}
            </p>

          {/* ---------- role selector (segmented control) ---------- */}
          {mode !== "forgot" && (
            <div className="mt-6">
              <div role="radiogroup" aria-labelledby={roleGroupId} className="flex rounded-lg bg-slate-100 p-1">
                <span id={roleGroupId} className="sr-only">Account type</span>
                {availableRoles.map((r) => {
                  const m = ROLE_META[r];
                  const active = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => { setRole(r); setApiError(null); }}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      <m.icon className="size-4" />
                      {m.title}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[12.5px] text-slate-500">{meta.desc}</p>
            </div>
          )}

          {/* ---------- notices ---------- */}
          {mode === "login" && registeredEmail && (
            <div className="mt-5">
              <Alert tone="success">
                <p className="font-semibold">Account created</p>
                <p className="mt-0.5">
                  We sent a welcome email to <b>{registeredEmail}</b>. Sign in to open your dashboard.
                </p>
                {emailPreviewUrl && (
                  <a href={emailPreviewUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block font-semibold underline">
                    Preview the email
                  </a>
                )}
              </Alert>
            </div>
          )}
          {apiError && <div className="mt-5"><Alert tone="error">{apiError}</Alert></div>}

          {/* ======================= FORGOT: sent ======================= */}
          {mode === "forgot" && resetEmail ? (
            <div className="mt-6 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <MailCheck className="size-6" />
              </span>
              <h2 className="mt-4 text-[17px] font-bold text-slate-900">Check your email</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
                If <b>{resetEmail}</b> has an account, we've sent a link to reset your password. It expires in 30 minutes.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Button full onClick={() => nav("/login")}>Back to sign in</Button>
                <Button variant="ghost" size="sm" onClick={() => setResetEmail(null)}>Use a different email</Button>
              </div>
            </div>
          ) : (
            <>
              {/* ========================= LOGIN ========================= */}
              {mode === "login" && (
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="mt-6 space-y-4" noValidate>
                  <Field label="Email" required error={loginForm.formState.errors.email?.message}>
                    <TextInput
                      {...loginForm.register("email")}
                      type="email"
                      inputMode="email"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      autoFocus={!registeredEmail}
                      placeholder="you@company.com"
                      icon={<Mail className="size-4" />}
                      invalid={!!loginForm.formState.errors.email}
                      disabled={isSubmitting}
                    />
                  </Field>

                  <Field label="Password" required error={loginForm.formState.errors.password?.message}>
                    <PasswordInput
                      {...loginForm.register("password")}
                      autoComplete="current-password"
                      autoFocus={!!registeredEmail}
                      placeholder="Enter your password"
                      invalid={!!loginForm.formState.errors.password}
                      disabled={isSubmitting}
                    />
                  </Field>

                  <div className="flex items-center justify-between gap-3">
                    <Checkbox
                      checked={!!loginForm.watch("remember")}
                      onChange={(v: boolean) => loginForm.setValue("remember", v)}
                      label="Keep me signed in"
                    />
                    <Link to="/forgot-password" className="text-[13px] font-semibold text-brand-600 hover:text-brand-700">
                      Forgot password?
                    </Link>
                  </div>

                  <Button type="submit" full size="lg" loading={isSubmitting}>
                    Sign in
                  </Button>
                </form>
              )}

              {/* ======================= REGISTER ======================= */}
              {mode === "register" && (
                <form onSubmit={regForm.handleSubmit(onRegister)} className="mt-6 space-y-4" noValidate>
                  <Field label="Full name" required error={regForm.formState.errors.name?.message}>
                    <TextInput
                      {...regForm.register("name")}
                      autoComplete="name"
                      autoFocus
                      placeholder="Jane Cooper"
                      icon={<UserIcon className="size-4" />}
                      invalid={!!regForm.formState.errors.name}
                      disabled={isSubmitting}
                    />
                  </Field>

                  <Field label="Email" required error={regForm.formState.errors.email?.message}>
                    <TextInput
                      {...regForm.register("email")}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="jane@company.com"
                      icon={<Mail className="size-4" />}
                      invalid={!!regForm.formState.errors.email}
                      disabled={isSubmitting}
                    />
                  </Field>

                  <Field label="Phone" hint="Optional" error={regForm.formState.errors.phone?.message}>
                    <TextInput
                      {...regForm.register("phone")}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+92 300 1234567"
                      icon={<Phone className="size-4" />}
                      invalid={!!regForm.formState.errors.phone}
                      disabled={isSubmitting}
                    />
                  </Field>

                  {role === "exhibitor" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Company" required error={regForm.formState.errors.company?.message}>
                        <TextInput
                          {...regForm.register("company")}
                          autoComplete="organization"
                          placeholder="Nexora Cloud"
                          invalid={!!regForm.formState.errors.company}
                          disabled={isSubmitting}
                        />
                      </Field>
                      <Field label="Job title" hint="Optional" error={regForm.formState.errors.jobTitle?.message}>
                        <TextInput
                          {...regForm.register("jobTitle")}
                          autoComplete="organization-title"
                          placeholder="Marketing lead"
                          invalid={!!regForm.formState.errors.jobTitle}
                          disabled={isSubmitting}
                        />
                      </Field>
                    </div>
                  )}

                  <Field label="Password" required error={regForm.formState.errors.password?.message}>
                    <PasswordInput
                      {...regForm.register("password")}
                      autoComplete="new-password"
                      placeholder="Create a password"
                      invalid={!!regForm.formState.errors.password}
                      disabled={isSubmitting}
                    />
                  </Field>

                  {password.length > 0 && <PasswordChecklist value={password} />}

                  <Field label="Confirm password" required error={regForm.formState.errors.confirm?.message}>
                    <PasswordInput
                      {...regForm.register("confirm")}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      invalid={!!regForm.formState.errors.confirm}
                      disabled={isSubmitting}
                    />
                  </Field>

                  <div>
                    <Checkbox
                      checked={!!regForm.watch("terms")}
                      onChange={(v: boolean) => regForm.setValue("terms", v, { shouldValidate: true, shouldTouch: true })}
                      label={
                        <>
                          I agree to the <a href="/terms" className="font-semibold text-brand-600 hover:underline">Terms of Service</a> and{" "}
                          <a href="/privacy" className="font-semibold text-brand-600 hover:underline">Privacy Policy</a>.
                        </>
                      }
                    />
                    {regForm.formState.errors.terms && (
                      <p role="alert" className="mt-1.5 text-[12.5px] font-medium text-rose-600">
                        {regForm.formState.errors.terms.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" full size="lg" loading={isSubmitting}>
                    Create account
                  </Button>
                </form>
              )}

              {/* ====================== FORGOT PASSWORD ====================== */}
              {mode === "forgot" && (
                <form onSubmit={forgotForm.handleSubmit(onForgot)} className="mt-6 space-y-4" noValidate>
                  <Field label="Email" required error={forgotForm.formState.errors.email?.message}>
                    <TextInput
                      {...forgotForm.register("email")}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      autoFocus
                      placeholder="you@company.com"
                      icon={<Mail className="size-4" />}
                      invalid={!!forgotForm.formState.errors.email}
                      disabled={isSubmitting}
                    />
                  </Field>
                  <Button type="submit" full size="lg" loading={isSubmitting}>
                    Send reset link
                  </Button>
                </form>
              )}
            </>
          )}
        </div>

        {authMode === "demo" && (
          <p className="mt-3 text-center text-[12px] text-slate-400">Backend offline — running in demo mode.</p>
        )}
      </main>
      </div>
    </div>
  );
}