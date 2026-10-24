"use client";

export default function DataLoadingError({ retry }: { retry: () => void }) {
  return <main className="min-h-screen bg-[#181816] p-5 text-[#e8e6df]"><h1 className="text-lg">서버 응답을 준비하지 못했습니다.</h1><button type="button" onClick={retry} className="mt-4 rounded border border-[#56624a] px-4 py-2 text-sm">다시 시도</button></main>;
}
