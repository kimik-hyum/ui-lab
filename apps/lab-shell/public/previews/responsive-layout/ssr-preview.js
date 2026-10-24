/* Static SSR layout example; no framework or measurement is executed. */
(() => {
  const frameworks = [
    { name: "Next.js", mark: "N", style: "next", method: "Server Component", file: "app / page.tsx" },
    { name: "SvelteKit", mark: "S", style: "svelte", method: "Server load", file: "routes / +page.server.ts" },
    { name: "Nuxt", mark: "N", style: "nuxt", method: "SSR data fetching", file: "pages / product.vue" },
    { name: "React Router", mark: "R", style: "router", method: "Route loader", file: "routes / product.tsx" },
  ];
  window.UI_LAB_SSR_PREVIEW = {
    title: "상품 상세 SSR", eyebrow: "프레임워크 비교 / 화면 시안",
    description: "같은 상품 화면을 나란히 놓고 코드와 결과 영역의 구성을 살펴봅니다.",
    keywords: ["상품 화면", "코드 예시", "배치 시안"],
    observe: "2개·4개 비교를 번갈아 눌러 화면 배치를 보고, 코드 비교 탭에서 예시를 확인하세요.",
    parentPath: "/features/frameworks", backLabel: "프레임워크 비교", contentStatus: "prototype",
    statusDescription: "별도 앱에 SSR 구현과 측정 기록이 있습니다. 이 화면은 배치 시안이며 기존 실행·결과를 연결하지 않았습니다.",
    body: `
      <div class="tabbar" role="tablist" aria-label="SSR 비교 보기">
        <button id="tab-preview" role="tab" aria-controls="panel-preview" aria-selected="true" tabindex="0" data-tab="preview">화면 시안<span class="tab-count">4</span></button>
        <button id="tab-code" role="tab" aria-controls="panel-code" aria-selected="false" tabindex="-1" data-tab="code">코드 비교</button>
        <button id="tab-results" role="tab" aria-controls="panel-results" aria-selected="false" tabindex="-1" data-tab="results">측정 결과</button>
        <button id="tab-dx" role="tab" aria-controls="panel-dx" aria-selected="false" tabindex="-1" data-tab="dx">DX · AI 작업</button>
      </div>
      <div class="workbench">
        <div class="workspace-content">
          <section id="panel-preview" role="tabpanel" aria-labelledby="tab-preview" tabindex="0">
            <div class="section-toolbar"><div class="section-heading"><h2>나란히 살펴보기</h2><span class="subtle">동일 화면 · 고정 데이터</span></div><div class="segmented" aria-label="비교 화면 수"><button data-count="2" aria-pressed="true">2개 비교</button><button data-count="4" aria-pressed="false">4개 비교</button></div></div>
            <div id="preview-grid" class="preview-grid"></div>
            <div class="comparison-footer"><span><span class="status-dot"></span>화면 구성 예시 · 실제 프레임워크 실행 및 측정 아님</span><span class="mono" id="selected-count">프레임워크 2개</span></div>
            <div class="bottom-grid"><article class="info-card"><span class="step-number">01</span><div><h3>먼저 화면을 확인하세요</h3><p>넓은 화면에서는 두 구현을 나란히, 휴대폰에서는 위아래로 비교합니다.</p></div></article><article class="info-card"><span class="step-number">02</span><div><h3>이유는 코드에서 찾으세요</h3><p>같은 위치에서 코드, 측정 결과, AI 작업 기록으로 이동합니다.</p><button class="text-button" data-switch-tab="code">코드 배치 보기 <span>↗</span></button></div></article></div>
          </section>
          <section id="panel-code" role="tabpanel" aria-labelledby="tab-code" tabindex="0" hidden>
            <div class="section-toolbar"><div class="section-heading"><h2>구현 방식 비교</h2><span class="subtle">코드 영역의 배치 예시</span></div><span class="small-label">설명용 코드</span></div>
            <div class="code-comparison"><article class="code-card"><header><span class="framework-mark next">N</span><b>Next.js</b><span>page.tsx</span></header><pre tabindex="0" aria-label="프레임워크 구현 예시"><code><span class="code-muted">01  // 서버에서 데이터 준비</span>
<span class="code-line highlight">02  const product = await loadProduct();</span>
03
<span class="code-muted">04  // 준비된 데이터로 화면 구성</span>
<span class="code-line highlight">05  return &lt;Product product={product} /&gt;;</span>
06
<span class="code-muted">07  // 핵심 변경 줄과 설명을 연결합니다.</span></code></pre><footer>설명용 코드 발췌</footer></article><article class="code-card"><header><span class="framework-mark svelte">S</span><b>SvelteKit</b><span>+page.server.ts</span></header><pre tabindex="0" aria-label="프레임워크 구현 예시"><code><span class="code-muted">01  // 서버 로딩 경계에서 데이터 준비</span>
<span class="code-line highlight">02  export const load = async () =&gt; {</span>
<span class="code-line highlight">03    const product = await loadProduct();</span>
04    return { product };
05  };
06
<span class="code-muted">07  // 페이지가 전달된 데이터를 표시합니다.</span></code></pre><footer>설명용 코드 발췌</footer></article></div>
            <article class="explanation-card"><span class="small-label">코드와 설명을 함께</span><h3>무엇이 달라졌고, 왜 필요한가요?</h3><p>실제 적용 시 기존 코드 비교 컴포넌트를 재사용합니다. 파일 선택, 변경 줄 강조, 문서 지침을 이 영역에서 함께 확인하는 구성입니다.</p></article>
          </section>
          <section id="panel-results" role="tabpanel" aria-labelledby="tab-results" tabindex="0" hidden>
            <div class="section-toolbar"><div class="section-heading"><h2>측정 결과</h2><span class="subtle">결과를 읽는 화면의 배치 예시</span></div><span class="small-label">기존 측정 결과 미연결</span></div>
            <div class="empty-summary"><svg><use href="#icon-chart"/></svg><div><h3>비교의 근거가 여기에 쌓입니다.</h3><p>기존 측정 기록을 연결하면 버전, 실행 조건, 반복 횟수와 함께 표시합니다.</p></div></div>
            <div class="table-scroll" tabindex="0" aria-label="측정 결과 표, 작은 화면에서는 좌우 스크롤"><table><thead><tr><th>프레임워크</th><th>콘텐츠 도착</th><th>LCP</th><th>전송 JS</th><th>상태</th></tr></thead><tbody><tr><th>Next.js</th><td>—</td><td>—</td><td>—</td><td><span class="neutral-badge">미연결</span></td></tr><tr><th>SvelteKit</th><td>—</td><td>—</td><td>—</td><td><span class="neutral-badge">미연결</span></td></tr><tr><th>Nuxt</th><td>—</td><td>—</td><td>—</td><td><span class="neutral-badge">미연결</span></td></tr><tr><th>React Router</th><td>—</td><td>—</td><td>—</td><td><span class="neutral-badge">미연결</span></td></tr></tbody></table></div>
          </section>
          <section id="panel-dx" role="tabpanel" aria-labelledby="tab-dx" tabindex="0" hidden>
            <div class="section-toolbar"><div class="section-heading"><h2>DX · AI 작업</h2><span class="subtle">작업 결과와 근거를 함께</span></div></div>
            <article class="task-card"><span class="small-label">공통 변경 과제 예시</span><h3>품절 상태와 재시도를 추가해주세요.</h3><p>같은 과제를 각 프레임워크에서 수행하고, 수정 과정과 결과를 비교합니다.</p><span class="neutral-badge">실행 전 · 레이아웃 예시</span></article>
            <div class="dx-grid"><article><span>첫 검증 통과</span><strong>—</strong><p>요구한 동작을 완성했는가</p></article><article><span>수정 반복</span><strong>—</strong><p>몇 번의 수정이 필요했는가</p></article><article><span>사람 개입</span><strong>—</strong><p>어떤 도움이 필요했는가</p></article></div>
          </section>
        </div>
        <aside id="experiment-conditions" class="conditions" aria-label="실험 조건">
          <header><span class="small-label">이 시안의 범위</span></header>
          <h2>무엇을 볼 수 있나요?</h2><p class="conditions-intro">상품 화면과 코드, 측정 결과를 나눠 보는 배치를 확인합니다.</p>
          <div class="condition-list"><div><span>데이터</span><b>고정 상품 1개</b></div><div><span>화면 구성</span><b>2개·4개 배치</b></div><div><span>코드</span><b>설명용 예시</b></div><div><span>측정 결과</span><b>미연결</b></div></div>
          <div class="conditions-divider"></div><span class="small-label">관찰할 순간</span>
          <ol class="observation-list"><li><span class="observation-dot"></span><div><b>비교 개수를 바꾸면</b><small>같은 상품 화면이 어떻게 배치되는지 봅니다.</small></div></li><li><span class="observation-dot"></span><div><b>코드 비교를 누르면</b><small>설명용 코드에서 데이터를 읽는 위치를 찾습니다.</small></div></li><li><span class="observation-dot"></span><div><b>측정 결과를 누르면</b><small>기록이 연결될 표의 항목을 확인합니다.</small></div></li></ol>
          <div class="brief-note"><span>↗</span><p>이 페이지는 레이아웃 시안입니다.<br>조건과 데모는 화면 구성 예시이며,<br>성능 수치는 만들어 넣지 않았습니다.</p></div>
        </aside>
      </div>
    `,
    mount(root) {
      const controller = new AbortController();
      const { signal } = controller;
      const grid = root.querySelector("#preview-grid");
  function showFrameworks(count) {
    grid.classList.toggle("four", count === 4);
    grid.innerHTML = frameworks.slice(0, count).map((framework) => `
      <article class="preview-card" aria-label="${framework.name} 화면 배치 예시">
        <header class="preview-card-head"><span class="framework-mark ${framework.style}">${framework.mark}</span><div class="framework-title">${framework.name}<span class="framework-subtitle">${framework.method}</span></div><span class="preview-label">화면 예시</span></header>
        <div class="preview-address"><span class="window-dots"><i></i><i></i><i></i></span><span>/scenarios/shopping-detail-ssr</span></div>
        <div class="demo-stage"><div class="product"><div class="product-visual"><span class="visual-index">STUDIO / 001</span><svg role="img" aria-label="헤드폰 예시 일러스트"><use href="#headphones"/></svg><span class="visual-color"></span></div><div class="product-info"><p class="product-brand">STUDIO COLLECTION</p><h3 class="product-name">Quiet, by design.</h3><p class="product-description">일상에 고요함을 더하는<br>무선 노이즈 캔슬링 헤드폰.</p><p class="product-price">₩129,000</p><dl class="product-facts"><div><dt>색상</dt><dd>Charcoal</dd></div><div><dt>재고</dt><dd>구매 가능</dd></div><div><dt>데이터</dt><dd>화면 구성 예시</dd></div></dl></div></div></div>
        <footer class="product-footer"><span>↳ ${framework.file}</span><span>동일한 상품 · 동일한 UI</span></footer>
      </article>`).join("");
    root.querySelectorAll("[data-count]").forEach((button) => button.setAttribute("aria-pressed", String(Number(button.dataset.count) === count)));
    root.querySelector("#selected-count").textContent = `프레임워크 ${count}개`;
  }

  function switchTab(name, focus = false) {
    root.querySelectorAll("[data-tab]").forEach((tab) => {
      const selected = tab.dataset.tab === name;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    });
    root.querySelectorAll('[role="tabpanel"]').forEach((panel) => { panel.hidden = panel.id !== `panel-${name}`; });
  }

  root.querySelectorAll("[data-count]").forEach((button) => button.addEventListener("click", () => showFrameworks(Number(button.dataset.count)), { signal }));
  root.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => switchTab(button.dataset.tab), { signal }));
  root.querySelectorAll("[data-switch-tab]").forEach((button) => button.addEventListener("click", () => switchTab(button.dataset.switchTab, true), { signal }));
  root.querySelector('[role="tablist"]').addEventListener("keydown", (event) => {
    const tabs = [...root.querySelectorAll("[data-tab]")];
    const index = tabs.indexOf(document.activeElement);
    if (index < 0) return;
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    switchTab(tabs[next].dataset.tab, true);
  }, { signal });
      showFrameworks(2);
      return () => controller.abort();
    }
  };
})();
