import Link from "next/link";
import LabIcon from "../components/LabIcon";
import ComparisonExplorer from "../components/ComparisonExplorer";

export default function FrontFeaturePage() {
  return (
    <main className="workspace-page space-y-8">
      <header>
        <p className="mb-2 font-mono text-[10px] font-medium tracking-[0.15em] text-primary">FEATURE COMPARISONS</p>
        <h1 className="text-[28px] font-bold tracking-[-0.9px] sm:text-[31px]">
          기능 비교<span className="ml-2 text-primary">.</span>
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          같은 문제를 푸는 두 구현의 실행 결과와 코드를 나란히 확인합니다.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        {[
          { title: "React", href: "/front-feature/react", icon: "react" as const, description: "입력·제출·숨김·구독을 다루는 상태 관리 방식을 비교합니다." },
          { title: "Next.js", href: "/front-feature/nextjs", icon: "next" as const, description: "서버와 클라이언트, 스트리밍, 캐시와 서버 액션을 비교합니다." },
          { title: "라이브러리", href: "/front-feature/libraries", icon: "code" as const, description: "가상 목록과 데이터 캐시에서 라이브러리가 맡는 역할을 확인합니다." },
          { title: "SSR 구현 비교", href: "/front-feature/ssr", icon: "layers" as const, description: "서버 데이터 로딩과 프레임워크별 HTML 구현을 비교합니다." },
        ].map((item) => <Link key={item.href} href={item.href} className="group flex min-w-0 flex-col rounded-xl border border-border bg-card p-6 hover:border-primary/40"><LabIcon name={item.icon} className="mb-5 h-6 w-6 text-primary" /><h2 className="text-xl font-semibold">{item.title}</h2><p className="my-3 text-sm text-muted-foreground">{item.description}</p><span className="mt-auto border-t border-border pt-4 text-xs font-semibold text-primary">비교 둘러보기 →</span></Link>)}
      </div>

      <ComparisonExplorer />

      <section className="rounded-xl border border-border bg-white p-5 sm:p-6" aria-labelledby="comparison-guide">
        <h2 id="comparison-guide" className="text-sm font-semibold">비교 화면은 이렇게 사용하세요</h2>
        <ol className="mt-5 grid gap-5 md:grid-cols-3">
          <li className="flex gap-3"><span className="font-mono text-xs text-primary">01</span><div><h3 className="text-xs font-semibold">먼저 실행하기</h3><p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">같은 입력으로 양쪽 데모를 조작하고 화면의 반응을 살펴봅니다.</p></div></li>
          <li className="flex gap-3"><span className="font-mono text-xs text-primary">02</span><div><h3 className="text-xs font-semibold">코드 비교하기</h3><p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">코드 보기로 전환해 같은 역할을 하는 구현을 나란히 읽습니다.</p></div></li>
          <li className="flex gap-3"><span className="font-mono text-xs text-primary">03</span><div><h3 className="text-xs font-semibold">차이점 이해하기</h3><p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">설명 토픽을 선택하고 연결된 코드를 확인합니다.</p></div></li>
        </ol>
      </section>
    </main>
  );
}
