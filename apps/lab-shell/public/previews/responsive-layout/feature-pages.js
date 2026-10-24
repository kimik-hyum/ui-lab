/* Existing comparison implementations, reused without changing their components. */
(() => {
  const destinations = {
    '/front-feature': '/features',
    '/front-feature/react': '/features/react',
    '/front-feature/nextjs': '/features/nextjs',
    '/front-feature/libraries': '/features/libraries',
    '/front-feature/react/optimistic': '/features/react/optimistic',
    '/front-feature/react/activity': '/features/react/activity',
    '/front-feature/nextjs/rsc-vs-csc': '/features/nextjs/rsc-vs-csc',
  };
  for (const item of window.UI_LAB_COMPARISONS) {
    destinations[`/front-feature/${item.slug}`] = `/features/${item.slug}`;
  }
  destinations['/ssr-lab/data-loading'] = '/features/frameworks/data-loading';
  destinations['/ssr-lab/framework-dashboard'] = '/features/frameworks/framework-dashboard';
  function mount(root, { search = '' } = {}) {
    const template = root.querySelector('[data-feature-frame]').cloneNode(false);
    const wrap = root.querySelector('.infinite-frame-wrap');
    const status = root.querySelector('[data-feature-loading]');
    const retry = root.querySelector('[data-feature-retry]');
    const loadState = root.querySelector('[data-feature-load-state]');
    const conditionControls = root.querySelector('[data-condition-links]');
    const lifecycle = new AbortController();
    const route = location.hash.slice(1).split('?')[0];
    let current = null;
    let disposed = false;

    function resetConditions() {
      if (!conditionControls) return;
      conditionControls.querySelector('button').disabled = true;
      conditionControls.querySelector('[role="status"]').textContent = '';
      conditionControls.querySelector('[data-condition-fallback]').hidden = true;
    }

    function stop() {
      if (!current) return;
      const attempt = current;
      current = null;
      clearTimeout(attempt.timeout);
      attempt.controller.abort();
      attempt.cleanupConditions();
      attempt.observer?.disconnect();
      attempt.sizeObserver?.disconnect();
      attempt.frame.remove();
    }

    function start() {
      if (disposed || current || location.hash.slice(1).split('?')[0] !== route) return;
      resetConditions();
      // A new browsing context prevents a late document or message from an old
      // attempt being mistaken for the retry. Keep the template free of sizing.
      const frame = template.cloneNode(false);
      frame.removeAttribute('src');
      frame.removeAttribute('data-content-sized');
      frame.style.removeProperty('height');
      const source = new URL(frame.dataset.source, location.origin);
      if (conditionControls) {
        const queryIndex = location.hash.indexOf('?');
        source.search = queryIndex < 0 ? search : location.hash.slice(queryIndex + 1);
      }
      const attempt = {
        frame, controller: new AbortController(), timeout: null,
        observer: null, sizeObserver: null, cleanupConditions: () => {},
      };
      current = attempt;
      const isCurrent = () => !disposed && current === attempt && location.hash.slice(1).split('?')[0] === route;
      function fail(message) {
        if (!isCurrent()) return;
        stop();
        resetConditions();
        wrap.hidden = true;
        loadState.hidden = false;
        status.setAttribute('role', 'alert');
        status.textContent = message;
        retry.hidden = false;
      }

      loadState.hidden = false;
      status.setAttribute('role', 'status');
      status.textContent = '비교 화면을 불러오는 중…';
      retry.hidden = true;
      wrap.hidden = false;
      wrap.replaceChildren(frame);
      attempt.cleanupConditions = window.UI_LAB_CONDITION_LINKS.mount(root, frame);
      frame.addEventListener('load', () => {
        if (!isCurrent()) return;
        let doc;
        let comparison;
        try {
          doc = frame.contentDocument;
          // Browsers may dispatch an initial empty-document load before src.
          if (doc?.URL === 'about:blank') return;
          const loadedUrl = new URL(doc?.URL ?? 'about:blank');
          comparison = doc?.querySelector('[data-comparison-root]');
          // The server layout owns the wrapper. Its presence alone does not
          // prove that the comparison page, rather than an error page, rendered.
          if (loadedUrl.origin !== source.origin || loadedUrl.pathname !== source.pathname
            || !comparison?.querySelector('header h1')) {
            fail('비교 화면을 확인하지 못했습니다. 다시 불러와주세요.');
            return;
          }
        } catch {
          fail('비교 화면에 연결하지 못했습니다. 다시 불러와주세요.');
          return;
        }
        clearTimeout(attempt.timeout);
        attempt.observer?.disconnect();
        attempt.sizeObserver?.disconnect();
        doc.documentElement.dataset.comparisonEmbedded = 'true';
        loadState.hidden = true;
        const syncHeight = () => {
          if (!isCurrent()) return;
          const height = Math.ceil(comparison.getBoundingClientRect().height);
          if (height > 0) {
            frame.dataset.contentSized = 'true';
            frame.style.height = `${height}px`;
          }
        };
        attempt.sizeObserver = new ResizeObserver(syncHeight);
        attempt.sizeObserver.observe(comparison);
        syncHeight();
        const rewriteLink = (link) => {
          const destinationSource = new URL(link.href, frame.src);
          if (destinationSource.origin !== location.origin) return;
          const path = destinations[destinationSource.pathname];
          if (!path) return;
          const destination = new URL(location.href);
          destination.hash = path;
          link.href = destination.href;
          link.target = '_top';
        };
        const rewriteLinks = (node) => {
          if (node.nodeType !== 1) return;
          if (node.matches('a[href]')) rewriteLink(node);
          node.querySelectorAll('a[href]').forEach(rewriteLink);
        };
        rewriteLinks(doc.body);
        attempt.observer = new MutationObserver((records) => {
          if (!isCurrent()) return;
          for (const record of records) {
            if (record.type === 'attributes' && record.target.matches('a[href]')) rewriteLink(record.target);
            else record.addedNodes.forEach(rewriteLinks);
          }
        });
        attempt.observer.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });
      }, { signal: attempt.controller.signal });
      frame.addEventListener('error', () => fail('비교 화면에 연결하지 못했습니다. 다시 불러와주세요.'), { signal: attempt.controller.signal });
      attempt.timeout = setTimeout(() => fail('비교 화면을 15초 안에 불러오지 못했습니다. 다시 불러와주세요.'), 15000);
      frame.src = source.href;
    }

    retry.addEventListener('click', start, { signal: lifecycle.signal });
    start();
    return () => {
      disposed = true;
      lifecycle.abort();
      stop();
      resetConditions();
    };
  }

  window.UI_LAB_FEATURES = Object.fromEntries(window.UI_LAB_COMPARISONS.map((item) => [item.slug, {
    title: item.title,
    navTitle: item.navTitle,
    keywords: item.keywords,
    observe: item.observe,
    description: item.description,
    eyebrow: `기능 비교 · ${item.family === 'react' ? 'React' : item.family === 'nextjs' ? 'Next.js' : item.family === 'libraries' ? '라이브러리' : '프레임워크'}`,
    parentPath: `/features/${item.family}`,
    backLabel: item.family === 'react' ? 'React 비교' : item.family === 'nextjs' ? 'Next.js 비교' : item.family === 'libraries' ? '라이브러리 비교' : '프레임워크 비교',
    contentStatus: 'implemented',
    statusDescription: item.note,
    body: `${item.shareConditions ? `<section class="condition-links" data-condition-links aria-label="비교 조건 공유"><div class="condition-links-row"><p>선택한 프레임워크·데이터·지연·코드 범위를 공유합니다.<span>관찰값은 새로 측정하며 UI·코드 탭은 포함하지 않습니다.</span></p><button type="button" class="button quiet" disabled>조건 링크 복사</button></div><p class="condition-links-status" role="status" aria-live="polite"></p><label class="condition-links-fallback" data-condition-fallback hidden>직접 복사할 조건 주소<textarea rows="3" readonly spellcheck="false" aria-label="조건 링크 주소"></textarea></label></section>` : ''}<div class="feature-load-state" data-feature-load-state><p class="feature-loading" data-feature-loading role="status">비교 화면을 불러오는 중…</p><button type="button" class="button feature-retry" data-feature-retry hidden>다시 불러오기</button></div><div class="infinite-frame-wrap"><iframe data-feature-frame data-source="${item.source ?? `/preview-embed/features/${item.slug}`}" title="${item.title} — 실행 및 코드 비교" class="infinite-frame feature-frame"></iframe></div>`,
    mount,
  }]));
})();
