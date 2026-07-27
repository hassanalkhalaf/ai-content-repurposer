"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const CHECKOUT_URLS = {
  // Starter — $9.99/month
  starter:
    "https://repurposerapp.lemonsqueezy.com/checkout/buy/5addba39-035b-4580-9584-c1a33fe57f0e",
  // Pro — $19.99/month
  pro:
    "https://repurposerapp.lemonsqueezy.com/checkout/buy/610175fa-d9c2-47cd-a437-4491bbe026c7",
};

const PLANS = [
  {
    key: "free" as const,
    name: "مجاني",
    price: "$0",
    words: "5,000 كلمة شهريًا",
    features: [
      "تحويل النصوص لتويتر ولينكدإن وإنستقرام ومقالات",
      "8 لغات للواجهة",
    ],
  },
  {
    key: "starter" as const,
    name: "Starter",
    price: "$9.99",
    words: "50,000 كلمة شهريًا",
    features: [
      "كل مزايا الباقة المجانية",
      "تفريغ الصوت والفيديو",
      "تجربة مجانية 7 أيام",
    ],
  },
  {
    key: "pro" as const,
    name: "Pro",
    price: "$19.99",
    words: "200,000 كلمة شهريًا",
    features: ["كل مزايا Starter", "أولوية في المعالجة", "تجربة مجانية 7 أيام"],
    highlighted: true,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        setUserEmail(user.email ?? null);

        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("id", user.id)
          .single();

        if (profile) setCurrentTier(profile.subscription_tier);
      }
      setReady(true);
    }
    load();
  }, [supabase]);

  function handleSubscribe(planKey: "starter" | "pro") {
    if (!userId) {
      router.push("/login");
      return;
    }

    const url = new URL(CHECKOUT_URLS[planKey]);
    url.searchParams.set("checkout[custom][user_id]", userId);
    if (userEmail) url.searchParams.set("checkout[email]", userEmail);

    window.location.href = url.toString();
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-center text-3xl font-bold text-slate-900">
          الباقات والأسعار
        </h1>
        <p className="mt-3 text-center text-slate-600">
          اختر الباقة المناسبة لحجم المحتوى اللي تنتجه.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = currentTier === plan.key;

            return (
              <div
                key={plan.key}
                className={`flex flex-col rounded-2xl border bg-white p-6 ${
                  plan.highlighted
                    ? "border-slate-900 shadow-md"
                    : "border-slate-200 shadow-sm"
                }`}
              >
                {plan.highlighted && (
                  <span className="mb-3 self-start rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                    الأكثر شيوعًا
                  </span>
                )}

                <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900">
                    {plan.price}
                  </span>
                  {plan.key !== "free" && (
                    <span className="text-sm text-slate-500">/شهريًا</span>
                  )}
                </div>

                <p className="mt-2 text-sm font-medium text-slate-700">
                  {plan.words}
                </p>

                <ul className="mt-5 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-slate-600">
                      <span className="text-slate-900">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {plan.key === "free" ? (
                    <button
                      disabled
                      className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-400"
                    >
                      {isCurrent ? "باقتك الحالية" : "الباقة الافتراضية"}
                    </button>
                  ) : isCurrent ? (
                    <button
                      disabled
                      className="w-full rounded-lg bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700"
                    >
                      باقتك الحالية
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.key)}
                      disabled={!ready}
                      className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      {!ready
                        ? "..."
                        : userId
                        ? "اشترك الآن"
                        : "سجّل دخولك للاشتراك"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm text-slate-500">
          يمكنك الإلغاء في أي وقت. الدفع يتم عبر Lemon Squeezy بشكل آمن.
        </p>
      </div>
    </main>
  );
}
