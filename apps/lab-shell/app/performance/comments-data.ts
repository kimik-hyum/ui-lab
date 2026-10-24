import data from "../../../../docs/harness/performance-comments.json";
import type { PerformanceComment } from "./comment-model";

/** Repository document and website share one set of analysis comments. */
export function getPerformanceComments(framework?: string): PerformanceComment[] {
  return (data.comments as PerformanceComment[])
    .filter((comment) => !framework || comment.framework === framework)
    .sort((a, b) => b.recordedOn.localeCompare(a.recordedOn) || b.toVersion.localeCompare(a.toVersion, "en", { numeric: true }));
}
