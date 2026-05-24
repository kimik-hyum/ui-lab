const ANCHOR_MARKER_PATTERN = /\[\s*cmp:([a-z0-9-]+):(start|end)\s*\]/i;

export function stripAnchorLines(code: string): string {
  return code
    .split('\n')
    .filter((line) => !ANCHOR_MARKER_PATTERN.test(line))
    .join('\n');
}

export function collectAnchorLines(code: string): Record<string, number[]> {
  const result: Record<string, number[]> = {};
  const activeAnchors = new Set<string>();
  let visibleLineNumber = 0;

  code.split('\n').forEach((line) => {
    const markerMatch = line.match(ANCHOR_MARKER_PATTERN);

    if (markerMatch) {
      const markerKey = markerMatch[1];
      const markerType = markerMatch[2];

      if (markerType === 'start') {
        result[markerKey] ??= [];
        activeAnchors.add(markerKey);
      } else {
        activeAnchors.delete(markerKey);
      }

      return;
    }

    visibleLineNumber += 1;
    activeAnchors.forEach((anchor) => {
      result[anchor]?.push(visibleLineNumber);
    });
  });

  return result;
}

export function resolveTopicLines(
  anchors: string[],
  anchorLines: Record<string, number[]>,
  fallbackLines: number[],
) {
  const resolved = anchors.flatMap((anchor) => anchorLines[anchor] ?? []);
  const uniqueSorted = Array.from(new Set(resolved)).sort((a, b) => a - b);

  return uniqueSorted.length > 0 ? uniqueSorted : fallbackLines;
}
