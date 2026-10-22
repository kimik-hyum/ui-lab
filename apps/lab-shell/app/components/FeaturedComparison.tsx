import Link from "next/link";
import LabIcon from "./LabIcon";

const snippets = [
  {
    label: "A",
    title: "직접 상태 관리",
    file: "TraditionalList.tsx",
    accent: "text-amber-300",
    code: [
      "const [localItems, setLocalItems] =",
      "  useState(items);",
      "",
      "useEffect(() => {",
      "  setLocalItems(items);",
      "}, [items]);",
    ],
  },
  {
    label: "B",
    title: "useOptimistic",
    file: "OptimisticList.tsx",
    accent: "text-emerald-300",
    code: [
      "const [optimisticItems, addOptimisticItem]",
      "  = useOptimistic(",
      "    items,",
      "    (state: Todo[], newItem: Todo) =>",
      "      [...state, newItem]",
      "  );",
    ],
  },
];

export default function FeaturedComparison() {
  return (
    <section
      className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#253640] bg-[#18262e] text-white"
      aria-labelledby="featured-title"
    >
      <div className="flex items-start justify-between gap-4 p-5 pb-4 lg:p-6 lg:pb-5">
        <div>
          <p className="mb-2.5 font-mono text-[9px] font-medium tracking-[0.15em] text-[#86b8aa]">
            FEATURE SPOTLIGHT
          </p>
          <h2
            id="featured-title"
            className="text-[23px] font-semibold tracking-[-0.7px]"
          >
            같은 동작, 다른 구현.
          </h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#a9bac3]">
            낙관적 업데이트의 상태 관리, 코드를 나란히 놓고 비교해 보세요.
          </p>
        </div>
        <span className="mt-0.5 shrink-0 rounded-md border border-[#3a4c55] bg-[#25343d] px-2 py-1 font-mono text-[9px] text-[#bad4e1]">
          React 19
        </span>
      </div>
      <div className="mx-5 grid min-w-0 overflow-hidden rounded-lg border border-[#34434c] bg-[#121e25] sm:grid-cols-2 lg:mx-6">
        {snippets.map((snippet) => (
          <div
            key={snippet.label}
            className="min-w-0 first:border-b first:border-[#34434c] sm:first:border-r sm:first:border-b-0"
          >
            <div className="flex items-center gap-2 border-b border-[#2a3942] px-3 py-2.5">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border border-current/25 font-mono text-[9px] ${snippet.accent}`}
              >
                {snippet.label}
              </span>
              <h3 className="text-[10px] font-medium text-[#d8e2e7]">
                {snippet.title}
              </h3>
              <span className="ml-auto font-mono text-[9px] text-[#718791]">
                TSX
              </span>
            </div>
            <pre
              className="overflow-x-auto py-3.5 text-[10px] leading-[1.85]"
              aria-label={`${snippet.file} 핵심 코드 발췌`}
            >
              <code>
                {snippet.code.map((line, index) => (
                  <span key={index} className="block px-3">
                    <span
                      aria-hidden="true"
                      className="mr-4 inline-block w-2 select-none text-right text-[#58707c]"
                    >
                      {index + 1}
                    </span>
                    <span
                      className={index < 2 ? snippet.accent : "text-[#a8bec8]"}
                    >
                      {line || " "}
                    </span>
                    {"\n"}
                  </span>
                ))}
              </code>
            </pre>
          </div>
        ))}
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 px-5 py-4 lg:px-6">
        <span className="text-[10px] text-[#91a8b4]">
          상태 소유권 · 실패 복구 · 연속 요청
        </span>
        <Link
          href="/front-feature/react/optimistic"
          className="flex min-h-8 items-center gap-2 rounded-md bg-[#c5eadc] px-3 text-[11px] font-semibold text-[#143c31] transition-colors hover:bg-[#dbf5e9]"
        >
          비교 실험 열기
          <LabIcon name="arrow-right" className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
