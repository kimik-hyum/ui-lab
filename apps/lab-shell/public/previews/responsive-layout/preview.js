/* A shared shell for the isolated design demo. Every destination stays in this preview. */
(() => {
  const main = document.querySelector("#main");
  const dialog = document.querySelector("#menu-dialog");
  const menuToggle = document.querySelector("#menu-toggle");
  const mobileNav = document.querySelector("#mobile-nav");
  document.querySelectorAll("#navigation [data-nav]").forEach((link) => mobileNav.append(link.cloneNode(true)));
  const { pages, sections, resolve } = window.UI_LAB_ROUTES;
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  let cleanup = () => {};
  let pageController;

  function renderNavigation(page) {
    const { path } = page;
    document.querySelectorAll("[data-nav]").forEach((link) => {
      const active = link.dataset.nav === page.nav;
      const count = link.querySelector(".nav-count");
      if (count) count.textContent = String(sections[link.dataset.nav].children.length).padStart(2, "0");
      link.classList.toggle("active", active);
      if (active && !page.parentPath) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");

      let group = link.nextElementSibling?.classList.contains("nav-subitems") ? link.nextElementSibling : null;
      const focusedLink = group?.contains(document.activeElement) ? document.activeElement.closest("a[href]") : null;
      const focusedHref = focusedLink?.getAttribute("href");
      const scrollContainer = focusedLink ? link.closest("#menu-dialog, #navigation") : null;
      const scrollTop = scrollContainer?.scrollTop;
      const entries = [];
      const appendEntry = (child, nested = false) => {
        entries.push({ ...child, nested });
        if (path === child.path || path.startsWith(`${child.path}/`)) {
          child.children.forEach((leaf) => appendEntry(leaf, true));
        }
      };
      if (active) sections[page.nav].children.forEach((child) => appendEntry(child));
      const retainedLinks = new Map();

      if (!entries.length) group?.remove();
      else {
        if (!group) {
          group = document.createElement("div");
          group.className = "nav-subitems";
          group.setAttribute("aria-label", `${sections[page.nav].title} 하위 페이지`);
          link.after(group);
        }
        const existing = new Map([...group.children].map((item) => [item.getAttribute("href"), item]));
        const wanted = new Set(entries.map((entry) => `#${entry.path}`));
        for (const [href, item] of existing) if (!wanted.has(href)) item.remove();
        entries.forEach((entry, index) => {
          const href = `#${entry.path}`;
          const item = existing.get(href) ?? document.createElement("a");
          item.className = entry.nested ? "nav-subitem nav-leaf" : "nav-subitem";
          if (item.getAttribute("href") !== href) item.setAttribute("href", href);
          if (item.textContent !== entry.title) item.textContent = entry.title;
          if (entry.path === path) item.setAttribute("aria-current", "page");
          else item.removeAttribute("aria-current");
          item.classList.toggle("nav-ancestor", path.startsWith(`${entry.path}/`));
          // Keep unchanged links attached so keyboard focus and drawer scroll survive.
          const position = group.children[index] ?? null;
          if (position !== item) group.insertBefore(item, position);
          retainedLinks.set(href, item);
        });
      }

      if (focusedLink && document.activeElement !== focusedLink) {
        (retainedLinks.get(focusedHref) ?? link).focus({ preventScroll: true });
        if (scrollContainer) scrollContainer.scrollTop = scrollTop;
      }
    });
  }

  function render(moveFocus = true) {
    const page = resolve(location.hash.slice(1));
    const { path } = page;
    const hash = `#${path}${page.search ? `?${page.search}` : ""}`;
    if (location.hash !== hash) history.replaceState(null, "", hash);
    cleanup();
    pageController?.abort();
    pageController = new AbortController();
    const { signal } = pageController;
    if (moveFocus && dialog.open) dialog.close();
    main.classList.remove("inspector-open");
    document.title = `${page.title} · UI-LAB 디자인 데모`;
    const breadcrumb = document.querySelector("#breadcrumb-parent");
    breadcrumb.replaceChildren();
    if (page.parentPath) {
      const ancestors = [];
      let parent = pages[page.parentPath];
      while (parent) {
        ancestors.unshift(parent);
        parent = pages[parent.parentPath];
      }
      ancestors.forEach((ancestor, index) => {
        const part = document.createElement("span");
        part.className = "breadcrumb-ancestor";
        const parentLink = document.createElement("a");
        parentLink.href = `#${ancestor.path}`;
        parentLink.textContent = ancestor.title;
        part.append(parentLink);
        if (index < ancestors.length - 1) {
          const divider = document.createElement("span");
          divider.className = "breadcrumb-divider";
          divider.textContent = " / ";
          part.append(divider);
        }
        breadcrumb.append(part);
      });
    } else breadcrumb.textContent = page.parent;
    document.querySelector("#breadcrumb-current").textContent = page.title;
    renderNavigation(page);
    const actions = page.parentPath
      ? `<a class="button quiet" href="#${page.parentPath}">${escape(page.backLabel ?? sections[page.nav].backLabel)}</a>`
      : "";
    const contentStatus = page.contentStatus
      ? `<div class="content-status" data-content-status="${page.contentStatus}"><span class="${page.contentStatus === "implemented" ? "status-pill" : "neutral-badge"}">${page.contentStatus === "implemented" ? "실행 가능" : "화면 시안"}</span><p>${escape(page.statusDescription)}</p></div>`
      : "";
    const keywords = page.keywords?.length
      ? `<div class="detail-keywords" aria-label="핵심 키워드">${page.keywords.map((word) => `<span class="keyword">${escape(word)}</span>`).join("")}</div>`
      : "";
    const observe = page.observe ? `<p class="detail-observe"><strong>이렇게 보세요</strong> ${escape(page.observe)}</p>` : "";
    main.innerHTML = `
      <div class="page-heading"><div><p class="eyebrow">${escape(page.eyebrow)}</p><h1 tabindex="-1">${escape(page.title)}<span class="title-dot">.</span></h1><p class="intro">${escape(page.description)}</p>${keywords}</div><div class="heading-actions">${actions}</div></div>
      ${contentStatus}
      ${observe}
      <div id="page-content">${page.body}</div>
      <footer class="page-footer"><span>UI-LAB <span class="footer-separator">/</span> 비교하고, 이해하고, 선택하기.</span><div class="footer-links"><span class="mono" id="viewport-label"></span><span>디자인 데모</span></div></footer>`;
    const content = main.querySelector("#page-content");
    const inspector = content.querySelector(".workbench > .conditions");
    if (inspector) {
      inspector.id = "page-inspector";
      inspector.tabIndex = -1;
      const toggle = document.createElement("button");
      toggle.id = "inspector-toggle";
      toggle.className = "button";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", inspector.id);
      toggle.innerHTML = '<svg aria-hidden="true"><use href="#icon-settings"/></svg>설명·조건';
      main.querySelector(".heading-actions").append(toggle);
      toggle.addEventListener("click", () => {
        const expanded = main.classList.toggle("inspector-open");
        toggle.setAttribute("aria-expanded", String(expanded));
        if (expanded) inspector.focus({ preventScroll: true });
      }, { signal });
    }
    if (path === "/lab") {
      let filter = "all";
      const input = content.querySelector(".search-field input");
      const cards = [...content.querySelectorAll("#experiment-catalog .catalog-card")];
      const update = () => {
        const query = input.value.trim().toLocaleLowerCase();
        cards.forEach((card) => {
          card.hidden = (filter !== "all" && card.dataset.category !== filter) || !card.dataset.search.toLocaleLowerCase().includes(query);
        });
        content.querySelector("#catalog-empty").hidden = cards.some((card) => !card.hidden);
      };
      input.addEventListener("input", update, { signal });
      content.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => {
        filter = button.dataset.filter;
        content.querySelectorAll("[data-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        update();
      }, { signal }));
    }
    cleanup = page.mount?.(content, { search: page.search ?? "" }) ?? (() => {});
    updateViewport();
    if (moveFocus) {
      main.querySelector("h1").focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }
  function updateViewport() {
    const width = window.innerWidth;
    const label = document.querySelector("#viewport-label");
    if (label) label.textContent = width >= 1400 ? "WIDE WORKSPACE" : width >= 600 ? "COMPACT WORKSPACE" : "MOBILE WORKSPACE";
    const inspector = main.querySelector("#page-inspector");
    if (inspector) {
      const workbench = inspector.parentElement;
      if (width < 1400 && workbench.firstElementChild !== inspector) workbench.prepend(inspector);
      if (width >= 1400 && workbench.lastElementChild !== inspector) workbench.append(inspector);
    }
    if (width >= 1024 && dialog.open) dialog.close();
  }
  menuToggle.addEventListener("click", () => {
    dialog.showModal();
    document.body.classList.add("menu-open");
    menuToggle.setAttribute("aria-expanded", "true");
  });
  document.querySelector("#menu-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    document.body.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
  dialog.addEventListener("click", (event) => {
    if (event.target.closest("a")) dialog.close();
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  document.querySelector(".skip-link").addEventListener("click", (event) => {
    event.preventDefault();
    main.focus();
    main.scrollIntoView();
  });
  window.addEventListener("hashchange", () => render());
  window.addEventListener("resize", updateViewport);
  window.UI_LAB_UPGRADE_LOGS.subscribe(() => {
    const page = resolve(location.hash.slice(1));
    if (page.nav === "upgrades") render(false);
  });
  render(false);
  void window.UI_LAB_UPGRADE_LOGS.load();
})();
