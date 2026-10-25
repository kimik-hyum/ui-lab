import type { MeasurementEntry, MeasurementRecord } from "./history-data";

export type PerformanceComment = {
  id: string;
  framework: string;
  packageName: string;
  fromVersion: string;
  toVersion: string;
  comparisonId: string;
  scenarioPath: string;
  recordedOn: string;
  status: "observed" | "investigating" | "resolved";
  versionChanges: string;
  code: { kind: "unchanged" | "migration" | "optimized" | "rendering"; description: string };
  observation: string;
  conclusion: string;
  sources: { title: string; url: string }[];
  reportPath?: string;
  measurements: { kind: MeasurementRecord["kind"]; before: string | null; after: string }[];
};

export type CommentMeasurement = { kind: MeasurementRecord["kind"]; before: MeasurementEntry | null; after: MeasurementEntry };

/** Keep the analysis attached to its original runs, even after a new benchmark is saved. */
export function resolveCommentMeasurements(comment: PerformanceComment, records: MeasurementRecord[]): CommentMeasurement[] {
  return comment.measurements.flatMap<CommentMeasurement>((reference) => {
    const before = records.find((record) => record.id === reference.before);
    const after = records.find((record) => record.id === reference.after);
    const beforeTarget = before?.targets.find((target) => target.name === comment.framework);
    const afterTarget = after?.targets.find((target) => target.name === comment.framework);
    if (!after || !afterTarget || after.kind !== reference.kind ||
      after.path !== comment.scenarioPath || after.comparison?.id !== comment.comparisonId ||
      afterTarget.versions[comment.packageName] !== comment.toVersion) return [];
    // A new baseline has no comparable earlier run; do not invent a before/after pair.
    if (reference.before === null) return [{ kind: reference.kind, before: null, after: { record: after, target: afterTarget } }];
    if (!before || !beforeTarget || before.kind !== reference.kind ||
      before.path !== comment.scenarioPath || before.comparison?.id !== comment.comparisonId ||
      beforeTarget.versions[comment.packageName] !== comment.fromVersion) return [];
    return [{ kind: reference.kind, before: { record: before, target: beforeTarget }, after: { record: after, target: afterTarget } }];
  });
}

export function hasNewerCommentMeasurements(comment: PerformanceComment, records: MeasurementRecord[]) {
  return resolveCommentMeasurements(comment, records).some(({ kind, after }) => records.some((record) =>
    record.kind === kind && record.path === comment.scenarioPath && record.generatedAt > after.record.generatedAt &&
    record.targets.some((target) => target.name === comment.framework && target.versions[comment.packageName] === comment.toVersion)));
}
