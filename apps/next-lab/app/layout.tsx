import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "./providers/query-provider";

export const metadata: Metadata = {
  title: "Next.js Lab",
  description: "Framework experimentation app for Next.js",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
