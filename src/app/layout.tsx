import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Noto_Sans_Georgian } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n";
import { isLocale, LANG_COOKIE } from "@/lib/i18n/dictionaries";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoGeorgian = Noto_Sans_Georgian({
  variable: "--font-noto-georgian",
  subsets: ["georgian"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Spark — verified random chat",
  description:
    "Send a selfie and talk to a stranger. Text, photos, voice, and GIFs.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const jar = await cookies();
  const raw = jar.get(LANG_COOKIE)?.value;
  const initialLocale = isLocale(raw) ? raw : "en";

  return (
    <html
      lang={initialLocale}
      className={`${geistSans.variable} ${geistMono.variable} ${notoGeorgian.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col text-text">
        <LanguageProvider initialLocale={initialLocale}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
