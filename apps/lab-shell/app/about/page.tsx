import Link from "next/link";
import LabIcon from "../components/LabIcon";
import { featureNavigationItems } from "../lib/lab-navigation";

export default function AboutPage() {
  return (
    <main className="workspace-page space-y-8">
      <header>
        <p className="mb-2 font-mono text-[10px] font-medium tracking-[0.15em] text-primary">ABOUT THE LAB</p>
        <h1 className="text-[28px] leading-snug font-bold tracking-[-0.9px] sm:text-[31px]">
          궁금한 것은 만들어보고,<br />
          선택에는 이유를 남깁니다<span className="ml-2 text-primary">.</span>
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          AI의 추천에 직접 확인한 경험을 더합니다.{" "}<br className="hidden sm:block" />
          프레임워크와 라이브러리의 동작, 코드, 성능을 비교하며 내 프로젝트에 맞는 선택의 근거를 찾습니다.{" "}<br className="hidden sm:block" />
          그 과정에서 떠오른 아이디어는 직접 만들어, 함께 나눕니다.
        </p>
      </header>

      <section aria-labelledby="lab-purposes">
        <h2 id="lab-purposes" className="mb-4 text-[17px] font-semibold tracking-tight">비교하고, 확인하고, 만들어보는 공간</h2>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          <Link href="/performance" className="flex min-w-0 flex-col rounded-xl border border-border bg-white p-5 transition-colors hover:border-primary/40">
            <LabIcon name="gauge" className="mb-5 h-6 w-6 text-primary" />
            <h3 className="text-base font-semibold">성능 측정</h3>
            <p className="mt-3 text-sm font-medium">선택에 근거를 더합니다</p>
            <p className="mt-2 mb-5 text-[13px] leading-relaxed text-muted-foreground">같은 조건에서 측정한 결과를 비교합니다. 속도뿐 아니라 측정 환경과 구현 방식까지 함께 확인합니다.</p>
            <span className="mt-auto flex items-center justify-between border-t border-border pt-4 text-[11px] font-semibold text-primary">측정 결과 보기<LabIcon name="arrow-right" className="h-3.5 w-3.5" /></span>
          </Link>
          <div className="flex min-w-0 flex-col rounded-xl border border-border bg-white p-5">
            <LabIcon name="code" className="mb-5 h-6 w-6 text-primary" />
            <h3 className="text-base font-semibold">기능 비교</h3>
            <p className="mt-3 text-sm font-medium">같은 기능, 서로 다른 방법</p>
            <p className="mt-2 mb-5 text-[13px] leading-relaxed text-muted-foreground">직접 조작하고 코드를 나란히 읽으며, 구현 방식에 따라 달라지는 경험을 살펴봅니다.</p>
            <nav aria-label="기능 비교 카테고리" className="mt-auto grid grid-cols-2 gap-2 border-t border-border pt-4">
              {featureNavigationItems.map((item) => (
                <Link key={item.href} href={item.href} className="flex min-h-10 items-center justify-between gap-2 rounded-lg px-2 text-[11px] font-semibold text-primary hover:bg-primary-subtle">
                  {item.label}<LabIcon name="arrow-right" className="h-3.5 w-3.5 shrink-0" />
                </Link>
              ))}
            </nav>
          </div>
          <Link href="/void-ui?category=standalone-services" className="flex min-w-0 flex-col rounded-xl border border-border bg-white p-5 transition-colors hover:border-primary/40">
            <LabIcon name="layers" className="mb-5 h-6 w-6 text-primary" />
            <h3 className="text-base font-semibold">실험실</h3>
            <p className="mt-3 text-sm font-medium">작은 호기심이 만든 것들</p>
            <p className="mt-2 mb-5 text-[13px] leading-relaxed text-muted-foreground">직접 기획하고 만든 서비스와 UI 실험을 소개합니다. 지도 편집기 Termia부터 작은 인터랙션까지, 떠오른 생각을 실제로 사용할 수 있는 모습으로 만들어갑니다.</p>
            <span className="mt-auto flex items-center justify-between border-t border-border pt-4 text-[11px] font-semibold text-primary">만든 서비스 둘러보기<LabIcon name="arrow-right" className="h-3.5 w-3.5" /></span>
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
