/* Only the dashboard comparison currently supports shareable experiment conditions. */
(() => {
  const route = '/features/frameworks/framework-dashboard';
  const fields = {
    left: ['next', 'react-router', 'sveltekit', 'nuxt'],
    right: ['next', 'react-router', 'sveltekit', 'nuxt'],
    team: ['alpha', 'empty', 'missing'],
    delay: ['0', '400', '800'],
    scope: ['entry', 'data', 'view', 'errors'],
  };

  function canonicalSearch(value) {
    if (typeof value !== 'string' || value.length > 256) return null;
    const params = new URLSearchParams(value);
    if ([...params.keys()].length !== Object.keys(fields).length) return null;
    for (const [key, allowed] of Object.entries(fields)) {
      if (params.getAll(key).length !== 1 || !allowed.includes(params.get(key))) return null;
    }
    if (params.get('left') === params.get('right')) return null;
    return new URLSearchParams(Object.keys(fields).map((key) => [key, params.get(key)])).toString();
  }

  function mount(root, frame) {
    const controls = root.querySelector('[data-condition-links]');
    if (!controls) return () => {};
    if (new URL(frame.dataset.source, location.href).pathname !== '/preview-embed/ssr/framework-dashboard') return () => {};
    const lifecycle = new AbortController();
    const { signal } = lifecycle;
    const button = controls.querySelector('button');
    const status = controls.querySelector('[role="status"]');
    const fallback = controls.querySelector('[data-condition-fallback]');
    const address = fallback.querySelector('textarea');
    let ready = false;
    let copying = false;
    let currentSearch = null;

    const currentRoute = () => location.hash.slice(1).split('?')[0] === route;
    window.addEventListener('message', (event) => {
      if (event.origin !== location.origin || event.source !== frame.contentWindow || !currentRoute()) return;
      if (!event.data || event.data.type !== 'ui-lab:dashboard-conditions') return;
      const search = canonicalSearch(event.data.search);
      if (search === null) return;
      const url = new URL(location.href);
      url.hash = `${route}?${search}`;
      if (url.href !== location.href) history.replaceState(history.state, '', url);
      if (search !== currentSearch) {
        status.textContent = '';
        fallback.hidden = true;
        currentSearch = search;
      }
      ready = true;
      button.disabled = copying;
    }, { signal });

    button.addEventListener('click', async () => {
      if (!ready || copying || !currentRoute()) return;
      copying = true;
      button.disabled = true;
      const url = location.href;
      const copiedSearch = currentSearch;
      try {
        if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
        await navigator.clipboard.writeText(url);
        if (signal.aborted || !currentRoute() || copiedSearch !== currentSearch) return;
        status.textContent = '조건 링크를 복사했습니다.';
        fallback.hidden = true;
      } catch {
        if (signal.aborted || !currentRoute() || copiedSearch !== currentSearch) return;
        address.value = url;
        fallback.hidden = false;
        status.textContent = '아래 주소를 선택해 직접 복사해주세요.';
        address.focus();
        address.select();
      } finally {
        copying = false;
        if (!signal.aborted) button.disabled = !ready;
      }
    }, { signal });
    return () => lifecycle.abort();
  }

  window.UI_LAB_CONDITION_LINKS = { mount, canonicalSearch };
})();
