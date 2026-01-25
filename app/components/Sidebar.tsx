import Link from "next/link";

const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r border-zinc-800 bg-black text-zinc-300 backdrop-blur-xl">
      <div className="flex h-full flex-col justify-between p-6">
        <div>
          <h1 className="mb-10 text-xl font-bold tracking-widest text-white uppercase">
            Void UI
          </h1>
          <nav className="flex flex-col space-y-4">
            <Link
              href="/concepts"
              className="text-sm font-medium transition-colors hover:text-white hover:underline decoration-zinc-500 underline-offset-4"
            >
              Concepts
            </Link>
            
            <div className="flex flex-col space-y-2">
              <Link
                href="/feature-diffs"
                className="text-sm font-medium transition-colors hover:text-white hover:underline decoration-zinc-500 underline-offset-4"
              >
                Feature Diffs
              </Link>
              <div className="flex flex-col space-y-2 pl-4 border-l border-zinc-800 ml-1">
                <Link
                  href="/feature-diffs/react"
                  className="text-xs transition-colors text-zinc-500 hover:text-zinc-300"
                >
                  React
                </Link>
                <Link
                  href="/feature-diffs/nextjs"
                  className="text-xs transition-colors text-zinc-500 hover:text-zinc-300"
                >
                  Next.js
                </Link>
              </div>
            </div>

            <Link
              href="/about"
              className="text-sm font-medium transition-colors hover:text-white hover:underline decoration-zinc-500 underline-offset-4"
            >
              About
            </Link>
          </nav>
        </div>
        
        <div className="text-xs text-zinc-600">
          <p>© 2026 UI LAB</p>
          <p className="mt-1">System Status: Online</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
