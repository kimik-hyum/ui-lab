import Link from "next/link";

export type FeatureCatalogItem = {
  id: string;
  title: string;
  description: string;
  badge: string;
  since: string;
  status: "available" | "planned";
  href?: string;
};

export type FeatureCatalogSection = {
  id: string;
  title: string;
  subtitle: string;
  features: FeatureCatalogItem[];
};

interface FeatureCatalogProps {
  title: string;
  description: string;
  sections: FeatureCatalogSection[];
}

export function FeatureCatalog({ title, description, sections }: FeatureCatalogProps) {
  const isDev = process.env.NODE_ENV === "development";

  const visibleSections = isDev
    ? sections
    : sections
        .map((section) => ({
          ...section,
          features: section.features.filter((f) => f.status !== "planned"),
        }))
        .filter((section) => section.features.length > 0);

  return (
    <main className="min-h-screen bg-black p-8 text-white md:p-14">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 border-b border-zinc-800 pb-6">
          <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 text-zinc-400">{description}</p>
          <nav className="mt-6 flex flex-wrap gap-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </header>

        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-20">
              <div className="mb-4">
                <h2 className="text-2xl font-semibold text-zinc-100">{section.title}</h2>
                <p className="mt-1 text-sm text-zinc-500">{section.subtitle}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {section.features.map((feature) => {
                  const commonClassName = "group relative block rounded-xl border p-5 transition-all";
                  const activeClassName =
                    feature.status === "available"
                      ? "border-zinc-700 bg-zinc-900/70 hover:border-zinc-500 hover:bg-zinc-900"
                      : "border-zinc-800 bg-zinc-950/60";

                  const content = (
                    <>
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="inline-block rounded border border-blue-900 bg-blue-950/40 px-2 py-0.5 text-[10px] text-blue-300">
                            {feature.badge}
                          </span>
                          <p className="text-[11px] text-zinc-500">{feature.since}</p>
                        </div>
                        <span
                          className={`text-[10px] uppercase tracking-wider ${
                            feature.status === "available" ? "text-emerald-300" : "text-zinc-500"
                          }`}
                        >
                          {feature.status}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-zinc-100">{feature.title}</h3>
                      <p className="mt-2 text-sm text-zinc-400">{feature.description}</p>
                    </>
                  );

                  if (feature.status === "available" && feature.href) {
                    return (
                      <Link
                        key={feature.id}
                        href={feature.href}
                        className={`${commonClassName} ${activeClassName}`}
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <div key={feature.id} className={`${commonClassName} ${activeClassName}`}>
                      {content}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
