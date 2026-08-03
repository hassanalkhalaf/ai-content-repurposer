"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const AUTH_ERRORS: Record<string, string> = {
  "Email not confirmed":
    "لم تؤكد بريدك بعد. افتح الرسالة المرسلة إلى بريدك واضغط رابط التأكيد.",
  "Invalid login credentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "User already registered":
    "هذا البريد مسجّل بالفعل. سجّل دخولك بدل إنشاء حساب جديد.",
  "Email rate limit exceeded":
    "حاولت مرات كثيرة. انتظر بضع دقائق ثم أعد المحاولة.",
  "Unable to validate email address: invalid format":
    "صيغة البريد الإلكتروني غير صحيحة.",
};

function translateAuthError(message?: string) {
  if (!message) return "حدث خطأ، حاول مرة أخرى.";
  return AUTH_ERRORS[message] ?? message;
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit() {
    setError(null);
    setNotice(null);
    setNeedsConfirmation(false);

    if (!email || !password) {
      setError("الرجاء تعبئة البريد الإلكتروني وكلمة المرور.");
      return;
    }
    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setNotice(
          "إن لم يكن هذا البريد مسجّلًا من قبل، ستصلك رسالة تأكيد خلال دقائق. وإن كان مسجّلًا، سجّل دخولك أو استخدم «نسيت كلمة المرور؟»."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(translateAuthError(err?.message));
      setNeedsConfirmation(err?.message === "Email not confirmed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendConfirmation() {
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setNeedsConfirmation(false);
      setNotice(
        "أرسلنا رابط التأكيد من جديد. تحقق من بريدك ومن مجلد الرسائل غير المرغوب فيها. إن لم تصلك خلال بضع دقائق فالغالب أن البريد مكتوب بشكل خاطئ — أنشئ حسابًا بالعنوان الصحيح."
      );
    } catch (err: any) {
      setError(translateAuthError(err?.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError(null);
    setNotice(null);

    if (!email) {
      setError("اكتب بريدك الإلكتروني أولًا ثم اضغط «نسيت كلمة المرور؟».");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      });
      if (error) throw error;
      setNotice(
        "إن كان هذا البريد مسجّلًا لدينا، ستصلك رسالة فيها رابط لتعيين كلمة مرور جديدة. تحقق أيضًا من مجلد الرسائل غير المرغوب فيها."
      );
    } catch (err: any) {
      setError(translateAuthError(err?.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          {mode === "signin" ? "تسجيل الدخول" : "إنشاء حساب"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {mode === "signin"
            ? "سجّل دخولك للمتابعة إلى Repurpose."
            : "أنشئ حسابًا مجانيًا وابدأ بـ 30,000 كلمة شهريًا."}
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              dir="ltr"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {needsConfirmation && (
            <button
              onClick={handleResendConfirmation}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              أعد إرسال رابط التأكيد
            </button>
          )}

          {notice && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              {notice}
            </p>
          )}

          {mode === "signin" && (
            <button
              onClick={handleForgotPassword}
              disabled={loading}
              className="block w-full text-right text-sm text-slate-600 underline disabled:opacity-50"
            >
              نسيت كلمة المرور؟
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {loading
              ? "جارٍ المعالجة..."
              : mode === "signin"
              ? "تسجيل الدخول"
              : "إنشاء حساب"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          {mode === "signin" ? "ما عندك حساب؟" : "عندك حساب بالفعل؟"}{" "}
          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setNotice(null);
              setNeedsConfirmation(false);
            }}
            className="font-medium text-slate-900 underline"
          >
            {mode === "signin" ? "أنشئ حسابًا" : "سجّل دخولك"}
          </button>
        </p>
      </div>
    </main>
  );
}
