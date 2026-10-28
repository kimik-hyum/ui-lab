import Link from "next/link";
import LabIcon from "../components/LabIcon";
import { featureNavigationItems } from "../lib/lab-navigation";

export default function AboutPage() {
  return (
    <main className="workspace-page space-y-8">
      <header>
        <p className="mb-2 font-mono text-[10px] font-medium tracking-[0.15em] text-primary">ABOUT THE LAB</p>
        <h1 className="text-[28px] font-bold tracking-[-0.9px] sm:text-[31px]">
          작게 만들고, 직접 검증하기<span className="ml-2 text-primary">.</span>
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          UI Lab은 프론트엔드의 구현 방식과 사용자 경험을 비교하는 실험 공간입니다.<br className="hidden sm:block" />
          실행 결과와 소스 코드, 측정 조건을 함께 보고 프로젝트에 맞는 선택을 찾아갑니다.
        </p>
      </header>

      <section aria-labelledby="lab-purposes">
        <h2 id="lab-purposes" className="mb-4 text-[17px] font-semibold tracking-tight">공간별 역할</h2>
        <div className="grid gap-4 md:grid-cols-2 min-[1500px]:grid-cols-3">
          <Link href="/performance" className="flex min-w-0 flex-col rounded-xl border border-border bg-white p-5 transition-colors hover:border-primary/40">
            <LabIcon name="gauge" className="mb-5 h-6 w-6 text-primary" />
            <h3 className="text-base font-semibold">성능 측정</h3>
            <p className="mt-2 mb-5 text-[13px] leading-relaxed text-muted-foreground">동일한 상품 상세 시나리오를 여러 프레임워크로 구현하고, 콘텐츠 도착 시간과 응답 특성을 살펴봅니다.</p>
            <span className="mt-auto flex items-center justify-between border-t border-border pt-4 text-[11px] font-semibold text-primary">측정 결과 보기<LabIcon name="arrow-right" className="h-3.5 w-3.5" /></span>
          </Link>
          <div className="flex min-w-0 flex-col rounded-xl border border-border bg-white p-5">
            <LabIcon name="code" className="mb-5 h-6 w-6 text-primary" />
            <h3 className="text-base font-semibold">기능 비교</h3>
            <p className="mt-2 mb-5 text-[13px] leading-relaxed text-muted-foreground">React와 Next.js의 기능을 기존 구현과 나란히 놓고, 코드 복잡도와 실제 동작의 차이를 확인합니다.</p>
            <nav aria-label="기능 비교 카테고리" className="mt-auto grid grid-cols-2 gap-2 border-t border-border pt-4">
              {featureNavigationItems.map((item) => (
                <Link key={item.href} href={item.href} className="flex min-h-10 items-center justify-between gap-2 rounded-lg px-2 text-[11px] font-semibold text-primary hover:bg-primary-subtle">
                  {item.label}<LabIcon name="arrow-right" className="h-3.5 w-3.5 shrink-0" />
                </Link>
              ))}
            </nav>
          </div>
          <Link href="/void-ui" className="flex min-w-0 flex-col rounded-xl border border-border bg-white p-5 transition-colors hover:border-primary/40">
            <LabIcon name="layers" className="mb-5 h-6 w-6 text-primary" />
            <h3 className="text-base font-semibold">실험실</h3>
            <p className="mt-2 mb-5 text-[13px] leading-relaxed text-muted-foreground">무한스크롤과 페이지 복원처럼 직접 구상한 아이디어를 구현하고 사용 경험을 다듬습니다.</p>
            <span className="mt-auto flex items-center justify-between border-t border-border pt-4 text-[11px] font-semibold text-primary">UI 실행하기<LabIcon name="arrow-right" className="h-3.5 w-3.5" /></span>
          </Link>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-border bg-white p-5 sm:p-6" aria-labelledby="lab-source">
        <div>
          <h2 id="lab-source" className="text-sm font-semibold">결과와 근거를 함께 확인하기</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">측정값은 실행 환경과 조건을 함께 확인하세요. 구현 코드와 실험 방법은 저장소에서 읽을 수 있습니다.</p>
        </div>
        <a href="https://github.com/kimik-hyum/ui-lab" target="_blank" rel="noreferrer" className="flex min-h-10 items-center gap-2 rounded-lg border border-border px-4 text-xs font-medium hover:bg-surface">
          <LabIcon name="github" className="h-4 w-4" />GitHub 저장소<span className="sr-only"> (새 탭)</span><LabIcon name="arrow-up-right" className="h-3.5 w-3.5" />
        </a>
      </section>
    </main>
  );
}
