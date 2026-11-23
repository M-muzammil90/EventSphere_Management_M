import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge, Button, Field, Input } from "@/components/ui";
import { Logo } from "@/components/SiteLayout";
import { cn } from "@/utils/cn";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Lock, ShieldCheck } from "lucide-react";

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const { token } = useParams();
  const nav = useNavigate();
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetForm>({ resolver: zodResolver(resetSchema), mode: "onBlur" });

  const password = watch("password") ?? "";
  const strength = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length * 25;

  const onSubmit = async () => {
    setBusy(true);
    // API call wired in Phase 9 — see src/lib/api.ts → authApi.resetPassword
    await new Promise((r) => setTimeout(r, 900));
    setBusy(false);
    setDone(true);
  };

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1fr_1fr]">
      {/* form side */}
      <div className="flex flex-col justify-center px-5 py-10 sm:px-10 xl:px-16">
        <div className="mx-auto w-full max-w-md">
          <Logo />
          <Link to="/login" className="mt-8 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500 transition hover:text-slate-800">
            <ArrowLeft className="size-3.5" /> Back to sign in
          </Link>

          {done ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="size-6" />
              </span>
              <h1 className="mt-4 font-display text-[20px] font-bold text-emerald-900">Password updated</h1>
              <p className="mt-2 text-[13.5px] leading-relaxed text-emerald-800/80">
                Your password has been changed successfully. You can now sign in with your new password.
              </p>
              <Button className="mt-5" full onClick={() => nav("/login")}>
                Continue to sign in
              </Button>
            </div>
          ) : (
            <>
              <h1 className="mt-5 font-display text-[28px] font-extrabold tracking-[-0.025em] text-slate-900 sm:text-[32px]">
                Set a new password
              </h1>
              <p className="mt-2 text-[14px] text-slate-500">
                Choose a strong password you haven't used before. Your reset link expires 30 minutes after it was issued.
              </p>

              {!token && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-[12.5px] leading-relaxed text-amber-900">
                  This reset link is missing its security token. Please request a new one from the{" "}
                  <Link to="/forgot-password" className="font-bold underline">
                    forgot password
                  </Link>{" "}
                  page.
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
                <Field label="New password" required error={errors.password?.message} hint="8+ chars, 1 uppercase, 1 number">
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      {...register("password")}
                      type={show ? "text" : "password"}
                      className="pl-10 pr-11"
                      placeholder="••••••••"
                      isInvalid={!!errors.password}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      aria-label={show ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    >
                      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </Field>

                {strength > 0 && (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
                      <span className="font-semibold text-slate-500">Password strength</span>
                      <span
                        className={cn(
                          "font-bold",
                          strength >= 75 ? "text-emerald-600" : strength >= 50 ? "text-amber-600" : "text-rose-600"
                        )}
                      >
                        {strength >= 75 ? "Strong" : strength >= 50 ? "Fair" : "Weak"}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          strength >= 75 ? "bg-emerald-500" : strength >= 50 ? "bg-amber-500" : "bg-rose-500"
                        )}
                        style={{ width: `${strength}%` }}
                      />
                    </div>
                  </div>
                )}

                <Field label="Confirm new password" required error={errors.confirm?.message}>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      {...register("confirm")}
                      type={show ? "text" : "password"}
                      className="pl-10"
                      placeholder="••••••••"
                      isInvalid={!!errors.confirm}
                      autoComplete="new-password"
                    />
                  </div>
                </Field>

                <Button type="submit" full size="lg" loading={busy} disabled={!token}>
                  Update password
                </Button>
              </form>
            </>
          )}

          <div className="mt-7 flex items-center justify-center gap-2 text-[11.5px] text-slate-400">
            <ShieldCheck className="size-3.5" /> Reset tokens are single-use and expire after 30 minutes
          </div>
        </div>
      </div>

      {/* visual side */}
      <div className="relative hidden overflow-hidden bg-ink-950 lg:block">
        <div className="absolute inset-0 grid-noise-dark opacity-50" />
        <div className="pointer-events-none absolute -left-24 bottom-0 size-[420px] rounded-full bg-brand-600/25 blur-[110px]" />
        <div className="pointer-events-none absolute -right-24 top-0 size-[420px] rounded-full bg-brand-400/15 blur-[110px]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div>
            <Badge tone="brand" className="bg-white/10 text-brand-200 ring-white/15">Account security</Badge>
            <h2 className="mt-6 font-display text-[32px] font-extrabold leading-[1.12] tracking-[-0.03em] text-white">
              Keeping your account
              <br />
              <span className="text-gradient">secure.</span>
            </h2>
            <ul className="mt-8 space-y-3.5">
              {[
                "Passwords are hashed with bcrypt — never stored in plain text",
                "Reset tokens are single-use and expire automatically",
                "All sessions are invalidated after a password change",
                "We never email you your existing password",
              ].map((b) => (
                <li key={b} className="flex items-start gap-3 text-[13.5px] text-slate-300">
                  <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-emerald-400" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[12px] text-slate-500">
            © 2026 EventSphere Management · GDPR compliant · WCAG 2.1 AA
          </p>
        </div>
      </div>
    </div>
  );
}
