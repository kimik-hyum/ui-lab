import type { DashboardData } from "../../../../../../fixtures/dashboard-ssr-types";
import type { FrameworkId, ObserverRequest } from "./types";

const SAFE_TAGS = new Set(["main", "header", "section", "article", "div", "p", "h1", "h2", "h3", "strong", "span", "ol", "ul", "li", "time", "dl", "dt", "dd", "small", "b", "em", "br"]);
const RAW_TAGS = new Set(["script", "style", "textarea", "title", "noscript", "iframe", "object", "svg", "math"]);
const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const READY_TEXT = "서버에서 준비한 작업 현황";

function decodeEntities(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "�";
    }
    return ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " } as Record<string, string>)[entity.toLowerCase()] ?? match;
  });
}

function escapeAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function parseTag(token: string): { name: string; closing: boolean; attrs: Map<string, string> } | null {
  const tag = /^<\s*(\/?)\s*([a-z][a-z\d:-]*)\b([\s\S]*?)>$/i.exec(token);
  if (!tag) return null;
  const attrs = new Map<string, string>();
  const rest = tag[3];
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const match of rest.matchAll(pattern)) {
    const key = match[1].toLowerCase();
    if (attrs.has(key)) return null;
    attrs.set(key, decodeEntities(match[2] ?? match[3] ?? match[4] ?? ""));
  }
  return { name: tag[2].toLowerCase(), closing: Boolean(tag[1]), attrs };
}

/** A deliberately narrow tokenizer for the controlled scenario, not a general HTML renderer. */
export class DashboardHtmlParser {
  private buffer = "";
  private rawTag: string | null = null;
  private templateDepth = 0;
  private mainCount = 0;
  private active = false;
  private closed = false;
  private invalid = false;
  private stack: string[] = [];
  private output: string[] = [];
  private visibleText = "";
  private headingText = "";
  private strongText: string | null = null;
  private metricValues: string[] = [];
  private activityIds: string[] = [];
  private readyText: string | null = null;
  private readyCount = 0;
  private readyAt: number | null = null;
  private attrs: Map<string, string> | null = null;

  private framework: FrameworkId;
  private request: ObserverRequest;
  private fixture: DashboardData;

  constructor(framework: FrameworkId, request: ObserverRequest, fixture: DashboardData) {
    this.framework = framework;
    this.request = request;
    this.fixture = fixture;
  }

  get contentReadyMs(): number | null { return this.readyAt; }

  push(chunk: string, elapsedMs: number): void {
    this.buffer += chunk;
    while (this.buffer) {
      if (this.rawTag) {
        const closing = new RegExp(`<\\/\\s*${this.rawTag}\\s*>`, "i").exec(this.buffer);
        if (!closing) return;
        this.buffer = this.buffer.slice(closing.index + closing[0].length);
        this.rawTag = null;
        continue;
      }
      if (this.buffer.startsWith("<!--")) {
        const end = this.buffer.indexOf("-->", 4);
        if (end < 0) return;
        this.buffer = this.buffer.slice(end + 3);
        continue;
      }
      if (this.buffer[0] !== "<") {
        const end = this.buffer.indexOf("<");
        // Keep a trailing text fragment intact, including split entities.
        if (end < 0) return;
        this.text(this.buffer.slice(0, end));
        this.buffer = this.buffer.slice(end);
        continue;
      }
      let quote: string | null = null;
      let end = -1;
      for (let index = 1; index < this.buffer.length; index += 1) {
        const char = this.buffer[index];
        if (quote) { if (char === quote) quote = null; }
        else if (char === '"' || char === "'") quote = char;
        else if (char === ">") { end = index; break; }
      }
      if (end < 0) return;
      const token = this.buffer.slice(0, end + 1);
      this.buffer = this.buffer.slice(end + 1);
      if (/^<!|^<\?/.test(token)) continue;
      const tag = parseTag(token);
      if (!tag) { if (this.active) this.invalid = true; continue; }
      if (tag.name === "template") {
        this.templateDepth = Math.max(0, this.templateDepth + (tag.closing ? -1 : 1));
        continue;
      }
      if (!tag.closing && RAW_TAGS.has(tag.name)) { this.rawTag = tag.name; continue; }
      if (this.templateDepth > 0) continue;
      this.tag(tag, elapsedMs);
    }
  }

  private text(value: string): void {
    if (!this.active || this.templateDepth > 0) return;
    const decoded = decodeEntities(value);
    this.visibleText += decoded;
    if (this.stack.includes("h1")) this.headingText += decoded;
    if (this.strongText !== null) this.strongText += decoded;
    if (this.readyText !== null) this.readyText += decoded;
    this.output.push(value.replaceAll("<", "&lt;").replaceAll(">", "&gt;"));
  }

  private tag(tag: NonNullable<ReturnType<typeof parseTag>>, elapsedMs: number): void {
    const { name, closing, attrs } = tag;
    if (!closing && name === "main" && attrs.has("data-dashboard-ssr")) {
      this.mainCount += 1;
      if (this.mainCount !== 1 || this.active) { this.invalid = true; return; }
      this.active = true;
      this.attrs = attrs;
    }
    if (!this.active) return;
    if (closing) {
      if (VOID_TAGS.has(name)) return;
      if (this.stack.pop() !== name) { this.invalid = true; return; }
      if (name === "p" && this.readyText !== null) {
        if (this.readyText.trim() === READY_TEXT && this.readyCount === 1) this.readyAt = elapsedMs;
        else this.invalid = true;
        this.readyText = null;
      }
      if (name === "strong" && this.strongText !== null) {
        this.metricValues.push(this.strongText.trim());
        this.strongText = null;
      }
      if (SAFE_TAGS.has(name)) this.output.push(`</${name}>`);
      this.visibleText += " ";
      if (name === "main") { this.active = false; this.closed = true; }
      return;
    }
    if (attrs.has("data-dashboard-ready")) {
      this.readyCount += 1;
      if (name !== "p" || attrs.get("data-dashboard-ready") !== "v1" || this.readyCount !== 1) this.invalid = true;
      this.readyText = "";
    }
    if (name === "strong") this.strongText = "";
    if (name === "li") this.activityIds.push(attrs.get("data-activity-id") ?? "");
    if (!VOID_TAGS.has(name)) this.stack.push(name);
    if (SAFE_TAGS.has(name)) {
      const safeAttrs = [...attrs].filter(([key]) => /^(?:class|id|role|(?:aria|data)-[a-z0-9_-]+)$/.test(key));
      this.output.push(`<${name}${safeAttrs.map(([key, value]) => ` ${key}="${escapeAttribute(value)}"`).join("")}>`);
    }
    this.visibleText += " ";
  }

  finish(): { valid: boolean; html: string | null; contentReadyMs: number | null } {
    const expected = this.request.team === "empty"
      ? { ...this.fixture, team: { id: "empty", name: "빈 팀" }, summary: this.fixture.summary.map((item) => ({ ...item, value: 0 })), activities: [] }
      : this.fixture;
    const text = this.visibleText.replace(/\s+/g, " ");
    const expectedText = [expected.team.name, expected.title, ...expected.summary.flatMap((item) => [item.label, String(item.value)]), ...expected.activities.flatMap((item) => [item.title, item.status, item.owner, item.time])];
    if (this.request.team === "empty") expectedText.push("아직 기록된 활동이 없습니다.");
    const valid = !this.invalid && this.closed && !this.active && this.mainCount === 1 && this.readyCount === 1 && this.readyAt !== null
      && this.attrs?.get("data-dashboard-ssr") === "v1"
      && this.attrs.get("data-framework") === this.framework
      && this.attrs.get("data-render-mode") === "blocking"
      && this.attrs.get("data-team-id") === this.request.team
      && this.attrs.get("data-delay-ms") === String(this.request.delayMs)
      && this.request.team !== "missing"
      && this.headingText.trim() === expected.title
      && JSON.stringify(this.metricValues) === JSON.stringify(expected.summary.map((item) => String(item.value)))
      && JSON.stringify(this.activityIds) === JSON.stringify(expected.activities.map((item) => item.id))
      && expectedText.every((part) => text.includes(part))
      && (this.request.team !== "empty" || !this.fixture.activities.some((item) => text.includes(item.title)));
    return { valid, html: valid ? this.output.join("") : null, contentReadyMs: valid ? this.readyAt : null };
  }
}
