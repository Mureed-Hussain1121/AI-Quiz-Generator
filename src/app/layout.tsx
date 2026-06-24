import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "AI Quiz Generator from PDF",
    template: "%s | AI Quiz Generator",
  },
  description:
    "Transform any PDF into an interactive quiz in seconds using AI. Perfect for students, teachers, and trainers.",
  keywords: [
    "AI quiz generator",
    "PDF to quiz",
    "quiz maker",
    "study tool",
    "education AI",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "AI Quiz Generator",
    title: "AI Quiz Generator from PDF",
    description:
      "Transform any PDF into an interactive quiz in seconds using AI.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
