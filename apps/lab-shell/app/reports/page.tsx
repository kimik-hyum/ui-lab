export default function ReportsPage() {
  return (
    <div className="mx-auto flex min-h-[540px] max-w-4xl flex-col justify-center px-5 py-10 sm:px-8 lg:min-h-[calc(100dvh-var(--shell-header-height))] lg:px-12">
      <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-white text-accent">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 12h7M9 16h7" /></svg>
      </div>
      <p className="font-mono text-[11px] tracking-[0.15em] text-accent">FROM RELEASE TO REALITY</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">새로운 기능, 도입할 가치가 있을까요?</h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">릴리스 노트에서 발견한 변화와 실제 구현의 차이를 살펴봅니다. 리포트 목록에서 읽을 자료를 선택하세요.</p>
      <div className="mt-9 grid gap-3 sm:grid-cols-3">
        {[
          ["01", "변화 확인", "버전별 주요 변경점과 새로운 기능을 확인합니다."],
          ["02", "도입 판단", "도입 권장·관찰·보류 판단의 근거를 읽습니다."],
          ["03", "코드로 검증", "구현된 실험으로 이동해 동작과 코드를 비교합니다."],
        ].map(([number, title, description]) => (
          <section key={number} className="rounded-xl border border-border bg-white p-5">
            <span className="font-mono text-xs text-muted-foreground">{number}</span>
            <h2 className="mt-4 text-sm font-semibold text-foreground">{title}</h2>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">{description}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
