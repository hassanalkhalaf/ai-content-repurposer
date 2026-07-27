"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setNotice(null);

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
        setNotice("تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتأكيد الحساب.");
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
      setError(err?.message ?? "حدث خطأ، حاول مرة أخرى.");
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
            : "أنشئ حسابًا مجانيًا وابدأ بـ 5,000 كلمة شهريًا."}
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
          {notice && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              {notice}
            </p>
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
