import Link from "next/link";

const EXPERIMENTS = [

  {
    id: "optimistic",
    title: "Optimistic Updates",
    description: "Experience the perceived performance difference with optimistic UI updates.",
    badge: "useOptimistic"
  }
];

export default function ReactDiffsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-black text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-2 tracking-tighter">React Feature Diffs</h1>
        <p className="text-zinc-500 mb-12">
          Compare classical patterns with modern React features.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {EXPERIMENTS.map((exp) => (
            <Link 
              key={exp.id} 
              href={`/feature-diffs/react/${exp.id}`}
              className="group relative block p-6 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800/50 transition-all hover:border-zinc-700"
            >
               <div className="flex justify-between items-start mb-4">
                 <span className="px-2 py-1 text-xs rounded bg-blue-900/30 text-blue-400 border border-blue-900">
                    {exp.badge}
                 </span>
                 <span className="text-zinc-600 group-hover:text-white transition-colors">
                    ↗
                 </span>
               </div>
               
               <h2 className="text-xl font-bold mb-2 text-zinc-100 group-hover:text-white">
                 {exp.title}
               </h2>
               <p className="text-zinc-400 group-hover:text-zinc-300">
                 {exp.description}
               </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
