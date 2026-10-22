import Link from "next/link";
import LabIcon from "../components/LabIcon";

export default function FrontFeaturePage() {
  return (
    <main className="workspace-page space-y-8">
      <header>
        <p className="mb-2 font-mono text-[10px] font-medium tracking-[0.15em] text-accent">FEATURE COMPARISONS</p>
        <h1 className="text-[28px] font-bold tracking-[-0.9px] sm:text-[31px]">
          기능 적용 전후 비교<span className="ml-2 text-accent">.</span>
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          같은 문제를 다른 방식으로 풀어봅니다. 기능을 사용했을 때 무엇이 달라지는지 직접 확인하세요.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <Link href="/front-feature/react" className="group flex min-w-0 flex-col rounded-xl border border-border bg-white p-6 transition-colors hover:border-accent/40">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-accent">
              <LabIcon name="react" className="h-6 w-6" />
            </span>
            <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground">STATE & RENDERING</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">React</h2>
          <p className="mt-2 mb-6 text-[13px] leading-relaxed text-muted-foreground">
            useOptimistic의 낙관적 업데이트, Activity의 숨김 동작을 기존 패턴과 비교합니다.
          </p>
          <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-xs font-semibold text-accent">
            React 기능 둘러보기<LabIcon name="arrow-right" className="h-4 w-4" />
          </div>
        </Link>
        <Link href="/front-feature/nextjs" className="group flex min-w-0 flex-col rounded-xl border border-border bg-white p-6 transition-colors hover:border-accent/40">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-foreground">
              <LabIcon name="next" className="h-6 w-6" />
            </span>
            <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground">SERVER & CLIENT</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Next.js</h2>
          <p className="mt-2 mb-6 text-[13px] leading-relaxed text-muted-foreground">
            Server Component와 클라이언트 fetch 구현에서 초기 화면과 데이터 로딩이 어떻게 달라지는지 살펴봅니다.
          </p>
          <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-xs font-semibold text-accent">
            Next.js 기능 둘러보기<LabIcon name="arrow-right" className="h-4 w-4" />
          </div>
        </Link>
      </div>

      <section className="rounded-xl border border-border bg-white p-5 sm:p-6" aria-labelledby="comparison-guide">
        <h2 id="comparison-guide" className="text-sm font-semibold">비교 화면은 이렇게 사용하세요</h2>
        <ol className="mt-5 grid gap-5 md:grid-cols-3">
          <li className="flex gap-3"><span className="font-mono text-xs text-accent">01</span><div><h3 className="text-xs font-semibold">먼저 실행하기</h3><p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">같은 입력으로 양쪽 데모를 조작하고 화면의 반응을 살펴봅니다.</p></div></li>
          <li className="flex gap-3"><span className="font-mono text-xs text-accent">02</span><div><h3 className="text-xs font-semibold">코드 비교하기</h3><p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">코드 보기로 전환해 같은 역할을 하는 구현을 나란히 읽습니다.</p></div></li>
          <li className="flex gap-3"><span className="font-mono text-xs text-accent">03</span><div><h3 className="text-xs font-semibold">차이점 이해하기</h3><p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">설명 토픽을 선택하고 연결된 코드를 확인합니다.</p></div></li>
        </ol>
      </section>
    </main>
  );
}
