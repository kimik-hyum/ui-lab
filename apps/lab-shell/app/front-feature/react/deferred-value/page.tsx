import { readFile } from "node:fs/promises";
import path from "node:path";
import { DeferredValueClientPage } from "./DeferredValueClientPage";

export default async function DeferredValuePage() {
  const [immediate, deferred, list, row, workload, constants, types] = await Promise.all([
    readFile(path.join(process.cwd(), "app/front-feature/react/deferred-value/components/ImmediatePreview.tsx"), "utf8"),
    readFile(path.join(process.cwd(), "app/front-feature/react/deferred-value/components/DeferredPreview.tsx"), "utf8"),
    readFile(path.join(process.cwd(), "app/front-feature/react/deferred-value/components/SlowPreviewList.tsx"), "utf8"),
    readFile(path.join(process.cwd(), "app/front-feature/react/deferred-value/components/SlowPreviewRow.tsx"), "utf8"),
    readFile(path.join(process.cwd(), "app/front-feature/react/deferred-value/preview-workload.ts"), "utf8"),
    readFile(path.join(process.cwd(), "app/front-feature/react/deferred-value/constants.ts"), "utf8"),
    readFile(path.join(process.cwd(), "app/front-feature/react/deferred-value/types.ts"), "utf8"),
  ]);
  const shared = [
    `// components/SlowPreviewList.tsx\n${list}`,
    `// components/SlowPreviewRow.tsx\n${row}`,
    `// preview-workload.ts\n${workload}`,
    `// constants.ts\n${constants}`,
    `// types.ts\n${types}`,
  ].join("\n\n");
  return <DeferredValueClientPage
    immediateCode={`// components/ImmediatePreview.tsx\n${immediate}\n\n${shared}`}
    deferredCode={`// components/DeferredPreview.tsx\n${deferred}\n\n${shared}`}
  />;
}
