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

const SITE_TITLE = "Repurpose — turn one transcript into every format";
const SITE_DESCRIPTION =
  "Paste a transcript or long-form text and generate a Twitter/X thread, LinkedIn post, or SEO blog article.";

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
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} font-body bg-paper text-ink antialiased`}
      >
        <UILanguageProvider>{children}</UILanguageProvider>
      </body>
    </html>
  );
}
