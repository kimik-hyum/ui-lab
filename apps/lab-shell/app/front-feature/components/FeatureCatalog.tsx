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
    <main className="min-h-screen bg-white p-8 md:p-14">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 border-b border-slate-200 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-3 text-slate-500">{description}</p>
          <nav className="mt-6 flex flex-wrap gap-2">
            {visibleSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </header>

        <div className="space-y-10">
          {visibleSections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-20">
              <div className="mb-4">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{section.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{section.subtitle}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {section.features.map((feature) => {
                  const commonClassName = "group relative block rounded-xl border p-5 transition-all";
                  const activeClassName =
                    feature.status === "available"
                      ? "border-slate-200 bg-white hover:border-violet-200 hover:shadow-sm hover:shadow-violet-100"
                      : "border-slate-100 bg-slate-50 cursor-not-allowed";

                  const content = (
                    <>
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="inline-block rounded border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs text-violet-600">
                            {feature.badge}
                          </span>
                          <p className="text-xs text-slate-400">{feature.since}</p>
                        </div>
                        <span
                          className={`text-xs uppercase tracking-wider ${
                            feature.status === "available" ? "text-emerald-600" : "text-slate-400"
                          }`}
                        >
                          {feature.status}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-slate-900">{feature.title}</h3>
                      <p className="mt-2 text-sm text-slate-500">{feature.description}</p>
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
