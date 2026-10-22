/* Recorded measurements only. The shared parser rejects incomplete results. */
(() => {
  "use strict";

  const TARGET_ORDER = ["next", "nuxt", "react-router", "sveltekit"];
  const REQUEST_TIMEOUT_MS = 15000;
  const numberFormat = new Intl.NumberFormat("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatNumber = (value) => numberFormat.format(value);
  const formatDate = (value) => `${new Date(value).toISOString().slice(0, 19).replace("T", " ")} UTC`;

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = String(text);
    return element;
  }

  function definitionList(entries, className = "") {
    const list = node("dl", `recorded-report__facts ${className}`.trim());
    for (const [label, value] of entries) {
      const row = node("div");
      row.append(node("dt", "", label), node("dd", "", value));
      list.append(row);
    }
    return list;
  }

  function panel(title, entries) {
    const section = node("section", "recorded-report__panel");
    section.append(node("h3", "", title), definitionList(entries));
    return section;
  }

  function resultTable(targets) {
    const container = node("div", "recorded-report__table-wrap");
    const table = node("table", "recorded-report__table");
    table.append(node("caption", "recorded-report__sr-only", "프레임워크별 콘텐츠 도착 시간과 HTML 크기. 프레임워크 이름순이며 성능 순위가 아닙니다."));
    const head = node("thead");
    const headings = node("tr");
    for (const label of ["프레임워크 / 버전", "렌더링", "최소 (ms)", "중앙값 (ms)", "p95 (ms)", "HTML (KiB)"]) {
      const cell = node("th", "", label);
      cell.scope = "col";
      headings.append(cell);
    }
    head.append(headings);
    const body = node("tbody");
    for (const target of targets) {
      const row = node("tr");
      const framework = node("th");
      framework.scope = "row";
      framework.append(node("strong", "", target.label), node("span", "recorded-report__version", target.version));
      const mode = node("td");
      mode.append(node("span", "neutral-badge", target.renderMode));
      const values = target.statistics.contentReadyMs;
      row.append(framework, mode, node("td", "recorded-report__number", formatNumber(values.min)), node("td", "recorded-report__number recorded-report__median", formatNumber(values.median)), node("td", "recorded-report__number", formatNumber(values.p95)), node("td", "recorded-report__number", formatNumber(target.statistics.htmlBytes.median / 1024)));
      body.append(row);
    }
    table.append(head, body);
    container.append(table);
    return container;
  }

  function resultCards(targets) {
    const cards = node("div", "recorded-report__cards");
    for (const target of targets) {
      const card = node("article", "recorded-report__result-card");
      const heading = node("header", "recorded-report__card-heading");
      const name = node("div");
      name.append(node("h3", "", target.label), node("p", "recorded-report__version", target.version));
      heading.append(name, node("span", "neutral-badge", target.renderMode));
      const median = node("div", "recorded-report__card-median");
      const value = node("p");
      value.append(node("strong", "", formatNumber(target.statistics.contentReadyMs.median)), node("span", "", " ms"));
      median.append(node("p", "small-label", "콘텐츠 도착 · 중앙값"), value);
      card.append(heading, median, definitionList([
        ["최소", `${formatNumber(target.statistics.contentReadyMs.min)} ms`],
        ["p95", `${formatNumber(target.statistics.contentReadyMs.p95)} ms`],
        ["HTML 중앙값", `${formatNumber(target.statistics.htmlBytes.median / 1024)} KiB`],
      ], "recorded-report__card-facts"));
      cards.append(card);
    }
    return cards;
  }

  function resultViews(report, targets) {
    const element = node("div", "recorded-report__views");
    const controls = node("div", "segmented recorded-report__view-controls");
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", "측정 결과 보기");
    const summary = node("div");
    summary.id = "report-summary-view";
    summary.append(resultTable(targets), resultCards(targets), node("p", "recorded-report__footnote", "p95는 20회 중 19번째로 작은 값입니다. HTML은 읽은 응답 본문의 크기이며, 개별 표본과 전체 응답 시간은 원본 JSON에서 확인할 수 있습니다."));
    const distribution = window.UI_LAB_REPORT_DISTRIBUTION.create(report);
    distribution.element.id = "report-distribution-view";
    const controller = new AbortController();
    const views = [
      { id: "distribution", label: "20회 분포", content: distribution.element },
      { id: "summary", label: "요약 수치", content: summary },
    ];
    const buttons = views.map((view) => {
      const button = node("button", "", view.label);
      button.type = "button";
      button.setAttribute("aria-controls", view.content.id);
      button.addEventListener("click", () => select(view.id), { signal: controller.signal });
      controls.append(button);
      return button;
    });
    function select(id) {
      views.forEach((view, index) => {
        view.content.hidden = view.id !== id;
        buttons[index].setAttribute("aria-pressed", String(view.id === id));
      });
    }
    select("distribution");
    element.append(controls, distribution.element, summary);
    return { element, dispose: () => { controller.abort(); distribution.dispose(); } };
  }

  function provenanceDetails(report) {
    const details = node("details", "recorded-report__provenance");
    details.append(node("summary", "", "코드 출처와 파일 목록"));
    const content = node("div", "recorded-report__provenance-content");
    content.append(definitionList([
      ["Git 커밋", report.provenance.gitCommit],
      ["작업 상태", report.provenance.dirty ? "미커밋 변경 포함" : "커밋 상태"],
      ["로컬 소스 SHA-256", report.provenance.sourceDigest],
    ]));
    const files = node("ul", "recorded-report__source-files");
    for (const source of report.provenance.sourceFiles) {
      const file = node("li");
      file.append(node("code", "", source.path), node("span", "", `SHA-256 ${source.sha256}`));
      files.append(file);
    }
    content.append(node("p", "recorded-report__footnote", "버전은 관찰 빌드의 설치 패키지 기준입니다. 이 파일 목록은 수집 당시의 로컬 소스이며, 실행 중인 서버와의 일치는 기록 전에 별도로 확인합니다."), files);
    details.append(content);
    return details;
  }

  function renderReport(report, downloadUrl) {
    const fragment = document.createDocumentFragment();
    const targets = TARGET_ORDER.map((id) => report.targets.find((target) => target.id === id));
    const intro = node("div", "recorded-report__toolbar");
    const summary = node("div");
    summary.append(node("p", "small-label", "기록된 서버 응답"), node("p", "recorded-report__run-summary", `프레임워크별 ${report.method.runs}회 · 워밍업 ${report.method.warmup}회 제외`));
    const download = node("a", "button", "원본 JSON 내려받기");
    download.href = downloadUrl;
    download.download = "dashboard-ssr.json";
    intro.append(summary, download);
    fragment.append(intro);

    const results = node("section", "recorded-report__results");
    results.setAttribute("aria-labelledby", "recorded-report-result-title");
    const heading = node("div", "recorded-report__section-heading");
    const title = node("h2", "section-title", "콘텐츠 도착 시간");
    title.id = "recorded-report-result-title";
    heading.append(title, node("p", "", "프레임워크 이름순"));
    const views = resultViews(report, targets);
    results.append(heading, node("p", "recorded-report__explanation", "핵심 콘텐츠의 완료 태그를 받을 때까지의 시간입니다. 브라우저 표시·hydration은 제외합니다."), views.element);
    fragment.append(results);

    const context = node("div", "recorded-report__context");
    context.append(panel("실행 조건", [
      ["시나리오", report.scenario.path],
      ["팀 / 데이터", `${report.scenario.team} · 결정적 fixture`],
      ["추가 서버 지연", `${report.scenario.delayMs} ms`],
      ["응답 방식", report.scenario.renderMode],
      ["앱 구성", "공통 루트·QueryProvider 포함"],
      ["요청 캐시", report.method.cache],
      ["실행 순서", "순서를 바꿔 순차 실행"],
    ]));
    context.append(panel("측정 환경", [
      ["측정 구간", "관찰 서버 → 프레임워크 서버"],
      ["네트워크", report.environment.network],
      ["Node.js", report.environment.node],
      ["OS / 아키텍처", `${report.environment.platform} / ${report.environment.arch}`],
      ["CPU", report.environment.cpu],
      ["환경 시간대", report.environment.timeZone],
    ]));
    context.append(panel("기록 정보", [
      ["측정 시작", formatDate(report.startedAt)],
      ["기록 생성", formatDate(report.generatedAt)],
      ["표본", `프레임워크별 ${report.method.runs}회`],
      ["워밍업", `${report.method.warmup}회 · 집계 제외`],
      ["완료 마커", report.scenario.marker],
    ]));
    fragment.append(context, provenanceDetails(report));
    return { fragment, dispose: views.dispose };
  }

  function mount(root) {
    const status = root.querySelector("[data-report-status]");
    const content = root.querySelector("[data-report-root]");
    const retry = root.querySelector("[data-report-retry]");
    if (!status || !content || !retry) return () => {};
    let activeRequest = null;
    let downloadUrl = null;
    let disposed = false;
    let disposeView = () => {};

    function releaseDownload() {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      downloadUrl = null;
    }

    function cancelRequest() {
      if (!activeRequest) return;
      clearTimeout(activeRequest.timeout);
      activeRequest.controller.abort();
      activeRequest = null;
    }

    function showError(message) {
      releaseDownload();
      status.classList.add("recorded-report__status--error");
      status.setAttribute("role", "alert");
      status.textContent = message;
      content.setAttribute("aria-busy", "false");
      retry.hidden = false;
    }

    async function load() {
      if (disposed) return;
      cancelRequest();
      const request = { controller: new AbortController(), timeout: null };
      activeRequest = request;
      const isCurrent = () => !disposed && activeRequest === request;
      disposeView();
      disposeView = () => {};
      releaseDownload();
      retry.hidden = true;
      status.hidden = false;
      status.classList.remove("recorded-report__status--error");
      status.setAttribute("role", "status");
      status.textContent = "측정 기록을 불러오는 중…";
      content.hidden = true;
      content.setAttribute("aria-busy", "true");
      content.replaceChildren();
      request.timeout = setTimeout(() => {
        if (!isCurrent()) return;
        request.controller.abort();
        showError("측정 기록을 불러오는 데 15초 이상 걸리고 있습니다. 연결 상태를 확인하고 다시 불러와주세요.");
      }, REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch("./reports/dashboard-ssr.json", { cache: "no-store", signal: request.controller.signal });
        if (!isCurrent() || request.controller.signal.aborted) return;
        if (!response.ok) throw new Error("Report request failed");
        const value = await response.json();
        if (!isCurrent() || request.controller.signal.aborted) return;
        const report = window.UI_LAB_REPORT_DATA.parseReport(value);
        downloadUrl = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
        const view = renderReport(report, downloadUrl);
        disposeView = view.dispose;
        content.replaceChildren(view.fragment);
        content.hidden = false;
        status.hidden = true;
      } catch {
        if (!isCurrent() || request.controller.signal.aborted) return;
        request.controller.abort();
        showError("측정 기록을 불러오지 못했습니다. 기록 파일과 형식을 확인한 뒤 다시 시도해주세요.");
      } finally {
        clearTimeout(request.timeout);
        if (isCurrent()) content.setAttribute("aria-busy", "false");
      }
    }

    retry.addEventListener("click", load);
    void load();
    return () => {
      disposed = true;
      cancelRequest();
      disposeView();
      releaseDownload();
      retry.removeEventListener("click", load);
    };
  }

  window.UI_LAB_RECORDED_REPORTS = {
    "dashboard-ssr": {
      title: "팀 대시보드 SSR",
      eyebrow: "리포트 · 서버 응답",
      description: "같은 팀 데이터를 사용한 네 프레임워크의 서버 응답 기록입니다.",
      keywords: ["반복 측정", "콘텐츠 도착", "실행 조건"],
      observe: "측정 회차를 바꿔 개별 값을 확인하고, 점들이 얼마나 모이거나 흩어지는지 살펴보세요.",
      parentPath: "/reports",
      backLabel: "리포트 목록",
      body: '<section class="recorded-report"><p class="recorded-report__status" data-report-status role="status">측정 기록을 불러오는 중…</p><button class="button recorded-report__retry" data-report-retry hidden>다시 불러오기</button><div data-report-root hidden aria-busy="true"></div></section>',
      mount,
    },
  };
})();
