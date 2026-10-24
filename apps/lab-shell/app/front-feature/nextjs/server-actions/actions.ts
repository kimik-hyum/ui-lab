// [cmp:transport:start]
"use server";

import { verifyName } from "./verify-name.server";
import type { VerificationState } from "./types";

export async function verifyNameAction(formData: FormData): Promise<VerificationState> {
  const result = await verifyName(formData instanceof FormData ? formData.get("displayName") : undefined);
  return { ...result, via: "server-action" };
}
// [cmp:transport:end]
