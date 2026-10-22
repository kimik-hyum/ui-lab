import type { Article } from "../article";

export function ArticleContent({ article }: { article: Article }) {
  return (
    <article data-article-id={article.id} className="space-y-5 text-sm leading-7">
      <div className="space-y-2">
        <p className="text-xs text-slate-500">고정 아티클 · 양쪽 공통 데이터</p>
        <h1 className="text-lg font-semibold leading-snug text-slate-900">{article.title}</h1>
      </div>
      <p className="border-l-2 border-slate-300 pl-3 text-slate-600">{article.intro}</p>
      {article.sections.map((section) => (
        <section key={section.heading}>
          <h2 className="mb-1 font-semibold text-slate-800">{section.heading}</h2>
          <p className="text-slate-600">{section.body}</p>
        </section>
      ))}
    </article>
  );
}
