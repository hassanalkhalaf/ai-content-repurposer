"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useUILanguage, UI_LANGUAGE_NATIVE_NAMES } from "@/lib/ui-language";

const CHECKOUT_URLS: Record<"starter" | "pro", string> = {
  starter:
    "https://repurposerapp.lemonsqueezy.com/checkout/buy/5addba39-035b-4580-9584-c1a33fe57f0e",
  pro:
    "https://repurposerapp.lemonsqueezy.com/checkout/buy/610175fa-d9c2-47cd-a437-4491bbe026c7",
};

const RTL_LANGUAGES = ["ar", "ur"];

const COPY: Record<string, any> = {
  en: {
    title: "Plans and pricing",
    subtitle: "Pick the plan that matches how much content you produce.",
    back: "Back to Repurpose",
    perMonth: "/month",
    popular: "Most popular",
    current: "Current plan",
    signIn: "Sign in to upgrade",
    upgrade: "Upgrade",
    footer: "Cancel any time. Payments are processed securely by Lemon Squeezy.",
    free: {
      name: "Free",
      words: "15,000 words per month",
      features: [
        "Turn text into threads, LinkedIn posts, captions and articles",
        "Interface available in 8 languages",
      ],
    },
    starter: {
      name: "Starter",
      words: "50,000 words per month",
      features: [
        "Everything in Free",
        "Audio and video transcription",
        "7-day free trial",
      ],
    },
    pro: {
      name: "Pro",
      words: "200,000 words per month",
      features: ["Everything in Starter", "Priority processing", "7-day free trial"],
    },
  },
  ar: {
    title: "الباقات والأسعار",
    subtitle: "اختر الباقة المناسبة لحجم المحتوى اللي تنتجه.",
    back: "الرجوع إلى Repurpose",
    perMonth: "‏/شهريًا",
    popular: "الأكثر شيوعًا",
    current: "الباقة الحالية",
    signIn: "سجّل دخولك للاشتراك",
    upgrade: "ترقية",
    footer: "يمكنك الإلغاء في أي وقت. الدفع يتم عبر Lemon Squeezy بشكل آمن.",
    free: {
      name: "مجاني",
      words: "15,000 كلمة شهريًا",
      features: [
        "تحويل النصوص لتويتر ولينكدإن وإنستقرام ومقالات",
        "الواجهة متوفرة بثماني لغات",
      ],
    },
    starter: {
      name: "Starter",
      words: "50,000 كلمة شهريًا",
      features: [
        "كل مزايا الباقة المجانية",
        "تفريغ الصوت والفيديو",
        "تجربة مجانية 7 أيام",
      ],
    },
    pro: {
      name: "Pro",
      words: "200,000 كلمة شهريًا",
      features: ["كل مزايا Starter", "أولوية في المعالجة", "تجربة مجانية 7 أيام"],
    },
  },
  fr: {
    title: "Offres et tarifs",
    subtitle: "Choisissez l'offre adaptée au volume de contenu que vous produisez.",
    back: "Retour à Repurpose",
    perMonth: "/mois",
    popular: "Le plus choisi",
    current: "Offre actuelle",
    signIn: "Connectez-vous pour changer d'offre",
    upgrade: "Passer à l'offre",
    footer:
      "Annulable à tout moment. Paiements traités en toute sécurité par Lemon Squeezy.",
    free: {
      name: "Gratuit",
      words: "15 000 mots par mois",
      features: [
        "Transformez un texte en fils, posts LinkedIn, légendes et articles",
        "Interface disponible en 8 langues",
      ],
    },
    starter: {
      name: "Starter",
      words: "50 000 mots par mois",
      features: [
        "Tout ce que contient l'offre gratuite",
        "Transcription audio et vidéo",
        "Essai gratuit de 7 jours",
      ],
    },
    pro: {
      name: "Pro",
      words: "200 000 mots par mois",
      features: [
        "Tout ce que contient Starter",
        "Traitement prioritaire",
        "Essai gratuit de 7 jours",
      ],
    },
  },
  es: {
    title: "Planes y precios",
    subtitle: "Elige el plan que se ajuste al volumen de contenido que produces.",
    back: "Volver a Repurpose",
    perMonth: "/mes",
    popular: "El más elegido",
    current: "Plan actual",
    signIn: "Inicia sesión para mejorar tu plan",
    upgrade: "Mejorar plan",
    footer:
      "Cancela cuando quieras. Los pagos los procesa Lemon Squeezy de forma segura.",
    free: {
      name: "Gratis",
      words: "15.000 palabras al mes",
      features: [
        "Convierte texto en hilos, publicaciones de LinkedIn, pies de foto y artículos",
        "Interfaz disponible en 8 idiomas",
      ],
    },
    starter: {
      name: "Starter",
      words: "50.000 palabras al mes",
      features: [
        "Todo lo del plan gratuito",
        "Transcripción de audio y vídeo",
        "Prueba gratuita de 7 días",
      ],
    },
    pro: {
      name: "Pro",
      words: "200.000 palabras al mes",
      features: [
        "Todo lo de Starter",
        "Procesamiento prioritario",
        "Prueba gratuita de 7 días",
      ],
    },
  },
  tr: {
    title: "Planlar ve fiyatlandırma",
    subtitle: "Ürettiğiniz içerik hacmine uygun planı seçin.",
    back: "Repurpose'a dön",
    perMonth: "/ay",
    popular: "En çok tercih edilen",
    current: "Mevcut plan",
    signIn: "Yükseltmek için giriş yapın",
    upgrade: "Yükselt",
    footer:
      "İstediğiniz zaman iptal edin. Ödemeler Lemon Squeezy tarafından güvenle işlenir.",
    free: {
      name: "Ücretsiz",
      words: "Ayda 15.000 kelime",
      features: [
        "Metni thread, LinkedIn gönderisi, açıklama ve makaleye dönüştürün",
        "Arayüz 8 dilde mevcut",
      ],
    },
    starter: {
      name: "Starter",
      words: "Ayda 50.000 kelime",
      features: [
        "Ücretsiz plandaki her şey",
        "Ses ve video deşifresi",
        "7 gün ücretsiz deneme",
      ],
    },
    pro: {
      name: "Pro",
      words: "Ayda 200.000 kelime",
      features: ["Starter'daki her şey", "Öncelikli işleme", "7 gün ücretsiz deneme"],
    },
  },
  ur: {
    title: "پلانز اور قیمتیں",
    subtitle: "اپنے مواد کے حجم کے مطابق پلان منتخب کریں۔",
    back: "‏Repurpose پر واپس جائیں",
    perMonth: "‏/ماہانہ",
    popular: "سب سے مقبول",
    current: "موجودہ پلان",
    signIn: "اپ گریڈ کرنے کے لیے سائن ان کریں",
    upgrade: "اپ گریڈ کریں",
    footer:
      "کسی بھی وقت منسوخ کریں۔ ادائیگیاں Lemon Squeezy کے ذریعے محفوظ طریقے سے ہوتی ہیں۔",
    free: {
      name: "مفت",
      words: "ماہانہ 15,000 الفاظ",
      features: [
        "متن کو تھریڈ، لنکڈاِن پوسٹ، کیپشن اور مضمون میں تبدیل کریں",
        "انٹرفیس آٹھ زبانوں میں دستیاب",
      ],
    },
    starter: {
      name: "Starter",
      words: "ماہانہ 50,000 الفاظ",
      features: [
        "مفت پلان کی تمام سہولیات",
        "آڈیو اور ویڈیو کی نقل نویسی",
        "7 دن کی مفت آزمائش",
      ],
    },
    pro: {
      name: "Pro",
      words: "ماہانہ 200,000 الفاظ",
      features: ["‏Starter کی تمام سہولیات", "ترجیحی پروسیسنگ", "7 دن کی مفت آزمائش"],
    },
  },
  hi: {
    title: "प्लान और कीमतें",
    subtitle: "आप जितना कंटेंट बनाते हैं, उसके हिसाब से प्लान चुनें।",
    back: "Repurpose पर वापस जाएँ",
    perMonth: "/माह",
    popular: "सबसे लोकप्रिय",
    current: "मौजूदा प्लान",
    signIn: "अपग्रेड करने के लिए साइन इन करें",
    upgrade: "अपग्रेड करें",
    footer:
      "कभी भी रद्द करें। भुगतान Lemon Squeezy द्वारा सुरक्षित रूप से संसाधित होते हैं।",
    free: {
      name: "मुफ़्त",
      words: "हर महीने 15,000 शब्द",
      features: [
        "टेक्स्ट को थ्रेड, लिंक्डइन पोस्ट, कैप्शन और लेख में बदलें",
        "इंटरफ़ेस आठ भाषाओं में उपलब्ध",
      ],
    },
    starter: {
      name: "Starter",
      words: "हर महीने 50,000 शब्द",
      features: [
        "मुफ़्त प्लान की सभी सुविधाएँ",
        "ऑडियो और वीडियो ट्रांसक्रिप्शन",
        "7 दिन का मुफ़्त ट्रायल",
      ],
    },
    pro: {
      name: "Pro",
      words: "हर महीने 200,000 शब्द",
      features: [
        "Starter की सभी सुविधाएँ",
        "प्राथमिकता वाली प्रोसेसिंग",
        "7 दिन का मुफ़्त ट्रायल",
      ],
    },
  },
  de: {
    title: "Tarife und Preise",
    subtitle: "Wählen Sie den Tarif, der zu Ihrem Content-Volumen passt.",
    back: "Zurück zu Repurpose",
    perMonth: "/Monat",
    popular: "Am beliebtesten",
    current: "Aktueller Tarif",
    signIn: "Zum Upgrade anmelden",
    upgrade: "Upgraden",
    footer:
      "Jederzeit kündbar. Zahlungen werden sicher über Lemon Squeezy abgewickelt.",
    free: {
      name: "Kostenlos",
      words: "15.000 Wörter pro Monat",
      features: [
        "Text in Threads, LinkedIn-Posts, Captions und Artikel verwandeln",
        "Oberfläche in 8 Sprachen verfügbar",
      ],
    },
    starter: {
      name: "Starter",
      words: "50.000 Wörter pro Monat",
      features: [
        "Alles aus Kostenlos",
        "Audio- und Video-Transkription",
        "7 Tage kostenlos testen",
      ],
    },
    pro: {
      name: "Pro",
      words: "200.000 Wörter pro Monat",
      features: [
        "Alles aus Starter",
        "Bevorzugte Verarbeitung",
        "7 Tage kostenlos testen",
      ],
    },
  },
};

export default function PricingPage() {
  const router = useRouter();
  const { lang, setLang } = useUILanguage();
  const [email, setEmail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const c = COPY[lang] ?? COPY.en;
  const dir = RTL_LANGUAGES.includes(lang) ? "rtl" : "ltr";

  useEffect(() => {
    let active = true;
    const supabase = createSupabaseBrowserClient();

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!active) return;
        setEmail(data.user?.email ?? null);
        setChecked(true);
      })
      .catch(() => {
        if (active) setChecked(true);
      });

    return () => {
      active = false;
    };
  }, []);

  function goToPlan(plan: "starter" | "pro") {
    if (!email) {
      router.push("/login");
      return;
    }
    window.location.href =
      CHECKOUT_URLS[plan] + "?checkout[email]=" + encodeURIComponent(email);
  }

  const plans = [
    { key: "free" as const, price: "$0", copy: c.free, popular: false },
    { key: "starter" as const, price: "$9.99", copy: c.starter, popular: false },
    { key: "pro" as const, price: "$19.99", copy: c.pro, popular: true },
  ];

  return (
    <main dir={dir} className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <a href="/" className="text-sm text-slate-500 transition hover:text-slate-900">
            {dir === "rtl" ? "\u2192" : "\u2190"} {c.back}
          </a>

          <select
            aria-label="Language"
            value={lang}
            onChange={(e) => setLang(e.target.value as Parameters<typeof setLang>[0])}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-slate-400"
          >
            {Object.entries(UI_LANGUAGE_NATIVE_NAMES).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <header className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{c.title}</h1>
          <p className="mt-3 text-slate-600">{c.subtitle}</p>
        </header>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map(({ key, price, copy, popular }) => (
            <div
              key={key}
              className={
                "relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm " +
                (popular ? "border-slate-900 shadow-md" : "border-slate-200")
              }
            >
              {popular && (
                <span className="absolute -top-3 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                  {c.popular}
                </span>
              )}

              <h2 className="text-lg font-semibold text-slate-900">{copy.name}</h2>

              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">{price}</span>
                <span className="text-sm text-slate-500">{c.perMonth}</span>
              </p>

              <p className="mt-2 text-sm text-slate-600">{copy.words}</p>

              <ul className="mt-6 flex-1 space-y-3">
                {copy.features.map((feature: string) => (
                  <li key={feature} className="flex gap-2 text-sm text-slate-700">
                    <span aria-hidden className="text-slate-400">
                      {"\u2713"}
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {key === "free" ? (
                  <div className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-sm text-slate-400">
                    {c.current}
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={!checked}
                    onClick={() => goToPlan(key as "starter" | "pro")}
                    className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    {email ? c.upgrade : c.signIn}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-slate-500">{c.footer}</p>
      </div>
    </main>
  );
}
