import type { Metadata } from "next";
import { Josefin_Sans } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
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
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${josefinSans.variable} antialiased bg-white text-slate-900`}
      >
        <QueryProvider>
          <Sidebar />
          <div className="pl-64 min-h-screen">{children}</div>
        </QueryProvider>
      </body>
    </html>
  );
}
