/* Review-only page content. Measurements are intentionally not fabricated. */
// The original feature catalogs distinguish implemented comparisons from planned work.
// Preview-only interactions stay in their own section and never claim library execution.
function comparisonCard({ href, title, description, badge, detail, preview = false }) {
  const family = href.split("/")[2];
  return `<a class="catalog-card comparison-catalog-card" data-family="${family}" href="${href}" data-status="${preview ? "preview" : "available"}">
    <div class="card-content"><div class="card-meta"><span class="badge">${badge.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</span><span class="tag">${preview ? "화면 시안" : "구현됨"}</span></div>
    <h2 class="card-title">${title}</h2><p class="card-description">${description}</p>
    <div class="card-bottom"><span class="mono">${detail}</span><span class="card-link-label">${preview ? "시안 보기" : "비교 열기"} <span aria-hidden="true">↗</span></span></div></div>
  </a>`;
}

function implementedCount(family) {
  return window.UI_LAB_COMPARISONS.filter((item) => item.family === family).length;
}

function implementedComparisons(family) {
  return window.UI_LAB_COMPARISONS.filter((item) => item.family === family).map((item) => comparisonCard({
    href: `#/features/${item.slug}`, title: item.title, description: item.description, badge: item.badge, detail: item.since,
  })).join("");
}

function plannedComparisons(items) {
  return `<section class="catalog-section"><div class="section-heading-row"><div><h2 class="section-title">예정 항목</h2><p class="section-description">기존 카탈로그의 준비 중인 기능입니다. 아직 실행 화면이 없습니다.</p></div></div>
    <div class="list-panel planned-comparisons">${items.map(({ title, description, since }) => `<article class="list-row" data-status="planned"><div><h3>${title}</h3><p>${description}</p><span class="planned-since">${since}</span></div><span class="status-pill">예정</span></article>`).join("")}</div>
  </section>`;
}

function previewComparisons(cards, description) {
  return `<section class="catalog-section"><div class="section-heading-row"><div><h2 class="section-title">화면 시안</h2><p class="section-description">${description}</p></div><span class="status-pill">로컬 모형</span></div><div class="catalog-grid feature-catalog">${cards.map((card) => comparisonCard({ ...card, preview: true })).join("")}</div></section>`;
}

window.UI_LAB_PAGES = {
  lab: {
    title: "실험실",
    eyebrow: "직접 만드는 UI",
    description: "기존 패턴을 조합해 만든 UI를 실행하고, 구현 구조를 살펴봅니다.",
    parent: "워크스페이스",
    nav: "lab",
    body: `
      <div class="page-toolbar">
        <div class="filter-pills" aria-label="실험 분류"><button data-filter="all" aria-pressed="true">전체 <span>1</span></button></div>
        <label class="search-field"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg><input type="search" placeholder="실험 검색" aria-label="실험 검색"></label>
      </div>
      <div class="catalog-grid" id="experiment-catalog">
        <a class="catalog-card" data-family="lab" href="#/lab/infinite-scroll" data-category="interaction" data-status="available" data-search="무한 스크롤 infinite scroll 페이지네이션 페이지 이동 복원 React Virtuoso 어댑터 훅">
          <div class="card-content"><div class="card-meta"><span class="badge">탐색 UI</span><span class="tag">구현됨</span></div><h2 class="card-title">무한 스크롤</h2><p class="card-description">페이지 점프·복원과 자동 로딩을 결합한 UI입니다. 일반·Virtuoso 실행과 어댑터·훅 해설을 확인합니다.</p><div class="card-bottom"><span class="framework-stack"><span class="tag">React</span><span class="tag">Virtuoso</span></span><span class="card-link-label">실험 열기 <span aria-hidden="true">↗</span></span></div></div>
        </a>
      </div>
      <div class="empty-state" id="catalog-empty" hidden><h2>일치하는 실험이 없습니다.</h2><p>다른 검색어로 살펴보세요.</p></div>
      <div class="note-panel catalog-note"><span class="status-dot" aria-hidden="true"></span><p>현재 실험실에는 무한 스크롤 1개가 있습니다. 프레임워크와 라이브러리의 구현 방식 차이는 기능 비교에서 다룹니다.</p></div>
    `,
  },
  features: {
    title: "기능 비교",
    eyebrow: "구현 방식의 차이",
    description: "프레임워크·라이브러리별로 같은 기능의 화면과 코드를 비교합니다.",
    parent: "워크스페이스",
    nav: "features",
    body: `
      <div class="section-heading-row"><div><h2 class="section-title">비교 분류</h2><p class="section-description">기존 React·Next.js 기능과 라이브러리·프레임워크 비교를 나눠 살펴봅니다.</p></div><span class="status-pill">4개 분류</span></div>
      <div class="catalog-grid feature-group-catalog">
        <a class="catalog-card catalog-group-card" data-family="react" href="#/features/react"><div class="card-content"><div class="card-meta"><span class="badge">React</span><span class="tag">기능 비교</span></div><h2 class="card-title">React</h2><p class="card-description">입력 우선순위, 폼 액션, 숨김과 구독을 직접 실행하고 코드를 비교합니다.</p><div class="card-bottom"><span class="mono">구현 ${implementedCount("react")} · 예정 1</span><span class="card-link-label">분류 열기 <span aria-hidden="true">↗</span></span></div></div></a>
        <a class="catalog-card catalog-group-card" data-family="nextjs" href="#/features/nextjs"><div class="card-content"><div class="card-meta"><span class="badge">Next.js</span><span class="tag">기능 비교</span></div><h2 class="card-title">Next.js</h2><p class="card-description">데이터 로딩·폼 제출·HTML 스트리밍의 서버 처리 흐름을 비교합니다.</p><div class="card-bottom"><span class="mono">구현 ${implementedCount("nextjs")} · 예정 2</span><span class="card-link-label">분류 열기 <span aria-hidden="true">↗</span></span></div></div></a>
        <a class="catalog-card catalog-group-card" data-family="libraries" href="#/features/libraries"><div class="card-content"><div class="card-meta"><span class="badge">라이브러리</span><span class="tag">목록·캐시</span></div><h2 class="card-title">라이브러리 비교</h2><p class="card-description">Virtuoso의 DOM 범위와 TanStack Query의 캐시 재사용을 직접 실행하고 코드를 비교합니다.</p><div class="card-bottom"><span class="mono">구현 ${implementedCount("libraries")}</span><span class="card-link-label">분류 열기 <span aria-hidden="true">↗</span></span></div></div></a>
        <a class="catalog-card catalog-group-card" data-family="frameworks" href="#/features/frameworks"><div class="card-content"><div class="card-meta"><span class="badge">프레임워크</span><span class="tag">SSR 비교</span></div><h2 class="card-title">프레임워크 비교</h2><p class="card-description">네 프레임워크의 서버 HTML과 데이터 로딩 구조를 같은 작은 대시보드로 비교합니다.</p><div class="card-bottom"><span class="mono">구현 ${implementedCount("frameworks")} · 시안 1</span><span class="card-link-label">분류 열기 <span aria-hidden="true">↗</span></span></div></div></a>
      </div>
      <div class="note-panel catalog-note"><span class="status-dot" aria-hidden="true"></span><p><b>구현됨</b>은 기존 실행·코드 비교 화면이며 실측 성능을 뜻하지 않습니다. <b>예정</b>은 미구현 항목, <b>화면 시안</b>은 로컬 모형입니다.</p></div>
    `,
  },
  reports: {
    title: "리포트",
    eyebrow: "결과와 근거를 함께",
    description: "주제별 결과와 실행 조건을 같은 형식으로 살펴봅니다.",
    parent: "워크스페이스",
    nav: "reports",
    body: `
      <div class="section-heading-row"><div><h2 class="section-title">리포트 목록</h2><p class="section-description">실행 조건과 원본 기록을 함께 읽습니다.</p></div><span class="status-pill">기록 1 · 미연결 1</span></div>
      <div class="list-panel report-list">
        <a class="list-row" href="#/reports/dashboard-ssr"><div><span class="small-label">서버 렌더링 · 고정 데이터</span><h3>팀 대시보드 SSR</h3><p>같은 팀 데이터를 네 프레임워크에서 반복 요청하고, 콘텐츠 도착 시간과 편차를 기록했습니다.</p></div><span class="status-pill">20회 기록</span><span class="card-link-label">리포트 열기 <span aria-hidden="true">↗</span></span></a>
        <a class="list-row" href="#/reports/ssr"><div><span class="small-label">서버 렌더링</span><h3>상품 상세 SSR</h3><p>Next.js · SvelteKit · Nuxt · React Router의 렌더링 결과를 모아보는 리포트입니다.</p></div><span class="status-pill">결과 미연결</span><span class="card-link-label">리포트 열기 <span aria-hidden="true">↗</span></span></a>
      </div>
      <div class="note-panel catalog-note"><p>서버 응답과 브라우저 성능은 구분해 읽습니다. 기록의 날짜·버전·실행 조건이 다르면 수치를 직접 비교하지 않습니다.</p></div>
    `,
  },
  upgrades: window.UI_LAB_UPGRADE_LOGS.listPage,
  guide: {
    title: "디자인 기준",
    eyebrow: "어느 페이지에서도 같은 언어로",
    description: "색, 간격, 정보의 순서를 맞춰 콘텐츠에 집중하는 작업 공간을 만듭니다.",
    parent: "워크스페이스",
    nav: "guide",
    body: `
      <div class="section-heading-row"><div><h2 class="section-title">하나의 셸, 다양한 화면</h2><p class="section-description">페이지가 바뀌어도 탐색 위치, 제목과 액션의 자리는 유지합니다.</p></div><span class="status-pill">이번 시안의 기준</span></div>
      <div class="metric-grid"><article class="metric-card"><span class="step-number">01</span><h3>목록에서는 탐색</h3><p>동일한 카드, 분류와 설명으로 다음 실험을 찾습니다.</p><span class="small-label">목록 → 실험 상세</span></article><article class="metric-card"><span class="step-number">02</span><h3>상세에서는 비교</h3><p>동일한 탭, 양쪽 패널과 설명 영역으로 차이를 읽습니다.</p><span class="small-label">목록 → 기능 비교 상세</span></article><article class="metric-card"><span class="step-number">03</span><h3>기록에서는 근거</h3><p>동일한 목록과 상세 구조로 결과와 변경 이유를 찾습니다.</p><span class="small-label">목록 → 기록 상세</span></article></div>
      <div class="catalog-section guide-grid"><section class="guide-panel"><h2 class="section-title">색의 역할</h2><p class="section-description">따뜻한 차콜 위에 회백색 본문을 놓습니다. 세이지색은 선택과 주요 동작에만 사용하고, 패널은 작은 밝기 차이로 구분합니다.</p><div class="swatch-grid"><div><span class="guide-swatch swatch-canvas"></span><b>작업 배경</b><small>#141413</small></div><div><span class="guide-swatch swatch-paper"></span><b>콘텐츠</b><small>#1C1C1A</small></div><div><span class="guide-swatch swatch-accent"></span><b>강조</b><small>#B8C5A1</small></div><div><span class="guide-swatch swatch-ink"></span><b>본문</b><small>#E8E6DF</small></div></div></section><section class="guide-panel"><h2 class="section-title">글자의 역할</h2><p class="section-description">본문은 14–16px, 보조 정보는 12px를 기준으로 제목과 설명의 대비를 유지합니다.</p><div class="guide-type"><span class="guide-title-sample">무엇을 비교하나요?</span><span class="guide-body-sample">핵심 설명은 짧고 구체적으로 씁니다.</span><span class="guide-meta-sample">버전 · 날짜 · 실험 조건</span></div></section></div>
      <div class="catalog-section guide-grid"><section class="guide-panel"><h2 class="section-title">간격의 리듬</h2><p class="section-description">작은 정보는 가까이, 다른 주제는 충분히 떨어뜨립니다.</p><div class="guide-spacing"><div><span class="space-sample space-8"></span><b>8</b><small>아이콘과 라벨</small></div><div><span class="space-sample space-16"></span><b>16</b><small>정보 사이</small></div><div><span class="space-sample space-24"></span><b>24</b><small>카드와 패널</small></div><div><span class="space-sample space-32"></span><b>32</b><small>다음 섹션</small></div></div></section><section class="guide-panel"><h2 class="section-title">상태를 설명하는 방식</h2><p class="section-description">색만으로 구분하지 않고 짧은 이름을 함께 씁니다.</p><div class="status-examples"><span class="status-pill">결과 미연결</span><span class="badge">서버 렌더링</span><span class="tag">React</span><span class="preview-badge"><span></span>레이아웃 시안</span></div><p class="section-description">아직 없는 결과는 빈 상태로 안내하고, 데모의 범위를 명확히 표시합니다.</p></section></div>
      <div class="catalog-section"><div class="section-heading-row"><div><h2 class="section-title">화면이 작아져도 같은 흐름</h2><p class="section-description">정보의 순서는 유지하고, 열 수와 탐색 방식만 조정합니다.</p></div></div><div class="list-panel"><div class="list-row"><b>와이드 모니터</b><p>좌측 탐색을 고정하고 넓은 본문을 사용합니다. 비교 패널과 조건을 나란히 놓습니다.</p><span class="tag">공간을 넓게</span></div><div class="list-row"><b>태블릿</b><p>카드는 두 열로, 메뉴와 부가 조건은 접어 본문을 확보합니다.</p><span class="tag">본문에 집중</span></div><div class="list-row"><b>휴대폰</b><p>서랍형 메뉴와 한 열 구성을 사용합니다. 비교 패널은 같은 순서로 세로 배치합니다.</p><span class="tag">순서를 유지</span></div></div></div>
    `,
  },
};

window.UI_LAB_FEATURE_CATALOGS = {
  react: {
    title: "React",
    eyebrow: "기능 비교 · React",
    description: "입력·제출·숨김·구독을 다루는 작은 예제로 상태 관리의 차이를 확인합니다.",
    parent: "기능 비교",
    parentPath: "/features",
    backLabel: "비교 분류",
    nav: "features",
    body: `
      <div class="section-heading-row"><div><h2 class="section-title">구현된 비교</h2><p class="section-description">버튼을 눌러 동작을 보고, 같은 화면에서 전후 코드를 비교합니다.</p></div><span class="status-pill">${implementedCount("react")}개</span></div>
      <div class="catalog-grid feature-catalog">${implementedComparisons("react")}</div>
      ${plannedComparisons([
        { title: "Transition Patterns", description: "긴급·비긴급 업데이트를 분리하는 패턴 비교", since: "React 18부터" },
      ])}

    `,
  },
  nextjs: {
    title: "Next.js",
    eyebrow: "기능 비교 · Next.js",
    description: "데이터를 읽고 폼을 제출하며, 서버가 응답을 만드는 방식을 비교합니다.",
    parent: "기능 비교",
    parentPath: "/features",
    backLabel: "비교 분류",
    nav: "features",
    body: `
      <div class="section-heading-row"><div><h2 class="section-title">구현된 비교</h2><p class="section-description">버튼을 눌러 동작을 보고, 같은 화면에서 전후 코드를 비교합니다.</p></div><span class="status-pill">${implementedCount("nextjs")}개</span></div>
      <div class="catalog-grid feature-catalog">${implementedComparisons("nextjs")}</div>
      ${plannedComparisons([
        { title: "Partial Prerendering", description: "정적·동적 영역을 함께 구성하는 렌더링 전략 비교", since: "Next.js 14부터" },
        { title: "Routing Patterns", description: "Pages Router와 App Router의 구조 비교", since: "Next.js 13부터" },
      ])}
    `,
  },
  libraries: {
    title: "라이브러리 비교",
    eyebrow: "기능 비교 · 라이브러리",
    description: "같은 화면을 만드는 코드와 라이브러리가 담당하는 일을 비교합니다.",
    parent: "기능 비교",
    parentPath: "/features",
    backLabel: "비교 분류",
    nav: "features",
    body: `
      <div class="section-heading-row"><div><h2 class="section-title">실행 가능한 라이브러리 비교</h2><p class="section-description">목록의 DOM 범위와 데이터 재사용을 실제 라이브러리로 확인합니다.</p></div><span class="status-pill">${implementedCount("libraries")}개</span></div>
      <div class="catalog-grid feature-catalog">${implementedComparisons("libraries")}</div>
    `,
  },
  frameworks: {
    title: "프레임워크 비교",
    eyebrow: "기능 비교 · 프레임워크",
    description: "같은 데이터로 서버가 준비한 HTML과 로딩 구조를 살펴봅니다.",
    parent: "기능 비교",
    parentPath: "/features",
    backLabel: "비교 분류",
    nav: "features",
    body: `
      <div class="section-heading-row"><div><h2 class="section-title">실행 가능한 SSR 비교</h2><p class="section-description">프레임워크별 서버 진입점과 순차·동시 데이터 로딩을 비교합니다.</p></div><span class="status-pill">${implementedCount("frameworks")}개 비교</span></div>
      <div class="catalog-grid feature-catalog">${implementedComparisons("frameworks")}</div>
      ${previewComparisons([
        { href: "#/features/frameworks/shopping-detail-ssr", title: "상품 상세 SSR", description: "Next.js·SvelteKit·Nuxt·React Router의 비교 화면 시안입니다. 저장소의 별도 앱 구현은 이 화면에 아직 연결되지 않았습니다.", badge: "서버 렌더링", detail: "화면 모형 · 실측값 없음" },
      ], "별도 앱의 실제 실행·측정과 분리한 데모입니다. 프레임워크 성능 순위를 나타내지 않습니다.")}
    `,
  },
};

window.UI_LAB_REPORTS = {
  ssr: {
    title: "상품 상세 SSR",
    eyebrow: "서버 렌더링 · 결과 기록",
    keywords: ["콘텐츠 도착", "전송량", "같은 실행 조건"],
    observe: "셸 도착과 핵심 콘텐츠 도착은 다릅니다. 같은 조건의 측정값끼리 비교하는 표 구조를 확인하세요.",
    description: "프레임워크별 결과와 실행 조건을 한곳에서 읽습니다.",
    parent: "리포트",
    nav: "reports",
    body: `
      <div class="section-heading-row"><div><h2 class="section-title">상품 상세 SSR</h2><p class="section-description">결과를 모아 읽는 화면의 예시입니다. 성능 측정값은 포함하지 않았습니다.</p></div><span class="status-pill">리포트 상세</span></div>
      <div class="metric-grid"><article class="metric-card"><span class="small-label">콘텐츠가 도착하기까지</span><strong>—</strong><h3>콘텐츠 도착 시간</h3><p>응답에서 핵심 데이터가 확인된 시점</p><span class="status-pill">결과 미연결</span></article><article class="metric-card"><span class="small-label">눈에 보이기까지</span><strong>—</strong><h3>주요 콘텐츠 표시</h3><p>사용자에게 큰 콘텐츠가 보이는 시점</p><span class="status-pill">결과 미연결</span></article><article class="metric-card"><span class="small-label">브라우저에 전달하는 양</span><strong>—</strong><h3>전송 JavaScript</h3><p>화면을 구성하는 스크립트 전송량</p><span class="status-pill">결과 미연결</span></article></div>
      <div class="catalog-section"><div class="section-heading-row"><div><h2 class="section-title">프레임워크별 결과</h2><p class="section-description">측정일, 버전과 실행 조건이 같은 기록끼리 비교합니다.</p></div><span class="status-pill">화면 구성 예시</span></div><div class="table-scroll" tabindex="0" aria-label="프레임워크별 측정 결과, 작은 화면에서는 좌우 스크롤"><table><thead><tr><th scope="col">프레임워크</th><th scope="col">콘텐츠 도착</th><th scope="col">주요 콘텐츠 표시</th><th scope="col">전송 JavaScript</th><th scope="col">상태</th></tr></thead><tbody><tr><th scope="row">Next.js</th><td>—</td><td>—</td><td>—</td><td><span class="status-pill">결과 미연결</span></td></tr><tr><th scope="row">SvelteKit</th><td>—</td><td>—</td><td>—</td><td><span class="status-pill">결과 미연결</span></td></tr><tr><th scope="row">Nuxt</th><td>—</td><td>—</td><td>—</td><td><span class="status-pill">결과 미연결</span></td></tr><tr><th scope="row">React Router</th><td>—</td><td>—</td><td>—</td><td><span class="status-pill">결과 미연결</span></td></tr></tbody></table></div></div>
      <div class="catalog-section split-layout"><article class="note-panel report-note"><div><span class="small-label">결과 옆에 남길 조건</span><h3>다시 실행할 수 있는 기록</h3><p>코드 버전, 데이터, 캐시 설정과 반복 횟수를 결과와 함께 보여주는 구성입니다.</p></div></article><article class="note-panel report-note"><div><span class="small-label">현재 시안의 범위</span><h3>측정값을 채우기 전의 화면</h3><p>순위나 성능 차이를 가정하지 않았습니다. 기존 측정 기록을 연결합니다.</p></div></article></div>
    `,
  },
};
