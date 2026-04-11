import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-24">
      <div className="flex flex-col items-center text-center">
        <div className="mb-8">
          <span className="inline-block px-4 py-1 rounded-full bg-violet-50 text-violet-600 text-xs font-mono border border-violet-200 tracking-wider">
            EXPERIMENT_ID: NULL_01
          </span>
        </div>

        <h1 className="text-7xl font-bold tracking-tighter text-slate-900 mb-6">
          UI-LAB
        </h1>

        <p className="max-w-2xl text-xl text-slate-500 font-light mb-12">
          우리가 아직 보지 못한, 세상에 존재하지 않는 인터페이스를 탐구합니다.
          <br className="hidden md:block" />
          <span className="text-slate-400 text-sm mt-2 block font-mono">
            Exploring interfaces beyond reality.
          </span>
        </p>

        <div className="flex gap-4">
          <Link
            href="/void-ui"
            className="px-8 py-3 bg-violet-600 text-white text-sm font-bold tracking-widest hover:bg-violet-700 transition-colors rounded-xl"
          >
            ENTER LAB
          </Link>
          <Link
            href="/about"
            className="px-8 py-3 border border-slate-200 text-slate-600 text-sm font-bold tracking-widest hover:border-slate-300 hover:text-slate-900 transition-colors rounded-xl"
          >
            VIEW DOCS
          </Link>
        </div>
      </div>
    </main>
  );
}
