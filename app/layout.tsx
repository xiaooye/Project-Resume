import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import Navbar from "@/components/layout/Navbar";
import ThemeToggle from "@/components/layout/ThemeToggle";

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
        <ThemeProvider>
          <Navbar />
          <div className="is-fixed mt-6 mr-4" style={{ top: "64px" }}>
            <ThemeToggle />
          </div>
          <main className="is-fullheight pt-6">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
