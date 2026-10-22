import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { createConnectionSource } from "../apps/lab-shell/app/front-feature/react/effect-event/connection-source.ts";
import { collectAnchorLines, stripAnchorLines } from "../apps/lab-shell/app/front-feature/components/codeAnchors.ts";

test("연결을 정리하면 전송 불가 상태가 되고, 끊긴 동안 보낸 알림은 재연결 때 재생하지 않는다", () => {
  const source = createConnectionSource();
  const disconnect = source.connect("design", (text) => ({ text, theme: "light" }));
  source.send("design", "기존 알림");
  const previous = source.getSnapshot().notification;

  disconnect();
  assert.equal(source.getSnapshot().room, null);
  source.send("design", "연결 해제 중 전송");
  assert.equal(source.getSnapshot().received, 1);
  assert.equal(source.getSnapshot().notification, previous);

  source.connect("design", (text) => ({ text, theme: "light" }));
  assert.equal(source.getSnapshot().room, "design");
  assert.equal(source.getSnapshot().received, 1);
  assert.equal(source.getSnapshot().notification, previous);
  source.send("design", "복귀 후 전송");
  assert.equal(source.getSnapshot().received, 2);
  assert.equal(source.getSnapshot().notification.text, "복귀 후 전송");
});

test("같은 방의 테마 재연결은 받은 알림을 보존하고, 새 알림에 새 수신 함수의 테마를 적용한다", () => {
  const source = createConnectionSource();
  const disconnect = source.connect("design", (text) => ({ text, theme: "light" }));
  source.send("design", "밝은 테마에서 수신");
  const previous = source.getSnapshot().notification;

  disconnect();
  source.connect("design", (text) => ({ text, theme: "dark" }));
  assert.equal(source.getSnapshot().notification, previous);
  assert.equal(source.getSnapshot().notification.theme, "light");
  assert.equal(source.getSnapshot().connections, 2);
  assert.equal(source.getSnapshot().disconnections, 1);

  source.send("design", "어두운 테마에서 수신");
  assert.deepEqual(source.getSnapshot().notification, { text: "어두운 테마에서 수신", theme: "dark" });
  assert.equal(source.getSnapshot().received, 2);
});

test("다른 방에 연결하면 알림만 초기화하고, 이전 방 전송은 받지 않는다", () => {
  const source = createConnectionSource();
  const disconnectDesign = source.connect("design", (text) => ({ text, theme: "light" }));
  source.send("design", "디자인 알림");
  disconnectDesign();

  const disconnectEngineering = source.connect("engineering", (text) => ({ text, theme: "dark" }));
  assert.equal(source.getSnapshot().room, "engineering");
  assert.equal(source.getSnapshot().notification, null);
  source.send("design", "이전 방 알림");
  assert.equal(source.getSnapshot().received, 1);
  assert.equal(source.getSnapshot().notification, null);
  source.send("engineering", "개발 알림");
  assert.equal(source.getSnapshot().received, 2);

  disconnectEngineering();
  source.connect("design", (text) => ({ text, theme: "dark" }));
  assert.equal(source.getSnapshot().notification, null);
  assert.equal(source.getSnapshot().received, 2);
});

test("연결 해제는 한 번만 집계하고 구독을 해제한 관찰자에게 후속 변경을 알리지 않는다", () => {
  const source = createConnectionSource();
  let notifications = 0;
  const unsubscribe = source.subscribe(() => { notifications += 1; });
  const disconnect = source.connect("design", (text) => ({ text, theme: "light" }));
  disconnect();
  disconnect();
  assert.equal(source.getSnapshot().disconnections, 1);
  assert.equal(notifications, 2);
  unsubscribe();
  source.connect("design", (text) => ({ text, theme: "dark" }));
  assert.equal(notifications, 2);
});

test("공통 source를 합친 좌우 코드에서 모든 토픽에 겹치지 않는 진입 줄과 정확한 fallback이 있다", async () => {
  const base = new URL("../apps/lab-shell/app/front-feature/react/effect-event/", import.meta.url);
  const [source, client] = await Promise.all([
    readFile(new URL("connection-source.ts", base), "utf8"),
    readFile(new URL("EffectEventClientPage.tsx", base), "utf8"),
  ]);
  const definitions = [...client.matchAll(/\{ id: "([a-z-]+)"[^\n]+left: (\[[\d, ]+\]), right: (\[[\d, ]+\])/g)];
  assert.deepEqual(definitions.map((match) => match[1]), ["connection", "latest-value", "cleanup", "notification-policy"]);

  for (const [filename, fallbackIndex] of [["ReactiveConnection.tsx", 2], ["EffectEventConnection.tsx", 3]]) {
    const component = await readFile(new URL(`components/${filename}`, base), "utf8");
    const code = `// ${filename}\n${component}\n// connection-source.ts\n${source}`;
    const anchors = collectAnchorLines(code);
    const visibleLines = stripAnchorLines(code).split("\n");
    const previousLines = new Set();
    for (const match of definitions) {
      const lines = anchors[match[1]];
      assert.ok(lines?.length, `${filename}: ${match[1]} 앵커가 필요합니다.`);
      assert.ok(lines.some((line) => !previousLines.has(line)), `${filename}: ${match[1]}에 hover 진입 줄이 필요합니다.`);
      assert.deepEqual(lines, JSON.parse(match[fallbackIndex]), `${filename}: ${match[1]} fallback 위치가 실제 코드와 맞아야 합니다.`);
      lines.forEach((line) => previousLines.add(line));
    }
    assert.match(anchors["notification-policy"].map((line) => visibleLines[line - 1]).join("\n"), /lastRoom === room \? snapshot\.notification : null/);
  }
});
