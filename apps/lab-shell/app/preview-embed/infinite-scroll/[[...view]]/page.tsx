import { notFound } from "next/navigation";
import PaginationInfiniteScrollPage from "../../../void-ui/pagination-infinite-scroll/page";
import AdapterLivePage from "../../../void-ui/pagination-infinite-scroll/adapter-live/page";
import AdapterViewPage from "../../../void-ui/pagination-infinite-scroll/adapter-view/page";
import PaginationInfiniteHookPage from "../../../void-ui/pagination-infinite-scroll/hook/page";
import styles from "./preview-embed.module.css";

type InfiniteScrollPreviewProps = {
  params: Promise<{ view?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InfiniteScrollPreview({ params, searchParams }: InfiniteScrollPreviewProps) {
  const { view = [] } = await params;
  if (view.length > 1) notFound();

  const currentView = view[0] ?? "demo";
  const isCodeView = currentView === "adapter-view" || currentView === "hook";

  let content;
  switch (currentView) {
    case "demo":
      content = <PaginationInfiniteScrollPage searchParams={searchParams} />;
      break;
    case "adapter-live":
      content = <AdapterLivePage searchParams={searchParams} />;
      break;
    case "adapter-view":
      content = <AdapterViewPage />;
      break;
    case "hook":
      content = <PaginationInfiniteHookPage />;
      break;
    default:
      notFound();
  }

  return (
    <div
      className={`${styles.embed} ${isCodeView ? styles.code : styles.live}`}
      data-infinite-root="v1"
      data-infinite-view={currentView}
      data-infinite-path={`/preview-embed/infinite-scroll${view.length ? `/${view[0]}` : ""}`}
    >
      {content}
    </div>
  );
}
