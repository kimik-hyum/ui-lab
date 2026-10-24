/** Keep an explicitly selected topic on overlapping lines; otherwise prefer the more specific range. */
export function resolveLineTopic<T extends { id: string }>(
  topics: readonly T[],
  line: number,
  getLines: (topic: T) => readonly number[],
  selectedId: string | null,
): T | undefined {
  const matches = topics.filter((topic) => getLines(topic).includes(line));
  return matches.find((topic) => topic.id === selectedId)
    ?? matches.sort((a, b) => getLines(a).length - getLines(b).length)[0];
}
