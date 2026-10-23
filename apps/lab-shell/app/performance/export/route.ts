import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { getPerformanceComments } from "../comments-data";
import { getPerformanceSnapshot } from "../data";
import { getMeasurementHistory } from "../history-data";

export function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const analysisId = query.get("analysis");
  if (analysisId) {
    const comment = getPerformanceComments().find((item) => item.id === analysisId);
    if (!comment?.reportPath || !/^docs\/harness\/results\/[a-z0-9.-]+\.md$/.test(comment.reportPath)) return Response.json({ error: "분석 문서를 찾을 수 없습니다." }, { status: 404 });
    // The request selects a registered comment, never an arbitrary filesystem path.
    const filename = basename(comment.reportPath);
    const file = [join(process.cwd(), "docs/harness/results", filename), join(process.cwd(), "../../docs/harness/results", filename)].find(existsSync);
    if (!file) return Response.json({ error: "분석 문서를 찾을 수 없습니다." }, { status: 404 });
    return new Response(readFileSync(file, "utf8"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Content-Disposition": "inline" } });
  }
  const recordId = query.get("record");
  if (recordId) {
    const record = getMeasurementHistory().find((item) => item.id === recordId);
    return record ? Response.json(record) : Response.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });
  }
  const kind = query.get("kind");
  if (kind !== "ssr" && kind !== "lighthouse") return Response.json({ error: "측정 종류를 선택하세요." }, { status: 400 });
  return Response.json(getPerformanceSnapshot()[kind]);
}
