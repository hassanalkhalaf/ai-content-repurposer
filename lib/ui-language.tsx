"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type UILanguage = "en" | "ar" | "fr" | "es" | "tr" | "ur" | "hi" | "de";

export const UI_LANGUAGE_NATIVE_NAMES: Record<UILanguage, string> = {
  en: "English",
  ar: "العربية",
  fr: "Français",
  es: "Español",
  tr: "Türkçe",
  ur: "اردو",
  hi: "हिन्दी",
  de: "Deutsch",
};

const RTL_LANGUAGES: UILanguage[] = ["ar", "ur"];

interface Translations {
  appTitle: string;
  appTagline: string;
  sourceContentTitle: string;
  sourceContentDesc: string;
  textareaPlaceholder: string;
  outputFormatLabel: string;
  outputLanguageLabel: string;
  sameAsSourceLanguage: string;
  siteLanguageLabel: string;
  repurposeButton: string;
  repurposingButton: string;
  tooShort: (n: number) => string;
  emptyStateTitle: string;
  emptyStateDesc: string;
  loadingTitle: string;
  loadingDesc: string;
  errorTitle: string;
  tryAgain: string;
  twitterLabel: string;
  twitterSub: string;
  linkedinLabel: string;
  linkedinSub: string;
  blogLabel: string;
  blogSub: string;
  contactTitle: string;
  contactDesc: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  messagePlaceholder: string;
  sendButton: string;
  sendingButton: string;
  contactSuccess: string;
  contactErrorFallback: string;
}

const TRANSLATIONS: Record<UILanguage, Translations> = {
  en: {
    appTitle: "Repurpose",
    appTagline: "One transcript in. Every format out.",
    sourceContentTitle: "Source content",
    sourceContentDesc: "Paste a video transcript, podcast notes, or any long-form text.",
    textareaPlaceholder: "Paste your transcript or long-form text here…",
    outputFormatLabel: "Output format",
    outputLanguageLabel: "Output language",
    sameAsSourceLanguage: "Same as source text",
    siteLanguageLabel: "Site language",
    repurposeButton: "Repurpose Content",
    repurposingButton: "Repurposing…",
    tooShort: (n) => "Add at least " + n + " characters to enable generation.",
    emptyStateTitle: "Your generated content will show up here",
    emptyStateDesc: "Paste your source text, pick a format, and hit Repurpose Content.",
    loadingTitle: "Rewriting your content…",
    loadingDesc: "This usually takes a few seconds.",
    errorTitle: "Generation failed",
    tryAgain: "Try again",
    twitterLabel: "Twitter/X Thread",
    twitterSub: "5 tweets",
    linkedinLabel: "LinkedIn Post",
    linkedinSub: "Hook + bullets",
    blogLabel: "Blog Article",
    blogSub: "SEO structured",
    contactTitle: "Contact me ✉️",
    contactDesc: "Have feedback or an idea to improve the site? Message me directly!",
    namePlaceholder: "Your name",
    emailPlaceholder: "Your email",
    messagePlaceholder: "Write your suggestion or message here...",
    sendButton: "Send message",
    sendingButton: "Sending...",
    contactSuccess: "Message sent successfully! Thank you.",
    contactErrorFallback: "Something went wrong, please try again.",
  },
  ar: {
    appTitle: "Repurpose",
    appTagline: "من نص واحد... لكل الصيغ.",
    sourceContentTitle: "المحتوى المصدر",
    sourceContentDesc: "الصق نص فيديو، ملاحظات بودكاست، أو أي نص طويل.",
    textareaPlaceholder: "الصق نصك أو المحتوى الطويل هنا…",
    outputFormatLabel: "صيغة الإخراج",
    outputLanguageLabel: "لغة المخرجات",
    sameAsSourceLanguage: "نفس لغة النص",
    siteLanguageLabel: "لغة الموقع",
    repurposeButton: "أعد الصياغة",
    repurposingButton: "جارِ إعادة الصياغة…",
    tooShort: (n) => "أضف " + n + " حرف على الأقل لتفعيل التوليد.",
    emptyStateTitle: "ستظهر النتائج هنا",
    emptyStateDesc: "الصق نصك، اختر الصيغة، واضغط زر إعادة الصياغة.",
    loadingTitle: "جارِ إعادة صياغة المحتوى…",
    loadingDesc: "عادة يستغرق ثوانٍ قليلة.",
    errorTitle: "فشل التوليد",
    tryAgain: "حاول مرة أخرى",
    twitterLabel: "ثريد تويتر/X",
    twitterSub: "5 تغريدات",
    linkedinLabel: "منشور لينكد إن",
    linkedinSub: "مقدمة + نقاط",
    blogLabel: "مقال مدونة",
    blogSub: "منظم لمحركات البحث",
    contactTitle: "تواصل معي ✉️",
    contactDesc: "لديك ملاحظة أو فكرة لتطوير الموقع؟ أرسل لي مباشرة!",
    namePlaceholder: "اسمك الكريم",
    emailPlaceholder: "بريدك الإلكتروني",
    messagePlaceholder: "اكتب اقتراحك أو رسالتك هنا...",
    sendButton: "إرسال الرسالة",
    sendingButton: "جاري الإرسال...",
    contactSuccess: "تم الإرسال بنجاح! شكراً لك.",
    contactErrorFallback: "حدث خطأ، يرجى المحاولة لاحقاً.",
  },
  fr: {
    appTitle: "Repurpose",
    appTagline: "Une transcription. Tous les formats.",
    sourceContentTitle: "Contenu source",
    sourceContentDesc: "Collez une transcription vidéo, des notes de podcast, ou tout texte long.",
    textareaPlaceholder: "Collez votre transcription ou texte ici…",
    outputFormatLabel: "Format de sortie",
    outputLanguageLabel: "Langue de sortie",
    sameAsSourceLanguage: "Comme le texte source",
    siteLanguageLabel: "Langue du site",
    repurposeButton: "Générer le contenu",
    repurposingButton: "Génération en cours…",
    tooShort: (n) => "Ajoutez au moins " + n + " caractères pour activer la génération.",
    emptyStateTitle: "Votre contenu généré apparaîtra ici",
    emptyStateDesc: "Collez votre texte, choisissez un format, et cliquez sur Générer.",
    loadingTitle: "Réécriture de votre contenu…",
    loadingDesc: "Cela prend généralement quelques secondes.",
    errorTitle: "Échec de la génération",
    tryAgain: "Réessayer",
    twitterLabel: "Fil Twitter/X",
    twitterSub: "5 tweets",
    linkedinLabel: "Publication LinkedIn",
    linkedinSub: "Accroche + points clés",
    blogLabel: "Article de blog",
    blogSub: "Optimisé SEO",
    contactTitle: "Contactez-moi ✉️",
    contactDesc: "Une idée ou un retour pour améliorer le site ? Écrivez-moi directement !",
    namePlaceholder: "Votre nom",
    emailPlaceholder: "Votre email",
    messagePlaceholder: "Écrivez votre suggestion ou message ici...",
    sendButton: "Envoyer le message",
    sendingButton: "Envoi en cours...",
    contactSuccess: "Message envoyé avec succès ! Merci.",
    contactErrorFallback: "Une erreur est survenue, veuillez réessayer.",
  },
  es: {
    appTitle: "Repurpose",
    appTagline: "Una transcripción. Todos los formatos.",
    sourceContentTitle: "Contenido de origen",
    sourceContentDesc: "Pega una transcripción de video, notas de podcast, o cualquier texto largo.",
    textareaPlaceholder: "Pega tu transcripción o texto aquí…",
    outputFormatLabel: "Formato de salida",
    outputLanguageLabel: "Idioma de salida",
    sameAsSourceLanguage: "Igual que el texto de origen",
    siteLanguageLabel: "Idioma del sitio",
    repurposeButton: "Generar contenido",
    repurposingButton: "Generando…",
    tooShort: (n) => "Añade al menos " + n + " caracteres para habilitar la generación.",
    emptyStateTitle: "Tu contenido generado aparecerá aquí",
    emptyStateDesc: "Pega tu texto, elige un formato, y pulsa Generar contenido.",
    loadingTitle: "Reescribiendo tu contenido…",
    loadingDesc: "Esto suele tardar unos segundos.",
    errorTitle: "La generación falló",
    tryAgain: "Intentar de nuevo",
    twitterLabel: "Hilo de Twitter/X",
    twitterSub: "5 tuits",
    linkedinLabel: "Publicación de LinkedIn",
    linkedinSub: "Gancho + puntos clave",
    blogLabel: "Artículo de blog",
    blogSub: "Optimizado para SEO",
    contactTitle: "Contáctame ✉️",
    contactDesc: "¿Tienes comentarios o una idea para mejorar el sitio? ¡Escríbeme directamente!",
    namePlaceholder: "Tu nombre",
    emailPlaceholder: "Tu correo electrónico",
    messagePlaceholder: "Escribe tu sugerencia o mensaje aquí...",
    sendButton: "Enviar mensaje",
    sendingButton: "Enviando...",
    contactSuccess: "¡Mensaje enviado con éxito! Gracias.",
    contactErrorFallback: "Algo salió mal, inténtalo de nuevo.",
  },
  tr: {
    appTitle: "Repurpose",
    appTagline: "Bir metin. Her formatta çıktı.",
    sourceContentTitle: "Kaynak içerik",
    sourceContentDesc: "Bir video metnini, podcast notlarını veya herhangi bir uzun metni yapıştırın.",
    textareaPlaceholder: "Metninizi veya uzun içeriğinizi buraya yapıştırın…",
    outputFormatLabel: "Çıktı formatı",
    outputLanguageLabel: "Çıktı dili",
    sameAsSourceLanguage: "Kaynak metinle aynı",
    siteLanguageLabel: "Site dili",
    repurposeButton: "İçeriği Oluştur",
    repurposingButton: "Oluşturuluyor…",
    tooShort: (n) => "Oluşturmayı etkinleştirmek için en az " + n + " karakter ekleyin.",
    emptyStateTitle: "Oluşturulan içeriğiniz burada görünecek",
    emptyStateDesc: "Metninizi yapıştırın, bir format seçin ve İçeriği Oluştur'a tıklayın.",
    loadingTitle: "İçeriğiniz yeniden yazılıyor…",
    loadingDesc: "Bu genellikle birkaç saniye sürer.",
    errorTitle: "Oluşturma başarısız oldu",
    tryAgain: "Tekrar dene",
    twitterLabel: "Twitter/X İş Parçacığı",
    twitterSub: "5 tweet",
    linkedinLabel: "LinkedIn Gönderisi",
    linkedinSub: "Giriş + maddeler",
    blogLabel: "Blog Yazısı",
    blogSub: "SEO uyumlu",
    contactTitle: "Benimle iletişime geçin ✉️",
    contactDesc: "Siteyi geliştirmek için bir fikriniz mi var? Doğrudan bana yazın!",
    namePlaceholder: "Adınız",
    emailPlaceholder: "E-postanız",
    messagePlaceholder: "Önerinizi veya mesajınızı buraya yazın...",
    sendButton: "Mesaj gönder",
    sendingButton: "Gönderiliyor...",
    contactSuccess: "Mesaj başarıyla gönderildi! Teşekkürler.",
    contactErrorFallback: "Bir şeyler ters gitti, lütfen tekrar deneyin.",
  },
  ur: {
    appTitle: "Repurpose",
    appTagline: "ایک متن، ہر فارمیٹ میں۔",
    sourceContentTitle: "ماخذ مواد",
    sourceContentDesc: "ویڈیو ٹرانسکرپٹ، پوڈکاسٹ نوٹس، یا کوئی بھی طویل متن یہاں چسپاں کریں۔",
    textareaPlaceholder: "اپنا متن یہاں چسپاں کریں…",
    outputFormatLabel: "آؤٹ پٹ فارمیٹ",
    outputLanguageLabel: "آؤٹ پٹ زبان",
    sameAsSourceLanguage: "ماخذ متن جیسی",
    siteLanguageLabel: "سائٹ کی زبان",
    repurposeButton: "مواد تیار کریں",
    repurposingButton: "تیار ہو رہا ہے…",
    tooShort: (n) => "جنریشن فعال کرنے کے لیے کم از کم " + n + " حروف شامل کریں۔",
    emptyStateTitle: "آپ کا تیار کردہ مواد یہاں ظاہر ہوگا",
    emptyStateDesc: "اپنا متن چسپاں کریں، فارمیٹ منتخب کریں، اور مواد تیار کریں پر کلک کریں۔",
    loadingTitle: "آپ کا مواد دوبارہ لکھا جا رہا ہے…",
    loadingDesc: "اس میں عام طور پر چند سیکنڈ لگتے ہیں۔",
    errorTitle: "تیاری ناکام ہو گئی",
    tryAgain: "دوبارہ کوشش کریں",
    twitterLabel: "ٹویٹر/X تھریڈ",
    twitterSub: "5 ٹویٹس",
    linkedinLabel: "لنکڈ ان پوسٹ",
    linkedinSub: "ہک + نکات",
    blogLabel: "بلاگ آرٹیکل",
    blogSub: "SEO کے مطابق",
    contactTitle: "مجھ سے رابطہ کریں ✉️",
    contactDesc: "سائٹ کو بہتر بنانے کے لیے کوئی خیال یا رائے ہے؟ براہ راست پیغام بھیجیں!",
    namePlaceholder: "آپ کا نام",
    emailPlaceholder: "آپ کا ای میل",
    messagePlaceholder: "اپنی تجویز یا پیغام یہاں لکھیں...",
    sendButton: "پیغام بھیجیں",
    sendingButton: "بھیجا جا رہا ہے...",
    contactSuccess: "پیغام کامیابی سے بھیج دیا گیا! شکریہ۔",
    contactErrorFallback: "کچھ غلط ہو گیا، براہ کرم دوبارہ کوشش کریں۔",
  },
  hi: {
    appTitle: "Repurpose",
    appTagline: "एक टेक्स्ट, हर फ़ॉर्मैट में।",
    sourceContentTitle: "स्रोत सामग्री",
    sourceContentDesc: "वीडियो ट्रांसक्रिप्ट, पॉडकास्ट नोट्स, या कोई भी लंबा टेक्स्ट यहाँ पेस्ट करें।",
    textareaPlaceholder: "अपना टेक्स्ट यहाँ पेस्ट करें…",
    outputFormatLabel: "आउटपुट फ़ॉर्मैट",
    outputLanguageLabel: "आउटपुट भाषा",
    sameAsSourceLanguage: "स्रोत टेक्स्ट जैसी",
    siteLanguageLabel: "साइट की भाषा",
    repurposeButton: "सामग्री बनाएं",
    repurposingButton: "बनाया जा रहा है…",
    tooShort: (n) => "जनरेशन सक्षम करने के लिए कम से कम " + n + " अक्षर जोड़ें।",
    emptyStateTitle: "आपकी बनाई गई सामग्री यहाँ दिखाई देगी",
    emptyStateDesc: "अपना टेक्स्ट पेस्ट करें, एक फ़ॉर्मैट चुनें, और सामग्री बनाएं पर क्लिक करें।",
    loadingTitle: "आपकी सामग्री फिर से लिखी जा रही है…",
    loadingDesc: "इसमें आमतौर पर कुछ सेकंड लगते हैं।",
    errorTitle: "जनरेशन विफल हुआ",
    tryAgain: "फिर से कोशिश करें",
    twitterLabel: "ट्विटर/X थ्रेड",
    twitterSub: "5 ट्वीट्स",
    linkedinLabel: "लिंक्डइन पोस्ट",
    linkedinSub: "हुक + मुख्य बिंदु",
    blogLabel: "ब्लॉग लेख",
    blogSub: "SEO के अनुकूल",
    contactTitle: "मुझसे संपर्क करें ✉️",
    contactDesc: "साइट को बेहतर बनाने के लिए कोई सुझाव या विचार है? सीधे मुझे संदेश भेजें!",
    namePlaceholder: "आपका नाम",
    emailPlaceholder: "आपका ईमेल",
    messagePlaceholder: "अपना सुझाव या संदेश यहाँ लिखें...",
    sendButton: "संदेश भेजें",
    sendingButton: "भेजा जा रहा है...",
    contactSuccess: "संदेश सफलतापूर्वक भेजा गया! धन्यवाद।",
    contactErrorFallback: "कुछ गलत हो गया, कृपया फिर से कोशिश करें।",
  },
  de: {
    appTitle: "Repurpose",
    appTagline: "Ein Text. Jedes Format.",
    sourceContentTitle: "Quellinhalt",
    sourceContentDesc: "Fügen Sie ein Video-Transkript, Podcast-Notizen oder einen langen Text ein.",
    textareaPlaceholder: "Fügen Sie hier Ihren Text ein…",
    outputFormatLabel: "Ausgabeformat",
    outputLanguageLabel: "Ausgabesprache",
    sameAsSourceLanguage: "Wie der Quelltext",
    siteLanguageLabel: "Sprache der Seite",
    repurposeButton: "Inhalt erstellen",
    repurposingButton: "Wird erstellt…",
    tooShort: (n) => "Fügen Sie mindestens " + n + " Zeichen hinzu, um die Generierung zu aktivieren.",
    emptyStateTitle: "Ihr generierter Inhalt wird hier angezeigt",
    emptyStateDesc: "Fügen Sie Ihren Text ein, wählen Sie ein Format und klicken Sie auf Inhalt erstellen.",
    loadingTitle: "Ihr Inhalt wird neu geschrieben…",
    loadingDesc: "Das dauert normalerweise nur wenige Sekunden.",
    errorTitle: "Generierung fehlgeschlagen",
    tryAgain: "Erneut versuchen",
    twitterLabel: "Twitter/X-Thread",
    twitterSub: "5 Tweets",
    linkedinLabel: "LinkedIn-Beitrag",
    linkedinSub: "Aufhänger + Stichpunkte",
    blogLabel: "Blogartikel",
    blogSub: "SEO-optimiert",
    contactTitle: "Kontaktieren Sie mich ✉️",
    contactDesc: "Haben Sie Feedback oder eine Idee zur Verbesserung der Seite? Schreiben Sie mir direkt!",
    namePlaceholder: "Ihr Name",
    emailPlaceholder: "Ihre E-Mail",
    messagePlaceholder: "Schreiben Sie hier Ihren Vorschlag oder Ihre Nachricht...",
    sendButton: "Nachricht senden",
    sendingButton: "Wird gesendet...",
    contactSuccess: "Nachricht erfolgreich gesendet! Danke.",
    contactErrorFallback: "Etwas ist schiefgelaufen, bitte versuchen Sie es erneut.",
  },
};

interface UILanguageContextValue {
  lang: UILanguage;
  t: Translations;
  setLang: (lang: UILanguage) => void;
}

const UILanguageContext = createContext<UILanguageContextValue | null>(null);

export function UILanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<UILanguage>("en");

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGUAGES.includes(lang) ? "rtl" : "ltr";
  }, [lang]);

  return (
    <UILanguageContext.Provider value={{ lang, t: TRANSLATIONS[lang], setLang }}>
      {children}
    </UILanguageContext.Provider>
  );
}

export function useUILanguage(): UILanguageContextValue {
  const ctx = useContext(UILanguageContext);
  if (!ctx) {
    throw new Error("useUILanguage must be used inside UILanguageProvider");
  }
  return ctx;
}
