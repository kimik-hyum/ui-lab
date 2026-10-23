import type { Metadata } from "next";
import "./globals.css";
import AppShell from "./components/AppShell";
import { QueryProvider } from "./providers/query-provider";

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
        className="antialiased bg-background text-foreground"
      >
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
      </body>
    </html>
  );
}
