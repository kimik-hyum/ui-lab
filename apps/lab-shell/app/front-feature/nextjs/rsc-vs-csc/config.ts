export const ARTICLE_DELAY_OPTIONS = [0, 500, 1000, 2000, 3000] as const;
export const DEFAULT_ARTICLE_DELAY = 1000;

export function resolveArticleDelay(value: string | string[] | null | undefined): number {
  return ARTICLE_DELAY_OPTIONS.find((delay) => String(delay) === value) ?? DEFAULT_ARTICLE_DELAY;
}
