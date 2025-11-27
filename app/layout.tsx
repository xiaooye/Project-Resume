import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import Navbar from "@/components/layout/Navbar";
import { AgentProvider } from "@/lib/ai-agent/agent-context";
import GlobalAgent from "@/components/ai-agent/GlobalAgent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Senior Full Stack Developer Portfolio",
  description:
    "Portfolio showcasing advanced full-stack development skills including real-time systems, WebAssembly, AI/ML, cloud services, and more.",
  keywords: [
    "full stack developer",
    "next.js",
    "react",
    "typescript",
    "webassembly",
    "AI",
    "machine learning",
    "cloud services",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
      >
        <div className="floating-shapes"></div>
        <div className="noise-texture"></div>
        <ThemeProvider>
          <AgentProvider>
            <Navbar />
            <main className="is-fullheight pt-6">{children}</main>
            <GlobalAgent />
          </AgentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
