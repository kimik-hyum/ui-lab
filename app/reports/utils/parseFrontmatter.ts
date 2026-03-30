export type SelectedChip = {
  id: string;
  label: string;
  category: string;
  version: string;
};

export type ReportFrontmatter = {
  title: string;
  date: string;
  model: string;
  selected: SelectedChip[];
  verdicts: { adopt: number; watch: number; skip: number };
};

export type ReportSection = {
  verdict: "adopt" | "watch" | "skip" | "data";
  items: ReportItem[];
};

export type ReportItem = {
  title: string;
  score: number | null;
  body: string;
  demoIdea: string | null;
  adoptionPath: string | null;
};

export type ParsedReport = {
  frontmatter: ReportFrontmatter;
  sections: ReportSection[];
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

  const selectedRaw = raw.match(/^selected:\s*\n((?:\s+-\s*\{.*\}\s*\n?)+)/m)?.[1] ?? "";
  const selected: SelectedChip[] = [];
  for (const line of selectedRaw.split("\n")) {
    const m = line.match(/\{\s*id:\s*"([^"]+)"[^}]*label:\s*"([^"]+)"[^}]*category:\s*"([^"]+)"[^}]*version:\s*"([^"]+)"/);
    if (m) selected.push({ id: m[1], label: m[2], category: m[3], version: m[4] });
  }

  return { title, date, model, selected, verdicts: { adopt, watch, skip } };
}

// ─── MD 바디 섹션 파서 ──────────────────────────────────────────────────────

function parseBodySections(body: string): ReportSection[] {
  const sections: ReportSection[] = [];

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
    const items: ReportItem[] = [];

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

      // 본문: 첫 빈 줄 이후 ~ 적용방법/데모아이디어 이전
      const bodyMatch = rest.match(/\n\n([\s\S]+?)(?=\n\n\*\*적용|>\s*💡|\n---|\n\n- http|$)/);
      const body = bodyMatch ? bodyMatch[1].trim() : "";

      items.push({ title, score, body, demoIdea, adoptionPath });
    }

    sections.push({ verdict, items });
  }

  return sections;
}

// ─── 메인 파서 ──────────────────────────────────────────────────────────────

export function parseReport(raw: string): ParsedReport {
  const fmMatch = raw.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
  if (!fmMatch) throw new Error("frontmatter not found");

  const frontmatter = parseFrontmatterBlock(fmMatch[1]);
  const rawBody = fmMatch[2];
  const sections = parseBodySections(rawBody);

  return { frontmatter, sections, rawBody };
}
