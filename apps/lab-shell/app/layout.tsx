import type { Metadata } from "next";
import "./globals.css";
import AppShell from "./components/AppShell";
import { QueryProvider } from "./providers/query-provider";

export const metadata: Metadata = {
  title: { default: "UI Lab — 프론트엔드 실험실", template: "%s · UI Lab" },
  description:
    "SSR 성능, UI 패턴, React와 Next.js의 새로운 기능을 실행 결과와 코드로 비교하는 실험실입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
      </body>
    </html>
  );
}
