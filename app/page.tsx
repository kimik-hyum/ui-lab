export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-24 relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900 rounded-full blur-[128px]"></div>
      </div>

      <div className="z-10 flex flex-col items-center text-center">
        <div className="mb-8 relative">
           <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 opacity-75 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200 animate-pulse"></div>
           <span className="relative inline-block px-4 py-1 rounded-full bg-black text-xs font-mono text-zinc-400 border border-zinc-800">
            EXPERIMENT_ID: NULL_01
           </span>
        </div>

        <h1 className="text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600 mb-6">
          Void UI
        </h1>
        
        <p className="max-w-2xl text-xl text-zinc-500 font-light mb-12">
          우리가 아직 보지 못한, 세상에 존재하지 않는 인터페이스를 탐구합니다.
          <br className="hidden md:block" />
          <span className="text-zinc-600 text-sm mt-2 block font-mono">
            Exploring interfaces beyond reality.
          </span>
        </p>

        <div className="flex gap-6">
          <button className="px-8 py-3 bg-white text-black text-sm font-bold tracking-widest hover:bg-zinc-200 transition-colors">
            ENTER LAB
          </button>
          <button className="px-8 py-3 border border-zinc-800 text-zinc-400 text-sm font-bold tracking-widest hover:text-white hover:border-white transition-colors">
            VIEW DOCS
          </button>
        </div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none"></div>
    </main>
  );
}
