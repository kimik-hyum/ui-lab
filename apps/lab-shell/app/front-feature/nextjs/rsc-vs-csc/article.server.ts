import "server-only";
import { setTimeout as wait } from "node:timers/promises";
import { DEMO_ARTICLE, type Article } from "./article";

export async function loadArticle(delayMs: number): Promise<Article> {
  // API와 Server Component가 공유하는 서버 I/O 인공지연입니다.
  await wait(delayMs);
  return DEMO_ARTICLE;
}
