import { promises as fs } from "node:fs";
import path from "node:path";
import { EffectEventClientPage } from "./EffectEventClientPage";

export default async function EffectEventPage() {
  const directory = path.join(process.cwd(), "app/front-feature/react/effect-event");
  const [reactiveCode, eventCode, sourceCode] = await Promise.all([
    fs.readFile(path.join(directory, "components/ReactiveConnection.tsx"), "utf8"),
    fs.readFile(path.join(directory, "components/EffectEventConnection.tsx"), "utf8"),
    fs.readFile(path.join(directory, "connection-source.ts"), "utf8"),
  ]);
  return <EffectEventClientPage
    reactiveCode={`// ReactiveConnection.tsx\n${reactiveCode}\n// connection-source.ts\n${sourceCode}`}
    eventCode={`// EffectEventConnection.tsx\n${eventCode}\n// connection-source.ts\n${sourceCode}`}
  />;
}
