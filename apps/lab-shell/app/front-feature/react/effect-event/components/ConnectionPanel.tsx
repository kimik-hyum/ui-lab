import type { ConnectionSnapshot } from "../connection-source";

export function ConnectionPanel({ snapshot }: { snapshot: ConnectionSnapshot }) {
  const notification = snapshot.notification;
  return (
    <article className="mx-auto max-w-xl space-y-5 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-semibold text-slate-800">알림 채널</h3><span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-600">{snapshot.room ? `${snapshot.room === "design" ? "디자인" : "개발"} 방 연결됨` : "연결 준비 중"}</span></div>
      <dl className="grid grid-cols-3 gap-3">
        {[['연결', snapshot.connections], ['정리', snapshot.disconnections], ['받은 알림', snapshot.received]].map(([label, value]) => <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-2 text-2xl font-semibold text-slate-800">{value}</dd></div>)}
      </dl>
      <div className="min-h-36" aria-live="polite" aria-label="최근 알림">
        {notification ? (
          <div data-notification-theme={notification.theme} className={`rounded-xl border p-5 ${notification.theme === "dark" ? "border-slate-700 bg-slate-800 text-slate-100" : "border-violet-200 bg-violet-50 text-violet-900"}`}>
            <p className="text-xs opacity-70">방금 받은 알림 · {notification.theme === "dark" ? "어두운" : "밝은"} 테마</p>
            <p className="mt-3 break-words text-base font-medium">{notification.text}</p>
          </div>
        ) : <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm leading-relaxed text-slate-500">상단에서 테마를 바꾼 뒤 알림을 보내세요. 연결 횟수와 알림의 테마를 함께 확인합니다.</p>}
      </div>
      <p className="text-xs leading-relaxed text-slate-500">실제 로컬 구독 이벤트를 집계합니다. 네트워크 속도나 프레임워크 성능 점수가 아닙니다.</p>
    </article>
  );
}
