/* A shared zero-based axis for the recorded content-ready samples. */
(() => {
  "use strict";

  const TARGET_ORDER = ["next", "nuxt", "react-router", "sveltekit"];
  const numberFormat = new Intl.NumberFormat("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let instance = 0;

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = String(text);
    return element;
  }

  function percent(value, maximum) {
    return maximum === 0 ? 0 : value / maximum * 100;
  }

  function position(element, value, maximum) {
    element.style.left = `${percent(value, maximum)}%`;
  }

  function marker(kind, value, maximum) {
    const element = node("span", `report-distribution__marker report-distribution__marker--${kind}`);
    element.dataset.reportMarker = kind;
    element.dataset.reportValue = String(value);
    position(element, value, maximum);
    return element;
  }

  function nearestRun(points, pointer, currentRun) {
    if (points.length === 0) return null;
    const distances = points.map((point) => ({
      run: point.run,
      distance: Math.hypot(point.x - pointer.x, point.y - pointer.y),
    }));
    const minimum = Math.min(...distances.map((point) => point.distance));
    // CSS의 소수 좌표 반올림만 허용하고, 가까운 서로 다른 점은 합치지 않습니다.
    const tiedRuns = distances.filter((point) => point.distance - minimum <= 0.000001)
      .map((point) => point.run).sort((left, right) => left - right);
    return tiedRuns.find((run) => run > currentRun) ?? tiedRuns[0];
  }

  function create(report) {
    const id = `report-distribution-${++instance}`;
    const targets = TARGET_ORDER.map((targetId) => report.targets.find((target) => target.id === targetId));
    const maximum = Math.max(...targets.flatMap((target) => target.samples.map((sample) => sample.metrics.contentReadyMs)));
    const runs = report.method.runs;
    const rows = [];
    const samples = [];
    const section = node("section", "report-distribution");
    section.dataset.reportDistribution = report.id;
    section.dataset.reportAxisMin = "0";
    section.dataset.reportAxisMax = String(maximum);
    section.setAttribute("aria-labelledby", `${id}-title`);

    const heading = node("div", "report-distribution__heading");
    const title = node("h2", "section-title", "회차별 콘텐츠 도착");
    title.id = `${id}-title`;
    heading.append(title, node("span", "report-distribution__range", `공통 축 0–${numberFormat.format(maximum)} ms`));
    const description = node("p", "report-distribution__description", "각 점은 실제 요청 1회입니다. 슬라이더나 점을 선택하면 네 프레임워크의 같은 회차를 함께 볼 수 있습니다. 같은 위치에 겹친 점은 다시 누르면 다음 회차를 선택합니다.");
    description.id = `${id}-description`;
    section.append(heading, description);

    const controls = node("div", "report-distribution__controls");
    const label = node("label", "report-distribution__run-label", "측정 회차");
    label.htmlFor = `${id}-run`;
    const runOutput = node("output", "report-distribution__run-output");
    runOutput.setAttribute("for", `${id}-run`);
    runOutput.setAttribute("aria-live", "off");
    runOutput.dataset.reportRunOutput = "";
    const input = node("input", "report-distribution__slider");
    input.type = "range";
    input.id = `${id}-run`;
    input.min = "1";
    input.max = String(runs);
    input.step = "1";
    input.value = "1";
    input.dataset.reportRun = "";
    input.setAttribute("aria-describedby", `${id}-description ${id}-help`);
    const help = node("p", "report-distribution__help", "방향키로 한 회차씩, Home·End로 처음·끝으로 이동합니다.");
    help.id = `${id}-help`;
    controls.append(label, runOutput, input, help);
    section.append(controls);

    const legend = node("ul", "report-distribution__legend");
    for (const [kind, text] of [["sample", "점 1개 = 1회"], ["selected", "선택 회차"], ["median", "중앙값 (가운데 두 값 평균)"], ["p95", `p95 (${runs}회 중 ${Math.ceil(runs * 0.95)}번째)`]]) {
      const entry = node("li");
      const symbol = node("span", `report-distribution__legend-symbol report-distribution__legend-symbol--${kind}`);
      symbol.setAttribute("aria-hidden", "true");
      entry.append(symbol, node("span", "", text));
      legend.append(entry);
    }
    section.append(legend, node("p", "report-distribution__legend-note", "중앙값과 p95는 값을 작은 순서로 정렬해 구합니다."));

    const chart = node("div", "report-distribution__chart");
    const axis = node("div", "report-distribution__axis-row");
    axis.setAttribute("aria-hidden", "true");
    axis.append(node("span", "report-distribution__axis-label", "콘텐츠 도착 (ms)"));
    const ticks = node("div", "report-distribution__axis");
    for (const fraction of maximum === 0 ? [0] : [0, 0.25, 0.5, 0.75, 1]) {
      const tick = node("span", "report-distribution__tick", numberFormat.format(maximum * fraction));
      tick.dataset.reportTick = String(fraction);
      tick.style.left = `${fraction * 100}%`;
      ticks.append(tick);
    }
    axis.append(ticks, node("span"));
    chart.append(axis);

    for (const target of targets) {
      const row = node("article", "report-distribution__row");
      row.dataset.reportFramework = target.id;
      const name = node("div", "report-distribution__framework");
      name.append(node("h3", "", target.label), node("span", "", `${target.samples.length}개 표본`));
      const plot = node("div", "report-distribution__plot");
      plot.setAttribute("aria-hidden", "true");
      plot.dataset.reportPlot = target.id;
      for (const fraction of maximum === 0 ? [0] : [0, 0.25, 0.5, 0.75, 1]) {
        const gridline = node("span", "report-distribution__gridline");
        gridline.style.left = `${fraction * 100}%`;
        plot.append(gridline);
      }
      plot.append(marker("median", target.statistics.contentReadyMs.median, maximum), marker("p95", target.statistics.contentReadyMs.p95, maximum));
      for (const sample of target.samples) {
        const point = node("span", "report-distribution__sample");
        point.dataset.reportSample = target.id;
        point.dataset.reportRun = String(sample.run);
        point.dataset.reportValue = String(sample.metrics.contentReadyMs);
        position(point, sample.metrics.contentReadyMs, maximum);
        point.style.top = `${22 + (sample.run - 1) % 5 * 12}px`;
        samples.push(point);
        plot.append(point);
      }
      const readout = node("div", "report-distribution__readout");
      readout.dataset.reportReadout = target.id;
      const selected = node("strong", "report-distribution__selected-value");
      const runLabel = node("span", "report-distribution__selected-run");
      const statistics = node("p", "report-distribution__statistics", `중앙값 ${numberFormat.format(target.statistics.contentReadyMs.median)} · p95 ${numberFormat.format(target.statistics.contentReadyMs.p95)} ms`);
      readout.append(selected, runLabel, statistics);
      row.append(name, plot, readout);
      chart.append(row);
      rows.push({ target, selected, runLabel, readout });
    }
    section.append(chart);
    const explanation = node("p", "report-distribution__note");
    explanation.dataset.reportSelectionNote = "";
    section.append(explanation, node("p", "report-distribution__note", "프레임워크 이름순입니다. 모든 행의 가로축은 같으며, 점의 세로 위치는 회차 구분용으로 성능값을 나타내지 않습니다."));
    const announcement = node("p", "report-distribution__sr-only");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("aria-atomic", "true");
    section.append(announcement);

    function selectRun(run, announce) {
      input.value = String(run);
      input.setAttribute("aria-valuetext", `${run}회차, 전체 ${runs}회`);
      section.dataset.reportSelectedRun = String(run);
      runOutput.textContent = `${run} / ${runs}`;
      const values = [];
      for (const { target, selected, runLabel, readout } of rows) {
        const sample = target.samples.find((entry) => entry.run === run);
        const text = `${numberFormat.format(sample.metrics.contentReadyMs)} ms`;
        selected.textContent = text;
        runLabel.textContent = `${run}회차`;
        readout.dataset.reportRun = String(run);
        readout.dataset.reportValue = String(sample.metrics.contentReadyMs);
        values.push(`${target.label} ${text}`);
      }
      for (const sample of samples) sample.classList.toggle("is-selected", Number(sample.dataset.reportRun) === run);
      explanation.textContent = `${run}회차를 함께 표시합니다. 같은 회차의 네 요청은 순서대로 실행됐으며, 동시 요청 비교가 아닙니다.`;
      if (announce) announcement.textContent = `${run}회차. ${values.join(", ")}.`;
    }

    function onInput() {
      const run = Math.min(runs, Math.max(1, Math.round(Number(input.value))));
      selectRun(run, true);
    }

    function onPointClick(event) {
      if (!(event.target instanceof Element)) return;
      const plot = event.target.closest("[data-report-plot]");
      if (!plot || !chart.contains(plot)) return;
      const points = Array.from(plot.querySelectorAll("[data-report-sample]"), (point) => {
        const rect = point.getBoundingClientRect();
        return { run: Number(point.dataset.reportRun), x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      });
      const run = nearestRun(points, { x: event.clientX, y: event.clientY }, Number(input.value));
      if (run !== null) selectRun(run, true);
    }

    input.addEventListener("input", onInput);
    chart.addEventListener("click", onPointClick);
    selectRun(1, false);
    return {
      element: section,
      dispose() {
        input.removeEventListener("input", onInput);
        chart.removeEventListener("click", onPointClick);
      },
    };
  }

  window.UI_LAB_REPORT_DISTRIBUTION = { create };
})();
