import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flowsterix - Product tours that feel native",
  description:
    "A state-machine powered tour library for React. Declarative flows, 5 advance rules, router integration, and full persistence.",
  keywords: [
    "react",
    "product tour",
    "onboarding",
    "state machine",
    "typescript",
  ],
  openGraph: {
    title: "Flowsterix - Product tours that feel native",
    description:
      "A state-machine powered tour library for React. Declarative flows, 5 advance rules, router integration, and full persistence.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
