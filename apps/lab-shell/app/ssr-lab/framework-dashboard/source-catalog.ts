import type { FrameworkId } from "./_lib/types";

export const SOURCE_SCOPE_IDS = ["entry", "data", "view", "errors"] as const;
export type SourceScopeId = (typeof SOURCE_SCOPE_IDS)[number];

export const SOURCE_SCOPES: Record<SourceScopeId, { label: string; description: string }> = {
  entry: { label: "서버 진입점", description: "요청을 받고 데이터를 기다린 뒤 화면으로 전달합니다." },
  data: { label: "데이터 처리", description: "입력 조건과 지연, 팀 데이터와 빈 상태를 처리합니다." },
  view: { label: "화면 출력", description: "전달받은 데이터로 같은 대시보드를 그립니다." },
  errors: { label: "오류 경계", description: "404와 예외를 전달하고 표시하는 코드, 복구 방법을 살펴봅니다." },
};

export type ComparisonSource = { code: string; files: string[] };
export type ComparisonSources = Record<FrameworkId, Record<SourceScopeId, ComparisonSource>>;

type SourceFiles = { description: string; files: readonly string[] };

// 이 목록에 등록한 실제 소스만 읽습니다. 브라우저 입력을 파일 경로로 사용하지 않습니다.
export const FRAMEWORK_SOURCE_CATALOG = {
  next: {
    entry: {
      description: "서버 페이지가 데이터를 기다리고 화면 컴포넌트에 전달합니다.",
      files: ["apps/next-lab/app/scenarios/dashboard-ssr/page.tsx"],
    },
    data: {
      description: "서버 전용 함수가 지연 조건과 팀 데이터를 처리합니다.",
      files: ["apps/next-lab/app/scenarios/dashboard-ssr/_lib/dashboard-ssr-data.server.ts"],
    },
    view: {
      description: "props로 받은 요약과 활동을 JSX로 출력합니다.",
      files: ["apps/next-lab/app/scenarios/dashboard-ssr/_components/DashboardSsrView.tsx"],
    },
    errors: {
      description: "notFound와 예외를 별도 파일에서 표시하고, retry로 서버를 다시 조회합니다.",
      files: [
        "apps/next-lab/app/scenarios/dashboard-ssr/page.tsx",
        "apps/next-lab/app/scenarios/dashboard-ssr/not-found.tsx",
        "apps/next-lab/app/scenarios/dashboard-ssr/error.tsx",
      ],
    },
  },
  "react-router": {
    entry: {
      description: "route loader가 준비한 데이터를 라우트 화면이 받습니다.",
      files: ["apps/react-router-lab/app/routes/scenarios.dashboard-ssr.tsx"],
    },
    data: {
      description: "서버 데이터 함수가 지연 조건과 팀 데이터를 처리합니다.",
      files: ["apps/react-router-lab/app/scenarios/dashboard-ssr/lib/dashboard-ssr-data.server.ts"],
    },
    view: {
      description: "props로 받은 요약과 활동을 JSX로 출력합니다.",
      files: ["apps/react-router-lab/app/scenarios/dashboard-ssr/components/DashboardSsrView.tsx"],
    },
    errors: {
      description: "같은 라우트의 ErrorBoundary가 404와 예외를 구분하고 새로고침을 안내합니다.",
      files: ["apps/react-router-lab/app/routes/scenarios.dashboard-ssr.tsx"],
    },
  },
  sveltekit: {
    entry: {
      description: "서버 load의 결과를 페이지가 받아 화면에 전달합니다.",
      files: [
        "apps/sveltekit-lab/src/routes/scenarios/dashboard-ssr/+page.server.ts",
        "apps/sveltekit-lab/src/routes/scenarios/dashboard-ssr/+page.svelte",
      ],
    },
    data: {
      description: "서버 함수가 쿼리를 읽고 지연 후 팀 데이터를 반환합니다.",
      files: ["apps/sveltekit-lab/src/lib/server/scenarios/dashboard-ssr.ts"],
    },
    view: {
      description: "전달받은 요약과 활동을 Svelte 템플릿으로 출력합니다.",
      files: ["apps/sveltekit-lab/src/routes/scenarios/dashboard-ssr/_components/DashboardSsrView.svelte"],
    },
    errors: {
      description: "load의 오류를 +error.svelte가 표시합니다. 이 예제에서 재시도 동작은 구현하지 않았습니다.",
      files: [
        "apps/sveltekit-lab/src/routes/scenarios/dashboard-ssr/+page.server.ts",
        "apps/sveltekit-lab/src/routes/scenarios/dashboard-ssr/+error.svelte",
      ],
    },
  },
  nuxt: {
    entry: {
      description: "페이지의 useFetch가 Nitro 응답을 기다려 화면에 전달합니다.",
      files: ["apps/vue-lab/pages/scenarios/dashboard-ssr.vue"],
    },
    data: {
      description: "Nitro handler와 서버 함수가 요청을 처리하고 공통 응답 타입을 사용합니다.",
      files: [
        "apps/vue-lab/server/api/scenarios/dashboard-ssr.get.ts",
        "apps/vue-lab/server/utils/scenarios/dashboard-ssr.ts",
        "apps/vue-lab/shared/scenarios/dashboard-ssr/types.ts",
      ],
    },
    view: {
      description: "전달받은 요약과 활동을 Vue 템플릿으로 출력합니다.",
      files: ["apps/vue-lab/components/scenarios/dashboard-ssr/DashboardSsrView.vue"],
    },
    errors: {
      description: "Nitro 응답 오류를 기본 오류 화면으로 넘깁니다. 이 예제에는 전용 error.vue가 없고 재시도 동작도 구현하지 않았습니다.",
      files: [
        "apps/vue-lab/server/api/scenarios/dashboard-ssr.get.ts",
        "apps/vue-lab/pages/scenarios/dashboard-ssr.vue",
      ],
    },
  },
} as const satisfies Record<FrameworkId, Record<SourceScopeId, SourceFiles>>;

// next.config.ts에서도 같은 허용 목록을 사용해 standalone에 원본 파일을 포함합니다.
export const FRAMEWORK_SOURCE_FILES = [...new Set(Object.values(FRAMEWORK_SOURCE_CATALOG)
  .flatMap((framework) => SOURCE_SCOPE_IDS.flatMap((scope) => [...framework[scope].files])))];
