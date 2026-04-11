export type SelectedChip = {
  id: string;
  label: string;
  category: string;
  from?: string;   // 비교 시작 버전 (버전 비교 모드일 때)
  to?: string;     // 비교 끝 버전
};

export type ImplementedItem = {
  verdict_title: string; // MD 섹션 제목과 매칭되는 키
  href: string;
  label: string;
};

export type ReportFrontmatter = {
  title: string;
  date: string;
  model: string;
  selected: SelectedChip[];
  implemented: ImplementedItem[];
  verdicts: { adopt: number; watch: number; skip: number };
};

export type ReportItem = {
  title: string;
  score: number | null;
  body: string;
  demoIdea: string | null;
  adoptionPath: string | null;
  verdict: "adopt" | "watch" | "skip";
  // frontmatter의 implemented와 매칭되면 채워짐
  implementedHref: string | null;
  implementedLabel: string | null;
};

export type ParsedReport = {
  frontmatter: ReportFrontmatter;
  items: ReportItem[];
  rawBody: string;
};

// ─── frontmatter 파서 ───────────────────────────────────────────────────────

function parseFrontmatterBlock(raw: string): ReportFrontmatter {
  const title = raw.match(/^title:\s*(.+)$/m)?.[1]?.trim() ?? "";
  const date = raw.match(/^date:\s*(.+)$/m)?.[1]?.trim() ?? "";
  const model = raw.match(/^model:\s*(.+)$/m)?.[1]?.trim() ?? "";

  const adopt = Number(raw.match(/adopt:\s*(\d+)/)?.[1] ?? 0);
  const watch = Number(raw.match(/watch:\s*(\d+)/)?.[1] ?? 0);
  const skip = Number(raw.match(/skip:\s*(\d+)/)?.[1] ?? 0);

  // selected 파싱 (멀티라인 블록)
  const selectedRaw = raw.match(/^selected:\n((?:[ \t]+-[^\n]*\n(?:[ \t]+[^\n]+\n)*)+)/m)?.[1] ?? "";
  const selected: SelectedChip[] = [];
  const selectedBlocks = selectedRaw.split(/(?=[ \t]+-\s)/);
  for (const block of selectedBlocks) {
    const id = block.match(/id:\s*"([^"]+)"/)?.[1];
    const label = block.match(/label:\s*"([^"]+)"/)?.[1];
    const category = block.match(/category:\s*"([^"]+)"/)?.[1];
    const from = block.match(/from:\s*"([^"]+)"/)?.[1];
    const to = block.match(/to:\s*"([^"]+)"/)?.[1];
    if (id && label && category) {
      selected.push({ id, label, category, from, to });
    }
  }

  // implemented 파싱
  const implementedRaw = raw.match(/^implemented:\n((?:[ \t]+-[^\n]*\n(?:[ \t]+[^\n]+\n)*)+)/m)?.[1] ?? "";
  const implemented: ImplementedItem[] = [];
  const implBlocks = implementedRaw.split(/(?=[ \t]+-\s)/);
  for (const block of implBlocks) {
    const verdict_title = block.match(/verdict_title:\s*"([^"]+)"/)?.[1];
    const href = block.match(/href:\s*"([^"]+)"/)?.[1];
    const label = block.match(/label:\s*"([^"]+)"/)?.[1];
    if (verdict_title && href && label) {
      implemented.push({ verdict_title, href, label });
    }
  }

  return { title, date, model, selected, implemented, verdicts: { adopt, watch, skip } };
}

// ─── MD 바디 → ReportItem[] ──────────────────────────────────────────────────

function parseItems(body: string, implemented: ImplementedItem[]): ReportItem[] {
  const items: ReportItem[] = [];

  const VERDICT_MAP: Record<string, "adopt" | "watch" | "skip"> = {
    "✅": "adopt",
    "👀": "watch",
    "⏭": "skip",
  };

  const h2Blocks = body.split(/^## /m).filter(Boolean);

  for (const block of h2Blocks) {
    const firstLine = block.split("\n")[0];
    const verdictEmoji = Object.keys(VERDICT_MAP).find((e) => firstLine.includes(e));
    if (!verdictEmoji) continue;

    const verdict = VERDICT_MAP[verdictEmoji];
    const h3Blocks = block.split(/^### /m).filter(Boolean).slice(1);

    for (const h3 of h3Blocks) {
      const lines = h3.split("\n");
      const title = lines[0].trim();
      const rest = lines.slice(1).join("\n");

      const scoreMatch = rest.match(/점수:\s*(\d+)\/10/);
      const score = scoreMatch ? Number(scoreMatch[1]) : null;

      const demoMatch = rest.match(/> 💡 데모 아이디어:\s*([\s\S]+?)(?:\n\n|$)/);
      const demoIdea = demoMatch ? demoMatch[1].trim() : null;

      const adoptionMatch = rest.match(/\*\*적용 방법:\*\*\s*([\s\S]+?)(?:\n\n|$)/);
      const adoptionPath = adoptionMatch ? adoptionMatch[1].trim() : null;

      const bodyMatch = rest.match(/\n\n([\s\S]+?)(?=\n\n\*\*적용|>\s*💡|\n---|\n\n- http|$)/);
      const body = bodyMatch ? bodyMatch[1].trim() : "";

      // frontmatter implemented와 매칭
      const implMatch = implemented.find((i) => title.includes(i.verdict_title.replace(/<[^>]+>/g, "").substring(0, 30)));
      const implementedHref = implMatch?.href ?? null;
      const implementedLabel = implMatch?.label ?? null;

      items.push({ title, score, body, demoIdea, adoptionPath, verdict, implementedHref, implementedLabel });
    }
  }

  return items;
}

// ─── 메인 파서 ──────────────────────────────────────────────────────────────

export function parseReport(raw: string): ParsedReport {
  const fmMatch = raw.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
  if (!fmMatch) throw new Error("frontmatter not found");

  const frontmatter = parseFrontmatterBlock(fmMatch[1]);
  const rawBody = fmMatch[2];
  const items = parseItems(rawBody, frontmatter.implemented);

  return { frontmatter, items, rawBody };
}
