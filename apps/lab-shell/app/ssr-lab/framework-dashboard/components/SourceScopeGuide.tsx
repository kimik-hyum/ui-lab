import type { FrameworkId } from "../_lib/types";
import { FRAMEWORK_PRESENTATION } from "../presentation";
import { FRAMEWORK_SOURCE_CATALOG, SOURCE_SCOPES, type ComparisonSources, type SourceScopeId } from "../source-catalog";

const EDIT_SCOPES = [
  { scope: "view", label: "빈 상태 안내" },
  { scope: "data", label: "지연·빈 팀 처리" },
  { scope: "errors", label: "404 처리" },
] as const satisfies readonly { scope: SourceScopeId; label: string }[];

export function SourceScopeGuide({ scope, left, right, sources, onScopeChange }: {
  scope: SourceScopeId;
  left: FrameworkId;
  right: FrameworkId;
  sources: ComparisonSources;
  onScopeChange: (scope: SourceScopeId) => void;
}) {
  return <section aria-label="비교 코드의 파일 구조" className="space-y-3">
    <div role="group" aria-label="수정할 내용으로 코드 범위 선택" className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-medium text-slate-700">수정하려면</span>
      {EDIT_SCOPES.map((item) => <button
        key={item.scope}
        type="button"
        aria-pressed={scope === item.scope}
        onClick={() => onScopeChange(item.scope)}
        className={`min-h-11 max-w-full rounded-lg border px-3 py-2 text-left text-xs font-medium leading-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 ${scope === item.scope ? "border-violet-600 bg-violet-50 text-violet-700" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}
      >{item.label} <span aria-hidden="true">→</span> {SOURCE_SCOPES[item.scope].label}</button>)}
    </div>
    <div>
      <h2 className="font-semibold text-slate-800">현재 코드 범위 · {SOURCE_SCOPES[scope].label}</h2>
      <p className="text-xs text-slate-500">{SOURCE_SCOPES[scope].description} View Code에서 선택한 범위의 실제 소스를 비교합니다.</p>
      {scope === "errors" && <p className="mt-2 text-xs text-slate-500">404 응답은 UI-LAB의 공통 안내로 표시합니다. 여기서는 원본 앱의 경계 코드를 비교하며, 원본 복구 버튼은 실행하지 않습니다.</p>}
    </div>
    <div className="grid gap-3 md:grid-cols-2">
      {[left, right].map((id) => <article key={id} className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="font-medium text-slate-800">{FRAMEWORK_PRESENTATION[id].label} <span className="text-xs font-normal text-slate-500">· 이 범위 {sources[id][scope].files.length}개 파일</span></h3>
        <p className="text-xs text-slate-500">{scope === "errors" && id === "nuxt"
          ? <>404 생성·전달은 이 프로젝트 코드이며, 화면은 Nuxt 기본 오류 UI를 사용합니다. 전용 <code>error.vue</code>는 없습니다.</>
          : FRAMEWORK_SOURCE_CATALOG[id][scope].description}</p>
        <ul className="mt-2 space-y-2 text-xs leading-relaxed text-slate-600">
          {sources[id][scope].files.map((file) => <li key={file}><code className="break-all">{file}</code></li>)}
        </ul>
      </article>)}
    </div>
    <p className="text-xs text-slate-500">공통 데이터·타입·스타일은 fixtures/dashboard-ssr*에 있습니다. 위 목록은 선택한 역할의 파일이며 전체 구현량이나 DX 점수는 아닙니다.</p>
  </section>;
}
