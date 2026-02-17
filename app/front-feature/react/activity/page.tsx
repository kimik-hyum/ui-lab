import { promises as fs } from "fs";
import path from "path";
import { ActivityClientPage } from "./ActivityClientPage";

export default async function ReactActivityPage() {
  const baseDir = path.join(process.cwd(), "app/front-feature/react/activity/components");
  const traditionalCode = await fs.readFile(path.join(baseDir, "TraditionalHiddenDemo.tsx"), "utf8");
  const activityCode = await fs.readFile(path.join(baseDir, "ActivityHiddenDemo.tsx"), "utf8");

  return <ActivityClientPage traditionalCode={traditionalCode} activityCode={activityCode} />;
}
