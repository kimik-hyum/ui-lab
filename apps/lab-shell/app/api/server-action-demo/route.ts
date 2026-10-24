import { verifyName } from "../../front-feature/nextjs/server-actions/verify-name.server";
import type { VerificationState } from "../../front-feature/nextjs/server-actions/types";

export const runtime = "nodejs";

// [cmp:transport:start]
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const error: VerificationState = {
      status: "error", input: "", message: "JSON 요청을 읽지 못했습니다.",
      errorType: "validation", normalizedName: null, receipt: null, via: "api-route",
    };
    return Response.json(error, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  const value = typeof body === "object" && body !== null && "displayName" in body ? body.displayName : undefined;
  const result = await verifyName(value);
  return Response.json({ ...result, via: "api-route" }, {
    status: result.status === "success" ? 200 : 422,
    headers: { "Cache-Control": "no-store" },
  });
}
// [cmp:transport:end]
