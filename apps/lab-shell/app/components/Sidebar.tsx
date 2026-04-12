import Link from "next/link";

const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r border-slate-200 bg-white text-slate-600">
      <div className="flex h-full flex-col justify-between p-6">
        <div>
          <h1 className="mb-10 text-xl font-josefin font-bold tracking-widest text-slate-900 uppercase">
            UI-LAB
          </h1>
          <nav className="flex flex-col space-y-1">
            <Link
              href="/void-ui"
              className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-violet-50 hover:text-violet-600"
            >
              Void UI
            </Link>

            <div className="flex flex-col space-y-1">
              <Link
                href="/front-feature"
                className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-violet-50 hover:text-violet-600"
              >
                Front Feature
              </Link>
              <div className="flex flex-col space-y-0.5 pl-4 border-l border-slate-200 ml-3">
                <Link
                  href="/front-feature/react"
                  className="rounded px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-violet-50 hover:text-violet-600"
                >
                  React
                </Link>
                <Link
                  href="/front-feature/nextjs"
                  className="rounded px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-violet-50 hover:text-violet-600"
                >
                  Next.js
                </Link>
                {process.env.NODE_ENV === "development" && (
                  <Link
                    href="/front-feature/scout"
                    className="rounded px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-violet-50 hover:text-violet-600"
                  >
                    Frontend Scout
                  </Link>
                )}
              </div>
            </div>

            <Link
              href="/reports"
              className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-violet-50 hover:text-violet-600"
            >
              Scout Reports
            </Link>

            <Link
              href="/about"
              className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-violet-50 hover:text-violet-600"
            >
              About
            </Link>
          </nav>
        </div>

        <div className="text-xs text-slate-400">
          <p>© 2026 UI-LAB</p>
          <p className="mt-1">System Status: Online</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
