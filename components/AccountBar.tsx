"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useUILanguage } from "@/lib/ui-language";

type ProfileInfo = {
  tier: string;
  wordsUsed: number;
  wordsLimit: number;
};

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
};


const NAV_COPY: Record<string, Record<string, string>> = {
  en: { pricing: "Pricing", signIn: "Sign in", upgrade: "Upgrade", signOut: "Sign out" },
  ar: { pricing: "الأسعار", signIn: "تسجيل الدخول", upgrade: "ترقية", signOut: "تسجيل الخروج" },
  fr: { pricing: "Tarifs", signIn: "Se connecter", upgrade: "Changer d'offre", signOut: "Se déconnecter" },
  es: { pricing: "Precios", signIn: "Iniciar sesión", upgrade: "Mejorar plan", signOut: "Cerrar sesión" },
  tr: { pricing: "Fiyatlar", signIn: "Giriş yap", upgrade: "Yükselt", signOut: "Çıkış yap" },
  ur: { pricing: "قیمتیں", signIn: "سائن ان", upgrade: "اپ گریڈ", signOut: "سائن آؤٹ" },
  hi: { pricing: "कीमतें", signIn: "साइन इन", upgrade: "अपग्रेड", signOut: "साइन आउट" },
  de: { pricing: "Preise", signIn: "Anmelden", upgrade: "Upgraden", signOut: "Abmelden" },
};

export default function AccountBar() {
  const { lang } = useUILanguage();
  const nav = NAV_COPY[lang] ?? NAV_COPY.en;
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setEmail(user.email ?? null);

        const { data } = await supabase
          .from("profiles")
          .select("subscription_tier, words_used, words_limit")
          .eq("id", user.id)
          .single();

        if (data) {
          setProfile({
            tier: data.subscription_tier ?? "free",
            wordsUsed: data.words_used ?? 0,
            wordsLimit: data.words_limit ?? 15000,
          });
        }
      }
      setReady(true);
    }
    load();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  }

  if (!ready) {
    return <div className="h-8 w-40 animate-pulse rounded-full bg-line/50" />;
  }

  // Signed out — just point them at sign-in.
  if (!email) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/pricing"
          className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
        >
          {nav.pricing}
        </Link>
        <Link
          href="/login"
          className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-paper transition-opacity hover:opacity-90"
        >
          {nav.signIn}
        </Link>
      </div>
    );
  }

  const remaining = profile
    ? Math.max(profile.wordsLimit - profile.wordsUsed, 0)
    : null;
  const pct = profile
    ? Math.min(Math.round((profile.wordsUsed / profile.wordsLimit) * 100), 100)
    : 0;
  const isLow = remaining !== null && profile !== null && remaining < profile.wordsLimit * 0.1;

  return (
    <div className="flex items-center gap-2">
      {profile && (
        <div className="hidden items-center gap-2.5 rounded-full border border-line bg-panel px-3 py-1.5 sm:flex">
          <span className="text-xs font-semibold text-ink">
            {TIER_LABELS[profile.tier] ?? profile.tier}
          </span>
          <span className="h-3 w-px bg-line" />
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-line/60">
              <div
                className={`h-full rounded-full ${isLow ? "bg-red-500" : "bg-accent"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span
              dir="ltr"
              className={`font-mono text-[11px] ${
                isLow ? "font-semibold text-red-600" : "text-ink-faint"
              }`}
            >
              {remaining?.toLocaleString()} left
            </span>
          </div>
        </div>
      )}

      {profile?.tier !== "pro" && (
        <Link
          href="/pricing"
          className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-paper transition-opacity hover:opacity-90"
        >
          {nav.upgrade}
        </Link>
      )}

      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
      >
        {nav.signOut}
      </button>
    </div>
  );
}
