"use client";

export default function ArticleResponseError({ retry }: { retry: () => void }) {
  return (
    <main className="space-y-3 p-4 text-sm text-slate-600">
      <h1 className="font-semibold text-slate-900">아티클을 불러오지 못했습니다.</h1>
      <p>서버 응답 중 오류가 발생했습니다. 같은 요청을 다시 시도할 수 있습니다.</p>
      <button type="button" onClick={retry} className="rounded border border-slate-200 px-3 py-2 text-slate-700">다시 시도</button>
    </main>
  );
}
