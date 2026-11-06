import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ResponsiveTables from "./ResponsiveTables";
import styles from "./responsive-tables.module.css";

export const metadata: Metadata = {
  title: "반응형 테이블 | UI-LAB",
  description: "기본 표와 상위 행 아래로 상세 행이 펼쳐지는 표의 반응형 패턴을 직접 비교합니다.",
};

export default function ResponsiveTablesPage() {
  return (
    <main className={`workspace-page ${styles.page}`}>
      <Link
        href="/void-ui?category=ui-implementations"
        className="mb-6 inline-flex min-h-10 items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        실험실로 돌아가기
      </Link>
      <header className="mb-7 space-y-3">
        <p className="font-mono text-[11px] font-medium tracking-[0.16em] text-primary">RESPONSIVE TABLE / FLAT & INNER</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">같은 표, 다른 작은 화면.</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          넓을 때는 같은 표입니다. 좁아지면 스크롤하거나, 접거나, 모양을 바꿉니다.
          화면을 줄여 보세요. 작은 화면에서 무엇을 먼저 보여줄지 함께 비교할 수 있습니다.
        </p>
      </header>
      <Suspense fallback={<p role="status" className="py-8 text-sm text-muted-foreground">테이블 실험을 준비하고 있습니다.</p>}>
        <ResponsiveTables />
      </Suspense>
    </main>
  );
}
