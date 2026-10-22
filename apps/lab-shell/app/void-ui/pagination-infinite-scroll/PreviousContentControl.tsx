type PreviousContentControlProps = {
  canLoadPrevious: boolean;
  autoEnabled: boolean;
  isLoading: boolean;
  hasError: boolean;
  onLoad: () => Promise<boolean>;
};

export function PreviousContentControl({ canLoadPrevious, autoEnabled, isLoading, hasError, onLoad }: PreviousContentControlProps) {
  return (
    <div data-previous-content className="flex min-h-24 flex-col items-center justify-center gap-2 pb-4 text-center">
      {canLoadPrevious ? (
        <>
          <button
            type="button"
            onClick={() => { void onLoad(); }}
            disabled={isLoading || hasError}
            className="min-h-11 rounded-full border border-zinc-600 bg-zinc-900 px-5 py-2 text-sm text-zinc-200 enabled:hover:border-cyan-400 enabled:hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? "불러오는 중…" : autoEnabled ? "이전 콘텐츠 더 보기" : "이전 콘텐츠 보기"}
          </button>
          <p role="status" className="text-xs text-zinc-400">
            {autoEnabled ? "위로 스크롤하면 이전 콘텐츠를 이어서 불러옵니다." : "한 번 누르면 위쪽 스크롤로도 불러올 수 있습니다."}
          </p>
        </>
      ) : <p role="status" className="text-xs text-zinc-500">첫 페이지까지 불러왔습니다.</p>}
    </div>
  );
}
