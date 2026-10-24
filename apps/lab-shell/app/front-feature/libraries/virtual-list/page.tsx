import { promises as fs } from "node:fs";
import path from "node:path";
import virtuosoPackage from "react-virtuoso/package.json";
import { VirtualListClientPage } from "./VirtualListClientPage";

export default async function VirtualListPage() {
  const [mapCode, virtuosoCode] = await Promise.all([
    fs.readFile(path.join(process.cwd(), "app/front-feature/libraries/virtual-list/components/MapListDemo.tsx"), "utf8"),
    fs.readFile(path.join(process.cwd(), "app/front-feature/libraries/virtual-list/components/VirtuosoListDemo.tsx"), "utf8"),
  ]);
  return <VirtualListClientPage mapCode={mapCode} virtuosoCode={virtuosoCode} libraryVersion={virtuosoPackage.version} />;
}
