import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Repurpose",
  description:
    "Free, Starter, and Pro plans for Repurpose. Turn one transcript into threads, posts, captions, and articles.",
  alternates: {
    canonical: "https://www.repurpose.tools/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
