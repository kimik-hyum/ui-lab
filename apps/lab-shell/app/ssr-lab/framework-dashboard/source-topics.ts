import { collectAnchorLines, resolveTopicLines, stripAnchorLines } from "../../front-feature/components/codeAnchors";
import type { ComparisonTopic } from "../../front-feature/components/ComparisonTypes";
import type { FrameworkId } from "./_lib/types";
import { FRAMEWORK_PRESENTATION } from "./presentation";
import type { ComparisonSource, ComparisonSources, SourceScopeId } from "./source-catalog";

type Span = readonly [start: string, end?: string];
type TopicDefinition = { id: string; title: string; description: string };
type ErrorTopicId = "not-found" | "exception" | "recovery";
type FileSpans = { file: string; topics: Partial<Record<ErrorTopicId, readonly Span[]>> };

// Match statements in the displayed source without adding comparison-only markers.
const DATA_SPANS: Record<FrameworkId, Record<string, readonly Span[]>> = {
  next: {
    delay: [["export function resolveDashboardDelay(", "return [0, 400, 800].find"], ["if (delayMs > 0)", "await wait(delayMs);"]],
    empty: [['return teamId === "empty"', ': fixture;']],
    missing: [['if (teamId !== fixture.team.id']],
  },
  "react-router": {
    delay: [["export function resolveDashboardDelay(", "return [0, 400, 800].find"], ["if (delayMs > 0)", "await wait(delayMs);"]],
    empty: [['return teamId === "empty"', ': fixture;']],
    missing: [['if (teamId !== fixture.team.id']],
  },
  sveltekit: {
    delay: [["const rawDelay = query.get('delay');", "const delayMs = rawDelay"], ["if (delayMs > 0)", "await new Promise<void>"]],
    empty: [["if (teamId === 'empty') {", "activities: [],"]],
    missing: [["return { dashboard: null, delayMs };"]],
  },
  nuxt: {
    delay: [["const rawDelay = firstQueryValue(query.delay);", "const delayMs = rawDelay"], ["if (delayMs > 0)", "await new Promise<void>"]],
    empty: [["if (teamId === 'empty') {", "activities: [],"]],
    missing: [["return null;"]],
  },
};

const VIEW_SPANS: Record<FrameworkId, Record<string, readonly Span[]>> = {
  next: {
    props: [["export default function DashboardSsrView("]],
    summary: [["{data.summary.map", "<strong>{item.value}</strong>"]],
    activities: [["{data.activities.length > 0", '<p className="ssr-dashboard__empty">']],
  },
  "react-router": {
    props: [["export default function DashboardSsrView("]],
    summary: [["{data.summary.map", "<strong>{item.value}</strong>"]],
    activities: [["{data.activities.length > 0", '<p className="ssr-dashboard__empty">']],
  },
  sveltekit: {
    props: [["let { dashboard, delayMs }:"]],
    summary: [["{#each dashboard.summary", "<strong>{item.value}</strong>"]],
    activities: [["{#if dashboard.activities.length > 0}", "{/if}"]],
  },
  nuxt: {
    props: [["defineProps<"]],
    summary: [['<article v-for="item in dashboard.summary"', "<strong>{{ item.value }}</strong>"]],
    activities: [['<ol v-if="dashboard.activities.length > 0"', '<p v-else class="ssr-dashboard__empty">']],
  },
};

const ERROR_SPANS: Record<FrameworkId, readonly FileSpans[]> = {
  next: [
    { file: "apps/next-lab/app/scenarios/dashboard-ssr/page.tsx", topics: {
      "not-found": [["if (!dashboard) notFound();"]],
    } },
    { file: "apps/next-lab/app/scenarios/dashboard-ssr/not-found.tsx", topics: {
      "not-found": [["export default function DashboardSsrNotFound()", "</main>"]],
    } },
    { file: "apps/next-lab/app/scenarios/dashboard-ssr/error.tsx", topics: {
      exception: [['"use client";'], ["<h1>작업 현황을 불러오지 못했습니다.</h1>"], ["<p>서버 응답 중 오류가 발생했습니다."]],
      recovery: [["export default function DashboardSsrError("], ['<button type="button" onClick={retry}>']],
    } },
  ],
  "react-router": [
    { file: "apps/react-router-lab/app/routes/scenarios.dashboard-ssr.tsx", topics: {
      "not-found": [['if (!dashboard) throw new Response('], ["const missing = isRouteErrorResponse(error) && error.status === 404;"]],
      exception: [["export function ErrorBoundary()"], ["const error = useRouteError();"], ["<h1>{missing ?"]],
      recovery: [["<p>{missing ?"]],
    } },
  ],
  sveltekit: [
    { file: "apps/sveltekit-lab/src/routes/scenarios/dashboard-ssr/+page.server.ts", topics: {
      "not-found": [["if (!dashboard) error(404,"]],
    } },
    { file: "apps/sveltekit-lab/src/routes/scenarios/dashboard-ssr/+error.svelte", topics: {
      "not-found": [['<p class="ssr-dashboard__eyebrow">HTTP {page.status}</p>']],
      exception: [["import { page } from '$app/state';"], ["<h1>작업 현황을 불러오지 못했습니다.</h1>"]],
      recovery: [['<p class="ssr-dashboard__empty">{page.error?.message']],
    } },
  ],
  nuxt: [
    { file: "apps/vue-lab/server/api/scenarios/dashboard-ssr.get.ts", topics: {
      "not-found": [["if (!scenario) {"], ["statusCode: 404,"], ["message: '팀을 찾을 수 없습니다.',"]],
    } },
    { file: "apps/vue-lab/pages/scenarios/dashboard-ssr.vue", topics: {
      "not-found": [["statusCode: error.value.statusCode ?? 500,"]],
      exception: [["if (error.value) {"], ["throw createError({"], ["message: '작업 현황을 불러오지 못했습니다.',"], ["if (!data.value) {", "throw createError({ statusCode: 500,"]],
      recovery: [["fatal: true,"]],
    } },
  ],
};

const ERROR_TOPIC_TITLES: Record<ErrorTopicId, string> = {
  "not-found": "404 전달",
  exception: "예외 표시",
  recovery: "복구 방법",
};

const ERROR_TOPIC_DETAILS: Record<FrameworkId, Record<ErrorTopicId, string>> = {
  next: {
    "not-found": "notFound()가 별도 not-found.tsx로 연결합니다. 404 문구를 바꿀 파일이 분리됩니다.",
    exception: "Client Component인 error.tsx가 예외 화면을 맡아 정상 페이지와 오류 표시를 분리합니다.",
    recovery: "원본 오류 화면의 retry()가 서버 재조회와 재렌더를 함께 요청해 일시적 실패에서 복구를 시도합니다.",
  },
  "react-router": {
    "not-found": "loader의 404 Response를 같은 파일의 ErrorBoundary가 구분해 표시합니다.",
    exception: "같은 ErrorBoundary 안에서 404와 나머지 예외를 나눠 문구를 관리합니다.",
    recovery: "현재 오류 화면은 새로고침을 안내합니다. 별도 재시도 버튼은 구현하지 않았습니다.",
  },
  sveltekit: {
    "not-found": "load의 error(404)를 +error.svelte가 받아 상태와 메시지를 표시합니다.",
    exception: "+error.svelte가 페이지 오류 상태를 받아 404와 예외의 화면을 함께 관리합니다.",
    recovery: "강조된 코드는 오류 메시지만 표시합니다. 이 예제에서 재시도 동작은 구현하지 않았습니다.",
  },
  nuxt: {
    "not-found": "Nitro의 404를 useFetch로 받아 상태 코드를 유지한 채 기본 오류 화면으로 넘깁니다.",
    exception: "페이지가 응답 오류나 비어 있는 응답을 기본 오류 화면으로 넘깁니다. 프로젝트 전용 error.vue는 없습니다.",
    recovery: "fatal은 기본 오류 화면으로 넘기는 설정입니다. 이 예제에는 전용 error.vue가 없고 재시도 동작도 구현하지 않았습니다.",
  },
};

const DATA_TOPICS: TopicDefinition[] = [
  { id: "delay", title: "지연값과 0ms 처리", description: "Next.js·React Router는 별도 함수에서, SvelteKit·Nuxt는 데이터 함수 안에서 지연을 정규화합니다. 모두 0·400·800ms만 허용하며 기본값은 400ms입니다. 0ms에서는 타이머를 생략해 불필요한 대기를 측정에 섞지 않습니다." },
  { id: "empty", title: "원본을 보존하며 빈 팀 만들기", description: "같은 fixture를 복사해 요약값은 0, 활동은 빈 배열로 만듭니다. React 계열은 삼항식, SvelteKit·Nuxt는 분기로 표현합니다. 원본을 직접 바꾸지 않아 다른 요청의 데이터에 영향을 주지 않습니다." },
  { id: "missing", title: "같은 조회 조건에서 없는 팀 판별", description: "네 구현 모두 선택한 서버 대기 이후에 팀을 판별하고, 없는 팀은 null로 반환합니다. 조회 조건을 같게 유지하면서 각 프레임워크가 404로 연결하는 위치를 비교할 수 있습니다." },
];

const VIEW_TOPICS: TopicDefinition[] = [
  { id: "props", title: "준비된 데이터를 props로 받기", description: "React 함수 인자, Svelte의 $props, Vue의 defineProps로 같은 데이터와 지연값을 받습니다. 이 파일에는 데이터 조회가 없어 화면 문구를 바꿀 때 서버 로딩 코드를 함께 수정할 필요가 없습니다." },
  { id: "summary", title: "같은 요약, 다른 반복 문법", description: "React는 map, Svelte는 #each, Vue는 v-for를 사용합니다. 모두 항목의 label을 식별자로 사용해 목록의 항목을 구분합니다. 같은 데이터를 출력하는 문법과 수정 위치를 비교하세요." },
  { id: "activities", title: "활동 목록과 빈 상태", description: "React의 삼항식, Svelte의 #if, Vue의 v-if로 활동 목록과 빈 상태를 나눕니다. 빈 활동 안내 문구를 바꿀 때 수정할 영역이며, 정상 화면과 빈 화면을 한곳에서 확인할 수 있습니다." },
];

function statementLines(code: string, spans: readonly Span[]): number[] {
  const lines = stripAnchorLines(code).split("\n");
  const matched = spans.flatMap(([start, end]) => {
    const first = lines.findIndex((line) => line.includes(start));
    if (first < 0) return [];
    const offset = end ? lines.slice(first).findIndex((line) => line.includes(end)) : 0;
    if (offset < 0) return [];
    return Array.from({ length: offset + 1 }, (_, index) => first + index + 1);
  });
  return [...new Set(matched)].sort((a, b) => a - b);
}

function errorStatementLines(source: ComparisonSource, framework: FrameworkId, topic: ErrorTopicId): number[] {
  const lines = stripAnchorLines(source.code).split("\n");
  const headers = new Set(source.files.map((file) => `// ${file}`));
  const matched = ERROR_SPANS[framework].flatMap(({ file, topics }) => {
    const spans = topics[topic];
    if (!spans || !source.files.includes(file)) return [];
    const header = lines.findIndex((line) => line === `// ${file}`);
    if (header < 0) return [];
    const start = header + 1;
    const nextHeader = lines.findIndex((line, index) => index >= start && headers.has(line));
    const end = nextHeader < 0 ? lines.length : nextHeader;
    // A matching end statement must stay inside the same original file.
    return statementLines(lines.slice(start, end).join("\n"), spans).map((line) => line + start);
  });
  return [...new Set(matched)].sort((a, b) => a - b);
}

function fallback(code: string, key: string) {
  const pattern = key === "loading" ? /\bawait\b/ : key === "output" ? /return\s*<|<Dashboard/ : /import\s|export\s|<script/;
  const index = stripAnchorLines(code).split("\n").findIndex((line) => pattern.test(line));
  return [Math.max(1, index + 1)];
}

export function dashboardSourceTopics(scope: SourceScopeId, left: FrameworkId, right: FrameworkId, sources: ComparisonSources): ComparisonTopic[] {
  const leftInfo = FRAMEWORK_PRESENTATION[left];
  const rightInfo = FRAMEWORK_PRESENTATION[right];
  const definitions: TopicDefinition[] = scope === "errors"
    ? (Object.keys(ERROR_TOPIC_TITLES) as ErrorTopicId[]).map((id) => ({
      id, title: ERROR_TOPIC_TITLES[id],
      description: `${leftInfo.label}: ${ERROR_TOPIC_DETAILS[left][id]} ${rightInfo.label}: ${ERROR_TOPIC_DETAILS[right][id]}`,
    }))
    : scope === "data" ? DATA_TOPICS : scope === "view" ? VIEW_TOPICS : [
    { id: "boundary", title: "서버 데이터의 진입점", description: `${leftInfo.label}는 ${leftInfo.boundary}, ${rightInfo.label}는 ${rightInfo.boundary}에서 시작합니다. 기본 경계에 맞추면 서버 코드가 브라우저 코드에 섞이는 것을 줄일 수 있습니다.` },
    { id: "loading", title: "같은 데이터, 다른 로딩 경계", description: `${leftInfo.label}: ${leftInfo.dataPath} ${rightInfo.label}: ${rightInfo.dataPath} 양쪽 모두 같은 고정 데이터와 지연을 사용합니다. 내부 데이터 전달 경로가 다르므로 구현 코드와 응답 구조를 함께 보세요.` },
    { id: "output", title: "준비된 데이터로 같은 화면 만들기", description: "필요한 데이터를 모두 기다린 뒤 View에 전달하는 일괄 SSR입니다. 데이터와 화면 책임을 나누면 빈 상태와 404를 다루기 쉽습니다. 미리보기는 서버가 보낸 HTML이며 hydration은 실행하지 않습니다." },
  ];
  const linesFor = (framework: FrameworkId, id: string) => {
    const source = sources[framework][scope];
    const code = source.code;
    const lines = scope === "errors"
      ? errorStatementLines(source, framework, id as ErrorTopicId)
      : scope === "entry"
      ? collectAnchorLines(code)[id] ?? []
      : statementLines(code, (scope === "data" ? DATA_SPANS : VIEW_SPANS)[framework][id]);
    return resolveTopicLines([id], { [id]: lines }, fallback(code, id));
  };
  return definitions.map((topic) => ({ ...topic, id: `${scope}-${topic.id}`, leftLines: linesFor(left, topic.id), rightLines: linesFor(right, topic.id) }));
}
