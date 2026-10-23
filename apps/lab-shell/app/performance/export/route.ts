import { getPerformanceSnapshot } from "../data";
import { getMeasurementHistory } from "../history-data";

export function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const recordId = query.get("record");
  if (recordId) {
    const record = getMeasurementHistory().find((item) => item.id === recordId);
    return record ? Response.json(record) : Response.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });
  }
  const kind = query.get("kind");
  if (kind !== "ssr" && kind !== "lighthouse") return Response.json({ error: "측정 종류를 선택하세요." }, { status: 400 });
  return Response.json(getPerformanceSnapshot()[kind]);
}
