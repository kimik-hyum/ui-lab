/* The index comes from the server; details reuse the original log components. */
(() => {
  const statuses = { 'in-progress': '진행 중', completed: '적용 완료', blocked: '확인 필요', 'rolled-back': '되돌림' };
  const aliases = {
    next: '2026-10-21-next-16-4', react: '2026-10-21-react-ui', svelte: '2026-10-21-sveltekit-3',
    nuxt: '2026-10-21-nuxt-vue', router: '2026-10-21-react-router',
  };
  const listeners = new Set();
  let state = { status: 'loading', logs: [] };
  let request;
  let requestController;
  const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const date = (value) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));
  const loading = '<div class="upgrade-state" role="status"><p>버전업 로그를 불러오는 중…</p></div>';
  const error = '<div class="upgrade-state"><h2>로그 목록을 불러오지 못했습니다.</h2><p>잠시 후 다시 시도해주세요.</p><button class="button" type="button" data-upgrade-index-retry>다시 시도</button></div>';

  function validateLogs(value) {
    if (!Array.isArray(value)) throw new Error('Invalid upgrade log index');
    const ids = new Set();
    return value.map((log) => {
      const text = (value) => typeof value === 'string' && value.trim().length > 0;
      if (!log || typeof log !== 'object'
        || !text(log.id) || !/^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(log.id) || ids.has(log.id)
        || !text(log.title) || !text(log.summary) || !text(log.startedAt) || !Number.isFinite(Date.parse(log.startedAt))
        || !Object.hasOwn(statuses, log.status) || !log.primary
        || ![log.primary.name, log.primary.before, log.primary.after].every(text)
        || ![log.changeCount, log.fileCount, log.sourceCount].every((count) => Number.isSafeInteger(count) && count >= 0)) {
        throw new Error('Invalid upgrade log index');
      }
      ids.add(log.id);
      return Object.freeze({
        id: log.id, title: log.title, summary: log.summary, startedAt: log.startedAt, status: log.status,
        primary: Object.freeze({ name: log.primary.name, before: log.primary.before, after: log.primary.after }),
        changeCount: log.changeCount, fileCount: log.fileCount, sourceCount: log.sourceCount,
      });
    });
  }

  function listBody() {
    if (state.status === 'loading') return loading;
    if (state.status === 'error') return error;
    const heading = `<div class="section-heading-row"><div><h2 class="section-title">업데이트 이력</h2><p class="section-description">최신 작업순 · 파일별 변경 코드와 이유를 읽습니다.</p></div><div class="upgrade-list-actions"><span class="status-pill">변경 기록 ${state.logs.length}건</span><button type="button" class="button quiet" data-upgrade-index-retry>새로고침</button></div></div>`;
    if (!state.logs.length) return `${heading}<div class="empty-state"><h2>아직 버전업 기록이 없습니다.</h2><p>첫 기록이 추가되면 변경 코드와 이유가 여기에 표시됩니다.</p></div>`;
    return `${heading}<div class="list-panel upgrade-list">${state.logs.map((log) => {
      const mark = ({ next: ['next', 'N'], react: ['react', 'R'], '@sveltejs/kit': ['svelte', 'S'], nuxt: ['nuxt', 'V'], 'react-router': ['router', 'R'] })[log.primary.name] ?? ['', '↗'];
      return `<article class="log-entry"><a class="log-summary" href="#/upgrades/${log.id}"><span class="framework-mark ${mark[0]}" aria-hidden="true">${mark[1]}</span><div><time class="log-date" datetime="${escape(log.startedAt)}">${escape(date(log.startedAt))}</time><h2>${escape(log.title)}</h2><p>${escape(log.summary)}</p><div class="upgrade-log-meta"><span class="neutral-badge">${statuses[log.status]}</span><span>변경 ${log.changeCount}건 · 코드 비교 ${log.fileCount}개 파일 · 문서 ${log.sourceCount}개</span></div></div><span class="log-version mono">${escape(log.primary.before)} → ${escape(log.primary.after)}</span><span class="log-chevron" aria-hidden="true">↗</span></a></article>`;
    }).join('')}</div>`;
  }

  function mountIndex(root) {
    const controller = new AbortController();
    root.querySelectorAll('[data-upgrade-index-retry]').forEach((button) => button.addEventListener('click', () => load(), { signal: controller.signal }));
    return () => controller.abort();
  }

  const listPage = {
    title: '버전업 로그', eyebrow: '바뀐 코드, 남겨둔 이유',
    description: '무엇을 바꿨고 왜 바꿨는지. 문서의 권고와 함께 읽습니다.',
    parent: '워크스페이스', nav: 'upgrades', body: loading, mount: mountIndex,
  };

  function notify() {
    listPage.body = listBody();
    for (const listener of listeners) listener();
  }

  function setLogs(logs) {
    state = { status: 'ready', logs: Object.freeze(validateLogs(logs)) };
    notify();
  }

  function load() {
    if (request) return request;
    requestController = new AbortController();
    const controller = requestController;
    state = { status: 'loading', logs: state.logs };
    notify();
    request = Promise.resolve().then(async () => {
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch('/api/upgrade-logs', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Upgrade log index unavailable');
        const value = await response.json();
        if (controller.signal.aborted) throw new Error('Upgrade log index timed out');
        setLogs(value.logs);
      } catch {
        if (requestController === controller) {
          state = { status: 'error', logs: [] };
          notify();
        }
      } finally {
        clearTimeout(timeout);
        if (requestController === controller) request = undefined;
      }
    });
    return request;
  }

  function mountDetail(root) {
    const frame = root.querySelector('[data-upgrade-frame]');
    const status = root.querySelector('[data-upgrade-loading]');
    const retry = root.querySelector('[data-upgrade-frame-retry]');
    const lifecycle = new AbortController();
    let sizeObserver;
    let linkObserver;
    let documentController;
    let timeout;
    let animation;
    let disposed = false;
    const stopDocument = () => {
      sizeObserver?.disconnect();
      linkObserver?.disconnect();
      documentController?.abort();
      cancelAnimationFrame(animation);
    };
    const fail = () => {
      clearTimeout(timeout);
      stopDocument();
      status.hidden = false;
      status.textContent = '로그 상세를 읽지 못했습니다. 다시 시도해주세요.';
      retry.hidden = false;
      frame.hidden = true;
    };
    frame.addEventListener('load', () => {
      if (disposed) return;
      stopDocument();
      clearTimeout(timeout);
      try {
        const doc = frame.contentDocument;
        const content = doc?.querySelector('[data-upgrade-root]');
        if (!content) { fail(); return; }
        doc.documentElement.dataset.upgradeEmbedded = 'true';
        frame.hidden = false;
        status.hidden = true;
        retry.hidden = true;
        documentController = new AbortController();
        const syncHeight = () => {
          cancelAnimationFrame(animation);
          animation = requestAnimationFrame(() => {
            if (disposed) return;
            const height = Math.ceil(content.getBoundingClientRect().height);
            if (height > 0) frame.style.height = `${height}px`;
          });
        };
        sizeObserver = new ResizeObserver(syncHeight);
        sizeObserver.observe(content);
        syncHeight();
        doc.addEventListener('toggle', syncHeight, { capture: true, signal: documentController.signal });
        const rewriteLink = (link) => {
          const raw = link.getAttribute('href');
          if (!raw || raw.startsWith('#')) return;
          const source = new URL(raw, frame.src);
          if (source.origin !== location.origin || source.hash) return;
          const match = source.pathname.match(/^\/upgrade-logs(?:\/([^/]+))?\/?$/);
          if (!match) return;
          const destination = new URL(location.href);
          destination.hash = match[1] ? `/upgrades/${match[1]}` : '/upgrades';
          link.href = destination.href;
          link.target = '_top';
        };
        const rewriteLinks = (node) => {
          if (node.nodeType !== 1) return;
          if (node.matches('a[href]')) rewriteLink(node);
          node.querySelectorAll('a[href]').forEach(rewriteLink);
        };
        rewriteLinks(doc.body);
        linkObserver = new MutationObserver((records) => {
          for (const record of records) {
            if (record.type === 'attributes') rewriteLink(record.target);
            else record.addedNodes.forEach(rewriteLinks);
          }
        });
        linkObserver.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });
      } catch { fail(); }
    }, { signal: lifecycle.signal });
    frame.addEventListener('error', fail, { signal: lifecycle.signal });
    function reload() {
      stopDocument();
      clearTimeout(timeout);
      status.hidden = false;
      status.textContent = '실제 변경 코드와 문서 지침을 불러오는 중…';
      retry.hidden = true;
      frame.hidden = false;
      frame.src = frame.dataset.source;
      timeout = setTimeout(fail, 30000);
    }
    retry.addEventListener('click', reload, { signal: lifecycle.signal });
    reload();
    return () => { disposed = true; clearTimeout(timeout); stopDocument(); lifecycle.abort(); };
  }

  function getPages() {
    return Object.fromEntries(state.logs.map((log) => [log.id, {
      title: log.title, eyebrow: `${date(log.startedAt)} · ${statuses[log.status]}`, description: log.summary,
      keywords: ['변경 코드', '변경 이유', '문서 지침'],
      observe: '파일별 전후 코드와 변경 이유를 읽고, 연결된 공식 문서의 권고를 확인하세요.',
      parent: '버전업 로그', parentPath: '/upgrades', nav: 'upgrades', backLabel: '로그 목록',
      body: `<div class="upgrade-detail-meta"><span class="badge">${escape(log.primary.name)}</span><span class="mono">${escape(log.primary.before)} → ${escape(log.primary.after)}</span><span>변경 ${log.changeCount}건 · 코드 비교 ${log.fileCount}개 파일 · 문서 ${log.sourceCount}개</span></div><div class="upgrade-frame-status"><p data-upgrade-loading role="status">실제 변경 코드와 문서 지침을 불러오는 중…</p><button type="button" class="button" data-upgrade-frame-retry hidden>다시 시도</button></div><div class="upgrade-frame-wrap"><iframe data-upgrade-frame data-source="/preview-embed/upgrades/${log.id}" title="${escape(log.title)} — 파일별 코드와 변경 이유" class="upgrade-frame"></iframe></div>`,
      mount: mountDetail,
    }]));
  }

  function getUnavailablePage() {
    return {
      title: state.status === 'ready' ? '로그를 찾을 수 없습니다' : '버전업 로그',
      eyebrow: '변경 기록', description: state.status === 'ready' ? '주소를 확인하거나 로그 목록에서 기록을 선택해주세요.' : '서버에 저장된 기록을 확인합니다.',
      body: state.status === 'loading' ? loading : state.status === 'error' ? error : '<div class="empty-state"><h2>이 주소의 버전업 기록이 없습니다.</h2><p>로그 목록에서 확인할 기록을 선택해주세요.</p></div>',
      mount: mountIndex,
    };
  }

  window.UI_LAB_UPGRADE_LOGS = {
    listPage, getPages, getUnavailablePage, aliases, setLogs, load,
    getState: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
})();
