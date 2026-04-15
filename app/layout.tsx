import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wei | Senior Full Stack Developer - Web App Migration, AI Integration",
  description:
    "I help companies modernize legacy web applications and ship AI-powered features. Specializing in code migration, RAG/LLM integration, and production architecture.",
  keywords: [
    "full stack developer",
    "web app migration",
    "AI integration",
    "legacy modernization",
    "RAG pipeline",
    "LLM integration",
    "typescript",
    "vue.js",
    "nuxt.js",
    "freelance developer",
  ],
  openGraph: {
    title: "Wei | Senior Full Stack Developer",
    description:
      "I help companies modernize legacy web applications and ship AI-powered features.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${dmSerif.variable} ${geistMono.variable}`}
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <ThemeProvider>
          <Navbar />
          <main className="is-fullheight pt-6">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
