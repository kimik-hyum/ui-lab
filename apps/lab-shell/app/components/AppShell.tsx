"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Sidebar from "./Sidebar";

const INFINITE_SCROLL_PREVIEW_PATH = "/preview-embed/infinite-scroll";
const FEATURE_PREVIEW_PATH = "/preview-embed/features";
const SSR_PREVIEW_PATH = "/preview-embed/ssr";
const UPGRADE_PREVIEW_PATH = "/preview-embed/upgrades";

function PreviewFrameBridge() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    if (window.parent === window) return;

    window.parent.postMessage(
      { type: "ui-lab:infinite-location", pathname, search },
      window.location.origin,
    );
  }, [pathname, search]);

  return null;
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isInfiniteScrollPreview =
    pathname === INFINITE_SCROLL_PREVIEW_PATH ||
    pathname.startsWith(`${INFINITE_SCROLL_PREVIEW_PATH}/`);
  const isFeaturePreview = pathname.startsWith(`${FEATURE_PREVIEW_PATH}/`);
  const isSsrPreview = pathname.startsWith(`${SSR_PREVIEW_PATH}/`);
  const isUpgradePreview = pathname === UPGRADE_PREVIEW_PATH || pathname.startsWith(`${UPGRADE_PREVIEW_PATH}/`);

  if (isInfiniteScrollPreview || isFeaturePreview || isSsrPreview || isUpgradePreview) {
    return (
      <div className="min-h-screen min-w-0 bg-[#181816] text-[#e8e6df]">
        {isInfiniteScrollPreview && (
          <Suspense fallback={null}>
            <PreviewFrameBridge />
          </Suspense>
        )}
        {children}
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="min-h-screen pl-64">{children}</div>
    </>
  );
}
