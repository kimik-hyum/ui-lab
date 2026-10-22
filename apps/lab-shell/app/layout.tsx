import type { Metadata } from "next";
import { Josefin_Sans } from "next/font/google";
import "./globals.css";
import AppShell from "./components/AppShell";
import { QueryProvider } from "./providers/query-provider";

const josefinSans = Josefin_Sans({
  variable: "--font-josefin-sans",
  subsets: ["latin"],
  weight: ["300", "400"],
});

export const metadata: Metadata = {
  title: "UI-LAB",
  description: "UI-LAB experiments and feature comparisons",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        suppressHydrationWarning
        className={`${josefinSans.variable} antialiased bg-white text-slate-900`}
      >
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
      </body>
    </html>
  );
}
