import type { Metadata } from "next";
import "./globals.css";
import AppShell from "./components/AppShell";
import { QueryProvider } from "./providers/query-provider";

export const metadata: Metadata = {
  title: "UI-LAB",
  description: "프레임워크와 라이브러리의 동작·코드·성능을 직접 비교하고, 직접 만든 서비스와 UI 실험을 소개하는 공간입니다.",
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
