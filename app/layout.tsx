import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { UILanguageProvider } from "@/lib/ui-language";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const SITE_TITLE = "Repurpose — حوّل نصاً واحداً إلى كل الصيغ";
const SITE_DESCRIPTION =
  "الصق تفريغ فيديو أو بودكاست أو أي نص طويل، واحصل على ثريد تويتر أو منشور لينكدإن أو مقال محسّن لمحركات البحث — بالعربية وسبع لغات أخرى.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.repurpose.tools"),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: "Repurpose",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Repurpose",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "ar_QA",
    alternateLocale: ["en_US", "fr_FR", "es_ES", "tr_TR", "ur_PK", "hi_IN", "de_DE"],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} font-body bg-paper text-ink antialiased`}
      >
        <UILanguageProvider>{children}</UILanguageProvider>
      </body>
    </html>
  );
}
