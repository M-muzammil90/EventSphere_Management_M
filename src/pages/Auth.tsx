import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MEDIA, PARTNERS, type Role } from "@/lib/data";
import { useStore, ROLE_HOME, ROLE_LABEL } from "@/lib/store";
import { LOGIN_ROLES, REGISTER_ROLES, requestPasswordReset, login as apiLogin, register as apiRegister, DEMO_ACCOUNTS } from "@/lib/authService";
import { Badge, Button, Checkbox, Field, Progress } from "@/components/ui";
import { Logo } from "@/components/SiteLayout";
import { cn } from "@/utils/cn";
import {
  ArrowLeft, ArrowRight, BadgeCheck, Building2, CheckCircle2, Eye, EyeOff, KeyRound,
  LayoutDashboard, Lock, Mail, MailCheck, ShieldCheck, Sparkles, User as UserIcon, Users, WifiOff,
} from "lucide-react";

type Mode = "login" | "register" | "forgot";

/* ------------------------------------------------------------------ */
/*  Role cards — Admin appears on LOGIN only, never on registration.  */
/* ------------------------------------------------------------------ */
const ROLE_META: Record<string, { title: string; short: string; desc: string; icon: any; tone: string }> = {
  organizer: {
    title: "Admin / Organizer",
    short: "Admin",
    desc: "Full control: expos, floor plans, approvals, pricing and analytics.",
    icon: LayoutDashboard,
    tone: "from-brand-500 to-brand-700",
  },
  exhibitor: {
    title: "Exhibitor",
    short: "Exhibitor",
    desc: "Reserve booths, manage your company profile, staff and leads.",
    icon: Building2,
    tone: "from-aqua-500 to-aqua-600",
  },
  attendee: {
    title: "Attendee",
    short: "Attendee",
    desc: "Discover expos, bookmark sessions and connect with exhibitors.",
    icon: Users,
    tone: "from-flame-400 to-flame-500",
  },
};

/* ------------------------------ schemas ---------------------------- */
const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name").max(80),
    email: z.string().trim().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[0-9]/, "Include a number"),
    confirm: z.string().min(1, "Confirm your password"),
    company: z.string().trim().max(140).optional().or(z.literal("")),
    jobTitle: z.string().trim().max(100).optional().or(z.literal("")),
    terms: z.literal(true, { message: "You must accept the terms to continue" }),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

const forgotSchema = z.object({ email: z.string().trim().email("Enter a valid email address") });

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type ForgotForm = z.infer<typeof forgotSchema>;

/* ============================ side panel =========================== */
function SidePanel({ mode }: { mode: Mode }) {
  const bullets =
    mode === "register"
      ? ["Free 14-day trial — no card required", "Unlimited team members on every plan", "Booth & inventory tools included", "Export your data any time"]
      : mode === "forgot"
      ? ["Reset links expire after 30 minutes", "Each link works exactly once", "We never email your existing password", "All other sessions stay signed in"]
      : ["Bank-grade TLS 1.3 encryption in transit", "Passwords hashed with bcrypt — never stored raw", "GDPR-compliant handling & consent controls", "Role-based access with audit logging"];

  return (
    <div className="relative hidden overflow-hidden bg-ink-950 lg:block">
      <video autoPlay loop muted playsInline poster={MEDIA.heroPoster} className="absolute inset-0 size-full object-cover opacity-25">
        <source src={MEDIA.conferenceVideo} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-br from-ink-950/94 via-ink-950/85 to-brand-800/55" />
      <div className="pointer-events-none absolute inset-0 grid-noise-dark opacity-45" />
      <div className="pointer-events-none absolute -left-24 bottom-0 size-[400px] rounded-full bg-brand-600/22 blur-[110px]" />
      <div className="pointer-events-none absolute -right-24 top-0 size-[400px] rounded-full bg-brand-400/14 blur-[110px]" />

      <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
        <Logo light />

        <div>
          <Badge tone="brand" className="bg-white/10 text-brand-200 ring-white/15">
            <Sparkles className="size-3" /> Trusted by 480 event teams
          </Badge>
          <h2 className="mt-6 font-display text-[32px] font-extrabold leading-[1.12] tracking-[-0.03em] text-white">
            {mode === "forgot" ? "Locked out?" : mode === "register" ? "Start your" : "One platform."}
            <br />
            <span className="text-gradient">
              {mode === "forgot" ? "Let's fix that." : mode === "register" ? "free trial." : "Every role. Every expo."}
            </span>
          </h2>
          <ul className="mt-8 space-y-3.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[13.5px] text-slate-300">
                <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-emerald-400" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur">
            <div className="flex gap-1.5">
              {[42, 68, 51, 88, 57, 96, 74].map((h, i) => (
                <div key={i} className="flex-1">
                  <div className="rounded-t-sm bg-gradient-to-t from-brand-600/40 to-brand-400" style={{ height: h }} />
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              {[
                { v: "3.2M", l: "Check-ins" },
                { v: "99.9%", l: "Uptime" },
              ].map((s) => (
                <div key={s.l}>
                  <p className="font-display text-[22px] font-bold text-white">{s.v}</p>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/45">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {PARTNERS.slice(0, 5).map((p) => (
            <span key={p} className="font-display text-[13px] font-bold tracking-tight text-white/25">{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================== page =============================== */
export default function Auth({ mode }: { mode: Mode }) {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { login, toast, authMode } = useStore();

  const availableRoles: Role[] = mode === "login" ? LOGIN_ROLES : REGISTER_ROLES;
  const [role, setRole] = useState<Role>(availableRoles[0] as Role);
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  /* keep the selected role valid for the current mode */
  useEffect(() => {
    const r = params.get("role") as Role | null;
    if (r && availableRoles.includes(r)) {
      setRole(r);
    } else if (!availableRoles.includes(role)) {
      setRole(availableRoles[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, params]);

  /* ------------------------------ forms ---------------------------- */
  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { remember: true } });
  const regForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });
  const forgotForm = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) });

  const pw = regForm.watch("password") ?? "";
  const strength = useMemo(
    () => [/.{8,}/, /[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length * 20,
    [pw]
  );

  /* ---------------------------- handlers --------------------------- */
  async function onLogin(v: LoginForm) {
    setApiError(null);
    setBusy(true);
    try {
      const res = await apiLogin({ email: v.email, password: v.password, role: role as Role });
      login(res.user, res.mode);
      toast({
        title: `Welcome back, ${res.user.name.split(" ")[0]}`,
        body: res.mode === "live" ? `Signed in to the ${ROLE_LABEL[res.user.role]} portal` : "Backend offline — demo mode",
        tone: "success",
      });

      const redirectParam = params.get("redirect");
      if (redirectParam) {
        nav(redirectParam);
        return;
      }

      nav(ROLE_HOME[res.user.role]);
    } catch (err: any) {
      setApiError(err?.message ?? "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  async function onRegister(v: RegisterForm) {
    setApiError(null);
    setBusy(true);
    try {
      const res = await apiRegister({
        name: v.name, email: v.email, password: v.password,
        role: role as Role, company: v.company || undefined, jobTitle: v.jobTitle || undefined,
      });
      login(res.user, res.mode);
      toast({
        title: "Account created successfully",
        body: res.mode === "live" ? `Welcome to EventSphere, ${res.user.name.split(" ")[0]}` : "Backend offline — demo mode",
        tone: "success",
      });

      const redirectParam = params.get("redirect");
      if (redirectParam) {
        nav(redirectParam);
        return;
      }

      nav(ROLE_HOME[res.user.role]);
    } catch (err: any) {
      setApiError(err?.message ?? "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  async function onForgot(v: ForgotForm) {
    setApiError(null);
    setBusy(true);
    const res = await requestPasswordReset(v.email);
    setBusy(false);
    setResetSent(true);
    toast({
      title: "Reset link sent",
      body: res.mode === "live" ? `Check ${v.email} for instructions.` : "Backend offline — demo mode.",
      tone: "success",
    });
  }

  const meta = ROLE_META[role];

  /* ============================== render =========================== */
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr]">
      <SidePanel mode={mode} />

      <div className="flex flex-col justify-center px-5 py-10 sm:px-10 xl:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden"><Logo /></div>

          <Link to="/" className="mt-6 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500 transition hover:text-slate-800 lg:mt-0">
            <ArrowLeft className="size-3.5" /> Back to home
          </Link>

          <h1 className="mt-5 font-display text-[28px] font-extrabold tracking-[-0.025em] text-slate-900 sm:text-[32px]">
            {mode === "login" ? "Sign in to EventSphere" : mode === "register" ? "Create your account" : "Reset your password"}
          </h1>
          <p className="mt-2 text-[14px] text-slate-500">
            {mode === "login"
              ? "Choose your portal — each one is tailored to that role."
              : mode === "register"
              ? "Free for 14 days. No credit card, no setup fees."
              : "We'll email you a secure link to set a new password."}
          </p>

          {/* ----------------- role selector ----------------- */}
          {mode !== "forgot" && (
            <>
              <div className={cn("mt-7 grid gap-2.5", mode === "login" ? "grid-cols-3" : "grid-cols-2")}>
                {availableRoles.map((r) => {
                  const m = ROLE_META[r];
                  const active = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => { setRole(r); setApiError(null); }}
                      className={cn(
                        "group relative rounded-2xl border-2 p-3 text-left transition-all duration-200",
                        active ? "border-brand-500 bg-brand-50/60 shadow-sm" : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <span className={cn("grid size-8 place-items-center rounded-xl bg-gradient-to-br text-white shadow transition-transform", m.tone, active ? "scale-100" : "scale-90 opacity-80 group-hover:opacity-100")}>
                        <m.icon className="size-4" />
                      </span>
                      <p className={cn("mt-2 text-[11.5px] font-bold leading-tight", active ? "text-brand-700" : "text-slate-600")}>
                        {m.short}
                      </p>
                      {active && (
                        <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-brand-600 text-white shadow">
                          <CheckCircle2 className="size-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5">
                <p className="text-[11.5px] leading-snug text-slate-600">
                  <b className="text-slate-800">{meta.title}:</b> {meta.desc}
                </p>
              </div>
            </>
          )}

          {/* ----------------- admin security note ----------------- */}
          {mode === "register" && role === "exhibitor" && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700"><ShieldCheck className="size-4" /></span>
              <p className="text-[11.5px] leading-snug text-amber-900">
                <b>Admin accounts</b> cannot be created through public registration. They are provisioned by the system owner
                via the seed script or from within the dashboard.
              </p>
            </div>
          )}

          {/* ----------------- global error ----------------- */}
          {apiError && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5" role="alert">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-rose-500" />
              <p className="text-[12.5px] leading-snug text-rose-800">{apiError}</p>
            </div>
          )}

          {/* ----------------- forgot: success ----------------- */}
          {mode === "forgot" && resetSent ? (
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-600"><MailCheck className="size-6" /></span>
              <h3 className="mt-4 font-display text-[17px] font-bold text-emerald-900">Check your inbox</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-emerald-800/80">
                We've sent a password reset link to <b>{forgotForm.getValues("email")}</b>. The link expires in 30 minutes.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <Button variant="secondary" full onClick={() => nav("/login")}>Return to sign in</Button>
                <Button variant="ghost" size="sm" onClick={() => setResetSent(false)}>Use a different email</Button>
              </div>
            </div>
          ) : (
          <>

          {/* ========================= LOGIN ========================= */}
          {mode === "login" && (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="mt-6 space-y-4" noValidate>
              <Field label="Email address" required error={loginForm.formState.errors.email?.message}>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    {...loginForm.register("email")}
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-[14px] text-slate-900 shadow-[0_1px_2px_rgba(23,28,53,.04)] outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12"
                  />
                </div>
              </Field>

              <Field label="Password" required error={loginForm.formState.errors.password?.message}>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    {...loginForm.register("password")}
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-11 text-[14px] text-slate-900 shadow-[0_1px_2px_rgba(23,28,53,.04)] outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12"
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700">
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>

              <div className="flex items-center justify-between gap-3">
                <Checkbox
                  checked={!!loginForm.watch("remember")}
                  onChange={(v: boolean) => loginForm.setValue("remember", v)}
                  label="Keep me signed in"
                />
                <Link to="/forgot-password" className="text-[12.5px] font-semibold text-brand-600 hover:text-brand-700">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" full size="lg" loading={busy} iconRight={!busy ? <ArrowRight className="size-4.5" /> : undefined}>
                Sign in as {meta.short}
              </Button>

              {/* seeded demo credentials — one-click fill per role */}
              <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700"><BadgeCheck className="size-4" /></span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold text-brand-900">
                      {role === "organizer" ? "Admin access" : `Demo ${meta.short.toLowerCase()} account`}
                    </p>
                    <p className="mt-0.5 truncate text-[11.5px] text-brand-800/75">
                      {DEMO_ACCOUNTS[role as keyof typeof DEMO_ACCOUNTS].email} ·{" "}
                      {role === "organizer" ? "ChangeMe!2026" : role === "exhibitor" ? "Exhibitor!2026" : "Attendee!2026"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="soft"
                  size="sm"
                  full
                  className="mt-3"
                  onClick={() => {
                    loginForm.setValue("email", DEMO_ACCOUNTS[role as keyof typeof DEMO_ACCOUNTS].email);
                    loginForm.setValue("password", role === "organizer" ? "ChangeMe!2026" : role === "exhibitor" ? "Exhibitor!2026" : "Attendee!2026");
                    setApiError(null);
                    toast({ title: "Credentials filled", body: "Click Sign in to continue.", tone: "info" });
                  }}
                >
                  Fill credentials
                </Button>
                {role === "organizer" && (
                  <p className="mt-2.5 text-[11px] leading-snug text-brand-800/70">
                    Seeded by <code className="rounded bg-brand-100 px-1 py-0.5">npm run seed</code> in <code className="rounded bg-brand-100 px-1 py-0.5">server/</code>. Rotate the password after first login.
                  </p>
                )}
              </div>

              <div className="relative py-1.5 text-center">
                <span className="absolute inset-x-0 top-1/2 h-px bg-slate-200" />
                <span className="relative bg-white px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">or</span>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {[["Google", "M21.35 11.1H12v2.9h5.35c-.25 1.35-1.65 3.95-5.35 3.95A5.95 5.95 0 0 1 6 12a5.95 5.95 0 0 1 6-5.95c1.7 0 2.85.7 3.5 1.3l2.4-2.35C16.4 3.6 14.4 2.8 12 2.8A9.2 9.2 0 0 0 2.8 12 9.2 9.2 0 0 0 12 21.2c5.3 0 8.8-3.7 8.8-8.9 0-.6-.05-1-.15-1.2Z"], ["Microsoft", "M3 3h8.5v8.5H3V3Zm9.5 0H21v8.5h-8.5V3ZM3 12.5h8.5V21H3v-8.5Zm9.5 0H21V21h-8.5v-8.5Z"]].map(([l, d]) => (
                  <button key={l} type="button"
                    onClick={() => toast({ title: `${l} SSO`, body: "Social sign-in is not wired in this build.", tone: "info" })}
                    className="inline-flex h-11 items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d={d} /></svg>
                    {l}
                  </button>
                ))}
              </div>
            </form>
          )}

          {/* ======================= REGISTER ======================= */}
          {mode === "register" && (
            <form onSubmit={regForm.handleSubmit(onRegister)} className="mt-6 space-y-4" noValidate>
              <Field label="Full name" required error={regForm.formState.errors.name?.message}>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input {...regForm.register("name")} autoComplete="name" placeholder="Jane Cooper"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-[14px] outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12" />
                </div>
              </Field>

              <Field label="Email address" required error={regForm.formState.errors.email?.message}>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input {...regForm.register("email")} type="email" autoComplete="email" placeholder="jane@company.com"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-[14px] outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12" />
                </div>
              </Field>

              {role === "exhibitor" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Company" error={regForm.formState.errors.company?.message}>
                    <input {...regForm.register("company")} placeholder="Nexora Cloud"
                      className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-[14px] outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12" />
                  </Field>
                  <Field label="Job title">
                    <input {...regForm.register("jobTitle")} placeholder="VP Marketing"
                      className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-[14px] outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12" />
                  </Field>
                </div>
              )}

              <Field label="Password" required error={regForm.formState.errors.password?.message} hint="8+ chars, upper, lower, number">
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input {...regForm.register("password")} type={showPw ? "text" : "password"} autoComplete="new-password" placeholder="••••••••"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-11 text-[14px] outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12" />
                  <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700">
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>

              {strength > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
                    <span className="font-semibold text-slate-500">Password strength</span>
                    <span className={cn("font-bold", strength >= 80 ? "text-emerald-600" : strength >= 60 ? "text-amber-600" : "text-rose-600")}>
                      {strength >= 80 ? "Strong" : strength >= 60 ? "Good" : strength >= 40 ? "Fair" : "Weak"}
                    </span>
                  </div>
                  <Progress value={strength} height={5} tone={strength >= 80 ? "success" : strength >= 60 ? "brand" : strength >= 40 ? "warn" : "danger"} />
                </div>
              )}

              <Field label="Confirm password" required error={regForm.formState.errors.confirm?.message}>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input {...regForm.register("confirm")} type="password" autoComplete="new-password" placeholder="••••••••"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-[14px] outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12" />
                </div>
              </Field>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <Checkbox
                  checked={!!regForm.watch("terms")}
                  onChange={(v: boolean) => regForm.setValue("terms", v as true, { shouldValidate: true })}
                  label={<>I agree to the <a href="#" className="font-semibold text-brand-600">Terms of Service</a> and <a href="#" className="font-semibold text-brand-600">Privacy Policy</a>, including GDPR consent for data processing.</>}
                />
                {regForm.formState.errors.terms && (
                  <p className="mt-2 text-[11.5px] font-medium text-rose-600">{regForm.formState.errors.terms.message as string}</p>
                )}
              </div>

              <Button type="submit" full size="lg" loading={busy} iconRight={!busy ? <ArrowRight className="size-4.5" /> : undefined}>
                Create {meta.short.toLowerCase()} account
              </Button>
            </form>
          )}

          {/* ====================== FORGOT PASSWORD ====================== */}
          {mode === "forgot" && (
            <form onSubmit={forgotForm.handleSubmit(onForgot)} className="mt-6 space-y-4" noValidate>
              <Field label="Email address" required error={forgotForm.formState.errors.email?.message}>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input {...forgotForm.register("email")} type="email" autoComplete="email" placeholder="you@company.com"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-[14px] outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12" />
                </div>
              </Field>
              <Button type="submit" full size="lg" loading={busy} iconRight={!busy ? <ArrowRight className="size-4.5" /> : undefined}>
                Send reset link
              </Button>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3.5 text-[12px] leading-relaxed text-slate-600">
                <ShieldCheck className="size-4 shrink-0 text-slate-400" />
                For privacy we return the same response whether or not the email exists.
              </div>
            </form>
          )}
          </>
          )}

          {/* ----------------- footer switch ----------------- */}
          <p className="pt-5 text-center text-[13px] text-slate-500">
            {mode === "login" ? (
              <>New to EventSphere? <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700">Create an account</Link></>
            ) : mode === "register" ? (
              <>Already have an account? <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700">Sign in</Link></>
            ) : (
              <>Remembered it? <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700">Back to sign in</Link></>
            )}
          </p>

          {authMode === "demo" && (
            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-400">
              <WifiOff className="size-3.5" /> Backend offline — running in demo mode
            </div>
          )}
          <div className="mt-6 flex items-center justify-center gap-2 text-[11.5px] text-slate-400">
            <ShieldCheck className="size-3.5" /> Secured with 256-bit encryption
          </div>
        </div>
      </div>
    </div>
  );
}
