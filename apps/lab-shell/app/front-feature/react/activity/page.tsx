import { promises as fs } from "fs";
import path from "path";
import { ActivityClientPage } from "./ActivityClientPage";

export default async function ReactActivityPage() {
  const baseDir = path.join(process.cwd(), "app/front-feature/react/activity");
  const sharedFiles = ["components/ActivityProbe.tsx", "activity-stats.ts", "types.ts"];
  const readSource = async (file: string) => `// ${file}\n${await fs.readFile(path.join(baseDir, file), "utf8")}`;
  const [traditional, activity, ...shared] = await Promise.all([
    readSource("components/TraditionalHiddenDemo.tsx"),
    readSource("components/ActivityHiddenDemo.tsx"),
    ...sharedFiles.map(readSource),
  ]);
  const traditionalCode = [traditional, ...shared].join("\n\n");
  const activityCode = [activity, ...shared].join("\n\n");

  return <ActivityClientPage traditionalCode={traditionalCode} activityCode={activityCode} />;
}
