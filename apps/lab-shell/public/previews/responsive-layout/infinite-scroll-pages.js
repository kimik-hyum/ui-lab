/* Reuse the existing React experiment inside the laboratory navigation. */
(() => {
  const basePath = '/lab/infinite-scroll';
  const originalPath = '/void-ui/pagination-infinite-scroll';
  const embedPath = '/preview-embed/infinite-scroll';
  const views = [
    { slug: '', label: '일반 실행', title: '무한 스크롤', description: '아래로 스크롤해 상품을 더 보고, 원하는 페이지로 바로 이동합니다.', keywords: ['자동 로딩', '페이지 이동', '위치 복원'], observe: '목록을 내린 뒤 다른 페이지로 이동하고 새로고침해, 선택한 페이지가 복원되는지 보세요.' },
    { slug: '/adapter-live', label: 'Virtuoso 실행', title: '무한 스크롤 · Virtuoso', description: '같은 페이지 이동 기능을 Virtuoso 목록에서 직접 실행합니다.', keywords: ['가상 목록', '페이지 이동', '자동 로딩'], observe: '목록을 스크롤하고 페이지를 바꿔, 일반 실행과 같은 탐색 동작이 이어지는지 보세요.' },
    { slug: '/adapter-view', label: '어댑터 코드', title: '무한 스크롤 · 어댑터 코드', description: '가상 목록의 스크롤과 페이지 이동을 연결한 코드를 읽습니다.', keywords: ['목록 연결', '스크롤 이벤트', '코드 해설'], observe: '오른쪽 설명을 선택해 목록 설정과 페이지 이동을 연결하는 코드가 어디인지 확인하세요.' },
    { slug: '/hook', label: '훅 해설', title: '무한 스크롤 · 훅 해설', description: '상품을 더 불러오고 현재 페이지를 기억하는 공통 코드를 읽습니다.', keywords: ['추가 요청', '페이지 추적', '주소 복원'], observe: '설명 항목을 선택해 추가 로딩, 현재 페이지 추적, 주소 복원에 쓰이는 줄을 확인하세요.' },
  ];

  function mount(root) {
    const template = root.querySelector('[data-infinite-frame]').cloneNode(false);
    const wrap = root.querySelector('.infinite-frame-wrap');
    const status = root.querySelector('[data-infinite-status]');
    const loadState = root.querySelector('[data-infinite-load-state]');
    const retry = root.querySelector('[data-infinite-retry]');
    const lifecycle = new AbortController();
    const route = location.hash.slice(1).split('?')[0];
    let current = null;
    let disposed = false;

    function stop() {
      if (!current) return;
      const attempt = current;
      current = null;
      clearTimeout(attempt.timeout);
      attempt.controller.abort();
      attempt.observer?.disconnect();
      attempt.frame.remove();
    }

    function start() {
      if (disposed || current || location.hash.slice(1).split('?')[0] !== route) return;
      // A retry owns a fresh browsing context, so old loads/messages cannot win.
      const frame = template.cloneNode(false);
      frame.removeAttribute('src');
      const source = new URL(frame.dataset.source, location.origin);
      const queryIndex = location.hash.indexOf('?');
      source.search = queryIndex < 0 ? '' : location.hash.slice(queryIndex + 1);
      const view = source.pathname.slice(embedPath.length).replace(/^\//, '') || 'demo';
      const attempt = { frame, controller: new AbortController(), timeout: null, observer: null };
      current = attempt;
      const isCurrent = () => !disposed && current === attempt && location.hash.slice(1).split('?')[0] === route;
      function fail(message) {
        if (!isCurrent()) return;
        stop();
        wrap.hidden = true;
        loadState.hidden = false;
        status.setAttribute('role', 'alert');
        status.textContent = message;
        retry.hidden = false;
        retry.setAttribute('aria-disabled', 'false');
      }

      loadState.hidden = false;
      status.setAttribute('role', 'status');
      status.textContent = '화면을 불러오는 중…';
      // Keep a focused retry button present while its new document is pending.
      retry.setAttribute('aria-disabled', 'true');
      wrap.hidden = false;
      wrap.replaceChildren(frame);
      frame.addEventListener('load', () => {
        if (!isCurrent()) return;
        let doc;
        try {
          doc = frame.contentDocument;
          if (doc?.URL === 'about:blank') return;
          const loadedUrl = new URL(doc?.URL ?? 'about:blank');
          const screen = doc?.querySelector('[data-infinite-root="v1"]');
          const heading = view === 'demo' || view === 'adapter-live' ? 'main [data-infinite-heading] h1' : 'header h1';
          if (loadedUrl.origin !== source.origin || loadedUrl.pathname !== source.pathname
            || screen?.dataset.infiniteView !== view || screen.dataset.infinitePath !== source.pathname
            || !screen.querySelector(heading)) {
            fail('실험 화면을 확인하지 못했습니다. 화면을 다시 불러와주세요.');
            return;
          }
        } catch {
          fail('실험 화면에 연결하지 못했습니다. 화면을 다시 불러와주세요.');
          return;
        }
        clearTimeout(attempt.timeout);
        attempt.observer?.disconnect();
        if (document.activeElement === retry) frame.focus({ preventScroll: true });
        loadState.hidden = true;
        // Rewrite before interaction; keyboard/new-tab navigation stays in the lab.
        const rewriteLinks = () => {
          if (!isCurrent()) return;
          doc.querySelectorAll('a[href]').forEach((anchor) => {
            const url = new URL(anchor.href, frame.src);
            if (url.origin !== location.origin) return;
            const linkSource = [originalPath, embedPath].find((path) => url.pathname === path || url.pathname.startsWith(`${path}/`));
            if (!linkSource) return;
            const slug = url.pathname.slice(linkSource.length).replace(/\/$/, '');
            if (!views.some((item) => item.slug === slug)) return;
            const destination = new URL(location.href);
            destination.hash = `${basePath}${slug}${url.search}`;
            anchor.href = destination.href;
            anchor.target = '_top';
          });
        };
        rewriteLinks();
        attempt.observer = new MutationObserver(rewriteLinks);
        attempt.observer.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });
      }, { signal: attempt.controller.signal });
      frame.addEventListener('error', () => fail('실험 화면에 연결하지 못했습니다. 화면을 다시 불러와주세요.'), { signal: attempt.controller.signal });
      window.addEventListener('message', (event) => {
        if (!isCurrent() || event.origin !== location.origin || event.source !== frame.contentWindow) return;
        const data = event.data;
        if (data?.type !== 'ui-lab:infinite-location' || data.pathname !== frame.dataset.source || typeof data.search !== 'string') return;
        const query = new URLSearchParams(data.search).toString();
        const path = `${basePath}${data.pathname.slice(embedPath.length)}`;
        history.replaceState(null, '', `#${path}${query ? `?${query}` : ''}`);
      }, { signal: attempt.controller.signal });
      attempt.timeout = setTimeout(() => fail('실험 화면을 15초 안에 불러오지 못했습니다. 화면을 다시 불러와주세요.'), 15000);
      frame.src = source.href;
    }

    retry.addEventListener('click', start, { signal: lifecycle.signal });
    start();
    return () => { disposed = true; lifecycle.abort(); stop(); };
  }

  window.UI_LAB_INFINITE = Object.fromEntries(views.map((view) => [
    `infinite-scroll${view.slug}`,
    {
      title: view.title,
      navTitle: view.slug ? view.label : view.title,
      eyebrow: '실험실 / 무한 스크롤',
      description: view.description,
      keywords: view.keywords,
      observe: view.observe,
      ...(view.slug ? { parentPath: basePath, backLabel: '무한 스크롤' } : {}),
      body: `<section class="infinite-experiment" aria-label="무한 스크롤 실험">
        <div class="infinite-toolbar"><nav class="infinite-views" aria-label="무한 스크롤 보기">${views.map((item) => `<a href="#${basePath}${item.slug}"${item === view ? ' aria-current="page"' : ''}>${item.label}</a>`).join('')}</nav><span class="status-pill">기존 구현 실행</span></div>
        <p class="infinite-caption">실행 화면은 DummyJSON 상품 데이터를 사용합니다. 코드 설명을 선택하면 대응하는 줄이 강조됩니다.</p>
        <div class="infinite-load-state" data-infinite-load-state><p class="infinite-loading" data-infinite-status role="status">화면을 불러오는 중…</p><button type="button" class="button infinite-retry" data-infinite-retry hidden>화면을 다시 불러오기</button></div>
        <div class="infinite-frame-wrap"><iframe data-infinite-frame data-source="${embedPath}${view.slug}" title="${view.title} — 기존 구현" class="infinite-frame"></iframe></div>
      </section>`,
      mount,
    },
  ]));
})();
