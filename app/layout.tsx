import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { MotionEffects } from "./MotionEffects";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  const baseUrl = host ? `${protocol}://${host}` : "https://openai.site";
  const socialImage = `${baseUrl}/og.png`;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: "Kova — робочий простір фрилансера",
      template: "%s · Kova",
    },
    description:
      "Проєкти, клієнти, задачі та бюджет в одному мінімалістичному кабінеті.",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Kova — менше рутини, більше зроблено",
      description:
        "Спокійний робочий простір для фрилансерів та незалежних спеціалістів.",
      images: [{ url: socialImage, width: 1728, height: 909, alt: "Kova" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Kova — менше рутини, більше зроблено",
      description: "Робочий простір для фрилансерів.",
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <MotionEffects />
        {children}
      </body>
    </html>
  );
}
