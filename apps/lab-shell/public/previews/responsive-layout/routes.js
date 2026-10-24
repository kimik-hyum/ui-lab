/* Navigation follows the original content taxonomy, independently of page presentation. */
(() => {
  const groups = [
    ['lab', '실험 목록', window.UI_LAB_INFINITE],
    ['features', '비교 분류', {
      ...window.UI_LAB_FEATURE_CATALOGS,
      ...window.UI_LAB_FEATURES,
      'frameworks/shopping-detail-ssr': window.UI_LAB_SSR_PREVIEW,
    }],
    ['reports', '리포트 목록', { ...window.UI_LAB_RECORDED_REPORTS, ...window.UI_LAB_REPORTS }],
    ['upgrades', '로그 목록', window.UI_LAB_UPGRADE_LOGS.getPages()],
    ['guide', '디자인 기준', {}],
  ];
  const pages = {};
  const sections = {};
  for (const [key, backLabel, children] of groups) {
    const path = `/${key}`;
    const page = window.UI_LAB_PAGES[key];
    pages[path] = { ...page, path, parentPath: null };
    sections[key] = { path, title: page.title, backLabel, children: [] };
    for (const [slug, detail] of Object.entries(children)) {
      const detailPath = `${path}/${slug}`;
      pages[detailPath] = { ...detail, nav: key, path: detailPath, parentPath: detail.parentPath ?? path };
    }
  }
  // Build the tree after registration, so every level has the same ownership rules.
  const nodes = {};
  for (const [path, page] of Object.entries(pages)) {
    const title = page.navTitle ?? `${page.title}${page.contentStatus === 'prototype' ? ' · 시안' : ''}`;
    nodes[path] = { path, title, children: [] };
  }
  for (const page of Object.values(pages)) {
    if (!page.parentPath) continue;
    const parent = pages[page.parentPath];
    if (!parent || parent.nav !== page.nav) throw new Error(`Invalid parent for ${page.path}`);
    page.parent = parent.title;
    nodes[page.parentPath].children.push(nodes[page.path]);
  }
  for (const section of Object.values(sections)) section.children = nodes[section.path].children;

  // Keep these objects stable: the shell holds their references while other menus run.
  function refreshUpgrades() {
    for (const path of Object.keys(pages)) if (path.startsWith('/upgrades/')) delete pages[path];
    pages['/upgrades'] = { ...window.UI_LAB_UPGRADE_LOGS.listPage, path: '/upgrades', parentPath: null };
    sections.upgrades.children = Object.entries(window.UI_LAB_UPGRADE_LOGS.getPages()).map(([id, detail]) => {
      const path = `/upgrades/${id}`;
      pages[path] = { ...detail, path, parentPath: '/upgrades', parent: pages['/upgrades'].title, nav: 'upgrades' };
      return { path, title: detail.title, children: [] };
    });
  }
  window.UI_LAB_UPGRADE_LOGS.subscribe(refreshUpgrades);

  // Old shared links resolve to their corrected category; menus use canonical URLs.
  const aliases = {
    '/experiments/ssr': '/features/frameworks/shopping-detail-ssr',
    '/lab/ssr': '/features/frameworks/shopping-detail-ssr',
    '/lab/list': '/features/libraries/virtual-list',
    '/lab/optimistic': '/features/react/optimistic',
    '/lab/cache': '/features/libraries/cache',
    '/lab/form': '/features/react/form-actions',
    '/features/react/form-preview': '/features/react/form-actions',
    '/lab/loading': '/features/frameworks/data-loading',
    '/features/optimistic': '/features/react/optimistic',
    '/features/activity': '/features/react/activity',
    '/features/rsc': '/features/nextjs/rsc-vs-csc',
    ...Object.fromEntries(Object.entries(window.UI_LAB_UPGRADE_LOGS.aliases).map(([alias, id]) => [`/upgrades/${alias}`, `/upgrades/${id}`])),
  };
  function resolve(requestedPath) {
    const separator = requestedPath.indexOf('?');
    const search = separator < 0 ? '' : requestedPath.slice(separator + 1);
    const pathname = separator < 0 ? requestedPath : requestedPath.slice(0, separator);
    const normalized = pathname.replace(/\/+$/, '') || '/lab';
    const path = aliases[normalized] ?? normalized;
    if (pages[path]) return { ...pages[path], search };
    const nav = path.split('/')[1];
    const section = sections[nav];
    if (nav === 'upgrades') return {
      ...window.UI_LAB_UPGRADE_LOGS.getUnavailablePage(), path, search,
      nav, parentPath: '/upgrades', parent: sections.upgrades.title, backLabel: '로그 목록',
    };
    return {
      path, nav: section ? nav : null, parentPath: section?.path ?? null,
      parent: section?.title ?? '워크스페이스', title: '페이지를 찾을 수 없습니다',
      eyebrow: 'PAGE NOT FOUND', description: '주소를 확인하거나 메뉴에서 페이지를 선택해주세요.',
      body: '<div class="empty-state"><h2>이 주소에 해당하는 페이지가 없습니다.</h2><p>현재 카테고리의 목록에서 다시 찾아보세요.</p></div>',
    };
  }
  window.UI_LAB_ROUTES = { pages, sections, resolve };
})();
